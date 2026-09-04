# TraceGraph case study

TraceGraph is a local-first requirements engineering and digital-thread workbench built around one inspectable engineering thread:

**stakeholder intent → elicitation → need → requirement → architecture → verification → evidence → change impact → baseline**

The case-study project is a deterministic synthetic **Emergency Response Drone** program. It exists to make the workflow reproducible without proprietary data, customer claims, or hidden services.

## Problem

Requirements work often fragments stakeholder notes, requirements, architecture decisions, verification planning, evidence, and change analysis across separate tools and documents. That fragmentation makes it difficult to answer basic engineering questions such as:

- Where did this requirement come from?
- What does it allocate to?
- How will it be verified?
- What evidence supports it?
- What changes if the statement changes?
- Which baseline contains the reviewed state?

TraceGraph treats those questions as views over one canonical model rather than separate records that must be reconciled manually.

## Design principles

### Progressive formalization

Users can start from plain-language stakeholder material and move toward structured requirements without discarding the original provenance. Guided mode keeps prompts approachable; Engineering mode exposes denser controls. Both edit the same underlying artifacts.

### Canonical model first

`src/model.ts` owns artifacts, relationships, validation, diagnostics, quality findings, coverage metrics, impact analysis, bundle validation, and deterministic exports. Views do not become independent engineering truth.

`src/profiles.ts` defines Core TraceGraph, SysML, UML, SoSE, and Custom projections. Those projections are explicitly practical subsets, not standards-conformance claims.

### Local-first and reversible

`src/repository.ts` keeps browser persistence behind a repository abstraction using IndexedDB with a localStorage fallback. Important edits participate in local history and undo/redo behavior. The guest demo does not include a remote project data plane.

### Inspectability over decorative metrics

Coverage and diagnostic metrics expose their definitions and the underlying canonical records. Relationship records can expose direction, rationale, confidence, provenance, review state, baseline context, and stable IDs. Synthetic/demo labels remain visible so portfolio evidence is not confused with operational deployment evidence.

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

## Requirement authoring

The workbench supports structured requirement fields, free-text statements, decomposition, ownership, tags, rationale, quality findings, finding dispositions, and version history. Quality analysis is deterministic guidance with explainable rule identifiers and correction suggestions; it is not represented as standards certification.

## Traceability and provenance

Trace Explorer lets the user inspect canonical relationships rather than merely viewing a decorative network. Direction, depth, relationship type, exclusions, neighbor expansion, isolation, and reset controls are available alongside a tabular alternative.

Relationship metadata is part of the engineering record. Stable relationship IDs plus rationale, confidence, provenance, review, and baseline metadata make important links reviewable instead of implicit.

## Architecture projections

Architecture, SysML-oriented, UML-oriented, and SoSE views remain projections over canonical artifact IDs. Diagram perspectives store view configuration and positions, but do not replace the source artifacts. Unsupported standards semantics are treated as roadmap scope instead of being implied by visual similarity.

## Verification and evidence

Verification cases support multiple verification methods, procedures/results, owners, and evidence attachment. Requirement-to-verification coverage remains distinct from evidence completeness so users can see what each metric actually measures.

## Change impact

Impact analysis evaluates direct and indirect relationship paths before a proposed change is applied. The user can inspect affected artifacts, quality consequences, allocations, verification implications, and relationship changes before creating or applying a change request.

The analysis is explainable graph traversal over the current canonical model, not a prediction of organizational or business impact.

## Baselines

Baselines preserve named snapshots of canonical artifacts and relationships with approval metadata. Comparison surfaces changed, added, and removed engineering records and link changes. A baseline is therefore an inspectable configuration state rather than a visual bookmark.

## Import, export, and Mermaid safety

Project bundles are validated before replacement and limited to 5 MB. IDs, relationship endpoints, optional histories, baselines, and diagram perspectives are checked before imported data becomes canonical.

Mermaid is deliberately constrained. Text is parsed into supported relationship proposals, diagnostics are returned for unsupported syntax, and proposed links require explicit acceptance. Mermaid input is not treated as executable model code.

Exports include JSON bundles, CSV matrices, Mermaid, SVG, bounded PNG, Markdown, and printable HTML. SVG is retained as the lossless large-graph option while PNG remains intentionally bounded for browser safety.

## Accessibility

The UI uses semantic controls, keyboard focus states, accessible graph alternatives, reduced-motion behavior, and persisted light/dark themes. Automated axe checks cover the landing page and major workflow stages.

This is an engineering baseline, not a WCAG certification or a claim of complete assistive-technology conformance.

## Reproducible visual evidence

`tests/e2e/case-study-screenshots.spec.ts` generates eight deterministic case-study captures:

- `case-study-landing.png`
- `case-study-guided-tour.png`
- `case-study-requirement-authoring.png`
- `case-study-trace-graph.png`
- `case-study-verification-matrix.png`
- `case-study-impact-analysis.png`
- `case-study-baseline-comparison.png`
- `case-study-exports.png`

CI retains the generated images as the `tracegraph-case-study-screenshots` artifact. This keeps visual evidence tied to a reproducible browser flow instead of a manually staged dashboard.

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

Build size, test duration, and browser timing observations belong to the specific run that produced them. They are not claims of cross-device performance, uptime, productivity improvement, or enterprise scale.

## What the case study demonstrates

The evidence for TraceGraph is the runnable deterministic workflow itself:

- a synthetic but non-trivial canonical model;
- provenance-preserving elicitation and requirement authoring;
- inspectable relationships and coverage;
- architecture projections over shared IDs;
- verification and evidence handling;
- explainable change analysis;
- baseline comparison;
- portable exports;
- automated unit, end-to-end, accessibility, and build validation;
- reproducible screenshots.

It does **not** claim customer deployment, revenue, certification, compliance, uptime, measured productivity gains, or standards-complete MBSE behavior.

## Remaining limitations

- Full standards-complete SysML/UML/SoSE semantics are not implemented.
- Server-backed collaboration is outside the guest demo.
- Large-model table virtualization is still roadmap work.
- A repeatable cross-device performance benchmark is not yet implemented.
- The current brand mark is a deterministic fallback rather than an owner-provided final asset.
- Screen-reader certification and a complete WCAG conformance audit have not been performed.

## Reproduce the demo

See [`demo-script.md`](demo-script.md) for the short walkthrough and [`accessibility.md`](accessibility.md) plus [`security-threat-model.md`](security-threat-model.md) for explicit engineering boundaries.
