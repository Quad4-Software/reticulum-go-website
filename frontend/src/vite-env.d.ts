/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_WASM_SHA256: string;
	readonly VITE_GIT_SHA: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
