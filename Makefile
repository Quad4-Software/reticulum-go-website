# Reticulum-Go website — GNU Makefile
# Requires: GNU Make, pnpm (via corepack or standalone), Node.js

SHELL := /bin/sh
.DEFAULT_GOAL := help

FRONTEND := frontend

.PHONY: help install dev build frontend-build clean format lint check test audit update update-latest outdated docker-build docker-run docs-zip validate locale-template check-links

help: ## Show available targets
	@echo 'Targets (run from repository root):'
	@echo ''
	@grep -E '^[a-zA-Z0-9_.-]+:.*?## ' "$(firstword $(MAKEFILE_LIST))" | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-18s %s\n", $$1, $$2}'

install: ## Install frontend dependencies (pnpm install in frontend/)
	cd $(FRONTEND) && pnpm install

dev: ## Run Vite development server
	cd $(FRONTEND) && pnpm dev

build: frontend-build ## Build the static site (alias for frontend-build)

frontend-build: ## Build frontend (production)
	cd $(FRONTEND) && pnpm install && pnpm build

clean: ## Remove frontend build output
	rm -rf $(FRONTEND)/build

format: ## Format frontend sources with Prettier
	cd $(FRONTEND) && pnpm exec prettier --write .

lint: ## Run ESLint in frontend/
	cd $(FRONTEND) && pnpm exec eslint .

check: ## Typecheck and Svelte check
	cd $(FRONTEND) && pnpm run check

test: ## Run Vitest unit tests
	cd $(FRONTEND) && pnpm test

check-links: ## HTTP-check external URLs in README and frontend/src (requires network)
	node scripts/check-links.mjs

audit: ## Run pnpm audit in frontend/
	cd $(FRONTEND) && pnpm audit

update: ## Update pnpm dependencies within semver ranges
	cd $(FRONTEND) && pnpm update

update-latest: ## Update pnpm dependencies to latest
	cd $(FRONTEND) && pnpm update --latest

outdated: ## List outdated pnpm dependencies
	cd $(FRONTEND) && pnpm outdated

docker-build: ## Build Docker image (reticulum-web)
	docker build -f Dockerfile -t reticulum-web .

docker-run: ## Run Docker container on port 3000
	docker run -p 3000:3000 reticulum-web

docs-zip: ## Package per-locale docs into releases/*.zip
	mkdir -p releases
	zip -j releases/docs-en.zip $(FRONTEND)/src/lib/docs/introduction.md $(FRONTEND)/src/lib/docs/usage.md
	zip -j releases/docs-ru.zip $(FRONTEND)/src/lib/docs/introduction.ru.md $(FRONTEND)/src/lib/docs/usage.ru.md
	zip -j releases/docs-de.zip $(FRONTEND)/src/lib/docs/introduction.de.md $(FRONTEND)/src/lib/docs/usage.de.md
	zip -j releases/docs-it.zip $(FRONTEND)/src/lib/docs/introduction.it.md $(FRONTEND)/src/lib/docs/usage.it.md

validate: ## Run format, lint, check, test, and audit
	$(MAKE) format
	$(MAKE) lint
	$(MAKE) check
	$(MAKE) test
	$(MAKE) audit

locale-template: ## Copy English strings to a new locale file (use: make locale-template LANG=fr)
	@test -n "$(LANG)" || (echo 'Usage: make locale-template LANG=<code>'; echo 'Example: make locale-template LANG=fr'; exit 1)
	cp "$(FRONTEND)/src/lib/i18n/locales/en.json" "$(FRONTEND)/src/lib/i18n/locales/$(LANG).json"
	@echo "Created $(FRONTEND)/src/lib/i18n/locales/$(LANG).json"
	@echo "Next: add '$(LANG)' to LOCALES and LOCALE_LABELS in $(FRONTEND)/src/lib/site-config.ts"
