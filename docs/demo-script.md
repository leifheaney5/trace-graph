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

## 9. Open the engineering-intelligence workbench

1. Select **Thread intelligence**.
2. Confirm the header still shows **Synthetic demo** and **Local-first**.
3. On **Thread health**, compare approved requirements, verification linkage, evidence validity, stored baselines, quality findings, and assistant suggestions.

Expected result: each engineering signal has its own count or numerator/denominator. There is no combined opaque readiness score.

## 10. Inspect explainable change impact

1. Select **Impact** in the intelligence workbench.
2. Choose `REQ-042` as the root artifact.
3. Review direct and transitive counts separately.
4. Inspect a path into verification or evidence.
5. Read the relationship kind, rationale, confidence, and provenance shown for each edge.

Expected result: TraceGraph explains why an artifact is considered affected rather than returning an unexplained impact score.

## 11. Run deterministic trace queries

1. Select **Trace queries**.
2. Run **show every path from REQ-042 to EVD-017**.
3. Try another preset such as requirements without verification evidence or stale evidence.
4. Enter an unsupported question if desired.

Expected result: supported questions are translated into deterministic graph operations. Unsupported questions are explicitly rejected instead of being answered speculatively.

## 12. Review evidence validity

1. Select **Evidence validity**.
2. Inspect the states: valid, stale, review-needed, incomplete, and superseded.
3. Read the linked requirement/test lineage, baseline reference, and reason column.

Expected result: connected evidence is not automatically treated as current or reusable. Structural freshness and provenance remain inspectable.

## 13. Review elicitation suggestions

1. Select **Elicitation** in Thread intelligence.
2. Use the provided synthetic source excerpt or enter another deterministic note.
3. Select **Extract candidate engineering records**.
4. Confirm every item is labeled **SUGGESTED · NOT CANONICAL**.
5. Accept one candidate if demonstrating the write path.
6. Select **Apply & return to core views**.

Expected result: the candidate enters the canonical repository only after explicit acceptance, and the core workbench reloads from that repository.

## 14. Review controlled lifecycle and change management

1. Reopen **Thread intelligence** and select **Change & baselines**.
2. Select a requirement or change request.
3. Review its lifecycle state, review disposition, and canonical version history separately.
4. Record a review decision or move through an allowed lifecycle transition.
5. Create a change request from explainable impact.
6. Create a version-aware baseline snapshot.

Expected result: lifecycle, approval, change rationale, affected artifacts, and baseline membership remain separate inspectable records.

## 15. Review assistant suggestions

1. Select **Assistant suggestions**.
2. Inspect proposed requirement rewrites, verification planning, evidence refresh, or conflict-review prompts.
3. Read each proposal's rationale and limitation.

Expected result: the assistant layer remains a proposal layer. It cannot silently mutate canonical artifacts.

## Restart the guided path

Select **Restart digital-thread tour** at any point. The restart control reuses the built-in guided tour and does not create a second project model.

## Reproduce the case-study screenshots

Run the full browser suite:

```bash
npm run test:e2e
```

The original case-study flow writes eight deterministic captures. The engineering-intelligence flow writes five additional captures, for 13 `docs/screenshots/case-study-*.png` images in total.

To run only the deeper intelligence flow:

```bash
npx playwright test tests/e2e/digital-thread-workbench.spec.ts
```
