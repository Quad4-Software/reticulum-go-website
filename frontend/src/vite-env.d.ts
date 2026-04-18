/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_WASM_SHA256: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
