# Changelog

## Unreleased

- Added the initial local-first TraceGraph vertical slice.
- Added provenance-preserving elicitation extraction into concerns, needs,
  assumptions, constraints, requirements, decisions, and action items.
- Added persistent elicitation session fields, stakeholder perspective metadata,
  requirement type selection, richer structured builders, arbitrary traceability
  matrices, and additional explainable quality rules.
- Added keyboard arrow alternatives for diagram positioning, approved/inferred
  trace filters, and persisted diagram descriptions, notes, and traversal depth.
- Added exact source-text selection for elicitation extraction without
  overwriting the original session note.
- Added canonical elicitation-to-need-to-requirement conversion with provenance.
- Added explicit architecture allocation and interface creation actions.
- Added evidence attachment and auditable change request application.
- Made UML and SoSE profile views derive nodes and relationship summaries from
  canonical artifacts.
- Added synthetic constituent-system ownership, authority, independence,
  lifecycle, availability, and dependency metadata.
- Added persisted light theme, startup theme hydration, print styling,
  reduced-motion behavior, and high-contrast focus treatment.
- Added named, scoped, approval-recorded baseline creation and
  cross-baseline comparison.
- Added an accessible trace-matrix relationship editor.
- Replaced Overview readiness and action counts with canonical, explainable
  coverage and quality calculations.
- Added session-local performance timing for project load and image/text
  exports without making cross-device performance claims.
- Added a 5 MB import limit, sanitized export filenames, and confirmation-gated
  local project deletion.
- Added trace artifact-type exclusions, saved trace perspectives, and a direct
  trace-to-diagram action.
- Made requirement digital-thread chips derive from canonical relationships
  instead of presentation-only sample labels.
- Added searchable glossary/help, persisted experience mode, keyboard undo and
  redo, restorable saved perspectives, configurable image export settings, and
  soft archive/restore for model artifacts.
- Added canonical stakeholder discovery, saved elicitation sessions, and
  explicit verification-method assignment with CSV export coverage.
- Added canonical UML actor-to-use-case links, editable SoSE constituent
  attributes, and derived SysML behavior summaries.
- Added a typed profile registry for SysML, UML, SoSE, Core TraceGraph, and
  Custom Diagram Studio projections over the canonical model.
- Expanded project framing with system boundary, outcomes, scope, assumptions,
  dependencies, milestones, and initial stakeholder context.
- Added explicit candidate-need dispositions with rationale capture and the
  complete verification-method vocabulary.
- Added reversible Trace Explorer graph controls for zoom, pan, neighbor
  expansion, subgraph isolation, selected-node hiding, and reset.
- Added selected-model Mermaid generation plus `.mmd`, Markdown, SVG, and PNG
  exports from the constrained Mermaid workspace.
- Added an explicit Diagram Studio archive-impact preview separate from
  remove-from-view behavior.
- Expanded requirement quality analysis with structured deterministic rules,
  severity, explanation, correction guidance, and persisted dispositions.
- Added a 35-kind canonical relationship vocabulary to the relationship
  editors while preserving extensible custom semantics.
- Extended the guest workflow coverage to exercise candidate-need disposition,
  quality-finding dismissal, and rationale persistence paths.
- Completed the profile registry contract with fields, allowed connections,
  validation rules, notation, export mappings, and contextual help metadata.
- Persisted Diagram Studio perspectives inside validated project bundles so
  export/import and IndexedDB hydration retain saved canonical views.
- Exposed the retained local audit trail in Project Lifecycle and recorded
  undo/redo transactions as auditable model actions.
- Added persisted project framing for name, mission, problem statement, owner,
  and model version, including bundle and baseline round trips.
- Replaced hop-count-only impact summaries with deterministic path,
  direct/indirect/SoS classification, verification-gap, allocation, and
  proposal-quality analysis plus scoped Mermaid export.
- Added a technical Reviews workspace with session creation, disposition,
  chair/date fields, canonical reviewed-artifact links, and completion state.
- Added deterministic Trace Explorer diagnostics for orphan artifacts,
  duplicate relationships, directed cycles, and conflicting requirement
  statements.
- Added Core TraceGraph and named Custom diagram profiles over the shared
  canonical metamodel.
- Added stable canonical relationship IDs to model persistence, diagrams, and
  traceability exports, with deterministic legacy-import canonicalization.
- Expanded Diagram Studio canonical element creation beyond blocks to practical
  SysML/UML/SoSE subset elements such as parts, ports, activities, states,
  packages, and mission threads.
- Added endpoint-aware semantic validation for recognized canonical relationship
  kinds across form and Mermaid relationship creation.
- Added persisted Diagram Studio element filters and an accessible textual
  alternative that retains canonical artifact and relationship identities.
- Added SoSE architecture view switching for context, capability allocation,
  operational dependencies, interoperability, and mission-thread projections.
- Added UML view switching for use case, class, component, deployment, sequence,
  and state-machine projections over the shared canonical model.
- Added SysML view switching for requirements, block definition, internal block,
  activity, sequence, state, allocation, and context projections.
- Added persisted relationship history with added/removed canonical link deltas
  across transactions, imports, baselines, exports, and lifecycle review.
- Added a browser unload warning during the autosave window for unsaved model
  and project-framing changes.
- Added a debounced global artifact search for responsive large-model filtering.
- Added landing-page Import project and View documentation entry points wired to
  the validated importer and searchable help drawer.
- Added per-relationship acceptance controls to the Mermaid-to-model proposal
  workflow so imported links are never applied as an unreviewed batch.
- Bounded full-graph SVG layout into a rasterizable grid and added 4x plus
  transparent-background PNG export options.
- Expanded the canonical artifact vocabulary and relationship metadata surface
  for source, ownership, maturity, review, confidence, provenance, and baseline
  context across future profile extensions.
- Added direct clipboard export for fenced Mermaid Markdown alongside source
  copying and Markdown download.
- Added Mermaid editor templates, live validation counts, and synchronized
  source preview while retaining explicit transactional import approval.
- Added line and column diagnostics for unsupported or invalid Mermaid import
  syntax.
- Added a rendered SVG Mermaid approximation beside the live source preview,
  with explicit labeling that it is not formal notation.
- Updated Diagram Studio architecture documentation to reflect persisted layout
  modes and selected-perspective exports.
- Added a SoSE Cascading impact view that follows constituent-system dependency
  links into affected capabilities and missions.
- Exposed canonical artifact maturity, ownership, criticality, provenance,
  review, baseline, and tag metadata in the requirement editor.
- Added canonical added/removed/modified artifact and relationship details to
  the validated project-import preview.
- Reserved first-class vocabulary values for baselines, diagrams, reports, and
  additional SoSE operational and concern artifacts in the shared metamodel.
- Added a portable JSON baseline-comparison package export containing both
  snapshots and the canonical diff.
- Added relationship rationale, confidence, and review-status controls to the
  canonical requirement link editor.
- Added deterministic Grid, Hierarchy, Force simulation, and Trace path
  layouts to Diagram Studio with saved perspective persistence.
- Added selected-perspective SVG and PNG exports from Diagram Studio using the
  same canonical artifacts and relationship IDs as the visual view.
- Added browser-safe raster bounds for oversized full-graph PNG requests while
  retaining lossless full-content SVG export.
