# TraceGraph Presenter Demo Script

## 2-minute version

### 0:00–0:20 — Frame the product

“TraceGraph is a local-first requirements engineering and digital-thread workbench. The core workflow is visible across the top: stakeholder intent, elicitation, need, requirement, architecture, verification, evidence, change impact, and baseline. Everything in this demo uses deterministic synthetic Emergency Response Drone data.”

### 0:20–0:45 — Requirement and provenance

Open the sample and navigate to **Requirements → REQ-042 Mission telemetry availability**.

“Here the requirement is not just a statement. It carries metadata, provenance, quality findings, lifecycle state, and version context. The important point is that the requirement stays connected to the rest of the engineering thread.”

### 0:45–1:05 — Traceability and verification

Move to **Traceability**, then **Verification**.

“The trace view shows canonical relationships instead of copying data into disconnected diagrams. Verification keeps the requirement-to-evidence chain inspectable so you can see what is supposed to verify the requirement and what evidence supports that result.”

### 1:05–1:35 — Thread intelligence

Open **Thread intelligence**, then show **Impact**, **Trace queries**, and **Evidence validity**.

“This is the deeper engineering-intelligence layer. Impact paths are structural and explainable: each consequence retains relationship direction, rationale, confidence, and provenance. Trace queries are deterministic and refuse unsupported questions. Evidence validity is separate from evidence presence, so connected evidence can still be stale, incomplete, review-needed, or superseded.”

### 1:35–1:55 — Elicitation and canonical acceptance

Open **Elicitation** and extract candidate records.

“Suggestions remain visibly non-canonical until a user explicitly accepts them. That boundary is deliberate: assistant or elicitation suggestions cannot silently become engineering truth.”

### 1:55–2:00 — Close

“TraceGraph is about making the digital thread inspectable: where information came from, how it is connected, what supports it, and what changes when one part of the system moves.”

---

## 5-minute extension

Add the following after the 2-minute path:

1. Run the core **Impact** simulation and compare it with the deeper explainable impact view.
2. Open **Baselines** and show version-aware comparison.
3. Return to **Overview** and show export options.
4. Explain the local-first persistence boundary and validated import behavior.
5. Call out scope explicitly: practical SysML/UML/SoSE projections, synthetic data, no customer/compliance/productivity claims.

## Presenter reminders

- Keep the “Synthetic demo” label visible whenever possible.
- Say “structural impact” rather than “predicted business impact.”
- Say “evidence validity assessment” rather than “certified evidence.”
- Say “practical projection” rather than “standards-complete SysML/UML editor.”
- Do not imply that deterministic suggestions are a remote LLM or autonomous canonical editor.
