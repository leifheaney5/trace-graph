# Demo Video

`tracegraph-live-demo.webm` is generated from the actual TraceGraph application with Playwright. The recorder drives visible UI controls against the deterministic Emergency Response Drone sample; it does not render a separate mock video interface.

To regenerate locally, start the Vite application on `http://127.0.0.1:4173` and run:

```bash
node demo/record-demo.mjs
```

The recording is intentionally silent so it can be reused under narration, embedded in a portfolio page, or paired with `demo/marketing/demo-script.md`.
