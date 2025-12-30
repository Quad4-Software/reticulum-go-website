# Verwendung

Die Verwendung von Reticulum-Go in Ihrem Projekt ist unkompliziert.

## Installation

```bash
pnpm add reticulum-go-wasm
```

## Initialisierung

```typescript
import { initReticulum } from 'reticulum-go-wasm';

await initReticulum();
```

## Erstellen einer Identität

```typescript
import { Identity } from 'reticulum-go-wasm';

const identity = new Identity();
console.log('Meine Adresse:', identity.address);
```
