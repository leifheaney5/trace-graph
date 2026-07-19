import type { Artifact, ProjectMetadata, Relation } from "./model";

export interface SampleProject {
  metadata: ProjectMetadata;
  artifacts: Artifact[];
  relations: Relation[];
}

// ============================================================================
// SAMPLE 1: Emergency Response Drone (exported separately in model.ts)
// ============================================================================

// ============================================================================
// SAMPLE 2: Medical Device Verification
// ============================================================================
export const medicalDeviceMetadata: ProjectMetadata = {
  name: "Infusion Pump Verification",
  mission:
    "Deliver safe, accurate medication delivery through verified infusion pump control software.",
  problemStatement:
    "Healthcare providers need trustworthy evidence that infusion pumps meet regulatory safety and efficacy requirements.",
  owner: "Medical Device Systems Team",
  version: "1.0.0",
  systemBoundary:
    "Infusion pump firmware and safety-critical control algorithms.",
  systemOfInterest: "Portable smart infusion pump",
  intendedOutcomes:
    "FDA/CE-marked medical device with complete traceability and verification evidence.",
  inScope:
    "Pump control, drug library, alarm management, connectivity, and verification.",
  outOfScope:
    "Mechanical pump design, display hardware, wireless regulatory certification.",
  knownConstraints:
    "Real-time performance, battery-backed operation, clinical validation.",
  assumptions:
    "Healthcare providers are trained on device operation and maintenance.",
  dependencies: "Drug database, regulatory guidance (FDA 21 CFR Part 11), hospital IT.",
  reviewMilestones:
    "Requirements review; design review; verification protocol approval; regulatory submission.",
  initialStakeholders:
    "Clinical engineer; regulatory affairs; QA; hospital IT leadership.",
};

export const medicalDeviceArtifacts: Artifact[] = [
  // Stakeholders
  {
    id: "SH-001",
    type: "Stakeholder",
    name: "Clinical Engineer",
    description: "Hospital biomedical engineering department",
    status: "Active",
  },
  {
    id: "SH-002",
    type: "Stakeholder",
    name: "Regulatory Affairs",
    description: "Medical device compliance and submission lead",
    status: "Active",
  },
  {
    id: "SH-003",
    type: "Stakeholder",
    name: "QA Lead",
    description: "Quality assurance and verification authority",
    status: "Active",
  },

  // Needs
  {
    id: "NEED-001",
    type: "Need",
    name: "Safe medication delivery",
    description: "Hospital clinicians need accurate drug delivery without overdose risk",
    status: "Approved",
  },
  {
    id: "NEED-002",
    type: "Need",
    name: "Alarm and fail-safe",
    description: "Clinical staff need immediate notification of any pump malfunction",
    status: "Approved",
  },
  {
    id: "NEED-003",
    type: "Need",
    name: "Drug library compliance",
    description: "Pharmacy needs verification that only approved drugs can be selected",
    status: "Approved",
  },

  // Requirements
  {
    id: "REQ-001",
    type: "Requirement",
    name: "Dose accuracy",
    description: "The pump shall deliver medication within ±5% of prescribed dose",
    status: "Approved",
    structure: {
      actor: "Infusion pump",
      action: "deliver",
      object: "medication dose",
      condition: "as prescribed",
      threshold: "5%",
      unit: "percent error",
      rationale: "Clinical safety margin for medication efficacy",
    },
  },
  {
    id: "REQ-002",
    type: "Requirement",
    name: "Occlusion detection",
    description: "The pump shall detect line occlusion within 30 seconds",
    status: "Approved",
    structure: {
      actor: "Pump occlusion sensor",
      action: "detect",
      object: "IV line blockage",
      condition: "during active infusion",
      threshold: "30",
      unit: "seconds",
      rationale: "Prevent tissue damage from pressure buildup",
    },
  },
  {
    id: "REQ-003",
    type: "Requirement",
    name: "Drug library validation",
    description: "The pump shall only allow selection of drugs in the approved library",
    status: "Approved",
    structure: {
      actor: "Drug selection interface",
      action: "restrict",
      object: "selectable drugs",
      condition: "upon startup and daily",
      threshold: "100%",
      unit: "coverage",
      rationale: "Prevent accidental selection of contraindicated drugs",
    },
  },
  {
    id: "REQ-004",
    type: "Requirement",
    name: "Audit trail recording",
    description: "The pump shall record all configuration changes with timestamp and user ID",
    status: "Approved",
    structure: {
      actor: "Pump firmware",
      action: "log",
      object: "configuration changes",
      condition: "for every change event",
      threshold: "100%",
      unit: "change coverage",
      rationale: "Meet FDA 21 CFR Part 11 electronic record requirements",
    },
  },

  // Architecture Components
  {
    id: "BLK-001",
    type: "Block",
    name: "Pump Control Module",
    description: "Core firmware controlling pump motor and sensors",
    status: "Design",
  },
  {
    id: "BLK-002",
    type: "Block",
    name: "Drug Library Engine",
    description: "Database and validation engine for drug constraints",
    status: "Design",
  },
  {
    id: "BLK-003",
    type: "Block",
    name: "Safety Monitor",
    description: "Watchdog and alarm management subsystem",
    status: "Design",
  },
  {
    id: "BLK-004",
    type: "Block",
    name: "Audit Logger",
    description: "Non-repudiable event recording and attestation",
    status: "Design",
  },

  // Verification Test Cases
  {
    id: "TST-001",
    type: "Test",
    name: "Dose accuracy bench test",
    description: "Measure pump output against known flow rates",
    status: "Ready",
    verification: {
      method: "Test",
      objective: "Verify dose delivery accuracy",
      preconditions: "Pump calibrated, test fluid prepared",
      procedure: "Deliver 10 mL/hr for 60 minutes, measure actual",
      expectedResult: "Measured volume 9.5–10.5 mL",
      actualResult: "",
      owner: "QA Lab",
      environment: "Controlled lab, 20–25°C",
      version: "1.0",
      baseline: "Draft",
    },
  },
  {
    id: "TST-002",
    type: "Test",
    name: "Occlusion detection functional test",
    description: "Simulate line blockage and verify alarm response",
    status: "Ready",
    verification: {
      method: "Simulation",
      objective: "Verify occlusion detection time",
      preconditions: "Pump primed, infusion running",
      procedure: "Introduce resistance, monitor pressure rise and alarm response",
      expectedResult: "Alarm within 30 seconds",
      actualResult: "",
      owner: "QA Lab",
      environment: "Test bench with pressure simulator",
      version: "1.0",
      baseline: "Draft",
    },
  },
  {
    id: "TST-003",
    type: "Test",
    name: "Drug library compliance check",
    description: "Verify only approved drugs selectable",
    status: "Ready",
    verification: {
      method: "Inspection",
      objective: "Verify drug library content",
      preconditions: "Fresh pump startup",
      procedure: "Query drug database, cross-reference approved list",
      expectedResult: "100% match with approved drug formulary",
      actualResult: "",
      owner: "Pharmacy QA",
      environment: "Lab environment",
      version: "1.0",
      baseline: "Draft",
    },
  },
  {
    id: "TST-004",
    type: "Test",
    name: "Audit trail completeness test",
    description: "Verify all changes recorded with timestamp",
    status: "Ready",
    verification: {
      method: "Analysis",
      objective: "Verify audit log captures all configuration changes",
      preconditions: "Pump in service mode",
      procedure: "Make 50 configuration changes, audit log extraction",
      expectedResult: "50 entries with timestamps and user ID",
      actualResult: "",
      owner: "Security QA",
      environment: "Lab environment",
      version: "1.0",
      baseline: "Draft",
    },
  },

  // Evidence
  {
    id: "EVD-001",
    type: "Evidence",
    name: "Dose accuracy test report",
    description: "Lab report from accuracy bench testing",
    status: "Draft",
    source: "QA Lab Report QA-2026-001",
  },
  {
    id: "EVD-002",
    type: "Evidence",
    name: "Occlusion detection report",
    description: "Test results from occlusion simulation",
    status: "Draft",
    source: "QA Lab Report QA-2026-002",
  },
  {
    id: "EVD-003",
    type: "Evidence",
    name: "Drug library audit",
    description: "Pharmacy cross-reference audit against official formulary",
    status: "Draft",
    source: "Pharmacy Report PHARM-2026-001",
  },
  {
    id: "EVD-004",
    type: "Evidence",
    name: "Audit log analysis",
    description: "Cryptographic verification of audit trail integrity",
    status: "Draft",
    source: "Security Report SEC-2026-001",
  },
];

export const medicalDeviceRelations: Relation[] = [
  // Needs to Requirements
  { from: "NEED-001", to: "REQ-001", kind: "refines" },
  { from: "NEED-001", to: "REQ-002", kind: "refines" },
  { from: "NEED-002", to: "REQ-002", kind: "refines" },
  { from: "NEED-003", to: "REQ-003", kind: "refines" },

  // Requirements to Architecture
  { from: "REQ-001", to: "BLK-001", kind: "allocated-to" },
  { from: "REQ-002", to: "BLK-001", kind: "allocated-to" },
  { from: "REQ-002", to: "BLK-003", kind: "allocated-to" },
  { from: "REQ-003", to: "BLK-002", kind: "allocated-to" },
  { from: "REQ-004", to: "BLK-004", kind: "allocated-to" },

  // Requirements to Tests
  { from: "REQ-001", to: "TST-001", kind: "verified-by" },
  { from: "REQ-002", to: "TST-002", kind: "verified-by" },
  { from: "REQ-003", to: "TST-003", kind: "verified-by" },
  { from: "REQ-004", to: "TST-004", kind: "verified-by" },

  // Tests to Evidence
  { from: "TST-001", to: "EVD-001", kind: "produces" },
  { from: "TST-002", to: "EVD-002", kind: "produces" },
  { from: "TST-003", to: "EVD-003", kind: "produces" },
  { from: "TST-004", to: "EVD-004", kind: "produces" },

  // Stakeholders to Needs
  { from: "SH-001", to: "NEED-001", kind: "concerns" },
  { from: "SH-002", to: "NEED-003", kind: "concerns" },
  { from: "SH-003", to: "NEED-002", kind: "concerns" },
];

// ============================================================================
// SAMPLE 3: Cloud Services Architecture
// ============================================================================
export const cloudServicesMetadata: ProjectMetadata = {
  name: "Cloud Platform Resilience",
  mission:
    "Deliver resilient, scalable cloud infrastructure for SaaS platform with verified uptime and data protection.",
  problemStatement:
    "Cloud platform operators need evidence that multi-region services meet availability, latency, and data protection requirements without manual failover.",
  owner: "Infrastructure & Reliability Team",
  version: "2.1.0",
  systemBoundary:
    "Cloud platform compute, storage, networking, and orchestration layers.",
  systemOfInterest: "Global SaaS platform on cloud infrastructure",
  intendedOutcomes:
    "99.99% availability, <100ms latency, zero-trust data protection, auditable compliance.",
  inScope:
    "Compute resilience, storage replication, network redundancy, security, observability.",
  outOfScope:
    "Customer application logic, third-party SaaS integrations, endpoint security.",
  knownConstraints:
    "Multi-region consistency, cost optimization, deployment speed.",
  assumptions:
    "Operators have access to cloud provider APIs and monitoring tools.",
  dependencies:
    "Cloud provider SLAs, DNS infrastructure, certificate authorities, monitoring systems.",
  reviewMilestones:
    "Architecture review; resilience design review; security review; production readiness.",
  initialStakeholders:
    "Platform engineer; DevOps lead; security architect; compliance officer.",
};

export const cloudServicesArtifacts: Artifact[] = [
  // Stakeholders
  {
    id: "SH-101",
    type: "Stakeholder",
    name: "Platform Engineers",
    description: "Service development and deployment team",
    status: "Active",
  },
  {
    id: "SH-102",
    type: "Stakeholder",
    name: "DevOps Lead",
    description: "Infrastructure operations and reliability",
    status: "Active",
  },
  {
    id: "SH-103",
    type: "Stakeholder",
    name: "Security Architect",
    description: "Cloud security and compliance authority",
    status: "Active",
  },

  // Needs
  {
    id: "NEED-101",
    type: "Need",
    name: "Continuous service availability",
    description: "Platform operators need services to remain available during zone failures",
    status: "Approved",
  },
  {
    id: "NEED-102",
    type: "Need",
    name: "Fast failover",
    description: "Operations need automatic failover without manual intervention",
    status: "Approved",
  },
  {
    id: "NEED-103",
    type: "Need",
    name: "Data security",
    description: "Security team needs end-to-end encryption and access audit trails",
    status: "Approved",
  },

  // Requirements
  {
    id: "REQ-101",
    type: "Requirement",
    name: "Multi-region availability",
    description: "The platform shall remain available across at least 3 geographic regions",
    status: "Approved",
    structure: {
      actor: "Cloud platform",
      action: "maintain",
      object: "service availability",
      condition: "across region failures",
      threshold: "3",
      unit: "regions",
      rationale: "Protect against regional outages and natural disasters",
    },
  },
  {
    id: "REQ-102",
    type: "Requirement",
    name: "Automatic failover",
    description: "The platform shall detect failures and redirect traffic within 30 seconds",
    status: "Approved",
    structure: {
      actor: "Load balancer",
      action: "detect and redirect",
      object: "traffic",
      condition: "on endpoint failure",
      threshold: "30",
      unit: "seconds",
      rationale: "Minimize service disruption and data loss",
    },
  },
  {
    id: "REQ-103",
    type: "Requirement",
    name: "Data replication",
    description: "Customer data shall be replicated synchronously to at least 2 regions",
    status: "Approved",
    structure: {
      actor: "Storage layer",
      action: "replicate",
      object: "customer data",
      condition: "on every write",
      threshold: "2",
      unit: "regions",
      rationale: "Prevent data loss during region failures",
    },
  },
  {
    id: "REQ-104",
    type: "Requirement",
    name: "Encryption in transit",
    description: "All network traffic shall be encrypted with TLS 1.3 or later",
    status: "Approved",
    structure: {
      actor: "Network layer",
      action: "encrypt",
      object: "all traffic",
      condition: "for every connection",
      threshold: "100%",
      unit: "coverage",
      rationale: "Meet data protection compliance requirements",
    },
  },
  {
    id: "REQ-105",
    type: "Requirement",
    name: "Access audit logging",
    description: "The system shall log all data access with user identity and timestamp",
    status: "Approved",
    structure: {
      actor: "Security system",
      action: "log",
      object: "all data access",
      condition: "for every access",
      threshold: "100%",
      unit: "event coverage",
      rationale: "Support compliance audits and forensic analysis",
    },
  },

  // Architecture Components
  {
    id: "BLK-101",
    type: "Block",
    name: "Global Load Balancer",
    description: "Geo-distributed traffic steering and health checking",
    status: "Design",
  },
  {
    id: "BLK-102",
    type: "Block",
    name: "Compute Cluster",
    description: "Container orchestration and auto-scaling",
    status: "Design",
  },
  {
    id: "BLK-103",
    type: "Block",
    name: "Data Layer",
    description: "Multi-region database with replication",
    status: "Design",
  },
  {
    id: "BLK-104",
    type: "Block",
    name: "Security & Auth",
    description: "Identity, access control, and encryption",
    status: "Design",
  },
  {
    id: "BLK-105",
    type: "Block",
    name: "Observability",
    description: "Monitoring, logging, and alerting platform",
    status: "Design",
  },

  // Tests
  {
    id: "TST-101",
    type: "Test",
    name: "Region failover test",
    description: "Simulate region failure and verify automatic traffic redirection",
    status: "Ready",
    verification: {
      method: "Test",
      objective: "Verify failover performance and completeness",
      preconditions: "Multi-region deployment active",
      procedure: "Isolate primary region, monitor traffic shift",
      expectedResult: "Traffic redirected within 30 seconds, zero connection loss",
      actualResult: "",
      owner: "DevOps QA",
      environment: "Production-like staging environment",
      version: "1.0",
      baseline: "Draft",
    },
  },
  {
    id: "TST-102",
    type: "Test",
    name: "Data replication consistency test",
    description: "Verify data arrives in secondary regions within RPO target",
    status: "Ready",
    verification: {
      method: "Test",
      objective: "Verify synchronous replication completion",
      preconditions: "Multi-region database active",
      procedure: "Write to primary, query secondaries, measure latency",
      expectedResult: "Replication completes within 100ms across all regions",
      actualResult: "",
      owner: "Database QA",
      environment: "Staging environment with network simulation",
      version: "1.0",
      baseline: "Draft",
    },
  },
  {
    id: "TST-103",
    type: "Test",
    name: "TLS encryption verification",
    description: "Verify all connections use TLS 1.3 minimum",
    status: "Ready",
    verification: {
      method: "Inspection",
      objective: "Verify encryption protocol compliance",
      preconditions: "Platform in service",
      procedure: "Scan all endpoints, verify certificate and protocol version",
      expectedResult: "100% of connections use TLS 1.3 or later",
      actualResult: "",
      owner: "Security QA",
      environment: "Production systems",
      version: "1.0",
      baseline: "Draft",
    },
  },
  {
    id: "TST-104",
    type: "Test",
    name: "Audit log integrity test",
    description: "Verify audit logs capture all access events with integrity",
    status: "Ready",
    verification: {
      method: "Analysis",
      objective: "Verify audit trail completeness and integrity",
      preconditions: "System with audit logging enabled",
      procedure: "Perform data access, verify logs captured with signature",
      expectedResult: "100% event capture, cryptographic signature verification",
      actualResult: "",
      owner: "Compliance QA",
      environment: "Staging environment",
      version: "1.0",
      baseline: "Draft",
    },
  },

  // Evidence
  {
    id: "EVD-101",
    type: "Evidence",
    name: "Failover test report",
    description: "Results from multi-region failover simulation",
    status: "Draft",
    source: "DevOps Report DO-2026-001",
  },
  {
    id: "EVD-102",
    type: "Evidence",
    name: "Replication analysis",
    description: "Network measurement data for replication latency",
    status: "Draft",
    source: "Database Report DB-2026-001",
  },
  {
    id: "EVD-103",
    type: "Evidence",
    name: "TLS compliance scan",
    description: "SSL/TLS configuration audit report",
    status: "Draft",
    source: "Security Report SEC-2026-002",
  },
  {
    id: "EVD-104",
    type: "Evidence",
    name: "Audit log verification",
    description: "Cryptographic verification and completeness analysis",
    status: "Draft",
    source: "Compliance Report COMP-2026-001",
  },
];

export const cloudServicesRelations: Relation[] = [
  // Needs to Requirements
  { from: "NEED-101", to: "REQ-101", kind: "refines" },
  { from: "NEED-102", to: "REQ-102", kind: "refines" },
  { from: "NEED-103", to: "REQ-103", kind: "refines" },
  { from: "NEED-103", to: "REQ-104", kind: "refines" },
  { from: "NEED-103", to: "REQ-105", kind: "refines" },

  // Requirements to Architecture
  { from: "REQ-101", to: "BLK-101", kind: "allocated-to" },
  { from: "REQ-101", to: "BLK-102", kind: "allocated-to" },
  { from: "REQ-102", to: "BLK-101", kind: "allocated-to" },
  { from: "REQ-103", to: "BLK-103", kind: "allocated-to" },
  { from: "REQ-104", to: "BLK-104", kind: "allocated-to" },
  { from: "REQ-105", to: "BLK-104", kind: "allocated-to" },

  // Requirements to Tests
  { from: "REQ-101", to: "TST-101", kind: "verified-by" },
  { from: "REQ-102", to: "TST-101", kind: "verified-by" },
  { from: "REQ-103", to: "TST-102", kind: "verified-by" },
  { from: "REQ-104", to: "TST-103", kind: "verified-by" },
  { from: "REQ-105", to: "TST-104", kind: "verified-by" },

  // Tests to Evidence
  { from: "TST-101", to: "EVD-101", kind: "produces" },
  { from: "TST-102", to: "EVD-102", kind: "produces" },
  { from: "TST-103", to: "EVD-103", kind: "produces" },
  { from: "TST-104", to: "EVD-104", kind: "produces" },

  // Stakeholders to Needs
  { from: "SH-101", to: "NEED-101", kind: "concerns" },
  { from: "SH-102", to: "NEED-102", kind: "concerns" },
  { from: "SH-103", to: "NEED-103", kind: "concerns" },
];
