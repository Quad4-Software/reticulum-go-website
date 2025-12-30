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
- [Task](https://taskfile.dev/) per l'automazione del build

### Ambiente di Sviluppo

Se hai installato Nix, puoi usare la development shell:

```bash
nix develop
```

## Build ed Esecuzione

### Compilazione del Binario

```bash
task build
```

Il binario compilato si troverà in `bin/reticulum-go`.

### Esecuzione dell'Applicazione

```bash
task run
```

### Esecuzione dei Test

```bash
task test
```

## Build Cross-Platform

Build per tutte le architetture Linux (amd64, arm64, arm, riscv64):

```bash
task build-all
```

Build per architetture specifiche:

```bash
task build-linux
```

## Funzionalità Sperimentali

Build con GC sperimentale Green Tea (richiede Go 1.25+):

```bash
task build-experimental
```
