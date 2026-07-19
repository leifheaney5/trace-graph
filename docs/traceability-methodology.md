# Traceability methodology

Relationships are first-class canonical records with semantic kinds. The trace explorer follows a concrete path from stakeholder through need, requirement, block, interface, test, and evidence. Every displayed path is explainable by the relationship records behind it.

The trace metrics remain separate rather than collapsing into one readiness score. The current implementation reports need-to-requirement, requirement-to-component, requirement-to-test, test-to-evidence, and requirement-decomposition coverage. Each metric exposes its numerator, denominator, definition, and uncovered artifact IDs. The trace explorer supports direction, depth, relationship-kind, verified-path, and artifact-type exclusion filters, plus local saved trace perspectives and a direct create-diagram action. The trace matrix also provides an accessible relationship editor so matrix changes use the same audited canonical transaction as other views.

The Trace Explorer also runs deterministic model diagnostics over the canonical graph. It reports orphan artifacts, duplicate relationship records, directed cycles, and conflicting requirements that share a normalized name but have different descriptions. Findings expose the affected IDs or cycle path so reviewers can inspect and resolve the underlying model records rather than relying on an opaque score.
Trace Explorer supports directional, depth, relationship-kind, artifact-type,
and verification-gap filtering. Its view-only graph workspace provides
keyboard-operable zoom, pan, neighbor expansion, subgraph isolation, selected
node hiding, and reset controls; these manipulate the perspective without
deleting canonical artifacts. The selected path remains available as a textual
relationship summary and can seed Diagram Studio.
The Traceability workspace supports arbitrary row and column artifact types.
Empty matrix cells create canonical relationships through the same validation
and audit path as the inspector; populated cells select the source artifact
for relationship inspection. Trace filters can distinguish verified paths,
approved relationships, and inferred relationships.
