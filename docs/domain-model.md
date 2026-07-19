# Domain model

The canonical relationship vocabulary includes provenance, refinement,
decomposition, satisfaction, allocation, dependency, constraint, interface
and flow, verification, mitigation, conflict, lifecycle, realization,
enablement, and review semantics. Custom relationship kinds remain portable
when a project needs a profile-specific extension.

The canonical metamodel models project framing alongside stakeholder groups, source and interview records, needs, concerns, requirements, scenarios, blocks, components, interfaces, tests, results, evidence, risks, decisions, reviews, change requests, baselines, diagrams, reports, and UML interaction/structure elements such as classes, lifelines, messages, and deployment nodes. SoSE concern types include emergent behavior, evolution concern, interoperability concern, capability gap, and shared risk. SysML, UML, and SoSE views all use this shared artifact vocabulary; profile views do not create incompatible model stores.

Artifacts share optional maturity, ownership, priority, criticality, tags, source, dates, version, baseline, review, and audit metadata. Relationships carry semantic kinds such as `expresses`, `refines`, `decomposes`, `allocated-to`, `connects`, `verified-by`, and `produces`; they also support rationale, confidence, provenance, review, baseline, inference, and audit metadata. Each relationship receives a stable `REL-*` identity; legacy imports without IDs are deterministically canonicalized by position while new interactions assign explicit IDs. Each view uses canonical IDs so a trace path remains inspectable. Artifact removal is soft by default: archiving changes status while preserving identifiers and relationships, and restoration is available from the editor. Transactional model edits, imports, undo, and redo append bounded local audit records plus a persisted relationship delta ledger that are visible in Project Lifecycle.
