import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

const baseURL = process.env.DEMO_BASE_URL || "http://127.0.0.1:4173";
const outputDir = path.resolve("demo/video");
const recordingsDir = path.join(outputDir, ".recordings");
const outputPath = path.join(outputDir, "tracegraph-live-demo.webm");

await fs.mkdir(recordingsDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  recordVideo: { dir: recordingsDir, size: { width: 1440, height: 900 } },
  colorScheme: "dark",
});
const page = await context.newPage();
const hold = (ms = 1500) => page.waitForTimeout(ms);
const nav = () => page.locator('nav[aria-label="Primary navigation"]');

const setCaption = async (text) => {
  await page.evaluate((caption) => {
    let node = document.getElementById("tracegraph-demo-caption");
    if (!node) {
      node = document.createElement("div");
      node.id = "tracegraph-demo-caption";
      Object.assign(node.style, {
        position: "fixed",
        left: "50%",
        bottom: "20px",
        transform: "translateX(-50%)",
        zIndex: "99999",
        padding: "10px 14px",
        borderRadius: "999px",
        background: "rgba(4, 12, 17, 0.88)",
        border: "1px solid rgba(140, 190, 215, 0.35)",
        color: "#edf5f7",
        font: "600 13px/1.2 ui-monospace, SFMono-Regular, Menlo, monospace",
        boxShadow: "0 10px 30px rgba(0,0,0,.28)",
        pointerEvents: "none",
      });
      document.body.appendChild(node);
    }
    node.textContent = caption;
  }, text);
};

try {
  await page.goto(baseURL, { waitUntil: "networkidle" });
  await setCaption("TraceGraph · deterministic synthetic demo");
  await hold(2200);

  await page.getByRole("button", { name: "Explore sample" }).click();
  await page
    .getByRole("heading", { name: /From stakeholder need to verified evidence/i })
    .waitFor();
  await setCaption("Emergency Response Drone · one canonical digital thread");
  await hold(2200);

  await nav().getByRole("button", { name: /Requirements/ }).click();
  await page
    .getByRole("button", { name: "REQ-042 Mission telemetry availability" })
    .click();
  await page.getByLabel("Requirement statement").waitFor();
  await page.getByLabel("Requirement statement").scrollIntoViewIfNeeded();
  await setCaption("Requirement · provenance, quality, lifecycle, version context");
  await hold(2500);

  await nav().getByRole("button", { name: /Traceability/ }).click();
  await page.getByRole("heading", { name: /digital thread/i }).waitFor();
  await setCaption("Traceability · canonical relationships stay inspectable");
  await hold(2500);

  await nav().getByRole("button", { name: /Verification/ }).click();
  const verificationHeading = page.getByRole("heading", { name: "Requirement to evidence" });
  await verificationHeading.waitFor();
  await verificationHeading.scrollIntoViewIfNeeded();
  await setCaption("Verification · requirement-to-evidence chain");
  await hold(2500);

  await nav().getByRole("button", { name: /Impact/ }).click();
  await page.getByRole("button", { name: "Run impact simulation" }).click();
  await page.getByText("Potentially affected artifacts").waitFor();
  await setCaption("Change impact · inspect consequences before applying change");
  await hold(2500);

  await page.getByRole("button", { name: "Thread intelligence", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Engineering intelligence workbench" });
  await dialog.waitFor();
  await setCaption("Thread intelligence · deeper engineering evidence");
  await hold(1800);

  await dialog.getByRole("button", { name: "Impact", exact: true }).click();
  await dialog
    .getByRole("heading", { name: /Follow the reason for every consequence/i })
    .waitFor();
  await setCaption("Explainable impact · direction, rationale, confidence, provenance");
  await hold(2500);

  await dialog.getByRole("button", { name: "Trace queries" }).click();
  await dialog
    .getByRole("button", { name: "show every path from REQ-042 to EVD-017" })
    .click();
  await dialog.getByText(/directed paths found from REQ-042 to EVD-017/i).waitFor();
  await setCaption("Deterministic trace query · unsupported questions are refused");
  await hold(2500);

  await dialog.getByRole("button", { name: "Evidence validity" }).click();
  await dialog.getByRole("heading", { name: "Existence is not validity" }).waitFor();
  await setCaption("Evidence validity · valid, stale, review-needed, incomplete, superseded");
  await hold(2500);

  await dialog.getByRole("button", { name: "Elicitation", exact: true }).click();
  await dialog
    .getByRole("button", { name: "Extract candidate engineering records" })
    .click();
  await dialog.getByText("SUGGESTED · NOT CANONICAL").first().waitFor();
  await setCaption("Elicitation · suggestions remain non-canonical until accepted");
  await hold(3000);

  await setCaption("TraceGraph · make the digital thread inspectable");
  await hold(2200);

  const video = page.video();
  await context.close();
  if (!video) throw new Error("Playwright did not produce a video object");
  await video.saveAs(outputPath);
} finally {
  await browser.close();
  await fs.rm(recordingsDir, { recursive: true, force: true });
}

const stats = await fs.stat(outputPath);
if (stats.size < 100_000) throw new Error(`Demo video is unexpectedly small: ${stats.size} bytes`);
console.log(`Saved ${outputPath} (${stats.size} bytes)`);
