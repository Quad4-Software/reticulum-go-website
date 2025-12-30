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
- [Task](https://taskfile.dev/) für die Automatisierung des Builds

### Entwicklungsumgebung

Wenn Sie Nix installiert haben, können Sie die Development-Shell verwenden:

```bash
nix develop
```

## Bauen und Ausführen

### Bauen der Binärdatei

```bash
task build
```

Die kompilierte Binärdatei befindet sich unter `bin/reticulum-go`.

### Ausführen der Anwendung

```bash
task run
```

### Ausführen von Tests

```bash
task test
```

## Plattformübergreifende Builds

Build für alle Linux-Architekturen (amd64, arm64, arm, riscv64):

```bash
task build-all
```

Build für spezifische Architekturen:

```bash
task build-linux
```

## Experimentelle Funktionen

Build mit experimentellem Green Tea GC (erfordert Go 1.25+):

```bash
task build-experimental
```
