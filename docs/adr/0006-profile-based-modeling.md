# ADR 0006: Profile-based modeling views

## Status

Accepted for the local-first MVP

## Context

TraceGraph must support SysML-oriented, UML-oriented, and system-of-systems
work without maintaining disconnected copies of the same engineering model.
The initial metamodel is intentionally smaller than a complete standards
implementation.

## Decision

Represent profile selection as a view over shared canonical artifact types and
relationship kinds. SysML emphasizes requirements, blocks, interfaces, and
allocation; UML derives actors, use cases, and behavior-oriented views; SoSE
adds missions, capabilities, constituent-system metadata, ownership, and
dependencies. Each view must expose canonical IDs and explain its derivation.

## Alternatives considered

- Separate metamodel per notation: would duplicate identity and make
  cross-profile traceability difficult.
- A single notation-only view: would make progressive formalization and SoSE
  analysis less approachable.
- Claiming full standards compliance immediately: would be inaccurate for the
  compact MVP metamodel.

## Consequences

Profile changes remain synchronized because they read the same model. Formal
activity, sequence, state, parametric, and standards-specific semantics remain
roadmap work and are documented as such rather than presented as complete.
