# ADR 0004: Graph visualization approach

## Status

Accepted for the local-first MVP

## Context

TraceGraph needs an inspectable graph alternative while keeping the canonical
artifact and relationship model independent from presentation. The repository
does not currently need a third-party graph runtime to demonstrate bounded
trace traversal, keyboard selection, relationship labels, and exportable text
alternatives.

## Decision

Use accessible, model-derived SVG for the MVP trace and diagram surfaces. Keep
node selection, relationship creation, and layout state separate from canonical
artifacts. Revisit Cytoscape.js or another graph runtime when lazy expansion,
large-graph layout, and multi-select editing become product requirements.

## Alternatives considered

- Cytoscape.js immediately: capable, but adds a substantial dependency before
  the MVP interaction contract and accessibility alternatives are settled.
- Canvas-only rendering: efficient for large scenes, but weakens text
  inspection and keyboard accessibility without a parallel representation.
- Static screenshots: portable, but disconnected from canonical model edits.

## Consequences

The current graph is portable and has a text/relationship alternative, but its
layout is intentionally bounded and not a standards-complete diagram editor.
