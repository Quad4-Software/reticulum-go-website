# Usage

Reticulum-Go can be used as a standalone application, integrated into your Go projects, or run in the browser via WebAssembly.

## Getting the Source

Clone the repository to get started:

```bash
git clone https://git.quad4.io/Networks/Reticulum-Go
cd Reticulum-Go
```

## Installation

### Prerequisites

- Go 1.24 or later
- GNU Make (optional but recommended; the repository ships a `Makefile` for common workflows)

## Building and Running

From the repository root, you can use Make or run the underlying `go` commands directly.

### Release binary

```bash
make build
```

Equivalent:

```bash
mkdir -p bin
CGO_ENABLED=0 go build -ldflags="-s -w" -o bin/reticulum-go ./cmd/reticulum-go
```

The compiled binary is written to `bin/reticulum-go`.

### Run from source

```bash
make run
```

Equivalent:

```bash
go run ./cmd/reticulum-go
```

### Tests

```bash
make test
```

Equivalent:

```bash
go test -v ./...
```

## Cross-Platform Builds

### Linux (amd64, arm64, arm, riscv64)

```bash
make build-linux
```

Example for one architecture (others use the same pattern with `GOARCH=arm64`, `arm`, or `riscv64`):

```bash
mkdir -p bin
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o bin/reticulum-go-linux-amd64 ./cmd/reticulum-go
```

### Linux, Windows, and macOS

```bash
make build-all
```

This runs `build-linux`, `build-windows`, and `build-darwin`. Additional targets and variables are defined in the repository `Makefile`.

## Experimental Features

Build with the experimental Green Tea garbage collector (requires a Go toolchain with `GOEXPERIMENT=greenteagc`, typically Go 1.25+):

```bash
mkdir -p bin
GOEXPERIMENT=greenteagc go build -o bin/reticulum-go-experimental ./cmd/reticulum-go
```

Run without writing a binary:

```bash
GOEXPERIMENT=greenteagc go run ./cmd/reticulum-go
```
