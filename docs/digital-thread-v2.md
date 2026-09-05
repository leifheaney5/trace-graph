# Digital-thread intelligence v2

This document describes the deeper TraceGraph engineering-intelligence layer added on top of the existing canonical model. The implementation is intentionally local-first, deterministic, and inspectable.

It does not introduce a second engineering model.

## Architectural invariant

The source of truth remains the canonical `ProjectBundle` defined by `src/model.ts` and persisted through `BrowserProjectRepository` in `src/repository.ts`.

The v2 services in `src/digitalThread.ts` accept and return canonical bundle data. `src/DigitalThreadWorkbench.tsx` exposes those services in the UI. Accepted writes are persisted through the repository and the core workbench reloads from that repository.

`src/profiles.ts` remains the source of practical Core, SysML, UML, SoSE, and Custom projections. The v2 work does not create a competing architecture metamodel.

## Lifecycle, review, and version history

TraceGraph normalizes artifact lifecycle into:

**Draft → Proposed → In review → Approved → Superseded → Retired**

Allowed transitions are explicit. A transition records:

- actor;
- rationale;
- timestamp;
- updated lifecycle metadata;
- an immutable `ArtifactVersion` snapshot.

Review disposition is deliberately separate. `recordReviewDecision` creates a `ReviewSession` artifact and a canonical `reviews` relationship while preserving the target artifact's lifecycle state. This prevents “approved in review” from becoming an implicit overwrite of engineering history.

The same lifecycle service can be applied to requirements and canonical change requests.

## Version-aware evidence validity

Evidence validity has five states:

- `valid`
- `stale`
- `review-needed`
- `incomplete`
- `superseded`

The assessment follows canonical relationships from evidence back to its producing verification case and from that test to linked requirements. It then considers available metadata for:

- evidence production timestamp;
- captured requirement version;
- current canonical requirement version/history;
- baseline or configuration reference;
- reviewer and review state;
- verified state;
- supersession metadata.

A requirement version newer than the evidence context, or a requirement change after the evidence production timestamp, produces a stale structural state.

### Limitation

This is freshness and provenance analysis over recorded project data. It is not cryptographic attestation, independent laboratory validation, or proof that a physical test result is invalid. The appropriate action for stale evidence is engineering review and, where necessary, re-verification.

## Explainable impact

`explainImpact` performs directed traversal over canonical relationships. Every returned path preserves the relationship records used to justify the connection, including:

- relationship kind;
- rationale;
- confidence, when recorded;
- provenance/source, when recorded.

Impact signals remain separate:

- `direct`
- `transitive`
- `verification`
- `evidence`
- `evidence-stale`
- `baseline-divergence`
- `high-criticality`
- `unreviewed`

The UI therefore answers both **what is reachable?** and **why is it considered affected?** without inventing a combined risk score.

### Limitation

Traversal is structural and bounded for inspectability. It does not predict organizational, financial, schedule, safety, or mission impact beyond the canonical relationships represented in the bundle.

## Deterministic trace queries

The local query service supports constrained engineering questions such as:

- requirements without verification evidence;
- needs without an approved requirement;
- which artifacts are affected if a named requirement changes;
- tests that verify critical requirements;
- what changed between stored baselines;
- stale evidence;
- orphaned architecture artifacts;
- directed paths from one artifact ID to another.

Each result includes:

- the recognized query kind;
- a plain-language summary;
- the deterministic definition used;
- returned artifact IDs and paths;
- limitations.

Unsupported phrasing returns `unsupported` and suggests recognized examples. The service does not pass unknown questions to a generative fallback or fabricate a graph answer.

## Structured elicitation

`extractElicitationCandidates` converts plain source sentences into local candidate engineering records using explicit deterministic language rules. Candidate types include:

- Need
- Requirement
- Concern
- Assumption
- Constraint

Each candidate keeps:

- source artifact ID;
- exact source excerpt;
- candidate type;
- confidence label;
- extraction rationale;
- `Suggested — not canonical` state.

`acceptElicitationCandidate` is the explicit boundary that creates a canonical artifact and records source provenance. Until that action occurs, extraction does not change the project.

## Requirement quality

The existing artifact-level `qualityAnalysis` remains authoritative for individual deterministic requirement rules.

The v2 corpus layer adds review aids for:

- duplicate normalized requirement text;
- possible positive/negative obligation conflicts with substantial terminology overlap;
- undefined acronyms;
- selected inconsistent terminology.

These findings explain why they fired and suggest a review action.

### Limitation

Corpus rules are heuristics. They do not prove semantic equivalence, contradiction, or terminology identity. They identify records worth human review.

## Assistant suggestion boundary

The current assistant layer is deterministic and local. It emits typed proposal objects for cases such as:

- a structured requirement rewrite supported by existing fields;
- a verification-planning reminder for an unverified requirement;
- an evidence-refresh recommendation for structurally stale evidence;
- a conflict-review prompt from deterministic diagnostics.

Every suggestion includes:

- artifact ID;
- suggestion kind;
- title;
- rationale;
- proposal;
- limitation.

Assistant suggestions never mutate the canonical bundle automatically.

A future LLM provider should produce the same kind of typed proposal and remain behind the same explicit acceptance boundary. Adding a remote model would also require a new security/privacy review because source excerpts or engineering artifacts could leave the browser.

## Change requests

`createChangeRequest` creates a canonical `ChangeRequest` artifact containing:

- title;
- reason;
- originating artifact ID;
- explainably affected artifact IDs;
- proposed change text;
- reviewer list;
- target baseline context.

It also creates canonical relationships that preserve justification and the proposed affected-artifact set.

The affected set can be populated from explainable impact rather than an opaque computed score.

## Version-aware baselines

`createVersionedBaseline` snapshots:

- selected canonical artifacts;
- relationships among those artifacts;
- artifact-version history;
- relation history;
- project metadata;
- approver and approval time.

`baselineMembership` exposes the artifact version associated with the stored configuration. `compareBaselineToCurrent` reuses the canonical bundle comparison function to surface current divergence.

## Architecture projections

No new SysML/UML/SoSE authoring model was introduced. The existing projection definitions remain the architecture-view boundary. This preserves the important invariant:

**canonical artifacts and relationships → practical view projection**

not:

**diagram editor → separate hidden engineering truth**

## Browser integration

The **Thread intelligence** control opens a named modal workbench over the current repository state. Dense scrollable regions are keyboard focusable and labeled. Closing with **Apply & return to core views** causes the core application to reload from the repository so accepted changes are reflected in existing views.

## Automated evidence

`src/digitalThread.test.ts` exercises lifecycle, review separation, evidence freshness, explainable impact, deterministic queries, elicitation acceptance, change requests, version-aware baselines, corpus quality, and non-mutating assistant suggestions.

`tests/e2e/digital-thread-workbench.spec.ts` covers the interactive intelligence workflow and writes:

- `case-study-intelligence-overview.png`
- `case-study-intelligence-impact.png`
- `case-study-intelligence-query.png`
- `case-study-intelligence-evidence.png`
- `case-study-intelligence-elicitation.png`

`tests/e2e/accessibility.spec.ts` includes intelligence surfaces in the axe gate.

Run the complete validation sequence with:

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run test:accessibility
npm run build
```

Dependency audit is checked separately in CI.

## Remaining roadmap

The following remain intentionally outside the current implementation:

- standards-complete SysML/UML/SoSE semantics;
- a remote LLM provider and its deployment/privacy controls;
- semantic theorem-like contradiction detection;
- cryptographic evidence attestation or signing;
- multi-user server collaboration, authorization, and conflict resolution;
- large-model virtualization and measured cross-device performance benchmarking;
- production-grade controlled/regulated-data deployment boundaries.
