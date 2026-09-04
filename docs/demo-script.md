# TraceGraph reproducible demo script

Use the deterministic **Emergency Response Drone** sample. The walkthrough is designed to show one complete digital thread rather than a collection of disconnected screens.

## 1. Establish the product boundary

1. Open the application.
2. Confirm the case-study chrome shows **Synthetic demo**, **Local-first**, and **Canonical model**.
3. Read the persistent workflow rail from **Stakeholder intent** through **Baseline**.
4. Select **Open sample project** or **Explore sample**.

Expected result: the Emergency Response Drone workspace opens without an account or remote project service.

## 2. Follow stakeholder intent into a requirement

1. Select **Elicitation**.
2. Inspect the source notes, stakeholder, and provenance fields.
3. Review or accept a candidate need.
4. Convert the need to a requirement.
5. Open `REQ-042 Mission telemetry availability`.

Expected result: the requirement remains connected to upstream provenance rather than becoming an isolated text record.

## 3. Inspect requirement quality

1. Review the requirement statement and structured fields.
2. Inspect quality findings, their rule identifiers, rationale, and correction guidance.
3. Review owner, tags, rationale, allocation, and version history.

Expected result: quality guidance is explainable and reviewable; it is not presented as standards certification.

## 4. Inspect architecture and traceability

1. Select **Architecture** and inspect the allocation for `REQ-042`.
2. Switch among the practical SysML/UML/SoSE projections as desired.
3. Select **Traceability**.
4. Select `REQ-042`, change direction/depth/relationship filters, and inspect the graph plus its tabular alternative.

Expected result: profile views and diagrams retain canonical IDs and relationships.

## 5. Follow verification into evidence

1. Select **Verification**.
2. Inspect the requirement-to-evidence matrix.
3. Review the verification method, owner, procedure/result fields, and attached evidence.
4. Compare the displayed coverage definitions and counts.

Expected result: verification planning and evidence remain distinguishable and traceable.

## 6. Simulate change before applying it

1. Return to `REQ-042` if needed.
2. Select **Impact**.
3. Run **Run impact simulation**.
4. Inspect direct/indirect paths, affected artifacts, proposal consequences, allocations, and verification implications.

Expected result: the user can inspect consequences before creating or applying a change request.

## 7. Compare baselines

1. Select **Baselines**.
2. Inspect the existing synthetic baselines.
3. Review **Compare baselines**, recent model changes, and canonical link changes.

Expected result: baseline state is a frozen, named engineering configuration with inspectable differences.

## 8. Export evidence

1. Open **Overview** or the global export controls.
2. Review the export title, PNG bounds/background, and legend options.
3. Export Mermaid, SVG/PNG, CSV, Markdown/HTML, or JSON as appropriate.

Expected result: exports are generated from canonical project data. Mermaid import remains a constrained proposal flow rather than executable model input.

## Restart the guided path

Select **Restart digital-thread tour** at any point. The restart control reuses the built-in guided tour and does not create a second project model.

## Reproduce the case-study screenshots

Run:

```bash
npm run test:e2e -- tests/e2e/case-study-screenshots.spec.ts
```

The test writes the eight deterministic `docs/screenshots/case-study-*.png` captures used for the portfolio evidence flow.
