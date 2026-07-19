# ADR 0003: Local-first persistence

## Status

Accepted

## Decision

The MVP stores guest work in IndexedDB through a small repository adapter, mirrors the current bundle to localStorage for migration and fallback, and provides validated export/import. Transactional edits mark the working copy dirty until the autosave effect completes; a browser `beforeunload` guard warns when that short persistence window is still open. No account or remote project API is required.

## Consequences

The public demo is private by default and works without credentials. The synchronous localStorage path preserves compatibility when IndexedDB is unavailable; browser storage limits and recovery UX need further hardening.
