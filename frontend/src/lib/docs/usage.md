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
- [Task](https://taskfile.dev/) for build automation

### Development Environment

If you have Nix installed, you can use the development shell:

```bash
nix develop
```

## Building and Running

### Building the Binary

```bash
task build
```

The compiled binary will be located in `bin/reticulum-go`.

### Running the Application

```bash
task run
```

### Running Tests

```bash
task test
```

## Cross-Platform Builds

Build for all Linux architectures (amd64, arm64, arm, riscv64):

```bash
task build-all
```

Build for specific architectures:

```bash
task build-linux
```

## Experimental Features

Build with experimental Green Tea GC (requires Go 1.25+):

```bash
task build-experimental
```
