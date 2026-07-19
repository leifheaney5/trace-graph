# ADR 0001: Modular monolith

## Status

Accepted

## Decision

Keep the initial application as a small React modular monolith. Canonical model logic is isolated from workflow views so persistence and richer profiles can evolve without introducing service boundaries prematurely.

## Consequences

The demo is easy to run locally and inspect, while larger-scale collaboration and server persistence remain future adapters.
