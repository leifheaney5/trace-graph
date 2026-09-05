import { compareBundles, modelDiagnostics, qualityAnalysis } from "./model";
import type {
  Artifact,
  ArtifactType,
  ArtifactVersion,
  Baseline,
  ProjectBundle,
  QualityFinding,
  Relation,
} from "./model";

export type LifecycleState =
  "Draft" | "Proposed" | "In review" | "Approved" | "Superseded" | "Retired";

export type ReviewDisposition =
  "Approved" | "Changes requested" | "Rejected" | "Acknowledged";

export type EvidenceValidityStatus =
  "valid" | "stale" | "review-needed" | "incomplete" | "superseded";

export type EvidenceValidity = {
  evidenceId: string;
  status: EvidenceValidityStatus;
  reasons: string[];
  producedAt?: string;
  testIds: string[];
  requirementIds: string[];
  requirementVersions: Record<string, string>;
  baselineReference?: string;
  reviewer?: string;
};

export type ImpactSignal =
  | "direct"
  | "transitive"
  | "verification"
  | "evidence"
  | "evidence-stale"
  | "baseline-divergence"
  | "high-criticality"
  | "unreviewed";

export type ExplainedImpactEdge = {
  from: string;
  to: string;
  kind: string;
  rationale: string;
  confidence: string;
  provenance: string;
};

export type ExplainedImpactEntry = {
  artifact: Artifact;
  hops: number;
  path: string[];
  edges: ExplainedImpactEdge[];
  signals: ImpactSignal[];
};

export type ExplainedImpact = {
  root: Artifact;
  entries: ExplainedImpactEntry[];
  totals: Record<ImpactSignal, number>;
  evidenceInvalidations: string[];
  verificationArtifacts: string[];
  baselineDivergence: string[];
  limitations: string[];
};

export type TraceQueryResult = {
  query: string;
  kind:
    | "missing-verification"
    | "unapproved-need"
    | "critical-verification"
    | "impact"
    | "baseline-diff"
    | "stale-evidence"
    | "orphan"
    | "path"
    | "unsupported";
  summary: string;
  definition: string;
  artifactIds: string[];
  paths: string[][];
  limitations: string[];
};

export type ElicitationCandidate = {
  id: string;
  artifact: Artifact;
  sourceId: string;
  sourceExcerpt: string;
  confidence: "high" | "medium" | "low";
  rationale: string;
};

export type AssistantSuggestion = {
  id: string;
  kind:
    | "requirement-rewrite"
    | "verification-plan"
    | "evidence-refresh"
    | "trace-review"
    | "conflict-review";
  artifactId: string;
  title: string;
  rationale: string;
  proposal: string;
  limitation: string;
};

export type CorpusQualityFinding = {
  id: string;
  artifactIds: string[];
  rule:
    | "duplicate-requirement"
    | "possible-conflict"
    | "undefined-acronym"
    | "inconsistent-term";
  severity: "advisory" | "required";
  message: string;
  why: string;
  suggestion: string;
};

export const TRACE_QUERY_EXAMPLES = [
  "requirements without verification evidence",
  "needs without an approved requirement",
  "which components are affected if REQ-042 changes?",
  "tests that verify critical requirements",
  "what changed between the latest two baselines?",
  "evidence older than the requirement version it verifies",
  "orphaned architecture elements",
  "show every path from REQ-042 to EVD-017",
] as const;

const lifecycleTransitions: Record<LifecycleState, LifecycleState[]> = {
  Draft: ["Proposed", "In review", "Retired"],
  Proposed: ["Draft", "In review", "Retired"],
  "In review": ["Draft", "Proposed", "Approved", "Retired"],
  Approved: ["Superseded", "Retired"],
  Superseded: ["Retired"],
  Retired: [],
};

const normalizedStatus = (value: string) => value.trim().toLowerCase();

export function lifecycleState(artifact: Artifact): LifecycleState {
  const status = normalizedStatus(artifact.status);
  if (status.includes("supersed")) return "Superseded";
  if (status.includes("retir") || status.includes("archive")) return "Retired";
  if (status.includes("approv") || status === "accepted") return "Approved";
  if (status.includes("review")) return "In review";
  if (status.includes("propos") || status.includes("candidate"))
    return "Proposed";
  return "Draft";
}

export function latestArtifactVersion(
  bundle: ProjectBundle,
  artifactId: string,
): ArtifactVersion | undefined {
  return (bundle.versions || [])
    .filter((entry) => entry.artifactId === artifactId)
    .sort((a, b) => b.version - a.version)[0];
}

function nextArtifactVersion(bundle: ProjectBundle, artifactId: string) {
  return (latestArtifactVersion(bundle, artifactId)?.version || 0) + 1;
}

function auditMessage(actor: string, action: string, rationale: string) {
  return `${action} by ${actor}${rationale ? ` — ${rationale}` : ""}`;
}

export function transitionArtifactLifecycle(
  bundle: ProjectBundle,
  artifactId: string,
  nextState: LifecycleState,
  actor: string,
  rationale: string,
  timestamp = new Date().toISOString(),
): ProjectBundle {
  const current = bundle.artifacts.find(
    (artifact) => artifact.id === artifactId,
  );
  if (!current) throw new Error(`Artifact ${artifactId} does not exist.`);
  const previousState = lifecycleState(current);
  if (!lifecycleTransitions[previousState].includes(nextState)) {
    throw new Error(
      `${previousState} → ${nextState} is not an allowed lifecycle transition.`,
    );
  }
  const version = nextArtifactVersion(bundle, artifactId);
  const updated: Artifact = {
    ...current,
    status: nextState,
    updatedAt: timestamp,
    auditHistory: [
      ...(current.auditHistory || []),
      auditMessage(
        actor,
        `Lifecycle ${previousState} → ${nextState}`,
        rationale,
      ),
    ].slice(-30),
    metadata: {
      ...(current.metadata || {}),
      lifecycleState: nextState,
      lifecycleActor: actor,
      lifecycleRationale: rationale,
      canonicalVersion: String(version),
    },
  };
  const history: ArtifactVersion = {
    id: `VER-${artifactId}-${String(version).padStart(4, "0")}`,
    artifactId,
    version,
    timestamp,
    action: `Lifecycle ${previousState} → ${nextState}`,
    snapshot: updated,
  };
  return {
    ...bundle,
    artifacts: bundle.artifacts.map((artifact) =>
      artifact.id === artifactId ? updated : artifact,
    ),
    versions: [...(bundle.versions || []), history],
  };
}

export function recordReviewDecision(
  bundle: ProjectBundle,
  input: {
    artifactId: string;
    reviewer: string;
    disposition: ReviewDisposition;
    rationale: string;
    timestamp?: string;
  },
): ProjectBundle {
  const target = bundle.artifacts.find(
    (artifact) => artifact.id === input.artifactId,
  );
  if (!target) throw new Error(`Artifact ${input.artifactId} does not exist.`);
  const timestamp = input.timestamp || new Date().toISOString();
  const stamp = timestamp.replace(/[^0-9]/g, "").slice(0, 14);
  const reviewId = `REV-${input.artifactId}-${stamp}`;
  const review: Artifact = {
    id: reviewId,
    type: "ReviewSession",
    name: `${input.disposition}: ${target.name}`,
    description: input.rationale,
    status: "Recorded",
    owner: input.reviewer,
    createdAt: timestamp,
    metadata: {
      reviewer: input.reviewer,
      disposition: input.disposition,
      targetArtifactId: target.id,
      targetVersion: String(
        latestArtifactVersion(bundle, target.id)?.version || 0,
      ),
      rationale: input.rationale,
    },
  };
  const relation: Relation = {
    from: reviewId,
    to: target.id,
    kind: "reviews",
    rationale: input.rationale,
    confidence: "Recorded decision",
    source: reviewId,
    createdAt: timestamp,
    reviewStatus: input.disposition,
  };
  const reviewedTarget: Artifact = {
    ...target,
    reviewStatus: input.disposition,
    auditHistory: [
      ...(target.auditHistory || []),
      auditMessage(
        input.reviewer,
        `Review ${input.disposition}`,
        input.rationale,
      ),
    ].slice(-30),
  };
  return {
    ...bundle,
    artifacts: [
      ...bundle.artifacts.map((artifact) =>
        artifact.id === target.id ? reviewedTarget : artifact,
      ),
      review,
    ],
    relations: [...bundle.relations, relation],
  };
}

export function createChangeRequest(
  bundle: ProjectBundle,
  input: {
    title: string;
    reason: string;
    originatingArtifactId: string;
    affectedArtifactIds: string[];
    proposedChanges: string;
    reviewers: string[];
    targetBaselineId?: string;
    timestamp?: string;
  },
): ProjectBundle {
  if (
    !bundle.artifacts.some(
      (artifact) => artifact.id === input.originatingArtifactId,
    )
  ) {
    throw new Error(
      `Originating artifact ${input.originatingArtifactId} does not exist.`,
    );
  }
  const timestamp = input.timestamp || new Date().toISOString();
  const count = bundle.artifacts.filter(
    (artifact) => artifact.type === "ChangeRequest",
  ).length;
  const id = `CR-${String(count + 1).padStart(3, "0")}-${timestamp
    .replace(/[^0-9]/g, "")
    .slice(0, 8)}`;
  const affected = [...new Set(input.affectedArtifactIds)].filter(
    (artifactId) =>
      bundle.artifacts.some((artifact) => artifact.id === artifactId),
  );
  const changeRequest: Artifact = {
    id,
    type: "ChangeRequest",
    name: input.title,
    description: input.proposedChanges,
    status: "Draft",
    source: input.originatingArtifactId,
    createdAt: timestamp,
    metadata: {
      reason: input.reason,
      originatingArtifactId: input.originatingArtifactId,
      affectedArtifactIds: affected.join(","),
      proposedChanges: input.proposedChanges,
      reviewers: input.reviewers.join(","),
      disposition: "Draft",
      targetBaselineId: input.targetBaselineId || "",
    },
  };
  const relations: Relation[] = [
    {
      from: id,
      to: input.originatingArtifactId,
      kind: "justified-by",
      rationale: input.reason,
      source: id,
      createdAt: timestamp,
    },
    ...affected.map((artifactId) => ({
      from: id,
      to: artifactId,
      kind: "proposes-change-to",
      rationale: input.proposedChanges,
      source: id,
      createdAt: timestamp,
    })),
  ];
  return {
    ...bundle,
    artifacts: [...bundle.artifacts, changeRequest],
    relations: [...bundle.relations, ...relations],
  };
}

export function createVersionedBaseline(
  bundle: ProjectBundle,
  input: {
    name: string;
    approvedBy: string;
    includedTypes?: ArtifactType[];
    timestamp?: string;
  },
): ProjectBundle {
  const timestamp = input.timestamp || new Date().toISOString();
  const includedTypes = input.includedTypes || [
    ...new Set(bundle.artifacts.map((artifact) => artifact.type)),
  ];
  const selectedArtifacts = bundle.artifacts.filter((artifact) =>
    includedTypes.includes(artifact.type),
  );
  const selectedIds = new Set(selectedArtifacts.map((artifact) => artifact.id));
  const selectedRelations = bundle.relations.filter(
    (relation) =>
      selectedIds.has(relation.from) && selectedIds.has(relation.to),
  );
  const id = `BL-${String((bundle.baselines || []).length + 1).padStart(3, "0")}`;
  const baseline: Baseline = {
    id,
    name: input.name,
    createdAt: timestamp,
    artifacts: structuredClone(selectedArtifacts),
    relations: structuredClone(selectedRelations),
    versions: structuredClone(
      (bundle.versions || []).filter((entry) =>
        selectedIds.has(entry.artifactId),
      ),
    ),
    relationHistory: structuredClone(bundle.relationHistory || []),
    includedTypes,
    approvedBy: input.approvedBy,
    approvedAt: timestamp,
    project: bundle.project ? structuredClone(bundle.project) : undefined,
  };
  return {
    ...bundle,
    artifacts: bundle.artifacts.map((artifact) =>
      selectedIds.has(artifact.id)
        ? { ...artifact, baseline: input.name }
        : artifact,
    ),
    baselines: [...(bundle.baselines || []), baseline],
  };
}

export function baselineMembership(baseline: Baseline) {
  const latest = new Map<string, number>();
  baseline.versions.forEach((entry) => {
    latest.set(
      entry.artifactId,
      Math.max(latest.get(entry.artifactId) || 0, entry.version),
    );
  });
  return baseline.artifacts.map((artifact) => ({
    artifactId: artifact.id,
    artifactType: artifact.type,
    artifactVersion: latest.get(artifact.id) || 0,
  }));
}

export function compareBaselineToCurrent(
  bundle: ProjectBundle,
  baseline: Baseline,
) {
  return compareBundles(bundle, {
    version: 1,
    artifacts: baseline.artifacts,
    relations: baseline.relations,
    versions: baseline.versions,
    relationHistory: baseline.relationHistory,
    project: baseline.project,
  });
}

function productionLineage(evidence: Artifact, bundle: ProjectBundle) {
  const producingTests = bundle.relations
    .filter(
      (relation) => relation.kind === "produces" && relation.to === evidence.id,
    )
    .map((relation) => relation.from);
  const requirementIds = bundle.relations
    .filter(
      (relation) =>
        relation.kind === "verified-by" && producingTests.includes(relation.to),
    )
    .map((relation) => relation.from);
  return {
    testIds: [...new Set(producingTests)],
    requirementIds: [...new Set(requirementIds)],
  };
}

export function assessEvidenceValidity(
  evidence: Artifact,
  bundle: ProjectBundle,
): EvidenceValidity {
  if (evidence.type !== "Evidence" && evidence.type !== "EvidenceArtifact") {
    throw new Error(`${evidence.id} is not an evidence artifact.`);
  }
  const lineage = productionLineage(evidence, bundle);
  const producedAt =
    evidence.metadata?.producedAt || evidence.createdAt || evidence.updatedAt;
  const baselineReference =
    evidence.metadata?.baselineId ||
    evidence.baseline ||
    evidence.verification?.baseline;
  const reviewer = evidence.metadata?.reviewer || evidence.owner;
  const reasons: string[] = [];
  const requirementVersions: Record<string, string> = {};

  if (evidence.metadata?.supersededBy) {
    return {
      evidenceId: evidence.id,
      status: "superseded",
      reasons: [`Superseded by ${evidence.metadata.supersededBy}.`],
      producedAt,
      testIds: lineage.testIds,
      requirementIds: lineage.requirementIds,
      requirementVersions,
      baselineReference,
      reviewer,
    };
  }

  if (!lineage.testIds.length)
    reasons.push("No producing verification case is linked.");
  if (!lineage.requirementIds.length)
    reasons.push(
      "No requirement can be reached through the producing verification case.",
    );
  if (!producedAt) reasons.push("Evidence production time is not recorded.");

  let stale = false;
  lineage.requirementIds.forEach((requirementId) => {
    const latest = latestArtifactVersion(bundle, requirementId);
    const captured =
      evidence.metadata?.[`requirementVersion:${requirementId}`] ||
      evidence.metadata?.requirementVersion;
    if (captured) requirementVersions[requirementId] = captured;
    if (latest) {
      const current = String(latest.version);
      requirementVersions[requirementId] ||= current;
      if (captured && captured !== current) {
        stale = true;
        reasons.push(
          `${requirementId} is now version ${current}; this evidence records version ${captured}.`,
        );
      }
      if (producedAt && new Date(latest.timestamp) > new Date(producedAt)) {
        stale = true;
        reasons.push(
          `${requirementId} changed after this evidence was produced.`,
        );
      }
    }
  });

  if (baselineReference) {
    const baseline = (bundle.baselines || []).find(
      (item) =>
        item.id === baselineReference || item.name === baselineReference,
    );
    if (!baseline) {
      reasons.push(
        `Baseline reference “${baselineReference}” is descriptive only; no matching baseline snapshot is stored locally.`,
      );
    }
  } else {
    reasons.push("No baseline or configuration reference is recorded.");
  }

  if (stale) {
    return {
      evidenceId: evidence.id,
      status: "stale",
      reasons,
      producedAt,
      testIds: lineage.testIds,
      requirementIds: lineage.requirementIds,
      requirementVersions,
      baselineReference,
      reviewer,
    };
  }
  if (
    !lineage.testIds.length ||
    !lineage.requirementIds.length ||
    !producedAt
  ) {
    return {
      evidenceId: evidence.id,
      status: "incomplete",
      reasons,
      producedAt,
      testIds: lineage.testIds,
      requirementIds: lineage.requirementIds,
      requirementVersions,
      baselineReference,
      reviewer,
    };
  }
  if (
    !reviewer ||
    (evidence.reviewStatus &&
      !normalizedStatus(evidence.reviewStatus).includes("approv"))
  ) {
    reasons.push("Evidence has not been explicitly approved by a reviewer.");
    return {
      evidenceId: evidence.id,
      status: "review-needed",
      reasons,
      producedAt,
      testIds: lineage.testIds,
      requirementIds: lineage.requirementIds,
      requirementVersions,
      baselineReference,
      reviewer,
    };
  }
  if (!evidence.verified) {
    reasons.push("Evidence is connected but is not marked verified.");
    return {
      evidenceId: evidence.id,
      status: "review-needed",
      reasons,
      producedAt,
      testIds: lineage.testIds,
      requirementIds: lineage.requirementIds,
      requirementVersions,
      baselineReference,
      reviewer,
    };
  }
  reasons.push(
    "Evidence lineage is complete and no newer requirement version was detected.",
  );
  return {
    evidenceId: evidence.id,
    status: "valid",
    reasons,
    producedAt,
    testIds: lineage.testIds,
    requirementIds: lineage.requirementIds,
    requirementVersions,
    baselineReference,
    reviewer,
  };
}

function baselineHasDivergedArtifact(
  bundle: ProjectBundle,
  artifact: Artifact,
) {
  const latest = [...(bundle.baselines || [])].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  )[0];
  if (!latest) return false;
  const snapshot = latest.artifacts.find((item) => item.id === artifact.id);
  return Boolean(
    snapshot && JSON.stringify(snapshot) !== JSON.stringify(artifact),
  );
}

function pathEdges(
  path: string[],
  relations: Relation[],
): ExplainedImpactEdge[] {
  const edges: ExplainedImpactEdge[] = [];
  for (let index = 0; index < path.length - 1; index += 1) {
    const from = path[index];
    const to = path[index + 1];
    const relation = relations.find(
      (item) => item.from === from && item.to === to,
    );
    if (!relation) continue;
    edges.push({
      from,
      to,
      kind: relation.kind,
      rationale:
        relation.rationale ||
        `Canonical ${relation.kind} relationship between ${from} and ${to}.`,
      confidence: relation.confidence || "Not scored",
      provenance: relation.source || "Canonical project relationship",
    });
  }
  return edges;
}

export function explainImpact(
  rootId: string,
  bundle: ProjectBundle,
  maxDepth = 5,
): ExplainedImpact {
  const root = bundle.artifacts.find((artifact) => artifact.id === rootId);
  if (!root) throw new Error(`Artifact ${rootId} does not exist.`);
  const byId = new Map(
    bundle.artifacts.map((artifact) => [artifact.id, artifact]),
  );
  const paths = new Map<string, string[]>([[rootId, [rootId]]]);
  let frontier = [rootId];
  for (let depth = 1; depth <= maxDepth; depth += 1) {
    const next: string[] = [];
    bundle.relations.forEach((relation) => {
      if (!frontier.includes(relation.from) || paths.has(relation.to)) return;
      const parent = paths.get(relation.from) || [relation.from];
      paths.set(relation.to, [...parent, relation.to]);
      next.push(relation.to);
    });
    frontier = next;
    if (!frontier.length) break;
  }

  const entries: ExplainedImpactEntry[] = [...paths.entries()]
    .filter(([id]) => id !== rootId)
    .flatMap(([id, path]) => {
      const artifact = byId.get(id);
      if (!artifact) return [];
      const signals: ImpactSignal[] = [
        path.length === 2 ? "direct" : "transitive",
      ];
      if (artifact.type === "Test" || artifact.type === "VerificationMethod")
        signals.push("verification");
      if (
        artifact.type === "Evidence" ||
        artifact.type === "EvidenceArtifact"
      ) {
        signals.push("evidence");
        if (assessEvidenceValidity(artifact, bundle).status === "stale")
          signals.push("evidence-stale");
      }
      if (baselineHasDivergedArtifact(bundle, artifact))
        signals.push("baseline-divergence");
      if (
        normalizedStatus(artifact.priority || "").includes("critical") ||
        normalizedStatus(artifact.criticality || "").includes("high")
      )
        signals.push("high-criticality");
      if (
        !artifact.reviewStatus ||
        !normalizedStatus(artifact.reviewStatus).includes("approv")
      )
        signals.push("unreviewed");
      return [
        {
          artifact,
          hops: path.length - 1,
          path,
          edges: pathEdges(path, bundle.relations),
          signals: [...new Set(signals)],
        },
      ];
    });

  const signalTypes: ImpactSignal[] = [
    "direct",
    "transitive",
    "verification",
    "evidence",
    "evidence-stale",
    "baseline-divergence",
    "high-criticality",
    "unreviewed",
  ];
  const totals = Object.fromEntries(
    signalTypes.map((signal) => [
      signal,
      entries.filter((entry) => entry.signals.includes(signal)).length,
    ]),
  ) as Record<ImpactSignal, number>;
  return {
    root,
    entries,
    totals,
    evidenceInvalidations: entries
      .filter((entry) => entry.signals.includes("evidence"))
      .map((entry) => entry.artifact.id),
    verificationArtifacts: entries
      .filter((entry) => entry.signals.includes("verification"))
      .map((entry) => entry.artifact.id),
    baselineDivergence: entries
      .filter((entry) => entry.signals.includes("baseline-divergence"))
      .map((entry) => entry.artifact.id),
    limitations: [
      `Traversal follows directed canonical relationships up to ${maxDepth} hops.`,
      "Impact classification is structural and explainable; it is not a probabilistic risk score.",
      "A connected evidence record is treated as potentially invalidated until the underlying verification is reviewed against the changed version.",
    ],
  };
}

function allPaths(
  from: string,
  to: string,
  relations: Relation[],
  maxDepth = 8,
  maxPaths = 25,
) {
  const adjacency = new Map<string, string[]>();
  relations.forEach((relation) => {
    adjacency.set(relation.from, [
      ...(adjacency.get(relation.from) || []),
      relation.to,
    ]);
  });
  const found: string[][] = [];
  const walk = (current: string, path: string[]) => {
    if (found.length >= maxPaths || path.length > maxDepth + 1) return;
    if (current === to) {
      found.push(path);
      return;
    }
    for (const next of adjacency.get(current) || []) {
      if (!path.includes(next)) walk(next, [...path, next]);
    }
  };
  walk(from, [from]);
  return found;
}

function latestTwoBaselines(bundle: ProjectBundle) {
  return [...(bundle.baselines || [])]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 2);
}

function baselineMention(query: string, baselines: Baseline[]) {
  return baselines.filter(
    (baseline) =>
      query.toLowerCase().includes(baseline.id.toLowerCase()) ||
      query.toLowerCase().includes(baseline.name.toLowerCase()),
  );
}

export function runTraceQuery(
  query: string,
  bundle: ProjectBundle,
): TraceQueryResult {
  const normalized = query.trim().toLowerCase();
  const requirements = bundle.artifacts.filter(
    (artifact) => artifact.type === "Requirement",
  );
  if (
    /requirement/.test(normalized) &&
    /(without|missing)/.test(normalized) &&
    /verif/.test(normalized)
  ) {
    const ids = requirements
      .filter(
        (artifact) =>
          !bundle.relations.some(
            (relation) =>
              relation.from === artifact.id && relation.kind === "verified-by",
          ),
      )
      .map((artifact) => artifact.id);
    return {
      query,
      kind: "missing-verification",
      summary: `${ids.length} requirements have no canonical verified-by relationship.`,
      definition:
        "A requirement is covered only when it has an outgoing verified-by relationship to a verification case.",
      artifactIds: ids,
      paths: [],
      limitations: [
        "This query measures planned verification linkage, not whether evidence is current or valid.",
      ],
    };
  }
  if (
    /need/.test(normalized) &&
    /(without|missing)/.test(normalized) &&
    /approved/.test(normalized)
  ) {
    const ids = bundle.artifacts
      .filter((artifact) => artifact.type === "Need")
      .filter((need) => {
        const refinements = bundle.relations
          .filter(
            (relation) =>
              relation.from === need.id && relation.kind === "refines",
          )
          .map((relation) =>
            bundle.artifacts.find((artifact) => artifact.id === relation.to),
          )
          .filter((artifact): artifact is Artifact => Boolean(artifact));
        return !refinements.some(
          (artifact) =>
            artifact.type === "Requirement" &&
            lifecycleState(artifact) === "Approved",
        );
      })
      .map((artifact) => artifact.id);
    return {
      query,
      kind: "unapproved-need",
      summary: `${ids.length} needs have no linked requirement in the Approved lifecycle state.`,
      definition:
        "A need is satisfied for this query when an outgoing refines relationship reaches an approved requirement.",
      artifactIds: ids,
      paths: [],
      limitations: [
        "Approval state is normalized from the current artifact status; review decisions remain separate records.",
      ],
    };
  }
  if (
    /test/.test(normalized) &&
    /critical/.test(normalized) &&
    /verif/.test(normalized)
  ) {
    const critical = new Set(
      requirements
        .filter(
          (artifact) =>
            normalizedStatus(
              artifact.priority || artifact.criticality || "",
            ) === "critical",
        )
        .map((artifact) => artifact.id),
    );
    const ids = bundle.relations
      .filter(
        (relation) =>
          relation.kind === "verified-by" && critical.has(relation.from),
      )
      .map((relation) => relation.to);
    return {
      query,
      kind: "critical-verification",
      summary: `${new Set(ids).size} tests verify requirements marked Critical.`,
      definition:
        "Criticality comes from the requirement priority/criticality field; tests are reached through verified-by relationships.",
      artifactIds: [...new Set(ids)],
      paths: [],
      limitations: ["This does not infer criticality from free text."],
    };
  }
  const idMatch = query.toUpperCase().match(/\b[A-Z]{2,10}-\d{1,5}\b/);
  if (idMatch && /(affect|impact|changes?)/i.test(query)) {
    const impact = explainImpact(idMatch[0], bundle);
    return {
      query,
      kind: "impact",
      summary: `${impact.entries.length} downstream artifacts are structurally reachable from ${idMatch[0]}.`,
      definition:
        "Impact follows directed canonical relationships and preserves every relationship kind used in the explanation chain.",
      artifactIds: impact.entries.map((entry) => entry.artifact.id),
      paths: impact.entries.map((entry) => entry.path),
      limitations: impact.limitations,
    };
  }
  if (
    /changed between|baseline.*diff|diff.*baseline|latest two baselines/.test(
      normalized,
    )
  ) {
    const mentioned = baselineMention(query, bundle.baselines || []);
    const pair =
      mentioned.length >= 2
        ? mentioned.slice(0, 2)
        : latestTwoBaselines(bundle);
    if (pair.length < 2) {
      return {
        query,
        kind: "baseline-diff",
        summary:
          "At least two stored baselines are required for a baseline-to-baseline comparison.",
        definition:
          "Baseline comparison uses the immutable artifact and relationship snapshots stored in each baseline.",
        artifactIds: [],
        paths: [],
        limitations: [
          "Create another approved baseline before running this comparison.",
        ],
      };
    }
    const newer = pair[0];
    const older = pair[1];
    const diff = compareBundles(
      {
        version: 1,
        artifacts: newer.artifacts,
        relations: newer.relations,
      },
      {
        version: 1,
        artifacts: older.artifacts,
        relations: older.relations,
      },
    );
    const ids = [
      ...diff.addedArtifacts,
      ...diff.removedArtifacts,
      ...diff.changedArtifacts,
    ];
    return {
      query,
      kind: "baseline-diff",
      summary: `${ids.length} artifact changes between ${older.name} and ${newer.name}; ${diff.addedRelations.length + diff.removedRelations.length} relationship changes.`,
      definition:
        "Changed artifacts are compared by canonical serialized content; relationships are compared by from/kind/to identity.",
      artifactIds: ids,
      paths: [],
      limitations: [
        "The comparison does not claim semantic equivalence between renamed or re-keyed artifacts.",
      ],
    };
  }
  if (
    /evidence/.test(normalized) &&
    /(older|stale|outdated)/.test(normalized)
  ) {
    const stale = bundle.artifacts
      .filter(
        (artifact) =>
          artifact.type === "Evidence" || artifact.type === "EvidenceArtifact",
      )
      .filter(
        (artifact) =>
          assessEvidenceValidity(artifact, bundle).status === "stale",
      )
      .map((artifact) => artifact.id);
    return {
      query,
      kind: "stale-evidence",
      summary: `${stale.length} evidence records are stale relative to a linked requirement version or change timestamp.`,
      definition:
        "Evidence is stale when a linked requirement has a newer canonical version or changed after evidence production.",
      artifactIds: stale,
      paths: [],
      limitations: [
        "Evidence without enough production/provenance metadata is reported as incomplete rather than stale.",
      ],
    };
  }
  if (/orphan/.test(normalized)) {
    const architectureTypes = new Set<ArtifactType>([
      "Block",
      "Part",
      "Port",
      "Interface",
      "Component",
      "ConstituentSystem",
      "SystemOfInterest",
    ]);
    const diagnostics = modelDiagnostics(bundle.artifacts, bundle.relations);
    const ids = diagnostics.orphanArtifacts.filter((id) => {
      const artifact = bundle.artifacts.find((item) => item.id === id);
      return Boolean(artifact && architectureTypes.has(artifact.type));
    });
    return {
      query,
      kind: "orphan",
      summary: `${ids.length} architecture artifacts have no canonical relationship.`,
      definition:
        "An orphan has no incoming or outgoing canonical relationship in the current bundle.",
      artifactIds: ids,
      paths: [],
      limitations: [
        "An intentional standalone reference element may still appear as an orphan.",
      ],
    };
  }
  const pathMatch = query
    .toUpperCase()
    .match(/PATHS? FROM\s+([A-Z0-9-]+)\s+TO\s+([A-Z0-9-]+)/);
  if (pathMatch) {
    const paths = allPaths(pathMatch[1], pathMatch[2], bundle.relations);
    return {
      query,
      kind: "path",
      summary: `${paths.length} directed paths found from ${pathMatch[1]} to ${pathMatch[2]}.`,
      definition:
        "Paths preserve canonical relationship direction and exclude cycles within each returned path.",
      artifactIds: [...new Set(paths.flat())],
      paths,
      limitations: [
        "Results are capped at 25 paths and eight relationship hops for inspectability.",
      ],
    };
  }
  return {
    query,
    kind: "unsupported",
    summary: "This local deterministic query was not recognized.",
    definition:
      "TraceGraph translates a constrained set of engineering questions into deterministic graph operations; it does not fabricate an answer for unsupported phrasing.",
    artifactIds: [],
    paths: [],
    limitations: [`Try one of: ${TRACE_QUERY_EXAMPLES.join(" · ")}`],
  };
}

function sentenceCandidates(text: string) {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 12);
}

function candidateType(sentence: string): ArtifactType {
  if (/\b(assume|assuming|assumption)\b/i.test(sentence)) return "Assumption";
  if (/\b(concern|worry|risk|problem|issue|fear)\b/i.test(sentence))
    return "Concern";
  if (
    /\b(constraint|cannot|must not|limited to|no more than)\b/i.test(sentence)
  )
    return "Constraint";
  if (/\b(shall|must|required to)\b/i.test(sentence)) return "Requirement";
  return "Need";
}

function candidateConfidence(sentence: string) {
  if (/\b(shall|must|need|needs|assume|constraint|concern)\b/i.test(sentence))
    return "high" as const;
  if (/\b(should|want|goal|problem|important)\b/i.test(sentence))
    return "medium" as const;
  return "low" as const;
}

function candidateName(sentence: string, type: ArtifactType, index: number) {
  const words = sentence
    .replace(/[^A-Za-z0-9\s-]/g, "")
    .split(/\s+/)
    .slice(0, 7);
  return `${type} candidate ${index + 1}: ${words.join(" ")}`;
}

export function extractElicitationCandidates(
  text: string,
  sourceId: string,
): ElicitationCandidate[] {
  return sentenceCandidates(text).map((sentence, index) => {
    const type = candidateType(sentence);
    const confidence = candidateConfidence(sentence);
    const id = `SUG-${sourceId.replace(/[^A-Za-z0-9]/g, "").toUpperCase()}-${String(
      index + 1,
    ).padStart(3, "0")}`;
    return {
      id,
      sourceId,
      sourceExcerpt: sentence,
      confidence,
      rationale: `Classified as ${type} from explicit source language; human acceptance is required before it enters the canonical model.`,
      artifact: {
        id,
        type,
        name: candidateName(sentence, type, index),
        description: sentence,
        status: "Suggested",
        source: sourceId,
        metadata: {
          suggestionState: "Suggested — not canonical",
          sourceExcerpt: sentence,
          confidence,
          extractionMethod: "Deterministic local elicitation rules",
        },
      },
    };
  });
}

export function acceptElicitationCandidate(
  bundle: ProjectBundle,
  candidate: ElicitationCandidate,
  actor: string,
  timestamp = new Date().toISOString(),
): ProjectBundle {
  let id = candidate.artifact.id.replace(/^SUG-/, "CAN-");
  let suffix = 1;
  while (bundle.artifacts.some((artifact) => artifact.id === id)) {
    suffix += 1;
    id = `${candidate.artifact.id.replace(/^SUG-/, "CAN-")}-${suffix}`;
  }
  const accepted: Artifact = {
    ...candidate.artifact,
    id,
    status: candidate.artifact.type === "Requirement" ? "Draft" : "Candidate",
    createdAt: timestamp,
    auditHistory: [
      auditMessage(
        actor,
        "Accepted elicitation suggestion",
        candidate.rationale,
      ),
    ],
    metadata: {
      ...(candidate.artifact.metadata || {}),
      suggestionState: "Accepted into canonical model",
      acceptedBy: actor,
      acceptedAt: timestamp,
    },
  };
  const source = bundle.artifacts.find(
    (artifact) => artifact.id === candidate.sourceId,
  );
  const relation: Relation | null = source
    ? source.type === "ElicitationRecord"
      ? {
          from: source.id,
          to: id,
          kind: "captures",
          rationale:
            "Accepted candidate retains its originating elicitation record.",
          source: source.id,
          createdAt: timestamp,
        }
      : {
          from: id,
          to: source.id,
          kind: "captured-from",
          rationale:
            "Accepted candidate retains its source-document provenance.",
          source: source.id,
          createdAt: timestamp,
        }
    : null;
  return {
    ...bundle,
    artifacts: [...bundle.artifacts, accepted],
    relations: relation ? [...bundle.relations, relation] : bundle.relations,
  };
}

function normalizedRequirementText(value: string) {
  return value
    .toLowerCase()
    .replace(/\bshall not\b/g, "shall-not")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function acronymDefinitions(text: string) {
  const defined = new Set<string>();
  const pattern = /\b[A-Za-z][A-Za-z\s-]{3,}\s+\(([A-Z][A-Z0-9]{1,7})\)/g;
  for (const match of text.matchAll(pattern)) defined.add(match[1]);
  return defined;
}

export function corpusQualityFindings(
  bundle: ProjectBundle,
): CorpusQualityFinding[] {
  const requirements = bundle.artifacts.filter(
    (artifact) => artifact.type === "Requirement",
  );
  const findings: CorpusQualityFinding[] = [];
  const byText = new Map<string, Artifact[]>();
  requirements.forEach((artifact) => {
    const key = normalizedRequirementText(artifact.description);
    byText.set(key, [...(byText.get(key) || []), artifact]);
  });
  [...byText.values()]
    .filter((group) => group.length > 1)
    .forEach((group, index) => {
      findings.push({
        id: `duplicate-${index + 1}`,
        artifactIds: group.map((artifact) => artifact.id),
        rule: "duplicate-requirement",
        severity: "advisory",
        message:
          "Multiple requirements use the same normalized obligation text.",
        why: "Duplicate obligations can diverge independently and make coverage counts misleading.",
        suggestion:
          "Choose one canonical requirement or explicitly relate intentional variants.",
      });
    });

  const positive = requirements.filter(
    (artifact) =>
      /\bshall\b/i.test(artifact.description) &&
      !/\bshall\s+not\b/i.test(artifact.description),
  );
  const negative = requirements.filter((artifact) =>
    /\bshall\s+not\b/i.test(artifact.description),
  );
  positive.forEach((left) => {
    const leftTokens = new Set(
      normalizedRequirementText(left.description)
        .split(" ")
        .filter((token) => token.length > 4 && token !== "shall"),
    );
    negative.forEach((right) => {
      const overlap = normalizedRequirementText(right.description)
        .split(" ")
        .filter((token) => leftTokens.has(token)).length;
      if (overlap >= 3) {
        findings.push({
          id: `conflict-${left.id}-${right.id}`,
          artifactIds: [left.id, right.id],
          rule: "possible-conflict",
          severity: "required",
          message:
            "A positive and negative obligation share substantial terminology.",
          why: "Opposing obligations over the same subject may create an unresolved acceptance conflict.",
          suggestion:
            "Review conditions, scope, and precedence before approving either requirement.",
        });
      }
    });
  });

  const corpus = requirements
    .map((artifact) => artifact.description)
    .join("\n");
  const definitions = acronymDefinitions(corpus);
  const acronymOwners = new Map<string, Set<string>>();
  requirements.forEach((artifact) => {
    const acronyms =
      artifact.description.match(/\b[A-Z][A-Z0-9]{1,7}\b/g) || [];
    acronyms.forEach((acronym) => {
      if (definitions.has(acronym)) return;
      acronymOwners.set(
        acronym,
        new Set([...(acronymOwners.get(acronym) || []), artifact.id]),
      );
    });
  });
  [...acronymOwners.entries()].slice(0, 25).forEach(([acronym, owners]) => {
    findings.push({
      id: `acronym-${acronym}`,
      artifactIds: [...owners],
      rule: "undefined-acronym",
      severity: "advisory",
      message: `${acronym} appears without an expansion in the requirement corpus.`,
      why: "Undefined acronyms reduce review clarity and interoperability across disciplines.",
      suggestion: `Define ${acronym} once in a controlled glossary or expand it at first use.`,
    });
  });

  const telemetryTerms = requirements.filter((artifact) =>
    /\b(telemetry|flight data|mission data)\b/i.test(artifact.description),
  );
  if (
    telemetryTerms.some((artifact) =>
      /\btelemetry\b/i.test(artifact.description),
    ) &&
    telemetryTerms.some((artifact) =>
      /\b(flight data|mission data)\b/i.test(artifact.description),
    )
  ) {
    findings.push({
      id: "term-telemetry-data",
      artifactIds: telemetryTerms.slice(0, 20).map((artifact) => artifact.id),
      rule: "inconsistent-term",
      severity: "advisory",
      message:
        "Telemetry, flight data, and mission data are used as overlapping terms.",
      why: "Terminology drift can create hidden differences in interface and verification scope.",
      suggestion:
        "Choose a controlled term and define narrower terms explicitly where they differ.",
    });
  }
  return findings;
}

function structuredRewrite(artifact: Artifact) {
  const structure = artifact.structure;
  if (!structure?.actor || !structure.action || !structure.object) return null;
  const condition = structure.condition ? ` ${structure.condition}` : "";
  const threshold = structure.threshold
    ? ` within ${structure.threshold}${structure.unit ? ` ${structure.unit}` : ""}`
    : "";
  return `${structure.actor} shall ${structure.action} ${structure.object}${condition}${threshold}.`;
}

export function assistantSuggestions(
  bundle: ProjectBundle,
): AssistantSuggestion[] {
  const suggestions: AssistantSuggestion[] = [];
  const requirements = bundle.artifacts.filter(
    (artifact) => artifact.type === "Requirement",
  );
  requirements.forEach((artifact) => {
    const requiredFindings = qualityAnalysis(artifact).filter(
      (finding) => finding.severity === "required",
    );
    const rewrite = structuredRewrite(artifact);
    if (requiredFindings.length && rewrite) {
      suggestions.push({
        id: `assist-rewrite-${artifact.id}`,
        kind: "requirement-rewrite",
        artifactId: artifact.id,
        title: `Suggested rewrite for ${artifact.id}`,
        rationale: requiredFindings.map((finding) => finding.rule).join(", "),
        proposal: rewrite,
        limitation:
          "Suggestion only. It is not canonical until a reviewer explicitly edits and saves the requirement.",
      });
    }
    const hasVerification = bundle.relations.some(
      (relation) =>
        relation.from === artifact.id && relation.kind === "verified-by",
    );
    if (!hasVerification) {
      suggestions.push({
        id: `assist-verify-${artifact.id}`,
        kind: "verification-plan",
        artifactId: artifact.id,
        title: `Plan verification for ${artifact.id}`,
        rationale: "No canonical verified-by relationship exists.",
        proposal: `Review ${artifact.id} and select an explicit verification method before approval.`,
        limitation:
          "No test is auto-created because TraceGraph cannot infer a valid procedure or acceptance environment from linkage alone.",
      });
    }
  });

  bundle.artifacts
    .filter(
      (artifact) =>
        artifact.type === "Evidence" || artifact.type === "EvidenceArtifact",
    )
    .forEach((artifact) => {
      const validity = assessEvidenceValidity(artifact, bundle);
      if (validity.status === "stale") {
        suggestions.push({
          id: `assist-evidence-${artifact.id}`,
          kind: "evidence-refresh",
          artifactId: artifact.id,
          title: `Refresh ${artifact.id}`,
          rationale: validity.reasons.join(" "),
          proposal: `Re-run or re-review ${validity.testIds.join(", ") || "the producing verification"} against the current requirement version before reusing ${artifact.id}.`,
          limitation:
            "TraceGraph marks the record stale structurally; it does not claim the underlying engineering result is invalid without review.",
        });
      }
    });

  const diagnostics = modelDiagnostics(bundle.artifacts, bundle.relations);
  diagnostics.conflictingRequirements.forEach((artifactId) => {
    suggestions.push({
      id: `assist-conflict-${artifactId}`,
      kind: "conflict-review",
      artifactId,
      title: `Review potential conflict around ${artifactId}`,
      rationale:
        "Model diagnostics found requirements with the same normalized name but different statements.",
      proposal:
        "Compare scope, conditions, rationale, and verification intent before approving the requirements.",
      limitation:
        "This is a deterministic review prompt, not a semantic contradiction judgment.",
    });
  });
  return suggestions.slice(0, 30);
}

export function requirementQualityReport(artifact: Artifact): QualityFinding[] {
  return qualityAnalysis(artifact);
}
