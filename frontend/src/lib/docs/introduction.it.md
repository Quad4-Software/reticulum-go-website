# Introduzione

Reticulum-Go è un'implementazione Go ad alte prestazioni del [Reticulum Network Stack](https://github.com/markqvist/Reticulum). Questo progetto fornisce un'implementazione completa basata su Go con supporto WebAssembly nativo per i browser.

## Obiettivi del Progetto

- **Compatibilità Completa del Protocollo**: Mantenere la completa interoperabilità con l'implementazione di riferimento in Python.
- **Supporto Cross-Platform**: Supporto per piattaforme legacy e moderne su molteplici architetture.
- **Prestazioni**: Sfruttare il modello di concorrenza e la runtime di Go per migliorare il throughput e la latenza.
- **Maggiore Privacy e Sicurezza**: Funzionalità aggiuntive di privacy e sicurezza oltre la specifica di base.

## Caratteristiche

- **Alte Prestazioni**: Costruito con Go per massime prestazioni ed efficienza.
- **Supporto WASM**: Supporto completo per eseguire Reticulum direttamente nel browser via WebAssembly.
- **Garbage Collector (GC) Sperimentale**: Supporto per il garbage collector sperimentale Green Tea per la valutazione delle prestazioni.

## Funzionalità Supportate

L'implementazione Go fornisce un supporto robusto per le funzionalità principali di Reticulum:

- **Identità e Crittografia**: Ed25519, Curve25519, AES-256-CBC, HMAC-SHA256 e HKDF.
- **Interfacce**: TCP/UDP, WebSocket e molti altri tipi di interfaccia.
- **Trasporto e Routing**: Supporto completo per i livelli di trasporto, pathfinding e stabilimento di link.
- **Canali e Buffer**: Gestione efficiente dei dati tramite implementazioni dedicate di canali e buffer.
- **Risorse**: Supporto per annunci di risorse e trasferimenti di dati efficienti.

## Per Iniziare

Per iniziare a usare Reticulum-Go, consulta la sezione [Utilizzo](/docs/usage).
