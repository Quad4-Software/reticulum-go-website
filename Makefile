# Reticulum-Go website — GNU Makefile
# Requires: GNU Make, pnpm (via corepack or standalone), Node.js

SHELL := /bin/sh
.DEFAULT_GOAL := help

FRONTEND := frontend

.PHONY: help install dev build frontend-build clean format lint check test bench bundle-budget lighthouse audit update update-latest outdated docker-build docker-run docs-zip docs-release docs-sync check-docs validate locale-template check-links

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

bench: ## Run Vitest micro-benchmarks (hot-path.bench.ts)
	cd $(FRONTEND) && pnpm bench

bundle-budget: ## Enforce frontend/build size limits (run frontend-build first)
	node scripts/bundle-budget.mjs

lighthouse: ## Lighthouse CI against production preview (run frontend-build first)
	cd $(FRONTEND) && pnpm lhci

check-links: ## HTTP-check external URLs in README and frontend/src (requires network)
	node scripts/check-links.mjs

check-docs: ## Validate docs nav, files, and internal /docs/ links
	node scripts/check-docs.mjs

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

docs-zip: ## Package English docs into releases/docs-en.zip
	mkdir -p releases
	cd $(FRONTEND)/src/lib/docs && zip -j ../../../../releases/docs-en.zip *.md

docs-sync: ## Sync English docs from a Reticulum-Go checkout (see scripts/sync-docs.sh)
	sh scripts/sync-docs.sh

docs-release: ## Metadata + docs zips (same as CI docs workflow; needs git SHA when GITHUB_OUTPUT is set)
	sh scripts/docs/prepare-release-docs.sh

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
