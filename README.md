# Reticulum-Go Website

The official website for the Reticulum-Go project, with documentation and a WebAssembly-based example.

## Self-host the website

### Using Docker

```sh
git clone https://git.quad4.io/websites/reticulum-go
cd reticulum-go
docker build -f Dockerfile -t reticulum-web .
docker run -p 3000:3000 reticulum-web
```

Then open your browser at `http://localhost:3000`

## Development

### Prerequisites

- Node.js v24
- [pnpm](https://pnpm.io/) 10.32.1

### Setup

From the repository root:

```sh
git clone https://git.quad4.io/websites/reticulum-go
cd reticulum-go
make install
make dev
```

Dependencies are installed under `frontend/` with pnpm. You can run pnpm directly there for ad hoc commands, for example:

```sh
cd frontend
pnpm install
pnpm dev
pnpm run check
pnpm test
pnpm audit
```

### Make

The project uses a root `Makefile` for common tasks. Run `make help` to list targets.

| Target           | Description                          |
|------------------|--------------------------------------|
| `install`        | `pnpm install` in `frontend/`        |
| `dev`            | Vite dev server                      |
| `frontend-build` | Production build                     |
| `validate`       | format, lint, check, test, audit     |
| `format`         | Prettier                             |
| `lint`           | ESLint                               |
| `check`          | `svelte-check` / TypeScript          |
| `test`           | Vitest (unit and route tests)        |
| `audit`          | `pnpm audit`                         |
| `update`         | `pnpm update`                        |
| `update-latest`  | `pnpm update --latest`               |
| `outdated`       | `pnpm outdated`                      |
| `clean`          | Remove `frontend/build`              |
| `docker-build`   | Build container image                |
| `docker-run`     | Run container on port 3000           |
| `docs-zip`       | Zip per-locale docs into `releases/` |
| `docs-release`   | Same as docs workflow prep (see below) |
| `locale-template`| New UI locale file (see below)       |
| `check-links`    | Probe external URLs (see Testing)    |
| `bench`          | Vitest micro-benchmarks (see below)   |
| `bundle-budget`  | Size limits on `frontend/build`       |

### CI and release automation

Workflows live under `.gitea/workflows/`. **Checkout** is an inline step: clone `${SERVER}/${REPO}.git` into the workspace, then `git checkout` the commit SHA, using `GITEA_*` / `GITHUB_*` env from the runner (`github.server_url`, `github.repository`, `github.sha`, `github.token`, optional `secrets.GITEA_TOKEN`). **Attaching assets to a Gitea release** still uses the pinned `gitea-release-action` (docs zip and SBOM jobs).

Toolchain setup is implemented as POSIX shell under `scripts/ci/` so downloads are pinned and verified where noted:

- `setup-node.sh` installs Node from nodejs.org `latest-v{N}.x` with SHA256 verification (default major **24**; pass a different major as the first argument).
- `setup-pnpm.sh` enables corepack and activates pnpm (version defaults to match `frontend/package.json` `packageManager`).
- `setup-trivy.sh` installs a `.deb` from `TRIVY_DEB_URL` with optional `TRIVY_DEB_SHA256`.
- `ci-node-path.sh` exports `/usr/local/bin` on `PATH`.

**Docs release:** On version tags, the Release Docs workflow runs `scripts/docs/prepare-release-docs.sh`, which writes optional commit metadata to `GITHUB_OUTPUT` when the runner provides it, then runs `make docs-zip`. Locally you can run `make docs-zip` or `make docs-release` (metadata step is skipped without `GITHUB_OUTPUT`).

`frontend/.npmrc` sets `engine-strict=false` so pnpm accepts Node 24 even when a dependency declares a narrower `engines` range.

If pnpm reports `ERR_PNPM_UNEXPECTED_STORE`, your `frontend/node_modules` was linked from another machine or store path. Remove it and reinstall: `rm -rf frontend/node_modules` then `cd frontend && pnpm install`.

### Testing

Unit and route tests use Vitest with jsdom (`make test` or `cd frontend && pnpm test`). Coverage: `cd frontend && pnpm test:coverage` (output under `frontend/coverage/`, gitignored).

The `/api/repo-info` handler is covered for Gitea `fetch` outcomes (network failure, non-OK responses, empty tags, JSON errors, cache TTL, and `Cache-Control` headers). Upstream calls use a 15s `AbortSignal` timeout.

**Link rot:** `make check-links` runs `scripts/check-links.mjs`, which scans `README.md`, `LICENSE`, and `frontend/src/**` for `http(s)` URLs and requests them (HEAD, with GET fallback). Add substring patterns to `scripts/link-check-ignore.txt` to skip URLs that are not meant to be probed. URLs containing `{` or `}` are skipped (Svelte interpolations).

### Performance and bundle size

**Micro-benchmarks:** `make bench` (or `cd frontend && pnpm bench`) runs Vitest’s benchmark mode on `src/lib/hot-path.bench.ts` (pure helpers in `version.ts`, `seo.ts`, `site-config.ts`). CI runs this after unit tests. Benchmarks are experimental in Vitest; pin the Vitest version if you rely on them.

**Bundle budget:** After a production build, `make bundle-budget` runs `scripts/bundle-budget.mjs` against `frontend/build/`. Defaults: total output under **28 MB** (`BUNDLE_BUDGET_TOTAL_MB`) and any single **.js** file under **12 MB** (`BUNDLE_BUDGET_MAX_JS_MB`), uncompressed. Raise these in CI only when intentional. The build job runs the budget check after `frontend-build`.

### Translations (i18n)

UI strings live in `frontend/src/lib/i18n/locales/*.json` (nested JSON, same keys as `en.json`).

**Add a new language**

1. Generate a copy of the English catalog for your language code (ISO 639-1, e.g. `fr`):

   ```sh
   make locale-template LANG=fr
   ```

   Or without Make:

   ```sh
   ./scripts/new-locale.sh fr
   ```

2. Edit `frontend/src/lib/i18n/locales/fr.json` and translate the values (keep keys and structure unchanged).

3. Register the locale in `frontend/src/lib/site-config.ts`:

   - Append the code to the `LOCALES` array (order controls listing where relevant).
   - Add a human-readable label in `LOCALE_LABELS` (used in the language menu).

4. Run `make check` and fix any issues.

**Update an existing language**

Edit the corresponding `frontend/src/lib/i18n/locales/<code>.json`. When English changes, compare against `en.json` and add any missing keys so catalogs stay aligned.

**Docs in multiple languages** (Markdown under `frontend/src/lib/docs/`) are separate from UI JSON; add or update `*.md` / `*.<lang>.md` files as needed for documentation content.

## License

This website is licensed under the [0BSD License](LICENSE).

The [Reticulum-Go](https://git.quad4.io/Networks/Reticulum-Go) implementation is licensed under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0).
