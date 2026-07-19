# Testing

The critical workflow test is intentionally end-to-end across the full guest
journey and has a 60-second budget. This is a workflow budget, not a product
performance claim; focused unit, build, and accessibility checks retain their
normal shorter feedback loops.

Run `npm run format:check`, `npm run test`, `npm run lint`, `npm run typecheck`, `npm run test:e2e`, `npm run test:accessibility`, and `npm run build`. The current unit suite has 23 tests covering canonical trace completeness, Mermaid generation, SVG generation, profile and relationship vocabularies, structured quality findings, rationale and escape-clause detection, baseline comparison, and malformed bundle rejection. Playwright covers the guest workflow—including elicitation extraction, need disposition, and quality dismissal paths—and critical/serious accessibility findings.
