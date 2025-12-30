# Использование

Использование Reticulum-Go в вашем проекте очень простое.

## Установка

```bash
pnpm add reticulum-go-wasm
```

## Инициализация

```typescript
import { initReticulum } from 'reticulum-go-wasm';

await initReticulum();
```

## Создание личности

```typescript
import { Identity } from 'reticulum-go-wasm';

const identity = new Identity();
console.log('Мой адрес:', identity.address);
```
