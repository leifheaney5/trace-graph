# TraceGraph One-Pager

## Make the digital thread inspectable

TraceGraph is a local-first requirements engineering and digital-thread workbench for turning stakeholder intent into traceable engineering evidence.

### The problem

Requirements work is often fragmented across notes, requirement databases, architecture diagrams, verification plans, evidence files, and review records. When something changes, engineers must reconstruct the reasoning chain manually:

- Where did this requirement come from?
- What does it allocate to?
- How is it verified?
- Is the supporting evidence still valid?
- What changes downstream if this artifact changes?
- Which reviewed baseline contains the current state?

### The TraceGraph approach

TraceGraph keeps those questions connected through one canonical workflow:

**stakeholder intent → elicitation → need → requirement → architecture → verification → evidence → change impact → baseline**

The interface exposes that thread as an inspectable workbench rather than collapsing engineering state into an opaque score.

### Core capabilities

- Guided onboarding with a restartable end-to-end workflow tour.
- Structured elicitation with source excerpts, confidence, rationale, and explicit acceptance into canonical data.
- Requirement authoring with metadata, quality findings, provenance, lifecycle, and version snapshots.
- Architecture allocation and practical SysML/UML/SoSE-oriented projections.
- Canonical trace exploration with relationship direction, rationale, confidence, provenance, review, and baseline context.
- Verification planning and requirement-to-evidence inspection.
- Evidence validity states for freshness, lineage, review, baseline context, and supersession.
- Explainable direct and transitive change-impact paths.
- Deterministic structural trace queries that refuse unsupported questions rather than inventing answers.
- Canonical change requests and version-aware named baselines.
- Local browser persistence behind a repository abstraction.

### Demo experience

The included deterministic **Emergency Response Drone** sample lets a reviewer explore the complete product without an account, proprietary data, or a remote service. The repository also includes a recorded browser walkthrough and thirteen deterministic screenshots.

### What differentiates TraceGraph

**Inspectability over dashboards.** Metrics and impact paths expose definitions and underlying records.

**Canonical model over disconnected views.** Specialist views project the same artifacts and relationships instead of becoming independent sources of truth.

**Evidence validity, not just evidence presence.** A connected record can still be stale, incomplete, review-needed, or superseded.

**Explainable impact, not black-box risk scoring.** Each structural consequence retains the relationship path that caused it.

**Local-first and deterministic.** The demo requires no remote model provider and uses synthetic seeded data for reproducible review.

### Intended audience

TraceGraph is suited to systems engineers, requirements engineers, technical leads, verification engineers, digital-engineering teams, and product teams that need an approachable way to inspect the reasoning chain behind engineering decisions.

### Scope boundaries

TraceGraph is not presented as certified enterprise MBSE tooling, a standards-complete SysML/UML editor, a customer deployment, or proof of productivity, compliance, revenue, or uptime. The included sample data is synthetic. Current standards-oriented views are practical projections over the canonical engineering model.
