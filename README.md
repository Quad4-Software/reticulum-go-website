# Reticulum-Go Website

The official website for the Reticulum-Go project, with documentation and a WebAssembly-based example.

## Self-host the website

### Using Docker

```sh
task docker-build
task docker-run
```

Then open your browser at `http://localhost:3000`

## Development

### Prerequisites

- Node.js
- pnpm

### Nix

Sets up the development environment with the correct dependencies.

```sh
nix develop
```

### Setup

```sh
git clone https://git.quad4.io/Networks/Reticulum-Go
cd Reticulum-Go
task install
task dev
```

### Task

The project uses [Task](https://taskfile.dev/) for all development tasks.

```
| Task            | Description                              |
|-----------------|------------------------------------------|
| dev             | Run Vite development server              |
| validate        | Run all quality checks                   |
| frontend:build  | Build frontend only                      |
| docker-build    | Build Docker image                       |
| docker-run      | Run Docker container                      |
| docs:zip        | Package documentation into ZIP files     |
| clean           | Clean build artifacts                    |
| format          | Format code                              |
| lint            | Run linter                               |
| check           | Run type checking                        |
| audit           | Run pnpm audit                           |
| install         | Install pnpm dependencies                |
| update          | Update pnpm dependencies                 |
| update:latest   | Update pnpm dependencies to latest       |
| outdated        | Show outdated pnpm dependencies          |
```

example: `task dev`
you might want to set alias `alias task='go-task'`

## License

This website is licensed under the [MIT License](LICENSE).
