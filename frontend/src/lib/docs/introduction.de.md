# Einführung

Reticulum-Go ist eine leistungsstarke Go-Implementierung des [Reticulum Network Stack](https://github.com/markqvist/Reticulum). Dieses Projekt bietet eine vollständige Go-basierte Implementierung mit nahtloser WebAssembly-Unterstützung für Browser.

## Projektziele

- **Vollständige Protokollkompatibilität**: Vollständige Interoperabilität mit der Python-Referenzimplementierung beibehalten.
- **Plattformübergreifende Unterstützung**: Unterstützung für ältere und moderne Plattformen auf mehreren Architekturen.
- **Leistung**: Nutzung des Concurrency-Modells und der Runtime von Go für verbesserten Durchsatz und geringere Latenz.
- **Mehr Privatsphäre und Sicherheit**: Zusätzliche Datenschutz- und Sicherheitsfunktionen über die Basisspezifikation hinaus.

## Funktionen

- **Hohe Leistung**: Mit Go gebaut für maximale Performance und Effizienz.
- **WASM-Unterstützung**: Volle Unterstützung für die Ausführung von Reticulum direkt im Browser via WebAssembly.
- **Experimenteller Garbage Collector (GC)**: Unterstützung für den experimentellen Green Tea Garbage Collector zur Leistungsbewertung.

## Unterstützte Funktionen

Die Go-Implementierung bietet robuste Unterstützung für Kernfunktionen von Reticulum:

- **Identität & Kryptographie**: Ed25519, Curve25519, AES-256-CBC, HMAC-SHA256 und HKDF.
- **Schnittstellen**: TCP/UDP, WebSocket und viele weitere Schnittstellentypen.
- **Transport & Routing**: Volle Unterstützung für Transportschichten, Pfadfindung und Verbindungsaufbau.
- **Kanäle & Puffer**: Effiziente Datenverarbeitung durch dedizierte Kanal- und Puffer-Implementierungen.
- **Ressourcen**: Unterstützung für Ressourcen-Ankündigungen und effiziente Datentransfers.

## Erste Schritte

Um mit der Verwendung von Reticulum-Go zu beginnen, schaue dir den Abschnitt [Verwendung](/docs/usage) an.
