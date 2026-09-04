import { expect, test } from "@playwright/test";

test(
  "guest can follow the digital-thread workflow",
  { timeout: 60_000 },
  async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /stakeholder need/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Import project" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "View documentation" }).click();
    await expect(
      page.getByRole("dialog", { name: "Help & glossary" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Close help and glossary" }).click();
    await page.screenshot({
      path: "docs/screenshots/tracegraph-landing.png",
      fullPage: true,
    });

    await page.getByRole("button", { name: "Start five-minute tour" }).click();
    await expect(
      page.getByRole("dialog", { name: /Open a stakeholder need/i }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Next step" }).click();
    await expect(
      page.getByRole("dialog", { name: /Convert intent into a requirement/i }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Dismiss guided tour" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.goto("/");

    await page.getByRole("button", { name: "Open sample project" }).click();
    await page
      .locator(".sample-card")
      .filter({ hasText: "Emergency Response Drone" })
      .click();
    await page
      .locator(".sample-card")
      .filter({ hasText: "Emergency Response Drone" })
      .click();
    await expect(
      page.getByRole("heading", { name: /stakeholder need/i }),
    ).toBeVisible();
    await page.screenshot({
      path: "docs/screenshots/tracegraph-workbench.png",
      fullPage: true,
    });
    await expect(
      page.getByText(/requirements have an architecture allocation/),
    ).toBeVisible();
    await expect(
      page.getByText(/requirements with explainable findings/),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Measured timings" }),
    ).toBeVisible();
    await page.getByLabel("Project name").fill("Emergency Response Program");
    await page.getByRole("button", { name: "Save project framing" }).click();
    await expect(
      page.getByText("Emergency Response Program / Overview"),
    ).toBeVisible();
    await page.getByRole("button", { name: "Help & glossary" }).click();
    await expect(
      page.getByRole("dialog", { name: "Help & glossary" }),
    ).toBeVisible();
    await page.getByLabel("Search glossary").fill("baseline");
    await expect(
      page.getByText("A named, approval-recorded snapshot"),
    ).toBeVisible();
    await page.getByRole("button", { name: "Close help and glossary" }).click();
    await page.getByRole("button", { name: "Engineering" }).click();
    await expect(
      page.getByText(/Engineering mode · dense model controls/),
    ).toBeVisible();
    await page.getByRole("button", { name: "Guided" }).click();
    await expect(page.getByLabel("Export title")).toHaveValue(
      "TraceGraph digital thread",
    );
    await page.getByLabel("PNG scale").selectOption("4");
    await page.getByLabel("PNG background").selectOption("#ffffff");
    const pngDownload = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download PNG" }).click();
    await expect((await pngDownload).suggestedFilename()).toBe(
      "tracegraph-view.png",
    );

    await page
      .locator('nav[aria-label="Primary navigation"]')
      .getByRole("button", { name: /Elicitation/ })
      .click();
    await page
      .getByLabel("Elicitation source notes")
      .fill(
        "The coordinator needs a current search-zone position before dispatching another team.",
      );
    await page.getByLabel("Elicitation source notes").selectText();
    await page.getByLabel("New stakeholder name").fill("Logistics coordinator");
    await page.getByLabel("Stakeholder role").fill("Dispatch liaison");
    await page.getByLabel("Stakeholder authority").fill("Dispatch authority");
    await page.getByLabel("Stakeholder concerns").fill("Stale location data");
    await page.getByRole("button", { name: "Add stakeholder" }).click();
    await expect(
      page.getByLabel("Elicitation source stakeholder"),
    ).toContainText("Logistics coordinator");
    await page.getByLabel("Elicitation method").selectOption("Workshop");
    await page
      .getByLabel("Elicitation objectives")
      .fill("Confirm dispatch information needs.");
    await page
      .getByLabel("Elicitation open questions")
      .fill("What is the acceptable staleness window?");
    await page.getByRole("button", { name: "Save elicitation record" }).click();
    await expect(page.getByText(/ELC-NEW-/)).toBeVisible();
    await page
      .getByLabel("Elicitation extraction type")
      .selectOption("Concern");
    await page
      .getByRole("button", { name: "Extract canonical artifact" })
      .click();
    await expect(page.getByText(/CONCERN-NEW-/)).toBeVisible();
    await page.getByRole("button", { name: "Accept candidate need" }).click();
    await expect(page.getByText("Canonical provenance")).toBeVisible();
    await page.getByLabel("Need disposition").selectOption("Deferred");
    await page
      .getByLabel("Disposition rationale")
      .fill("Awaiting confirmation from the dispatch authority.");
    await page.getByRole("button", { name: "Save need disposition" }).click();
    await page.getByLabel("Need disposition").selectOption("Accepted");
    await page.getByRole("button", { name: "Save need disposition" }).click();
    await page
      .getByRole("button", { name: "Convert need to requirement" })
      .click();
    await expect(
      page.getByRole("heading", { name: "Requirements", exact: true }),
    ).toBeVisible();

    await page
      .locator('nav[aria-label="Primary navigation"]')
      .getByRole("button", { name: /Requirements/ })
      .click();
    await expect(
      page.getByRole("heading", { name: "Requirements", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "REQ-042 Mission telemetry availability" })
      .click();
    const statement = page.getByLabel("Requirement statement");
    await expect(
      page.getByRole("heading", { name: "Formalize the sentence" }),
    ).toBeVisible();
    await expect(page.getByText(/BLK-007 · allocated-to/)).toBeVisible();
    await page.getByLabel("Requirement threshold").fill("1");
    await page.getByLabel("Artifact owner").fill("Mission systems lead");
    await page.getByLabel("Artifact tags").fill("mission, telemetry");
    await expect(page.getByLabel("Artifact owner")).toHaveValue(
      "Mission systems lead",
    );
    await expect(
      page.locator(".generated-sentence").getByText(/within 1 seconds/),
    ).toBeVisible();
    await statement.fill(
      "The system shall report mission state within 1 second.",
    );
    await expect(
      page.getByRole("heading", { name: "Artifact versions" }),
    ).toBeVisible();
    await expect(
      page.locator(".version-history").getByText(/v\d+/).first(),
    ).toBeVisible();
    await page.getByRole("button", { name: "Mark reviewed" }).click();
    await page
      .getByRole("button", { name: "Create child requirement" })
      .click();
    await expect(page.getByText(/Child requirement of REQ-042/)).toBeVisible();
    await page
      .getByLabel("Quality disposition missing-verification-method")
      .selectOption("Dismissed");
    await page
      .getByLabel("Quality dismissal rationale missing-verification-method")
      .fill("Verification will be assigned during the review gate.");
    await page.getByRole("button", { name: "Undo" }).click();
    await page.getByRole("button", { name: "Redo" }).click();

    await page
      .locator('nav[aria-label="Primary navigation"]')
      .getByRole("button", { name: /Traceability/ })
      .click();
    await expect(
      page.getByRole("heading", { name: /digital thread/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Select REQ-042" }),
    ).toBeVisible();
    await page.getByLabel("Trace direction").selectOption("outgoing");
    await page.getByLabel("Trace depth").selectOption("2");
    await page.getByLabel("Trace relationship").selectOption("verified-by");
    await page.getByLabel("Excluded artifact types").selectOption("Evidence");
    await page.getByRole("button", { name: "Zoom in" }).click();
    await page.getByRole("button", { name: "Pan graph right" }).click();
    await page.getByRole("button", { name: "Isolate subgraph" }).click();
    await page.getByRole("button", { name: "Reset view" }).click();
    await page.getByRole("button", { name: "Save trace" }).click();
    await expect(
      page.getByText("Saved trace perspective", { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Create diagram from trace" })
      .click();
    await expect(
      page.getByRole("heading", {
        name: "Emergency response requirement view",
      }),
    ).toBeVisible();
    await page
      .locator('nav[aria-label="Primary navigation"]')
      .getByRole("button", { name: /Traceability/ })
      .click();
    await expect(page.getByText("Trace matrix")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Coverage by relationship" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Download .mmd" }).click();
    await expect(
      page.getByRole("heading", {
        name: "Add relationship from selected artifact",
      }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Add matrix relationship" }).click();

    await page
      .locator('nav[aria-label="Primary navigation"]')
      .getByRole("button", { name: /Baselines/ })
      .click();
    await page.getByLabel("Baseline name").fill("Baseline 1.2");
    await page.getByLabel("Baseline approver").fill("Review board");
    await page.getByRole("button", { name: "Create baseline" }).click();
    await expect(
      page.getByRole("heading", { name: "Baseline 1.2" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Compare baselines" }),
    ).toBeVisible();
    const baselineComparisonDownload = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Export comparison package" })
      .click();
    await expect(
      (await baselineComparisonDownload).suggestedFilename(),
    ).toContain("tracegraph-Baseline");
    await expect(
      page.getByRole("heading", { name: "Recent model changes" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Canonical link changes" }),
    ).toBeVisible();
    await page
      .getByLabel("Bulk archive artifact type")
      .selectOption({ label: "Requirement" });
    await page.getByRole("button", { name: "Preview archive" }).click();
    await expect(
      page.locator(".bulk-operation-panel [role=status]"),
    ).toContainText("artifacts selected");
    await expect(page.getByText("model.undo")).toBeVisible();
    await expect(page.getByText("FROZEN BASELINE").first()).toBeVisible();

    await page.getByRole("button", { name: "Export project" }).click();

    const importFile = {
      name: "import-preview.json",
      mimeType: "application/json",
      buffer: Buffer.from(
        JSON.stringify({
          version: 1,
          artifacts: [
            {
              id: "REQ-IMPORT",
              type: "Requirement",
              name: "Imported requirement",
              description:
                "The system shall verify imported data within 1 second.",
              status: "Draft",
            },
          ],
          relations: [],
        }),
      ),
    };
    await page.locator('input[type="file"]').setInputFiles(importFile);
    await expect(
      page.getByRole("heading", { name: "Review project replacement" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Import change summary" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Cancel import" }).last().click();
    await expect(
      page.getByRole("heading", { name: "Review project replacement" }),
    ).toHaveCount(0);

    await page
      .locator('nav[aria-label="Primary navigation"]')
      .getByRole("button", { name: /Verification/ })
      .click();
    await expect(
      page.getByRole("heading", { name: "Requirement to evidence" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Case details" }),
    ).toBeVisible();
    await page.getByLabel("Verification method").selectOption("Inspection");
    await expect(page.getByLabel("Verification method")).toHaveValue(
      "Inspection",
    );
    await page
      .getByLabel("Verification owner")
      .fill("Systems verification lead");
    await expect(page.getByLabel("Verification owner")).toHaveValue(
      "Systems verification lead",
    );
    await page.getByLabel("Evidence package").selectOption("EVD-018");
    await page.getByRole("button", { name: "Attach evidence" }).click();
    await expect(
      page.getByRole("button", { name: "Evidence attached" }),
    ).toBeDisabled();
    await page
      .getByRole("button", { name: "Create verification case" })
      .click();
    await expect(
      page.getByRole("cell", {
        name: /TST-NEW-181 · New verification test 181/,
      }),
    ).toBeVisible();

    await page
      .locator('nav[aria-label="Primary navigation"]')
      .getByRole("button", { name: /Reviews/ })
      .click();
    await expect(
      page.getByRole("heading", { name: "Review sessions" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "New review" }).click();
    await page.getByLabel("Review chair").fill("Chief systems engineer");
    await page
      .getByLabel("Review disposition")
      .selectOption("Accepted with actions");
    await page.getByRole("button", { name: "Add review link" }).click();
    await expect(page.getByText(/linked/)).toBeVisible();
    await page.getByRole("button", { name: "Complete review" }).click();
    await expect(page.getByText("Completed").first()).toBeVisible();

    await page
      .locator('nav[aria-label="Primary navigation"]')
      .getByRole("button", { name: /Architecture/ })
      .click();
    await expect(
      page.getByRole("heading", { name: "Mission telemetry architecture" }),
    ).toBeVisible();
    await page.getByLabel("SysML view").selectOption({ label: "Requirements" });
    await expect(
      page.getByRole("heading", { name: "SysML requirements view" }),
    ).toBeVisible();
    await page.getByLabel("SysML view").selectOption({ label: "Allocation" });
    await expect(
      page.getByRole("heading", { name: "SysML allocation matrix" }),
    ).toBeVisible();
    await page
      .getByLabel("SysML view")
      .selectOption({ label: "Internal block" });
    await page.getByRole("button", { name: /UML compatibility/ }).click();
    await expect(
      page.getByRole("heading", { name: "Response mission behavior" }),
    ).toBeVisible();
    await page.getByLabel("UML view").selectOption({ label: "Component" });
    await expect(
      page.getByRole("heading", { name: "Canonical component view" }),
    ).toBeVisible();
    await page.getByLabel("UML view").selectOption({ label: "Sequence" });
    await expect(
      page.getByRole("heading", { name: "Canonical sequence messages" }),
    ).toBeVisible();
    await page.getByLabel("UML view").selectOption({ label: "Use case" });
    await expect(
      page.locator(".profile-diagram").getByText(/CAP-001/),
    ).toBeVisible();
    await page.getByRole("button", { name: "Connect actor" }).click();
    await page.getByRole("button", { name: /SoSE analysis/ }).click();
    await expect(
      page.getByRole("heading", { name: "Constituent system mission thread" }),
    ).toBeVisible();
    await page.getByLabel("SoSE view").selectOption({
      label: "Capability allocation",
    });
    await expect(
      page.getByRole("heading", {
        name: "Capability-to-system allocation matrix",
      }),
    ).toBeVisible();
    await page.getByLabel("SoSE view").selectOption({
      label: "Operational dependencies",
    });
    await expect(
      page.getByRole("heading", { name: "Operational dependency graph" }),
    ).toBeVisible();
    await page
      .getByLabel("SoSE view")
      .selectOption({ label: "Cascading impact" });
    await expect(
      page.getByRole("heading", {
        name: "System-of-systems cascading impact",
      }),
    ).toBeVisible();
    await page
      .getByLabel("SoSE view")
      .selectOption({ label: "Mission thread" });
    await expect(
      page.getByRole("heading", { name: "SOS-001", exact: true }),
    ).toBeVisible();
    await expect(page.getByLabel("Constituent owner")).toHaveValue(
      "Municipal fire service",
    );
    await page.getByLabel("Constituent owner").fill("Updated fire service");
    await expect(page.getByLabel("Constituent owner")).toHaveValue(
      "Updated fire service",
    );
    await page.getByRole("button", { name: /SysML 1.6 orientation/ }).click();
    await page.getByRole("button", { name: "Allocate requirement" }).click();
    await page.getByRole("button", { name: "Create interface" }).click();
    await expect(page.getByText(/New mission interface/)).toBeVisible();

    await page
      .locator('nav[aria-label="Primary navigation"]')
      .getByRole("button", { name: /Trace/ })
      .click();
    await expect(
      page.getByRole("heading", { name: "Explainable model diagnostics" }),
    ).toBeVisible();
    await expect(page.locator(".diagnostic-grid")).toContainText(
      "Orphan artifacts",
    );

    await page
      .locator('nav[aria-label="Primary navigation"]')
      .getByRole("button", { name: /Requirements/ })
      .click();
    await page
      .getByRole("button", { name: "REQ-042 Mission telemetry availability" })
      .click();
    await page
      .locator('nav[aria-label="Primary navigation"]')
      .getByRole("button", { name: /Impact/ })
      .click();
    await page.getByRole("button", { name: "Run impact simulation" }).click();
    await expect(
      page.getByText("Potentially affected artifacts"),
    ).toBeVisible();
    await expect(page.locator(".impact-metrics")).toContainText("Direct");
    await expect(page.getByText("Proposal consequences")).toBeVisible();
    await page.getByRole("button", { name: "Export impact Mermaid" }).click();
    await page.getByRole("button", { name: "Create change request" }).click();
    await page.getByRole("button", { name: "Apply proposed change" }).click();
    await page
      .locator('nav[aria-label="Primary navigation"]')
      .getByRole("button", { name: /Requirements/ })
      .click();
    await expect(page.getByLabel("Requirement statement")).toHaveValue(
      /1 second/,
    );

    await page
      .locator('nav[aria-label="Primary navigation"]')
      .getByRole("button", { name: /Diagrams/ })
      .click();
    await expect(
      page.getByRole("heading", {
        name: "Emergency response requirement view",
      }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Generate from trace" }).click();
    await page
      .getByLabel("Diagram layout")
      .selectOption({ label: "Hierarchy" });
    await expect(page.getByLabel("Diagram layout")).toHaveValue("Hierarchy");
    const perspectiveSvgDownload = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export selected SVG" }).click();
    await expect((await perspectiveSvgDownload).suggestedFilename()).toBe(
      "tracegraph-perspective.svg",
    );
    await page.getByLabel("Diagram type").selectOption({ label: "Activity" });
    await expect(
      page.getByRole("heading", { name: "Activity diagram" }),
    ).toBeVisible();
    const diagramNode = page.getByRole("button", { name: "Toggle REQ-042" });
    const diagramBox = await diagramNode.boundingBox();
    if (!diagramBox) throw new Error("Diagram node was not rendered");
    await page.mouse.move(diagramBox.x + 30, diagramBox.y + 30);
    await page.mouse.down();
    await page.mouse.move(diagramBox.x + 100, diagramBox.y + 70);
    await page.mouse.up();
    await expect(page.getByText("Working view")).toBeVisible();
    await page.getByRole("button", { name: "Save perspective" }).click();
    await expect(page.getByText("Saved perspective")).toBeVisible();
    await page
      .getByRole("button", { name: "Preview archive from model" })
      .click();
    await expect(
      page.getByRole("dialog", { name: "Archive impact preview" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
    await page.getByLabel("Diagram type").selectOption({ label: "Sequence" });
    await expect(
      page.getByRole("heading", { name: "Sequence diagram" }),
    ).toBeVisible();
    await page.getByLabel("Diagram type").selectOption({ label: "Use case" });
    await expect(
      page.getByRole("heading", { name: "Use case diagram" }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Generate from selected model" })
      .click();
    const mermaidSvgDownload = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download Mermaid SVG" }).click();
    await expect((await mermaidSvgDownload).suggestedFilename()).toBe(
      "tracegraph-mermaid.svg",
    );
    const mermaidMarkdownDownload = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Download Mermaid Markdown" })
      .click();
    await expect((await mermaidMarkdownDownload).suggestedFilename()).toBe(
      "tracegraph-mermaid.md",
    );
    await page
      .getByLabel("Mermaid proposal source")
      .fill("flowchart LR\n  REQ_042 -->|depends-on| BLK_007");
    await page.getByRole("button", { name: "Preview Mermaid import" }).click();
    await expect(page.getByText("1 proposed relationship")).toBeVisible();
    await page.locator(".proposal-row input[type=checkbox]").check();
    await page
      .getByRole("button", { name: "Apply accepted relationships" })
      .click();
    await page
      .getByRole("button", { name: "Create new model element" })
      .click();
    await expect(
      page.locator(".diagram-svg").getByText("New diagram block 33"),
    ).toBeVisible();
    await page.getByRole("button", { name: "Switch to light theme" }).click();
    await expect(page.locator(".app-shell.theme-light")).toBeVisible();
    await page.reload();
    await expect(page.locator(".app-shell.theme-light")).toBeVisible();
    await page.getByRole("button", { name: "Switch to dark theme" }).click();
    await expect(page.locator(".app-shell.theme-dark")).toBeVisible();

    const recoveryFile = {
      name: "recovery-bundle.json",
      mimeType: "application/json",
      buffer: Buffer.from(
        JSON.stringify({
          version: 1,
          artifacts: [
            {
              id: "REQ-RECOVER",
              type: "Requirement",
              name: "Recovered requirement",
              description:
                "The system shall restore imported work within 1 second.",
              status: "Draft",
            },
          ],
          relations: [],
          diagramPerspectives: [
            {
              id: "DIAGRAM-RECOVER",
              title: "Recovered perspective",
              profile: "SysML",
              diagramType: "Requirement trace",
              elementFilter: "All",
              selectedIds: ["REQ-RECOVER"],
              positions: { "REQ-RECOVER": { x: 120, y: 100 } },
              layoutMode: "Grid",
              savedAt: "2026-07-18T00:00:00.000Z",
            },
          ],
        }),
      ),
    };
    await page.locator('input[type="file"]').setInputFiles(recoveryFile);
    await page.getByRole("button", { name: "Apply imported project" }).click();
    await page
      .locator('nav[aria-label="Primary navigation"]')
      .getByRole("button", { name: /Requirements/ })
      .click();
    await expect(
      page.getByRole("button", { name: "REQ-RECOVER Recovered requirement" }),
    ).toBeVisible();
    await page
      .locator('nav[aria-label="Primary navigation"]')
      .getByRole("button", { name: /Diagrams/ })
      .click();
    await expect(
      page.getByRole("heading", { name: "Recovered perspective" }),
    ).toBeVisible();
    await page.reload();
    await page.getByRole("button", { name: "Open sample project" }).click();
    await page.getByRole("button", { name: "Cancel" }).click();
    await page
      .locator('nav[aria-label="Primary navigation"]')
      .getByRole("button", { name: /Requirements/ })
      .click();
    await expect(
      page.getByRole("button", { name: "REQ-RECOVER Recovered requirement" }),
    ).toBeVisible();
  },
);
