# TraceGraph case study

TraceGraph is a local-first requirements engineering and digital-thread workbench built around one inspectable engineering thread:

**stakeholder intent → elicitation → need → requirement → architecture → verification → evidence → change impact → baseline**

The case-study project is a deterministic synthetic **Emergency Response Drone** program. It exists to make the workflow reproducible without proprietary data, customer claims, or hidden services.

## Problem

Requirements work often fragments stakeholder notes, requirements, architecture decisions, verification planning, evidence, and change analysis across separate tools and documents. That fragmentation makes it difficult to answer basic engineering questions such as:

- Where did this requirement come from?
- What does it allocate to?
- How will it be verified?
- Is the evidence still valid for the current requirement version?
- What changes if the statement changes?
- Why is each downstream artifact considered affected?
- Which baseline contains the reviewed state?

TraceGraph treats those questions as views and deterministic services over one canonical model rather than separate records that must be reconciled manually.

## Design principles

### Progressive formalization

Users can start from plain-language stakeholder material and move toward structured requirements without discarding the original provenance. Guided mode keeps prompts approachable; Engineering mode exposes denser controls. Both edit the same underlying artifacts.

The engineering-intelligence workbench adds deterministic elicitation extraction. Suggested needs, concerns, assumptions, constraints, and requirements retain their source excerpt, confidence, and rationale. They remain explicitly **Suggested · not canonical** until a user accepts them.

### Canonical model first

`src/model.ts` owns the canonical artifact and relationship model, validation, diagnostics, quality findings, coverage metrics, comparison, and deterministic exports. Views do not become independent engineering truth.

`src/digitalThread.ts` operates on those canonical bundles to provide lifecycle/version services, review records, evidence validity, explainable impact, constrained trace queries, structured elicitation, corpus quality analysis, change requests, baselines, and assistant suggestions.

`src/profiles.ts` defines Core TraceGraph, SysML, UML, SoSE, and Custom projections. Those projections are explicitly practical subsets, not standards-conformance claims.

### Local-first and reversible

`src/repository.ts` keeps browser persistence behind a repository abstraction using IndexedDB with a localStorage fallback. The Thread intelligence workbench uses that same abstraction. Accepted changes are persisted and then reloaded into the core workbench rather than being maintained in a separate model.

### Inspectability over decorative metrics

Coverage and diagnostic metrics expose their definitions and the underlying canonical records. Relationship records can expose direction, rationale, confidence, provenance, review state, baseline context, and stable IDs. Synthetic/demo labels remain visible so portfolio evidence is not confused with operational deployment evidence.

The deeper intelligence workbench also keeps lifecycle, verification, evidence validity, quality findings, and impact as separate signals rather than reducing them to one opaque readiness score.

## First-five-minute experience

A persistent workflow rail keeps all nine stages visible even when the user is deep in a specialist view. The case-study chrome also keeps three boundaries visible:

- Synthetic demo
- Local-first
- Canonical model

The Emergency Response Drone sample is named directly in the chrome, and the guided workflow can be restarted without deleting or replacing the user's current project.

The intended first session is:

1. Open the sample.
2. Inspect stakeholder intent and elicitation provenance.
3. Follow a need into requirement authoring.
4. Review quality findings and structured requirement fields.
5. Inspect architecture allocation.
6. Follow the trace into verification and evidence.
7. Simulate a proposed requirement change.
8. Compare the resulting engineering state against a baseline.
9. Export the inspectable thread.

The **Thread intelligence** control then exposes the deeper version-aware and query-oriented workflows without changing the canonical product boundary.

## Requirement authoring and lifecycle

The workbench supports structured requirement fields, free-text statements, decomposition, ownership, tags, rationale, quality findings, finding dispositions, and version history. Quality analysis is deterministic guidance with explainable rule identifiers and correction suggestions; it is not represented as standards certification.

The deeper digital-thread services add normalized lifecycle states:

**Draft → Proposed → In review → Approved → Superseded → Retired**

Only allowed transitions are accepted. Each lifecycle transition records actor, rationale, timestamp, and a canonical `ArtifactVersion` snapshot. Review decisions are modeled separately through `ReviewSession` artifacts and `reviews` relationships so an approval record does not silently overwrite lifecycle history.

## Traceability and provenance

Trace Explorer lets the user inspect canonical relationships rather than merely viewing a decorative network. Direction, depth, relationship type, exclusions, neighbor expansion, isolation, and reset controls are available alongside a tabular alternative.

Relationship metadata is part of the engineering record. Stable relationship IDs plus rationale, confidence, provenance, review, and baseline metadata make important links reviewable instead of implicit.

The deterministic trace-query layer translates a constrained set of engineering questions into graph operations. Supported examples include missing verification, unapproved needs, impact from a named artifact, tests that verify critical requirements, baseline differences, stale evidence, orphaned architecture, and directed paths between two artifact IDs. Unsupported phrasing returns an explicit unsupported result instead of a generated guess.

## Architecture projections

Architecture, SysML-oriented, UML-oriented, and SoSE views remain projections over canonical artifact IDs. Diagram perspectives store view configuration and positions, but do not replace the source artifacts. Unsupported standards semantics are treated as roadmap scope instead of being implied by visual similarity.

The deeper intelligence pass deliberately reuses those projections rather than creating another architecture model.

## Verification and evidence validity

Verification cases support multiple verification methods, procedures/results, owners, and evidence attachment. Requirement-to-verification coverage remains distinct from evidence completeness so users can see what each metric actually measures.

The version-aware evidence service goes further by distinguishing **evidence exists** from **evidence is reusable for the current engineering state**. For each evidence artifact it checks available canonical metadata for:

- a producing verification relationship;
- reachable requirements through `verified-by` relationships;
- evidence production time;
- recorded requirement version;
- the current canonical requirement version/history;
- baseline or configuration reference;
- reviewer/review state;
- verified state;
- supersession metadata.

The resulting states are **valid**, **stale**, **review-needed**, **incomplete**, or **superseded**. A stale result means the structural record indicates that a linked requirement changed or moved to a newer version after the evidence context was recorded. It does not claim that the physical test result itself has been scientifically invalidated without review.

## Explainable change impact

Impact analysis follows directed canonical relationships and retains the relationship kind, rationale, confidence, and provenance for every edge in an explanation path.

Signals stay separate:

- direct impact;
- transitive impact;
- verification impact;
- connected evidence;
- already-stale evidence;
- baseline divergence;
- high-criticality artifacts;
- unreviewed artifacts.

For example, a change to a requirement can expose its architecture allocation, downstream verification case, evidence produced by that case, and whether those artifacts diverge from the latest stored baseline. The interface shows the actual relationship chain rather than presenting an unexplained impact score.

This is structural engineering analysis. It is not a probabilistic safety score, business-impact prediction, or certification determination.

## Change requests and baselines

A canonical change request retains:

- the originating artifact;
- reason for change;
- proposed change text;
- explainably affected artifact IDs;
- reviewer list;
- target baseline context;
- canonical relationships from the change request back to its justification and affected artifacts.

Change requests can move through the same controlled lifecycle service as requirements while review decisions remain separate records.

Version-aware baselines snapshot canonical artifacts, relationships, artifact-version history, relation history, project metadata, approver, and approval time. Baseline membership can therefore identify the artifact version represented in the stored configuration. Comparison surfaces added, removed, and changed artifacts and relationships.

## Assistant boundary

The current assistant layer is deterministic and local. It can suggest:

- structured requirement rewrites when existing quality rules and fields support one;
- verification planning when a requirement has no `verified-by` relationship;
- evidence refresh/review when canonical version history makes evidence stale;
- review prompts around deterministic conflict diagnostics.

Every proposal displays its rationale and limitation. Suggestions do not mutate the canonical bundle. A future LLM provider could produce the same typed suggestion objects, but that would introduce a new data-handling and trust boundary and would still require explicit acceptance before canonical change.

## Import, export, and Mermaid safety

Project bundles are validated before replacement and limited to 5 MB. IDs, relationship endpoints, optional histories, baselines, and diagram perspectives are checked before imported data becomes canonical.

Mermaid is deliberately constrained. Text is parsed into supported relationship proposals, diagnostics are returned for unsupported syntax, and proposed links require explicit acceptance. Mermaid input is not treated as executable model code.

Exports include JSON bundles, CSV matrices, Mermaid, SVG, bounded PNG, Markdown, and printable HTML. SVG is retained as the lossless large-graph option while PNG remains intentionally bounded for browser safety.

## Accessibility

The UI uses semantic controls, keyboard focus states, accessible graph alternatives, reduced-motion behavior, and persisted light/dark themes. Dense scrollable intelligence regions are keyboard focusable and named. Automated axe checks cover the landing page, major core workflow stages, and the intelligence overview, impact, query, evidence, and elicitation surfaces.

This is an engineering baseline, not a WCAG certification or a claim of complete assistive-technology conformance.

## Reproducible visual evidence

The original deterministic case-study flow generates:

- `case-study-landing.png`
- `case-study-guided-tour.png`
- `case-study-requirement-authoring.png`
- `case-study-trace-graph.png`
- `case-study-verification-matrix.png`
- `case-study-impact-analysis.png`
- `case-study-baseline-comparison.png`
- `case-study-exports.png`

The deeper engineering-intelligence flow adds:

- `case-study-intelligence-overview.png`
- `case-study-intelligence-impact.png`
- `case-study-intelligence-query.png`
- `case-study-intelligence-evidence.png`
- `case-study-intelligence-elicitation.png`

CI retains all 13 generated images as the `tracegraph-case-study-screenshots` artifact. The evidence is tied to reproducible browser flows instead of manually staged dashboards.

## Verification evidence policy

Only measurements produced by the current source revision should be reported as current evidence. The canonical validation sequence is:

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run test:accessibility
npm run build
```

Dependency audit is also checked in CI. Build size, test duration, and browser timing observations belong to the specific run that produced them. They are not claims of cross-device performance, uptime, productivity improvement, or enterprise scale.

## What the case study demonstrates

The evidence for TraceGraph is the runnable deterministic workflow itself:

- a synthetic but non-trivial canonical model;
- provenance-preserving elicitation and requirement authoring;
- lifecycle history and separate review records;
- inspectable relationships and coverage;
- architecture projections over shared IDs;
- verification and version-aware evidence handling;
- explainable change analysis;
- deterministic structural queries;
- version-aware change requests and baseline comparison;
- a non-canonical assistant/suggestion layer;
- portable exports;
- automated unit, end-to-end, accessibility, audit, and build validation;
- reproducible screenshots.

It does **not** claim customer deployment, revenue, certification, compliance, uptime, measured productivity gains, or standards-complete MBSE behavior.

## Remaining limitations

- Full standards-complete SysML/UML/SoSE semantics are not implemented.
- Server-backed collaboration is outside the guest demo.
- The assistant is currently a deterministic local suggestion layer rather than a configured external model provider.
- Evidence validity is structural freshness/provenance analysis, not cryptographic or laboratory attestation.
- Duplicate/conflict heuristics are review aids and do not prove semantic equivalence or contradiction.
- Large-model table virtualization is still roadmap work.
- A repeatable cross-device performance benchmark is not yet implemented.
- The current brand mark is a deterministic fallback rather than an owner-provided final asset.
- Screen-reader certification and a complete WCAG conformance audit have not been performed.

## Reproduce the demo

See [`demo-script.md`](demo-script.md) for the short walkthrough, [`digital-thread-v2.md`](digital-thread-v2.md) for detailed semantics, and [`accessibility.md`](accessibility.md) plus [`security-threat-model.md`](security-threat-model.md) for explicit engineering boundaries.
