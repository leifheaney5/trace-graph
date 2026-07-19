import { describe, expect, it } from "vitest";
import {
  analyzeImpact,
  compareBundles,
  canonicalRelationshipKinds,
  coverageMetrics,
  csvRequirements,
  csvTraceability,
  csvVerification,
  mermaid,
  qualityAnalysis,
  markdownReport,
  modelDiagnostics,
  parseMermaidProposal,
  printableHtml,
  qualityFindings,
  relationId,
  validateRelation,
  seedArtifacts,
  seedRelations,
  svgDocument,
  validateBundle,
} from "./model";
import type { VerificationDetails } from "./model";
import { profileIds, profileRegistry } from "./profiles";

describe("canonical engineering model", () => {
  it("contains a complete sample trace from stakeholder to evidence", () => {
    const ids = new Set(
      seedRelations.flatMap((relation) => [relation.from, relation.to]),
    );
    expect(ids.has("STK-001")).toBe(true);
    expect(ids.has("REQ-042")).toBe(true);
    expect(ids.has("EVD-017")).toBe(true);
  });

  it("defines profiles as canonical vocabulary and view projections", () => {
    expect(profileIds).toEqual(
      expect.arrayContaining(["SysML", "UML", "SoSE", "Core TraceGraph"]),
    );
    expect(profileRegistry.SysML.artifactTypes).toContain("Block");
    expect(profileRegistry.UML.artifactTypes).toContain("UseCase");
    expect(profileRegistry.SoSE.artifactTypes).toContain("ConstituentSystem");
    expect(profileRegistry.SysML.defaultViews.length).toBeGreaterThan(2);
    expect(profileRegistry.SysML.requiredFields).toContain("id");
    expect(profileRegistry.SysML.optionalFields).toContain("owner");
    expect(profileRegistry.SysML.allowedConnections.length).toBeGreaterThan(0);
    expect(profileRegistry.SysML.validationRules.length).toBeGreaterThan(0);
    expect(profileRegistry.SysML.diagramNotation).toContain("SysML");
    expect(profileRegistry.SysML.exportMappings.mermaid).toContain("Mermaid");
    expect(profileRegistry.SysML.contextualHelp).toBeTruthy();
    expect(
      profileIds.every(
        (id) =>
          profileRegistry[id].artifactTypes.length > 0 &&
          profileRegistry[id].relationshipKinds.length > 0,
      ),
    ).toBe(true);
  });

  it("supports the complete verification-method vocabulary", () => {
    const methods: VerificationDetails["method"][] = [
      "Test",
      "Analysis",
      "Inspection",
      "Demonstration",
      "Simulation",
      "Certification",
      "Similarity",
      "Review of design",
    ];
    expect(methods).toHaveLength(8);
    expect(methods).toContain("Review of design");
  });

  it("exposes the open canonical relationship vocabulary", () => {
    expect(canonicalRelationshipKinds).toEqual(
      expect.arrayContaining([
        "captured-from",
        "satisfied-by",
        "interfaces-with",
        "validated-by",
        "mitigated-by",
        "conflicts-with",
        "supersedes",
        "realizes",
        "enables",
      ]),
    );
    expect(canonicalRelationshipKinds.length).toBeGreaterThanOrEqual(30);
  });

  it("allows project framing to carry boundary and planning context", () => {
    const bundle = validateBundle({
      version: 1,
      artifacts: seedArtifacts,
      relations: seedRelations,
      project: {
        name: "Example",
        mission: "Mission",
        problemStatement: "Problem",
        owner: "Owner",
        version: "1.0",
        systemBoundary: "Boundary",
        intendedOutcomes: "Outcomes",
        inScope: "In scope",
        outOfScope: "Out of scope",
        assumptions: "Assumptions",
        dependencies: "Dependencies",
      },
    });
    expect(bundle.project?.systemBoundary).toBe("Boundary");
    expect(bundle.project?.dependencies).toBe("Dependencies");
  });

  it("validates diagram perspectives as portable project data", () => {
    const perspective = {
      id: "DIAGRAM-001",
      title: "Requirement trace",
      profile: "SysML",
      diagramType: "Requirement trace",
      elementFilter: "All",
      selectedIds: ["REQ-042"],
      positions: { "REQ-042": { x: 120, y: 100 } },
      layoutMode: "Grid",
      savedAt: "2026-07-18T00:00:00.000Z",
    };
    expect(() =>
      validateBundle({
        version: 1,
        artifacts: seedArtifacts,
        relations: seedRelations,
        diagramPerspectives: [perspective],
      }),
    ).not.toThrow();
    expect(() =>
      validateBundle({
        version: 1,
        artifacts: seedArtifacts,
        relations: seedRelations,
        diagramPerspectives: [{ ...perspective, selectedIds: "REQ-042" }],
      }),
    ).toThrow("Diagram perspective");
  });

  it("preserves candidate-need review dispositions as canonical metadata", () => {
    const need = seedArtifacts.find((artifact) => artifact.type === "Need")!;
    expect({
      ...need,
      status: "Deferred",
      metadata: {
        disposition: "Deferred",
        dispositionRationale: "Needs operational owner confirmation.",
      },
    }).toMatchObject({
      status: "Deferred",
      metadata: { disposition: "Deferred" },
    });
  });

  it("ships a rich synthetic emergency-response model", () => {
    expect(seedArtifacts.filter((a) => a.type === "Requirement")).toHaveLength(
      260,
    );
    expect(seedArtifacts.filter((a) => a.type === "Stakeholder")).toHaveLength(
      25,
    );
    expect(seedArtifacts.filter((a) => a.type === "Test")).toHaveLength(180);
    expect(
      seedArtifacts.filter((a) => a.type === "ElicitationRecord"),
    ).toHaveLength(60);
    expect(
      seedArtifacts.filter((a) => a.type === "ChangeRequest"),
    ).toHaveLength(4);
    expect(
      seedArtifacts.filter((a) => a.type === "ReviewSession"),
    ).toHaveLength(4);
    expect(seedArtifacts.find((a) => a.id === "SOS-001")?.metadata?.owner).toBe(
      "Municipal fire service",
    );
    expect(
      seedRelations.some(
        (relation) =>
          relation.from === "SOS-001" &&
          relation.to === "SOS-002" &&
          relation.kind === "depends-on",
      ),
    ).toBe(true);
    expect(seedRelations.length).toBeGreaterThan(1000);
    expect(() =>
      validateBundle({
        version: 1,
        artifacts: seedArtifacts,
        relations: seedRelations,
      }),
    ).not.toThrow();
  });

  it("generates portable Mermaid source from canonical relationships", () => {
    const source = mermaid(seedArtifacts, seedRelations);
    expect(source).toContain("flowchart LR");
    expect(source).toContain("REQ_042 -->|verified-by| TST_042");
    expect(source).toContain("EVD_017");
  });

  it("reports explainable quality findings for weak requirement text", () => {
    const weak = {
      ...seedArtifacts[2],
      description: "Telemetry should be fast.",
      source: undefined,
      verification: undefined,
    };
    expect(qualityFindings(weak).length).toBeGreaterThanOrEqual(3);
    expect(qualityAnalysis(weak)).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "modal-verb" })]),
    );
    expect(qualityFindings(seedArtifacts[2])).toEqual([]);
  });

  it("flags ambiguous quantities, rationale gaps, and escape clauses", () => {
    const findings = qualityAnalysis({
      ...seedArtifacts[2],
      description:
        "The system shall provide several appropriate results if possible.",
      metadata: undefined,
      structure: undefined,
      source: undefined,
      verification: undefined,
    });
    expect(findings.map((finding) => finding.id)).toEqual(
      expect.arrayContaining([
        "ambiguous-term",
        "vague-quantity",
        "missing-rationale",
        "escape-clause",
      ]),
    );
    expect(
      findings.find((finding) => finding.id === "escape-clause"),
    ).toMatchObject({
      severity: "required",
      triggeringText: "if possible",
    });
  });

  it("calculates separate explainable coverage metrics", () => {
    const metrics = coverageMetrics(seedArtifacts, seedRelations);
    expect(metrics).toHaveLength(5);
    expect(
      metrics.find((metric) => metric.id === "requirement-verification")
        ?.denominator,
    ).toBe(260);
    expect(
      metrics.every(
        (metric) =>
          metric.uncoveredIds.length === metric.denominator - metric.numerator,
      ),
    ).toBe(true);
  });

  it("rejects bundles whose relationships reference unknown artifacts", () => {
    expect(() =>
      validateBundle({
        version: 1,
        artifacts: seedArtifacts,
        relations: [{ from: "REQ-042", to: "MISSING", kind: "depends-on" }],
      }),
    ).toThrow("existing artifacts");
  });

  it("validates optional artifact history in project bundles", () => {
    const valid = {
      version: 1 as const,
      artifacts: seedArtifacts,
      relations: seedRelations,
      versions: [
        {
          id: "VER-001",
          artifactId: "REQ-042",
          version: 1,
          timestamp: "2026-07-18T00:00:00.000Z",
          action: "requirement.edit",
          snapshot: seedArtifacts.find(
            (artifact) => artifact.id === "REQ-042",
          )!,
        },
      ],
    };
    expect(() => validateBundle(valid)).not.toThrow();
    expect(() =>
      validateBundle({
        ...valid,
        versions: [{ id: "VER-002", artifactId: "REQ-042" }],
      }),
    ).toThrow("history");
    expect(() =>
      validateBundle({
        ...valid,
        relationHistory: [{ id: "REL-HIST-1", action: "import" }],
      }),
    ).toThrow("Relationship history");
  });

  it("validates lifecycle baselines included in portable project bundles", () => {
    const baseline = {
      id: "BL-001",
      name: "Baseline 1.0",
      createdAt: "2026-07-18T00:00:00.000Z",
      artifacts: seedArtifacts.slice(0, 2),
      relations: [],
      versions: [],
      relationHistory: [],
      includedTypes: ["Requirement" as const],
      approvedBy: "Systems board",
      approvedAt: "2026-07-18T00:00:00.000Z",
    };
    expect(() =>
      validateBundle({
        version: 1,
        artifacts: seedArtifacts,
        relations: seedRelations,
        baselines: [baseline],
      }),
    ).not.toThrow();
    expect(() =>
      validateBundle({
        version: 1,
        artifacts: seedArtifacts,
        relations: seedRelations,
        baselines: [{ ...baseline, relations: [{ from: "A" }] }],
      }),
    ).toThrow("Baseline entries");
  });

  it("creates a standalone SVG alternative from canonical relationships", () => {
    const svg = svgDocument(seedArtifacts, seedRelations);
    expect(svg).toContain("<svg");
    expect(svg).toContain("REQ-042");
    expect(svg).toContain("verified-by");
    expect(svg).toMatch(/width="[1-5]\d{3}" height="[1-9]\d{2,3}"/);
  });

  it("applies inspectable SVG export title and legend options", () => {
    const svg = svgDocument(seedArtifacts, seedRelations, {
      title: "Review packet",
      legend: true,
    });
    expect(svg).toContain("Review packet");
    expect(svg).toContain("Canonical relationship view");
  });

  it("creates portable tabular and report exports from canonical data", () => {
    expect(csvRequirements(seedArtifacts)).toContain(
      "REQ-042,Mission telemetry availability",
    );
    expect(csvTraceability(seedArtifacts, seedRelations)).toContain("REQ-042");
    expect(seedRelations.every((relation) => relation.id)).toBe(true);
    expect(csvTraceability(seedArtifacts, seedRelations)).toContain(
      "relationship_id",
    );
    expect(relationId({ from: "A", to: "B", kind: "traces" }, 2)).toBe(
      "REL-A-TRACES-B-0003",
    );
    expect(csvVerification(seedArtifacts, seedRelations)).toContain("REQ-042");
    expect(markdownReport(seedArtifacts, seedRelations)).toContain(
      "# TraceGraph engineering report",
    );
    expect(printableHtml(seedArtifacts, seedRelations)).toContain(
      "<!doctype html>",
    );
  });

  it("previews constrained Mermaid relationship proposals without mutating the model", () => {
    const proposal = parseMermaidProposal(
      "flowchart LR\nREQ_042 -->|depends-on| BLK_007\nREQ_042 -. unsupported .-> TST_042",
      seedArtifacts,
      seedRelations,
    );
    expect(proposal.proposedRelations).toEqual([
      { from: "REQ-042", to: "BLK-007", kind: "depends-on" },
    ]);
    expect(proposal.unsupportedLines).toContain(
      "REQ_042 -. unsupported .-> TST_042",
    );
    expect(proposal.diagnostics[0]).toMatchObject({
      line: 3,
      column: 1,
      message: "Unsupported Mermaid syntax",
    });
  });

  it("compares artifact and relationship changes between bundles", () => {
    const baseline = {
      version: 1 as const,
      artifacts: seedArtifacts,
      relations: seedRelations,
    };
    const current = {
      version: 1 as const,
      artifacts: seedArtifacts
        .map((a) =>
          a.id === "REQ-042" ? { ...a, description: "Changed statement" } : a,
        )
        .filter((a) => a.id !== "EVD-017"),
      relations: seedRelations.filter(
        (relation) =>
          !(relation.from === "TST-042" && relation.to === "EVD-017"),
      ),
    };
    const diff = compareBundles(current, baseline);
    expect(diff.changedArtifacts).toEqual(["REQ-042"]);
    expect(diff.removedArtifacts).toEqual(["EVD-017"]);
    expect(diff.removedRelations).toContain("TST-042|produces|EVD-017");
  });

  it("explains direct, indirect, and proposal consequences for impact analysis", () => {
    const root = seedArtifacts.find((artifact) => artifact.id === "REQ-042")!;
    const analysis = analyzeImpact(root, seedArtifacts, seedRelations, {
      ...root,
      description: "Telemetry should be fast.",
    });
    expect(analysis.directCount).toBeGreaterThan(0);
    expect(
      analysis.entries.some((entry) => entry.artifact.id === "BLK-007"),
    ).toBe(true);
    expect(
      analysis.entries.find((entry) => entry.artifact.id === "BLK-007")?.path,
    ).toEqual(["REQ-042", "BLK-007"]);
    expect(analysis.proposedQualityFindings.length).toBeGreaterThan(0);
    expect(analysis.relationshipChanges).toBeGreaterThan(0);
  });

  it("reports explainable orphan, duplicate, cycle, and conflict findings", () => {
    const artifacts = [
      {
        id: "REQ-A",
        type: "Requirement" as const,
        name: "Shared requirement",
        description: "The system shall respond quickly.",
        status: "Draft",
      },
      {
        id: "REQ-B",
        type: "Requirement" as const,
        name: " shared requirement ",
        description: "The system shall respond safely.",
        status: "Draft",
      },
      {
        id: "BLK-A",
        type: "Block" as const,
        name: "Controller",
        description: "A controller.",
        status: "Draft",
      },
      {
        id: "ORPHAN",
        type: "Risk" as const,
        name: "Unlinked risk",
        description: "A risk without trace links.",
        status: "Draft",
      },
    ];
    const relations = [
      { from: "REQ-A", to: "BLK-A", kind: "allocated-to" },
      { from: "REQ-A", to: "BLK-A", kind: "allocated-to" },
      { from: "BLK-A", to: "REQ-A", kind: "satisfies" },
    ];
    const diagnostics = modelDiagnostics(artifacts, relations);
    expect(diagnostics.orphanArtifacts).toEqual(["REQ-B", "ORPHAN"]);
    expect(diagnostics.duplicateRelations).toEqual([
      "REQ-A|allocated-to|BLK-A",
    ]);
    expect(diagnostics.cycles).toContainEqual(["BLK-A", "REQ-A", "BLK-A"]);
    expect(diagnostics.conflictingRequirements).toEqual(["REQ-A", "REQ-B"]);
  });

  it("validates canonical relationship semantics by endpoint type", () => {
    const requirement = seedArtifacts.find((a) => a.id === "REQ-042")!;
    const test = seedArtifacts.find((a) => a.id === "TST-042")!;
    const evidence = seedArtifacts.find((a) => a.id === "EVD-017")!;
    const result = validateRelation(
      { from: requirement.id, to: test.id, kind: "verified-by" },
      [requirement, test, evidence],
    );
    expect(result.allowed).toBe(true);
    expect(
      validateRelation(
        { from: evidence.id, to: requirement.id, kind: "verified-by" },
        [requirement, test, evidence],
      ),
    ).toMatchObject({ allowed: false });
    expect(
      validateRelation(
        { from: requirement.id, to: requirement.id, kind: "depends-on" },
        [requirement],
      ).explanation,
    ).toContain("itself");
  });
});
