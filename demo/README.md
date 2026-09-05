# TraceGraph Demo Package

This directory is the self-contained showcase bundle for TraceGraph.

TraceGraph is a local-first requirements engineering and digital-thread workbench built around one canonical flow:

**stakeholder intent → elicitation → need → requirement → architecture → verification → evidence → change impact → baseline**

The demo package uses only deterministic synthetic data from the included **Emergency Response Drone** sample. It does not represent a customer deployment, certification, compliance result, productivity study, or operational program.

## Contents

- [`index.html`](index.html) — standalone marketing/demo page that can be opened locally or hosted as static content.
- [`video/tracegraph-live-demo.webm`](video/tracegraph-live-demo.webm) — reproducible browser-recorded product walkthrough generated from the real application.
- [`screenshots/`](screenshots/) — 13 curated product screenshots covering the core workflow and Thread intelligence views.
- [`marketing/one-pager.md`](marketing/one-pager.md) — concise product one-pager.
- [`marketing/messaging.md`](marketing/messaging.md) — positioning, elevator pitch, proof points, and claim boundaries.
- [`marketing/social-copy.md`](marketing/social-copy.md) — ready-to-adapt launch/social copy.
- [`marketing/demo-script.md`](marketing/demo-script.md) — presenter talk track for a 2–5 minute walkthrough.
- [`record-demo.mjs`](record-demo.mjs) — reproducible Playwright recorder used to produce the live demo video.

## Re-record the demo locally

From the repository root:

```bash
npm ci
npx playwright install chromium
npm run dev -- --host 127.0.0.1 --port 4173
```

In a second shell:

```bash
node demo/record-demo.mjs
```

The recorder writes `demo/video/tracegraph-live-demo.webm` and intentionally drives the same deterministic sample and user-visible controls used by the automated end-to-end suite.

## Recommended use

For a portfolio or case-study review, open `demo/index.html`, play the recorded walkthrough, then use the screenshots for deeper inspection. For a live presentation, follow `marketing/demo-script.md` while running the application locally.

## Evidence boundaries

The demo is intended to show product behavior, interaction design, engineering-model semantics, and inspectability. Synthetic labels remain explicit. SysML/UML/SoSE views are practical projections rather than standards-conformance claims. Evidence-validity signals are structural provenance/freshness assessments rather than cryptographic attestation or certification judgments.
