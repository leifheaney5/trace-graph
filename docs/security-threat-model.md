# Security threat model

TraceGraph's guest workbench is deliberately local-first and has no remote project data plane. The main security concerns are therefore imported content, accidental local data loss, unsafe export assumptions, and users placing sensitive information into a public demonstration environment.

## Assets and trust boundaries

Primary assets are canonical project artifacts, relationships, histories, baselines, diagram perspectives, audit records, and exported engineering packages.

The browser storage boundary is implemented behind `BrowserProjectRepository`, using IndexedDB with a localStorage fallback. The guest demo does not include a server repository, collaboration service, telemetry pipeline, or remote logging path for project content.

## Import threats

Untrusted project bundles could attempt to introduce malformed artifacts, dangling relationships, invalid histories, oversized payloads, or unexpected diagram data.

Current mitigations include:

- a 5 MB project import limit;
- schema and structural validation before replacement;
- validation that relationship endpoints reference canonical artifacts;
- validation of optional artifact/relation history;
- validation of baselines and diagram perspectives;
- an explicit replacement-review step before applying an imported bundle;
- sanitized filenames for generated downloads.

## Mermaid boundary

Mermaid text is not executed as model code. TraceGraph parses a constrained relationship subset into plain proposed links, reports unsupported syntax with diagnostics, and requires explicit acceptance before supported relationships are added to the canonical model.

This boundary is intentionally narrower than accepting arbitrary executable diagram content.

## Local data loss

Browser-local persistence can still be cleared by the user, browser policy, storage eviction, profile deletion, or device loss.

Mitigations include:

- IndexedDB persistence with a localStorage fallback/migration path;
- explicit JSON export for portable recovery;
- local audit/history records;
- confirmation-gated project deletion;
- import preview before project replacement.

The repository does not claim durable enterprise backup or disaster recovery.

## Sensitive information

The bundled Emergency Response Drone, medical-device, and cloud-resilience projects are deterministic synthetic examples. Users should not import controlled, proprietary, personal, regulated, or operationally sensitive material into a public demonstration environment without an appropriate deployment and data-handling review.

## Export boundary

Exports are user-initiated. TraceGraph does not claim that exported files inherit access control, classification markings, retention policy, or downstream viewer security. Those controls remain the responsibility of the environment in which exported material is stored or shared.

## Out of scope for the guest demo

The current threat model does not claim coverage for:

- multi-user authentication or authorization;
- server-side tenancy isolation;
- collaborative conflict resolution;
- enterprise key management;
- centralized audit retention;
- compliance certification;
- secure handling of classified or regulated operational data.

Those capabilities require a different deployment boundary than the browser-local case-study build.
