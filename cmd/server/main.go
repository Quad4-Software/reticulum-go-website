// Package main provides a high-performance web server for Reticulum-Go.
// It serves static assets for the Reticulum-Go website, including WASM binaries.
package main

import (
	"context"
	"crypto/rand"
	"embed"
	"encoding/base64"
	"flag"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"os"
	"os/signal"
	"regexp"
	"strings"
	"syscall"
	"time"

	"git.quad4.io/websites/reticulum-go/internal/web"
)

//go:embed all:dist
var frontendDist embed.FS

const (
	defaultHost        = "127.0.0.1"
	defaultPort        = "8080"
	defaultAPIBase     = "https://git.quad4.io/api/v1"
	defaultRepoOwner   = "Networks"
	defaultRepoName    = "Reticulum-Go"
	defaultCacheTTL    = 5 * time.Minute
	maxRequestBodySize = 10 << 20
	maxHeaderBytes     = 1 << 20
	shutdownTimeout    = 30 * time.Second
)

// getEnv retrieves the value of the environment variable named by the key.
// If the variable is not present, it returns the fallback value.
func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}

// generateNonce creates a cryptographically secure random nonce for CSP.
func generateNonce() (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", fmt.Errorf("failed to generate random bytes for nonce: %w", err)
	}
	return base64.StdEncoding.EncodeToString(b), nil
}

// injectNonceIntoHTML adds nonce attributes to inline script and style tags.
func injectNonceIntoHTML(content string, nonce string) string {
	scriptRegex := regexp.MustCompile(`<script(\s+[^>]*)?>`)
	styleRegex := regexp.MustCompile(`<style(\s+[^>]*)?>`)

	content = scriptRegex.ReplaceAllStringFunc(content, func(match string) string {
		if strings.Contains(match, `nonce=`) {
			return match
		}
		if strings.Contains(match, `<script>`) {
			return fmt.Sprintf(`<script nonce="%s">`, nonce)
		}
		return strings.Replace(match, `<script`, fmt.Sprintf(`<script nonce="%s"`, nonce), 1)
	})

	content = styleRegex.ReplaceAllStringFunc(content, func(match string) string {
		if strings.Contains(match, `nonce=`) {
			return match
		}
		if strings.Contains(match, `<style>`) {
			return fmt.Sprintf(`<style nonce="%s">`, nonce)
		}
		return strings.Replace(match, `<style`, fmt.Sprintf(`<style nonce="%s"`, nonce), 1)
	})

	return content
}

func NewHandler(dist fs.FS, domain string, cache *web.Cache, apiBase, repoOwner, repoName string) (http.Handler, error) {
	fileHandler, err := newFileHandler(dist)
	if err != nil {
		return nil, fmt.Errorf("failed to create file handler: %w", err)
	}

	apiHandler := newAPIHandler(cache)
	healthChecker := newHealthChecker(cache, apiBase, repoOwner, repoName)

	mux := http.NewServeMux()

	mux.HandleFunc("/health", healthChecker.health)
	mux.HandleFunc("/ready", healthChecker.ready)
	mux.HandleFunc("/api/", apiHandler.serveHTTP)
	mux.HandleFunc("/", fileHandler.serveHTTP)

	handler := pathNormalizationMiddleware(mux)
	handler = requestSizeLimitMiddleware(handler)
	handler = securityHeadersMiddleware(domain, handler)

	return handler, nil
}

func main() {
	var (
		host      string
		port      string
		domain    string
		apiBase   string
		repoOwner string
		repoName  string
	)

	flag.StringVar(&host, "host", getEnv("HOST", defaultHost), "Host to bind to")
	flag.StringVar(&port, "port", getEnv("PORT", defaultPort), "Port to bind to")
	flag.StringVar(&domain, "domain", getEnv("DOMAIN", ""), "Domain name for security headers")
	flag.StringVar(&apiBase, "api-base", getEnv("API_BASE", defaultAPIBase), "API base URL")
	flag.StringVar(&repoOwner, "repo-owner", getEnv("REPO_OWNER", defaultRepoOwner), "Repository owner")
	flag.StringVar(&repoName, "repo-name", getEnv("REPO_NAME", defaultRepoName), "Repository name")
	flag.Parse()

	addr := fmt.Sprintf("%s:%s", host, port)

	cache := web.NewCache(
		repoOwner,
		repoName,
		apiBase,
		defaultCacheTTL,
	)

	if err := cache.Refresh(); err != nil {
		log.Printf("Warning: Failed to initialize cache: %v", err)
	} else {
		log.Println("Cache initialized successfully")
	}

	cache.StartBackgroundRefresh()

	handler, err := NewHandler(frontendDist, domain, cache, apiBase, repoOwner, repoName)
	if err != nil {
		log.Fatalf("Failed to create handler: %v", err)
	}

	server := &http.Server{
		Addr:              addr,
		Handler:           handler,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      15 * time.Second,
		IdleTimeout:       60 * time.Second,
		MaxHeaderBytes:    maxHeaderBytes,
	}

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)

	go func() {
		log.Printf("Server starting on %s (domain: %s)\n", addr, domain)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server failed: %v", err)
		}
	}()

	sig := <-sigChan
	log.Printf("Received signal: %v. Initiating graceful shutdown...\n", sig)

	cache.Stop()

	shutdownCtx, cancel := context.WithTimeout(context.Background(), shutdownTimeout)
	defer cancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Printf("Error during graceful shutdown: %v\n", err)
		if err := server.Close(); err != nil {
			log.Printf("Error forcing server close: %v\n", err)
		}
	} else {
		log.Println("Server shutdown gracefully")
	}
}
