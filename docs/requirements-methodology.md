# Requirements methodology

TraceGraph separates source notes, needs, and requirements. A requirement should identify a subject, use normative language, include measurable or otherwise testable conditions, and retain provenance. The structured builder persists actor, action, object, condition, threshold, and unit fields on the same canonical requirement and generates the sentence from them; users can still edit the resulting free-text statement. The quality analyzer is deterministic and explainable, with rule IDs, severity, triggering text, rationale, suggested corrections, and persisted Open/Accepted/Dismissed dispositions with dismissal rationale. Rules cover modal language, subjective and unbounded terms, missing structure, thresholds and units, provenance, verification, compound or passive phrasing, negative requirements, and implementation bias. It is guidance, not a standards-compliance claim.
TraceGraph preserves a practical requirement taxonomy in artifact metadata:
stakeholder, mission, business, system, subsystem, interface, functional,
performance, quality, safety, security, data, operational, support, regulatory,
and design constraints. The structured builder persists actor, action, object,
trigger, operating condition, threshold, unit, timing, tolerance, exception,
and rationale fields while still allowing direct statement editing.
