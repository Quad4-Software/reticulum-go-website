# Verwendung

Reticulum-Go kann als eigenständige Anwendung verwendet, in Ihre Go-Projekte integriert oder über WebAssembly im Browser ausgeführt werden.

## Quellcode erhalten

Klonen Sie das Repository, um zu beginnen:

```bash
git clone https://git.quad4.io/Networks/Reticulum-Go
cd Reticulum-Go
```

## Installation

### Voraussetzungen

- Go 1.24 oder neuer
- GNU Make (optional, empfohlen; im Repository liegt ein `Makefile` für gängige Schritte)

## Bauen und Ausführen

Vom Repository-Stamm aus können Sie Make nutzen oder die gleichen Schritte direkt mit `go` ausführen.

### Release-Binärdatei

```bash
make build
```

Äquivalent:

```bash
mkdir -p bin
CGO_ENABLED=0 go build -ldflags="-s -w" -o bin/reticulum-go ./cmd/reticulum-go
```

Die Binärdatei liegt unter `bin/reticulum-go`.

### Aus Quelltext starten

```bash
make run
```

Äquivalent:

```bash
go run ./cmd/reticulum-go
```

### Tests

```bash
make test
```

Äquivalent:

```bash
go test -v ./...
```

## Plattformübergreifende Builds

### Linux (amd64, arm64, arm, riscv64)

```bash
make build-linux
```

Beispiel für eine Architektur (für andere `GOARCH` auf `arm64`, `arm` oder `riscv64` setzen):

```bash
mkdir -p bin
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o bin/reticulum-go-linux-amd64 ./cmd/reticulum-go
```

### Linux, Windows und macOS

```bash
make build-all
```

Dieses Target führt `build-linux`, `build-windows` und `build-darwin` aus. Weitere Targets und Variablen stehen im `Makefile` des Repositories.

## Experimentelle Funktionen

Build mit dem experimentellen Green Tea Garbage Collector (Go-Toolchain mit `GOEXPERIMENT=greenteagc`, typischerweise Go 1.25+):

```bash
mkdir -p bin
GOEXPERIMENT=greenteagc go build -o bin/reticulum-go-experimental ./cmd/reticulum-go
```

Direkt ausführen ohne separates Binary:

```bash
GOEXPERIMENT=greenteagc go run ./cmd/reticulum-go
```
