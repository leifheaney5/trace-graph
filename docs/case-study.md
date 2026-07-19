# Case study

TraceGraph demonstrates a small but complete digital-thread slice: coordinator interview notes become a need, then a requirement, architecture allocation, verification case, and evidence path. The repository intentionally documents missing production capabilities rather than presenting a mock dashboard as a complete enterprise tool.

The seeded synthetic model currently contains 260 requirements, 180 tests, 170 evidence records, and 1,149 trace links. These are deterministic demo records, not operational or proprietary data.

The Overview includes session-local timing instrumentation for project load,
Mermaid generation, and PNG export. Values are measured with the browser
performance clock and are intentionally not promoted as cross-device
benchmarks; a repeatable benchmark harness for the full seed graph remains
future work.

## Portfolio evidence

### Problem and users

The workbench is aimed at systems engineers, requirements engineers, technical
reviewers, verification owners, and learners who need one inspectable thread
from informal stakeholder intent to verified evidence. It is positioned as an
approachable, open, local-first workbench rather than a replacement for
certified enterprise tooling.

### Differentiation and progressive formalization

The product starts with interview notes, stakeholders, concerns, and candidate
needs. Users can preserve provenance, review a need, generate a structured
requirement, allocate it to architecture, plan verification, attach evidence,
and freeze a baseline. Guided and Engineering modes use the same canonical
records, so plain-language onboarding does not create a second model.

### Canonical model and architecture

`src/model.ts` owns artifacts, first-class relationships, validation, quality
analysis, coverage metrics, deterministic reports, Mermaid, SVG, and bundle
validation. `src/profiles.ts` defines SysML, UML, SoSE, Core TraceGraph, and
Custom projections. `src/App.tsx` composes bounded workflow views, while
`src/repository.ts` provides IndexedDB persistence with a localStorage fallback.
The modular-monolith choice keeps the demo easy to run while preserving a
future adapter boundary.

### Requirements gathering and engineering

The demo includes stakeholder discovery, elicitation records, source notes,
candidate-need dispositions, provenance links, structured actor/action/object/
condition/threshold/unit fields, child requirements, version history, and
baseline comparison. The deterministic quality analyzer exposes rule IDs,
severity, trigger text, rationale, correction guidance, and persisted finding
dispositions. It is guidance, not a standards-compliance claim.

### SysML, UML, and SoSE

The practical subset includes requirements, blocks, parts, ports, interfaces,
activities, actions, states, transitions, packages, allocations, item flows,
actors, use cases, components, and shared SoSE elements. SoSE projections cover
missions, capabilities, constituent systems, ownership, independence,
interoperability, mission threads, shared risks, and explainable cascading
impact. The UI deliberately documents standards-complete semantics as future
work.

### Interactive graph and diagram design

Trace Explorer provides direction, depth, relationship, exclusion, and gap
filters plus keyboard-operable zoom, pan, neighbor expansion, isolation,
selected-node hiding, and reset. Diagram Studio stores canonical IDs,
relationships, profile, filters, layout, and positions as a saved perspective;
dragging and view removal do not delete model data. Canonical archive actions
show relationship impact before soft-archiving.

### Traceability and interoperability

Coverage metrics remain separate and expose numerator, denominator, definition,
and uncovered IDs. The relationship vocabulary contains 35 named kinds while
custom semantics remain portable. Mermaid is a constrained approximation layer
with line/column diagnostics, per-proposal acceptance, selected-model source
generation, fenced Markdown, `.mmd`, SVG, and PNG exports.

### Verification, change, and local-first persistence

Verification cases support eight methods, editable procedures and results,
evidence attachment, and canonical coverage updates. Impact analysis reports
paths, hop classification, verification gaps, allocations, proposals, and SoSE
cascades before a change request is applied. Baselines retain frozen artifacts,
relationships, histories, approval, and project framing in portable bundles.

### Accessibility, testing, and performance evidence

The repository currently has 21 Vitest tests, two Playwright workflows, and an
axe-based landing/workbench accessibility workflow. The full workflow covers
elicitation, requirement authoring, trace controls, exports, verification,
reviews, architecture views, impact, baselines, Mermaid import, and recovery.
The latest local production build reported approximately 355 kB JavaScript and
32 kB CSS before compression; those are build-output observations, not a
cross-device performance claim. Session timings cover project load, Mermaid,
PNG, and diagram exports. A repeatable large-table, query, and cancellation
benchmark is not yet implemented.

### Security, tradeoffs, results, and limitations

The guest model stays in the browser, imported bundles are validated and size
limited, filenames are sanitized, and Mermaid is parsed as a constrained
proposal rather than injected into the canonical model. The principal tradeoff
is a rich vertical slice in a small React monolith instead of prematurely
building server collaboration or a full standards editor. Actual evidence is
the runnable guest workflow, deterministic synthetic graph, tests, reports,
exports, and screenshots—not claims of users, revenue, certification, uptime,
or productivity gains.

The supplied owner logo was not present in the repository or attachments, so
the current branding assets are explicitly deterministic fallbacks. Full
standards-complete SysML/UML/SoSE authoring, virtualized large-model tables,
server collaboration, richer emergent-behavior analysis, and a repeatable
performance benchmark remain roadmap work. Lessons learned are captured in
the ADRs: preserve the canonical model, keep views inspectable, make local
changes reversible, and document every approximation honestly.
