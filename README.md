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

- Node.js v23
- [pnpm](https://pnpm.io/) v10

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
| `locale-template`| New UI locale file (see below)       |

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
