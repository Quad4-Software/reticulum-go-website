package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"io/fs"
	"log"
	"net/http"
	"path/filepath"
	"strings"
	"time"

	"git.quad4.io/websites/reticulum-go/internal/web"
)

type healthChecker struct {
	cache     *web.Cache
	apiBase   string
	repoOwner string
	repoName  string
}

func newHealthChecker(cache *web.Cache, apiBase, repoOwner, repoName string) *healthChecker {
	return &healthChecker{
		cache:     cache,
		apiBase:   apiBase,
		repoOwner: repoOwner,
		repoName:  repoName,
	}
}

func (hc *healthChecker) health(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if !hc.cache.IsHealthy() {
		w.WriteHeader(http.StatusServiceUnavailable)
		json.NewEncoder(w).Encode(map[string]string{ // #nosec G104 - If JSON encoding fails, connection is broken and we can't recover
			"status": "unhealthy",
			"reason": "cache not populated or background refresh stopped",
		})
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"}) // #nosec G104 - If JSON encoding fails, connection is broken and we can't recover
}

func (hc *healthChecker) ready(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	checks := make(map[string]bool)
	checks["cache"] = hc.cache.IsHealthy()

	err := hc.cache.CheckExternalAPI(ctx)
	checks["external_api"] = err == nil

	allHealthy := true
	for _, ok := range checks {
		if !ok {
			allHealthy = false
			break
		}
	}

	if !allHealthy {
		w.WriteHeader(http.StatusServiceUnavailable)
		json.NewEncoder(w).Encode(map[string]interface{}{ // #nosec G104 - If JSON encoding fails, connection is broken and we can't recover
			"status": "not ready",
			"checks": checks,
		})
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{ // #nosec G104 - If JSON encoding fails, connection is broken and we can't recover
		"status": "ready",
		"checks": checks,
	})
}

type apiHandler struct {
	cache *web.Cache
}

func newAPIHandler(cache *web.Cache) *apiHandler {
	return &apiHandler{cache: cache}
}

func (h *apiHandler) repoInfo(w http.ResponseWriter, r *http.Request) error {
	info := h.cache.Get()
	if info == nil {
		return fmt.Errorf("cache not available")
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "public, max-age=300")

	if err := json.NewEncoder(w).Encode(info); err != nil {
		return fmt.Errorf("failed to encode response: %w", err)
	}

	return nil
}

func (h *apiHandler) serveHTTP(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path == "/api/repo-info" {
		if err := h.repoInfo(w, r); err != nil {
			handleError(w, r, err, http.StatusServiceUnavailable, "Service Unavailable") // #nosec G104 - Error handler failure indicates broken connection, nothing we can do
		}
		return
	}

	handleError(w, r, nil, http.StatusNotFound, "Not Found") // #nosec G104 - Error handler failure indicates broken connection, nothing we can do
}

type fileHandler struct {
	distFS fs.FS
}

func newFileHandler(dist fs.FS) (*fileHandler, error) {
	distFS, err := fs.Sub(dist, "dist")
	if err != nil {
		return nil, fmt.Errorf("failed to create sub filesystem: %w", err)
	}
	return &fileHandler{distFS: distFS}, nil
}

func (h *fileHandler) resolvePath(path string) (string, error) {
	cleaned := filepath.Clean(path)
	if cleaned == "." || cleaned == "/" {
		return "index.html", nil
	}
	return strings.TrimPrefix(cleaned, "/"), nil
}

func (h *fileHandler) openFile(path string) (fs.File, string, bool, error) {
	f, err := h.distFS.Open(path)
	if err != nil {
		if filepath.Ext(path) == "" {
			f, err = h.distFS.Open("index.html")
			if err != nil {
				return nil, "", false, fmt.Errorf("failed to open index.html: %w", err)
			}
			return f, "index.html", true, nil
		}
		return nil, "", false, fmt.Errorf("failed to open file %s: %w", path, err)
	}
	return f, path, false, nil
}

func (h *fileHandler) serveFile(w http.ResponseWriter, r *http.Request, path string, nonce string, originalPath string) error {
	f, resolvedPath, wasResolved, err := h.openFile(path)
	if err != nil {
		return err
	}
	defer f.Close()

	stat, err := f.Stat()
	if err != nil {
		return fmt.Errorf("failed to stat file: %w", err)
	}

	cleanedOriginal := filepath.Clean(strings.TrimPrefix(originalPath, "/"))
	pathResolved := wasResolved || resolvedPath != cleanedOriginal || resolvedPath != path

	if stat.IsDir() {
		if err := f.Close(); err != nil {
			log.Printf("Error closing directory: %v", err)
		}
		resolvedPath = filepath.Join(resolvedPath, "index.html")
		f, err = h.distFS.Open(resolvedPath)
		if err != nil {
			f, err = h.distFS.Open("index.html")
			if err != nil {
				return fmt.Errorf("failed to open index.html: %w", err)
			}
			resolvedPath = "index.html"
		}
		defer f.Close()
		stat, err = f.Stat()
		if err != nil {
			return fmt.Errorf("failed to stat index.html: %w", err)
		}
		pathResolved = true
	}

	if filepath.Ext(resolvedPath) == ".wasm" {
		w.Header().Set("Content-Type", "application/wasm")
		if pathResolved {
			content, err := io.ReadAll(f)
			if err != nil {
				return fmt.Errorf("failed to read WASM file: %w", err)
			}
			w.Header().Set("Content-Length", fmt.Sprintf("%d", len(content)))
			w.WriteHeader(http.StatusOK)
			w.Write(content) // #nosec G104 - If write fails, connection is broken and we can't recover
			return nil
		}
		http.ServeContent(w, r, resolvedPath, stat.ModTime(), f.(io.ReadSeeker))
		return nil
	}

	if filepath.Ext(resolvedPath) == ".html" {
		content, err := io.ReadAll(f)
		if err != nil {
			return fmt.Errorf("failed to read HTML file: %w", err)
		}

		contentStr := string(content)
		contentStr = injectNonceIntoHTML(contentStr, nonce)

		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.Header().Set("Content-Length", fmt.Sprintf("%d", len(contentStr)))
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(contentStr)) // #nosec G104 - If write fails, connection is broken and we can't recover
		return nil
	}

	if pathResolved {
		content, err := io.ReadAll(f)
		if err != nil {
			return fmt.Errorf("failed to read file: %w", err)
		}
		w.Header().Set("Content-Length", fmt.Sprintf("%d", len(content)))
		w.WriteHeader(http.StatusOK)
		w.Write(content) // #nosec G104 - If write fails, connection is broken and we can't recover
		return nil
	}

	http.ServeContent(w, r, resolvedPath, stat.ModTime(), f.(io.ReadSeeker))
	return nil
}

func (h *fileHandler) serveHTTP(w http.ResponseWriter, r *http.Request) {
	nonce := r.Header.Get("X-Nonce")
	if nonce == "" {
		handleError(w, r, nil, http.StatusInternalServerError, "Internal Server Error") // #nosec G104 - Error handler failure indicates broken connection, nothing we can do
		return
	}

	originalPath := r.URL.Path
	path, err := h.resolvePath(originalPath)
	if err != nil {
		handleError(w, r, err, http.StatusBadRequest, "Bad Request") // #nosec G104 - Error handler failure indicates broken connection, nothing we can do
		return
	}

	if err := h.serveFile(w, r, path, nonce, originalPath); err != nil {
		if strings.Contains(err.Error(), "failed to open") {
			handleError(w, r, err, http.StatusNotFound, "Not Found") // #nosec G104 - Error handler failure indicates broken connection, nothing we can do
			return
		}
		handleError(w, r, err, http.StatusInternalServerError, "Internal Server Error") // #nosec G104 - Error handler failure indicates broken connection, nothing we can do
	}
}
