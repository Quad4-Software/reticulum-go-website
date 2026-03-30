# Utilizzo

Reticulum-Go può essere utilizzato come applicazione standalone, integrato nei tuoi progetti Go, o eseguito nel browser tramite WebAssembly.

## Ottenere il Codice Sorgente

Clona il repository per iniziare:

```bash
git clone https://git.quad4.io/Networks/Reticulum-Go
cd Reticulum-Go
```

## Installazione

### Prerequisiti

- Go 1.24 o successivo
- GNU Make (opzionale ma consigliato; nel repository c'è un `Makefile` per i flussi comuni)

## Build ed Esecuzione

Dalla radice del repository puoi usare Make oppure i comandi `go` sottostanti.

### Binario di release

```bash
make build
```

Equivalente:

```bash
mkdir -p bin
CGO_ENABLED=0 go build -ldflags="-s -w" -o bin/reticulum-go ./cmd/reticulum-go
```

Il binario si trova in `bin/reticulum-go`.

### Esecuzione dai sorgenti

```bash
make run
```

Equivalente:

```bash
go run ./cmd/reticulum-go
```

### Test

```bash
make test
```

Equivalente:

```bash
go test -v ./...
```

## Build Cross-Platform

### Linux (amd64, arm64, arm, riscv64)

```bash
make build-linux
```

Esempio per un'architettura (per le altre usa `GOARCH=arm64`, `arm` o `riscv64`):

```bash
mkdir -p bin
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o bin/reticulum-go-linux-amd64 ./cmd/reticulum-go
```

### Linux, Windows e macOS

```bash
make build-all
```

Questo target esegue `build-linux`, `build-windows` e `build-darwin`. Altri target e variabili sono definiti nel `Makefile` del repository.

## Funzionalità Sperimentali

Build con il garbage collector sperimentale Green Tea (serve una toolchain Go con `GOEXPERIMENT=greenteagc`, di solito Go 1.25+):

```bash
mkdir -p bin
GOEXPERIMENT=greenteagc go build -o bin/reticulum-go-experimental ./cmd/reticulum-go
```

Esecuzione senza binario separato:

```bash
GOEXPERIMENT=greenteagc go run ./cmd/reticulum-go
```
