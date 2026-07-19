import type { ArtifactType } from "./model";

export type ProfileId = "SysML" | "UML" | "SoSE" | "Core TraceGraph" | "Custom";

export type ProfileConnection = {
  relationshipKind: string;
  from: ArtifactType[];
  to: ArtifactType[];
};

type ModelingProfileBase = {
  id: ProfileId;
  label: string;
  description: string;
  artifactTypes: ArtifactType[];
  relationshipKinds: string[];
  defaultViews: string[];
  guidance: string;
};

export type ModelingProfile = ModelingProfileBase & {
  requiredFields: string[];
  optionalFields: string[];
  allowedConnections: ProfileConnection[];
  validationRules: string[];
  diagramNotation: string;
  exportMappings: Record<string, string>;
  contextualHelp: string;
};

const commonTypes: ArtifactType[] = [
  "Requirement",
  "Need",
  "Scenario",
  "Stakeholder",
  "Test",
  "Evidence",
  "Risk",
  "Constraint",
  "Decision",
];

const rawProfiles: Record<ProfileId, ModelingProfileBase> = {
  "Core TraceGraph": {
    id: "Core TraceGraph",
    label: "Core TraceGraph",
    description: "Plain-language requirements and digital-thread workbench.",
    artifactTypes: commonTypes,
    relationshipKinds: [
      "expresses",
      "captures",
      "refines",
      "decomposes",
      "verified-by",
      "produces",
      "depends-on",
    ],
    defaultViews: ["Requirement trace", "Traceability matrix", "Verification"],
    guidance:
      "Start with stakeholder intent, then progressively formalize the trace.",
  },
  SysML: {
    id: "SysML",
    label: "SysML",
    description:
      "Systems-engineering view over requirements, structure, behavior, and allocation.",
    artifactTypes: [
      ...commonTypes,
      "Block",
      "Part",
      "Port",
      "Interface",
      "ValueType",
      "Activity",
      "Action",
      "ObjectFlow",
      "State",
      "Transition",
      "Package",
      "Allocation",
      "ItemFlow",
      "VerificationMethod",
    ],
    relationshipKinds: [
      "refines",
      "decomposes",
      "allocated-to",
      "owns",
      "connects",
      "depends-on",
      "verified-by",
      "produces",
    ],
    defaultViews: [
      "Requirement trace",
      "Block definition",
      "Internal block",
      "Activity",
      "State machine",
      "Allocation matrix",
    ],
    guidance:
      "Formal SysML-oriented projections retain the same canonical IDs and links.",
  },
  UML: {
    id: "UML",
    label: "UML",
    description:
      "UML-oriented behavioral, structural, and interaction projections.",
    artifactTypes: [
      ...commonTypes,
      "Class",
      "Lifeline",
      "Message",
      "DeploymentNode",
      "Actor",
      "UseCase",
      "Component",
      "Package",
      "Activity",
      "Action",
      "State",
      "Transition",
    ],
    relationshipKinds: [
      "uses",
      "depends-on",
      "connects",
      "refines",
      "decomposes",
      "allocated-to",
      "realizes",
      "traces",
    ],
    defaultViews: [
      "Use case",
      "Component",
      "Activity",
      "Sequence",
      "State machine",
      "Package",
    ],
    guidance:
      "UML projections supplement the shared systems model without creating a second metamodel.",
  },
  SoSE: {
    id: "SoSE",
    label: "SoSE",
    description:
      "System-of-systems view for missions, capabilities, ownership, and dependency.",
    artifactTypes: [
      ...commonTypes,
      "SystemOfSystems",
      "SystemOfInterest",
      "Mission",
      "MissionThread",
      "Capability",
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
      "Interface",
      "Block",
    ],
    relationshipKinds: [
      "represents",
      "allocated-to",
      "requires",
      "uses",
      "depends-on",
      "owns",
      "connects",
      "verified-by",
    ],
    defaultViews: [
      "System-of-systems context",
      "Mission thread",
      "Capability allocation",
      "Operational dependency",
      "Cascading impact",
    ],
    guidance:
      "Explain every cross-system impact through dependency and allocation paths.",
  },
  Custom: {
    id: "Custom",
    label: "Custom",
    description: "Saved display profile over the shared canonical vocabulary.",
    artifactTypes: [...commonTypes],
    relationshipKinds: ["depends-on", "refines", "traces", "verified-by"],
    defaultViews: ["Requirement trace", "Custom view"],
    guidance:
      "Custom profiles preserve canonical semantics while allowing project-specific naming.",
  },
};

export const profileIds = Object.keys(rawProfiles) as ProfileId[];

const commonRequiredFields = ["id", "name", "description", "status"];
const commonOptionalFields = [
  "maturity",
  "owner",
  "priority",
  "criticality",
  "tags",
  "source",
  "createdAt",
  "updatedAt",
  "version",
  "baseline",
  "reviewStatus",
  "auditHistory",
  "metadata",
];

export const profileRegistry = Object.fromEntries(
  profileIds.map((profileId) => {
    const profile = rawProfiles[profileId];
    return [
      profileId,
      {
        ...profile,
        requiredFields: commonRequiredFields,
        optionalFields: commonOptionalFields,
        allowedConnections: profile.relationshipKinds.map(
          (relationshipKind) => ({
            relationshipKind,
            from: profile.artifactTypes,
            to: profile.artifactTypes,
          }),
        ),
        validationRules: [
          "Artifact IDs must remain stable within a project.",
          "Relationship endpoints must reference canonical artifacts.",
          `${profile.label} relationship kinds remain reviewable and extensible.`,
        ],
        diagramNotation:
          profileId === "Core TraceGraph" || profileId === "Custom"
            ? "Simplified canonical notation"
            : `${profile.label}-oriented practical subset notation`,
        exportMappings: {
          json: "TraceGraph ProjectBundle",
          mermaid: "Labeled Mermaid flowchart approximation",
          svg: "Canonical SVG view",
          png: "Rasterized canonical SVG view",
        },
        contextualHelp: profile.guidance,
      },
    ];
  }),
) as unknown as Record<ProfileId, ModelingProfile>;
