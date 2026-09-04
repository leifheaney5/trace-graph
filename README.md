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
- architecture allocation and profile-specific projections;
- trace exploration, relationship evidence, coverage metrics, and accessible tabular alternatives;
- verification planning, methods, cases, results, and evidence attachment;
- explainable change-impact simulation before changes are applied;
- named baselines and baseline comparison;
- local persistence with IndexedDB and localStorage fallback;
- validated, size-limited JSON import/export;
- constrained Mermaid proposal parsing plus SVG, PNG, CSV, Markdown, and printable HTML exports;
- undo/redo and bounded local audit history.

## First five minutes

The interface keeps the full digital thread visible in a persistent workflow rail. The case-study chrome also keeps three boundaries explicit throughout the demo:

- **Synthetic demo**: seeded records are deterministic examples, not operational data.
- **Local-first**: the guest workbench has no remote project data plane.
- **Canonical model**: views are projections over shared artifacts and relationships.

Start with **Open sample project** or **Explore sample**, then use **Start five-minute tour** or **Restart guided workflow** to follow the end-to-end thread.

## Synthetic sample

The Emergency Response Drone seed contains a deliberately rich engineering graph: hundreds of requirements, stakeholders, elicitation records, architecture elements, verification cases, evidence records, risks/decisions, review sessions, change requests, and more than 1,000 canonical relationships. Unit tests validate the important seed invariants rather than relying on narrative counts.

Additional synthetic medical-device and cloud-resilience samples remain available for comparison, but the Emergency Response Drone project is the canonical case-study path.

## Architecture boundaries

- `src/model.ts` owns canonical artifact and relationship types, validation, diagnostics, quality analysis, coverage metrics, impact analysis, comparison, and deterministic exports.
- `src/repository.ts` owns browser persistence behind the repository abstraction.
- `src/profiles.ts` defines Core TraceGraph, SysML, UML, SoSE, and Custom view projections.
- `src/App.tsx` composes the workbench over those boundaries.
- `src/CaseStudyChrome.tsx` adds case-study navigation and product framing without introducing a second engineering model.

Relationship records retain stable IDs and can carry direction, rationale, confidence, provenance, review, baseline, inference, and audit metadata. Diagram perspectives reference canonical artifacts instead of becoming independent sources of truth.

## Modeling scope

TraceGraph deliberately avoids claiming standards-complete SysML, UML, or SoSE authoring. Current profile views are inspectable practical projections intended to make the shared engineering model easier to navigate. Full standards semantics, richer diagram authoring, and enterprise collaboration remain roadmap work.

## Local-first persistence and import safety

Project content is persisted through `BrowserProjectRepository` using IndexedDB with a localStorage fallback. The guest application has no server-backed project repository. Imported JSON bundles are limited to 5 MB and validated before replacement. Artifact IDs, relationship endpoints, history, baselines, and diagram perspectives are checked before imported content becomes canonical project data.

Mermaid input is treated as plain-text relationship proposals. Supported relationships are previewed and explicitly accepted; unsupported syntax is reported instead of executed or injected into the model.

## Case-study evidence

The repository contains a deterministic Playwright screenshot flow covering:

1. landing page;
2. guided tour;
3. requirement authoring;
4. trace graph;
5. verification matrix;
6. impact analysis;
7. baseline comparison;
8. exports.

`npm run test:e2e` generates the current case-study captures under `docs/screenshots/case-study-*.png`. CI retains those images as the `tracegraph-case-study-screenshots` artifact.

The narrative case study is in [`docs/case-study.md`](docs/case-study.md), with a short reproducible walkthrough in [`docs/demo-script.md`](docs/demo-script.md).

## Accessibility

The interface provides semantic form controls, keyboard focus treatment, text/table alternatives for visual graph content, reduced-motion behavior, persisted light/dark themes, and non-drag controls for important relationships. Playwright and axe scan the landing page and major workflow surfaces for critical and serious violations.

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

GitHub Actions runs that same sequence on pushes and pull requests. Build sizes and test timings should be treated as observations from a specific run, not product performance benchmarks.

## Export formats

TraceGraph supports Mermaid source and fenced Markdown, SVG, bounded PNG raster export, CSV requirements/traceability/verification matrices, Markdown reports, printable HTML reports, JSON project bundles, and selected Diagram Studio perspectives.

## Known limitations

- The included TraceGraph mark is a deterministic fallback, not an owner-provided final brand asset.
- Full standards-complete SysML/UML/SoSE semantics are not implemented.
- Server collaboration and a remote repository adapter are not part of the guest demo.
- Large-model table virtualization and a repeatable performance benchmark remain roadmap items.
- PNG export is intentionally bounded for browser safety; SVG remains the lossless graph export.
- No license file is currently present; the repository owner should select a license before broad redistribution.

## Contributing and security

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for development conventions. Report security concerns according to [`SECURITY.md`](SECURITY.md). Do not import sensitive operational information into a public demo environment.
