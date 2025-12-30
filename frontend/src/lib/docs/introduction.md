# Introduction

Reticulum-Go is a high-performance Go implementation of the [Reticulum Network Stack](https://github.com/markqvist/Reticulum). This project provides a complete Go-based implementation with seamless WebAssembly support for browsers.

## Project Goals

- **Full Protocol Compatibility**: Maintain complete interoperability with the Python reference implementation.
- **Cross-Platform Support**: Support for legacy and modern platforms across multiple architectures.
- **Performance**: Leverage Go's concurrency model and runtime for improved throughput and latency.
- **More Privacy and Security**: Additional privacy and security features beyond the base specification.

## Features

- **High Performance**: Built with Go for maximum performance and efficiency.
- **WASM Support**: Full support for running Reticulum directly in the browser via WebAssembly.
- **Experimental GC**: Support for the experimental Green Tea Garbage Collector for performance evaluation.

## Supported Protocols & Features

The Go implementation provides robust support for core Reticulum features:

- **Identity & Cryptography**: Ed25519, Curve25519, AES-256-CBC, HMAC-SHA256, and HKDF.
- **Interfaces**: TCP/UDP, WebSocket, and many other interface types.
- **Transport & Routing**: Full support for transport layers, pathfinding, and link establishment.
- **Channels & Buffers**: Efficient data handling via dedicated channel and buffer implementations.
- **Resources**: Support for resource advertisements and efficient data transfers.

## Getting Started

To get started with using Reticulum-Go, check out the [Usage](/docs/usage) section.
