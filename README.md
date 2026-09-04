# TraceGraph

TraceGraph is a local-first requirements engineering and digital-thread workbench for turning stakeholder intent into inspectable engineering evidence.

Its canonical workflow is:

**stakeholder intent → elicitation → need → requirement → architecture → verification → evidence → change impact → baseline**

The repository ships with a deterministic synthetic **Emergency Response Drone** project so the complete workflow can be explored without an account, external service, or proprietary data.

## What TraceGraph is

TraceGraph is an approachable engineering workbench, not a claim of certified enterprise MBSE capability. Guided and Engineering modes operate on the same canonical artifacts and relationships. SysML-, UML-, and SoSE-oriented views are practical projections over that model and are labeled as such rather than presented as standards-conformant editors.

The current vertical slice includes:

- guided onboarding and a restartable workflow tour;
- stakeholder discovery, elicitation records, source notes, and need review;
- structured requirement authoring, quality findings, decomposition, metadata, and version history;
- explicit artifact lifecycle transitions with canonical version snapshots;
- review decisions recorded separately from artifact lifecycle state;
- architecture allocation and profile-specific projections;
- trace exploration, relationship evidence, coverage metrics, and accessible tabular alternatives;
- deterministic structural trace queries that refuse unsupported questions rather than fabricating answers;
- verification planning, methods, cases, results, and evidence attachment;
- evidence validity checks for lineage, version freshness, review state, baseline context, and supersession;
- explainable change impact with relationship direction, rationale, confidence, and provenance preserved along each path;
- canonical change requests that retain origin, affected artifacts, rationale, reviewers, and target baseline context;
- version-aware named baselines and baseline comparison;
- deterministic elicitation and engineering-assistant suggestions that remain non-canonical until explicitly accepted;
- local persistence with IndexedDB and localStorage fallback;
- validated, size-limited JSON import/export;
- constrained Mermaid proposal parsing plus SVG, PNG, CSV, Markdown, and printable HTML exports;
- undo/redo and bounded local audit history.

## First five minutes

The interface keeps the full digital thread visible in a persistent workflow rail. The case-study chrome also keeps three boundaries explicit throughout the demo:

- **Synthetic demo**: seeded records are deterministic examples, not operational data.
- **Local-first**: the guest workbench has no remote project data plane.
- **Canonical model**: views are projections over shared artifacts and relationships.

Start with **Open sample project** or **Explore sample**, then use **Start five-minute tour** or **Restart digital-thread tour** to follow the end-to-end thread.

The **Thread intelligence** control opens the deeper inspectability layer. It reads and writes through the same browser repository used by the core workbench; accepted changes are then reloaded into the core views rather than maintained as a parallel model.

## Synthetic sample

The Emergency Response Drone seed contains a deliberately rich engineering graph: hundreds of requirements, stakeholders, elicitation records, architecture elements, verification cases, evidence records, risks/decisions, review sessions, change requests, and more than 1,000 canonical relationships. Unit tests validate the important seed invariants rather than relying on narrative counts.

Additional synthetic medical-device and cloud-resilience samples remain available for comparison, but the Emergency Response Drone project is the canonical case-study path.

## Architecture boundaries

- `src/model.ts` owns canonical artifact and relationship types, validation, diagnostics, quality analysis, coverage metrics, comparison, deterministic exports, and the existing model primitives.
- `src/digitalThread.ts` adds version-aware lifecycle, review, evidence-validity, explainable-impact, trace-query, elicitation, quality, change-request, baseline, and suggestion services over canonical `ProjectBundle` data.
- `src/repository.ts` owns browser persistence behind the repository abstraction.
- `src/profiles.ts` defines Core TraceGraph, SysML, UML, SoSE, and Custom view projections.
- `src/App.tsx` composes the core workbench over those boundaries.
- `src/DigitalThreadWorkbench.tsx` exposes the deeper engineering-intelligence workflows without introducing a second source of truth.
- `src/CaseStudyChrome.tsx` adds case-study navigation and product framing without introducing a second engineering model.

Relationship records retain stable IDs and can carry direction, rationale, confidence, provenance, review, baseline, inference, and audit metadata. Diagram perspectives reference canonical artifacts instead of becoming independent sources of truth.

## Inspectable engineering intelligence

The Thread intelligence workbench intentionally keeps engineering signals separate instead of collapsing them into one readiness score. It exposes:

- approved requirements as a numerator and denominator;
- verification linkage based on canonical `verified-by` relationships;
- valid, stale, review-needed, incomplete, and superseded evidence states;
- direct and transitive impact counts;
- verification and evidence consequences;
- baseline divergence;
- artifact-local and corpus-level requirement-quality findings;
- assistant suggestions that are visibly proposals rather than canonical records.

Evidence existence is not treated as evidence validity. A record can be connected yet still be stale or incomplete if the producing verification, requirement version, production timestamp, baseline context, review state, or supersession history does not support reuse.

Change impact is structural and explainable. It is not a probabilistic risk score, business-impact prediction, or certification judgment.

See [`docs/digital-thread-v2.md`](docs/digital-thread-v2.md) for the detailed semantics and limitations.

## Modeling scope

TraceGraph deliberately avoids claiming standards-complete SysML, UML, or SoSE authoring. Current profile views are inspectable practical projections intended to make the shared engineering model easier to navigate. Full standards semantics, richer diagram authoring, and enterprise collaboration remain roadmap work.

## Local-first persistence and import safety

Project content is persisted through `BrowserProjectRepository` using IndexedDB with a localStorage fallback. The guest application has no server-backed project repository. Imported JSON bundles are limited to 5 MB and validated before replacement. Artifact IDs, relationship endpoints, history, baselines, and diagram perspectives are checked before imported content becomes canonical project data.

Mermaid input is treated as plain-text relationship proposals. Supported relationships are previewed and explicitly accepted; unsupported syntax is reported instead of executed or injected into the model.

## Case-study evidence

The repository contains deterministic Playwright evidence for the original case-study workflow plus the deeper engineering-intelligence layer. Current captures include:

1. landing page;
2. guided tour;
3. requirement authoring;
4. trace graph;
5. verification matrix;
6. impact analysis;
7. baseline comparison;
8. exports;
9. intelligence overview;
10. explainable intelligence impact;
11. deterministic trace query;
12. evidence validity;
13. elicitation suggestion review.

`npm run test:e2e` generates the current case-study captures under `docs/screenshots/case-study-*.png`. CI retains those images as the `tracegraph-case-study-screenshots` artifact.

The narrative case study is in [`docs/case-study.md`](docs/case-study.md), with a short reproducible walkthrough in [`docs/demo-script.md`](docs/demo-script.md).

## Accessibility

The interface provides semantic form controls, keyboard focus treatment, text/table alternatives for visual graph content, reduced-motion behavior, persisted light/dark themes, non-drag controls for important relationships, and named focusable regions for dense scrollable engineering data. Playwright and axe scan the landing page, major core workflow surfaces, and the engineering-intelligence workbench for critical and serious violations.

This is an accessibility engineering baseline, not a WCAG certification or screen-reader conformance claim. See [`docs/accessibility.md`](docs/accessibility.md).

## Quick start

```bash
npm install
npm run dev
```

## Verification

The repository defines the following validation sequence:

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run test:accessibility
npm run build
```

GitHub Actions runs that sequence on pushes and pull requests. Dependency audit is also checked in CI. Build sizes and test timings should be treated as observations from a specific run, not product performance benchmarks.

## Export formats

TraceGraph supports Mermaid source and fenced Markdown, SVG, bounded PNG raster export, CSV requirements/traceability/verification matrices, Markdown reports, printable HTML reports, JSON project bundles, and selected Diagram Studio perspectives.

## Known limitations

- The included TraceGraph mark is a deterministic fallback, not an owner-provided final brand asset.
- Full standards-complete SysML/UML/SoSE semantics are not implemented.
- The current assistant and elicitation suggestion layer is deterministic and local; no remote LLM provider is required or claimed.
- Evidence validity is a structural freshness/provenance assessment, not cryptographic attestation of the underlying engineering result.
- Conflict and duplicate detection are review aids, not proof of semantic contradiction or equivalence.
- Server collaboration and a remote repository adapter are not part of the guest demo.
- Large-model table virtualization and a repeatable performance benchmark remain roadmap items.
- PNG export is intentionally bounded for browser safety; SVG remains the lossless graph export.
- No license file is currently present; the repository owner should select a license before broad redistribution.

## Contributing and security

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for development conventions. Report security concerns according to [`SECURITY.md`](SECURITY.md). Do not import sensitive operational information into a public demo environment.