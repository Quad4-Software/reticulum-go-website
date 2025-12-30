# Usage

Using Reticulum-Go in your project is straightforward.

## Installation

```bash
pnpm add reticulum-go-wasm
```

## Initialization

```typescript
import { initReticulum } from 'reticulum-go-wasm';

await initReticulum();
```

## Creating an Identity

```typescript
import { Identity } from 'reticulum-go-wasm';

const identity = new Identity();
console.log('My Address:', identity.address);
```
