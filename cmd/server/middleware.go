package main

import (
	"fmt"
	"log"
	"net/http"
	"path"
	"strings"
)

func pathNormalizationMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		originalPath := r.URL.Path

		cleaned := path.Clean(originalPath)
		if cleaned == "." {
			cleaned = "/"
		}

		if !strings.HasPrefix(cleaned, "/") {
			cleaned = "/" + cleaned
		}

		if cleaned != originalPath {
			r.URL.Path = cleaned
		}

		next.ServeHTTP(w, r)
	})
}

func requestSizeLimitMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		r.Body = http.MaxBytesReader(w, r.Body, maxRequestBodySize)
		next.ServeHTTP(w, r)
	})
}

func nonceMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("X-Nonce") == "" {
			nonce, err := generateNonce()
			if err != nil {
				log.Printf("Error generating nonce: %v", err)
				http.Error(w, "Internal Server Error", http.StatusInternalServerError)
				return
			}
			r.Header.Set("X-Nonce", nonce)
		}
		next.ServeHTTP(w, r)
	})
}

func securityHeadersMiddleware(domain string, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		nonce, err := generateNonce()
		if err != nil {
			log.Printf("Error generating nonce: %v", err)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
			return
		}

		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
		csp := fmt.Sprintf("default-src 'self'; script-src 'self' 'nonce-%s' 'unsafe-eval'; style-src 'self' 'nonce-%s' 'unsafe-inline' 'unsafe-hashes'; img-src 'self' data: https://*.quad4.io; connect-src 'self' ws: wss: https://*.quad4.io;", nonce, nonce)
		w.Header().Set("Content-Security-Policy", csp)

		if domain != "" {
			w.Header().Set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload")
		}

		r.Header.Set("X-Nonce", nonce)
		next.ServeHTTP(w, r)
	})
}

func errorHandler(w http.ResponseWriter, r *http.Request, status int, err error, msg string) {
	if err != nil {
		log.Printf("Error handling %s %s: %v", r.Method, r.URL.Path, err)
	}
	http.Error(w, msg, status)
}

func handleError(w http.ResponseWriter, r *http.Request, err error, status int, msg string) error {
	if err == nil {
		return nil
	}
	errorHandler(w, r, status, err, msg)
	return fmt.Errorf("%s: %w", msg, err)
}
