# Security threat model

TraceGraph's guest workbench is deliberately local-first and has no remote project data plane. The main security concerns are imported content, accidental local data loss, unsafe export assumptions, suggestion trust, and users placing sensitive information into a public demonstration environment.

## Assets and trust boundaries

Primary assets are canonical project artifacts, relationships, artifact-version histories, baselines, diagram perspectives, review sessions, change requests, audit records, and exported engineering packages.

The browser storage boundary is implemented behind `BrowserProjectRepository`, using IndexedDB with a localStorage fallback. The guest demo does not include a server repository, collaboration service, telemetry pipeline, remote model provider, or remote logging path for project content.

The Thread intelligence workbench reads and writes through the same repository abstraction. It is not a parallel persistence layer.

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

## Suggestion and model-provider boundary

The current elicitation and assistant features use deterministic local rules. Suggestions are marked as non-canonical and cannot change the project until an explicit acceptance or edit occurs.

A future external LLM or model provider would create a new trust boundary. Before adding one, the product would need an explicit review of:

- which project fields or source excerpts leave the browser;
- provider retention and training policies;
- authentication and key storage;
- prompt-injection and untrusted-document handling;
- output provenance and model/version recording;
- human acceptance requirements;
- deployment-specific restrictions on controlled, proprietary, personal, or regulated data.

No remote-model privacy, confidentiality, or isolation claim is made by the current local case-study build.

## Evidence-validity boundary

Evidence validity is an inspectable structural assessment over recorded lineage, timestamps, requirement versions, baseline context, review state, and supersession metadata. It is not cryptographic attestation, laboratory chain-of-custody proof, digital-signature verification, or independent validation of the underlying test result.

A stale or incomplete state is therefore a prompt for engineering review, not a claim that a physical result is scientifically false.

## Local data loss

Browser-local persistence can still be cleared by the user, browser policy, storage eviction, profile deletion, or device loss.

Mitigations include:

- IndexedDB persistence with a localStorage fallback/migration path;
- explicit JSON export for portable recovery;
- local audit/history records;
- version-aware baseline snapshots;
- confirmation-gated project deletion;
- import preview before project replacement.

The repository does not claim durable enterprise backup or disaster recovery.

## Sensitive information

The bundled Emergency Response Drone, medical-device, and cloud-resilience projects are deterministic synthetic examples. Users should not import controlled, proprietary, personal, regulated, or operationally sensitive material into a public demonstration environment without an appropriate deployment and data-handling review.

## Dependency hygiene

The repository uses a lockfile and clean `npm ci` installs in CI. Dependency audit is checked separately from application correctness. A clean audit result is evidence for the specific resolved dependency graph at that revision; it is not a general guarantee that future dependencies or newly disclosed vulnerabilities will remain safe.

## Export boundary

Exports are user-initiated. TraceGraph does not claim that exported files inherit access control, classification markings, retention policy, or downstream viewer security. Those controls remain the responsibility of the environment in which exported material is stored or shared.

## Out of scope for the guest demo

The current threat model does not claim coverage for:

- multi-user authentication or authorization;
- server-side tenancy isolation;
- collaborative conflict resolution;
- enterprise key management;
- centralized audit retention;
- cryptographic evidence signing or chain of custody;
- remote LLM isolation or data-processing guarantees;
- compliance certification;
- secure handling of classified or regulated operational data.

Those capabilities require a different deployment boundary than the browser-local case-study build.
