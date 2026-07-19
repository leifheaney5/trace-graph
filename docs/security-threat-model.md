# Security threat model

The local-first MVP has no remote data plane. Primary risks are unsafe imported content, accidental local loss, and users importing sensitive information into a public demo. Current mitigation is browser-only persistence, explicit full export, no remote logging, a 5 MB import limit, schema/ID/relationship/history validation, sanitized download names, plain-text Mermaid proposals, and a confirmation-gated local-project deletion action. The application does not transmit project content unless the user explicitly exports it.
