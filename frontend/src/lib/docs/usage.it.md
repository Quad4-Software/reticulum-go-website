# Utilizzo

L'utilizzo di Reticulum-Go nel tuo progetto è semplice.

## Installazione

```bash
pnpm add reticulum-go-wasm
```

## Inizializzazione

```typescript
import { initReticulum } from 'reticulum-go-wasm';

await initReticulum();
```

## Creazione di un'Identità

```typescript
import { Identity } from 'reticulum-go-wasm';

const identity = new Identity();
console.log('Mio Indirizzo:', identity.address);
```
