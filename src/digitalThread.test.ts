import { describe, expect, it } from "vitest";
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
  runTraceQuery,
  transitionArtifactLifecycle,
} from "./digitalThread";
import type { Artifact, ProjectBundle, Relation } from "./model";

function bundleOf(
  artifacts: Artifact[],
  relations: Relation[] = [],
): ProjectBundle {
  return { version: 1, artifacts, relations, versions: [], baselines: [] };
}

const req: Artifact = {
  id: "REQ-100",
  type: "Requirement",
  name: "Position reporting",
  description:
    "The system shall provide current position to the coordinator within 2 seconds during an active mission.",
  status: "Draft",
  priority: "Critical",
  source: "NEED-100",
  structure: {
    actor: "The system",
    action: "provide",
    object: "current position to the coordinator",
    condition: "during an active mission",
    threshold: "2",
    unit: "seconds",
  },
  verification: {
    method: "Test",
    objective: "Verify update latency.",
    preconditions: "Connected mission console.",
    procedure: "Observe telemetry timestamps.",
    expectedResult: "Updates are no more than two seconds apart.",
    actualResult: "",
    owner: "Verification lead",
    environment: "Integration bench",
    version: "1",
    baseline: "BL-001",
  },
  metadata: { rationale: "Coordinator awareness" },
};

const block: Artifact = {
  id: "BLK-100",
  type: "Block",
  name: "Telemetry service",
  description: "Publishes validated flight data.",
  status: "Allocated",
};

const testArtifact: Artifact = {
  id: "TST-100",
  type: "Test",
  name: "Latency test",
  description: "Measures telemetry update latency.",
  status: "Ready",
};

const evidence: Artifact = {
  id: "EVD-100",
  type: "Evidence",
  name: "Latency run",
  description: "Recorded latency run.",
  status: "Available",
  verified: true,
  reviewStatus: "Approved",
  owner: "Verification reviewer",
  createdAt: "2026-01-01T00:00:00.000Z",
  baseline: "BL-001",
  metadata: {
    producedAt: "2026-01-01T00:00:00.000Z",
    requirementVersion: "1",
    reviewer: "Verification reviewer",
  },
};

const relations: Relation[] = [
  {
    from: "REQ-100",
    to: "BLK-100",
    kind: "allocated-to",
    rationale: "Owned by telemetry service.",
  },
  {
    from: "REQ-100",
    to: "TST-100",
    kind: "verified-by",
    rationale: "Latency is directly tested.",
  },
  {
    from: "TST-100",
    to: "EVD-100",
    kind: "produces",
    rationale: "The test run produces this evidence.",
  },
];

describe("version-aware digital-thread services", () => {
  it("normalizes lifecycle without treating review disposition as lifecycle", () => {
    expect(lifecycleState({ ...req, status: "Candidate" })).toBe("Proposed");
    expect(
      lifecycleState({ ...req, status: "Approved", reviewStatus: "Rejected" }),
    ).toBe("Approved");
  });

  it("records lifecycle transitions as canonical artifact versions", () => {
    const first = transitionArtifactLifecycle(
      bundleOf([req]),
      req.id,
      "Proposed",
      "Reviewer A",
      "Ready for review",
      "2026-02-01T00:00:00.000Z",
    );
    expect(first.artifacts[0].status).toBe("Proposed");
    expect(latestArtifactVersion(first, req.id)?.version).toBe(1);
    expect(
      latestArtifactVersion(first, req.id)?.snapshot.metadata?.lifecycleActor,
    ).toBe("Reviewer A");

    const second = transitionArtifactLifecycle(
      first,
      req.id,
      "In review",
      "Reviewer A",
      "Formal review started",
      "2026-02-02T00:00:00.000Z",
    );
    expect(latestArtifactVersion(second, req.id)?.version).toBe(2);
  });

  it("rejects invalid lifecycle jumps", () => {
    expect(() =>
      transitionArtifactLifecycle(
        bundleOf([{ ...req, status: "Approved" }]),
        req.id,
        "Draft",
        "Reviewer A",
        "Backwards without supersession",
      ),
    ).toThrow(/not an allowed lifecycle transition/);
  });

  it("records review decisions as separate canonical review-session artifacts", () => {
    const reviewed = recordReviewDecision(bundleOf([req]), {
      artifactId: req.id,
      reviewer: "Review board",
      disposition: "Approved",
      rationale: "Trace and verification intent are acceptable.",
      timestamp: "2026-02-03T00:00:00.000Z",
    });
    expect(
      reviewed.artifacts.find((artifact) => artifact.type === "ReviewSession"),
    ).toMatchObject({
      owner: "Review board",
      status: "Recorded",
    });
    expect(
      reviewed.artifacts.find((artifact) => artifact.id === req.id)?.status,
    ).toBe("Draft");
    expect(
      reviewed.artifacts.find((artifact) => artifact.id === req.id)
        ?.reviewStatus,
    ).toBe("Approved");
    expect(
      reviewed.relations.some((relation) => relation.kind === "reviews"),
    ).toBe(true);
  });

  it("marks evidence stale when a linked requirement changes after production", () => {
    const base = bundleOf([req, testArtifact, evidence], relations.slice(1));
    const withVersion: ProjectBundle = {
      ...base,
      versions: [
        {
          id: "VER-REQ-100-0002",
          artifactId: req.id,
          version: 2,
          timestamp: "2026-03-01T00:00:00.000Z",
          action: "Requirement changed",
          snapshot: { ...req, description: `${req.description} Updated.` },
        },
      ],
    };
    const validity = assessEvidenceValidity(evidence, withVersion);
    expect(validity.status).toBe("stale");
    expect(validity.reasons.join(" ")).toMatch(/changed after|version 2/);
  });

  it("distinguishes complete current evidence from incomplete lineage", () => {
    const currentEvidence: Artifact = {
      ...evidence,
      metadata: {
        ...evidence.metadata,
        producedAt: "2026-04-01T00:00:00.000Z",
        requirementVersion: "1",
      },
    };
    const current = bundleOf(
      [req, testArtifact, currentEvidence],
      relations.slice(1),
    );
    current.versions = [
      {
        id: "VER-REQ-100-0001",
        artifactId: req.id,
        version: 1,
        timestamp: "2026-01-01T00:00:00.000Z",
        action: "Created",
        snapshot: req,
      },
    ];
    current.baselines = [
      {
        id: "BL-001",
        name: "BL-001",
        createdAt: "2026-03-01T00:00:00.000Z",
        artifacts: [req, testArtifact, currentEvidence],
        relations: relations.slice(1),
        versions: current.versions,
        relationHistory: [],
        includedTypes: ["Requirement", "Test", "Evidence"],
        approvedBy: "Board",
        approvedAt: "2026-03-01T00:00:00.000Z",
      },
    ];
    expect(assessEvidenceValidity(currentEvidence, current).status).toBe(
      "valid",
    );
    expect(
      assessEvidenceValidity({ ...currentEvidence, id: "EVD-404" }, current)
        .status,
    ).toBe("incomplete");
  });

  it("explains impact using relationship direction, rationale, and separate signals", () => {
    const project = bundleOf([req, block, testArtifact, evidence], relations);
    const impact = explainImpact(req.id, project);
    expect(impact.entries.map((entry) => entry.artifact.id)).toEqual(
      expect.arrayContaining([block.id, testArtifact.id, evidence.id]),
    );
    const evidenceEntry = impact.entries.find(
      (entry) => entry.artifact.id === evidence.id,
    )!;
    expect(evidenceEntry.path).toEqual([req.id, testArtifact.id, evidence.id]);
    expect(evidenceEntry.signals).toContain("evidence");
    expect(evidenceEntry.edges[0]).toMatchObject({
      kind: "verified-by",
      rationale: "Latency is directly tested.",
    });
    expect(impact.limitations.join(" ")).toMatch(
      /not a probabilistic risk score/i,
    );
  });

  it("runs deterministic trace queries and refuses unsupported questions", () => {
    const missing = {
      ...req,
      id: "REQ-101",
      name: "Unverified",
      priority: "Medium",
    };
    const project = bundleOf(
      [req, missing, block, testArtifact, evidence],
      relations,
    );
    const result = runTraceQuery(
      "requirements without verification evidence",
      project,
    );
    expect(result.kind).toBe("missing-verification");
    expect(result.artifactIds).toContain("REQ-101");

    const path = runTraceQuery(
      "show every path from REQ-100 to EVD-100",
      project,
    );
    expect(path.kind).toBe("path");
    expect(path.paths).toContainEqual(["REQ-100", "TST-100", "EVD-100"]);

    const unsupported = runTraceQuery(
      "predict project success next year",
      project,
    );
    expect(unsupported.kind).toBe("unsupported");
    expect(unsupported.limitations[0]).toContain(TRACE_QUERY_EXAMPLES[0]);
  });

  it("keeps elicitation extraction non-canonical until explicit acceptance", () => {
    const project = bundleOf([
      {
        id: "ELC-100",
        type: "ElicitationRecord",
        name: "Interview",
        description: "Coordinator interview.",
        status: "Captured",
      },
    ]);
    const candidates = extractElicitationCandidates(
      "The coordinator needs current position. The system must report a telemetry loss within five seconds.",
      "ELC-100",
    );
    expect(candidates).toHaveLength(2);
    expect(candidates[1].artifact.type).toBe("Requirement");
    expect(
      project.artifacts.some((artifact) => artifact.id === candidates[0].id),
    ).toBe(false);

    const accepted = acceptElicitationCandidate(
      project,
      candidates[0],
      "Analyst",
    );
    const canonical = accepted.artifacts.find((artifact) =>
      artifact.id.startsWith("CAN-"),
    );
    expect(canonical?.metadata?.suggestionState).toBe(
      "Accepted into canonical model",
    );
    expect(accepted.relations[0]).toMatchObject({
      from: "ELC-100",
      to: canonical?.id,
      kind: "captures",
    });
  });

  it("creates change requests with explicit origin and affected-artifact relationships", () => {
    const project = bundleOf([req, block, testArtifact, evidence], relations);
    const changed = createChangeRequest(project, {
      title: "Review telemetry timing",
      reason: "Operations feedback",
      originatingArtifactId: req.id,
      affectedArtifactIds: [block.id, testArtifact.id, evidence.id],
      proposedChanges: "Review timing and re-run verification.",
      reviewers: ["Review board"],
      timestamp: "2026-04-01T00:00:00.000Z",
    });
    const request = changed.artifacts.find(
      (artifact) => artifact.type === "ChangeRequest",
    )!;
    expect(request.metadata?.affectedArtifactIds).toContain(block.id);
    expect(
      changed.relations.filter(
        (relation) =>
          relation.from === request.id &&
          relation.kind === "proposes-change-to",
      ),
    ).toHaveLength(3);
  });

  it("creates version-aware baselines and exposes current divergence", () => {
    const project = bundleOf([req, block], [relations[0]]);
    project.versions = [
      {
        id: "VER-REQ-100-0001",
        artifactId: req.id,
        version: 1,
        timestamp: "2026-01-01T00:00:00.000Z",
        action: "Created",
        snapshot: req,
      },
    ];
    const baselined = createVersionedBaseline(project, {
      name: "Review B1",
      approvedBy: "Review board",
      timestamp: "2026-05-01T00:00:00.000Z",
    });
    const baseline = baselined.baselines![0];
    expect(baselineMembership(baseline)).toContainEqual({
      artifactId: req.id,
      artifactType: "Requirement",
      artifactVersion: 1,
    });

    const current: ProjectBundle = {
      ...baselined,
      artifacts: baselined.artifacts.map((artifact) =>
        artifact.id === req.id
          ? { ...artifact, description: `${artifact.description} Changed.` }
          : artifact,
      ),
    };
    expect(
      compareBaselineToCurrent(current, baseline).changedArtifacts,
    ).toContain(req.id);
  });

  it("adds explainable corpus-level quality findings", () => {
    const duplicate = { ...req, id: "REQ-102" };
    const positive: Artifact = {
      ...req,
      id: "REQ-103",
      description:
        "The telemetry service shall transmit mission status to the console.",
    };
    const negative: Artifact = {
      ...req,
      id: "REQ-104",
      description:
        "The telemetry service shall not transmit mission status to the console.",
    };
    const acronym: Artifact = {
      ...req,
      id: "REQ-105",
      description: "The system shall send XYZ status every 2 seconds.",
    };
    const findings = corpusQualityFindings(
      bundleOf([req, duplicate, positive, negative, acronym]),
    );
    expect(
      findings.some((finding) => finding.rule === "duplicate-requirement"),
    ).toBe(true);
    expect(
      findings.some((finding) => finding.rule === "possible-conflict"),
    ).toBe(true);
    expect(
      findings.some(
        (finding) =>
          finding.rule === "undefined-acronym" &&
          finding.message.includes("XYZ"),
      ),
    ).toBe(true);
  });

  it("produces assistant suggestions without mutating the canonical bundle", () => {
    const unverified = {
      ...req,
      id: "REQ-106",
      description: "The system should be fast.",
      verification: undefined,
      structure: undefined,
    };
    const project = bundleOf([unverified]);
    const before = JSON.stringify(project);
    const suggestions = assistantSuggestions(project);
    expect(suggestions.some((item) => item.kind === "verification-plan")).toBe(
      true,
    );
    expect(
      suggestions.every((item) =>
        /not canonical|auto-created|deterministic/i.test(item.limitation),
      ),
    ).toBe(true);
    expect(JSON.stringify(project)).toBe(before);
  });
});
