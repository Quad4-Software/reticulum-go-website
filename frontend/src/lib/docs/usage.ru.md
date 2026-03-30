# Использование

Reticulum-Go можно использовать как отдельное приложение, интегрировать в ваши проекты на Go или запускать в браузере через WebAssembly.

## Получение исходного кода

Клонируйте репозиторий, чтобы начать:

```bash
git clone https://git.quad4.io/Networks/Reticulum-Go
cd Reticulum-Go
```

## Установка

### Предварительные условия

- Go 1.24 или новее
- GNU Make (по желанию, но удобно; в репозитории есть `Makefile` для типовых задач)

## Сборка и запуск

Из корня репозитория можно вызывать Make или выполнять те же действия напрямую через `go`.

### Релизный бинарник

```bash
make build
```

Эквивалент:

```bash
mkdir -p bin
CGO_ENABLED=0 go build -ldflags="-s -w" -o bin/reticulum-go ./cmd/reticulum-go
```

Готовый файл: `bin/reticulum-go`.

### Запуск из исходников

```bash
make run
```

Эквивалент:

```bash
go run ./cmd/reticulum-go
```

### Тесты

```bash
make test
```

Эквивалент:

```bash
go test -v ./...
```

## Кроссплатформенная сборка

### Linux (amd64, arm64, arm, riscv64)

```bash
make build-linux
```

Пример для одной архитектуры (для остальных замените `GOARCH` на `arm64`, `arm` или `riscv64`):

```bash
mkdir -p bin
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o bin/reticulum-go-linux-amd64 ./cmd/reticulum-go
```

### Linux, Windows и macOS

```bash
make build-all
```

Цель вызывает `build-linux`, `build-windows` и `build-darwin`. Остальные цели и переменные см. в `Makefile` репозитория.

## Экспериментальные возможности

Сборка с экспериментальным сборщиком мусора Green Tea (нужен Go с поддержкой `GOEXPERIMENT=greenteagc`, обычно Go 1.25+):

```bash
mkdir -p bin
GOEXPERIMENT=greenteagc go build -o bin/reticulum-go-experimental ./cmd/reticulum-go
```

Запуск без отдельного бинарника:

```bash
GOEXPERIMENT=greenteagc go run ./cmd/reticulum-go
```
