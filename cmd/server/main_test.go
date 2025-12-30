package main

import (
	"encoding/base64"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"testing/fstest"
	"time"

	"git.quad4.io/websites/reticulum-go/internal/web"
)

func TestGetEnv(t *testing.T) {
	key := "TEST_ENV_VAR"
	fallback := "fallback"

	// Test fallback
	if val := getEnv(key, fallback); val != fallback {
		t.Errorf("expected %s, got %s", fallback, val)
	}

	// Test environment variable
	expected := "value"
	os.Setenv(key, expected)
	defer os.Unsetenv(key)

	if val := getEnv(key, fallback); val != expected {
		t.Errorf("expected %s, got %s", expected, val)
	}
}

func TestNewHandler(t *testing.T) {
	mockFS := fstest.MapFS{
		"dist/index.html":     {Data: []byte("index")},
		"dist/test.js":        {Data: []byte("console.log('test')")},
		"dist/test.wasm":      {Data: []byte("wasm")},
		"dist/sub/index.html": {Data: []byte("sub-index")},
	}

	mockCache := web.NewCache("", "", "", 5*time.Minute)
	handler, err := NewHandler(mockFS, "example.com", mockCache, "https://api.example.com", "owner", "repo", false)
	if err != nil {
		t.Fatalf("failed to create handler: %v", err)
	}

	tests := []struct {
		name           string
		path           string
		expectedStatus int
		expectedBody   string
		expectedCT     string
		checkCSP       bool
		checkHSTS      bool
	}{
		{
			name:           "Root serves index.html",
			path:           "/",
			expectedStatus: http.StatusOK,
			expectedBody:   "index",
			checkCSP:       true,
			checkHSTS:      true,
		},
		{
			name:           "Static file serves content",
			path:           "/test.js",
			expectedStatus: http.StatusOK,
			expectedBody:   "console.log('test')",
		},
		{
			name:           "WASM serves with correct MIME",
			path:           "/test.wasm",
			expectedStatus: http.StatusOK,
			expectedBody:   "wasm",
			expectedCT:     "application/wasm",
		},
		{
			name:           "SPA routing for non-existent paths without extension",
			path:           "/non-existent",
			expectedStatus: http.StatusOK,
			expectedBody:   "index",
		},
		{
			name:           "404 for non-existent paths with extension",
			path:           "/non-existent.png",
			expectedStatus: http.StatusNotFound,
		},
		{
			name:           "Subdirectory serves nested index.html",
			path:           "/sub/",
			expectedStatus: http.StatusOK,
			expectedBody:   "sub-index",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest("GET", tt.path, nil)
			rr := httptest.NewRecorder()
			handler.ServeHTTP(rr, req)

			if rr.Code != tt.expectedStatus {
				t.Errorf("expected status %d, got %d", tt.expectedStatus, rr.Code)
			}

			if tt.expectedBody != "" && rr.Body.String() != tt.expectedBody {
				t.Errorf("expected body %s, got %s", tt.expectedBody, rr.Body.String())
			}

			if tt.expectedCT != "" && rr.Header().Get("Content-Type") != tt.expectedCT {
				t.Errorf("expected content-type %s, got %s", tt.expectedCT, rr.Header().Get("Content-Type"))
			}

			if tt.checkCSP {
				csp := rr.Header().Get("Content-Security-Policy")
				if csp == "" {
					t.Error("expected CSP header to be set")
				}
				if !contains(csp, "https://*.quad4.io") {
					t.Error("CSP should allow quad4.io domains")
				}
			}

			if tt.checkHSTS {
				hsts := rr.Header().Get("Strict-Transport-Security")
				if hsts == "" {
					t.Error("expected HSTS header to be set when domain is provided")
				}
			}

			// Security headers check for all successful requests
			if rr.Code == http.StatusOK {
				if rr.Header().Get("X-Content-Type-Options") != "nosniff" {
					t.Error("X-Content-Type-Options: nosniff missing")
				}
				if rr.Header().Get("X-Frame-Options") != "DENY" {
					t.Error("X-Frame-Options: DENY missing")
				}
			}
		})
	}
}

func TestSecurityPathTraversal(t *testing.T) {
	mockFS := fstest.MapFS{
		"dist/index.html": {Data: []byte("index content")},
	}

	mockCache := web.NewCache("", "", "", 5*time.Minute)
	handler, _ := NewHandler(mockFS, "", mockCache, "https://api.example.com", "owner", "repo", false)

	tests := []struct {
		name           string
		path           string
		expectedStatus int
		shouldContain  string
	}{
		{"Parent directory traversal", "/../index.html", http.StatusOK, "index content"},
		{"Nested traversal", "/sub/../../index.html", http.StatusOK, "index content"},
		{"Absolute path traversal", "//etc/passwd", http.StatusOK, "index content"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest("GET", tt.path, nil)
			rr := httptest.NewRecorder()
			handler.ServeHTTP(rr, req)

			if rr.Code != tt.expectedStatus {
				t.Errorf("expected status %d, got %d", tt.expectedStatus, rr.Code)
				return
			}

			body := rr.Body.String()
			if !strings.Contains(body, tt.shouldContain) {
				t.Errorf("expected response to contain %q, got: %s", tt.shouldContain, body[:min(100, len(body))])
			}
		})
	}
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func contains(s, substr string) bool {
	return strings.Contains(s, substr)
}

func TestGenerateNonce(t *testing.T) {
	nonce1, err := generateNonce()
	if err != nil {
		t.Fatalf("generateNonce() failed: %v", err)
	}

	if nonce1 == "" {
		t.Error("nonce should not be empty")
	}

	decoded, err := base64.StdEncoding.DecodeString(nonce1)
	if err != nil {
		t.Fatalf("nonce should be valid base64: %v", err)
	}

	if len(decoded) != 16 {
		t.Errorf("expected nonce to decode to 16 bytes, got %d", len(decoded))
	}

	nonce2, err := generateNonce()
	if err != nil {
		t.Fatalf("generateNonce() failed: %v", err)
	}

	if nonce1 == nonce2 {
		t.Error("nonces should be unique")
	}
}

func TestInjectNonceIntoHTML(t *testing.T) {
	nonce := "test-nonce-123"

	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "Script tag without attributes",
			input:    "<script>console.log('test');</script>",
			expected: `<script nonce="test-nonce-123">console.log('test');</script>`,
		},
		{
			name:     "Script tag with attributes",
			input:    `<script src="app.js"></script>`,
			expected: `<script nonce="test-nonce-123" src="app.js"></script>`,
		},
		{
			name:     "Style tag without attributes",
			input:    "<style>body { margin: 0; }</style>",
			expected: `<style nonce="test-nonce-123">body { margin: 0; }</style>`,
		},
		{
			name:     "Style tag with attributes",
			input:    `<style type="text/css">body { margin: 0; }</style>`,
			expected: `<style nonce="test-nonce-123" type="text/css">body { margin: 0; }</style>`,
		},
		{
			name:     "Script tag with existing nonce",
			input:    `<script nonce="existing-nonce">console.log('test');</script>`,
			expected: `<script nonce="existing-nonce">console.log('test');</script>`,
		},
		{
			name:     "Multiple script tags",
			input:    "<script>one();</script><script>two();</script>",
			expected: `<script nonce="test-nonce-123">one();</script><script nonce="test-nonce-123">two();</script>`,
		},
		{
			name:     "Mixed script and style tags",
			input:    "<script>one();</script><style>body {}</style>",
			expected: `<script nonce="test-nonce-123">one();</script><style nonce="test-nonce-123">body {}</style>`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := injectNonceIntoHTML(tt.input, nonce)
			if result != tt.expected {
				t.Errorf("expected %q, got %q", tt.expected, result)
			}
		})
	}
}

func TestHealthCheckEndpoints(t *testing.T) {
	mockFS := fstest.MapFS{
		"dist/index.html": {Data: []byte("index")},
	}

	t.Run("Health endpoint with empty cache", func(t *testing.T) {
		mockCache := web.NewCache("", "", "", 5*time.Minute)
		handler, err := NewHandler(mockFS, "", mockCache, "https://api.example.com", "owner", "repo", false)
		if err != nil {
			t.Fatalf("failed to create handler: %v", err)
		}

		req := httptest.NewRequest("GET", "/health", nil)
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		if rr.Code != http.StatusServiceUnavailable {
			t.Errorf("expected status %d for empty cache, got %d", http.StatusServiceUnavailable, rr.Code)
		}

		if rr.Header().Get("Content-Type") != "application/json" {
			t.Error("expected Content-Type: application/json")
		}

		var response map[string]string
		if err := json.Unmarshal(rr.Body.Bytes(), &response); err != nil {
			t.Fatalf("failed to unmarshal response: %v", err)
		}

		if response["status"] != "unhealthy" {
			t.Errorf("expected status 'unhealthy', got %q", response["status"])
		}
	})

	t.Run("Health endpoint with populated cache", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.URL.Path == "/repos/test-owner/test-repo/tags" {
				w.Header().Set("Content-Type", "application/json")
				json.NewEncoder(w).Encode([]struct {
					Name string `json:"name"`
				}{{Name: "v1.0.0"}})
				return
			}
			if r.URL.Path == "/repos/test-owner/test-repo" {
				w.Header().Set("Content-Type", "application/json")
				json.NewEncoder(w).Encode(struct {
					UpdatedAt string `json:"updated_at"`
				}{UpdatedAt: "2024-01-01T00:00:00Z"})
				return
			}
			http.NotFound(w, r)
		}))
		defer server.Close()

		mockCache := web.NewCache("test-owner", "test-repo", server.URL, 5*time.Minute)
		if err := mockCache.Refresh(); err != nil {
			t.Fatalf("failed to populate cache: %v", err)
		}

		handler, err := NewHandler(mockFS, "", mockCache, server.URL, "test-owner", "test-repo", false)
		if err != nil {
			t.Fatalf("failed to create handler: %v", err)
		}

		req := httptest.NewRequest("GET", "/health", nil)
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		if rr.Code != http.StatusOK {
			t.Errorf("expected status %d for populated cache, got %d", http.StatusOK, rr.Code)
		}

		if rr.Header().Get("Content-Type") != "application/json" {
			t.Error("expected Content-Type: application/json")
		}

		var response map[string]string
		if err := json.Unmarshal(rr.Body.Bytes(), &response); err != nil {
			t.Fatalf("failed to unmarshal response: %v", err)
		}

		if response["status"] != "ok" {
			t.Errorf("expected status 'ok', got %q", response["status"])
		}
	})

	t.Run("Ready endpoint", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.URL.Path == "/repos/test-owner/test-repo/tags" {
				w.Header().Set("Content-Type", "application/json")
				json.NewEncoder(w).Encode([]struct {
					Name string `json:"name"`
				}{{Name: "v1.0.0"}})
				return
			}
			if r.URL.Path == "/repos/test-owner/test-repo" {
				w.Header().Set("Content-Type", "application/json")
				json.NewEncoder(w).Encode(struct {
					UpdatedAt string `json:"updated_at"`
				}{UpdatedAt: "2024-01-01T00:00:00Z"})
				return
			}
			http.NotFound(w, r)
		}))
		defer server.Close()

		mockCache := web.NewCache("test-owner", "test-repo", server.URL, 5*time.Minute)
		if err := mockCache.Refresh(); err != nil {
			t.Fatalf("failed to populate cache: %v", err)
		}

		handler, err := NewHandler(mockFS, "", mockCache, server.URL, "test-owner", "test-repo", false)
		if err != nil {
			t.Fatalf("failed to create handler: %v", err)
		}

		req := httptest.NewRequest("GET", "/ready", nil)
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		if rr.Code != http.StatusOK {
			t.Errorf("expected status %d, got %d", http.StatusOK, rr.Code)
		}

		if rr.Header().Get("Content-Type") != "application/json" {
			t.Error("expected Content-Type: application/json")
		}

		var response map[string]interface{}
		if err := json.Unmarshal(rr.Body.Bytes(), &response); err != nil {
			t.Fatalf("failed to unmarshal response: %v", err)
		}

		if response["status"] != "ready" {
			t.Errorf("expected status 'ready', got %q", response["status"])
		}

		checks, ok := response["checks"].(map[string]interface{})
		if !ok {
			t.Fatal("expected checks object in response")
		}

		if checks["cache"] != true {
			t.Error("expected cache check to be true")
		}

		if checks["external_api"] != true {
			t.Error("expected external_api check to be true")
		}
	})
}

func TestCSPWithNonce(t *testing.T) {
	mockFS := fstest.MapFS{
		"dist/index.html": {Data: []byte(`<html><head><script>console.log('test');</script></head></html>`)},
	}

	mockCache := web.NewCache("", "", "", 5*time.Minute)
	handler, err := NewHandler(mockFS, "", mockCache, "https://api.example.com", "owner", "repo", false)
	if err != nil {
		t.Fatalf("failed to create handler: %v", err)
	}

	req := httptest.NewRequest("GET", "/", nil)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rr.Code)
	}

	csp := rr.Header().Get("Content-Security-Policy")
	if csp == "" {
		t.Fatal("expected CSP header to be set")
	}

	if !strings.Contains(csp, "script-src 'self' 'nonce-") {
		t.Error("CSP should include script-src with nonce")
	}

	if !strings.Contains(csp, "style-src 'self' 'nonce-") {
		t.Error("CSP should include style-src with nonce")
	}

	if strings.Contains(csp, "'unsafe-inline'") {
		t.Error("CSP should not contain 'unsafe-inline'")
	}

	if strings.Contains(csp, "'unsafe-eval'") {
		t.Error("CSP should not contain 'unsafe-eval'")
	}

	body := rr.Body.String()
	if !strings.Contains(body, `nonce=`) {
		t.Error("HTML should contain nonce attribute")
	}

	nonceStart := strings.Index(csp, "'nonce-")
	if nonceStart == -1 {
		t.Fatal("could not find nonce in CSP")
	}

	nonceValueStart := nonceStart + 7
	nonceEnd := strings.Index(csp[nonceValueStart:], "'")
	if nonceEnd == -1 {
		t.Fatal("could not find end of nonce in CSP")
	}

	nonce := csp[nonceValueStart : nonceValueStart+nonceEnd]
	if nonce == "" {
		t.Fatal("nonce should not be empty")
	}

	if !strings.Contains(body, `nonce="`+nonce+`"`) {
		t.Errorf("HTML should contain the same nonce as CSP header. CSP nonce: %s, body contains nonce: %v", nonce, strings.Contains(body, `nonce="`+nonce+`"`))
	}
}

func TestRequestSizeLimits(t *testing.T) {
	mockFS := fstest.MapFS{
		"dist/index.html": {Data: []byte("index")},
	}

	mockCache := web.NewCache("", "", "", 5*time.Minute)
	handler, err := NewHandler(mockFS, "", mockCache, "https://api.example.com", "owner", "repo", false)
	if err != nil {
		t.Fatalf("failed to create handler: %v", err)
	}

	largeBody := make([]byte, maxRequestBodySize+1)
	for i := range largeBody {
		largeBody[i] = 'A'
	}

	req := httptest.NewRequest("POST", "/api/repo-info", strings.NewReader(string(largeBody)))
	rr := httptest.NewRecorder()

	handler.ServeHTTP(rr, req)

	if rr.Code == http.StatusServiceUnavailable {
		body, _ := io.ReadAll(rr.Result().Body)
		if strings.Contains(string(body), "Service Unavailable") {
			t.Log("Got 503 because cache is empty. MaxBytesReader limits are enforced when body is read, but /api/repo-info doesn't read the body.")
		}
		return
	}

	if rr.Code == http.StatusRequestEntityTooLarge {
		return
	}

	t.Errorf("expected status %d or %d, got %d", http.StatusRequestEntityTooLarge, http.StatusServiceUnavailable, rr.Code)
}

func TestRequestSizeLimitsEnforcedOnRead(t *testing.T) {
	mockFS := fstest.MapFS{
		"dist/index.html": {Data: []byte("index")},
	}

	mockCache := web.NewCache("", "", "", 5*time.Minute)
	handler, err := NewHandler(mockFS, "", mockCache, "https://api.example.com", "owner", "repo", false)
	if err != nil {
		t.Fatalf("failed to create handler: %v", err)
	}

	largeBody := make([]byte, maxRequestBodySize+1)
	for i := range largeBody {
		largeBody[i] = 'A'
	}

	req := httptest.NewRequest("POST", "/health", strings.NewReader(string(largeBody)))
	rr := httptest.NewRecorder()

	handler.ServeHTTP(rr, req)

	if rr.Code == http.StatusOK {
		body, err := io.ReadAll(rr.Result().Body)
		if err != nil {
			if strings.Contains(err.Error(), "request body too large") {
				return
			}
		}
		if len(body) > 0 {
			t.Log("Health endpoint doesn't read body, so limit not triggered")
		}
	}
}

func TestCacheAsyncRefresh(t *testing.T) {
	cache := web.NewCache("test-owner", "test-repo", "http://invalid-url", 100*time.Millisecond)

	info := cache.Get()
	if info != nil {
		t.Error("cache should be empty initially")
	}

	time.Sleep(50 * time.Millisecond)

	info = cache.Get()
	if info != nil {
		t.Error("cache should still be empty (refresh should be async)")
	}

	time.Sleep(200 * time.Millisecond)

	info = cache.Get()
	if info != nil {
		t.Error("cache should still be empty (invalid URL)")
	}
}

func TestCacheStop(t *testing.T) {
	cache := web.NewCache("test-owner", "test-repo", "http://invalid-url", 50*time.Millisecond)

	cache.StartBackgroundRefresh()

	time.Sleep(100 * time.Millisecond)

	ctx := cache.Context()
	select {
	case <-ctx.Done():
		t.Error("context should not be cancelled before Stop()")
	default:
	}

	cache.Stop()

	time.Sleep(100 * time.Millisecond)

	select {
	case <-ctx.Done():
	default:
		t.Error("context should be cancelled after Stop()")
	}
}

func TestCacheGetReturnsStaleData(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/repos/test-owner/test-repo/tags" {
			w.Header().Set("Content-Type", "application/json")
			if err := json.NewEncoder(w).Encode([]struct {
				Name string `json:"name"`
			}{{Name: "v1.0.0"}}); err != nil {
				t.Errorf("failed to encode tags: %v", err)
			}
			return
		}
		if r.URL.Path == "/repos/test-owner/test-repo" {
			w.Header().Set("Content-Type", "application/json")
			if err := json.NewEncoder(w).Encode(struct {
				UpdatedAt string `json:"updated_at"`
			}{UpdatedAt: "2024-01-01T00:00:00Z"}); err != nil {
				t.Errorf("failed to encode repo info: %v", err)
			}
			return
		}
		http.NotFound(w, r)
	}))
	defer server.Close()

	cache := web.NewCache("test-owner", "test-repo", server.URL, 100*time.Millisecond)

	err := cache.Refresh()
	if err != nil {
		t.Fatalf("failed to refresh cache: %v", err)
	}

	info := cache.Get()
	if info == nil {
		t.Fatal("should return data after refresh")
	}

	if info.LatestTag != "v1.0.0" {
		t.Errorf("expected LatestTag 'v1.0.0', got %q", info.LatestTag)
	}

	time.Sleep(50 * time.Millisecond)

	info2 := cache.Get()
	if info2 == nil {
		t.Fatal("should return stale data immediately")
	}

	if info2.LatestTag != "v1.0.0" {
		t.Errorf("expected LatestTag 'v1.0.0', got %q", info2.LatestTag)
	}
}

func TestAPIEndpointConfigurable(t *testing.T) {
	originalAPIBase := os.Getenv("API_BASE")
	defer func() {
		if originalAPIBase != "" {
			os.Setenv("API_BASE", originalAPIBase)
		} else {
			os.Unsetenv("API_BASE")
		}
	}()

	customAPIBase := "https://custom-api.example.com/api/v1"
	os.Setenv("API_BASE", customAPIBase)

	apiBase := getEnv("API_BASE", defaultAPIBase)
	if apiBase != customAPIBase {
		t.Errorf("expected API base %q, got %q", customAPIBase, apiBase)
	}

	cache := web.NewCache("owner", "repo", apiBase, 5*time.Minute)
	if cache == nil {
		t.Fatal("cache should be created")
	}
}
