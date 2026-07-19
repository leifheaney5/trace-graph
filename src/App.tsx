import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  analyzeImpact,
  canonicalizeRelations,
  canonicalRelationshipKinds,
  compareBundles,
  coverageMetrics,
  csvRequirements,
  csvTraceability,
  csvVerification,
  mermaid,
  markdownReport,
  modelDiagnostics,
  parseMermaidProposal,
  printableHtml,
  qualityFindings,
  qualityAnalysis,
  relationId,
  validateRelation,
  seedArtifacts,
  seedRelations,
  svgDocument,
  validateBundle,
} from "./model";
import {
  medicalDeviceMetadata,
  medicalDeviceArtifacts,
  medicalDeviceRelations,
  cloudServicesMetadata,
  cloudServicesArtifacts,
  cloudServicesRelations,
} from "./samples";
import type {
  Artifact,
  ArtifactType,
  ArtifactVersion,
  AuditRecord,
  Baseline,
  DiagramPerspective,
  ProjectBundle,
  ProjectMetadata,
  Relation,
  RelationHistoryEntry,
  RequirementStructure,
  VerificationDetails,
} from "./model";
import { BrowserProjectRepository } from "./repository";
import { profileIds, profileRegistry, type ProfileId } from "./profiles";
import "./App.css";

type View =
  | "Landing"
  | "Overview"
  | "Elicitation"
  | "Requirements"
  | "Traceability"
  | "Diagrams"
  | "Architecture"
  | "Verification"
  | "Reviews"
  | "Impact"
  | "Baselines";
type BaselineDraft = {
  name: string;
  includedTypes: ArtifactType[];
  approvedBy: string;
};
type PerformanceMetric = {
  id: string;
  label: string;
  ms: number;
  measuredAt: string;
};
const artifactTypes: ArtifactType[] = [
  "Project",
  "Need",
  "ElicitationRecord",
  "StakeholderGroup",
  "SourceDocument",
  "InterviewNote",
  "Observation",
  "Concern",
  "ReviewSession",
  "Review",
  "Requirement",
  "Scenario",
  "Stakeholder",
  "Class",
  "Lifeline",
  "Message",
  "DeploymentNode",
  "Component",
  "Block",
  "Part",
  "Port",
  "ValueType",
  "Interface",
  "DataItem",
  "Actor",
  "UseCase",
  "Activity",
  "Action",
  "ObjectFlow",
  "State",
  "Transition",
  "Package",
  "Allocation",
  "ItemFlow",
  "Test",
  "VerificationMethod",
  "TestResult",
  "Evidence",
  "EvidenceArtifact",
  "Risk",
  "Assumption",
  "Constraint",
  "Decision",
  "ChangeRequest",
  "Baseline",
  "Diagram",
  "Report",
  "Comment",
  "ActionItem",
  "Capability",
  "Mission",
  "SystemOfSystems",
  "SystemOfInterest",
  "MissionThread",
  "ConstituentSystem",
  "OperationalNode",
  "Organization",
  "Authority",
  "SharedResource",
  "EmergentBehavior",
  "EvolutionConcern",
  "InteroperabilityConcern",
  "CapabilityGap",
  "SharedRisk",
];
const seedBaselines = (): Baseline[] => [
  {
    id: "BL-1.0",
    name: "Baseline 1.0",
    createdAt: "2026-07-01T09:00:00.000Z",
    artifacts: structuredClone(seedArtifacts),
    relations: structuredClone(seedRelations),
    versions: [],
    relationHistory: [],
    includedTypes: artifactTypes,
    approvedBy: "Systems engineering board",
    approvedAt: "2026-07-01T09:00:00.000Z",
  },
  {
    id: "BL-1.1",
    name: "Baseline 1.1",
    createdAt: "2026-07-15T09:00:00.000Z",
    artifacts: structuredClone(
      seedArtifacts.map((artifact) =>
        artifact.id === "REQ-042"
          ? {
              ...artifact,
              description: artifact.description.replace(
                "2 seconds",
                "1 second",
              ),
            }
          : artifact,
      ),
    ),
    relations: structuredClone(seedRelations),
    versions: [],
    relationHistory: [],
    includedTypes: artifactTypes,
    approvedBy: "Systems engineering board",
    approvedAt: "2026-07-15T09:00:00.000Z",
  },
];
const nav: { view: View; icon: string; hint: string }[] = [
  { view: "Overview", icon: "◈", hint: "Project cockpit" },
  { view: "Elicitation", icon: "◌", hint: "Discover intent" },
  { view: "Requirements", icon: "≡", hint: "Engineer precision" },
  { view: "Traceability", icon: "⌘", hint: "Follow the thread" },
  { view: "Diagrams", icon: "▦", hint: "Compose a perspective" },
  { view: "Architecture", icon: "⌬", hint: "Model the system" },
  { view: "Verification", icon: "✓", hint: "Plan evidence" },
  { view: "Reviews", icon: "▤", hint: "Run technical reviews" },
  { view: "Impact", icon: "↗", hint: "Simulate change" },
  { view: "Baselines", icon: "▣", hint: "Manage configuration" },
];
const tourSteps: { title: string; body: string; view: View }[] = [
  {
    title: "Open a stakeholder need",
    body: "Start with the operational intent behind the system. The sample project keeps the source need connected to every downstream decision.",
    view: "Elicitation",
  },
  {
    title: "Convert intent into a requirement",
    body: "Open the requirement workspace to turn plain language into a precise, testable statement.",
    view: "Requirements",
  },
  {
    title: "Improve the requirement",
    body: "Review quality findings, thresholds, and wording before you mark the statement ready for engineering review.",
    view: "Requirements",
  },
  {
    title: "Allocate it to a SysML block",
    body: "Architecture views show the same canonical requirement allocated to system blocks and interfaces.",
    view: "Architecture",
  },
  {
    title: "Open its trace",
    body: "Traceability makes the path from stakeholder need through requirement and architecture to evidence inspectable.",
    view: "Traceability",
  },
  {
    title: "Generate Mermaid",
    body: "Use the open export strip or the header action to produce a Mermaid source file from real model relationships.",
    view: "Traceability",
  },
  {
    title: "Export the diagram as PNG",
    body: "Download the current canonical graph as an image for a review packet or engineering note.",
    view: "Traceability",
  },
];
const repository = new BrowserProjectRepository();
const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
const defaultProject: ProjectMetadata = {
  name: "Emergency Response Drone",
  mission:
    "Coordinate safe, timely emergency response from shared aerial telemetry.",
  problemStatement:
    "Multi-agency responders need trustworthy mission status and evidence without losing stakeholder intent.",
  owner: "Systems engineering team",
  version: "0.1.0",
  systemBoundary:
    "Emergency response coordination from mission planning through evidence review.",
  systemOfInterest: "Emergency response drone coordination service",
  intendedOutcomes:
    "Timely, trustworthy shared mission status for multi-agency responders.",
  inScope:
    "Telemetry, coordination, mission status, verification, and evidence.",
  outOfScope:
    "Aircraft airworthiness certification and agency dispatch policy.",
  knownConstraints:
    "Intermittent connectivity, privacy, and bounded local storage.",
  assumptions:
    "Authorized responders have a supported browser and local workspace.",
  dependencies:
    "Flight telemetry service, response network, and agency operators.",
  reviewMilestones:
    "Concept review; requirements review; verification readiness.",
  initialStakeholders:
    "Emergency coordinator; flight operations; search director.",
};
const initialState = () => {
  const started = performance.now();
  const bundle = repository.load();
  return {
    artifacts: bundle.artifacts,
    relations: bundle.relations,
    versions: bundle.versions || [],
    relationHistory: bundle.relationHistory || [],
    project: bundle.project || defaultProject,
    baselines: bundle.baselines || [],
    diagramPerspectives: bundle.diagramPerspectives || [],
    projectLoadMs: performance.now() - started,
  };
};
function download(name: string, content: string, type = "text/plain") {
  const safeName =
    name.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-") ||
    "tracegraph-export";
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = safeName;
  a.click();
  URL.revokeObjectURL(a.href);
}
function downloadBlob(name: string, blob: Blob) {
  const safeName =
    name.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-") ||
    "tracegraph-export";
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = safeName;
  a.click();
  URL.revokeObjectURL(a.href);
}
function mermaidMarkdown(source: string, title: string) {
  return `# ${title}\n\nGenerated from the TraceGraph canonical model.\n\n\`\`\`mermaid\n${source}\n\`\`\`\n`;
}

export default function App() {
  const initial = useMemo(initialState, []);
  const [view, setView] = useState<View>("Landing");
  const [mode, setMode] = useState<"Guided" | "Engineering">(() =>
    localStorage.getItem("tg-mode") === "Engineering"
      ? "Engineering"
      : "Guided",
  );
  const [theme, setTheme] = useState<"dark" | "light">(() =>
    localStorage.getItem("tg-theme") === "light" ? "light" : "dark",
  );
  const [artifacts, setArtifacts] = useState<Artifact[]>(initial.artifacts);
  const [relations, setRelations] = useState<Relation[]>(initial.relations);
  const [versions, setVersions] = useState<ArtifactVersion[]>(initial.versions);
  const [relationHistory, setRelationHistory] = useState<
    RelationHistoryEntry[]
  >(initial.relationHistory);
  const [project, setProject] = useState<ProjectMetadata>(initial.project);
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>(() =>
    repository.listAudit(),
  );
  const [performanceStats, setPerformanceStats] = useState<PerformanceMetric[]>(
    [
      {
        id: "project-load",
        label: "Project load",
        ms: initial.projectLoadMs,
        measuredAt: new Date().toISOString(),
      },
    ],
  );
  const [baselines, setBaselines] = useState<Baseline[]>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("tg-baselines") || "null");
      return Array.isArray(stored) && stored.length
        ? stored.map((baseline) => ({
            ...baseline,
            versions: Array.isArray(baseline.versions) ? baseline.versions : [],
            relationHistory: Array.isArray(baseline.relationHistory)
              ? baseline.relationHistory
              : [],
            includedTypes: Array.isArray(baseline.includedTypes)
              ? baseline.includedTypes
              : artifactTypes,
            approvedBy: baseline.approvedBy || "Not recorded",
            approvedAt: baseline.approvedAt || baseline.createdAt,
          }))
        : initial.baselines?.length
          ? initial.baselines
          : seedBaselines();
    } catch {
      return seedBaselines();
    }
  });
  const [diagramPerspectives, setDiagramPerspectives] = useState<
    DiagramPerspective[]
  >(initial.diagramPerspectives);
  const [past, setPast] = useState<
    { artifacts: Artifact[]; relations: Relation[] }[]
  >([]);
  const [future, setFuture] = useState<
    { artifacts: Artifact[]; relations: Relation[] }[]
  >([]);
  const [selected, setSelected] = useState("REQ-042");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [notice, setNotice] = useState("All changes saved");
  const [error, setError] = useState("");
  const [importPreview, setImportPreview] = useState<ProjectBundle | null>(
    null,
  );
  const [tourStep, setTourStep] = useState<number | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [exportTitle, setExportTitle] = useState("TraceGraph digital thread");
  const [exportLegend, setExportLegend] = useState(true);
  const [pngScale, setPngScale] = useState(2);
  const [pngBackground, setPngBackground] = useState("#080d21");
  const [repositoryReady, setRepositoryReady] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [lastChangeRequestId, setLastChangeRequestId] = useState("");
  const [showSampleSelector, setShowSampleSelector] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const recordPerformance = (label: string, ms: number) => {
    setPerformanceStats((current) => [
      ...current.filter((metric) => metric.label !== label).slice(-7),
      {
        id: crypto.randomUUID(),
        label,
        ms,
        measuredAt: new Date().toISOString(),
      },
    ]);
  };
  const recordAudit = (action: string, artifactIds: string[]) => {
    const record: AuditRecord = {
      id: crypto.randomUUID(),
      action,
      timestamp: new Date().toISOString(),
      artifactIds,
    };
    setAuditRecords((records) => [...records, record].slice(-100));
    repository.recordAudit(record);
  };
  const updateProject = (patch: Partial<ProjectMetadata>) => {
    setProject((current) => ({ ...current, ...patch }));
    setDirty(true);
    setNotice("Unsaved project framing changes");
    recordAudit("project.frame.update", []);
  };
  useEffect(() => {
    localStorage.setItem("tg-theme", theme);
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  useEffect(() => {
    localStorage.setItem("tg-mode", mode);
  }, [mode]);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 150);
    return () => window.clearTimeout(timer);
  }, [query]);
  useEffect(() => {
    repository.hydrate().then((bundle) => {
      if (bundle) {
        setArtifacts(bundle.artifacts);
        setRelations(canonicalizeRelations(bundle.relations));
        setVersions(bundle.versions || []);
        setRelationHistory(bundle.relationHistory || []);
        setProject(bundle.project || defaultProject);
        if (bundle.baselines?.length) setBaselines(bundle.baselines);
        if (bundle.diagramPerspectives?.length)
          setDiagramPerspectives(bundle.diagramPerspectives);
      }
      setRepositoryReady(true);
    });
  }, []);
  useEffect(() => {
    if (!repositoryReady) return;
    repository.save({
      version: 1,
      artifacts,
      relations,
      versions,
      relationHistory,
      project,
      baselines,
      diagramPerspectives,
    });
    localStorage.setItem("tg-baselines", JSON.stringify(baselines));
    setNotice("All changes saved");
    setDirty(false);
  }, [
    artifacts,
    relations,
    versions,
    relationHistory,
    project,
    baselines,
    diagramPerspectives,
    repositoryReady,
  ]);
  useEffect(() => {
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue =
        "TraceGraph is still saving your latest model changes. Leave anyway?";
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [dirty]);
  const current = artifacts.find((a) => a.id === selected) || artifacts[0];
  const filtered = artifacts.filter((a) =>
    `${a.id} ${a.name} ${a.type}`
      .toLowerCase()
      .includes(debouncedQuery.toLowerCase()),
  );
  const transact = (
    nextArtifacts: Artifact[],
    nextRelations = relations,
    action = "model.update",
  ) => {
    const nextById = new Map(
      nextArtifacts.map((artifact) => [artifact.id, artifact]),
    );
    const changed = artifacts.filter((artifact) => {
      const next = nextById.get(artifact.id);
      return !next || JSON.stringify(next) !== JSON.stringify(artifact);
    });
    const now = new Date().toISOString();
    const history = changed.map((artifact) => ({
      id: crypto.randomUUID(),
      artifactId: artifact.id,
      version:
        versions.filter((entry) => entry.artifactId === artifact.id).length + 1,
      timestamp: now,
      action,
      snapshot: structuredClone(artifact),
    }));
    if (history.length)
      setVersions((entries) => [...entries, ...history].slice(-500));
    const canonicalNextRelations = canonicalizeRelations(nextRelations);
    const relationKey = (relation: Relation) =>
      JSON.stringify({
        id: relation.id,
        from: relation.from,
        to: relation.to,
        kind: relation.kind,
      });
    const previousRelationKeys = new Set(relations.map(relationKey));
    const nextRelationKeys = new Set(canonicalNextRelations.map(relationKey));
    const addedRelations = canonicalNextRelations.filter(
      (relation) => !previousRelationKeys.has(relationKey(relation)),
    );
    const removedRelations = relations.filter(
      (relation) => !nextRelationKeys.has(relationKey(relation)),
    );
    if (addedRelations.length || removedRelations.length)
      setRelationHistory((entries) =>
        [
          ...entries,
          {
            id: crypto.randomUUID(),
            timestamp: now,
            action,
            added: structuredClone(addedRelations),
            removed: structuredClone(removedRelations),
          },
        ].slice(-500),
      );
    setPast((xs) => [...xs.slice(-19), { artifacts, relations }]);
    setFuture([]);
    setArtifacts(nextArtifacts);
    setRelations(canonicalNextRelations);
    setDirty(true);
    setNotice("Unsaved changes");
    recordAudit(
      action,
      nextArtifacts.map((artifact) => artifact.id),
    );
  };
  const updateArtifact = (id: string, patch: Partial<Artifact>) =>
    transact(
      artifacts.map((artifact) =>
        artifact.id === id ? { ...artifact, ...patch } : artifact,
      ),
    );
  const archiveArtifact = (id: string) =>
    updateArtifact(id, { status: "Archived" });
  const bulkArchive = (ids: string[]) => {
    if (!ids.length) return;
    const selectedIds = new Set(ids);
    transact(
      artifacts.map((artifact) =>
        selectedIds.has(artifact.id)
          ? { ...artifact, status: "Archived" }
          : artifact,
      ),
      relations,
      "bulk.archive",
    );
  };
  const restoreArtifact = (id: string) =>
    updateArtifact(id, { status: "Draft" });
  const update = (patch: Partial<Artifact>) =>
    updateArtifact(current.id, patch);
  const addRelation = (relation: Relation) => {
    const validation = validateRelation(relation, artifacts);
    if (
      validation.allowed &&
      artifacts.some((a) => a.id === relation.from) &&
      artifacts.some((a) => a.id === relation.to) &&
      !relations.some(
        (r) =>
          r.from === relation.from &&
          r.to === relation.to &&
          r.kind === relation.kind,
      )
    ) {
      transact(artifacts, [
        ...relations,
        {
          ...relation,
          id: relation.id || `REL-NEW-${crypto.randomUUID()}`,
        },
      ]);
    } else if (!validation.allowed) {
      setNotice(`Relationship rejected: ${validation.explanation}`);
    }
  };
  const createRequirement = () => {
    const id = `REQ-${String(artifacts.length + 1).padStart(3, "0")}`;
    transact([
      ...artifacts,
      {
        id,
        type: "Requirement",
        name: "New requirement",
        description: "The system shall ",
        status: "Draft",
        priority: "Medium",
        quality: "Warning",
      },
    ]);
    setSelected(id);
    setView("Requirements");
  };
  const createArtifactFromElicitation = (
    type:
      | "Concern"
      | "Need"
      | "Assumption"
      | "Constraint"
      | "Requirement"
      | "Decision"
      | "ActionItem",
    notes: string,
    stakeholderName: string,
  ) => {
    const source = artifacts
      .filter((artifact) => artifact.type === "ElicitationRecord")
      .at(-1);
    const stakeholder = artifacts.find(
      (artifact) =>
        artifact.type === "Stakeholder" && artifact.name === stakeholderName,
    );
    const prefixes: Record<typeof type, string> = {
      Concern: "CONCERN-NEW",
      Need: "NEED-NEW",
      Assumption: "ASM-NEW",
      Constraint: "CON-NEW",
      Requirement: "REQ-FLOW",
      Decision: "DEC-NEW",
      ActionItem: "ACT-NEW",
    };
    const sequence =
      artifacts.filter((artifact) => artifact.type === type).length + 1;
    const id = `${prefixes[type]}-${String(sequence).padStart(3, "0")}`;
    const candidate =
      type === "Need" || type === "Concern" || type === "Requirement";
    const nextArtifacts = [
      ...artifacts.map((artifact) =>
        artifact.id === source?.id
          ? {
              ...artifact,
              status: "Reviewed",
              metadata: {
                ...(artifact.metadata || {}),
                lastExtractedText: notes,
              },
            }
          : artifact,
      ),
      {
        id,
        type,
        name: `Extracted ${type}`,
        description: notes,
        status: candidate ? "Candidate" : "Draft",
        ...(type === "Need" || type === "Requirement"
          ? { priority: "High" }
          : {}),
        source: source?.id,
        metadata: {
          provenance: source?.id || "",
          extractedFrom: "elicitation",
        },
      },
    ];
    const nextRelations = [
      ...relations,
      ...(source ? [{ from: source.id, to: id, kind: "captures" }] : []),
      ...(source && stakeholder
        ? [{ from: stakeholder.id, to: source.id, kind: "participates-in" }]
        : []),
    ];
    transact(
      nextArtifacts,
      nextRelations,
      `elicitation.extract-${type.toLowerCase()}`,
    );
    setSelected(id);
    setNotice(`Created ${id} from elicitation provenance`);
  };
  const createNeedFromElicitation = (notes: string, stakeholderName: string) =>
    createArtifactFromElicitation("Need", notes, stakeholderName);
  const createElicitationRecord = (
    notes: string,
    stakeholderName: string,
    details: Record<string, string> = {},
  ) => {
    const sequence =
      artifacts.filter((artifact) => artifact.type === "ElicitationRecord")
        .length + 1;
    const id = `ELC-NEW-${String(sequence).padStart(3, "0")}`;
    const stakeholder = artifacts.find(
      (artifact) =>
        artifact.type === "Stakeholder" && artifact.name === stakeholderName,
    );
    transact(
      [
        ...artifacts,
        {
          id,
          type: "ElicitationRecord",
          name: `Recorded interview ${sequence}`,
          description: notes,
          status: "Captured",
          metadata: {
            method: "Interview",
            confidence: "Unassessed",
            ...details,
          },
        },
      ],
      stakeholder
        ? [
            ...relations,
            { from: stakeholder.id, to: id, kind: "participates-in" },
          ]
        : relations,
      "elicitation.create-session",
    );
    setSelected(id);
    setNotice(`Saved ${id} with source provenance`);
  };
  const createStakeholder = (
    name: string,
    details: Record<string, string> = {},
  ) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const sequence =
      artifacts.filter((artifact) => artifact.type === "Stakeholder").length +
      1;
    const id = `STK-NEW-${String(sequence).padStart(3, "0")}`;
    transact(
      [
        ...artifacts,
        {
          id,
          type: "Stakeholder",
          name: trimmed,
          description: "Stakeholder discovered during project elicitation.",
          status: "Active",
          metadata: {
            interviewStatus: "Not started",
            ...details,
          },
        },
      ],
      relations,
      "stakeholder.create",
    );
    setNotice(`Added stakeholder ${trimmed}`);
  };
  const createRequirementFromNeed = (needId: string) => {
    const need = artifacts.find((artifact) => artifact.id === needId);
    if (!need || need.type !== "Need") return;
    const sequence =
      artifacts.filter((artifact) => artifact.type === "Requirement").length +
      1;
    const id = `REQ-FLOW-${String(sequence).padStart(3, "0")}`;
    transact(
      [
        ...artifacts,
        {
          id,
          type: "Requirement",
          name: `Formalized ${need.name}`,
          description:
            "The system shall provide the required mission capability within a measurable threshold.",
          status: "Draft",
          priority: need.priority || "Medium",
          quality: "Warning",
        },
      ],
      [...relations, { from: need.id, to: id, kind: "refines" }],
      "requirement.convert-need",
    );
    setSelected(id);
    setView("Requirements");
  };
  const createChildRequirement = () => {
    const sequence =
      artifacts.filter((artifact) => artifact.type === "Requirement").length +
      1;
    const id = `REQ-CHILD-${String(sequence).padStart(3, "0")}`;
    transact(
      [
        ...artifacts,
        {
          id,
          type: "Requirement",
          name: `Child requirement of ${current.id}`,
          description:
            "The system shall refine the parent requirement within a measurable threshold.",
          status: "Draft",
          priority: current.priority || "Medium",
          quality: "Pass",
        },
      ],
      [...relations, { from: current.id, to: id, kind: "decomposes" }],
      "requirement.create-child",
    );
    setSelected(id);
  };
  const createProject = (
    artifacts = seedArtifacts,
    relations = seedRelations,
    metadata = defaultProject,
    initialSelect = "REQ-042",
  ) => {
    transact(artifacts, relations, "project.create");
    setVersions([]);
    setDiagramPerspectives([]);
    setProject(metadata);
    setRepositoryReady(true);
    setSelected(initialSelect);
    setView("Overview");
    setShowSampleSelector(false);
  };
  const deleteLocalProject = () => {
    repository.clear();
    setRepositoryReady(false);
    setArtifacts([]);
    setRelations([]);
    setVersions([]);
    setRelationHistory([]);
    setAuditRecords([]);
    setBaselines([]);
    setDiagramPerspectives([]);
    setSelected("");
    setView("Landing");
    setNotice("Local project deleted");
  };
  const createBaseline = (draft: BaselineDraft) => {
    const included = new Set(draft.includedTypes);
    const frozenArtifacts = artifacts.filter((artifact) =>
      included.has(artifact.type),
    );
    const frozenIds = new Set(frozenArtifacts.map((artifact) => artifact.id));
    const next: Baseline = {
      id: `BL-${Date.now()}`,
      name: draft.name || `Baseline ${baselines.length + 1}.0`,
      createdAt: new Date().toISOString(),
      artifacts: structuredClone(frozenArtifacts),
      relations: structuredClone(
        relations.filter(
          (relation) =>
            frozenIds.has(relation.from) && frozenIds.has(relation.to),
        ),
      ),
      versions: structuredClone(
        versions.filter((entry) => frozenIds.has(entry.artifactId)),
      ),
      relationHistory: structuredClone(relationHistory),
      includedTypes: [...draft.includedTypes],
      approvedBy: draft.approvedBy || "Not recorded",
      approvedAt: new Date().toISOString(),
      project: structuredClone(project),
    };
    setBaselines((xs) => [...xs, next]);
    setNotice(`Created ${next.name}`);
  };
  const createVerificationCase = () => {
    const sequence = artifacts.filter((a) => a.type === "Test").length + 1;
    const testId = `TST-NEW-${String(sequence).padStart(3, "0")}`;
    const evidenceId = `EVD-NEW-${String(sequence).padStart(3, "0")}`;
    transact(
      [
        ...artifacts,
        {
          id: testId,
          type: "Test",
          name: `New verification test ${sequence}`,
          description:
            "Synthetic test case created from the verification matrix.",
          status: "Planned",
        },
        {
          id: evidenceId,
          type: "Evidence",
          name: `Evidence package ${sequence}`,
          description:
            "Evidence package reserved for the new verification case.",
          status: "Pending",
        },
      ],
      [
        ...relations,
        { from: "REQ-042", to: testId, kind: "verified-by" },
        { from: testId, to: evidenceId, kind: "produces" },
      ],
      "verification.create",
    );
  };
  const createReviewSession = () => {
    const sequence =
      artifacts.filter((artifact) => artifact.type === "ReviewSession").length +
      1;
    const id = `REV-NEW-${String(sequence).padStart(3, "0")}`;
    transact(
      [
        ...artifacts,
        {
          id,
          type: "ReviewSession",
          name: `Technical review ${sequence}`,
          description:
            "Review agenda for assessing requirement quality, allocation, verification, and risks.",
          status: "Planned",
          metadata: {
            chair: "",
            disposition: "Open",
            meetingDate: new Date().toISOString().slice(0, 10),
          },
        },
      ],
      [...relations, { from: id, to: current.id, kind: "reviews" }],
      "review.create-session",
    );
    setSelected(id);
    setView("Reviews");
  };
  const createDiagramElement = (type: ArtifactType = "Block") => {
    const prefixByType: Partial<Record<ArtifactType, string>> = {
      Block: "BLK",
      Part: "PART",
      Port: "PORT",
      ValueType: "VAL",
      Interface: "IF",
      Actor: "ACT",
      UseCase: "UC",
      Activity: "ACTV",
      Action: "ACTN",
      ObjectFlow: "FLOW",
      State: "STATE",
      Transition: "TRANS",
      Package: "PKG",
      Allocation: "ALLOC",
      ItemFlow: "ITEM",
      SystemOfSystems: "SOS",
      SystemOfInterest: "SOI",
      MissionThread: "THREAD",
    };
    const sequence =
      artifacts.filter((artifact) => artifact.type === type).length + 1;
    const id = `${prefixByType[type] || type.toUpperCase()}-DIA-${String(sequence).padStart(3, "0")}`;
    const label = type.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
    transact(
      [
        ...artifacts,
        {
          id,
          type,
          name: `New diagram ${label} ${sequence}`,
          description: `${label} created from Diagram Studio on the canonical model.`,
          status: "Draft",
        },
      ],
      relations,
      "diagram.create-element",
    );
    setSelected(id);
  };
  const createArchitectureInterface = () => {
    const sequence =
      artifacts.filter((artifact) => artifact.type === "Interface").length + 1;
    const id = "IF-NEW-" + String(sequence).padStart(3, "0");
    const blocks = artifacts.filter((artifact) => artifact.type === "Block");
    const owner = blocks[0];
    const peer = blocks[1];
    transact(
      [
        ...artifacts,
        {
          id,
          type: "Interface",
          name: "New mission interface " + sequence,
          description:
            "Interface created in the architecture workspace for an explicit cross-block exchange.",
          status: "Draft",
        },
      ],
      [
        ...relations,
        ...(owner ? [{ from: owner.id, to: id, kind: "owns" }] : []),
        ...(peer ? [{ from: id, to: peer.id, kind: "connects" }] : []),
      ],
      "architecture.create-interface",
    );
    setSelected(id);
  };
  const createChangeRequest = (proposed: string) => {
    const sequence =
      artifacts.filter((artifact) => artifact.type === "ChangeRequest").length +
      1;
    const id = "CR-NEW-" + String(sequence).padStart(3, "0");
    transact(
      [
        ...artifacts,
        {
          id,
          type: "ChangeRequest",
          name: "Threshold change for " + current.id,
          description: proposed,
          status: "Proposed",
          priority: current.priority || "Medium",
        },
      ],
      [...relations, { from: id, to: current.id, kind: "changes" }],
      "change-request.create",
    );
    setLastChangeRequestId(id);
  };
  const applyProposedChange = (proposed: string) => {
    const requestId =
      lastChangeRequestId ||
      artifacts.find(
        (artifact) =>
          artifact.type === "ChangeRequest" &&
          relations.some(
            (relation) =>
              relation.from === artifact.id &&
              relation.to === current.id &&
              relation.kind === "changes",
          ),
      )?.id;
    if (!requestId) {
      createChangeRequest(proposed);
      return;
    }
    transact(
      artifacts.map((artifact) => {
        if (artifact.id === current.id) {
          return { ...artifact, description: proposed };
        }
        if (artifact.id === requestId) {
          return { ...artifact, status: "Applied" };
        }
        return artifact;
      }),
      relations,
      "change-request.apply",
    );
  };
  const allocateRequirement = (requirementId: string, blockId: string) => {
    if (
      artifacts.some(
        (artifact) =>
          artifact.id === requirementId && artifact.type === "Requirement",
      ) &&
      artifacts.some(
        (artifact) => artifact.id === blockId && artifact.type === "Block",
      )
    ) {
      addRelation({ from: requirementId, to: blockId, kind: "allocated-to" });
    }
  };
  const restoreBaseline = (baseline: Baseline) => {
    transact(
      baseline.artifacts,
      baseline.relations,
      `baseline.restore:${baseline.name}`,
    );
    setVersions(structuredClone(baseline.versions));
    setRelationHistory(structuredClone(baseline.relationHistory));
    setProject(baseline.project || defaultProject);
    setSelected(
      baseline.artifacts.find((a) => a.type === "Requirement")?.id ||
        baseline.artifacts[0]?.id ||
        "",
    );
  };
  const undo = () => {
    const previous = past.at(-1);
    if (!previous) return;
    setFuture((xs) => [...xs, { artifacts, relations }]);
    setPast((xs) => xs.slice(0, -1));
    setArtifacts(previous.artifacts);
    setRelations(previous.relations);
    recordAudit(
      "model.undo",
      previous.artifacts.map((artifact) => artifact.id),
    );
  };
  const redo = () => {
    const next = future.at(-1);
    if (!next) return;
    setPast((xs) => [...xs, { artifacts, relations }]);
    setFuture((xs) => xs.slice(0, -1));
    setArtifacts(next.artifacts);
    setRelations(next.relations);
    recordAudit(
      "model.redo",
      next.artifacts.map((artifact) => artifact.id),
    );
  };
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setHelpOpen(false);
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "z")
        return;
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName;
      if (
        target?.isContentEditable ||
        (tagName && ["INPUT", "TEXTAREA", "SELECT"].includes(tagName))
      )
        return;
      event.preventDefault();
      if (event.shiftKey) redo();
      else undo();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });
  const importBundle = (file: File) => {
    if (file.size > MAX_IMPORT_BYTES) {
      setError("Project imports are limited to 5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const b = validateBundle(JSON.parse(String(reader.result)));
        setImportPreview(b);
        setError("");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unable to import project");
      }
    };
    reader.readAsText(file);
  };
  const applyImport = () => {
    if (!importPreview) return;
    transact(
      importPreview.artifacts,
      importPreview.relations,
      "project.import",
    );
    setVersions(structuredClone(importPreview.versions || []));
    setRelationHistory(structuredClone(importPreview.relationHistory || []));
    setProject(importPreview.project || defaultProject);
    setBaselines(structuredClone(importPreview.baselines || seedBaselines()));
    setDiagramPerspectives(
      structuredClone(importPreview.diagramPerspectives || []),
    );
    setSelected(importPreview.artifacts[0]?.id || "");
    setRepositoryReady(true);
    setView("Overview");
    setImportPreview(null);
  };
  const saveDiagramPerspective = (perspective: DiagramPerspective) => {
    setDiagramPerspectives((current) => [
      ...current.filter((entry) => entry.id !== perspective.id),
      perspective,
    ]);
    recordAudit("diagram.perspective.save", perspective.selectedIds);
  };
  const applyMermaidRelations = (incoming: Relation[]) => {
    const additions = incoming.filter(
      (relation) =>
        validateRelation(relation, artifacts).allowed &&
        !relations.some(
          (current) =>
            current.from === relation.from &&
            current.to === relation.to &&
            current.kind === relation.kind,
        ),
    );
    if (additions.length)
      transact(
        artifacts,
        [
          ...relations,
          ...additions.map((relation) => ({
            ...relation,
            id: relation.id || `REL-NEW-${crypto.randomUUID()}`,
          })),
        ],
        "mermaid.import",
      );
    else if (incoming.length)
      setNotice(
        "Mermaid proposal contained no semantically valid new relationships.",
      );
  };
  const exportBundle = () =>
    download(
      "tracegraph-project.json",
      JSON.stringify(
        {
          version: 1,
          artifacts,
          relations,
          versions,
          relationHistory,
          project,
          baselines,
          diagramPerspectives,
        },
        null,
        2,
      ),
      "application/json",
    );
  const exportMermaid = () => {
    const started = performance.now();
    const source = mermaid(artifacts, relations);
    recordPerformance("Mermaid generation", performance.now() - started);
    download("tracegraph-model.mmd", source);
  };
  const copyMermaid = async () => {
    try {
      await navigator.clipboard.writeText(mermaid(artifacts, relations));
      setNotice("Mermaid source copied to clipboard");
    } catch {
      setError(
        "Clipboard access was unavailable; download the .mmd file instead.",
      );
    }
  };
  const copyMermaidMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(
        mermaidMarkdown(
          mermaid(artifacts, relations),
          "TraceGraph digital thread",
        ),
      );
      setNotice("Mermaid Markdown copied to clipboard");
    } catch {
      setError(
        "Clipboard access was unavailable; download the Markdown file instead.",
      );
    }
  };
  const startTour = () => {
    setTourStep(0);
    setView(tourSteps[0].view);
  };
  const advanceTour = () => {
    if (tourStep === null) return;
    const next = tourStep + 1;
    if (next >= tourSteps.length) {
      setTourStep(null);
      return;
    }
    setTourStep(next);
    setView(tourSteps[next].view);
  };
  const stats = [
    {
      n: artifacts.filter((a) => a.type === "Requirement").length,
      l: "Requirements",
      c: "violet",
    },
    {
      n: artifacts.filter((a) => a.type === "Block").length,
      l: "Model elements",
      c: "blue",
    },
    { n: relations.length, l: "Trace links", c: "cyan" },
    {
      n: artifacts.filter((a) => a.type === "Test").length,
      l: "Verification cases",
      c: "green",
    },
  ];
  const importDiff = importPreview
    ? compareBundles({ version: 1, artifacts, relations }, importPreview)
    : null;
  return (
    <div className={`app-shell theme-${theme} mode-${mode.toLowerCase()}`}>
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">
            <i />
            <i />
            <i />
          </span>
          <span>
            Trace<span>Graph</span>
          </span>
        </div>
        <div className="workspace-label">
          WORKSPACE{" "}
          <span className="save-dot" title={notice}>
            ●
          </span>
          <span className="save-status" role="status">
            {notice}
          </span>
        </div>
        <button
          className="project-switcher"
          onClick={() => setNotice(`${project.name} · local workspace`)}
        >
          {project.name} <span>⌄</span>
        </button>
        <nav aria-label="Primary navigation">
          {nav.map((item) => (
            <button
              key={item.view}
              className={view === item.view ? "nav-item active" : "nav-item"}
              onClick={() => setView(item.view)}
            >
              <b>{item.icon}</b>
              <span>{item.view}</span>
              <small>{item.hint}</small>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className="nav-item" onClick={() => setHelpOpen(true)}>
            <b>?</b>
            <span>Help & glossary</span>
          </button>
          <button className="nav-item" onClick={() => setView("Baselines")}>
            <b>⚙</b>
            <span>Project lifecycle</span>
          </button>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div className="breadcrumb">
            {project.name} <span>/</span> <strong>{view}</strong>
          </div>
          <div className="top-actions">
            <div className="mode-toggle">
              <button
                className={mode === "Guided" ? "selected" : ""}
                onClick={() => setMode("Guided")}
              >
                Guided
              </button>
              <button
                className={mode === "Engineering" ? "selected" : ""}
                onClick={() => setMode("Engineering")}
              >
                Engineering
              </button>
            </div>
            <button
              className="icon-button theme-toggle"
              aria-label={
                "Switch to " + (theme === "dark" ? "light" : "dark") + " theme"
              }
              aria-pressed={theme === "light"}
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? "☼" : "☾"}
            </button>
            <button className="icon-button" aria-label="Undo" onClick={undo}>
              ↶
            </button>
            <button className="icon-button" aria-label="Redo" onClick={redo}>
              ↷
            </button>
            <label className="import-button">
              Import
              <input
                ref={importInputRef}
                type="file"
                accept="application/json,.json"
                onChange={(e) =>
                  e.target.files?.[0] && importBundle(e.target.files[0])
                }
              />
            </label>
            <span className="avatar" aria-label="Guest account">
              LH
            </span>
          </div>
        </header>
        <div className="content">
          {error && (
            <div className="error-banner" role="alert">
              {error}
            </div>
          )}
          {importPreview && (
            <section
              className="import-preview panel"
              role="dialog"
              aria-labelledby="import-preview-title"
            >
              <div className="panel-title">
                <div>
                  <p className="eyebrow">IMPORT PREVIEW · NO CHANGES APPLIED</p>
                  <h2 id="import-preview-title">Review project replacement</h2>
                </div>
                <button
                  className="icon-button"
                  aria-label="Cancel import"
                  onClick={() => setImportPreview(null)}
                >
                  ×
                </button>
              </div>
              <p className="muted">
                The validated bundle contains {importPreview.artifacts.length}{" "}
                artifacts and {importPreview.relations.length} relationships.
                Your current working copy remains unchanged until you apply it.
              </p>
              {importDiff && (
                <div className="import-diff" role="status">
                  <div className="panel-title">
                    <h3>Import change summary</h3>
                    <span className="status-pill">Review before apply</span>
                  </div>
                  <div className="baseline-impact-grid">
                    <span>
                      Added artifacts <b>{importDiff.addedArtifacts.length}</b>
                    </span>
                    <span>
                      Removed artifacts{" "}
                      <b>{importDiff.removedArtifacts.length}</b>
                    </span>
                    <span>
                      Modified artifacts{" "}
                      <b>{importDiff.changedArtifacts.length}</b>
                    </span>
                    <span>
                      Relationship changes{" "}
                      <b>
                        {importDiff.addedRelations.length +
                          importDiff.removedRelations.length}
                      </b>
                    </span>
                  </div>
                  <p className="muted">
                    Replacement remains one audited, undoable transaction.
                  </p>
                  <ul className="import-diff-list">
                    {[
                      ...importDiff.addedArtifacts.map(
                        (id) => `Added artifact ${id}`,
                      ),
                      ...importDiff.changedArtifacts.map(
                        (id) => `Modified artifact ${id}`,
                      ),
                      ...importDiff.removedArtifacts.map(
                        (id) => `Removed artifact ${id}`,
                      ),
                      ...importDiff.addedRelations.map(
                        (key) => `Added relationship ${key}`,
                      ),
                      ...importDiff.removedRelations.map(
                        (key) => `Removed relationship ${key}`,
                      ),
                    ]
                      .slice(0, 12)
                      .map((change) => (
                        <li key={change}>{change}</li>
                      ))}
                  </ul>
                  {![
                    importDiff.addedArtifacts.length,
                    importDiff.changedArtifacts.length,
                    importDiff.removedArtifacts.length,
                    importDiff.addedRelations.length,
                    importDiff.removedRelations.length,
                  ].some(Boolean) && (
                    <p className="muted">No canonical changes detected.</p>
                  )}
                </div>
              )}
              <div className="landing-actions">
                <button
                  className="button secondary"
                  onClick={() => setImportPreview(null)}
                >
                  Cancel import
                </button>
                <button className="button primary" onClick={applyImport}>
                  Apply imported project
                </button>
              </div>
            </section>
          )}
          <section className="page-heading">
            <div>
              <p className="eyebrow">SYSTEMS ENGINEERING WORKBENCH</p>
              <h1>
                {view === "Overview"
                  ? "From stakeholder need to verified evidence."
                  : view}
              </h1>
              <p className="subheading">
                {view === "Overview"
                  ? `A connected digital thread for progressively formalizing ${project.name}.`
                  : nav.find((n) => n.view === view)?.hint}
              </p>
              <span className="mode-context">
                {mode === "Guided"
                  ? "Guided mode · plain-language prompts and recommended next actions"
                  : "Engineering mode · dense model controls and canonical relationship detail"}
              </span>
            </div>
            <div className="heading-actions">
              <button className="button secondary" onClick={exportMermaid}>
                Export Mermaid
              </button>
              <button className="button primary" onClick={exportBundle}>
                Export project
              </button>
            </div>
          </section>
          <Page
            view={view}
            stats={stats}
            go={setView}
            openHelp={() => setHelpOpen(true)}
            openImport={() => importInputRef.current?.click()}
            artifacts={filtered}
            allArtifacts={artifacts}
            versions={versions}
            auditRecords={auditRecords}
            relationHistory={relationHistory}
            project={project}
            updateProject={updateProject}
            performanceStats={performanceStats}
            recordPerformance={recordPerformance}
            current={current}
            selected={selected}
            setSelected={setSelected}
            query={query}
            setQuery={setQuery}
            update={update}
            updateArtifact={updateArtifact}
            relations={relations}
            createRequirement={createRequirement}
            createNeedFromElicitation={createNeedFromElicitation}
            createArtifactFromElicitation={createArtifactFromElicitation}
            createElicitationRecord={createElicitationRecord}
            createStakeholder={createStakeholder}
            createRequirementFromNeed={createRequirementFromNeed}
            createChildRequirement={createChildRequirement}
            addRelation={addRelation}
            baselines={baselines}
            diagramPerspectives={diagramPerspectives}
            saveDiagramPerspective={saveDiagramPerspective}
            createBaseline={createBaseline}
            restoreBaseline={restoreBaseline}
            createProject={createProject}
            createVerificationCase={createVerificationCase}
            createReviewSession={createReviewSession}
            startTour={startTour}
            createDiagramElement={createDiagramElement}
            createArchitectureInterface={createArchitectureInterface}
            allocateRequirement={allocateRequirement}
            createChangeRequest={createChangeRequest}
            applyProposedChange={applyProposedChange}
            deleteLocalProject={deleteLocalProject}
            applyMermaidRelations={applyMermaidRelations}
            copyMermaid={copyMermaid}
            copyMermaidMarkdown={copyMermaidMarkdown}
            archiveArtifact={archiveArtifact}
            restoreArtifact={restoreArtifact}
            bulkArchive={bulkArchive}
            mode={mode}
            exportTitle={exportTitle}
            setExportTitle={setExportTitle}
            exportLegend={exportLegend}
            setExportLegend={setExportLegend}
            pngScale={pngScale}
            setPngScale={setPngScale}
            pngBackground={pngBackground}
            setPngBackground={setPngBackground}
            setShowSampleSelector={setShowSampleSelector}
          />
        </div>
      </main>
      {tourStep !== null && (
        <Tour
          step={tourSteps[tourStep]}
          index={tourStep}
          total={tourSteps.length}
          onNext={advanceTour}
          onDismiss={() => setTourStep(null)}
          onRestart={startTour}
        />
      )}
      {helpOpen && (
        <HelpDrawer mode={mode} onClose={() => setHelpOpen(false)} />
      )}
      {showSampleSelector && (
        <SampleSelector
          onSelect={createProject}
          onClose={() => setShowSampleSelector(false)}
        />
      )}
    </div>
  );
}
type PageProps = {
  mode: "Guided" | "Engineering";
  view: View;
  stats: { n: number; l: string; c: string }[];
  go: (v: View) => void;
  openHelp: () => void;
  openImport: () => void;
  artifacts: Artifact[];
  allArtifacts: Artifact[];
  versions: ArtifactVersion[];
  auditRecords: AuditRecord[];
  relationHistory: RelationHistoryEntry[];
  project: ProjectMetadata;
  updateProject: (patch: Partial<ProjectMetadata>) => void;
  performanceStats: PerformanceMetric[];
  recordPerformance: (label: string, ms: number) => void;
  current: Artifact;
  selected: string;
  setSelected: (s: string) => void;
  query: string;
  setQuery: (s: string) => void;
  update: (p: Partial<Artifact>) => void;
  updateArtifact: (id: string, p: Partial<Artifact>) => void;
  relations: Relation[];
  createRequirement: () => void;
  createNeedFromElicitation: (notes: string, stakeholderName: string) => void;
  createArtifactFromElicitation: (
    type:
      | "Concern"
      | "Need"
      | "Assumption"
      | "Constraint"
      | "Requirement"
      | "Decision"
      | "ActionItem",
    notes: string,
    stakeholderName: string,
  ) => void;
  createElicitationRecord: (
    notes: string,
    stakeholderName: string,
    details?: Record<string, string>,
  ) => void;
  createStakeholder: (name: string, details?: Record<string, string>) => void;
  createRequirementFromNeed: (needId: string) => void;
  createChildRequirement: () => void;
  addRelation: (relation: Relation) => void;
  baselines: Baseline[];
  diagramPerspectives: DiagramPerspective[];
  saveDiagramPerspective: (perspective: DiagramPerspective) => void;
  createBaseline: (draft: BaselineDraft) => void;
  restoreBaseline: (baseline: Baseline) => void;
  createProject: () => void;
  createVerificationCase: () => void;
  createReviewSession: () => void;
  startTour: () => void;
  createDiagramElement: (type?: ArtifactType) => void;
  createArchitectureInterface: () => void;
  allocateRequirement: (requirementId: string, blockId: string) => void;
  createChangeRequest: (proposed: string) => void;
  applyProposedChange: (proposed: string) => void;
  deleteLocalProject: () => void;
  applyMermaidRelations: (relations: Relation[]) => void;
  copyMermaid: () => void;
  copyMermaidMarkdown: () => void;
  archiveArtifact: (id: string) => void;
  restoreArtifact: (id: string) => void;
  bulkArchive: (ids: string[]) => void;
  exportTitle: string;
  setExportTitle: (value: string) => void;
  exportLegend: boolean;
  setExportLegend: (value: boolean) => void;
  pngScale: number;
  setPngScale: (value: number) => void;
  pngBackground: string;
  setPngBackground: (value: string) => void;
  setShowSampleSelector?: (value: boolean) => void;
};
function downloadPng(
  svg: string,
  name: string,
  scale: number,
  background: string,
  onMeasured?: (ms: number) => void,
) {
  const started = performance.now();
  const maxRasterDimension = 8192;
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  const image = new Image();
  image.onload = () => {
    const effectiveScale = Math.min(
      scale,
      maxRasterDimension / Math.max(image.width, image.height),
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.floor(image.width * effectiveScale));
    canvas.height = Math.max(1, Math.floor(image.height * effectiveScale));
    const context = canvas.getContext("2d");
    if (context) {
      if (background !== "transparent") {
        context.fillStyle = background;
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) downloadBlob(name, blob);
        onMeasured?.(performance.now() - started);
      }, "image/png");
    }
    URL.revokeObjectURL(url);
  };
  image.src = url;
}
function Page(p: PageProps) {
  let content: ReactNode;
  if (p.view === "Landing")
    content = (
      <Landing
        openHelp={p.openHelp}
        openImport={p.openImport}
        createProject={p.createProject}
        startTour={p.startTour}
        openSampleSelector={() => p.setShowSampleSelector?.(true)}
      />
    );
  else if (p.view === "Overview")
    content = (
      <Overview
        stats={p.stats}
        go={p.go}
        artifacts={p.allArtifacts}
        relations={p.relations}
        performanceStats={p.performanceStats}
        project={p.project}
        updateProject={p.updateProject}
      />
    );
  else if (p.view === "Elicitation")
    content = (
      <Elicitation
        artifacts={p.allArtifacts}
        relations={p.relations}
        createNeedFromElicitation={p.createNeedFromElicitation}
        createArtifactFromElicitation={p.createArtifactFromElicitation}
        createElicitationRecord={p.createElicitationRecord}
        createStakeholder={p.createStakeholder}
        createRequirementFromNeed={p.createRequirementFromNeed}
        updateArtifact={p.updateArtifact}
        selected={p.selected}
        setSelected={p.setSelected}
      />
    );
  else if (p.view === "Requirements") content = <Requirements {...p} />;
  else if (p.view === "Traceability") content = <Trace {...p} />;
  else if (p.view === "Diagrams") content = <DiagramStudio {...p} />;
  else if (p.view === "Architecture") content = <Architecture {...p} />;
  else if (p.view === "Verification")
    content = (
      <Verification
        artifacts={p.allArtifacts}
        relations={p.relations}
        addRelation={p.addRelation}
        createVerificationCase={p.createVerificationCase}
        updateArtifact={p.updateArtifact}
      />
    );
  else if (p.view === "Reviews") content = <Reviews {...p} />;
  else if (p.view === "Impact")
    content = (
      <Impact
        current={p.current}
        artifacts={p.allArtifacts}
        relations={p.relations}
        createChangeRequest={p.createChangeRequest}
        applyProposedChange={p.applyProposedChange}
      />
    );
  else
    content = (
      <Baselines
        artifacts={p.allArtifacts}
        relations={p.relations}
        auditRecords={p.auditRecords}
        relationHistory={p.relationHistory}
        baselines={p.baselines}
        createBaseline={p.createBaseline}
        restoreBaseline={p.restoreBaseline}
        bulkArchive={p.bulkArchive}
        deleteLocalProject={p.deleteLocalProject}
      />
    );
  const svg = svgDocument(p.allArtifacts, p.relations, {
    title: p.exportTitle,
    legend: p.exportLegend,
  });
  return (
    <>
      <div className="export-strip">
        <span>OPEN EXPORTS</span>
        <button
          className="text-button"
          onClick={() => download("tracegraph-view.svg", svg, "image/svg+xml")}
        >
          Download SVG
        </button>
        <button
          className="text-button"
          onClick={() =>
            downloadPng(
              svg,
              "tracegraph-view.png",
              p.pngScale,
              p.pngBackground,
              (ms) => p.recordPerformance("PNG export", ms),
            )
          }
        >
          Download PNG
        </button>
        <button
          className="text-button"
          onClick={() =>
            download(
              "tracegraph-model.md",
              mermaidMarkdown(
                mermaid(p.allArtifacts, p.relations),
                p.exportTitle,
              ),
              "text/markdown",
            )
          }
        >
          Mermaid Markdown
        </button>
        <button className="text-button" onClick={p.copyMermaid}>
          Copy Mermaid
        </button>
        <button className="text-button" onClick={p.copyMermaidMarkdown}>
          Copy Markdown
        </button>
        <label className="export-option">
          Export title
          <input
            aria-label="Export title"
            value={p.exportTitle}
            onChange={(event) => p.setExportTitle(event.target.value)}
          />
        </label>
        <label className="export-option checkbox-label">
          <input
            type="checkbox"
            checked={p.exportLegend}
            onChange={(event) => p.setExportLegend(event.target.checked)}
          />
          Legend
        </label>
        <label className="export-option">
          PNG scale
          <select
            aria-label="PNG scale"
            value={p.pngScale}
            onChange={(event) => p.setPngScale(Number(event.target.value))}
          >
            <option value={1}>1x</option>
            <option value={2}>2x</option>
            <option value={3}>3x</option>
            <option value={4}>4x</option>
          </select>
        </label>
        <label className="export-option">
          PNG background
          <select
            aria-label="PNG background"
            value={p.pngBackground}
            onChange={(event) => p.setPngBackground(event.target.value)}
          >
            <option value="#080d21">Dark</option>
            <option value="#ffffff">Light</option>
            <option value="transparent">Transparent</option>
          </select>
        </label>
        <button
          className="text-button"
          onClick={() =>
            download(
              "tracegraph-requirements.csv",
              csvRequirements(p.allArtifacts),
              "text/csv",
            )
          }
        >
          Requirements CSV
        </button>
        <button
          className="text-button"
          onClick={() =>
            download(
              "tracegraph-traceability.csv",
              csvTraceability(p.allArtifacts, p.relations),
              "text/csv",
            )
          }
        >
          Traceability CSV
        </button>
        <button
          className="text-button"
          onClick={() =>
            download(
              "tracegraph-verification.csv",
              csvVerification(p.allArtifacts, p.relations),
              "text/csv",
            )
          }
        >
          Verification CSV
        </button>
        <button
          className="text-button"
          onClick={() =>
            download(
              "tracegraph-report.md",
              markdownReport(p.allArtifacts, p.relations),
              "text/markdown",
            )
          }
        >
          Markdown report
        </button>
        <button
          className="text-button"
          onClick={() =>
            download(
              "tracegraph-report.html",
              printableHtml(p.allArtifacts, p.relations),
              "text/html",
            )
          }
        >
          Printable HTML
        </button>
        <small>Canonical IDs and relationship labels included</small>
      </div>
      {content}
    </>
  );
}
function Landing({
  openHelp,
  openImport,
  createProject,
  startTour,
  openSampleSelector,
}: {
  openHelp: () => void;
  openImport: () => void;
  createProject: () => void;
  startTour: () => void;
  openSampleSelector: () => void;
}) {
  return (
    <section className="landing-card panel">
      <div className="landing-mark brand-mark">
        <i />
        <i />
        <i />
      </div>
      <p className="eyebrow">OPEN SYSTEMS ENGINEERING WORKBENCH</p>
      <h2>From stakeholder need to verified evidence.</h2>
      <p className="landing-copy">
        TraceGraph connects elicitation, requirements, architecture,
        verification, and change impact in one inspectable digital thread. Start
        with plain language and formalize progressively.
      </p>
      <div className="landing-actions">
        <button className="button primary" onClick={openSampleSelector}>
          Open sample project
        </button>
        <button className="button secondary" onClick={createProject}>
          Create local project
        </button>
        <button className="button secondary" onClick={openImport}>
          Import project
        </button>
        <button className="text-button" onClick={openHelp}>
          View documentation
        </button>
        <button className="text-button" onClick={startTour}>
          Start five-minute tour
        </button>
      </div>
      <div className="landing-features">
        <span>
          <b>01</b> Preserve provenance
        </span>
        <span>
          <b>02</b> Trace every decision
        </span>
        <span>
          <b>03</b> Export open formats
        </span>
      </div>
    </section>
  );
}
function SampleSelector({
  onSelect,
  onClose,
}: {
  onSelect: (
    artifacts: Artifact[],
    relations: Relation[],
    metadata: ProjectMetadata,
    initialSelect: string,
  ) => void;
  onClose: () => void;
}) {
  const samples = [
    {
      id: "emergency-response",
      name: "Emergency Response Drone",
      description: "Multi-agency emergency coordination with aerial telemetry",
      icon: "🚁",
      domain: "Emergency & Safety",
    },
    {
      id: "medical-device",
      name: "Infusion Pump Verification",
      description: "FDA-regulated medical device with safety-critical requirements",
      icon: "🏥",
      domain: "Medical Device",
    },
    {
      id: "cloud-services",
      name: "Cloud Platform Resilience",
      description: "Multi-region SaaS infrastructure with 99.99% availability",
      icon: "☁️",
      domain: "Cloud & Distributed Systems",
    },
  ];
  const handleSelect = (id: string) => {
    if (id === "emergency-response") {
      onSelect(
        seedArtifacts,
        seedRelations,
        { name: "Emergency Response Drone", mission: "Coordinate safe, timely emergency response from shared aerial telemetry.", problemStatement: "Multi-agency responders need trustworthy mission status and evidence without losing stakeholder intent.", owner: "Systems engineering team", version: "0.1.0", systemBoundary: "Emergency response coordination from mission planning through evidence review.", systemOfInterest: "Emergency response drone coordination service", intendedOutcomes: "Timely, trustworthy shared mission status for multi-agency responders.", inScope: "Telemetry, coordination, mission status, verification, and evidence.", outOfScope: "Aircraft airworthiness certification and agency dispatch policy.", knownConstraints: "Intermittent connectivity, privacy, and bounded local storage.", assumptions: "Authorized responders have a supported browser and local workspace.", dependencies: "Flight telemetry service, response network, and agency operators.", reviewMilestones: "Concept review; requirements review; verification readiness.", initialStakeholders: "Emergency coordinator; flight operations; search director." },
        "REQ-042",
      );
    } else if (id === "medical-device") {
      onSelect(
        medicalDeviceArtifacts,
        medicalDeviceRelations,
        medicalDeviceMetadata,
        "REQ-001",
      );
    } else if (id === "cloud-services") {
      onSelect(
        cloudServicesArtifacts,
        cloudServicesRelations,
        cloudServicesMetadata,
        "REQ-101",
      );
    }
    onClose();
  };
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sample-selector-title"
        style={{
          maxWidth: "800px",
          padding: "2rem",
          gap: "1.5rem",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h2 id="sample-selector-title">Choose a sample project</h2>
          <p
            style={{
              color: "var(--text-secondary)",
              marginTop: "0.5rem",
              fontSize: "0.95rem",
            }}
          >
            Explore TraceGraph with realistic examples across different domains
          </p>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "1rem",
          }}
        >
          {samples.map((sample) => (
            <button
              key={sample.id}
              className="sample-card"
              onClick={() => handleSelect(sample.id)}
              style={{
                background: "var(--panel-bg)",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius)",
                padding: "1.25rem",
                textAlign: "left",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor =
                  "var(--accent-color)";
                (e.currentTarget as HTMLElement).style.background =
                  "var(--hover-bg)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor =
                  "var(--border-color)";
                (e.currentTarget as HTMLElement).style.background =
                  "var(--panel-bg)";
              }}
            >
              <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>
                {sample.icon}
              </div>
              <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.1rem" }}>
                {sample.name}
              </h3>
              <p
                style={{
                  margin: "0 0 0.75rem 0",
                  fontSize: "0.9rem",
                  color: "var(--text-secondary)",
                  lineHeight: "1.4",
                }}
              >
                {sample.description}
              </p>
              <span
                style={{
                  display: "inline-block",
                  fontSize: "0.8rem",
                  color: "var(--accent-color)",
                  fontWeight: "500",
                }}
              >
                {sample.domain}
              </span>
            </button>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
          <button className="button secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </section>
    </div>
  );
}
function Tour({
  step,
  index,
  total,
  onNext,
  onDismiss,
  onRestart,
}: {
  step: (typeof tourSteps)[number];
  index: number;
  total: number;
  onNext: () => void;
  onDismiss: () => void;
  onRestart: () => void;
}) {
  return (
    <div className="tour-backdrop" role="presentation">
      <section
        className="tour-card panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
      >
        <div className="panel-title">
          <p className="eyebrow">
            GUIDED TOUR · {index + 1} OF {total}
          </p>
          <button
            className="icon-button"
            aria-label="Dismiss guided tour"
            onClick={onDismiss}
          >
            ×
          </button>
        </div>
        <h2 id="tour-title">{step.title}</h2>
        <p className="lead">{step.body}</p>
        <div
          className="tour-progress"
          aria-label={`${index + 1} of ${total} tour steps`}
        >
          {tourSteps.map((item, itemIndex) => (
            <i
              className={itemIndex <= index ? "active" : ""}
              key={item.title}
            />
          ))}
        </div>
        <div className="landing-actions">
          <button className="button secondary" onClick={onRestart}>
            Restart tour
          </button>
          <button className="button primary" onClick={onNext}>
            {index === total - 1 ? "Finish tour" : "Next step"} <span>→</span>
          </button>
        </div>
        <button className="text-button" onClick={onDismiss}>
          Dismiss for now
        </button>
      </section>
    </div>
  );
}
function HelpDrawer({
  mode,
  onClose,
}: {
  mode: "Guided" | "Engineering";
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const glossary = [
    [
      "Canonical model",
      "The shared artifacts and relationships that every view reads and edits.",
    ],
    [
      "Digital thread",
      "An explainable path from stakeholder intent through requirements, architecture, verification, and evidence.",
    ],
    [
      "Baseline",
      "A named, approval-recorded snapshot used for configuration comparison.",
    ],
    [
      "Allocation",
      "A canonical allocated-to relationship from a requirement or capability to a system block.",
    ],
    [
      "SoSE",
      "System-of-systems engineering: missions, constituent systems, ownership, independence, and dependencies.",
    ],
  ].filter(([term, definition]) =>
    `${term} ${definition}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className="help-backdrop" role="presentation">
      <section
        className="help-drawer panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-title"
      >
        <div className="panel-title">
          <div>
            <p className="eyebrow">REFERENCE · {mode.toUpperCase()} MODE</p>
            <h2 id="help-title">Help & glossary</h2>
          </div>
          <button
            className="icon-button"
            aria-label="Close help and glossary"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <p className="muted">
          Guided mode emphasizes plain-language workflow prompts. Engineering
          mode exposes denser model controls; both modes edit the same canonical
          project.
        </p>
        <label>
          Search glossary
          <input
            aria-label="Search glossary"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoFocus
          />
        </label>
        <div className="glossary-list">
          {glossary.map(([term, definition]) => (
            <article key={term}>
              <b>{term}</b>
              <p>{definition}</p>
            </article>
          ))}
          {!glossary.length && (
            <p className="muted">No glossary terms match.</p>
          )}
        </div>
        <div className="callout">
          <b>Keyboard shortcuts</b>
          <p>
            Ctrl/Cmd+Z undo · Ctrl/Cmd+Shift+Z redo · Escape closes this panel.
          </p>
        </div>
      </section>
    </div>
  );
}
function Overview({
  stats,
  go,
  artifacts,
  relations,
  performanceStats,
  project,
  updateProject,
}: {
  stats: PageProps["stats"];
  go: PageProps["go"];
  artifacts: Artifact[];
  relations: Relation[];
  performanceStats: PerformanceMetric[];
  project: ProjectMetadata;
  updateProject: (patch: Partial<ProjectMetadata>) => void;
}) {
  const [draftProject, setDraftProject] = useState(project);
  useEffect(() => setDraftProject(project), [project]);
  const metrics = coverageMetrics(artifacts, relations);
  const metricPercent = (id: string) => {
    const metric = metrics.find((item) => item.id === id);
    return metric?.denominator
      ? Math.round((metric.numerator / metric.denominator) * 100)
      : 0;
  };
  const traceability = metricPercent("requirement-allocation");
  const verification = metricPercent("requirement-verification");
  const evidence = metricPercent("test-evidence");
  const readiness = Math.round(
    (metricPercent("need-requirement") +
      traceability +
      verification +
      evidence) /
      4,
  );
  const qualityWarnings = artifacts
    .filter((artifact) => artifact.type === "Requirement")
    .filter((artifact) => qualityFindings(artifact).length > 0).length;
  const openNeeds = artifacts.filter(
    (artifact) => artifact.type === "Need" && artifact.status === "Candidate",
  ).length;
  const criticalGaps = artifacts
    .filter(
      (artifact) =>
        artifact.type === "Requirement" && artifact.priority === "Critical",
    )
    .filter(
      (artifact) =>
        !relations.some(
          (relation) =>
            relation.from === artifact.id && relation.kind === "verified-by",
        ),
    ).length;
  return (
    <>
      <section className="panel framing-panel" aria-labelledby="framing-title">
        <div className="panel-title">
          <div>
            <p className="eyebrow">PROJECT FRAMING</p>
            <h2 id="framing-title">Define the engineering context</h2>
          </div>
          <span className="status-pill">Persisted with project</span>
        </div>
        <div className="field-grid">
          <label>
            Project name
            <input
              aria-label="Project name"
              value={draftProject.name}
              onChange={(event) =>
                setDraftProject({ ...draftProject, name: event.target.value })
              }
            />
          </label>
          <label>
            Project owner
            <input
              aria-label="Project owner"
              value={draftProject.owner}
              onChange={(event) =>
                setDraftProject({ ...draftProject, owner: event.target.value })
              }
            />
          </label>
          <label>
            Mission
            <textarea
              aria-label="Project mission"
              value={draftProject.mission}
              onChange={(event) =>
                setDraftProject({
                  ...draftProject,
                  mission: event.target.value,
                })
              }
            />
          </label>
          <label>
            Problem statement
            <textarea
              aria-label="Project problem statement"
              value={draftProject.problemStatement}
              onChange={(event) =>
                setDraftProject({
                  ...draftProject,
                  problemStatement: event.target.value,
                })
              }
            />
          </label>
          <label>
            Model version
            <input
              aria-label="Project version"
              value={draftProject.version}
              onChange={(event) =>
                setDraftProject({
                  ...draftProject,
                  version: event.target.value,
                })
              }
            />
          </label>
          <label>
            System boundary
            <textarea
              aria-label="System boundary"
              value={draftProject.systemBoundary || ""}
              onChange={(event) =>
                setDraftProject({
                  ...draftProject,
                  systemBoundary: event.target.value,
                })
              }
            />
          </label>
          <label>
            System of interest
            <input
              aria-label="System of interest"
              value={draftProject.systemOfInterest || ""}
              onChange={(event) =>
                setDraftProject({
                  ...draftProject,
                  systemOfInterest: event.target.value,
                })
              }
            />
          </label>
          <label>
            Intended outcomes
            <textarea
              aria-label="Intended outcomes"
              value={draftProject.intendedOutcomes || ""}
              onChange={(event) =>
                setDraftProject({
                  ...draftProject,
                  intendedOutcomes: event.target.value,
                })
              }
            />
          </label>
          <label>
            In scope
            <textarea
              aria-label="In scope"
              value={draftProject.inScope || ""}
              onChange={(event) =>
                setDraftProject({
                  ...draftProject,
                  inScope: event.target.value,
                })
              }
            />
          </label>
          <label>
            Out of scope
            <textarea
              aria-label="Out of scope"
              value={draftProject.outOfScope || ""}
              onChange={(event) =>
                setDraftProject({
                  ...draftProject,
                  outOfScope: event.target.value,
                })
              }
            />
          </label>
          <label>
            Known constraints
            <textarea
              aria-label="Known constraints"
              value={draftProject.knownConstraints || ""}
              onChange={(event) =>
                setDraftProject({
                  ...draftProject,
                  knownConstraints: event.target.value,
                })
              }
            />
          </label>
          <label>
            Assumptions
            <textarea
              aria-label="Assumptions"
              value={draftProject.assumptions || ""}
              onChange={(event) =>
                setDraftProject({
                  ...draftProject,
                  assumptions: event.target.value,
                })
              }
            />
          </label>
          <label>
            Dependencies
            <textarea
              aria-label="Dependencies"
              value={draftProject.dependencies || ""}
              onChange={(event) =>
                setDraftProject({
                  ...draftProject,
                  dependencies: event.target.value,
                })
              }
            />
          </label>
          <label>
            Review milestones
            <textarea
              aria-label="Review milestones"
              value={draftProject.reviewMilestones || ""}
              onChange={(event) =>
                setDraftProject({
                  ...draftProject,
                  reviewMilestones: event.target.value,
                })
              }
            />
          </label>
          <label>
            Initial stakeholders
            <textarea
              aria-label="Initial stakeholders"
              value={draftProject.initialStakeholders || ""}
              onChange={(event) =>
                setDraftProject({
                  ...draftProject,
                  initialStakeholders: event.target.value,
                })
              }
            />
          </label>
        </div>
        <button
          className="button secondary"
          onClick={() => updateProject(draftProject)}
        >
          Save project framing
        </button>
      </section>
      <div className="stats">
        {stats.map((s) => (
          <div className="stat-card" key={s.l}>
            <div className={`stat-icon ${s.c}`}>◈</div>
            <div>
              <strong>{s.n}</strong>
              <span>{s.l}</span>
            </div>
            <em>sample</em>
          </div>
        ))}
      </div>
      <div className="workspace-grid">
        <section className="panel hero-panel">
          <div className="panel-title">
            <div>
              <p className="eyebrow">GUIDED WORKFLOW · 03 OF 07</p>
              <h2>Engineer a requirement</h2>
            </div>
            <span className="status-pill">In progress</span>
          </div>
          <p className="lead">
            Turn stakeholder intent into a precise, verifiable statement.
            TraceGraph keeps the source, rationale, allocation, and evidence
            connected as you work.
          </p>
          <div className="workflow">
            <div className="workflow-line" />
            <div className="step done">
              <b>✓</b>
              <span>Discover need</span>
              <small>NEED-014</small>
            </div>
            <div className="step current">
              <b>2</b>
              <span>Author requirement</span>
              <small>REQ-042</small>
            </div>
            <div className="step">
              <b>3</b>
              <span>Plan verification</span>
              <small>Next action</small>
            </div>
          </div>
          <button className="button primary" onClick={() => go("Requirements")}>
            Continue authoring <span>→</span>
          </button>
        </section>
        <section className="panel readiness">
          <div className="panel-title">
            <h2>Model readiness</h2>
            <button className="text-button" onClick={() => go("Traceability")}>
              View analysis →
            </button>
          </div>
          <div className="readiness-score">
            <strong>{readiness}</strong>
            <span>/ 100</span>
            <div className="progress">
              <i style={{ width: `${readiness}%` }} />
            </div>
          </div>
          <p className="muted">
            Average of need formalization, allocation, verification, and
            evidence coverage. Select View analysis for numerator, denominator,
            and uncovered IDs.
          </p>
          {[
            [
              "✓",
              "Traceability coverage",
              `${traceability}% of requirements have an architecture allocation`,
              `${traceability}%`,
            ],
            [
              qualityWarnings ? "!" : "✓",
              "Quality warnings",
              `Review ${qualityWarnings} requirements with explainable findings`,
              String(qualityWarnings),
            ],
            [
              "✓",
              "Verification planned",
              `${verification}% of requirements have a verification case · ${evidence}% of tests have evidence`,
              `${verification}%`,
            ],
          ].map((x) => (
            <div className="check" key={x[1]}>
              <span className="checkmark">{x[0]}</span>
              <div>
                <b>{x[1]}</b>
                <small>{x[2]}</small>
              </div>
              <strong>{x[3]}</strong>
            </div>
          ))}
        </section>
      </div>
      <section className="panel performance-panel">
        <div className="panel-title">
          <div>
            <p className="eyebrow">OBSERVED SESSION PERFORMANCE</p>
            <h2>Measured timings</h2>
          </div>
          <span className="status-pill">Local browser only</span>
        </div>
        <p className="muted">
          These are measurements captured during this browser session, not
          performance claims for other devices or workloads.
        </p>
        <div className="performance-grid">
          {performanceStats.map((metric) => (
            <div className="performance-row" key={metric.label}>
              <b>{metric.label}</b>
              <strong>{metric.ms.toFixed(2)} ms</strong>
              <small>{new Date(metric.measuredAt).toLocaleTimeString()}</small>
            </div>
          ))}
        </div>
      </section>
      <section className="panel next-actions">
        <p className="eyebrow">RECOMMENDED NEXT ACTIONS</p>
        <h2>Keep the thread moving</h2>
        <div className="action-cards">
          <button onClick={() => go("Elicitation")}>
            <span>◌</span>
            <b>Review open needs</b>
            <small>{openNeeds} candidate needs await disposition</small>
            <em>Review →</em>
          </button>
          <button onClick={() => go("Verification")}>
            <span>✓</span>
            <b>Plan verification</b>
            <small>
              {criticalGaps} critical requirements have no verification link
            </small>
            <em>Open matrix →</em>
          </button>
          <button onClick={() => go("Impact")}>
            <span>↗</span>
            <b>Simulate a change</b>
            <small>See what the telemetry threshold touches</small>
            <em>Run simulation →</em>
          </button>
        </div>
      </section>
    </>
  );
}
function Elicitation({
  artifacts,
  relations,
  createNeedFromElicitation,
  createArtifactFromElicitation,
  createElicitationRecord,
  createStakeholder,
  createRequirementFromNeed,
  updateArtifact,
  selected,
  setSelected,
}: {
  artifacts: Artifact[];
  relations: Relation[];
  createNeedFromElicitation: (notes: string, stakeholderName: string) => void;
  createArtifactFromElicitation: (
    type:
      | "Concern"
      | "Need"
      | "Assumption"
      | "Constraint"
      | "Requirement"
      | "Decision"
      | "ActionItem",
    notes: string,
    stakeholderName: string,
  ) => void;
  createElicitationRecord: (
    notes: string,
    stakeholderName: string,
    details?: Record<string, string>,
  ) => void;
  createStakeholder: (name: string, details?: Record<string, string>) => void;
  createRequirementFromNeed: (needId: string) => void;
  updateArtifact: (id: string, patch: Partial<Artifact>) => void;
  selected: string;
  setSelected: (id: string) => void;
}) {
  const [notes, setNotes] = useState(
    "During a multi-agency response, I need to know whether the drone is still over the search zone and whether its camera feed is current. A stale map creates duplicate dispatches.",
  );
  const [selectedSourceText, setSelectedSourceText] = useState("");
  const [stakeholder, setStakeholder] = useState("Emergency coordinator");
  const [newStakeholder, setNewStakeholder] = useState("");
  const [stakeholderProfile, setStakeholderProfile] = useState<
    Record<string, string>
  >({
    role: "",
    responsibilities: "",
    influence: "Medium",
    interest: "Medium",
    authority: "",
    concerns: "",
    goals: "",
    interviewStatus: "Not started",
  });
  const [sessionDetails, setSessionDetails] = useState<Record<string, string>>({
    method: "Interview",
    sessionDate: "",
    participants: "",
    objectives: "",
    questions: "",
    findings: "",
    sources: "",
    confidence: "Unassessed",
    openQuestions: "",
    followUpActions: "",
  });
  const [extractionType, setExtractionType] = useState<
    | "Concern"
    | "Need"
    | "Assumption"
    | "Constraint"
    | "Requirement"
    | "Decision"
    | "ActionItem"
  >("Concern");
  const needs = artifacts.filter((artifact) => artifact.type === "Need");
  const selectedNeed = needs.find((need) => need.id === selected);
  const [disposition, setDisposition] = useState(
    selectedNeed?.metadata?.disposition || "Candidate",
  );
  const [dispositionRationale, setDispositionRationale] = useState(
    selectedNeed?.metadata?.dispositionRationale || "",
  );
  const selectedArtifact = artifacts.find(
    (artifact) => artifact.id === selected,
  );
  const source =
    artifacts.find(
      (artifact) =>
        artifact.type === "ElicitationRecord" &&
        (artifact.id === selected || artifact.id === selectedArtifact?.source),
    ) || artifacts.find((artifact) => artifact.type === "ElicitationRecord");
  const sourceLinks = source
    ? relations.filter((relation) => relation.from === source.id)
    : [];
  useEffect(() => {
    setDisposition(selectedNeed?.metadata?.disposition || "Candidate");
    setDispositionRationale(selectedNeed?.metadata?.dispositionRationale || "");
  }, [selectedNeed?.id, selectedNeed?.metadata]);
  const dispositionNeedsRationale =
    disposition !== "Accepted" && disposition !== "Candidate";
  const saveDisposition = () => {
    if (
      !selectedNeed ||
      (dispositionNeedsRationale && !dispositionRationale.trim())
    )
      return;
    updateArtifact(selectedNeed.id, {
      status: disposition,
      metadata: {
        ...(selectedNeed.metadata || {}),
        disposition,
        dispositionRationale: dispositionRationale.trim(),
      },
    });
  };
  const updateSessionDetail = (key: string, value: string) =>
    setSessionDetails((current) => ({ ...current, [key]: value }));
  const updateStakeholderProfile = (key: string, value: string) =>
    setStakeholderProfile((current) => ({ ...current, [key]: value }));
  const extractionText = selectedSourceText.trim() || notes;
  return (
    <div className="two-col">
      <section className="panel form-panel">
        <p className="eyebrow">ELICITATION SESSION · ERD-INT-04</p>
        <h2>Coordinator interview</h2>
        <p className="muted">
          Capture raw intent first. Formalize it only after the source and
          rationale are preserved.
        </p>
        <label>
          Source notes
          <textarea
            aria-label="Elicitation source notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            onSelect={(event) => {
              const target = event.currentTarget;
              setSelectedSourceText(
                target.value.slice(target.selectionStart, target.selectionEnd),
              );
            }}
          />
        </label>
        <div className="callout">
          <b>Selected source text</b>
          <p>
            {selectedSourceText.trim()
              ? `Extraction will preserve this ${selectedSourceText.trim().length}-character excerpt.`
              : "Select a sentence or passage in the notes to extract only that source text; otherwise the full note is used."}
          </p>
          {selectedSourceText.trim() && (
            <button
              className="text-button"
              onClick={() => setSelectedSourceText("")}
            >
              Clear source selection
            </button>
          )}
        </div>
        <label>
          Source stakeholder
          <select
            aria-label="Elicitation source stakeholder"
            value={stakeholder}
            onChange={(event) => setStakeholder(event.target.value)}
          >
            {artifacts
              .filter((artifact) => artifact.type === "Stakeholder")
              .map((artifact) => (
                <option key={artifact.id}>{artifact.name}</option>
              ))}
          </select>
        </label>
        <div className="inline-create">
          <label>
            Discover stakeholder
            <input
              aria-label="New stakeholder name"
              value={newStakeholder}
              onChange={(event) => setNewStakeholder(event.target.value)}
              placeholder="e.g. Logistics coordinator"
            />
          </label>
          <button
            className="button secondary"
            onClick={() => {
              createStakeholder(newStakeholder, stakeholderProfile);
              setStakeholder(newStakeholder.trim());
              setNewStakeholder("");
            }}
          >
            Add stakeholder
          </button>
        </div>
        <section
          className="metadata-panel"
          aria-labelledby="stakeholder-profile-title"
        >
          <div className="panel-title">
            <div>
              <p className="eyebrow">STAKEHOLDER DISCOVERY</p>
              <h3 id="stakeholder-profile-title">Role and perspective</h3>
            </div>
            <span className="muted">Applied when adding a stakeholder</span>
          </div>
          <div className="field-grid">
            <label>
              Role
              <input
                aria-label="Stakeholder role"
                value={stakeholderProfile.role}
                onChange={(event) =>
                  updateStakeholderProfile("role", event.target.value)
                }
              />
            </label>
            <label>
              Authority
              <input
                aria-label="Stakeholder authority"
                value={stakeholderProfile.authority}
                onChange={(event) =>
                  updateStakeholderProfile("authority", event.target.value)
                }
              />
            </label>
            <label>
              Influence
              <select
                aria-label="Stakeholder influence"
                value={stakeholderProfile.influence}
                onChange={(event) =>
                  updateStakeholderProfile("influence", event.target.value)
                }
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </label>
            <label>
              Interest
              <select
                aria-label="Stakeholder interest"
                value={stakeholderProfile.interest}
                onChange={(event) =>
                  updateStakeholderProfile("interest", event.target.value)
                }
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </label>
            <label>
              Interview status
              <select
                aria-label="Stakeholder interview status"
                value={stakeholderProfile.interviewStatus}
                onChange={(event) =>
                  updateStakeholderProfile(
                    "interviewStatus",
                    event.target.value,
                  )
                }
              >
                <option>Not started</option>
                <option>Scheduled</option>
                <option>Captured</option>
                <option>Reviewed</option>
              </select>
            </label>
          </div>
          <div className="field-grid">
            {(
              [
                ["responsibilities", "Responsibilities"],
                ["concerns", "Concerns"],
                ["goals", "Goals"],
              ] as const
            ).map(([key, label]) => (
              <label key={key}>
                {label}
                <textarea
                  aria-label={`Stakeholder ${label.toLowerCase()}`}
                  value={stakeholderProfile[key]}
                  onChange={(event) =>
                    updateStakeholderProfile(key, event.target.value)
                  }
                />
              </label>
            ))}
          </div>
        </section>
        <div className="callout">
          <b>Suggested candidate need</b>
          <p>
            Coordinator needs trustworthy, current mission location and status
            during response.
          </p>
        </div>
        <section
          className="metadata-panel"
          aria-labelledby="session-details-title"
        >
          <div className="panel-title">
            <div>
              <p className="eyebrow">SESSION RECORD</p>
              <h3 id="session-details-title">
                Method, evidence, and follow-up
              </h3>
            </div>
            <span className="muted">Saved with the source record</span>
          </div>
          <div className="field-grid">
            <label>
              Elicitation method
              <select
                aria-label="Elicitation method"
                value={sessionDetails.method}
                onChange={(event) =>
                  updateSessionDetail("method", event.target.value)
                }
              >
                <option>Interview</option>
                <option>Workshop</option>
                <option>Survey</option>
                <option>Observation</option>
                <option>Document analysis</option>
                <option>Existing-system analysis</option>
                <option>Interface analysis</option>
                <option>Scenario analysis</option>
                <option>Prototyping</option>
                <option>Lessons-learned analysis</option>
              </select>
            </label>
            <label>
              Session date
              <input
                aria-label="Elicitation session date"
                type="date"
                value={sessionDetails.sessionDate}
                onChange={(event) =>
                  updateSessionDetail("sessionDate", event.target.value)
                }
              />
            </label>
            <label>
              Confidence
              <select
                aria-label="Elicitation confidence"
                value={sessionDetails.confidence}
                onChange={(event) =>
                  updateSessionDetail("confidence", event.target.value)
                }
              >
                <option>Unassessed</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </label>
            <label>
              Participants
              <input
                aria-label="Elicitation participants"
                value={sessionDetails.participants}
                onChange={(event) =>
                  updateSessionDetail("participants", event.target.value)
                }
              />
            </label>
          </div>
          <div className="field-grid">
            {(
              [
                ["objectives", "Objectives"],
                ["questions", "Questions"],
                ["findings", "Findings"],
                ["sources", "Sources"],
                ["openQuestions", "Open questions"],
                ["followUpActions", "Follow-up actions"],
              ] as const
            ).map(([key, label]) => (
              <label key={key}>
                {label}
                <textarea
                  aria-label={`Elicitation ${label.toLowerCase()}`}
                  value={sessionDetails[key]}
                  onChange={(event) =>
                    updateSessionDetail(key, event.target.value)
                  }
                />
              </label>
            ))}
          </div>
        </section>
        <button
          className="button secondary"
          onClick={() =>
            createElicitationRecord(notes, stakeholder, sessionDetails)
          }
        >
          Save elicitation record
        </button>
        <div className="inline-create">
          <label>
            Extract source into
            <select
              aria-label="Elicitation extraction type"
              value={extractionType}
              onChange={(event) =>
                setExtractionType(event.target.value as typeof extractionType)
              }
            >
              <option>Concern</option>
              <option>Need</option>
              <option>Assumption</option>
              <option>Constraint</option>
              <option>Requirement</option>
              <option>Decision</option>
              <option>ActionItem</option>
            </select>
          </label>
          <button
            className="button secondary"
            onClick={() =>
              createArtifactFromElicitation(
                extractionType,
                extractionText,
                stakeholder,
              )
            }
          >
            Extract canonical artifact
          </button>
        </div>
        <button
          className="button primary"
          onClick={() => createNeedFromElicitation(extractionText, stakeholder)}
        >
          Accept candidate need
        </button>
        <div className="callout">
          <b>Canonical provenance</b>
          <p>
            {source?.id || "No source record"} → captures →{" "}
            {sourceLinks.length
              ? sourceLinks.length + " linked artifacts"
              : "ready for a need"}
          </p>
          {sourceLinks.length > 0 && (
            <ul className="trace-list">
              {sourceLinks.map((link) => (
                <li key={`${link.kind}-${link.to}`}>
                  <button
                    className="text-button"
                    onClick={() => setSelected(link.to)}
                  >
                    {link.to}
                  </button>{" "}
                  <span className="muted">· {link.kind}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
      <section className="panel side-note">
        <p className="eyebrow">PROVENANCE</p>
        <h3>Why this matters</h3>
        <p>
          Traceability starts at the source. Keeping original wording makes
          later review explainable and protects the model from losing
          stakeholder intent.
        </p>
        <div className="mini-trace">
          <span>Interview note</span>
          <i>→</i>
          <span>Candidate need</span>
          <i>→</i>
          <span>Requirement</span>
        </div>
        <div className="field-grid">
          <label>
            Review a candidate need
            <select
              aria-label="Candidate need"
              value={selectedNeed?.id || needs[0]?.id || ""}
              onChange={(event) => setSelected(event.target.value)}
            >
              {needs.slice(-8).map((need) => (
                <option key={need.id} value={need.id}>
                  {need.id} · {need.name}
                </option>
              ))}
            </select>
          </label>
          {selectedNeed && (
            <>
              <p className="muted">{selectedNeed.description}</p>
              <label>
                Need disposition
                <select
                  aria-label="Need disposition"
                  value={disposition}
                  onChange={(event) => setDisposition(event.target.value)}
                >
                  <option>Candidate</option>
                  <option>Accepted</option>
                  <option>Rejected</option>
                  <option>Merged</option>
                  <option>Split</option>
                  <option>Deferred</option>
                  <option>Duplicate</option>
                  <option>Unresolved</option>
                </select>
              </label>
              {dispositionNeedsRationale && (
                <label>
                  Disposition rationale
                  <textarea
                    aria-label="Disposition rationale"
                    value={dispositionRationale}
                    onChange={(event) =>
                      setDispositionRationale(event.target.value)
                    }
                    placeholder="Explain the review decision"
                  />
                </label>
              )}
              <button
                className="button secondary"
                disabled={
                  dispositionNeedsRationale && !dispositionRationale.trim()
                }
                onClick={saveDisposition}
              >
                Save need disposition
              </button>
              <button
                className="button secondary"
                onClick={() => createRequirementFromNeed(selectedNeed.id)}
              >
                Convert need to requirement
              </button>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
function Requirements(p: PageProps) {
  const detailedFindings = qualityAnalysis(p.current);
  const findings = detailedFindings.filter(
    (finding) =>
      p.current.metadata?.[`quality:${finding.id}:disposition`] !== "Dismissed",
  );
  const artifactVersions = p.versions.filter(
    (entry) => entry.artifactId === p.current.id,
  );
  const [compareVersion, setCompareVersion] = useState("");
  const comparisonVersion = artifactVersions.find(
    (entry) => entry.id === compareVersion,
  );
  const [structure, setStructure] = useState<RequirementStructure>(
    p.current.structure || {
      actor: "the system",
      action: "provide",
      object: "the required capability",
      condition: "under nominal operating conditions",
      trigger: "",
      threshold: "",
      unit: "",
      timing: "",
      tolerance: "",
      exception: "",
      rationale: "",
    },
  );
  useEffect(() => {
    setStructure(
      p.current.structure || {
        actor: "the system",
        action: "provide",
        object: "the required capability",
        condition: "under nominal operating conditions",
        trigger: "",
        threshold: "",
        unit: "",
        timing: "",
        tolerance: "",
        exception: "",
        rationale: "",
      },
    );
  }, [p.current.id, p.current.structure]);
  const buildSentence = (value: RequirementStructure) =>
    `The ${value.actor} shall ${value.action} ${value.object}${value.trigger ? ` when ${value.trigger}` : ""}${value.condition ? ` ${value.condition}` : ""}${value.threshold ? ` within ${value.threshold}${value.unit ? ` ${value.unit}` : ""}` : ""}${value.timing ? ` with ${value.timing}` : ""}${value.tolerance ? ` and tolerance ${value.tolerance}` : ""}${value.exception ? ` except ${value.exception}` : ""}.`;
  const updateStructure = (key: keyof RequirementStructure, value: string) => {
    const next = { ...structure, [key]: value };
    setStructure(next);
    p.update({ structure: next, description: buildSentence(next) });
  };
  const [target, setTarget] = useState(
    p.allArtifacts.find((a) => a.id !== p.current.id)?.id || "",
  );
  const [kind, setKind] = useState("depends-on");
  const [rationale, setRationale] = useState("");
  const [confidence, setConfidence] = useState("Unassessed");
  const [relationReviewStatus, setRelationReviewStatus] =
    useState("Not reviewed");
  const link = () => {
    if (target)
      p.addRelation({
        from: p.current.id,
        to: target,
        kind,
        rationale: rationale || undefined,
        confidence,
        reviewStatus: relationReviewStatus,
      });
  };
  const threadRelations = p.relations.filter(
    (relation) =>
      relation.from === p.current.id || relation.to === p.current.id,
  );
  return (
    <div className="requirements-layout">
      <section className="panel artifact-list">
        <div className="list-head">
          <div>
            <p className="eyebrow">CANONICAL MODEL</p>
            <h2>
              Requirements{" "}
              <span>
                {p.artifacts.filter((a) => a.type === "Requirement").length}
              </span>
            </h2>
          </div>
          <button
            className="button small primary"
            onClick={p.createRequirement}
          >
            + New
          </button>
        </div>
        <input
          className="search"
          aria-label="Search artifacts"
          placeholder="Search artifacts…"
          value={p.query}
          onChange={(e) => p.setQuery(e.target.value)}
        />
        {p.artifacts.map((a) => (
          <button
            className={
              p.selected === a.id ? "artifact-row selected" : "artifact-row"
            }
            key={a.id}
            onClick={() => p.setSelected(a.id)}
          >
            <span className={`type-dot ${a.type.toLowerCase()}`} />
            <span>
              <b>{a.id}</b>
              <small>{a.name}</small>
            </span>
            <em>{a.status}</em>
          </button>
        ))}
      </section>
      <section className="panel editor">
        <div className="editor-head">
          <div>
            <span className="id-label">{p.current.id}</span>
            <span className="status-pill warning">{p.current.status}</span>
          </div>
          <span
            className="text-button"
            title="Edit the fields below to change this artifact"
          >
            ⋯ More
          </span>
        </div>
        {p.current.type === "Need" && (
          <div className="callout">
            <b>Candidate need under review</b>
            <p>
              Preserve the source wording while formalizing this need into a
              testable requirement.
            </p>
            <button
              className="button secondary"
              onClick={() => p.createRequirementFromNeed(p.current.id)}
            >
              Convert this need to a requirement
            </button>
          </div>
        )}
        <label>
          Artifact name
          <input
            value={p.current.name}
            onChange={(e) => p.update({ name: e.target.value })}
          />
        </label>
        <label>
          Requirement statement
          <textarea
            value={p.current.description}
            onChange={(e) => p.update({ description: e.target.value })}
          />
        </label>
        <div className={`quality-box ${findings.length ? "has-warning" : ""}`}>
          <div>
            <span className="quality-icon">{findings.length ? "!" : "✓"}</span>
            <div>
              <b>
                Quality analysis ·{" "}
                {findings.length
                  ? `${findings.length} finding${findings.length > 1 ? "s" : ""}`
                  : "Pass"}
              </b>
              <small>
                {findings[0]?.message ||
                  "Contains a subject, measurable threshold, and verification context."}
              </small>
            </div>
          </div>
          <span
            className="text-button"
            title={findings.map((finding) => finding.message).join(" ")}
          >
            Explain
          </span>
        </div>
        {detailedFindings.length > 0 && (
          <section className="quality-findings" aria-label="Quality findings">
            {detailedFindings.map((finding) => {
              const disposition =
                p.current.metadata?.[`quality:${finding.id}:disposition`] ||
                "Open";
              const rationale =
                p.current.metadata?.[`quality:${finding.id}:rationale`] || "";
              return (
                <article className="quality-finding" key={finding.id}>
                  <div>
                    <b>{finding.rule}</b>
                    <span className="status-pill">{finding.severity}</span>
                  </div>
                  <p>{finding.message}</p>
                  <small>
                    Trigger: “{finding.triggeringText}” · Why: {finding.why}
                  </small>
                  <small>Suggested correction: {finding.suggestion}</small>
                  <label>
                    Finding disposition
                    <select
                      aria-label={`Quality disposition ${finding.id}`}
                      value={disposition}
                      onChange={(event) =>
                        p.update({
                          metadata: {
                            ...(p.current.metadata || {}),
                            [`quality:${finding.id}:disposition`]:
                              event.target.value,
                          },
                        })
                      }
                    >
                      <option>Open</option>
                      <option>Accepted</option>
                      <option>Dismissed</option>
                    </select>
                  </label>
                  {disposition === "Dismissed" && (
                    <label>
                      Dismissal rationale
                      <input
                        aria-label={`Quality dismissal rationale ${finding.id}`}
                        value={rationale}
                        onChange={(event) =>
                          p.update({
                            metadata: {
                              ...(p.current.metadata || {}),
                              [`quality:${finding.id}:rationale`]:
                                event.target.value,
                            },
                          })
                        }
                      />
                    </label>
                  )}
                </article>
              );
            })}
          </section>
        )}
        <div className="field-grid">
          <label>
            Priority
            <select
              value={p.current.priority || "Medium"}
              onChange={(e) => p.update({ priority: e.target.value })}
            >
              <option>Critical</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </label>
          <label>
            Formal type
            <select
              aria-label="Requirement type"
              value={
                p.current.metadata?.requirementType || "Functional requirement"
              }
              onChange={(event) =>
                p.update({
                  metadata: {
                    ...(p.current.metadata || {}),
                    requirementType: event.target.value,
                  },
                })
              }
            >
              <option>Stakeholder requirement</option>
              <option>Mission requirement</option>
              <option>Business requirement</option>
              <option>System requirement</option>
              <option>Subsystem requirement</option>
              <option>Interface requirement</option>
              <option>Functional requirement</option>
              <option>Performance requirement</option>
              <option>Quality requirement</option>
              <option>Safety requirement</option>
              <option>Security requirement</option>
              <option>Data requirement</option>
              <option>Operational requirement</option>
              <option>Support requirement</option>
              <option>Regulatory constraint</option>
              <option>Design constraint</option>
            </select>
          </label>
        </div>
        <section className="metadata-panel" aria-labelledby="metadata-title">
          <div className="panel-title">
            <div>
              <p className="eyebrow">COMMON ARTIFACT METADATA</p>
              <h3 id="metadata-title">Ownership and review context</h3>
            </div>
            <span className="muted">Persisted in the canonical model</span>
          </div>
          <div className="field-grid">
            <label>
              Maturity
              <select
                aria-label="Artifact maturity"
                value={p.current.maturity || "Draft"}
                onChange={(event) => p.update({ maturity: event.target.value })}
              >
                <option>Draft</option>
                <option>In refinement</option>
                <option>Reviewed</option>
                <option>Baselined</option>
              </select>
            </label>
            <label>
              Owner
              <input
                aria-label="Artifact owner"
                value={p.current.owner || ""}
                onChange={(event) => p.update({ owner: event.target.value })}
              />
            </label>
            <label>
              Criticality
              <select
                aria-label="Artifact criticality"
                value={p.current.criticality || "Moderate"}
                onChange={(event) =>
                  p.update({ criticality: event.target.value })
                }
              >
                <option>Low</option>
                <option>Moderate</option>
                <option>High</option>
                <option>Mission critical</option>
              </select>
            </label>
            <label>
              Source / provenance
              <input
                aria-label="Artifact source"
                value={p.current.source || ""}
                onChange={(event) => p.update({ source: event.target.value })}
              />
            </label>
            <label>
              Rationale
              <textarea
                aria-label="Requirement rationale"
                value={
                  p.current.metadata?.rationale || structure.rationale || ""
                }
                onChange={(event) => {
                  const value = event.target.value;
                  const next = { ...structure, rationale: value };
                  setStructure(next);
                  p.update({
                    metadata: {
                      ...(p.current.metadata || {}),
                      rationale: value,
                    },
                    structure: next,
                  });
                }}
              />
            </label>
            <label>
              Review status
              <select
                aria-label="Artifact review status"
                value={p.current.reviewStatus || "Not reviewed"}
                onChange={(event) =>
                  p.update({ reviewStatus: event.target.value })
                }
              >
                <option>Not reviewed</option>
                <option>In review</option>
                <option>Accepted</option>
                <option>Accepted with actions</option>
                <option>Rejected</option>
              </select>
            </label>
            <label>
              Baseline
              <input
                aria-label="Artifact baseline"
                value={p.current.baseline || ""}
                onChange={(event) => p.update({ baseline: event.target.value })}
              />
            </label>
            <label>
              Tags
              <input
                aria-label="Artifact tags"
                value={(p.current.tags || []).join(", ")}
                onChange={(event) =>
                  p.update({
                    tags: event.target.value
                      .split(",")
                      .map((tag) => tag.trim())
                      .filter(Boolean),
                  })
                }
              />
            </label>
          </div>
        </section>
        <section
          className="structured-builder"
          aria-labelledby="structured-title"
        >
          <div className="panel-title">
            <div>
              <p className="eyebrow">STRUCTURED BUILDER</p>
              <h3 id="structured-title">Formalize the sentence</h3>
            </div>
            <span className="muted">Generates canonical text</span>
          </div>
          <div className="field-grid">
            <label>
              Actor
              <input
                aria-label="Requirement actor"
                value={structure.actor}
                onChange={(event) =>
                  updateStructure("actor", event.target.value)
                }
              />
            </label>
            <label>
              Action
              <input
                aria-label="Requirement action"
                value={structure.action}
                onChange={(event) =>
                  updateStructure("action", event.target.value)
                }
              />
            </label>
            <label>
              Object
              <input
                aria-label="Requirement object"
                value={structure.object}
                onChange={(event) =>
                  updateStructure("object", event.target.value)
                }
              />
            </label>
            <label>
              Condition
              <input
                aria-label="Requirement condition"
                value={structure.condition}
                onChange={(event) =>
                  updateStructure("condition", event.target.value)
                }
              />
            </label>
            <label>
              Trigger
              <input
                aria-label="Requirement trigger"
                value={structure.trigger || ""}
                onChange={(event) =>
                  updateStructure("trigger", event.target.value)
                }
              />
            </label>
            <label>
              Threshold
              <input
                aria-label="Requirement threshold"
                value={structure.threshold}
                onChange={(event) =>
                  updateStructure("threshold", event.target.value)
                }
              />
            </label>
            <label>
              Unit
              <input
                aria-label="Requirement unit"
                value={structure.unit}
                onChange={(event) =>
                  updateStructure("unit", event.target.value)
                }
              />
            </label>
            <label>
              Timing
              <input
                aria-label="Requirement timing"
                value={structure.timing || ""}
                onChange={(event) =>
                  updateStructure("timing", event.target.value)
                }
              />
            </label>
            <label>
              Tolerance
              <input
                aria-label="Requirement tolerance"
                value={structure.tolerance || ""}
                onChange={(event) =>
                  updateStructure("tolerance", event.target.value)
                }
              />
            </label>
            <label>
              Exception
              <input
                aria-label="Requirement exception"
                value={structure.exception || ""}
                onChange={(event) =>
                  updateStructure("exception", event.target.value)
                }
              />
            </label>
          </div>
          <div className="generated-sentence">
            <small>Generated statement</small>
            <b>{buildSentence(structure)}</b>
          </div>
        </section>
        <div className="linked-block">
          <div className="panel-title">
            <h3>Digital thread</h3>
            <button className="text-button" onClick={p.createChildRequirement}>
              Create child requirement
            </button>
            <div className="link-controls">
              <select
                className="link-select"
                aria-label="Link target"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              >
                {p.allArtifacts
                  .filter((a) => a.id !== p.current.id)
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.id} · {a.name}
                    </option>
                  ))}
              </select>
              <select
                className="link-kind"
                aria-label="Relationship kind"
                value={kind}
                onChange={(e) => setKind(e.target.value)}
              >
                {canonicalRelationshipKinds.map((relationshipKind) => (
                  <option key={relationshipKind}>{relationshipKind}</option>
                ))}
              </select>
              <label className="relationship-rationale">
                Rationale
                <input
                  aria-label="Relationship rationale"
                  value={rationale}
                  onChange={(event) => setRationale(event.target.value)}
                />
              </label>
              <label>
                Confidence
                <select
                  aria-label="Relationship confidence"
                  value={confidence}
                  onChange={(event) => setConfidence(event.target.value)}
                >
                  <option>Unassessed</option>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </label>
              <label>
                Review status
                <select
                  aria-label="Relationship review status"
                  value={relationReviewStatus}
                  onChange={(event) =>
                    setRelationReviewStatus(event.target.value)
                  }
                >
                  <option>Not reviewed</option>
                  <option>In review</option>
                  <option>Accepted</option>
                  <option>Accepted with actions</option>
                  <option>Rejected</option>
                </select>
              </label>
              <button className="text-button" onClick={link}>
                Add link
              </button>
            </div>
          </div>
          <div className="thread-chips">
            {threadRelations.slice(0, 12).map((relation) => {
              const otherId =
                relation.from === p.current.id ? relation.to : relation.from;
              const other = p.allArtifacts.find(
                (artifact) => artifact.id === otherId,
              );
              return (
                <span key={relation.from + relation.kind + relation.to}>
                  {otherId} · {relation.kind}
                  {other ? " · " + other.name : ""}
                </span>
              );
            })}
            {!threadRelations.length && (
              <span className="muted">No canonical relationships yet.</span>
            )}
          </div>
        </div>
        <div className="editor-footer">
          <span>Autosaved · local workspace</span>
          {p.current.status === "Archived" ? (
            <button
              className="button secondary"
              onClick={() => p.restoreArtifact(p.current.id)}
            >
              Restore artifact
            </button>
          ) : (
            <button
              className="button danger"
              onClick={() => p.archiveArtifact(p.current.id)}
            >
              Archive artifact
            </button>
          )}
          <button
            className="button primary"
            onClick={() => p.update({ status: "Approved" })}
          >
            Mark reviewed
          </button>
        </div>
        <section
          className="version-history"
          aria-labelledby="version-history-title"
        >
          <div className="panel-title">
            <div>
              <p className="eyebrow">AUDITABLE HISTORY</p>
              <h3 id="version-history-title">Artifact versions</h3>
            </div>
            <span className="muted">
              {
                p.versions.filter((entry) => entry.artifactId === p.current.id)
                  .length
              }{" "}
              recorded
            </span>
          </div>
          {p.versions
            .filter((entry) => entry.artifactId === p.current.id)
            .slice(-5)
            .reverse()
            .map((entry) => (
              <div className="version-row" key={entry.id}>
                <b>v{entry.version}</b>
                <span>{entry.action}</span>
                <small>{new Date(entry.timestamp).toLocaleString()}</small>
              </div>
            ))}
          {!p.versions.some((entry) => entry.artifactId === p.current.id) && (
            <p className="muted">
              Changes to this artifact will appear here with their action and
              timestamp.
            </p>
          )}
          {artifactVersions.length > 0 && (
            <div className="version-compare">
              <label>
                Compare current artifact with
                <select
                  aria-label="Version comparison"
                  value={compareVersion}
                  onChange={(event) => setCompareVersion(event.target.value)}
                >
                  <option value="">Select a recorded version</option>
                  {artifactVersions.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      v{entry.version} · {entry.action}
                    </option>
                  ))}
                </select>
              </label>
              {comparisonVersion && (
                <div className="callout">
                  <b>
                    Version delta · v{comparisonVersion.version} → working copy
                  </b>
                  {(
                    [
                      "name",
                      "description",
                      "status",
                      "priority",
                      "quality",
                    ] as const
                  )
                    .filter(
                      (key) =>
                        comparisonVersion.snapshot[key] !== p.current[key],
                    )
                    .map((key) => (
                      <small key={key}>
                        {key}: {String(comparisonVersion.snapshot[key] || "—")}{" "}
                        → {String(p.current[key] || "—")}
                      </small>
                    ))}
                  {!(
                    [
                      "name",
                      "description",
                      "status",
                      "priority",
                      "quality",
                    ] as const
                  ).some(
                    (key) => comparisonVersion.snapshot[key] !== p.current[key],
                  ) && <small>No scalar field differences.</small>}
                </div>
              )}
            </div>
          )}
        </section>
      </section>
    </div>
  );
}
function Trace(p: PageProps) {
  const [mapWidth, setMapWidth] = useState(() => {
    const value = Number(localStorage.getItem("tg-trace-map-width") || 0);
    return value >= 420 && value <= 1100 ? value : 760;
  });
  const [direction, setDirection] = useState<"both" | "outgoing" | "incoming">(
    () => {
      try {
        return (
          JSON.parse(localStorage.getItem("tg-saved-trace") || "null")
            ?.direction || "both"
        );
      } catch {
        return "both";
      }
    },
  );
  const [depth, setDepth] = useState(() => {
    try {
      return Number(
        JSON.parse(localStorage.getItem("tg-saved-trace") || "null")?.depth ||
          3,
      );
    } catch {
      return 3;
    }
  });
  const [kind, setKind] = useState(() => {
    try {
      return (
        JSON.parse(localStorage.getItem("tg-saved-trace") || "null")?.kind ||
        "all"
      );
    } catch {
      return "all";
    }
  });
  const [showGaps, setShowGaps] = useState(false);
  const [approvedOnly, setApprovedOnly] = useState(false);
  const [includeInferred, setIncludeInferred] = useState(true);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [isolatedIds, setIsolatedIds] = useState<Set<string> | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [excludedTypes, setExcludedTypes] = useState<ArtifactType[]>(() => {
    try {
      const value = JSON.parse(
        localStorage.getItem("tg-saved-trace") || "null",
      )?.excludedTypes;
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  });
  const [savedTrace, setSavedTrace] = useState(() =>
    localStorage.getItem("tg-saved-trace") ? "Saved trace perspective" : "",
  );
  const traceTypes = [
    ...new Set(p.allArtifacts.map((artifact) => artifact.type)),
  ] as ArtifactType[];
  const kinds = [
    ...new Set(p.relations.map((relation) => relation.kind)),
  ].sort();
  const relationVisible = useMemo(
    () => (relation: Relation) =>
      (!approvedOnly || relation.reviewStatus === "Accepted") &&
      (includeInferred || !relation.inferred),
    [approvedOnly, includeInferred],
  );
  const traceIds = useMemo(() => {
    const found = new Set([p.selected]);
    let frontier = [p.selected];
    const allowed = (id: string) => {
      const artifact = p.allArtifacts.find((item) => item.id === id);
      return (
        id === p.selected || !artifact || !excludedTypes.includes(artifact.type)
      );
    };
    for (let level = 0; level < depth; level += 1) {
      const next: string[] = [];
      p.relations.forEach((relation) => {
        if (!relationVisible(relation)) return;
        if (kind !== "all" && relation.kind !== kind) return;
        const outgoing =
          direction !== "incoming" && frontier.includes(relation.from);
        const incoming =
          direction !== "outgoing" && frontier.includes(relation.to);
        if (outgoing && allowed(relation.to) && !found.has(relation.to))
          next.push(relation.to);
        if (incoming && allowed(relation.from) && !found.has(relation.from))
          next.push(relation.from);
      });
      next.forEach((id) => found.add(id));
      frontier = next;
      if (!frontier.length) break;
    }
    return [...found].filter(
      (id) =>
        allowed(id) &&
        (!showGaps ||
          p.relations.some(
            (relation) =>
              relation.from === id && relation.kind === "verified-by",
          )),
    );
  }, [
    depth,
    direction,
    excludedTypes,
    kind,
    p.allArtifacts,
    p.relations,
    p.selected,
    relationVisible,
    showGaps,
  ]);
  const visibleRelations = p.relations.filter(
    (relation) =>
      traceIds.includes(relation.from) &&
      traceIds.includes(relation.to) &&
      !hiddenIds.has(relation.from) &&
      !hiddenIds.has(relation.to) &&
      (!isolatedIds ||
        (isolatedIds.has(relation.from) && isolatedIds.has(relation.to))) &&
      relationVisible(relation) &&
      (kind === "all" || relation.kind === kind),
  );
  const renderedIds = traceIds.filter(
    (id) => !hiddenIds.has(id) && (!isolatedIds || isolatedIds.has(id)),
  );
  const diagnostics = useMemo(
    () => modelDiagnostics(p.allArtifacts, p.relations),
    [p.allArtifacts, p.relations],
  );
  const selectedArtifact = p.allArtifacts.find(
    (artifact) => artifact.id === p.selected,
  );
  const [matrixTarget, setMatrixTarget] = useState(
    p.allArtifacts.find((artifact) => artifact.id !== p.selected)?.id || "",
  );
  const [matrixKind, setMatrixKind] = useState("depends-on");
  const matrixTypes = [
    ...new Set(p.allArtifacts.map((artifact) => artifact.type)),
  ] as ArtifactType[];
  const [matrixRowType, setMatrixRowType] = useState<ArtifactType>(
    matrixTypes.includes("Requirement") ? "Requirement" : matrixTypes[0],
  );
  const [matrixColumnType, setMatrixColumnType] = useState<ArtifactType>(
    matrixTypes.includes("Block") ? "Block" : matrixTypes[1] || matrixTypes[0],
  );
  useEffect(() => {
    if (matrixTarget === p.selected)
      setMatrixTarget(
        p.allArtifacts.find((artifact) => artifact.id !== p.selected)?.id || "",
      );
  }, [matrixTarget, p.allArtifacts, p.selected]);
  const missingVerification =
    selectedArtifact?.type === "Requirement" &&
    !p.relations.some(
      (relation) =>
        relation.from === p.selected && relation.kind === "verified-by",
    );
  const saveTrace = () => {
    localStorage.setItem(
      "tg-saved-trace",
      JSON.stringify({
        selected: p.selected,
        direction,
        depth,
        kind,
        excludedTypes,
        approvedOnly,
        includeInferred,
      }),
    );
    setSavedTrace("Saved trace perspective");
  };
  const expandNeighbors = () => setDepth((current) => Math.min(4, current + 1));
  const isolateSubgraph = () => setIsolatedIds(new Set(traceIds));
  const resetGraphView = () => {
    setHiddenIds(new Set());
    setIsolatedIds(null);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };
  return (
    <div
      className="trace-layout"
      style={{ gridTemplateColumns: `${mapWidth}px minmax(280px, 1fr)` }}
    >
      <section className="panel trace-map">
        <div className="panel-title">
          <div>
            <p className="eyebrow">
              TRACE EXPLORER · {traceIds.length} ARTIFACTS
            </p>
            <h2>End-to-end digital thread</h2>
          </div>
          <button
            className="text-button"
            onClick={() => {
              const started = performance.now();
              download("trace.mmd", mermaid(p.allArtifacts, p.relations));
              p.recordPerformance(
                "Mermaid generation",
                performance.now() - started,
              );
            }}
          >
            Download .mmd
          </button>
        </div>
        <label className="panel-resize-control">
          Workspace split
          <input
            aria-label="Trace workspace split"
            type="range"
            min={420}
            max={1100}
            value={mapWidth}
            onChange={(event) => {
              const next = Number(event.target.value);
              setMapWidth(next);
              localStorage.setItem("tg-trace-map-width", String(next));
            }}
          />
        </label>
        <div className="trace-controls" aria-label="Trace filters">
          <label>
            Direction
            <select
              aria-label="Trace direction"
              value={direction}
              onChange={(event) =>
                setDirection(event.target.value as typeof direction)
              }
            >
              <option value="both">Both directions</option>
              <option value="outgoing">Downstream only</option>
              <option value="incoming">Upstream only</option>
            </select>
          </label>
          <label>
            Maximum depth
            <select
              aria-label="Trace depth"
              value={depth}
              onChange={(event) => setDepth(Number(event.target.value))}
            >
              <option value="1">1 hop</option>
              <option value="2">2 hops</option>
              <option value="3">3 hops</option>
              <option value="4">4 hops</option>
            </select>
          </label>
          <label>
            Relationship
            <select
              aria-label="Trace relationship"
              value={kind}
              onChange={(event) => setKind(event.target.value)}
            >
              <option value="all">All relationship types</option>
              {kinds.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            Exclude artifact types
            <select
              aria-label="Excluded artifact types"
              multiple
              size={3}
              value={excludedTypes}
              onChange={(event) =>
                setExcludedTypes(
                  Array.from(
                    event.target.selectedOptions,
                    (option) => option.value as ArtifactType,
                  ),
                )
              }
            >
              {traceTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showGaps}
              onChange={(event) => setShowGaps(event.target.checked)}
            />{" "}
            Verified paths only
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={approvedOnly}
              onChange={(event) => setApprovedOnly(event.target.checked)}
            />{" "}
            Approved relationships only
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={includeInferred}
              onChange={(event) => setIncludeInferred(event.target.checked)}
            />{" "}
            Include inferred relationships
          </label>
        </div>
        <div className="graph-toolbar" aria-label="Graph workspace controls">
          <button
            className="button small secondary"
            aria-label="Zoom in"
            onClick={() => setZoom((current) => Math.min(2, current + 0.1))}
          >
            Zoom in
          </button>
          <button
            className="button small secondary"
            aria-label="Zoom out"
            onClick={() => setZoom((current) => Math.max(0.6, current - 0.1))}
          >
            Zoom out
          </button>
          <button
            className="button small secondary"
            aria-label="Pan graph left"
            onClick={() =>
              setPan((current) => ({ ...current, x: current.x - 60 }))
            }
          >
            ← Pan
          </button>
          <button
            className="button small secondary"
            aria-label="Pan graph right"
            onClick={() =>
              setPan((current) => ({ ...current, x: current.x + 60 }))
            }
          >
            Pan →
          </button>
          <button
            className="button small secondary"
            onClick={expandNeighbors}
            disabled={depth >= 4}
          >
            Expand neighbors
          </button>
          <button
            className="button small secondary"
            onClick={isolateSubgraph}
            disabled={!traceIds.length}
          >
            Isolate subgraph
          </button>
          <button
            className="button small secondary"
            onClick={() =>
              setHiddenIds((current) => new Set(current).add(p.selected))
            }
            disabled={!renderedIds.includes(p.selected)}
          >
            Hide selected
          </button>
          <button
            className="button small secondary"
            onClick={resetGraphView}
            disabled={
              !hiddenIds.size && !isolatedIds && zoom === 1 && !pan.x && !pan.y
            }
          >
            Reset view
          </button>
          <span className="muted" role="status">
            {Math.round(zoom * 100)}% · {renderedIds.length} visible
          </span>
        </div>
        <svg
          className="trace-svg"
          viewBox={`0 0 ${Math.max(800, renderedIds.length * 112 + 40)} 390`}
          role="img"
          aria-label="Trace graph from stakeholder need through requirement, architecture, test and evidence"
        >
          <defs>
            <linearGradient id="line" x1="0" x2="1">
              <stop stopColor="#635fec" />
              <stop offset="1" stopColor="#0eb4ec" />
            </linearGradient>
          </defs>
          <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
            {visibleRelations
              .slice(0, Math.max(0, renderedIds.length - 1))
              .map((relation, i) => (
                <g key={`${relation.from}-${relation.to}-${relation.kind}`}>
                  <line
                    x1={75 + i * 112}
                    y1="190"
                    x2={165 + i * 112}
                    y2="190"
                    stroke="url(#line)"
                    strokeWidth="3"
                  />
                  <text x={112 + i * 112} y="177" className="svg-kind">
                    {relation.kind}
                  </text>
                </g>
              ))}
            {renderedIds.map((id, i) => (
              <g
                key={id}
                className="svg-node"
                role="button"
                tabIndex={0}
                aria-label={`Select ${id}`}
                onClick={() => p.setSelected(id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    p.setSelected(id);
                  }
                }}
              >
                <circle
                  cx={75 + i * 112}
                  cy="190"
                  r={p.selected === id ? 32 : 26}
                />
                <text x={75 + i * 112} y="250" textAnchor="middle">
                  {id}
                </text>
                <text
                  x={75 + i * 112}
                  y="150"
                  textAnchor="middle"
                  className="svg-type"
                >
                  {p.allArtifacts.find((a) => a.id === id)?.type}
                </text>
              </g>
            ))}
          </g>
        </svg>
        {!renderedIds.length && (
          <div className="empty-state">
            No artifacts match these trace filters.
          </div>
        )}
        <div className="trace-summary">
          <b>Path explained</b>
          <span>{renderedIds.join(" → ")}</span>
        </div>
        <div className="trace-actions">
          <button className="button secondary" onClick={saveTrace}>
            Save trace
          </button>
          <button className="button secondary" onClick={() => p.go("Diagrams")}>
            Create diagram from trace
          </button>
          {savedTrace && <span role="status">{savedTrace}</span>}
        </div>
        <section className="coverage-panel" aria-labelledby="coverage-title">
          <div className="panel-title">
            <div>
              <p className="eyebrow">TRACE METRICS</p>
              <h3 id="coverage-title">Coverage by relationship</h3>
            </div>
            <span className="muted">Inspectable numerator / denominator</span>
          </div>
          {coverageMetrics(p.allArtifacts, p.relations).map((metric) => {
            const percent = metric.denominator
              ? Math.round((metric.numerator / metric.denominator) * 100)
              : 0;
            return (
              <div
                className="coverage-row"
                key={metric.id}
                title={`${metric.definition} Uncovered: ${metric.uncoveredIds.slice(0, 8).join(", ") || "none"}`}
              >
                <div>
                  <b>{metric.label}</b>
                  <small>
                    {metric.numerator} / {metric.denominator} · {percent}%
                  </small>
                </div>
                <div className="coverage-bar">
                  <i style={{ width: `${percent}%` }} />
                </div>
              </div>
            );
          })}
        </section>
        <section
          className="diagnostics-panel"
          aria-labelledby="diagnostics-title"
        >
          <div className="panel-title">
            <div>
              <p className="eyebrow">MODEL VALIDATION</p>
              <h3 id="diagnostics-title">Explainable model diagnostics</h3>
            </div>
            <span className="muted">Deterministic checks</span>
          </div>
          <div className="diagnostic-grid">
            <span>
              Orphan artifacts <b>{diagnostics.orphanArtifacts.length}</b>
            </span>
            <span>
              Duplicate links <b>{diagnostics.duplicateRelations.length}</b>
            </span>
            <span>
              Cycles <b>{diagnostics.cycles.length}</b>
            </span>
            <span>
              Conflicting requirements{" "}
              <b>{diagnostics.conflictingRequirements.length}</b>
            </span>
          </div>
          {(diagnostics.orphanArtifacts.length > 0 ||
            diagnostics.duplicateRelations.length > 0 ||
            diagnostics.cycles.length > 0 ||
            diagnostics.conflictingRequirements.length > 0) && (
            <p className="muted">
              {diagnostics.orphanArtifacts.slice(0, 8).join(", ")}
              {diagnostics.cycles[0]
                ? " · cycle " + diagnostics.cycles[0].join(" → ")
                : ""}
            </p>
          )}
          {!diagnostics.orphanArtifacts.length &&
            !diagnostics.duplicateRelations.length &&
            !diagnostics.cycles.length &&
            !diagnostics.conflictingRequirements.length && (
              <p className="muted">
                No orphan, duplicate, cycle, or conflicting-requirement findings
                in the current model.
              </p>
            )}
        </section>
      </section>
      <section className="panel path-detail">
        <p className="eyebrow">SELECTED ARTIFACT</p>
        <h2>{p.selected}</h2>
        <p>{selectedArtifact?.description}</p>
        {missingVerification && (
          <div className="callout warning-callout">
            <b>Verification gap</b>
            <p>
              This requirement has no verified-by relationship in the current
              model.
            </p>
          </div>
        )}
        <h3>Relationship evidence</h3>
        {p.relations
          .filter((r) => r.from === p.selected || r.to === p.selected)
          .map((r) => (
            <div className="relation" key={`${r.from}${r.to}`}>
              <span>{r.from === p.selected ? r.to : r.from}</span>
              <em>{r.kind}</em>
            </div>
          ))}
        <h3>Trace matrix</h3>
        <div
          className="trace-matrix"
          role="table"
          aria-label="Selected artifact trace matrix"
        >
          {traceIds.slice(0, 12).map((id) => (
            <div className="trace-matrix-row" role="row" key={id}>
              <b>{id}</b>
              <span>
                {p.allArtifacts.find((artifact) => artifact.id === id)?.type}
              </span>
              <em>
                {
                  visibleRelations.filter(
                    (relation) => relation.from === id || relation.to === id,
                  ).length
                }{" "}
                links
              </em>
            </div>
          ))}
        </div>
        <section
          className="matrix-editor"
          aria-labelledby="arbitrary-matrix-title"
        >
          <p className="eyebrow">ARBITRARY TRACEABILITY MATRIX</p>
          <h3 id="arbitrary-matrix-title">Compare any two artifact types</h3>
          <div className="link-controls">
            <label>
              Rows
              <select
                aria-label="Matrix row artifact type"
                value={matrixRowType}
                onChange={(event) =>
                  setMatrixRowType(event.target.value as ArtifactType)
                }
              >
                {matrixTypes.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </label>
            <label>
              Columns
              <select
                aria-label="Matrix column artifact type"
                value={matrixColumnType}
                onChange={(event) =>
                  setMatrixColumnType(event.target.value as ArtifactType)
                }
              >
                {matrixTypes.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="trace-matrix arbitrary-matrix" role="table">
            <div className="trace-matrix-row matrix-header" role="row">
              <b>{matrixRowType}</b>
              {p.allArtifacts
                .filter((artifact) => artifact.type === matrixColumnType)
                .slice(0, 8)
                .map((artifact) => (
                  <span key={artifact.id}>{artifact.id}</span>
                ))}
            </div>
            {p.allArtifacts
              .filter((artifact) => artifact.type === matrixRowType)
              .slice(0, 8)
              .map((row) => {
                const columns = p.allArtifacts
                  .filter((artifact) => artifact.type === matrixColumnType)
                  .slice(0, 8);
                return (
                  <div className="trace-matrix-row" role="row" key={row.id}>
                    <b>{row.id}</b>
                    {columns.map((column) => {
                      const relation = p.relations.find(
                        (item) =>
                          item.from === row.id &&
                          item.to === column.id &&
                          item.kind === matrixKind,
                      );
                      return relation ? (
                        <button
                          className="matrix-cell linked"
                          key={column.id}
                          aria-label={`${row.id} ${matrixKind} ${column.id}`}
                          onClick={() => p.setSelected(row.id)}
                        >
                          ✓
                        </button>
                      ) : (
                        <button
                          className="matrix-cell"
                          key={column.id}
                          aria-label={`Create ${matrixKind} from ${row.id} to ${column.id}`}
                          onClick={() =>
                            p.addRelation({
                              from: row.id,
                              to: column.id,
                              kind: matrixKind,
                            })
                          }
                        >
                          +
                        </button>
                      );
                    })}
                  </div>
                );
              })}
          </div>
          <small className="muted">
            Empty cells create a canonical relationship; populated cells select
            the row artifact for inspection.
          </small>
        </section>
        <div className="matrix-editor">
          <p className="eyebrow">MATRIX EDITOR</p>
          <h3>Add relationship from selected artifact</h3>
          <label>
            Target artifact
            <select
              aria-label="Matrix target artifact"
              value={matrixTarget}
              onChange={(event) => setMatrixTarget(event.target.value)}
            >
              {p.allArtifacts
                .filter((artifact) => artifact.id !== p.selected)
                .slice(0, 80)
                .map((artifact) => (
                  <option key={artifact.id} value={artifact.id}>
                    {artifact.id} · {artifact.name}
                  </option>
                ))}
            </select>
          </label>
          <label>
            Relationship kind
            <select
              aria-label="Matrix relationship kind"
              value={matrixKind}
              onChange={(event) => setMatrixKind(event.target.value)}
            >
              <option>depends-on</option>
              <option>refines</option>
              <option>decomposes</option>
              <option>allocated-to</option>
              <option>verified-by</option>
            </select>
          </label>
          <button
            className="button secondary"
            onClick={() =>
              p.addRelation({
                from: p.selected,
                to: matrixTarget,
                kind: matrixKind,
              })
            }
          >
            Add matrix relationship
          </button>
        </div>
      </section>
    </div>
  );
}
function DiagramStudio(p: PageProps) {
  const diagramElementTypes: ArtifactType[] = [
    "Requirement",
    "Need",
    "Stakeholder",
    "Actor",
    "UseCase",
    "Class",
    "Lifeline",
    "Message",
    "DeploymentNode",
    "Component",
    "Block",
    "Part",
    "Port",
    "Interface",
    "Activity",
    "Action",
    "State",
    "Package",
    "Test",
    "VerificationMethod",
    "Capability",
    "MissionThread",
    "ConstituentSystem",
  ];
  const storedPerspective = useMemo(() => {
    if (p.diagramPerspectives.length) return p.diagramPerspectives[0];
    try {
      return JSON.parse(
        localStorage.getItem("tg-diagram-perspective") || "null",
      ) as {
        title?: string;
        description?: string;
        notes?: string;
        profile?: string;
        customProfileName?: string;
        diagramType?: string;
        elementFilter?: string;
        selectedIds?: string[];
        positions?: Record<string, { x: number; y: number }>;
        layoutMode?: string;
        traversalDepth?: number;
      } | null;
    } catch {
      return null;
    }
  }, [p.diagramPerspectives]);
  const defaults = p.allArtifacts
    .filter((artifact) =>
      ["Requirement", "Block", "Interface", "Test"].includes(artifact.type),
    )
    .slice(0, 8)
    .map((artifact) => artifact.id);
  const [title, setTitle] = useState(
    storedPerspective?.title || "Emergency response requirement view",
  );
  const [description, setDescription] = useState(
    storedPerspective?.description ||
      "Canonical requirement, architecture, verification, and evidence perspective.",
  );
  const [notes, setNotes] = useState(storedPerspective?.notes || "");
  const [traversalDepth, setTraversalDepth] = useState(
    storedPerspective?.traversalDepth || 2,
  );
  const [profile, setProfile] = useState<ProfileId>(
    (profileIds.includes(storedPerspective?.profile as ProfileId)
      ? storedPerspective?.profile
      : "SysML") as ProfileId,
  );
  const [customProfileName, setCustomProfileName] = useState(
    storedPerspective?.customProfileName || "Custom TraceGraph profile",
  );
  const [diagramType, setDiagramType] = useState(
    storedPerspective?.diagramType || "Requirement trace",
  );
  const [elementFilter, setElementFilter] = useState(
    storedPerspective?.elementFilter || "All",
  );
  const [selectedIds, setSelectedIds] = useState<string[]>(
    storedPerspective?.selectedIds?.length
      ? storedPerspective.selectedIds.filter((id) =>
          p.allArtifacts.some((artifact) => artifact.id === id),
        )
      : defaults,
  );
  const [positions, setPositions] = useState<
    Record<string, { x: number; y: number }>
  >(() => {
    const fallback = Object.fromEntries(
      defaults.map((id, index) => [
        id,
        { x: 120 + (index % 4) * 210, y: 110 + Math.floor(index / 4) * 190 },
      ]),
    );
    try {
      const stored = JSON.parse(
        localStorage.getItem("tg-diagram-perspective") || "null",
      );
      return stored?.positions || storedPerspective?.positions || fallback;
    } catch {
      return fallback;
    }
  });
  const [layoutMode, setLayoutMode] = useState(
    storedPerspective?.layoutMode || "Grid",
  );
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [target, setTarget] = useState(defaults[1] || "");
  const [elementType, setElementType] = useState<ArtifactType>("Block");
  const [kind, setKind] = useState("depends-on");
  const [archivePreviewId, setArchivePreviewId] = useState<string | null>(null);
  const [mermaidSource, setMermaidSource] = useState(
    "flowchart LR\n  REQ_042 -->|depends-on| BLK_007",
  );
  const mermaidTemplates = [
    {
      label: "Canonical requirement trace",
      source: "flowchart LR\n  REQ_042 -->|depends-on| BLK_007",
    },
    {
      label: "Requirement to evidence",
      source:
        "flowchart LR\n  REQ_042 -->|verified-by| TST_042\n  TST_042 -->|produces| EVD_017",
    },
    { label: "Custom source", source: "" },
  ];
  const [mermaidTemplate, setMermaidTemplate] = useState(
    mermaidTemplates[0].label,
  );
  const [mermaidPreview, setMermaidPreview] = useState<ReturnType<
    typeof parseMermaidProposal
  > | null>(null);
  const [acceptedMermaidRelations, setAcceptedMermaidRelations] = useState<
    string[]
  >([]);
  const liveMermaidPreview = useMemo(
    () => parseMermaidProposal(mermaidSource, p.allArtifacts, p.relations),
    [mermaidSource, p.allArtifacts, p.relations],
  );
  const activeProfile = profileRegistry[profile];
  const profileDiagramTypes = [
    ...new Set([
      ...activeProfile.defaultViews,
      "Sequence",
      "Package",
      "Use case",
    ]),
  ];
  const profileElementTypes = diagramElementTypes.filter((type) =>
    activeProfile.artifactTypes.includes(type),
  );
  const liveMermaidSvg = useMemo(() => {
    const ids = new Set(liveMermaidPreview.knownNodes);
    return svgDocument(
      p.allArtifacts.filter((artifact) => ids.has(artifact.id)),
      liveMermaidPreview.recognizedRelations,
      { title: "Mermaid approximation", legend: true },
    );
  }, [liveMermaidPreview, p.allArtifacts]);
  const nodes = p.allArtifacts.filter(
    (artifact) =>
      selectedIds.includes(artifact.id) &&
      (elementFilter === "All" || artifact.type === elementFilter),
  );
  const visibleNodeIds = new Set(nodes.map((node) => node.id));
  const links = p.relations.filter(
    (relation) =>
      visibleNodeIds.has(relation.from) && visibleNodeIds.has(relation.to),
  );
  const selectedMermaidSource = mermaid(nodes, links);
  const diagramSvg = svgDocument(nodes, links, {
    title,
    legend: true,
  });
  useEffect(() => {
    if (
      p.selected &&
      p.selected.startsWith("BLK-DIA-") &&
      !selectedIds.includes(p.selected)
    ) {
      setSelectedIds((ids) => [...ids, p.selected]);
    }
    if (p.selected && p.selected.startsWith("BLK-DIA-")) {
      setPositions((current) =>
        current[p.selected]
          ? current
          : { ...current, [p.selected]: { x: 120, y: 300 } },
      );
    }
  }, [p.selected, selectedIds]);
  const toggle = (id: string) =>
    setSelectedIds((ids) =>
      ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id],
    );
  const applyLayout = (nextMode = layoutMode) => {
    const ids = selectedIds.filter((id) =>
      p.allArtifacts.some((artifact) => artifact.id === id),
    );
    const nextPositions: Record<string, { x: number; y: number }> = {};
    if (nextMode === "Force simulation") {
      ids.forEach((id, index) => {
        const angle = (index / Math.max(ids.length, 1)) * Math.PI * 2;
        nextPositions[id] = {
          x: 450 + Math.cos(angle) * 330,
          y: 260 + Math.sin(angle) * 180,
        };
      });
    } else if (nextMode === "Hierarchy") {
      const depths = new Map<string, number>();
      const incoming = new Map<string, string[]>();
      ids.forEach((id) => incoming.set(id, []));
      p.relations.forEach((relation) => {
        if (incoming.has(relation.to) && incoming.has(relation.from))
          incoming.get(relation.to)?.push(relation.from);
      });
      const depthOf = (id: string, visiting = new Set<string>()): number => {
        if (depths.has(id)) return depths.get(id)!;
        if (visiting.has(id)) return 0;
        const nextVisiting = new Set(visiting).add(id);
        const depth = Math.min(
          3,
          Math.max(
            0,
            ...(incoming.get(id) || []).map(
              (parent) => depthOf(parent, nextVisiting) + 1,
            ),
          ),
        );
        depths.set(id, depth);
        return depth;
      };
      ids.forEach((id) => depthOf(id));
      const levels = new Map<number, string[]>();
      ids.forEach((id) => {
        const level = levels.get(depths.get(id) || 0) || [];
        level.push(id);
        levels.set(depths.get(id) || 0, level);
      });
      levels.forEach((level, depth) =>
        level.forEach((id, index) => {
          nextPositions[id] = {
            x: 120 + (index % 4) * 220,
            y: 100 + depth * 130 + Math.floor(index / 4) * 80,
          };
        }),
      );
    } else {
      const traceOrder = [
        "NEED-014",
        "REQ-042",
        "BLK-011",
        "IF-003",
        "TST-042",
        "EVD-017",
      ];
      const order =
        nextMode === "Trace path"
          ? [
              ...traceOrder.filter((id) => ids.includes(id)),
              ...ids.filter((id) => !traceOrder.includes(id)),
            ]
          : ids;
      order.forEach((id, index) => {
        nextPositions[id] = {
          x: 120 + (index % 4) * 210,
          y: 110 + Math.floor(index / 4) * 190,
        };
      });
    }
    setPositions(nextPositions);
    setLayoutMode(nextMode);
    setSaved(false);
  };
  const generatePath = () => {
    const path = [
      "NEED-014",
      "REQ-042",
      "BLK-011",
      "IF-003",
      "TST-042",
      "EVD-017",
    ];
    setSelectedIds(
      path.filter((id) =>
        p.allArtifacts.some((artifact) => artifact.id === id),
      ),
    );
  };
  const savePerspective = () => {
    const perspective: DiagramPerspective = {
      id: "DIAGRAM-PERSPECTIVE-PRIMARY",
      title,
      description,
      notes,
      profile,
      customProfileName,
      diagramType,
      elementFilter,
      layoutMode,
      selectedIds,
      positions,
      relationshipKinds: links.map((link) => link.kind),
      traversalDepth,
      exportSettings: { title, legend: "true" },
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem("tg-diagram-perspective", JSON.stringify(perspective));
    p.saveDiagramPerspective(perspective);
    setSaved(true);
  };
  return (
    <div className="diagram-studio">
      <section className="panel diagram-toolbar">
        <div className="panel-title">
          <div>
            <p className="eyebrow">DIAGRAM STUDIO · CANONICAL VIEW</p>
            <h2>{title}</h2>
          </div>
          <span className="status-pill">
            {saved ? "Saved perspective" : "Working view"}
          </span>
        </div>
        <div className="diagram-controls">
          <label>
            View title
            <input
              aria-label="Diagram title"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                setSaved(false);
              }}
            />
          </label>
          <label>
            View description
            <textarea
              aria-label="Diagram description"
              value={description}
              onChange={(event) => {
                setDescription(event.target.value);
                setSaved(false);
              }}
            />
          </label>
          <label>
            View notes
            <textarea
              aria-label="Diagram notes"
              value={notes}
              onChange={(event) => {
                setNotes(event.target.value);
                setSaved(false);
              }}
            />
          </label>
          <label>
            Profile
            <select
              aria-label="Diagram profile"
              value={profile}
              onChange={(event) => setProfile(event.target.value as ProfileId)}
            >
              {profileIds.map((profileId) => (
                <option key={profileId} value={profileId}>
                  {profileRegistry[profileId].label}
                </option>
              ))}
            </select>
          </label>
          {profile === "Custom" && (
            <label>
              Custom profile name
              <input
                aria-label="Custom profile name"
                value={customProfileName}
                onChange={(event) => {
                  setCustomProfileName(event.target.value);
                  setSaved(false);
                }}
              />
            </label>
          )}
          <label>
            Diagram type
            <select
              aria-label="Diagram type"
              value={diagramType}
              onChange={(event) => setDiagramType(event.target.value)}
            >
              {profileDiagramTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>
          <label>
            Layout
            <select
              aria-label="Diagram layout"
              value={layoutMode}
              onChange={(event) => applyLayout(event.target.value)}
            >
              <option>Grid</option>
              <option>Hierarchy</option>
              <option>Force simulation</option>
              <option>Trace path</option>
            </select>
          </label>
          <label>
            Element filter
            <select
              aria-label="Diagram element filter"
              value={elementFilter}
              onChange={(event) => {
                setElementFilter(event.target.value);
                setSaved(false);
              }}
            >
              <option>All</option>
              {profileElementTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>
          <button className="button secondary" onClick={generatePath}>
            Generate from trace
          </button>
          <button className="button secondary" onClick={savePerspective}>
            Save perspective
          </button>
          <button
            className="button secondary"
            onClick={() =>
              download(
                "tracegraph-perspective.svg",
                diagramSvg,
                "image/svg+xml",
              )
            }
          >
            Export selected SVG
          </button>
          <button
            className="button secondary"
            onClick={() =>
              downloadPng(
                diagramSvg,
                "tracegraph-perspective.png",
                2,
                "#080d21",
                (ms) => p.recordPerformance("Diagram PNG export", ms),
              )
            }
          >
            Export selected PNG
          </button>
        </div>
      </section>
      <div className="diagram-grid">
        <section className="panel diagram-canvas">
          <div className="panel-title">
            <h3>{diagramType} diagram</h3>
            <span className="muted">
              {profile === "Custom" ? customProfileName : profile} ·{" "}
              {nodes.length} canonical elements · {links.length} visible links
            </span>
          </div>
          <p className="profile-guidance" role="status">
            {activeProfile.description} {activeProfile.guidance}
          </p>
          <svg
            className={`diagram-svg diagram-${diagramType.toLowerCase().replaceAll(" ", "-")}`}
            viewBox="0 0 900 500"
            role="img"
            aria-label={`${title} ${diagramType} diagram`}
            onPointerMove={(event) => {
              if (!draggingId) return;
              const bounds = event.currentTarget.getBoundingClientRect();
              const x = ((event.clientX - bounds.left) / bounds.width) * 900;
              const y = ((event.clientY - bounds.top) / bounds.height) * 500;
              setPositions((current) => ({
                ...current,
                [draggingId]: {
                  x: Math.max(80, Math.min(820, x)),
                  y: Math.max(60, Math.min(440, y)),
                },
              }));
              setSaved(false);
            }}
            onPointerUp={() => setDraggingId(null)}
            onPointerLeave={() => setDraggingId(null)}
          >
            <defs>
              <marker
                id="diagram-arrow"
                markerWidth="8"
                markerHeight="8"
                refX="7"
                refY="4"
                orient="auto"
              >
                <path d="M0,0 L8,4 L0,8 Z" fill="#4c9ddd" />
              </marker>
            </defs>
            {diagramType === "Sequence" &&
              nodes.map((node, index) => {
                const x = positions[node.id]?.x ?? 120 + (index % 4) * 210;
                return (
                  <line
                    key={`lifeline-${node.id}`}
                    x1={x}
                    y1="145"
                    x2={x}
                    y2="455"
                    stroke="#41527d"
                    strokeDasharray="6 6"
                  />
                );
              })}
            {links.map((link, index) => {
              const from = nodes.findIndex((node) => node.id === link.from);
              const to = nodes.findIndex((node) => node.id === link.to);
              if (from < 0 || to < 0) return null;
              const fromX = 120 + (from % 4) * 210;
              const fromY = 110 + Math.floor(from / 4) * 190;
              const toX = 120 + (to % 4) * 210;
              const toY = 110 + Math.floor(to / 4) * 190;
              return (
                <g key={`${link.from}-${link.to}-${index}`}>
                  <title>
                    {relationId(link, index)} · {link.from} {link.kind}{" "}
                    {link.to}
                  </title>
                  <line
                    x1={positions[link.from]?.x ?? fromX}
                    y1={positions[link.from]?.y ?? fromY}
                    x2={positions[link.to]?.x ?? toX}
                    y2={positions[link.to]?.y ?? toY}
                    stroke="#4c9ddd"
                    strokeWidth="2"
                    markerEnd="url(#diagram-arrow)"
                  />
                  <text
                    x={
                      ((positions[link.from]?.x ?? fromX) +
                        (positions[link.to]?.x ?? toX)) /
                      2
                    }
                    y={
                      ((positions[link.from]?.y ?? fromY) +
                        (positions[link.to]?.y ?? toY)) /
                        2 -
                      5
                    }
                    className="svg-kind"
                  >
                    {link.kind}
                  </text>
                </g>
              );
            })}
            {nodes.map((node, index) => {
              const fallbackX = 120 + (index % 4) * 210;
              const fallbackY = 110 + Math.floor(index / 4) * 190;
              const x = positions[node.id]?.x ?? fallbackX;
              const y = positions[node.id]?.y ?? fallbackY;
              return (
                <g
                  key={node.id}
                  className={`diagram-node ${p.selected === node.id ? "selected" : ""}`}
                  role="button"
                  tabIndex={0}
                  aria-label={`Toggle ${node.id}`}
                  onClick={() => {
                    toggle(node.id);
                    p.setSelected(node.id);
                  }}
                  onPointerDown={(event) => {
                    event.currentTarget.setPointerCapture(event.pointerId);
                    setDraggingId(node.id);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      toggle(node.id);
                      p.setSelected(node.id);
                    } else if (event.key.startsWith("Arrow")) {
                      event.preventDefault();
                      const delta = 20;
                      setPositions((current) => {
                        const position = current[node.id] || { x, y };
                        return {
                          ...current,
                          [node.id]: {
                            x:
                              position.x +
                              (event.key === "ArrowLeft"
                                ? -delta
                                : event.key === "ArrowRight"
                                  ? delta
                                  : 0),
                            y:
                              position.y +
                              (event.key === "ArrowUp"
                                ? -delta
                                : event.key === "ArrowDown"
                                  ? delta
                                  : 0),
                          },
                        };
                      });
                      setSaved(false);
                    }
                  }}
                >
                  {diagramType === "Use case" ? (
                    <ellipse cx={x} cy={y} rx="75" ry="35" />
                  ) : (
                    <rect
                      x={x - 75}
                      y={y - 35}
                      width="150"
                      height="70"
                      rx={
                        diagramType === "Activity"
                          ? 24
                          : diagramType === "State machine"
                            ? 16
                            : 7
                      }
                    />
                  )}
                  <text x={x} y={y - 5} textAnchor="middle">
                    {node.id}
                  </text>
                  <text
                    x={x}
                    y={y + 14}
                    textAnchor="middle"
                    className="svg-type"
                  >
                    {node.type}
                  </text>
                  <text
                    x={x}
                    y={y + 27}
                    textAnchor="middle"
                    className="svg-type"
                  >
                    {node.name}
                  </text>
                </g>
              );
            })}
          </svg>
          <p className="muted">
            Selecting or removing an element changes this perspective only;
            canonical artifacts remain safe in the model.
          </p>
          <section
            className="diagram-alternative"
            aria-labelledby="diagram-alternative-title"
          >
            <p className="eyebrow">TEXTUAL ALTERNATIVE</p>
            <h3 id="diagram-alternative-title">Canonical view contents</h3>
            <p className="muted">
              This accessible alternative preserves the same artifact and
              relationship identities as the visual view. The notation is a
              simplified profile projection, not a claim of formal standards
              conformance.
            </p>
            <ul>
              {nodes.map((node) => (
                <li key={node.id}>
                  <code>{node.id}</code> · {node.type} · {node.name}
                </li>
              ))}
              {links.map((link, index) => (
                <li key={link.id || `${link.from}-${link.to}-${index}`}>
                  <code>{relationId(link, index)}</code> · {link.from}{" "}
                  <strong>{link.kind}</strong> {link.to}
                </li>
              ))}
            </ul>
            {!nodes.length && (
              <p className="muted">No elements match this filter.</p>
            )}
          </section>
        </section>
        <section className="panel diagram-inspector">
          <p className="eyebrow">VIEW CONTENTS</p>
          <h3>Add existing model elements</h3>
          <div className="diagram-elements">
            {p.allArtifacts
              .filter((artifact) => diagramElementTypes.includes(artifact.type))
              .slice(0, 20)
              .map((artifact) => (
                <button
                  className={
                    selectedIds.includes(artifact.id)
                      ? "diagram-element selected"
                      : "diagram-element"
                  }
                  key={artifact.id}
                  onClick={() => toggle(artifact.id)}
                >
                  <b>{artifact.id}</b>
                  <small>{artifact.name}</small>
                </button>
              ))}
          </div>
          <label>
            New element type
            <select
              aria-label="New diagram element type"
              value={elementType}
              onChange={(event) =>
                setElementType(event.target.value as ArtifactType)
              }
            >
              {profileElementTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <button
            className="button secondary"
            onClick={() => p.createDiagramElement(elementType)}
          >
            Create new model element
          </button>
          <button
            className="button secondary"
            disabled={!selectedIds.includes(p.selected)}
            onClick={() =>
              setSelectedIds((ids) => ids.filter((id) => id !== p.selected))
            }
          >
            Remove selected from this view
          </button>
          <button
            className="button secondary"
            disabled={
              !p.allArtifacts.some((artifact) => artifact.id === p.selected)
            }
            onClick={() => setArchivePreviewId(p.selected)}
          >
            Preview archive from model
          </button>
          {archivePreviewId && (
            <div
              className="callout"
              role="dialog"
              aria-label="Archive impact preview"
            >
              <b>Archive model artifact?</b>
              <p>
                {
                  p.relations.filter(
                    (relation) =>
                      relation.from === archivePreviewId ||
                      relation.to === archivePreviewId,
                  ).length
                }{" "}
                relationship paths reference {archivePreviewId}. The artifact
                will be soft-archived and remain recoverable.
              </p>
              <button
                className="button secondary"
                onClick={() => {
                  p.archiveArtifact(archivePreviewId);
                  setArchivePreviewId(null);
                }}
              >
                Archive model artifact
              </button>
              <button
                className="text-button"
                onClick={() => setArchivePreviewId(null)}
              >
                Cancel
              </button>
            </div>
          )}
          <h3>Mermaid proposal</h3>
          <label>
            Diagram template
            <select
              aria-label="Mermaid diagram template"
              value={mermaidTemplate}
              onChange={(event) => {
                const next = mermaidTemplates.find(
                  (template) => template.label === event.target.value,
                );
                setMermaidTemplate(event.target.value);
                if (next?.source) {
                  setMermaidSource(next.source);
                  setMermaidPreview(null);
                  setAcceptedMermaidRelations([]);
                }
              }}
            >
              {mermaidTemplates.map((template) => (
                <option key={template.label}>{template.label}</option>
              ))}
            </select>
          </label>
          <label>
            Supported Mermaid subset
            <textarea
              aria-label="Mermaid proposal source"
              value={mermaidSource}
              onChange={(event) => {
                setMermaidSource(event.target.value);
                setMermaidPreview(null);
              }}
            />
          </label>
          <label>
            Traversal depth
            <select
              aria-label="Diagram traversal depth"
              value={traversalDepth}
              onChange={(event) => {
                setTraversalDepth(Number(event.target.value));
                setSaved(false);
              }}
            >
              <option value={1}>1 hop</option>
              <option value={2}>2 hops</option>
              <option value={3}>3 hops</option>
              <option value={4}>4 hops</option>
            </select>
          </label>
          <div className="mermaid-live-preview" aria-live="polite">
            <div className="panel-title">
              <b>Live validation</b>
              <span className="status-pill">
                {liveMermaidPreview.proposedRelations.length} new links
              </span>
            </div>
            <div className="export-actions mermaid-export-actions">
              <button
                className="button small secondary"
                onClick={() => {
                  setMermaidSource(selectedMermaidSource);
                  setMermaidTemplate("Custom source");
                  setMermaidPreview(null);
                }}
              >
                Generate from selected model
              </button>
              <button
                className="button small secondary"
                onClick={() =>
                  download("tracegraph-selected.mmd", selectedMermaidSource)
                }
              >
                Download selected .mmd
              </button>
              <button
                className="button small secondary"
                onClick={() =>
                  download(
                    "tracegraph-mermaid.md",
                    mermaidMarkdown(
                      mermaidSource,
                      "TraceGraph Mermaid approximation",
                    ),
                    "text/markdown",
                  )
                }
              >
                Download Mermaid Markdown
              </button>
              <button
                className="button small secondary"
                onClick={() =>
                  download(
                    "tracegraph-mermaid.svg",
                    liveMermaidSvg,
                    "image/svg+xml",
                  )
                }
              >
                Download Mermaid SVG
              </button>
              <button
                className="button small secondary"
                disabled={!liveMermaidPreview.recognizedRelations.length}
                onClick={() =>
                  downloadPng(
                    liveMermaidSvg,
                    "tracegraph-mermaid.png",
                    2,
                    "#080d21",
                    (ms) => p.recordPerformance("Mermaid PNG export", ms),
                  )
                }
              >
                Download Mermaid PNG
              </button>
            </div>
            <small>
              {liveMermaidPreview.knownNodes.length} known nodes ·{" "}
              {liveMermaidPreview.diagnostics.length} diagnostics
            </small>
            <pre>{mermaidSource}</pre>
            {liveMermaidPreview.recognizedRelations.length > 0 && (
              <div
                className="mermaid-rendered-preview"
                role="img"
                aria-label="Rendered Mermaid approximation"
                dangerouslySetInnerHTML={{ __html: liveMermaidSvg }}
              />
            )}
          </div>
          <button
            className="button secondary"
            onClick={() =>
              (() => {
                setMermaidPreview(
                  parseMermaidProposal(
                    mermaidSource,
                    p.allArtifacts,
                    p.relations,
                  ),
                );
                setAcceptedMermaidRelations([]);
              })()
            }
          >
            Preview Mermaid import
          </button>
          {mermaidPreview && (
            <div className="mermaid-preview" role="status">
              <b>
                {mermaidPreview.proposedRelations.length} proposed relationship
                {mermaidPreview.proposedRelations.length === 1 ? "" : "s"}
              </b>
              <small>
                {mermaidPreview.knownNodes.length} known nodes ·{" "}
                {mermaidPreview.diagnostics.length} diagnostics
              </small>
              {mermaidPreview.proposedRelations.map((relation, index) => {
                const proposalKey = `${relation.from}|${relation.kind}|${relation.to}`;
                const accepted = acceptedMermaidRelations.includes(proposalKey);
                return (
                  <label className="proposal-row" key={proposalKey}>
                    <input
                      type="checkbox"
                      checked={accepted}
                      onChange={() =>
                        setAcceptedMermaidRelations((current) =>
                          accepted
                            ? current.filter((key) => key !== proposalKey)
                            : [...current, proposalKey],
                        )
                      }
                    />
                    <span>
                      <code>{relationId(relation, index)}</code> ·{" "}
                      {relation.from} <strong>{relation.kind}</strong>{" "}
                      {relation.to}
                    </span>
                  </label>
                );
              })}
              {mermaidPreview.unsupportedLines.length > 0 && (
                <>
                  <small>Unsupported syntax is held outside the model.</small>
                  <ul className="mermaid-diagnostics">
                    {mermaidPreview.diagnostics.map((diagnostic) => (
                      <li key={`${diagnostic.line}-${diagnostic.column}`}>
                        Line {diagnostic.line}, column {diagnostic.column}:{" "}
                        {diagnostic.message}
                      </li>
                    ))}
                  </ul>
                </>
              )}
              <button
                className="text-button"
                disabled={!acceptedMermaidRelations.length}
                onClick={() => {
                  p.applyMermaidRelations(
                    mermaidPreview.proposedRelations.filter((relation) =>
                      acceptedMermaidRelations.includes(
                        `${relation.from}|${relation.kind}|${relation.to}`,
                      ),
                    ),
                  );
                  setMermaidPreview(null);
                  setAcceptedMermaidRelations([]);
                }}
              >
                Apply accepted relationships
              </button>
            </div>
          )}
          <h3>Add relationship</h3>
          <label>
            Target
            <select
              aria-label="Diagram relationship target"
              value={target}
              onChange={(event) => setTarget(event.target.value)}
            >
              {p.allArtifacts
                .filter((artifact) => artifact.id !== p.selected)
                .slice(0, 40)
                .map((artifact) => (
                  <option key={artifact.id} value={artifact.id}>
                    {artifact.id} · {artifact.name}
                  </option>
                ))}
            </select>
          </label>
          <label>
            Relationship kind
            <select
              aria-label="Diagram relationship kind"
              value={kind}
              onChange={(event) => setKind(event.target.value)}
            >
              {canonicalRelationshipKinds.map((relationshipKind) => (
                <option key={relationshipKind}>{relationshipKind}</option>
              ))}
            </select>
          </label>
          <button
            className="button primary"
            onClick={() => {
              if (p.selected && target)
                p.addRelation({ from: p.selected, to: target, kind });
            }}
          >
            Add relationship to model
          </button>
        </section>
      </div>
    </div>
  );
}
function Architecture(p: PageProps) {
  const [profile, setProfile] = useState<"SysML" | "UML" | "SoSE">("SysML");
  const [sysmlView, setSysmlView] = useState("Internal block");
  const [umlView, setUmlView] = useState("Use case");
  const [sosView, setSosView] = useState("Mission thread");
  const blocks = p.allArtifacts.filter(
    (a) => a.type === "Block" || a.type === "Interface",
  );
  const visibleBlocks = [...blocks].sort((left, right) => {
    if (left.id === p.selected) return -1;
    if (right.id === p.selected) return 1;
    return 0;
  });
  const requirements = p.allArtifacts.filter((a) => a.type === "Requirement");
  const systemBlocks = p.allArtifacts.filter((a) => a.type === "Block");
  const stakeholders = p.allArtifacts.filter((a) => a.type === "Stakeholder");
  const capabilities = p.allArtifacts.filter((a) => a.type === "Capability");
  const missions = p.allArtifacts.filter((a) => a.type === "Mission");
  const constituentSystems = p.allArtifacts.filter(
    (a) => a.type === "ConstituentSystem",
  );
  const interfaces = p.allArtifacts.filter((a) => a.type === "Interface");
  const [selectedConstituentId, setSelectedConstituentId] = useState(
    constituentSystems[0]?.id || "",
  );
  const selectedConstituent = constituentSystems.find(
    (system) => system.id === selectedConstituentId,
  );
  const [requirementId, setRequirementId] = useState(
    requirements.find((a) => a.id === "REQ-042")?.id ||
      requirements[0]?.id ||
      "",
  );
  const [blockId, setBlockId] = useState(
    systemBlocks.find((a) => a.id === "BLK-007")?.id ||
      systemBlocks[0]?.id ||
      "",
  );
  const [actorId, setActorId] = useState(stakeholders[0]?.id || "");
  const [useCaseId, setUseCaseId] = useState(capabilities[0]?.id || "");
  const updateConstituentMetadata = (key: string, value: string) => {
    if (!selectedConstituent) return;
    p.updateArtifact(selectedConstituent.id, {
      metadata: { ...(selectedConstituent.metadata || {}), [key]: value },
    });
  };
  const cascadingSystemIds = new Set<string>();
  if (selectedConstituentId) {
    const queue = [selectedConstituentId];
    while (queue.length) {
      const currentId = queue.shift()!;
      if (cascadingSystemIds.has(currentId)) continue;
      cascadingSystemIds.add(currentId);
      p.relations
        .filter(
          (relation) =>
            relation.from === currentId && relation.kind === "depends-on",
        )
        .forEach((relation) => queue.push(relation.to));
    }
  }
  const cascadingBlockIds = new Set(
    [...cascadingSystemIds].flatMap((systemId) =>
      p.relations
        .filter(
          (relation) =>
            relation.from === systemId && relation.kind === "represents",
        )
        .map((relation) => relation.to),
    ),
  );
  const cascadingCapabilityIds = capabilities
    .filter((capability) =>
      p.relations.some(
        (relation) =>
          relation.from === capability.id &&
          relation.kind === "allocated-to" &&
          cascadingBlockIds.has(relation.to),
      ),
    )
    .map((capability) => capability.id);
  const cascadingMissionIds = missions
    .filter((mission) =>
      p.relations.some(
        (relation) =>
          relation.from === mission.id &&
          relation.kind === "requires" &&
          cascadingCapabilityIds.includes(relation.to),
      ),
    )
    .map((mission) => mission.id);
  return (
    <div className="architecture-grid">
      <section className="panel arch-canvas">
        <div className="panel-title">
          <div>
            <p className="eyebrow">{profile.toUpperCase()} · CANONICAL VIEW</p>
            <h2>
              {profile === "SysML"
                ? "Mission telemetry architecture"
                : profile === "UML"
                  ? "Response mission behavior"
                  : "Constituent system mission thread"}
            </h2>
          </div>
          <span className="status-pill">Canonical view</span>
        </div>
        <div className={`sysml profile-view-${profile.toLowerCase()}`}>
          {profile === "SysML" && (
            <div className="sos-view-stack">
              <label>
                SysML view
                <select
                  aria-label="SysML view"
                  value={sysmlView}
                  onChange={(event) => setSysmlView(event.target.value)}
                >
                  <option>Requirements</option>
                  <option>Block definition</option>
                  <option>Internal block</option>
                  <option>Activity</option>
                  <option>Sequence</option>
                  <option>State machine</option>
                  <option>Allocation</option>
                  <option>Context</option>
                </select>
              </label>
              {sysmlView === "Internal block" && (
                <div className="sysml-box root">
                  <b>Emergency Response Drone System</b>
                  <small>«system» system of interest</small>
                  <div className="sysml-children">
                    {visibleBlocks.slice(0, 8).map((b) => (
                      <div className="sysml-box child" key={b.id}>
                        <b>{b.name}</b>
                        <small>
                          {b.id} · «{b.type.toLowerCase()}»
                        </small>
                      </div>
                    ))}
                  </div>
                  <div className="sysml-note">
                    + {Math.max(0, visibleBlocks.length - 8)} more canonical
                    elements
                  </div>
                  <div className="sysml-behavior-grid">
                    <article>
                      <b>Activity flow</b>
                      <small>
                        {capabilities
                          .slice(0, 3)
                          .map((capability) => capability.name)
                          .join(" → ") || "No capability steps yet"}
                      </small>
                    </article>
                    <article>
                      <b>Sequence participants</b>
                      <small>
                        {systemBlocks
                          .slice(0, 3)
                          .map((block) => block.id)
                          .join(" · ") || "No participants yet"}
                      </small>
                    </article>
                    <article>
                      <b>State model</b>
                      <small>
                        {
                          new Set(systemBlocks.map((block) => block.status))
                            .size
                        }{" "}
                        canonical block states from status fields
                      </small>
                    </article>
                  </div>
                </div>
              )}
              {sysmlView === "Requirements" && (
                <div className="profile-diagram sos-analysis-view">
                  <h3>SysML requirements view</h3>
                  <table className="sos-analysis-table">
                    <thead>
                      <tr>
                        <th>Requirement</th>
                        <th>Quality</th>
                        <th>Verification links</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requirements.slice(0, 16).map((requirement) => (
                        <tr key={requirement.id}>
                          <td>
                            <b>{requirement.id}</b> · {requirement.name}
                          </td>
                          <td>{requirement.quality || "Unassessed"}</td>
                          <td>
                            {
                              p.relations.filter(
                                (relation) =>
                                  relation.from === requirement.id &&
                                  relation.kind === "verified-by",
                              ).length
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {sysmlView === "Block definition" && (
                <div className="profile-diagram sos-analysis-view">
                  <h3>SysML block definition</h3>
                  <div className="sos-analysis-grid">
                    {systemBlocks.slice(0, 12).map((block) => (
                      <article className="sos-analysis-card" key={block.id}>
                        <b>{block.id} · «block»</b>
                        <strong>{block.name}</strong>
                        <small>
                          {
                            p.relations.filter(
                              (relation) =>
                                relation.from === block.id ||
                                relation.to === block.id,
                            ).length
                          }{" "}
                          canonical relationships
                        </small>
                      </article>
                    ))}
                  </div>
                </div>
              )}
              {sysmlView === "Activity" && (
                <div className="profile-diagram sos-analysis-view">
                  <h3>SysML activity flow</h3>
                  <ol className="sos-analysis-list">
                    {capabilities.slice(0, 12).map((capability, index) => (
                      <li key={capability.id}>
                        <code>
                          {index + 1}. {capability.id}
                        </code>{" "}
                        · {capability.name} · allocated to{" "}
                        {p.relations.find(
                          (relation) =>
                            relation.from === capability.id &&
                            relation.kind === "allocated-to",
                        )?.to || "unallocated"}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              {sysmlView === "Sequence" && (
                <div className="profile-diagram sos-analysis-view">
                  <h3>SysML sequence participants</h3>
                  <div className="sos-analysis-grid">
                    {systemBlocks.slice(0, 8).map((block) => (
                      <article className="sos-analysis-card" key={block.id}>
                        <b>{block.id}</b>
                        <strong>{block.name}</strong>
                        <small>
                          {
                            p.relations.filter(
                              (relation) =>
                                relation.from === block.id ||
                                relation.to === block.id,
                            ).length
                          }{" "}
                          message/trace links
                        </small>
                      </article>
                    ))}
                  </div>
                </div>
              )}
              {sysmlView === "State machine" && (
                <div className="profile-diagram sos-analysis-view">
                  <h3>SysML state machine</h3>
                  <div className="sos-analysis-grid">
                    {[
                      ...new Set(systemBlocks.map((block) => block.status)),
                    ].map((status) => (
                      <article className="sos-analysis-card" key={status}>
                        <b>STATE</b>
                        <strong>{status}</strong>
                        <small>
                          {
                            systemBlocks.filter(
                              (block) => block.status === status,
                            ).length
                          }{" "}
                          blocks
                        </small>
                      </article>
                    ))}
                  </div>
                </div>
              )}
              {sysmlView === "Allocation" && (
                <div className="profile-diagram sos-analysis-view">
                  <h3>SysML allocation matrix</h3>
                  <table className="sos-analysis-table">
                    <thead>
                      <tr>
                        <th>Source</th>
                        <th>Allocation</th>
                        <th>Target</th>
                      </tr>
                    </thead>
                    <tbody>
                      {p.relations
                        .filter((relation) => relation.kind === "allocated-to")
                        .slice(0, 24)
                        .map((relation, index) => (
                          <tr
                            key={
                              relation.id ||
                              `${relation.from}-${relation.to}-${index}`
                            }
                          >
                            <td>{relation.from}</td>
                            <td>{relationId(relation, index)}</td>
                            <td>{relation.to}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
              {sysmlView === "Context" && (
                <div className="profile-diagram sos-analysis-view">
                  <div className="sos-root">
                    {missions[0]?.id} · {missions[0]?.name}
                    <small>«context» mission boundary</small>
                  </div>
                  <div className="sos-analysis-grid">
                    {stakeholders.slice(0, 6).map((stakeholder) => (
                      <article
                        className="sos-analysis-card"
                        key={stakeholder.id}
                      >
                        <b>{stakeholder.id} · «actor»</b>
                        <strong>{stakeholder.name}</strong>
                        <small>
                          expresses{" "}
                          {
                            p.relations.filter(
                              (relation) =>
                                relation.from === stakeholder.id &&
                                relation.kind === "expresses",
                            ).length
                          }{" "}
                          needs
                        </small>
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {profile === "UML" && (
            <div className="sos-view-stack">
              <label>
                UML view
                <select
                  aria-label="UML view"
                  value={umlView}
                  onChange={(event) => setUmlView(event.target.value)}
                >
                  <option>Use case</option>
                  <option>Class</option>
                  <option>Component</option>
                  <option>Deployment</option>
                  <option>Sequence</option>
                  <option>State machine</option>
                </select>
              </label>
              {umlView === "Use case" && (
                <div className="profile-diagram">
                  <div className="uml-actor">
                    {stakeholders[0]?.id} · {stakeholders[0]?.name}
                    <small>«actor» canonical stakeholder</small>
                  </div>
                  <div className="uml-usecases">
                    {capabilities.slice(0, 4).map((capability) => (
                      <div className="uml-usecase" key={capability.id}>
                        <b>{capability.name}</b>
                        <small>{capability.id} · «use case»</small>
                      </div>
                    ))}
                  </div>
                  <div className="sysml-note">
                    {capabilities.length} capability use cases ·{" "}
                    {
                      p.relations.filter((relation) =>
                        capabilities.some(
                          (artifact) => artifact.id === relation.from,
                        ),
                      ).length
                    }{" "}
                    canonical relationships
                  </div>
                </div>
              )}
              {umlView === "Class" && (
                <div className="profile-diagram sos-analysis-view">
                  <h3>Canonical class view</h3>
                  <div className="sos-analysis-grid">
                    {[
                      ...requirements.slice(0, 4),
                      ...capabilities.slice(0, 4),
                    ].map((artifact) => (
                      <article className="sos-analysis-card" key={artifact.id}>
                        <b>{artifact.id}</b>
                        <strong>{artifact.name}</strong>
                        <small>
                          {artifact.type} · {artifact.status}
                        </small>
                      </article>
                    ))}
                  </div>
                </div>
              )}
              {umlView === "Component" && (
                <div className="profile-diagram sos-analysis-view">
                  <h3>Canonical component view</h3>
                  <div className="sos-analysis-grid">
                    {systemBlocks.slice(0, 8).map((block) => (
                      <article className="sos-analysis-card" key={block.id}>
                        <b>{block.id}</b>
                        <strong>{block.name}</strong>
                        <small>
                          {
                            interfaces.filter((interf) =>
                              p.relations.some(
                                (relation) =>
                                  relation.from === block.id &&
                                  relation.to === interf.id,
                              ),
                            ).length
                          }{" "}
                          connected interfaces
                        </small>
                      </article>
                    ))}
                  </div>
                </div>
              )}
              {umlView === "Deployment" && (
                <div className="profile-diagram sos-analysis-view">
                  <h3>Canonical deployment view</h3>
                  <table className="sos-analysis-table">
                    <thead>
                      <tr>
                        <th>Deployment node</th>
                        <th>Represented block</th>
                      </tr>
                    </thead>
                    <tbody>
                      {constituentSystems.map((system) => (
                        <tr key={system.id}>
                          <td>
                            <b>{system.id}</b> · {system.name}
                          </td>
                          <td>
                            {p.relations
                              .filter(
                                (relation) =>
                                  relation.from === system.id &&
                                  relation.kind === "represents",
                              )
                              .map((relation) => relation.to)
                              .join(", ") || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {umlView === "Sequence" && (
                <div className="profile-diagram sos-analysis-view">
                  <h3>Canonical sequence messages</h3>
                  <ol className="sos-analysis-list">
                    {p.relations.slice(0, 18).map((relation, index) => (
                      <li
                        key={
                          relation.id ||
                          `${relation.from}-${relation.to}-${index}`
                        }
                      >
                        <code>{relationId(relation, index)}</code> ·{" "}
                        {relation.from} → {relation.to} · {relation.kind}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              {umlView === "State machine" && (
                <div className="profile-diagram sos-analysis-view">
                  <h3>Canonical state machine</h3>
                  <div className="sos-analysis-grid">
                    {[
                      ...new Set(systemBlocks.map((block) => block.status)),
                    ].map((status) => (
                      <article className="sos-analysis-card" key={status}>
                        <b>STATE</b>
                        <strong>{status}</strong>
                        <small>
                          {
                            systemBlocks.filter(
                              (block) => block.status === status,
                            ).length
                          }{" "}
                          blocks in this state
                        </small>
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {profile === "SoSE" && (
            <div className="sos-view-stack">
              <label>
                SoSE view
                <select
                  aria-label="SoSE view"
                  value={sosView}
                  onChange={(event) => setSosView(event.target.value)}
                >
                  <option>Mission thread</option>
                  <option>System-of-systems context</option>
                  <option>Capability allocation</option>
                  <option>Operational dependencies</option>
                  <option>Interoperability matrix</option>
                  <option>Cascading impact</option>
                </select>
              </label>
              {sosView === "Mission thread" && (
                <div className="profile-diagram">
                  <div className="sos-root">
                    {missions[0]?.id} · {missions[0]?.name}
                    <small>«mission» system-of-systems thread</small>
                  </div>
                  <div className="sos-children">
                    {constituentSystems.slice(0, 4).map((system) => (
                      <div className="sos-node" key={system.id}>
                        <b>{system.name}</b>
                        <small>
                          {system.id} · constituent system ·{" "}
                          {
                            p.relations.filter(
                              (relation) =>
                                relation.from === system.id ||
                                relation.to === system.id,
                            ).length
                          }{" "}
                          links
                        </small>
                      </div>
                    ))}
                  </div>
                  <div className="sysml-note">
                    {constituentSystems.length} constituent systems ·{" "}
                    {interfaces.length} interfaces ·{" "}
                    {
                      p.relations.filter(
                        (relation) => relation.kind === "represents",
                      ).length
                    }{" "}
                    representation links
                  </div>
                </div>
              )}
              {sosView === "System-of-systems context" && (
                <div className="profile-diagram sos-analysis-view">
                  <div className="sos-root">
                    {missions[0]?.id} · {missions[0]?.name}
                    <small>«system of systems» context boundary</small>
                  </div>
                  <div className="sos-analysis-grid">
                    {constituentSystems.map((system) => (
                      <article key={system.id} className="sos-analysis-card">
                        <b>{system.id}</b>
                        <strong>{system.name}</strong>
                        <small>
                          Owner: {system.metadata?.owner || "Unassigned"} ·
                          Authority:{" "}
                          {system.metadata?.authority || "Unassigned"}
                        </small>
                      </article>
                    ))}
                  </div>
                  <p className="sysml-note">
                    {constituentSystems.length} constituent systems and{" "}
                    {interfaces.length} shared interfaces in the canonical
                    context.
                  </p>
                </div>
              )}
              {sosView === "Capability allocation" && (
                <div className="profile-diagram sos-analysis-view">
                  <h3>Capability-to-system allocation matrix</h3>
                  <table className="sos-analysis-table">
                    <thead>
                      <tr>
                        <th>Capability</th>
                        <th>Allocated blocks</th>
                        <th>Constituent systems</th>
                      </tr>
                    </thead>
                    <tbody>
                      {capabilities.slice(0, 12).map((capability) => {
                        const blockIds = p.relations
                          .filter(
                            (relation) =>
                              relation.from === capability.id &&
                              relation.kind === "allocated-to",
                          )
                          .map((relation) => relation.to);
                        const systems = constituentSystems.filter((system) =>
                          p.relations.some(
                            (relation) =>
                              relation.from === system.id &&
                              relation.kind === "represents" &&
                              blockIds.includes(relation.to),
                          ),
                        );
                        return (
                          <tr key={capability.id}>
                            <td>
                              <b>{capability.id}</b> · {capability.name}
                            </td>
                            <td>{blockIds.join(", ") || "—"}</td>
                            <td>
                              {systems.map((system) => system.id).join(", ") ||
                                "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {sosView === "Operational dependencies" && (
                <div className="profile-diagram sos-analysis-view">
                  <h3>Operational dependency graph</h3>
                  <div className="sos-analysis-grid">
                    {p.relations
                      .filter((relation) => relation.kind === "depends-on")
                      .map((relation, index) => (
                        <article
                          className="sos-analysis-card dependency-card"
                          key={
                            relation.id ||
                            `${relation.from}-${relation.to}-${index}`
                          }
                        >
                          <b>
                            {relation.from} → {relation.to}
                          </b>
                          <small>
                            {relationId(relation, index)} · depends-on
                          </small>
                        </article>
                      ))}
                  </div>
                </div>
              )}
              {sosView === "Interoperability matrix" && (
                <div className="profile-diagram sos-analysis-view">
                  <h3>Interoperability matrix</h3>
                  <table className="sos-analysis-table">
                    <thead>
                      <tr>
                        <th>Interface</th>
                        <th>Owner</th>
                        <th>Connected endpoint</th>
                      </tr>
                    </thead>
                    <tbody>
                      {interfaces.slice(0, 16).map((interf) => {
                        const owner = p.relations.find(
                          (relation) =>
                            relation.to === interf.id &&
                            relation.kind === "owns",
                        );
                        const peer = p.relations.find(
                          (relation) =>
                            relation.from === interf.id &&
                            relation.kind === "connects",
                        );
                        return (
                          <tr key={interf.id}>
                            <td>
                              <b>{interf.id}</b> · {interf.name}
                            </td>
                            <td>{owner?.from || "—"}</td>
                            <td>{peer?.to || "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {sosView === "Cascading impact" && (
                <div className="profile-diagram sos-analysis-view">
                  <h3>System-of-systems cascading impact</h3>
                  <p className="muted">
                    Starting from{" "}
                    {selectedConstituentId || "no constituent system"}, this
                    view follows canonical depends-on links and derives affected
                    capabilities and missions.
                  </p>
                  <div className="baseline-impact-grid">
                    <span>
                      Affected systems <b>{cascadingSystemIds.size}</b>
                    </span>
                    <span>
                      Shared capabilities <b>{cascadingCapabilityIds.length}</b>
                    </span>
                    <span>
                      Missions <b>{cascadingMissionIds.length}</b>
                    </span>
                    <span>
                      Dependency links{" "}
                      <b>
                        {
                          p.relations.filter(
                            (relation) =>
                              cascadingSystemIds.has(relation.from) &&
                              relation.kind === "depends-on",
                          ).length
                        }
                      </b>
                    </span>
                  </div>
                  <div className="sos-analysis-grid">
                    {[...cascadingSystemIds].map((systemId) => {
                      const system = constituentSystems.find(
                        (item) => item.id === systemId,
                      );
                      return (
                        <article className="sos-analysis-card" key={systemId}>
                          <b>{systemId}</b>
                          <strong>{system?.name || "Referenced system"}</strong>
                          <small>
                            {
                              p.relations.filter(
                                (relation) =>
                                  relation.from === systemId &&
                                  relation.kind === "depends-on",
                              ).length
                            }{" "}
                            downstream dependencies
                          </small>
                        </article>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
      <section className="panel model-inspector">
        <p className="eyebrow">MODEL PROFILE</p>
        <h3>SysML / UML / SoSE</h3>
        <div className="callout architecture-actions">
          <b>Make the architecture explicit</b>
          <p>
            These actions update the canonical model and remain visible in every
            profile.
          </p>
          <label>
            Requirement allocation
            <select
              aria-label="Architecture requirement"
              value={requirementId}
              onChange={(event) => setRequirementId(event.target.value)}
            >
              {requirements.slice(0, 12).map((requirement) => (
                <option key={requirement.id} value={requirement.id}>
                  {requirement.id} · {requirement.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Target block
            <select
              aria-label="Architecture target block"
              value={blockId}
              onChange={(event) => setBlockId(event.target.value)}
            >
              {systemBlocks.slice(0, 12).map((block) => (
                <option key={block.id} value={block.id}>
                  {block.id} · {block.name}
                </option>
              ))}
            </select>
          </label>
          <button
            className="button secondary"
            onClick={() => p.allocateRequirement(requirementId, blockId)}
          >
            Allocate requirement
          </button>
          <button
            className="button secondary"
            onClick={p.createArchitectureInterface}
          >
            Create interface
          </button>
        </div>
        {profile === "UML" && (
          <div className="callout architecture-actions">
            <b>Connect actor to use case</b>
            <p>Creates a canonical uses relationship in the shared model.</p>
            <label>
              Actor
              <select
                aria-label="UML actor"
                value={actorId}
                onChange={(event) => setActorId(event.target.value)}
              >
                {stakeholders.map((stakeholder) => (
                  <option key={stakeholder.id} value={stakeholder.id}>
                    {stakeholder.id} · {stakeholder.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Use case
              <select
                aria-label="UML use case"
                value={useCaseId}
                onChange={(event) => setUseCaseId(event.target.value)}
              >
                {capabilities.map((capability) => (
                  <option key={capability.id} value={capability.id}>
                    {capability.id} · {capability.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="button secondary"
              onClick={() =>
                p.addRelation({ from: actorId, to: useCaseId, kind: "uses" })
              }
            >
              Connect actor
            </button>
          </div>
        )}
        {profile === "SoSE" && selectedConstituent && (
          <div className="sos-inspector">
            <div className="panel-title">
              <div>
                <p className="eyebrow">CONSTITUENT SYSTEM INSPECTOR</p>
                <h3>{selectedConstituent.id}</h3>
              </div>
              <select
                aria-label="Constituent system"
                value={selectedConstituentId}
                onChange={(event) =>
                  setSelectedConstituentId(event.target.value)
                }
              >
                {constituentSystems.map((system) => (
                  <option key={system.id} value={system.id}>
                    {system.id} · {system.name}
                  </option>
                ))}
              </select>
            </div>
            <p className="muted">{selectedConstituent.description}</p>
            <div className="sos-attributes">
              {Object.entries(selectedConstituent.metadata || {}).map(
                ([label, value]) => (
                  <label key={label}>
                    <small>{label}</small>
                    <input
                      aria-label={`Constituent ${label}`}
                      value={value}
                      onChange={(event) =>
                        updateConstituentMetadata(label, event.target.value)
                      }
                    />
                  </label>
                ),
              )}
            </div>
            <small className="muted">
              {
                p.relations.filter(
                  (relation) =>
                    relation.from === selectedConstituent.id ||
                    relation.to === selectedConstituent.id,
                ).length
              }{" "}
              explainable dependency and allocation links
            </small>
          </div>
        )}
        {[
          [
            "SysML 1.6 orientation",
            "Requirement, block, interface, allocation",
          ],
          ["UML compatibility", "Use cases, activities, sequences"],
          ["SoSE analysis", "Constituent dependencies and missions"],
        ].map((x, i) => (
          <button
            className={`profile ${profile === (["SysML", "UML", "SoSE"] as const)[i] ? "active" : ""}`}
            key={x[0]}
            onClick={() => setProfile((["SysML", "UML", "SoSE"] as const)[i])}
          >
            <b>{x[0]}</b>
            <small>{x[1]}</small>
          </button>
        ))}
        <p className="muted">
          {p.relations.length} relationships are shared by every view.
        </p>
      </section>
    </div>
  );
}
function Verification({
  artifacts,
  relations,
  addRelation,
  createVerificationCase,
  updateArtifact,
}: {
  artifacts: Artifact[];
  relations: Relation[];
  addRelation: (relation: Relation) => void;
  createVerificationCase: () => void;
  updateArtifact: (id: string, patch: Partial<Artifact>) => void;
}) {
  const tests = artifacts.filter((a) => a.type === "Test");
  const evidence = artifacts.filter((a) => a.type === "Evidence");
  const newTests = tests.filter((a) => a.id.startsWith("TST-NEW-"));
  const [testId, setTestId] = useState(
    tests.find((test) => test.id === "TST-042")?.id || tests[0]?.id || "",
  );
  const selectedTest = tests.find((test) => test.id === testId);
  const details: VerificationDetails = selectedTest?.verification || {
    method: "Test",
    objective: selectedTest?.description || "",
    preconditions: "",
    procedure: "",
    expectedResult: "",
    actualResult: "",
    owner: "",
    environment: "",
    version: "",
    baseline: "",
  };
  const [evidenceId, setEvidenceId] = useState(evidence[0]?.id || "");
  const evidenceAttached = Boolean(
    selectedTest &&
    evidenceId &&
    relations.some(
      (relation) =>
        relation.from === selectedTest.id &&
        relation.to === evidenceId &&
        relation.kind === "produces",
    ),
  );
  const updateVerification = (key: keyof VerificationDetails, value: string) =>
    updateArtifact(testId, { verification: { ...details, [key]: value } });
  return (
    <section className="panel matrix">
      <div className="panel-title">
        <div>
          <p className="eyebrow">VERIFICATION MATRIX</p>
          <h2>Requirement to evidence</h2>
        </div>
        <button className="button primary" onClick={createVerificationCase}>
          Create verification case
        </button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Requirement</th>
            <th>Method</th>
            <th>Test case</th>
            <th>Evidence</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <b>REQ-042</b>
              <small>Mission telemetry availability</small>
            </td>
            <td>{selectedTest?.verification?.method || "Test"}</td>
            <td>TST-042 · Two-second telemetry test</td>
            <td>EVD-017 · Bench run 01</td>
            <td>
              <span className="status-pill success">Planned</span>
            </td>
          </tr>
          <tr>
            <td>
              <b>REQ-043</b>
              <small>Telemetry continuity</small>
            </td>
            <td>Analysis</td>
            <td>—</td>
            <td>—</td>
            <td>
              <span className="status-pill warning">Gap</span>
            </td>
          </tr>
          {newTests.map((test) => {
            const testEvidence = evidence.find(
              (item) =>
                item.id.replace("EVD-NEW-", "") ===
                test.id.replace("TST-NEW-", ""),
            );
            return (
              <tr key={test.id}>
                <td>
                  <b>REQ-042</b>
                  <small>Mission telemetry availability</small>
                </td>
                <td>{test.verification?.method || "Test"}</td>
                <td>
                  {test.id} · {test.name}
                </td>
                <td>
                  {testEvidence
                    ? `${testEvidence.id} · ${testEvidence.name}`
                    : "—"}
                </td>
                <td>
                  <span className="status-pill warning">Planned</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {selectedTest && (
        <section
          className="verification-editor"
          aria-labelledby="verification-editor-title"
        >
          <div className="panel-title">
            <div>
              <p className="eyebrow">VERIFICATION CASE</p>
              <h3 id="verification-editor-title">Case details</h3>
            </div>
            <select
              aria-label="Verification case"
              value={testId}
              onChange={(event) => setTestId(event.target.value)}
            >
              {tests.map((test) => (
                <option key={test.id} value={test.id}>
                  {test.id} · {test.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field-grid">
            <label>
              Verification method
              <select
                aria-label="Verification method"
                value={details.method}
                onChange={(event) =>
                  updateVerification(
                    "method",
                    event.target.value as VerificationDetails["method"],
                  )
                }
              >
                <option>Test</option>
                <option>Analysis</option>
                <option>Inspection</option>
                <option>Demonstration</option>
                <option>Simulation</option>
                <option>Certification</option>
                <option>Similarity</option>
                <option>Review of design</option>
              </select>
            </label>
            <label>
              Objective
              <textarea
                aria-label="Verification objective"
                value={details.objective}
                onChange={(event) =>
                  updateVerification("objective", event.target.value)
                }
              />
            </label>
            <label>
              Preconditions
              <textarea
                aria-label="Verification preconditions"
                value={details.preconditions}
                onChange={(event) =>
                  updateVerification("preconditions", event.target.value)
                }
              />
            </label>
            <label>
              Procedure
              <textarea
                aria-label="Verification procedure"
                value={details.procedure}
                onChange={(event) =>
                  updateVerification("procedure", event.target.value)
                }
              />
            </label>
            <label>
              Expected result
              <textarea
                aria-label="Verification expected result"
                value={details.expectedResult}
                onChange={(event) =>
                  updateVerification("expectedResult", event.target.value)
                }
              />
            </label>
            <label>
              Actual result
              <textarea
                aria-label="Verification actual result"
                value={details.actualResult}
                onChange={(event) =>
                  updateVerification("actualResult", event.target.value)
                }
              />
            </label>
            <label>
              Owner
              <input
                aria-label="Verification owner"
                value={details.owner}
                onChange={(event) =>
                  updateVerification("owner", event.target.value)
                }
              />
            </label>
            <label>
              Environment
              <input
                aria-label="Verification environment"
                value={details.environment}
                onChange={(event) =>
                  updateVerification("environment", event.target.value)
                }
              />
            </label>
            <label>
              Version
              <input
                aria-label="Verification version"
                value={details.version}
                onChange={(event) =>
                  updateVerification("version", event.target.value)
                }
              />
            </label>
            <label>
              Baseline
              <input
                aria-label="Verification baseline"
                value={details.baseline}
                onChange={(event) =>
                  updateVerification("baseline", event.target.value)
                }
              />
            </label>
          </div>
          <div className="callout verification-attachment">
            <b>Evidence attachment</b>
            <p>
              Link the selected test to a canonical evidence package. The
              relationship updates coverage and remains traceable.
            </p>
            <div className="link-controls">
              <select
                aria-label="Evidence package"
                value={evidenceId}
                onChange={(event) => setEvidenceId(event.target.value)}
              >
                {evidence.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.id} · {item.name}
                  </option>
                ))}
              </select>
              <button
                className="button secondary"
                disabled={evidenceAttached}
                onClick={() =>
                  addRelation({
                    from: selectedTest.id,
                    to: evidenceId,
                    kind: "produces",
                  })
                }
              >
                {evidenceAttached ? "Evidence attached" : "Attach evidence"}
              </button>
            </div>
          </div>
        </section>
      )}
      <div className="matrix-footer">
        {tests.length} verification cases · select a requirement to assign a
        method
      </div>
    </section>
  );
}
function Reviews(p: PageProps) {
  const sessions = p.allArtifacts.filter(
    (artifact) => artifact.type === "ReviewSession",
  );
  const [sessionId, setSessionId] = useState(
    p.current.type === "ReviewSession" ? p.current.id : sessions[0]?.id || "",
  );
  const session =
    sessions.find((artifact) => artifact.id === sessionId) || sessions[0];
  const reviewed = session
    ? p.relations.filter(
        (relation) =>
          relation.from === session.id && relation.kind === "reviews",
      )
    : [];
  const [targetId, setTargetId] = useState(
    p.allArtifacts.find((artifact) => artifact.type === "Requirement")?.id ||
      "",
  );
  const metadata = {
    chair: "",
    disposition: "Open",
    meetingDate: "",
    ...(session?.metadata || {}),
  };
  useEffect(() => {
    if (session && !sessions.some((item) => item.id === sessionId))
      setSessionId(session.id);
  }, [session, sessionId, sessions]);
  const updateMetadata = (key: string, value: string) => {
    if (!session) return;
    p.updateArtifact(session.id, {
      metadata: { ...(session.metadata || {}), [key]: value },
    });
  };
  return (
    <div className="reviews-grid">
      <section className="panel review-list">
        <div className="panel-title">
          <div>
            <p className="eyebrow">TECHNICAL REVIEWS</p>
            <h2>Review sessions</h2>
          </div>
          <button className="button primary" onClick={p.createReviewSession}>
            New review
          </button>
        </div>
        {sessions.map((item) => (
          <button
            className={
              item.id === session?.id ? "artifact-row selected" : "artifact-row"
            }
            key={item.id}
            onClick={() => setSessionId(item.id)}
          >
            <span className="type-dot reviewsession" />
            <span>
              <b>{item.id}</b>
              <small>{item.name}</small>
            </span>
            <em>{item.status}</em>
          </button>
        ))}
      </section>
      {session ? (
        <section className="panel review-editor">
          <div className="panel-title">
            <div>
              <p className="eyebrow">REVIEW SESSION · {session.id}</p>
              <h2>{session.name}</h2>
            </div>
            <span className="status-pill">{session.status}</span>
          </div>
          <label>
            Review name
            <input
              aria-label="Review name"
              value={session.name}
              onChange={(event) =>
                p.updateArtifact(session.id, { name: event.target.value })
              }
            />
          </label>
          <label>
            Review agenda
            <textarea
              aria-label="Review agenda"
              value={session.description}
              onChange={(event) =>
                p.updateArtifact(session.id, {
                  description: event.target.value,
                })
              }
            />
          </label>
          <div className="field-grid">
            <label>
              Chair
              <input
                aria-label="Review chair"
                value={metadata.chair}
                onChange={(event) =>
                  updateMetadata("chair", event.target.value)
                }
              />
            </label>
            <label>
              Meeting date
              <input
                aria-label="Review meeting date"
                type="date"
                value={metadata.meetingDate}
                onChange={(event) =>
                  updateMetadata("meetingDate", event.target.value)
                }
              />
            </label>
            <label>
              Disposition
              <select
                aria-label="Review disposition"
                value={metadata.disposition}
                onChange={(event) =>
                  updateMetadata("disposition", event.target.value)
                }
              >
                <option>Open</option>
                <option>Accepted</option>
                <option>Accepted with actions</option>
                <option>Rejected</option>
              </select>
            </label>
            <label>
              Session status
              <select
                aria-label="Review status"
                value={session.status}
                onChange={(event) =>
                  p.updateArtifact(session.id, { status: event.target.value })
                }
              >
                <option>Planned</option>
                <option>In progress</option>
                <option>Completed</option>
              </select>
            </label>
          </div>
          <section
            className="review-links"
            aria-labelledby="review-links-title"
          >
            <div className="panel-title">
              <h3 id="review-links-title">Reviewed canonical artifacts</h3>
              <span className="muted">{reviewed.length} linked</span>
            </div>
            {reviewed.map((relation) => {
              const artifact = p.allArtifacts.find(
                (item) => item.id === relation.to,
              );
              return (
                <div className="review-link-row" key={relation.to}>
                  <b>{relation.to}</b>
                  <span>{artifact?.name || "Unknown artifact"}</span>
                </div>
              );
            })}
            <div className="link-controls">
              <select
                aria-label="Review artifact"
                value={targetId}
                onChange={(event) => setTargetId(event.target.value)}
              >
                {p.allArtifacts
                  .filter((artifact) => artifact.id !== session.id)
                  .slice(0, 80)
                  .map((artifact) => (
                    <option key={artifact.id} value={artifact.id}>
                      {artifact.id} · {artifact.name}
                    </option>
                  ))}
              </select>
              <button
                className="button secondary"
                onClick={() =>
                  p.addRelation({
                    from: session.id,
                    to: targetId,
                    kind: "reviews",
                  })
                }
              >
                Add review link
              </button>
            </div>
          </section>
          <button
            className="button primary"
            onClick={() =>
              p.updateArtifact(session.id, {
                status: "Completed",
                metadata: {
                  ...(session.metadata || {}),
                  disposition: metadata.disposition,
                },
              })
            }
          >
            Complete review
          </button>
        </section>
      ) : (
        <section className="panel empty-state">
          No review sessions exist yet. Create one to begin a technical review.
        </section>
      )}
    </div>
  );
}
function Impact({
  current,
  artifacts,
  relations,
  createChangeRequest,
  applyProposedChange,
}: {
  current: Artifact;
  artifacts: Artifact[];
  relations: Relation[];
  createChangeRequest: (proposed: string) => void;
  applyProposedChange: (proposed: string) => void;
}) {
  const [proposal, setProposal] = useState(
    current.description.replace("2 seconds", "1 second"),
  );
  const [ran, setRan] = useState(false);
  const analysis = useMemo(
    () =>
      analyzeImpact(
        current,
        artifacts,
        relations,
        { ...current, description: proposal },
        4,
      ),
    [artifacts, current, proposal, relations],
  );
  return (
    <div className="impact-grid">
      <section className="panel impact-panel">
        <p className="eyebrow">CHANGE SIMULATION</p>
        <h2>What if this threshold changes?</h2>
        <p className="muted">
          Preview the digital thread before applying a change to{" "}
          <b>{current.id}</b>.
        </p>
        <label>
          Proposed statement
          <textarea
            value={proposal}
            onChange={(e) => {
              setProposal(e.target.value);
              setRan(false);
            }}
          />
        </label>
        <button className="button primary" onClick={() => setRan(true)}>
          Run impact simulation
        </button>
        <div className="landing-actions">
          <button
            className="button secondary"
            onClick={() => createChangeRequest(proposal)}
          >
            Create change request
          </button>
          <button
            className="button primary"
            disabled={!ran}
            onClick={() => applyProposedChange(proposal)}
          >
            Apply proposed change
          </button>
          <button
            className="button secondary"
            disabled={!ran}
            onClick={() => {
              const ids = new Set([
                current.id,
                ...analysis.entries.map((entry) => entry.artifact.id),
              ]);
              download(
                "tracegraph-impact.mmd",
                mermaid(
                  artifacts.filter((artifact) => ids.has(artifact.id)),
                  relations.filter(
                    (relation) =>
                      ids.has(relation.from) && ids.has(relation.to),
                  ),
                ),
              );
            }}
          >
            Export impact Mermaid
          </button>
        </div>
        {ran && (
          <>
            <div className="impact-result">
              <span className="impact-ring">{analysis.entries.length}</span>
              <div>
                <b>Potentially affected artifacts</b>
                <small>Across up to 4 relationship hops · preview only</small>
              </div>
            </div>
            <div className="impact-metrics">
              <span>
                Direct <b>{analysis.directCount}</b>
              </span>
              <span>
                Indirect <b>{analysis.indirectCount}</b>
              </span>
              <span>
                SoS cascade <b>{analysis.sosCascadeCount}</b>
              </span>
              <span>
                Verification gaps <b>{analysis.verificationGaps.length}</b>
              </span>
            </div>
            <div className="callout">
              <b>Proposal consequences</b>
              <small>
                {analysis.relationshipChanges} relationships in the affected
                subgraph · {analysis.allocationLinks} allocation links ·{" "}
                {analysis.proposedQualityFindings.length} quality findings on
                the proposed statement.
              </small>
            </div>
          </>
        )}
      </section>
      <section className="panel affected">
        <div className="panel-title">
          <h3>Impact path</h3>
          <span className="status-pill warning">Review required</span>
        </div>
        {analysis.entries
          .slice(0, 8)
          .map(({ artifact, hops, path, classification }, i) => (
            <div className="affected-row" key={artifact.id}>
              <span>{i + 1}</span>
              <div>
                <b>
                  {artifact.id} · {artifact.name}
                </b>
                <small>
                  {classification} · {hops} hop{hops === 1 ? "" : "s"} ·{" "}
                  {path.join(" → ")}
                </small>
              </div>
              <em>{classification}</em>
            </div>
          ))}
        {!analysis.entries.length && (
          <p className="muted">
            No downstream artifacts are connected to this selection.
          </p>
        )}
        <p className="muted">
          Every result is derived from canonical relationships, not a hidden
          score.
        </p>
      </section>
    </div>
  );
}
function Baselines({
  artifacts,
  relations,
  auditRecords,
  relationHistory,
  baselines,
  createBaseline,
  restoreBaseline,
  bulkArchive,
  deleteLocalProject,
}: {
  artifacts: Artifact[];
  relations: Relation[];
  auditRecords: AuditRecord[];
  relationHistory: RelationHistoryEntry[];
  baselines: Baseline[];
  createBaseline: (draft: BaselineDraft) => void;
  restoreBaseline: (baseline: Baseline) => void;
  bulkArchive: (ids: string[]) => void;
  deleteLocalProject: () => void;
}) {
  const [name, setName] = useState("");
  const [approvedBy, setApprovedBy] = useState("");
  const [includedTypes, setIncludedTypes] =
    useState<ArtifactType[]>(artifactTypes);
  const [bulkType, setBulkType] = useState<ArtifactType>("Requirement");
  const [bulkPreview, setBulkPreview] = useState<string[] | null>(null);
  const [leftId, setLeftId] = useState(baselines[0]?.id || "");
  const [rightId, setRightId] = useState(
    baselines[1]?.id || baselines[0]?.id || "",
  );
  const toggleType = (type: ArtifactType) =>
    setIncludedTypes((current) =>
      current.includes(type)
        ? current.filter((item) => item !== type)
        : [...current, type],
    );
  const left = baselines.find((baseline) => baseline.id === leftId);
  const right = baselines.find((baseline) => baseline.id === rightId);
  const comparison =
    left && right
      ? compareBundles(
          {
            version: 1,
            artifacts: left.artifacts,
            relations: left.relations,
          },
          {
            version: 1,
            artifacts: right.artifacts,
            relations: right.relations,
          },
        )
      : null;
  return (
    <div className="baseline-grid">
      <section className="panel baseline-card active-baseline">
        <p className="eyebrow">WORKING COPY</p>
        <h2>Working model</h2>
        <p>
          Unsaved edits are persisted locally and can be exported at any time.
        </p>
        <div className="baseline-meta">
          <span>{artifacts.length} artifacts</span>
          <span>{relations.length} links</span>
          <span className="status-pill success">Draft</span>
        </div>
        <label>
          Baseline name
          <input
            aria-label="Baseline name"
            placeholder="Baseline 1.2"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label>
          Approval recorded by
          <input
            aria-label="Baseline approver"
            placeholder="Systems engineering board"
            value={approvedBy}
            onChange={(event) => setApprovedBy(event.target.value)}
          />
        </label>
        <fieldset className="baseline-types">
          <legend>Included artifact types</legend>
          {artifactTypes.map((type) => (
            <label key={type}>
              <input
                type="checkbox"
                checked={includedTypes.includes(type)}
                onChange={() => toggleType(type)}
              />
              {type}
            </label>
          ))}
        </fieldset>
        <button
          className="button primary"
          onClick={() =>
            createBaseline({
              name,
              includedTypes,
              approvedBy,
            })
          }
        >
          Create baseline
        </button>
        <button
          className="button danger"
          onClick={() => {
            if (
              window.confirm(
                "Delete the local TraceGraph project and its browser-stored history?",
              )
            ) {
              deleteLocalProject();
            }
          }}
        >
          Delete local project
        </button>
      </section>
      <section className="panel bulk-operation-panel">
        <p className="eyebrow">CONTROLLED BULK OPERATION</p>
        <h2>Archive a model slice</h2>
        <p className="muted">
          Preview the exact canonical artifacts before a destructive status
          change. Relationships remain intact and every change is undoable.
        </p>
        <label>
          Artifact type
          <select
            aria-label="Bulk archive artifact type"
            value={bulkType}
            onChange={(event) => {
              setBulkType(event.target.value as ArtifactType);
              setBulkPreview(null);
            }}
          >
            {artifactTypes.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </label>
        <button
          className="button secondary"
          onClick={() =>
            setBulkPreview(
              artifacts
                .filter(
                  (artifact) =>
                    artifact.type === bulkType &&
                    artifact.status !== "Archived",
                )
                .map((artifact) => artifact.id),
            )
          }
        >
          Preview archive
        </button>
        {bulkPreview && (
          <div className="callout" role="status">
            <b>{bulkPreview.length} artifacts selected</b>
            <small>{bulkPreview.slice(0, 12).join(", ")}</small>
            {bulkPreview.length > 12 && (
              <small>+ {bulkPreview.length - 12} more</small>
            )}
            <button
              className="button danger"
              disabled={!bulkPreview.length}
              onClick={() => {
                if (
                  window.confirm(
                    `Archive ${bulkPreview.length} ${bulkType} artifacts? This can be undone.`,
                  )
                ) {
                  bulkArchive(bulkPreview);
                  setBulkPreview(null);
                }
              }}
            >
              Confirm archive
            </button>
          </div>
        )}
      </section>
      <section className="panel baseline-compare">
        <div className="panel-title">
          <div>
            <p className="eyebrow">FROZEN COMPARISON</p>
            <h2>Compare baselines</h2>
          </div>
          <span className="status-pill">Canonical diff</span>
        </div>
        <div className="field-grid">
          <label>
            Baseline A
            <select
              aria-label="Baseline A"
              value={leftId}
              onChange={(event) => setLeftId(event.target.value)}
            >
              {baselines.map((baseline) => (
                <option key={baseline.id} value={baseline.id}>
                  {baseline.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Baseline B
            <select
              aria-label="Baseline B"
              value={rightId}
              onChange={(event) => setRightId(event.target.value)}
            >
              {baselines.map((baseline) => (
                <option key={baseline.id} value={baseline.id}>
                  {baseline.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        {comparison ? (
          <div className="baseline-comparison-result">
            <div className="baseline-impact-grid">
              <span>
                Added artifacts <b>{comparison.addedArtifacts.length}</b>
              </span>
              <span>
                Removed artifacts <b>{comparison.removedArtifacts.length}</b>
              </span>
              <span>
                Modified artifacts <b>{comparison.changedArtifacts.length}</b>
              </span>
              <span>
                Relationship changes{" "}
                <b>
                  {comparison.addedRelations.length +
                    comparison.removedRelations.length}
                </b>
              </span>
            </div>
            <button
              className="button secondary"
              onClick={() =>
                download(
                  `tracegraph-${left?.name}-vs-${right?.name}.json`,
                  JSON.stringify(
                    {
                      format: "tracegraph-baseline-comparison",
                      version: 1,
                      left: left,
                      right: right,
                      comparison,
                    },
                    null,
                    2,
                  ),
                  "application/json",
                )
              }
            >
              Export comparison package
            </button>
          </div>
        ) : (
          <p className="muted">Create or select two baselines to compare.</p>
        )}
      </section>
      {baselines.map((baseline) => (
        <section className="panel baseline-card" key={baseline.id}>
          <p className="eyebrow">FROZEN BASELINE</p>
          <h2>{baseline.name}</h2>
          <p>Created {new Date(baseline.createdAt).toLocaleString()}</p>
          <p className="muted">
            Approved by {baseline.approvedBy} ·{" "}
            {new Date(baseline.approvedAt).toLocaleString()}
          </p>
          <div className="baseline-meta">
            <span>{baseline.artifacts.length} artifacts</span>
            <span>{baseline.relations.length} links</span>
            <span className="status-pill success">Frozen</span>
          </div>
          <p className="baseline-diff">
            Included: {baseline.includedTypes.join(", ")}
          </p>
          {(() => {
            const diff = compareBundles(
              { version: 1, artifacts, relations },
              {
                version: 1,
                artifacts: baseline.artifacts,
                relations: baseline.relations,
              },
            );
            return (
              <>
                <p className="baseline-diff">
                  Working copy: {diff.addedArtifacts.length} added ·{" "}
                  {diff.changedArtifacts.length} changed ·{" "}
                  {diff.removedArtifacts.length} removed ·{" "}
                  {diff.addedRelations.length + diff.removedRelations.length}{" "}
                  relationship changes
                </p>
                <div className="baseline-impact-grid">
                  <span>
                    Verification changes{" "}
                    <b>
                      {diff.addedRelations.filter((relation) =>
                        relation.includes("verified-by"),
                      ).length +
                        diff.removedRelations.filter((relation) =>
                          relation.includes("verified-by"),
                        ).length}
                    </b>
                  </span>
                  <span>
                    Risk changes{" "}
                    <b>
                      {
                        diff.changedArtifacts.filter(
                          (id) =>
                            baseline.artifacts.find(
                              (artifact) => artifact.id === id,
                            )?.type === "Risk",
                        ).length
                      }
                    </b>
                  </span>
                  <span>
                    Allocation changes{" "}
                    <b>
                      {diff.addedRelations.filter((relation) =>
                        relation.includes("allocated-to"),
                      ).length +
                        diff.removedRelations.filter((relation) =>
                          relation.includes("allocated-to"),
                        ).length}
                    </b>
                  </span>
                </div>
              </>
            );
          })()}
          <button
            className="button secondary"
            onClick={() => restoreBaseline(baseline)}
          >
            Restore working copy
          </button>
          <button
            className="button secondary"
            onClick={() =>
              download(
                `${baseline.name}.json`,
                JSON.stringify(
                  {
                    version: 1,
                    artifacts: baseline.artifacts,
                    relations: baseline.relations,
                    versions: baseline.versions,
                    relationHistory: baseline.relationHistory,
                    includedTypes: baseline.includedTypes,
                    approvedBy: baseline.approvedBy,
                    approvedAt: baseline.approvedAt,
                    project: baseline.project,
                  },
                  null,
                  2,
                ),
                "application/json",
              )
            }
          >
            Export baseline
          </button>
        </section>
      ))}
      <section className="panel audit-panel">
        <div className="panel-title">
          <div>
            <p className="eyebrow">AUDIT HISTORY</p>
            <h2>Recent model changes</h2>
          </div>
          <span className="status-pill">Local · last 100 retained</span>
        </div>
        {auditRecords
          .slice(-5)
          .reverse()
          .map((record) => (
            <div className="audit-row" key={record.id}>
              <span>{new Date(record.timestamp).toLocaleTimeString()}</span>
              <b>{record.action}</b>
              <small>
                {record.artifactIds.length} artifacts in working copy
              </small>
            </div>
          ))}
        {!auditRecords.length && (
          <p className="muted">No changes recorded yet.</p>
        )}
      </section>
      <section className="panel audit-panel">
        <div className="panel-title">
          <div>
            <p className="eyebrow">RELATIONSHIP HISTORY</p>
            <h2>Canonical link changes</h2>
          </div>
          <span className="status-pill">Persistent · last 500</span>
        </div>
        {relationHistory
          .slice(-5)
          .reverse()
          .map((entry) => (
            <div className="audit-row" key={entry.id}>
              <span>{new Date(entry.timestamp).toLocaleTimeString()}</span>
              <b>{entry.action}</b>
              <small>
                {entry.added.length} added · {entry.removed.length} removed
              </small>
            </div>
          ))}
        {!relationHistory.length && (
          <p className="muted">No relationship changes recorded yet.</p>
        )}
      </section>
    </div>
  );
}
