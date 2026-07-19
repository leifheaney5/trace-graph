export type ArtifactType =
  | "Project"
  | "Need"
  | "ElicitationRecord"
  | "StakeholderGroup"
  | "SourceDocument"
  | "InterviewNote"
  | "Observation"
  | "Concern"
  | "ReviewSession"
  | "Review"
  | "Requirement"
  | "Scenario"
  | "Stakeholder"
  | "Class"
  | "Lifeline"
  | "Message"
  | "DeploymentNode"
  | "Component"
  | "Block"
  | "Part"
  | "Port"
  | "ValueType"
  | "Interface"
  | "DataItem"
  | "Actor"
  | "UseCase"
  | "Activity"
  | "Action"
  | "ObjectFlow"
  | "State"
  | "Transition"
  | "Package"
  | "Allocation"
  | "ItemFlow"
  | "Test"
  | "VerificationMethod"
  | "TestResult"
  | "Evidence"
  | "EvidenceArtifact"
  | "Risk"
  | "Assumption"
  | "Constraint"
  | "Decision"
  | "ChangeRequest"
  | "Baseline"
  | "Diagram"
  | "Report"
  | "Comment"
  | "ActionItem"
  | "Capability"
  | "Mission"
  | "SystemOfSystems"
  | "SystemOfInterest"
  | "MissionThread"
  | "ConstituentSystem"
  | "OperationalNode"
  | "Organization"
  | "Authority"
  | "SharedResource"
  | "EmergentBehavior"
  | "EvolutionConcern"
  | "InteroperabilityConcern"
  | "CapabilityGap"
  | "SharedRisk";
export type Artifact = {
  id: string;
  type: ArtifactType;
  name: string;
  description: string;
  status: string;
  maturity?: string;
  owner?: string;
  priority?: string;
  criticality?: string;
  tags?: string[];
  source?: string;
  createdAt?: string;
  updatedAt?: string;
  version?: string;
  baseline?: string;
  reviewStatus?: string;
  auditHistory?: string[];
  quality?: string;
  verified?: boolean;
  structure?: RequirementStructure;
  verification?: VerificationDetails;
  metadata?: Record<string, string>;
};
export type ArtifactVersion = {
  id: string;
  artifactId: string;
  version: number;
  timestamp: string;
  action: string;
  snapshot: Artifact;
};
export type RequirementStructure = {
  actor: string;
  action: string;
  object: string;
  condition: string;
  trigger?: string;
  threshold: string;
  unit: string;
  timing?: string;
  tolerance?: string;
  exception?: string;
  rationale?: string;
};
export type VerificationDetails = {
  method:
    | "Test"
    | "Analysis"
    | "Inspection"
    | "Demonstration"
    | "Simulation"
    | "Certification"
    | "Similarity"
    | "Review of design";
  objective: string;
  preconditions: string;
  procedure: string;
  expectedResult: string;
  actualResult: string;
  owner: string;
  environment: string;
  version: string;
  baseline: string;
};
export type Relation = {
  id?: string;
  from: string;
  to: string;
  kind: string;
  rationale?: string;
  confidence?: string;
  status?: string;
  owner?: string;
  source?: string;
  createdAt?: string;
  modifiedAt?: string;
  version?: string;
  baseline?: string;
  reviewStatus?: string;
  inferred?: boolean;
  auditHistory?: string[];
};
export type RelationHistoryEntry = {
  id: string;
  timestamp: string;
  action: string;
  added: Relation[];
  removed: Relation[];
};

export const canonicalRelationshipKinds = [
  "captures",
  "captured-from",
  "expresses",
  "expressed-by",
  "refines",
  "derived-from",
  "decomposes",
  "satisfied-by",
  "allocated-to",
  "depends-on",
  "constrains",
  "connects",
  "interfaces-with",
  "flows-to",
  "verified-by",
  "validated-by",
  "mitigated-by",
  "supported-by",
  "conflicts-with",
  "justified-by",
  "affected-by",
  "supersedes",
  "contains",
  "part-of",
  "realizes",
  "exhibits",
  "enables",
  "traces",
  "participates-in",
  "produces",
  "requires",
  "represents",
  "owns",
  "uses",
  "reviews",
] as const;

export function relationId(relation: Relation, index = 0) {
  if (relation.id) return relation.id;
  const slug = `${relation.from}-${relation.kind}-${relation.to}`
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toUpperCase();
  return `REL-${slug}-${String(index + 1).padStart(4, "0")}`;
}

export function canonicalizeRelations(relations: Relation[]): Relation[] {
  return relations.map((relation, index) => ({
    ...relation,
    id: relationId(relation, index),
  }));
}

export type RelationValidation = {
  allowed: boolean;
  explanation: string;
};

type RelationRule = {
  from: ArtifactType[];
  to: ArtifactType[];
};

const relationRules: Record<string, RelationRule> = {
  expresses: { from: ["Stakeholder"], to: ["Need"] },
  captures: {
    from: ["ElicitationRecord"],
    to: [
      "Concern",
      "Need",
      "Assumption",
      "Constraint",
      "Requirement",
      "Decision",
      "ActionItem",
    ],
  },
  "participates-in": {
    from: ["Stakeholder"],
    to: ["ElicitationRecord"],
  },
  refines: {
    from: ["Need", "Requirement", "ElicitationRecord"],
    to: ["Need", "Requirement"],
  },
  decomposes: { from: ["Requirement", "Capability"], to: ["Requirement"] },
  "allocated-to": {
    from: ["Requirement", "Capability", "Mission"],
    to: ["Block", "Part", "ConstituentSystem"],
  },
  owns: { from: ["Block", "Part", "ConstituentSystem"], to: ["Interface"] },
  connects: {
    from: ["Interface", "Port", "Block", "Part"],
    to: ["Interface", "Port", "Block", "Part"],
  },
  "verified-by": { from: ["Requirement"], to: ["Test"] },
  produces: { from: ["Test"], to: ["Evidence"] },
  requires: { from: ["Mission", "Capability"], to: ["Capability", "Need"] },
  represents: {
    from: ["ConstituentSystem"],
    to: ["Block", "SystemOfInterest"],
  },
  "depends-on": {
    from: ["ConstituentSystem", "Block", "Part", "Interface"],
    to: ["ConstituentSystem", "Block", "Part", "Interface"],
  },
  uses: {
    from: ["Mission", "Stakeholder", "Actor"],
    to: ["ConstituentSystem", "Capability", "UseCase"],
  },
  reviews: {
    from: ["ReviewSession"],
    to: ["Requirement", "Need", "Test", "Evidence", "Risk", "ChangeRequest"],
  },
};

export function validateRelation(
  relation: Relation,
  artifacts: Artifact[],
): RelationValidation {
  const from = artifacts.find((artifact) => artifact.id === relation.from);
  const to = artifacts.find((artifact) => artifact.id === relation.to);
  if (!from || !to)
    return {
      allowed: false,
      explanation: "Both relationship endpoints must exist.",
    };
  if (from.id === to.id)
    return {
      allowed: false,
      explanation: "A relationship cannot connect an artifact to itself.",
    };
  const rule = relationRules[relation.kind];
  if (!rule)
    return {
      allowed: true,
      explanation: "Custom relationship kind retained on the canonical model.",
    };
  if (rule.from.includes(from.type) && rule.to.includes(to.type))
    return {
      allowed: true,
      explanation: `${relation.kind} is valid for ${from.type} → ${to.type}.`,
    };
  return {
    allowed: false,
    explanation: `${relation.kind} expects ${rule.from.join(" or ")} → ${rule.to.join(" or ")}, not ${from.type} → ${to.type}.`,
  };
}
export type AuditRecord = {
  id: string;
  action: string;
  timestamp: string;
  artifactIds: string[];
};
export type ProjectMetadata = {
  name: string;
  mission: string;
  problemStatement: string;
  owner: string;
  version: string;
  systemBoundary?: string;
  systemOfInterest?: string;
  intendedOutcomes?: string;
  inScope?: string;
  outOfScope?: string;
  knownConstraints?: string;
  assumptions?: string;
  dependencies?: string;
  reviewMilestones?: string;
  initialStakeholders?: string;
};
export type DiagramPerspective = {
  id: string;
  title: string;
  description?: string;
  notes?: string;
  profile: string;
  customProfileName?: string;
  diagramType: string;
  elementFilter: string;
  selectedIds: string[];
  positions: Record<string, { x: number; y: number }>;
  layoutMode: string;
  relationshipKinds?: string[];
  traversalDepth?: number;
  exportSettings?: Record<string, string>;
  savedAt: string;
};
export type Baseline = {
  id: string;
  name: string;
  createdAt: string;
  artifacts: Artifact[];
  relations: Relation[];
  versions: ArtifactVersion[];
  relationHistory: RelationHistoryEntry[];
  includedTypes: ArtifactType[];
  approvedBy: string;
  approvedAt: string;
  project?: ProjectMetadata;
};
export type ProjectBundle = {
  version: 1;
  artifacts: Artifact[];
  relations: Relation[];
  versions?: ArtifactVersion[];
  relationHistory?: RelationHistoryEntry[];
  project?: ProjectMetadata;
  baselines?: Baseline[];
  diagramPerspectives?: DiagramPerspective[];
};
export type BundleDiff = {
  addedArtifacts: string[];
  removedArtifacts: string[];
  changedArtifacts: string[];
  addedRelations: string[];
  removedRelations: string[];
};
export type CoverageMetric = {
  id: string;
  label: string;
  definition: string;
  numerator: number;
  denominator: number;
  uncoveredIds: string[];
};
export type MermaidProposal = {
  proposedRelations: Relation[];
  recognizedRelations: Relation[];
  knownNodes: string[];
  unsupportedLines: string[];
  diagnostics: MermaidDiagnostic[];
};
export type MermaidDiagnostic = {
  line: number;
  column: number;
  message: string;
  source: string;
};
export type ImpactEntry = {
  artifact: Artifact;
  hops: number;
  path: string[];
  classification: "direct" | "indirect" | "sos-cascade";
};
export type ImpactAnalysis = {
  entries: ImpactEntry[];
  directCount: number;
  indirectCount: number;
  sosCascadeCount: number;
  verificationGaps: string[];
  allocationLinks: number;
  relationshipChanges: number;
  proposedQualityFindings: string[];
};
export type ModelDiagnostics = {
  orphanArtifacts: string[];
  duplicateRelations: string[];
  cycles: string[][];
  conflictingRequirements: string[];
};

const seedCoreArtifacts: Artifact[] = [
  {
    id: "STK-001",
    type: "Stakeholder",
    name: "Emergency coordinator",
    description: "Coordinates multi-agency response and prioritizes incidents.",
    status: "Active",
  },
  {
    id: "NEED-014",
    type: "Need",
    name: "Know where the drone is",
    description:
      "The coordinator needs trustworthy location and mission status during response.",
    status: "Approved",
    priority: "High",
  },
  {
    id: "REQ-042",
    type: "Requirement",
    name: "Mission telemetry availability",
    description:
      "The system shall provide the current position, altitude, and mission state to an authorized coordinator at least every 2 seconds.",
    status: "In review",
    priority: "Critical",
    quality: "Pass",
    source: "NEED-014",
    metadata: {
      rationale:
        "The coordinator needs trustworthy, current mission status during response.",
      requirementType: "System requirement",
    },
    structure: {
      actor: "authorized coordinator",
      action: "provide",
      object: "current position, altitude, and mission state",
      condition: "during nominal response operations",
      threshold: "2",
      unit: "seconds",
    },
    verification: {
      method: "Test",
      objective: "Verify telemetry updates at the required interval.",
      preconditions: "Aircraft and console are connected.",
      procedure: "Record telemetry timestamps during a nominal mission.",
      expectedResult: "Updates occur at least every 2 seconds.",
      actualResult: "",
      owner: "Verification lead",
      environment: "Nominal response network",
      version: "0.1.0",
      baseline: "Baseline 1.1",
    },
  },
  {
    id: "REQ-043",
    type: "Requirement",
    name: "Telemetry continuity",
    description: "The system shall report a telemetry loss within 5 seconds.",
    status: "Draft",
    priority: "High",
    quality: "Warning",
    structure: {
      actor: "the system",
      action: "report",
      object: "a telemetry loss",
      condition: "during an active mission",
      threshold: "5",
      unit: "seconds",
    },
  },
  {
    id: "BLK-007",
    type: "Block",
    name: "Mission operations console",
    description: "Operator-facing console for mission planning and monitoring.",
    status: "Allocated",
  },
  {
    id: "BLK-011",
    type: "Block",
    name: "Flight telemetry service",
    description: "Publishes validated flight data over the response network.",
    status: "Allocated",
  },
  {
    id: "IF-003",
    type: "Interface",
    name: "Telemetry stream",
    description:
      "Position and mission-state data between aircraft and console.",
    status: "Defined",
  },
  {
    id: "TST-042",
    type: "Test",
    name: "Two-second telemetry test",
    description:
      "Verify telemetry updates at the required interval under nominal load.",
    status: "Planned",
    verified: false,
    verification: {
      method: "Test",
      objective:
        "Verify telemetry updates at the required interval under nominal load.",
      preconditions: "Aircraft and mission operations console are connected.",
      procedure:
        "Start a response mission and record telemetry timestamps for 60 seconds.",
      expectedResult: "Each update arrives within two seconds.",
      actualResult: "",
      owner: "Flight verification lead",
      environment: "Integration bench",
      version: "0.1.0",
      baseline: "Baseline 1.1",
    },
  },
  {
    id: "EVD-017",
    type: "Evidence",
    name: "Telemetry bench run 01",
    description: "Recorded test run from the integration bench.",
    status: "Available",
    verified: true,
  },
];
const seedCoreRelations: Relation[] = [
  { from: "STK-001", to: "NEED-014", kind: "expresses" },
  { from: "NEED-014", to: "REQ-042", kind: "refines" },
  { from: "REQ-042", to: "REQ-043", kind: "decomposes" },
  { from: "REQ-042", to: "BLK-007", kind: "allocated-to" },
  { from: "REQ-042", to: "BLK-011", kind: "allocated-to" },
  { from: "BLK-011", to: "IF-003", kind: "owns" },
  { from: "IF-003", to: "BLK-007", kind: "connects" },
  { from: "REQ-042", to: "TST-042", kind: "verified-by" },
  { from: "TST-042", to: "EVD-017", kind: "produces" },
  { from: "REQ-043", to: "BLK-011", kind: "allocated-to" },
];

const generatedArtifact = (
  id: string,
  type: ArtifactType,
  name: string,
  description: string,
  status = "Draft",
): Artifact => ({ id, type, name, description, status });

const generatedArtifacts: Artifact[] = [
  ...Array.from({ length: 60 }, (_, i) =>
    generatedArtifact(
      `ELC-${String(i + 1).padStart(3, "0")}`,
      "ElicitationRecord",
      `Response interview record ${i + 1}`,
      "Synthetic elicitation record preserving stakeholder intent and operational context.",
      i % 4 === 0 ? "Reviewed" : "Captured",
    ),
  ),
  ...Array.from({ length: 24 }, (_, i) =>
    generatedArtifact(
      `STK-${String(i + 2).padStart(3, "0")}`,
      "Stakeholder",
      `${["Flight operator", "Fire services lead", "Search team lead", "Privacy officer", "Maintenance lead"][i % 5]} ${i + 2}`,
      "Synthetic stakeholder participating in the emergency response mission.",
      "Active",
    ),
  ),
  ...Array.from({ length: 99 }, (_, i) => {
    const number = i + 1;
    const idNumber = number === 14 ? 100 : number;
    return generatedArtifact(
      `NEED-${String(idNumber).padStart(3, "0")}`,
      "Need",
      `Response need ${number}`,
      `A synthetic operational need for the emergency response drone mission thread ${number}.`,
      number % 4 === 0 ? "Approved" : "Candidate",
    );
  }),
  ...Array.from({ length: 260 }, (_, i) => {
    const number = i + 1;
    if (number === 42 || number === 43) return null;
    return {
      ...generatedArtifact(
        `REQ-${String(number).padStart(3, "0")}`,
        "Requirement",
        `Emergency response requirement ${number}`,
        `The system shall support response mission capability ${number} within ${(number % 7) + 1} seconds under nominal operating conditions.`,
        number % 5 === 0 ? "In review" : "Draft",
      ),
      priority:
        number % 11 === 0 ? "Critical" : number % 3 === 0 ? "High" : "Medium",
      quality: "Pass",
    } as Artifact;
  }).filter((artifact): artifact is Artifact => artifact !== null),
  ...Array.from({ length: 30 }, (_, i) =>
    generatedArtifact(
      `BLK-${String(i + 31).padStart(3, "0")}`,
      "Block",
      `Mission subsystem ${i + 1}`,
      "Synthetic SysML block participating in the system architecture.",
      "Allocated",
    ),
  ),
  ...Array.from({ length: 17 }, (_, i) =>
    generatedArtifact(
      `IF-${String(i + 4).padStart(3, "0")}`,
      "Interface",
      `Mission interface ${i + 1}`,
      "Synthetic interface connecting constituent system blocks.",
      "Defined",
    ),
  ),
  ...Array.from({ length: 179 }, (_, i) =>
    generatedArtifact(
      `TST-${String(i + 1 === 42 ? 180 : i + 1).padStart(3, "0")}`,
      "Test",
      `Response verification test ${i + 1}`,
      "Synthetic verification case with an objective pass or fail result.",
      i % 3 === 0 ? "Planned" : "Ready",
    ),
  ),
  ...Array.from({ length: 169 }, (_, i) =>
    generatedArtifact(
      `EVD-${String(i + 1 === 17 ? 170 : i + 1).padStart(3, "0")}`,
      "Evidence",
      `Verification evidence record ${i + 1}`,
      "Synthetic test evidence retained for review and audit.",
      "Available",
    ),
  ),
  ...Array.from({ length: 25 }, (_, i) =>
    generatedArtifact(
      `RISK-${String(i + 1).padStart(3, "0")}`,
      "Risk",
      `Mission risk ${i + 1}`,
      "Synthetic risk associated with mission safety, data, or interoperability.",
      i % 3 === 0 ? "Open" : "Mitigated",
    ),
  ),
  ...Array.from({ length: 25 }, (_, i) =>
    generatedArtifact(
      `DEC-${String(i + 1).padStart(3, "0")}`,
      "Decision",
      `Architecture decision ${i + 1}`,
      "Synthetic engineering decision retained with rationale and provenance.",
      "Recorded",
    ),
  ),
  ...Array.from({ length: 10 }, (_, i) =>
    generatedArtifact(
      `CON-${String(i + 1).padStart(3, "0")}`,
      "Constraint",
      `Mission constraint ${i + 1}`,
      "Synthetic operational, regulatory, or environmental constraint.",
      "Active",
    ),
  ),
  ...Array.from({ length: 4 }, (_, i) =>
    generatedArtifact(
      `CR-${String(i + 1).padStart(3, "0")}`,
      "ChangeRequest",
      `Telemetry change request ${i + 1}`,
      "Synthetic change request with rationale, affected artifacts, and target baseline.",
      i === 0 ? "Open" : "Recorded",
    ),
  ),
  ...Array.from({ length: 4 }, (_, i) =>
    generatedArtifact(
      `REV-${String(i + 1).padStart(3, "0")}`,
      "ReviewSession",
      `Engineering review session ${i + 1}`,
      "Synthetic review session retaining disposition and reviewer context.",
      "Completed",
    ),
  ),
  ...Array.from({ length: 6 }, (_, i) =>
    generatedArtifact(
      `CAP-${String(i + 1).padStart(3, "0")}`,
      "Capability",
      `Response capability ${i + 1}`,
      "Synthetic mission capability allocated across the response system.",
      "Defined",
    ),
  ),
  ...Array.from({ length: 3 }, (_, i) =>
    generatedArtifact(
      `MIS-${String(i + 1).padStart(3, "0")}`,
      "Mission",
      `Emergency response mission ${i + 1}`,
      "Synthetic mission thread coordinating capabilities and constituent systems.",
      "Active",
    ),
  ),
  ...Array.from({ length: 4 }, (_, i) => ({
    ...generatedArtifact(
      `SOS-${String(i + 1).padStart(3, "0")}`,
      "ConstituentSystem",
      `Constituent response system ${i + 1}`,
      "Synthetic constituent system participating in the system-of-systems mission.",
      "Active",
    ),
    metadata: {
      owner: [
        "Municipal fire service",
        "Regional air operations",
        "Search coordination",
        "Public safety network",
      ][i],
      authority: [
        "Incident command",
        "Flight operations",
        "Search director",
        "Interagency board",
      ][i],
      operationalIndependence: i % 2 === 0 ? "Yes" : "Partial",
      managerialIndependence: i % 2 === 0 ? "Yes" : "No",
      lifecycle: i % 2 === 0 ? "Evolving" : "Maintained",
      availability: `${95 + i}.0%`,
    },
  })),
];

export const seedArtifacts: Artifact[] = [
  ...seedCoreArtifacts,
  ...generatedArtifacts,
];

export const seedRelations: Relation[] = (() => {
  const relations = [...seedCoreRelations];
  const add = (from: string, to: string, kind: string) => {
    if (
      !relations.some(
        (relation) =>
          relation.from === from &&
          relation.to === to &&
          relation.kind === kind,
      )
    ) {
      relations.push({ from, to, kind });
    }
  };
  const requirementIds = seedArtifacts
    .filter((a) => a.type === "Requirement")
    .map((a) => a.id);
  const needIds = seedArtifacts
    .filter((a) => a.type === "Need")
    .map((a) => a.id);
  const blockIds = seedArtifacts
    .filter((a) => a.type === "Block")
    .map((a) => a.id);
  const interfaceIds = seedArtifacts
    .filter((a) => a.type === "Interface")
    .map((a) => a.id);
  const testIds = seedArtifacts
    .filter((a) => a.type === "Test")
    .map((a) => a.id);
  const evidenceIds = seedArtifacts
    .filter((a) => a.type === "Evidence")
    .map((a) => a.id);
  const elicitationIds = seedArtifacts
    .filter((a) => a.type === "ElicitationRecord")
    .map((a) => a.id);
  const stakeholderIds = seedArtifacts
    .filter((a) => a.type === "Stakeholder")
    .map((a) => a.id);
  const capabilityIds = seedArtifacts
    .filter((a) => a.type === "Capability")
    .map((a) => a.id);
  const missionIds = seedArtifacts
    .filter((a) => a.type === "Mission")
    .map((a) => a.id);
  const constituentIds = seedArtifacts
    .filter((a) => a.type === "ConstituentSystem")
    .map((a) => a.id);
  requirementIds.forEach((id, i) => {
    add(needIds[i % needIds.length], id, "refines");
    add(id, blockIds[i % blockIds.length], "allocated-to");
    add(id, testIds[i % testIds.length], "verified-by");
    add(
      testIds[i % testIds.length],
      evidenceIds[i % evidenceIds.length],
      "produces",
    );
    if (i > 0 && i % 3 === 0) add(requirementIds[i - 1], id, "decomposes");
  });
  interfaceIds.forEach((id, i) =>
    add(blockIds[i % blockIds.length], id, "owns"),
  );
  elicitationIds.forEach((id, i) => {
    add(stakeholderIds[i % stakeholderIds.length], id, "participates-in");
    add(id, needIds[i % needIds.length], "captures");
  });
  capabilityIds.forEach((id, i) =>
    add(id, blockIds[i % blockIds.length], "allocated-to"),
  );
  missionIds.forEach((id, i) =>
    add(id, capabilityIds[i % capabilityIds.length], "requires"),
  );
  constituentIds.forEach((id, i) =>
    add(id, blockIds[(i + 4) % blockIds.length], "represents"),
  );
  constituentIds.forEach((id, i) => {
    if (i < constituentIds.length - 1)
      add(id, constituentIds[i + 1], "depends-on");
    add(missionIds[i % missionIds.length], id, "uses");
  });
  return canonicalizeRelations(relations);
})();

export function mermaid(artifacts: Artifact[], relations: Relation[]) {
  const visible = artifacts.filter((a) =>
    relations.some((r) => r.from === a.id || r.to === a.id),
  );
  return [
    "flowchart LR",
    ...visible.map((a) => `  ${a.id.replace("-", "_")}["${a.id}: ${a.name}"]`),
    ...relations.map(
      (r) =>
        `  ${r.from.replace("-", "_")} -->|${r.kind}| ${r.to.replace("-", "_")}`,
    ),
  ].join("\n");
}

export function parseMermaidProposal(
  source: string,
  artifacts: Artifact[],
  relations: Relation[],
): MermaidProposal {
  const ids = new Set(artifacts.map((artifact) => artifact.id));
  const canonical = (value: string) =>
    value
      .trim()
      .replace(/[^A-Za-z0-9_-].*$/, "")
      .replaceAll("_", "-");
  const knownNodes = new Set<string>();
  const unsupportedLines: string[] = [];
  const diagnostics: MermaidDiagnostic[] = [];
  const proposedRelations: Relation[] = [];
  const recognizedRelations: Relation[] = [];
  const existing = new Set(
    relations.map(
      (relation) => `${relation.from}|${relation.kind}|${relation.to}`,
    ),
  );
  source.split(/\r?\n/).forEach((line, lineIndex) => {
    const trimmed = line.trim();
    const addDiagnostic = (
      message: string,
      column = line.search(/\S|$/) + 1,
    ) => {
      if (trimmed) unsupportedLines.push(trimmed);
      diagnostics.push({
        line: lineIndex + 1,
        column,
        message,
        source: trimmed,
      });
    };
    const node = line.match(/^\s*([A-Za-z0-9_-]+)\s*\["/);
    if (node && ids.has(canonical(node[1]))) knownNodes.add(canonical(node[1]));
    const edge = line.match(
      /^\s*([A-Za-z0-9_-]+)\s+-->\|([^|]+)\|\s+([A-Za-z0-9_-]+)/,
    );
    if (!edge) {
      if (trimmed && !/^(flowchart|graph|%%)/.test(trimmed) && !node)
        addDiagnostic("Unsupported Mermaid syntax");
      return;
    }
    const from = canonical(edge[1]);
    const to = canonical(edge[3]);
    const relation = { from, to, kind: edge[2].trim() };
    if (!ids.has(from) || !ids.has(to) || from === to) {
      const message =
        from === to
          ? "A relationship cannot connect an artifact to itself"
          : !ids.has(from) || !ids.has(to)
            ? "Both relationship endpoints must match known artifact IDs"
            : "Unsupported relationship proposal";
      addDiagnostic(message, line.indexOf(edge[1]) + 1);
      return;
    }
    knownNodes.add(from);
    knownNodes.add(to);
    recognizedRelations.push(relation);
    if (!existing.has(`${from}|${relation.kind}|${to}`))
      proposedRelations.push(relation);
  });
  return {
    proposedRelations,
    recognizedRelations,
    knownNodes: [...knownNodes],
    unsupportedLines,
    diagnostics,
  };
}

function csvCell(value: string | number | boolean | undefined) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function csvRequirements(artifacts: Artifact[]) {
  const rows = artifacts
    .filter((artifact) => artifact.type === "Requirement")
    .map((artifact) =>
      [
        artifact.id,
        artifact.name,
        artifact.description,
        artifact.status,
        artifact.priority,
        artifact.quality,
        artifact.verified,
      ]
        .map(csvCell)
        .join(","),
    );
  return ["id,name,description,status,priority,quality,verified", ...rows].join(
    "\n",
  );
}

export function csvTraceability(artifacts: Artifact[], relations: Relation[]) {
  const names = new Map(
    artifacts.map((artifact) => [artifact.id, artifact.name]),
  );
  return [
    "relationship_id,from,from_name,relationship,to,to_name",
    ...relations.map((relation, index) =>
      [
        relationId(relation, index),
        relation.from,
        names.get(relation.from),
        relation.kind,
        relation.to,
        names.get(relation.to),
      ]
        .map(csvCell)
        .join(","),
    ),
  ].join("\n");
}

export function csvVerification(artifacts: Artifact[], relations: Relation[]) {
  const names = new Map(
    artifacts.map((artifact) => [artifact.id, artifact.name]),
  );
  const testIds = new Set(
    artifacts
      .filter((artifact) => artifact.type === "Test")
      .map((artifact) => artifact.id),
  );
  const rows = relations
    .filter(
      (relation) => relation.kind === "verified-by" && testIds.has(relation.to),
    )
    .map((relation) => {
      const evidence = relations.find(
        (candidate) =>
          candidate.from === relation.to && candidate.kind === "produces",
      );
      return [
        relation.from,
        names.get(relation.from),
        artifacts.find((artifact) => artifact.id === relation.to)?.verification
          ?.method,
        relation.to,
        names.get(relation.to),
        evidence?.to,
        evidence ? names.get(evidence.to) : "",
      ]
        .map(csvCell)
        .join(",");
    });
  return [
    "requirement,requirement_name,method,test,test_name,evidence,evidence_name",
    ...rows,
  ].join("\n");
}

export function markdownReport(artifacts: Artifact[], relations: Relation[]) {
  const counts = new Map<string, number>();
  artifacts.forEach((artifact) =>
    counts.set(artifact.type, (counts.get(artifact.type) || 0) + 1),
  );
  return [
    "# TraceGraph engineering report",
    "",
    "Generated from the canonical project model.",
    "",
    "## Model summary",
    "",
    "| Artifact type | Count |",
    "| --- | ---: |",
    ...[...counts.entries()].map(([type, count]) => `| ${type} | ${count} |`),
    "",
    `Total relationships: **${relations.length}**`,
    "",
    "## Requirements",
    "",
    "| ID | Name | Status | Quality |",
    "| --- | --- | --- | --- |",
    ...artifacts
      .filter((artifact) => artifact.type === "Requirement")
      .slice(0, 50)
      .map(
        (artifact) =>
          `| ${artifact.id} | ${artifact.name} | ${artifact.status} | ${artifact.quality || "—"} |`,
      ),
    "",
    "The requirements table is limited to the first 50 records for readability. Use the CSV export for the complete set.",
  ].join("\n");
}

export function printableHtml(artifacts: Artifact[], relations: Relation[]) {
  const report = markdownReport(artifacts, relations)
    .replace(/^# (.*)$/gm, "<h1>$1</h1>")
    .replace(/^## (.*)$/gm, "<h2>$1</h2>")
    .replace(
      /^\| (.*) \|$/gm,
      (_match, row: string) => `<p>${row.replace(/ \| /g, " · ")}</p>`,
    )
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n\n/g, "<br />");
  return `<!doctype html><html><head><meta charset="utf-8"><title>TraceGraph engineering report</title><style>body{font:15px system-ui;max-width:1000px;margin:40px auto;color:#17203b}h1{color:#3449b8}h2{margin-top:28px}p{line-height:1.5}</style></head><body>${report}</body></html>`;
}

export type QualityFinding = {
  id: string;
  rule: string;
  severity: "advisory" | "required";
  triggeringText: string;
  message: string;
  why: string;
  suggestion: string;
};

export function qualityAnalysis(artifact: Artifact): QualityFinding[] {
  if (artifact.type !== "Requirement") return [];
  const findings: QualityFinding[] = [];
  const text = artifact.description.trim();
  const structure = artifact.structure;
  const add = (
    id: string,
    rule: string,
    severity: QualityFinding["severity"],
    triggeringText: string,
    message: string,
    why: string,
    suggestion: string,
  ) =>
    findings.push({
      id,
      rule,
      severity,
      triggeringText,
      message,
      why,
      suggestion,
    });
  if (!/\bshall\b/i.test(text))
    add(
      "modal-verb",
      "Weak modal verb",
      "required",
      text.match(/\b(should|may|could|might|will)\b/i)?.[0] || text,
      "Use “shall” to distinguish a requirement from a goal or design suggestion.",
      "Normative language makes obligation and verification intent explicit.",
      "Replace should, may, could, or informal wording with a subject plus shall.",
    );
  if (
    /\b(very|fast|quick|easy|simple|adequate|robust|user-friendly)\b/i.test(
      text,
    )
  )
    add(
      "subjective-language",
      "Subjective language",
      "advisory",
      text.match(
        /\b(very|fast|quick|easy|simple|adequate|robust|user-friendly)\b/i,
      )?.[0] || text,
      "Replace subjective language with an observable criterion.",
      "Different reviewers may interpret subjective terms differently.",
      "State a measurable threshold, condition, or acceptance criterion.",
    );
  if (
    /\b(appropriate|reasonable|sufficient|effective|seamless|intuitive|as needed)\b/i.test(
      text,
    )
  )
    add(
      "ambiguous-term",
      "Ambiguous term",
      "advisory",
      text.match(
        /\b(appropriate|reasonable|sufficient|effective|seamless|intuitive|as needed)\b/i,
      )?.[0] || text,
      "Replace the ambiguous term with an observable acceptance criterion.",
      "Different stakeholders may apply different interpretations during review or verification.",
      "Define a measurable outcome, allowed range, or explicit decision rule.",
    );
  if (/\b(many|few|several|numerous|approximately|about)\b/i.test(text))
    add(
      "vague-quantity",
      "Vague quantity",
      "advisory",
      text.match(/\b(many|few|several|numerous|approximately|about)\b/i)?.[0] ||
        text,
      "Replace the vague quantity with a count, range, or tolerance.",
      "Unbounded quantities make repeatable acceptance and capacity analysis difficult.",
      "State an exact count, bounded range, percentage, or measurable tolerance.",
    );
  if (
    /\b(etc\.?|and so on|as needed|as appropriate|timely|soon|normally)\b/i.test(
      text,
    )
  )
    add(
      "unbounded-term",
      "Unbounded term",
      "advisory",
      text.match(
        /\b(etc\.?|and so on|as needed|as appropriate|timely|soon|normally)\b/i,
      )?.[0] || text,
      "Bound the requirement with an explicit scope or condition.",
      "Unbounded terms leave acceptance criteria open to interpretation.",
      "Name the allowed cases, operating condition, or measurable limit.",
    );
  if (!structure?.actor && !/^the\s+\w+/i.test(text))
    add(
      "missing-actor",
      "Missing actor",
      "required",
      text,
      "Identify the system, subsystem, or actor responsible for the action.",
      "A responsible subject is needed for allocation and verification.",
      "Start with the responsible actor and preserve it in the structured builder.",
    );
  if (!structure?.action && !/\bshall\s+\w+/i.test(text))
    add(
      "missing-action",
      "Missing action",
      "required",
      text,
      "State one observable action after the normative verb.",
      "An action makes the requirement testable and decomposable.",
      "Use one clear verb after shall and split compound behavior into children.",
    );
  if (!structure?.object && /\bshall\s+\w+\b/i.test(text) && text.length < 45)
    add(
      "missing-object",
      "Missing object",
      "required",
      text,
      "Identify what the action must affect or produce.",
      "Without an object, the requirement cannot be allocated or verified.",
      "Name the data, capability, behavior, or result produced by the action.",
    );
  if (
    !structure?.condition &&
    !/\b(when|during|under|if|after|before)\b/i.test(text)
  )
    add(
      "missing-condition",
      "Missing operating condition",
      "advisory",
      text,
      "State when or under which conditions the requirement applies.",
      "Conditions define the scope of verification and prevent hidden assumptions.",
      "Add an operating mode, trigger, environment, or applicable scenario.",
    );
  if (!/\d/.test(text) && !structure?.threshold)
    add(
      "missing-threshold",
      "Missing threshold",
      "advisory",
      text,
      "Add a measurable threshold so verification can be objective.",
      "A measurable limit makes pass/fail evaluation repeatable.",
      "Add a limit, range, count, duration, probability, or explicit acceptance criterion.",
    );
  if (structure?.threshold && !structure.unit)
    add(
      "missing-unit",
      "Missing unit",
      "advisory",
      structure.threshold,
      "Provide a unit for the numeric threshold.",
      "A number without a unit is ambiguous across disciplines and tools.",
      "Specify seconds, meters, percent, watts, or another domain unit.",
    );
  if (!artifact.source)
    add(
      "missing-source",
      "Missing provenance",
      "advisory",
      artifact.id,
      "Link the requirement to its source note, need, or decision.",
      "Provenance lets reviewers confirm why the requirement exists.",
      "Add a source identifier or create a canonical refines/captures relationship.",
    );
  if (!artifact.metadata?.rationale && !structure?.rationale)
    add(
      "missing-rationale",
      "Missing rationale",
      "advisory",
      artifact.id,
      "Record why this requirement is necessary and what decision or need it supports.",
      "A rationale helps reviewers distinguish a necessary obligation from an accidental design preference.",
      "Capture the stakeholder need, risk, decision, or outcome that justifies the requirement.",
    );
  if (!artifact.verification && !artifact.verified)
    add(
      "missing-verification-method",
      "Missing verification method",
      "required",
      artifact.id,
      "Assign a verification method before review readiness.",
      "A requirement without an intended verification path cannot be objectively closed.",
      "Select Test, Analysis, Inspection, Demonstration, Simulation, Certification, Similarity, or Review of design.",
    );
  if (/\bshall\b[^.]*\b(and|or)\b[^.]*\b(shall|must)\b/i.test(text))
    add(
      "compound-requirement",
      "Compound requirement",
      "advisory",
      text.match(/\b(and|or)\b/i)?.[0] || text,
      "Consider splitting multiple obligations into separate requirements.",
      "Atomic requirements improve traceability, allocation, and verification.",
      "Create child requirements and preserve the parent relationship.",
    );
  if (/\b(is|are|was|were)\s+\w+ed\b/i.test(text))
    add(
      "passive-voice",
      "Passive voice",
      "advisory",
      text.match(/\b(is|are|was|were)\s+\w+ed\b/i)?.[0] || text,
      "Prefer an explicit actor and active action.",
      "Active voice makes responsibility and verification scope easier to inspect.",
      "Rewrite as actor shall action object.",
    );
  if (/\b(not|never|without)\b/i.test(text))
    add(
      "negative-requirement",
      "Negative requirement",
      "advisory",
      text.match(/\b(not|never|without)\b/i)?.[0] || text,
      "Express the desired positive behavior where possible.",
      "Positive acceptance criteria are usually easier to test and trace.",
      "Describe the required behavior and identify the failure condition separately.",
    );
  if (
    /\b(if possible|where feasible|as far as practicable|unless otherwise directed)\b/i.test(
      text,
    )
  )
    add(
      "escape-clause",
      "Escape clause",
      "required",
      text.match(
        /\b(if possible|where feasible|as far as practicable|unless otherwise directed)\b/i,
      )?.[0] || text,
      "Remove or bound the escape clause before treating this as an obligation.",
      "Escape clauses allow an implementation to claim compliance without a stable acceptance condition.",
      "Define the exception explicitly, or move it into a reviewed constraint or decision.",
    );
  if (
    /\b(use|using|built with|implemented in|database|React|Kubernetes)\b/i.test(
      text,
    )
  )
    add(
      "implementation-bias",
      "Implementation bias",
      "advisory",
      text.match(
        /\b(use|using|built with|implemented in|database|React|Kubernetes)\b/i,
      )?.[0] || text,
      "Avoid prescribing an implementation unless it is a deliberate constraint.",
      "Implementation-independent requirements preserve design freedom.",
      "State the required capability or outcome; move technology choices to a constraint or decision.",
    );
  return findings;
}

export function qualityFindings(artifact: Artifact) {
  return qualityAnalysis(artifact).map((finding) => finding.message);
}

export function coverageMetrics(
  artifacts: Artifact[],
  relations: Relation[],
): CoverageMetric[] {
  const linked = (
    type: ArtifactType,
    kind: string,
    direction: "from" | "to",
  ) => {
    const items = artifacts.filter((artifact) => artifact.type === type);
    const covered = new Set(
      relations
        .filter((relation) => relation.kind === kind)
        .map((relation) =>
          direction === "from" ? relation.from : relation.to,
        ),
    );
    return {
      items,
      covered,
    };
  };
  const needs = linked("Need", "refines", "from");
  const requirements = linked("Requirement", "allocated-to", "from");
  const verified = linked("Requirement", "verified-by", "from");
  const tests = linked("Test", "produces", "from");
  const decomposed = linked("Requirement", "decomposes", "from");
  const metric = (
    id: string,
    label: string,
    definition: string,
    items: Artifact[],
    covered: Set<string>,
  ): CoverageMetric => ({
    id,
    label,
    definition,
    numerator: items.filter((item) => covered.has(item.id)).length,
    denominator: items.length,
    uncoveredIds: items
      .filter((item) => !covered.has(item.id))
      .map((item) => item.id),
  });
  return [
    metric(
      "need-requirement",
      "Need → requirement",
      "Needs with at least one refining requirement.",
      needs.items,
      needs.covered,
    ),
    metric(
      "requirement-allocation",
      "Requirement → component",
      "Requirements allocated to at least one architecture block.",
      requirements.items,
      requirements.covered,
    ),
    metric(
      "requirement-verification",
      "Requirement → test",
      "Requirements with at least one verification case.",
      verified.items,
      verified.covered,
    ),
    metric(
      "test-evidence",
      "Test → evidence",
      "Tests producing at least one evidence record.",
      tests.items,
      tests.covered,
    ),
    metric(
      "requirement-decomposition",
      "Requirement decomposition",
      "Requirements with at least one decomposes relationship.",
      decomposed.items,
      decomposed.covered,
    ),
  ];
}

export function analyzeImpact(
  root: Artifact,
  artifacts: Artifact[],
  relations: Relation[],
  proposedArtifact?: Artifact,
  maxDepth = 4,
): ImpactAnalysis {
  const byId = new Map(artifacts.map((artifact) => [artifact.id, artifact]));
  const paths = new Map<string, string[]>([[root.id, [root.id]]]);
  let frontier = [root.id];
  for (let depth = 1; depth <= maxDepth; depth += 1) {
    const next: string[] = [];
    relations.forEach((relation) => {
      if (!frontier.includes(relation.from) || paths.has(relation.to)) return;
      const currentPath = paths.get(relation.from) || [relation.from];
      paths.set(relation.to, [...currentPath, relation.to]);
      next.push(relation.to);
    });
    frontier = next;
    if (!frontier.length) break;
  }
  const entries = [...paths.entries()]
    .filter(([id]) => id !== root.id)
    .map(([id, path]) => {
      const artifact = byId.get(id);
      if (!artifact) return null;
      const sos = path.some((pathId) => {
        const item = byId.get(pathId);
        return item?.type === "Mission" || item?.type === "ConstituentSystem";
      });
      return {
        artifact,
        hops: path.length - 1,
        path,
        classification: sos
          ? ("sos-cascade" as const)
          : path.length === 2
            ? ("direct" as const)
            : ("indirect" as const),
      };
    })
    .filter((entry): entry is ImpactEntry => Boolean(entry));
  const affectedIds = new Set(entries.map((entry) => entry.artifact.id));
  const verificationGaps = entries
    .filter(
      (entry) =>
        entry.artifact.type === "Requirement" &&
        !relations.some(
          (relation) =>
            relation.from === entry.artifact.id &&
            relation.kind === "verified-by",
        ),
    )
    .map((entry) => entry.artifact.id);
  const allocationLinks = relations.filter(
    (relation) =>
      relation.kind === "allocated-to" &&
      (relation.from === root.id || affectedIds.has(relation.from)),
  ).length;
  return {
    entries,
    directCount: entries.filter((entry) => entry.classification === "direct")
      .length,
    indirectCount: entries.filter(
      (entry) => entry.classification === "indirect",
    ).length,
    sosCascadeCount: entries.filter(
      (entry) => entry.classification === "sos-cascade",
    ).length,
    verificationGaps,
    allocationLinks,
    relationshipChanges: relations.filter(
      (relation) =>
        relation.from === root.id ||
        relation.to === root.id ||
        affectedIds.has(relation.from) ||
        affectedIds.has(relation.to),
    ).length,
    proposedQualityFindings: qualityFindings(proposedArtifact || root),
  };
}

export function modelDiagnostics(
  artifacts: Artifact[],
  relations: Relation[],
): ModelDiagnostics {
  const connected = new Set(
    relations.flatMap((relation) => [relation.from, relation.to]),
  );
  const relationCounts = new Map<string, number>();
  relations.forEach((relation) => {
    const key = `${relation.from}|${relation.kind}|${relation.to}`;
    relationCounts.set(key, (relationCounts.get(key) || 0) + 1);
  });
  const adjacency = new Map<string, string[]>();
  relations.forEach((relation) => {
    adjacency.set(relation.from, [
      ...(adjacency.get(relation.from) || []),
      relation.to,
    ]);
  });
  const cycles = new Map<string, string[]>();
  const visit = (start: string, current: string, path: string[]) => {
    for (const next of adjacency.get(current) || []) {
      if (next === start) {
        const cycle = [...path, start];
        const nodes = cycle.slice(0, -1);
        const smallest = [...nodes].sort()[0];
        const offset = nodes.indexOf(smallest);
        const normalized = [...nodes.slice(offset), ...nodes.slice(0, offset)];
        cycles.set(normalized.join("→"), [...normalized, smallest]);
      } else if (!path.includes(next) && path.length < artifacts.length) {
        visit(start, next, [...path, next]);
      }
    }
  };
  artifacts.forEach((artifact) =>
    visit(artifact.id, artifact.id, [artifact.id]),
  );
  const names = new Map<string, Artifact[]>();
  artifacts
    .filter((artifact) => artifact.type === "Requirement")
    .forEach((artifact) => {
      const key = artifact.name.trim().toLowerCase();
      names.set(key, [...(names.get(key) || []), artifact]);
    });
  const conflictingRequirements = [...names.values()]
    .filter(
      (group) =>
        group.length > 1 &&
        new Set(group.map((artifact) => artifact.description)).size > 1,
    )
    .flatMap((group) => group.map((artifact) => artifact.id));
  return {
    orphanArtifacts: artifacts
      .filter((artifact) => !connected.has(artifact.id))
      .map((artifact) => artifact.id),
    duplicateRelations: [...relationCounts.entries()]
      .filter(([, count]) => count > 1)
      .map(([key]) => key),
    cycles: [...cycles.values()],
    conflictingRequirements,
  };
}

export function validateBundle(value: unknown): ProjectBundle {
  if (!value || typeof value !== "object")
    throw new Error("Project bundle must be an object.");
  const bundle = value as Partial<ProjectBundle>;
  if (
    bundle.version !== 1 ||
    !Array.isArray(bundle.artifacts) ||
    !Array.isArray(bundle.relations)
  )
    throw new Error("Unsupported or malformed project bundle.");
  const ids = new Set(bundle.artifacts.map((a) => a.id));
  if (
    ids.size !== bundle.artifacts.length ||
    bundle.artifacts.some((a) => !a.id || !a.type || !a.name)
  )
    throw new Error("Artifacts must have unique IDs, types, and names.");
  if (
    bundle.relations.some((r) => !ids.has(r.from) || !ids.has(r.to) || !r.kind)
  )
    throw new Error(
      "Every relationship must reference existing artifacts and a relationship kind.",
    );
  if (
    bundle.versions !== undefined &&
    (!Array.isArray(bundle.versions) ||
      bundle.versions.some(
        (entry) =>
          !entry.id ||
          !entry.artifactId ||
          typeof entry.version !== "number" ||
          !entry.timestamp ||
          !entry.action ||
          !entry.snapshot,
      ))
  )
    throw new Error("Artifact history entries are malformed.");
  if (
    bundle.relationHistory !== undefined &&
    (!Array.isArray(bundle.relationHistory) ||
      bundle.relationHistory.some(
        (entry) =>
          !entry.id ||
          !entry.timestamp ||
          !entry.action ||
          !Array.isArray(entry.added) ||
          !Array.isArray(entry.removed),
      ))
  )
    throw new Error("Relationship history entries are malformed.");
  if (
    bundle.baselines !== undefined &&
    (!Array.isArray(bundle.baselines) ||
      bundle.baselines.some(
        (baseline) =>
          !baseline.id ||
          !baseline.name ||
          !baseline.createdAt ||
          !Array.isArray(baseline.artifacts) ||
          !Array.isArray(baseline.relations) ||
          !Array.isArray(baseline.versions) ||
          !Array.isArray(baseline.relationHistory) ||
          !Array.isArray(baseline.includedTypes) ||
          !baseline.approvedBy ||
          !baseline.approvedAt ||
          baseline.artifacts.some((artifact) => !artifact.id) ||
          baseline.relations.some(
            (relation) => !relation.from || !relation.to || !relation.kind,
          ),
      ))
  )
    throw new Error("Baseline entries are malformed.");
  if (
    bundle.diagramPerspectives !== undefined &&
    (!Array.isArray(bundle.diagramPerspectives) ||
      bundle.diagramPerspectives.some(
        (diagram) =>
          !diagram.id ||
          !diagram.title ||
          !diagram.profile ||
          !diagram.diagramType ||
          !diagram.elementFilter ||
          !Array.isArray(diagram.selectedIds) ||
          !diagram.positions ||
          !diagram.layoutMode ||
          !diagram.savedAt,
      ))
  )
    throw new Error("Diagram perspective entries are malformed.");
  return {
    ...bundle,
    relations: canonicalizeRelations(bundle.relations),
  } as ProjectBundle;
}

export function compareBundles(
  current: ProjectBundle,
  baseline: ProjectBundle,
): BundleDiff {
  const currentArtifacts = new Map(current.artifacts.map((a) => [a.id, a]));
  const baselineArtifacts = new Map(baseline.artifacts.map((a) => [a.id, a]));
  const relationKey = (r: Relation) => `${r.from}|${r.kind}|${r.to}`;
  const currentRelations = new Set(current.relations.map(relationKey));
  const baselineRelations = new Set(baseline.relations.map(relationKey));
  return {
    addedArtifacts: [...currentArtifacts.keys()].filter(
      (id) => !baselineArtifacts.has(id),
    ),
    removedArtifacts: [...baselineArtifacts.keys()].filter(
      (id) => !currentArtifacts.has(id),
    ),
    changedArtifacts: [...currentArtifacts.keys()].filter(
      (id) =>
        baselineArtifacts.has(id) &&
        JSON.stringify(currentArtifacts.get(id)) !==
          JSON.stringify(baselineArtifacts.get(id)),
    ),
    addedRelations: [...currentRelations].filter(
      (relation) => !baselineRelations.has(relation),
    ),
    removedRelations: [...baselineRelations].filter(
      (relation) => !currentRelations.has(relation),
    ),
  };
}

function xml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
export function svgDocument(
  _artifacts: Artifact[],
  relations: Relation[],
  options: { title?: string; legend?: boolean } = {},
) {
  const ids = [
    ...new Set([
      ..._artifacts.map((artifact) => artifact.id),
      ...relations.flatMap((r) => [r.from, r.to]),
    ]),
  ];
  const columns = Math.max(
    4,
    Math.min(32, Math.ceil(Math.sqrt(ids.length || 1))),
  );
  const rowHeight = 120;
  const nodeX = (index: number) => 75 + (index % columns) * 150;
  const nodeY = (index: number) =>
    120 + Math.floor(index / columns) * rowHeight;
  const width = Math.max(900, columns * 150);
  const height = Math.max(
    320,
    Math.ceil(ids.length / columns) * rowHeight + 120,
  );
  const title = options.title || "TraceGraph digital thread";
  const nodes = ids
    .map(
      (id, i) =>
        `<g><circle cx="${nodeX(i)}" cy="${nodeY(i)}" r="28" fill="#17234a" stroke="#5b86de" stroke-width="2"/><text x="${nodeX(i)}" y="${nodeY(i) + 60}" text-anchor="middle" fill="#dce5fa" font-family="monospace" font-size="12">${xml(id)}</text></g>`,
    )
    .join("");
  const edges = relations
    .map((r, index) => {
      const from = ids.indexOf(r.from);
      const to = ids.indexOf(r.to);
      const fromX = nodeX(from);
      const toX = nodeX(to);
      const fromY = nodeY(from);
      const toY = nodeY(to);
      const labelX = (fromX + toX) / 2;
      const labelY = (fromY + toY) / 2 - 12;
      return `<line x1="${fromX}" y1="${fromY}" x2="${toX}" y2="${toY}" stroke="#4d9fe0" stroke-width="2"/><text x="${labelX}" y="${labelY}" text-anchor="middle" fill="#8494b4" font-family="monospace" font-size="9">${xml(r.kind)}</text><text x="${labelX}" y="${labelY - 10}" text-anchor="middle" fill="#60749d" font-family="monospace" font-size="7">${xml(relationId(r, index))}</text>`;
    })
    .join("");
  const legend = options.legend
    ? `<g transform="translate(24 ${height - 42})"><rect width="260" height="22" rx="5" fill="#17234a" stroke="#4d9fe0"/><text x="10" y="15" fill="#dce5fa" font-family="sans-serif" font-size="11">Canonical relationship view · ${ids.length} nodes</text></g>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#080d21"/><text x="24" y="34" fill="#f0eff0" font-family="sans-serif" font-size="18">${xml(title)}</text>${edges}${nodes}${legend}</svg>`;
}
