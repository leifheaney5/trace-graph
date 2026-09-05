import { useEffect, useMemo, useRef, useState } from "react";
import {
  TRACE_QUERY_EXAMPLES,
  acceptElicitationCandidate,
  assessEvidenceValidity,
  assistantSuggestions,
  baselineMembership,
  compareBaselineToCurrent,
  corpusQualityFindings,
  createChangeRequest,
  createVersionedBaseline,
  explainImpact,
  extractElicitationCandidates,
  latestArtifactVersion,
  lifecycleState,
  recordReviewDecision,
  requirementQualityReport,
  runTraceQuery,
  transitionArtifactLifecycle,
} from "./digitalThread";
import type {
  ElicitationCandidate,
  LifecycleState,
  TraceQueryResult,
} from "./digitalThread";
import type { Artifact, ProjectBundle } from "./model";
import { BrowserProjectRepository } from "./repository";

const repository = new BrowserProjectRepository();

type Tab =
  | "overview"
  | "impact"
  | "query"
  | "evidence"
  | "elicitation"
  | "quality"
  | "change"
  | "assistant";

const tabs: { id: Tab; label: string }[] = [
  { id: "overview", label: "Thread health" },
  { id: "impact", label: "Impact" },
  { id: "query", label: "Trace queries" },
  { id: "evidence", label: "Evidence validity" },
  { id: "elicitation", label: "Elicitation" },
  { id: "quality", label: "Requirement quality" },
  { id: "change", label: "Change & baselines" },
  { id: "assistant", label: "Assistant suggestions" },
];

const exampleElicitation = `The emergency coordinator needs continuous awareness of drone position during an active response. The system must report telemetry loss within five seconds. Operators are concerned that stale location data could be mistaken for a current position. Assume the response network remains available for the nominal mission. The aircraft must not transmit mission telemetry to an unauthorized console.`;

function artifactLabel(artifact: Artifact) {
  return `${artifact.id} · ${artifact.name}`;
}

function statusClass(value: string) {
  return `dt-status dt-status--${value.replace(/[^a-z]+/gi, "-").toLowerCase()}`;
}

function metricPercent(numerator: number, denominator: number) {
  return denominator ? Math.round((numerator / denominator) * 100) : 0;
}

export default function DigitalThreadWorkbench() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");
  const [bundle, setBundle] = useState<ProjectBundle>(() => repository.load());
  const [notice, setNotice] = useState("Canonical local repository loaded.");
  const closeRef = useRef<HTMLButtonElement>(null);

  const requirements = useMemo(
    () =>
      bundle.artifacts.filter((artifact) => artifact.type === "Requirement"),
    [bundle.artifacts],
  );
  const lifecycleArtifacts = useMemo(
    () =>
      bundle.artifacts.filter((artifact) =>
        ["Requirement", "ChangeRequest"].includes(artifact.type),
      ),
    [bundle.artifacts],
  );
  const evidence = useMemo(
    () =>
      bundle.artifacts.filter(
        (artifact) =>
          artifact.type === "Evidence" || artifact.type === "EvidenceArtifact",
      ),
    [bundle.artifacts],
  );

  const [impactRootId, setImpactRootId] = useState("REQ-042");
  const [queryText, setQueryText] = useState<string>(TRACE_QUERY_EXAMPLES[0]);
  const [queryResult, setQueryResult] = useState<TraceQueryResult | null>(null);
  const [sourceId, setSourceId] = useState("ELC-001");
  const [elicitationText, setElicitationText] = useState(exampleElicitation);
  const [candidates, setCandidates] = useState<ElicitationCandidate[]>([]);
  const [qualityId, setQualityId] = useState("REQ-042");
  const [lifecycleId, setLifecycleId] = useState("REQ-042");
  const [reviewer, setReviewer] = useState("Local engineering reviewer");
  const [reviewRationale, setReviewRationale] = useState(
    "Reviewed against the current mission need, allocation, and verification intent.",
  );
  const [changeTitle, setChangeTitle] = useState(
    "Telemetry requirement update",
  );
  const [changeReason, setChangeReason] = useState(
    "Mission feedback requires a review of telemetry timing and downstream evidence.",
  );
  const [changeProposal, setChangeProposal] = useState(
    "Review REQ-042 timing, affected architecture allocations, verification cases, and evidence before the next baseline.",
  );
  const [baselineName, setBaselineName] = useState(
    "Engineering Review Baseline",
  );

  useEffect(() => {
    const handleOpen = () => {
      setBundle(repository.load());
      setOpen(true);
      setNotice(
        "Canonical local repository refreshed from the core workbench.",
      );
    };
    window.addEventListener("tracegraph:open-intelligence", handleOpen);
    return () =>
      window.removeEventListener("tracegraph:open-intelligence", handleOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeWorkbench();
    };
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [open]);

  const save = (next: ProjectBundle, message: string) => {
    repository.save(next);
    setBundle(next);
    setNotice(message);
  };

  const closeWorkbench = () => {
    setOpen(false);
    window.dispatchEvent(new Event("tracegraph:reload-core"));
  };

  const impact = useMemo(() => {
    try {
      return explainImpact(impactRootId, bundle);
    } catch {
      return null;
    }
  }, [bundle, impactRootId]);

  const evidenceRows = useMemo(
    () =>
      evidence.map((artifact) => ({
        artifact,
        validity: assessEvidenceValidity(artifact, bundle),
      })),
    [bundle, evidence],
  );
  const validEvidence = evidenceRows.filter(
    (item) => item.validity.status === "valid",
  ).length;
  const staleEvidence = evidenceRows.filter(
    (item) => item.validity.status === "stale",
  ).length;
  const incompleteEvidence = evidenceRows.filter(
    (item) => item.validity.status === "incomplete",
  ).length;

  const approvedRequirements = requirements.filter(
    (artifact) => lifecycleState(artifact) === "Approved",
  ).length;
  const verifiedRequirements = requirements.filter((artifact) =>
    bundle.relations.some(
      (relation) =>
        relation.from === artifact.id && relation.kind === "verified-by",
    ),
  ).length;
  const qualityFindingsCount = requirements.reduce(
    (total, artifact) => total + requirementQualityReport(artifact).length,
    0,
  );
  const corpusFindings = useMemo(() => corpusQualityFindings(bundle), [bundle]);
  const suggestions = useMemo(() => assistantSuggestions(bundle), [bundle]);

  const selectedQualityArtifact =
    requirements.find((artifact) => artifact.id === qualityId) ||
    requirements[0];
  const selectedLifecycleArtifact =
    lifecycleArtifacts.find((artifact) => artifact.id === lifecycleId) ||
    lifecycleArtifacts[0];
  const selectedQualityFindings = selectedQualityArtifact
    ? requirementQualityReport(selectedQualityArtifact)
    : [];

  const latestBaseline = useMemo(
    () =>
      [...(bundle.baselines || [])].sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      )[0],
    [bundle.baselines],
  );
  const baselineDiff = latestBaseline
    ? compareBaselineToCurrent(bundle, latestBaseline)
    : null;

  const runQuery = () => setQueryResult(runTraceQuery(queryText, bundle));

  const acceptCandidate = (candidate: ElicitationCandidate) => {
    const next = acceptElicitationCandidate(
      bundle,
      candidate,
      reviewer || "Local reviewer",
    );
    save(
      next,
      `${candidate.id} accepted into the canonical project. Core views will refresh when this workbench closes.`,
    );
    setCandidates((current) =>
      current.filter((item) => item.id !== candidate.id),
    );
  };

  const applyLifecycle = (nextState: LifecycleState) => {
    if (!selectedLifecycleArtifact) return;
    try {
      const next = transitionArtifactLifecycle(
        bundle,
        selectedLifecycleArtifact.id,
        nextState,
        reviewer,
        reviewRationale,
      );
      save(
        next,
        `${selectedLifecycleArtifact.id} moved to ${nextState}; a canonical version snapshot was recorded.`,
      );
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Lifecycle transition failed.",
      );
    }
  };

  const recordReview = () => {
    if (!selectedLifecycleArtifact) return;
    const next = recordReviewDecision(bundle, {
      artifactId: selectedLifecycleArtifact.id,
      reviewer,
      disposition: "Approved",
      rationale: reviewRationale,
    });
    save(
      next,
      `Review decision recorded separately from ${selectedLifecycleArtifact.id}'s lifecycle state.`,
    );
  };

  const addChangeRequest = () => {
    if (!selectedLifecycleArtifact) return;
    const affected = explainImpact(selectedLifecycleArtifact.id, bundle)
      .entries.slice(0, 20)
      .map((entry) => entry.artifact.id);
    const next = createChangeRequest(bundle, {
      title: changeTitle,
      reason: changeReason,
      originatingArtifactId: selectedLifecycleArtifact.id,
      affectedArtifactIds: affected,
      proposedChanges: changeProposal,
      reviewers: [reviewer],
      targetBaselineId: latestBaseline?.id,
    });
    save(
      next,
      `Change request created with ${affected.length} explainably affected artifacts attached.`,
    );
  };

  const addBaseline = () => {
    const next = createVersionedBaseline(bundle, {
      name: `${baselineName} ${(bundle.baselines || []).length + 1}`,
      approvedBy: reviewer,
    });
    save(
      next,
      "Version-aware baseline snapshot created from the canonical bundle.",
    );
  };

  if (!open) {
    return (
      <button
        type="button"
        className="dt-launcher"
        onClick={() => {
          setBundle(repository.load());
          setOpen(true);
        }}
      >
        Thread intelligence
      </button>
    );
  }

  return (
    <div className="dt-backdrop">
      <section
        className="dt-workbench"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dt-title"
      >
        <header className="dt-header">
          <div>
            <span className="dt-kicker">
              TRACEGRAPH · INSPECTABLE DIGITAL THREAD
            </span>
            <h2 id="dt-title">Engineering intelligence workbench</h2>
            <p>
              Deterministic analysis over the canonical local project.
              Suggestions remain non-canonical until explicitly accepted.
            </p>
          </div>
          <div className="dt-header__controls">
            <span className="dt-chip">Synthetic demo</span>
            <span className="dt-chip">Local-first</span>
            <button ref={closeRef} type="button" onClick={closeWorkbench}>
              Apply & return to core views
            </button>
          </div>
        </header>

        <div className="dt-notice" role="status" aria-live="polite">
          {notice}
        </div>

        <nav className="dt-tabs" aria-label="Engineering intelligence sections">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              className={tab === item.id ? "is-active" : ""}
              aria-current={tab === item.id ? "page" : undefined}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <main
          className="dt-content"
          tabIndex={0}
          aria-label="Engineering intelligence content"
        >
          {tab === "overview" && (
            <section aria-labelledby="dt-overview-title">
              <div className="dt-section-heading">
                <div>
                  <span className="dt-kicker">THREAD HEALTH</span>
                  <h3 id="dt-overview-title">Inspectable engineering state</h3>
                </div>
                <p>
                  Counts stay separate. No opaque readiness score collapses
                  lifecycle, verification, evidence validity, or quality into
                  one number.
                </p>
              </div>
              <div className="dt-metrics">
                <article>
                  <span>Approved requirements</span>
                  <strong>
                    {approvedRequirements}/{requirements.length}
                  </strong>
                  <small>
                    {metricPercent(approvedRequirements, requirements.length)}%
                    · normalized lifecycle state
                  </small>
                </article>
                <article>
                  <span>Verification linkage</span>
                  <strong>
                    {verifiedRequirements}/{requirements.length}
                  </strong>
                  <small>
                    Requirements with an outgoing verified-by relationship
                  </small>
                </article>
                <article>
                  <span>Valid evidence</span>
                  <strong>
                    {validEvidence}/{evidence.length}
                  </strong>
                  <small>
                    {staleEvidence} stale · {incompleteEvidence} incomplete
                  </small>
                </article>
                <article>
                  <span>Stored baselines</span>
                  <strong>{(bundle.baselines || []).length}</strong>
                  <small>Immutable local snapshots with version history</small>
                </article>
                <article>
                  <span>Open quality findings</span>
                  <strong>
                    {qualityFindingsCount + corpusFindings.length}
                  </strong>
                  <small>
                    {qualityFindingsCount} artifact rules ·{" "}
                    {corpusFindings.length} corpus rules
                  </small>
                </article>
                <article>
                  <span>Assistant suggestions</span>
                  <strong>{suggestions.length}</strong>
                  <small>
                    Proposal layer only; zero are canonical automatically
                  </small>
                </article>
              </div>

              <div className="dt-callout">
                <strong>Product boundary</strong>
                <p>
                  TraceGraph is an inspectable requirements and digital-thread
                  workbench. SysML/UML/SoSE views remain practical projections,
                  not standards certification. The synthetic sample is not
                  customer evidence.
                </p>
              </div>
            </section>
          )}

          {tab === "impact" && (
            <section aria-labelledby="dt-impact-title">
              <div className="dt-section-heading">
                <div>
                  <span className="dt-kicker">EXPLAINABLE CHANGE IMPACT</span>
                  <h3 id="dt-impact-title">
                    Follow the reason for every consequence
                  </h3>
                </div>
                <label>
                  Root artifact
                  <select
                    value={impactRootId}
                    onChange={(event) => setImpactRootId(event.target.value)}
                  >
                    {bundle.artifacts
                      .filter((artifact) =>
                        [
                          "Requirement",
                          "Need",
                          "Block",
                          "ChangeRequest",
                        ].includes(artifact.type),
                      )
                      .slice(0, 400)
                      .map((artifact) => (
                        <option key={artifact.id} value={artifact.id}>
                          {artifactLabel(artifact)}
                        </option>
                      ))}
                  </select>
                </label>
              </div>
              {impact && (
                <>
                  <div className="dt-metrics dt-metrics--impact">
                    <article>
                      <span>Direct</span>
                      <strong>{impact.totals.direct}</strong>
                      <small>Exactly one directed relationship hop</small>
                    </article>
                    <article>
                      <span>Transitive</span>
                      <strong>{impact.totals.transitive}</strong>
                      <small>Two or more directed relationship hops</small>
                    </article>
                    <article>
                      <span>Verification</span>
                      <strong>{impact.totals.verification}</strong>
                      <small>Verification artifacts reached downstream</small>
                    </article>
                    <article>
                      <span>Evidence at risk</span>
                      <strong>{impact.totals.evidence}</strong>
                      <small>
                        Connected evidence requiring review after the change
                      </small>
                    </article>
                    <article>
                      <span>Baseline divergence</span>
                      <strong>{impact.totals["baseline-divergence"]}</strong>
                      <small>
                        Current artifacts differ from latest stored snapshot
                      </small>
                    </article>
                  </div>
                  <div className="dt-impact-list">
                    {impact.entries.slice(0, 40).map((entry) => (
                      <article key={entry.artifact.id}>
                        <div className="dt-card-heading">
                          <div>
                            <strong>{artifactLabel(entry.artifact)}</strong>
                            <span>
                              {entry.hops} hop{entry.hops === 1 ? "" : "s"}
                            </span>
                          </div>
                          <div className="dt-signal-list">
                            {entry.signals.map((signal) => (
                              <span key={signal}>{signal}</span>
                            ))}
                          </div>
                        </div>
                        <ol className="dt-edge-path">
                          {entry.edges.map((edge) => (
                            <li key={`${edge.from}-${edge.kind}-${edge.to}`}>
                              <code>{edge.from}</code>
                              <span>—{edge.kind}→</span>
                              <code>{edge.to}</code>
                              <small>
                                {edge.rationale} · confidence: {edge.confidence}{" "}
                                · source: {edge.provenance}
                              </small>
                            </li>
                          ))}
                        </ol>
                      </article>
                    ))}
                  </div>
                  <div className="dt-limitations">
                    {impact.limitations.map((limitation) => (
                      <p key={limitation}>{limitation}</p>
                    ))}
                  </div>
                </>
              )}
            </section>
          )}

          {tab === "query" && (
            <section aria-labelledby="dt-query-title">
              <div className="dt-section-heading">
                <div>
                  <span className="dt-kicker">DETERMINISTIC TRACE QUERY</span>
                  <h3 id="dt-query-title">
                    Ask structural questions without inventing an answer
                  </h3>
                </div>
              </div>
              <div
                className="dt-query-presets"
                aria-label="Trace query examples"
              >
                {TRACE_QUERY_EXAMPLES.map((example) => (
                  <button
                    type="button"
                    key={example}
                    onClick={() => {
                      setQueryText(example);
                      setQueryResult(runTraceQuery(example, bundle));
                    }}
                  >
                    {example}
                  </button>
                ))}
              </div>
              <div className="dt-query-box">
                <label htmlFor="dt-query-input">Engineering question</label>
                <input
                  id="dt-query-input"
                  value={queryText}
                  onChange={(event) => setQueryText(event.target.value)}
                />
                <button type="button" onClick={runQuery}>
                  Run deterministic query
                </button>
              </div>
              {queryResult && (
                <article className="dt-query-result">
                  <span className={statusClass(queryResult.kind)}>
                    {queryResult.kind}
                  </span>
                  <h4>{queryResult.summary}</h4>
                  <p>{queryResult.definition}</p>
                  {queryResult.artifactIds.length > 0 && (
                    <div className="dt-id-grid">
                      {queryResult.artifactIds.slice(0, 100).map((id) => (
                        <code key={id}>{id}</code>
                      ))}
                    </div>
                  )}
                  {queryResult.paths.length > 0 && (
                    <ol className="dt-path-results">
                      {queryResult.paths.slice(0, 25).map((path, index) => (
                        <li key={`${path.join("-")}-${index}`}>
                          {path.join(" → ")}
                        </li>
                      ))}
                    </ol>
                  )}
                  <div className="dt-limitations">
                    {queryResult.limitations.map((limitation) => (
                      <p key={limitation}>{limitation}</p>
                    ))}
                  </div>
                </article>
              )}
            </section>
          )}

          {tab === "evidence" && (
            <section aria-labelledby="dt-evidence-title">
              <div className="dt-section-heading">
                <div>
                  <span className="dt-kicker">EVIDENCE VALIDITY</span>
                  <h3 id="dt-evidence-title">Existence is not validity</h3>
                </div>
                <p>
                  Evidence is checked against producing tests, linked
                  requirements, canonical version history, baseline references,
                  review state, and supersession metadata.
                </p>
              </div>
              <div className="dt-metrics">
                {(
                  [
                    "valid",
                    "stale",
                    "review-needed",
                    "incomplete",
                    "superseded",
                  ] as const
                ).map((status) => (
                  <article key={status}>
                    <span>{status}</span>
                    <strong>
                      {
                        evidenceRows.filter(
                          (item) => item.validity.status === status,
                        ).length
                      }
                    </strong>
                    <small>of {evidenceRows.length} evidence records</small>
                  </article>
                ))}
              </div>
              <div
                className="dt-table-wrap"
                tabIndex={0}
                role="region"
                aria-label="Evidence validity table"
              >
                <table className="dt-table">
                  <thead>
                    <tr>
                      <th>Evidence</th>
                      <th>Validity</th>
                      <th>Lineage</th>
                      <th>Baseline</th>
                      <th>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evidenceRows.slice(0, 80).map(({ artifact, validity }) => (
                      <tr key={artifact.id}>
                        <td>
                          <strong>{artifact.id}</strong>
                          <span>{artifact.name}</span>
                        </td>
                        <td>
                          <span className={statusClass(validity.status)}>
                            {validity.status}
                          </span>
                        </td>
                        <td>
                          <small>
                            req: {validity.requirementIds.join(", ") || "—"}
                            <br />
                            test: {validity.testIds.join(", ") || "—"}
                          </small>
                        </td>
                        <td>{validity.baselineReference || "—"}</td>
                        <td>{validity.reasons.join(" ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {tab === "elicitation" && (
            <section aria-labelledby="dt-elicitation-title">
              <div className="dt-section-heading">
                <div>
                  <span className="dt-kicker">PROGRESSIVE FORMALIZATION</span>
                  <h3 id="dt-elicitation-title">
                    Turn source language into reviewable candidates
                  </h3>
                </div>
                <p>
                  Extraction is deterministic and local. Candidate artifacts are
                  visibly suggestions and are not written to the canonical model
                  until accepted.
                </p>
              </div>
              <div className="dt-form-grid">
                <label>
                  Source artifact ID
                  <input
                    value={sourceId}
                    onChange={(event) => setSourceId(event.target.value)}
                  />
                </label>
                <label className="dt-form-grid__wide">
                  Meeting note / interview / source excerpt
                  <textarea
                    rows={7}
                    value={elicitationText}
                    onChange={(event) => setElicitationText(event.target.value)}
                  />
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setCandidates(
                      extractElicitationCandidates(elicitationText, sourceId),
                    )
                  }
                >
                  Extract candidate engineering records
                </button>
              </div>
              <div className="dt-candidate-list">
                {candidates.map((candidate) => (
                  <article key={candidate.id}>
                    <div className="dt-card-heading">
                      <div>
                        <span className="dt-suggestion-label">
                          SUGGESTED · NOT CANONICAL
                        </span>
                        <strong>{candidate.artifact.type}</strong>
                      </div>
                      <span>{candidate.confidence} confidence</span>
                    </div>
                    <blockquote>{candidate.sourceExcerpt}</blockquote>
                    <p>{candidate.rationale}</p>
                    <button
                      type="button"
                      onClick={() => acceptCandidate(candidate)}
                    >
                      Accept into canonical thread
                    </button>
                  </article>
                ))}
              </div>
            </section>
          )}

          {tab === "quality" && (
            <section aria-labelledby="dt-quality-title">
              <div className="dt-section-heading">
                <div>
                  <span className="dt-kicker">REQUIREMENT QUALITY</span>
                  <h3 id="dt-quality-title">
                    Show why a rule fired and how to repair it
                  </h3>
                </div>
                <label>
                  Requirement
                  <select
                    value={qualityId}
                    onChange={(event) => setQualityId(event.target.value)}
                  >
                    {requirements.map((artifact) => (
                      <option key={artifact.id} value={artifact.id}>
                        {artifactLabel(artifact)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {selectedQualityArtifact && (
                <article className="dt-requirement-inspector">
                  <div>
                    <code>{selectedQualityArtifact.id}</code>
                    <h4>{selectedQualityArtifact.name}</h4>
                    <p>{selectedQualityArtifact.description}</p>
                  </div>
                  <dl>
                    <div>
                      <dt>Lifecycle</dt>
                      <dd>{lifecycleState(selectedQualityArtifact)}</dd>
                    </div>
                    <div>
                      <dt>Review</dt>
                      <dd>
                        {selectedQualityArtifact.reviewStatus || "Not recorded"}
                      </dd>
                    </div>
                    <div>
                      <dt>Canonical history</dt>
                      <dd>
                        v
                        {latestArtifactVersion(
                          bundle,
                          selectedQualityArtifact.id,
                        )?.version || 0}
                      </dd>
                    </div>
                    <div>
                      <dt>Source</dt>
                      <dd>{selectedQualityArtifact.source || "Missing"}</dd>
                    </div>
                  </dl>
                </article>
              )}
              <div className="dt-finding-list">
                {selectedQualityFindings.map((finding) => (
                  <article key={finding.id}>
                    <div className="dt-card-heading">
                      <strong>{finding.rule}</strong>
                      <span className={statusClass(finding.severity)}>
                        {finding.severity}
                      </span>
                    </div>
                    <p>{finding.message}</p>
                    <small>Triggered by: {finding.triggeringText}</small>
                    <dl>
                      <div>
                        <dt>Why it matters</dt>
                        <dd>{finding.why}</dd>
                      </div>
                      <div>
                        <dt>Suggested repair</dt>
                        <dd>{finding.suggestion}</dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>
              <h4 className="dt-subhead">Cross-requirement findings</h4>
              <div className="dt-finding-list">
                {corpusFindings.slice(0, 40).map((finding) => (
                  <article key={finding.id}>
                    <div className="dt-card-heading">
                      <strong>{finding.rule}</strong>
                      <span className={statusClass(finding.severity)}>
                        {finding.severity}
                      </span>
                    </div>
                    <p>{finding.message}</p>
                    <small>{finding.artifactIds.join(", ")}</small>
                    <p>{finding.why}</p>
                    <p>{finding.suggestion}</p>
                  </article>
                ))}
              </div>
            </section>
          )}

          {tab === "change" && (
            <section aria-labelledby="dt-change-title">
              <div className="dt-section-heading">
                <div>
                  <span className="dt-kicker">CONTROLLED CHANGE</span>
                  <h3 id="dt-change-title">
                    Lifecycle, reviews, change requests, baselines
                  </h3>
                </div>
                <p>
                  Review disposition is deliberately separate from lifecycle
                  state. Baselines snapshot canonical artifacts, relationships,
                  and version history.
                </p>
              </div>

              <div className="dt-change-grid">
                <article>
                  <h4>Artifact lifecycle</h4>
                  <label>
                    Requirement or change request
                    <select
                      value={lifecycleId}
                      onChange={(event) => setLifecycleId(event.target.value)}
                    >
                      {lifecycleArtifacts.map((artifact) => (
                        <option key={artifact.id} value={artifact.id}>
                          {artifactLabel(artifact)}
                        </option>
                      ))}
                    </select>
                  </label>
                  {selectedLifecycleArtifact && (
                    <p>
                      Current:{" "}
                      <strong>
                        {lifecycleState(selectedLifecycleArtifact)}
                      </strong>{" "}
                      · review:{" "}
                      {selectedLifecycleArtifact.reviewStatus || "not recorded"}{" "}
                      · canonical history v
                      {latestArtifactVersion(
                        bundle,
                        selectedLifecycleArtifact.id,
                      )?.version || 0}
                    </p>
                  )}
                  <div className="dt-button-row">
                    {(
                      [
                        "Proposed",
                        "In review",
                        "Approved",
                        "Superseded",
                        "Retired",
                      ] as const
                    ).map((state) => (
                      <button
                        key={state}
                        type="button"
                        onClick={() => applyLifecycle(state)}
                      >
                        Move to {state}
                      </button>
                    ))}
                  </div>
                  <label>
                    Reviewer
                    <input
                      value={reviewer}
                      onChange={(event) => setReviewer(event.target.value)}
                    />
                  </label>
                  <label>
                    Review rationale
                    <textarea
                      rows={4}
                      value={reviewRationale}
                      onChange={(event) =>
                        setReviewRationale(event.target.value)
                      }
                    />
                  </label>
                  <button type="button" onClick={recordReview}>
                    Record separate approval decision
                  </button>
                </article>

                <article>
                  <h4>Create change request</h4>
                  <label>
                    Title
                    <input
                      value={changeTitle}
                      onChange={(event) => setChangeTitle(event.target.value)}
                    />
                  </label>
                  <label>
                    Reason
                    <textarea
                      rows={3}
                      value={changeReason}
                      onChange={(event) => setChangeReason(event.target.value)}
                    />
                  </label>
                  <label>
                    Proposed change
                    <textarea
                      rows={4}
                      value={changeProposal}
                      onChange={(event) =>
                        setChangeProposal(event.target.value)
                      }
                    />
                  </label>
                  <button type="button" onClick={addChangeRequest}>
                    Create from explainable impact
                  </button>
                  <p>
                    Existing change requests:{" "}
                    <strong>
                      {
                        bundle.artifacts.filter(
                          (artifact) => artifact.type === "ChangeRequest",
                        ).length
                      }
                    </strong>
                  </p>
                </article>

                <article>
                  <h4>Create approved baseline</h4>
                  <label>
                    Baseline name
                    <input
                      value={baselineName}
                      onChange={(event) => setBaselineName(event.target.value)}
                    />
                  </label>
                  <button type="button" onClick={addBaseline}>
                    Snapshot canonical project
                  </button>
                  <p>
                    Stored baselines:{" "}
                    <strong>{(bundle.baselines || []).length}</strong>
                  </p>
                  {latestBaseline && (
                    <>
                      <p>
                        Latest: <strong>{latestBaseline.name}</strong> ·
                        approved by {latestBaseline.approvedBy}
                      </p>
                      <p>
                        Membership: {baselineMembership(latestBaseline).length}{" "}
                        artifacts · {latestBaseline.relations.length}{" "}
                        relationships
                      </p>
                      {baselineDiff && (
                        <p>
                          Current divergence:{" "}
                          {baselineDiff.addedArtifacts.length} added,{" "}
                          {baselineDiff.removedArtifacts.length} removed,{" "}
                          {baselineDiff.changedArtifacts.length} changed
                          artifacts.
                        </p>
                      )}
                    </>
                  )}
                </article>
              </div>
            </section>
          )}

          {tab === "assistant" && (
            <section aria-labelledby="dt-assistant-title">
              <div className="dt-section-heading">
                <div>
                  <span className="dt-kicker">ASSISTIVE LAYER</span>
                  <h3 id="dt-assistant-title">
                    Suggestions assist the thread; they never become the thread
                  </h3>
                </div>
                <p>
                  This build uses deterministic local suggestions. A future
                  model provider can propose the same typed suggestions, but
                  acceptance must remain explicit.
                </p>
              </div>
              <div className="dt-callout dt-callout--warning">
                <strong>SUGGESTION BOUNDARY</strong>
                <p>
                  None of the items below modify canonical artifacts
                  automatically. They are review prompts with rationale and
                  limitations, not authoritative engineering decisions.
                </p>
              </div>
              <div className="dt-suggestion-list">
                {suggestions.map((suggestion) => (
                  <article key={suggestion.id}>
                    <div className="dt-card-heading">
                      <div>
                        <span className="dt-suggestion-label">
                          SUGGESTED · NOT CANONICAL
                        </span>
                        <strong>{suggestion.title}</strong>
                      </div>
                      <code>{suggestion.artifactId}</code>
                    </div>
                    <p>{suggestion.rationale}</p>
                    <blockquote>{suggestion.proposal}</blockquote>
                    <small>{suggestion.limitation}</small>
                  </article>
                ))}
              </div>
            </section>
          )}
        </main>
      </section>
    </div>
  );
}
