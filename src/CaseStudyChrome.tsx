import { useEffect, useMemo, useState } from "react";

const workflow = [
  { label: "Stakeholder intent", target: "Elicitation" },
  { label: "Elicitation", target: "Elicitation" },
  { label: "Need", target: "Elicitation" },
  { label: "Requirement", target: "Requirements" },
  { label: "Architecture", target: "Architecture" },
  { label: "Verification", target: "Verification" },
  { label: "Evidence", target: "Verification" },
  { label: "Change impact", target: "Impact" },
  { label: "Baseline", target: "Baselines" },
] as const;

function clickButtonByText(text: string) {
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>("button"));
  const match = buttons.find((button) => button.textContent?.trim().includes(text));
  match?.click();
  return Boolean(match);
}

function navigateTo(target: string) {
  const nav = document.querySelector('nav[aria-label="Primary navigation"]');
  if (!nav) return false;
  const buttons = Array.from(nav.querySelectorAll<HTMLButtonElement>("button"));
  const match = buttons.find((button) => button.textContent?.trim().startsWith(target));
  match?.click();
  return Boolean(match);
}

export default function CaseStudyChrome() {
  const [currentView, setCurrentView] = useState("Landing");
  const [saveState, setSaveState] = useState("Local workspace ready");

  useEffect(() => {
    const sync = () => {
      const breadcrumb = document.querySelector(".breadcrumb strong");
      const view = breadcrumb?.textContent?.trim();
      setCurrentView(view || "Landing");

      const statuses = Array.from(document.querySelectorAll<HTMLElement>('[role="status"]'));
      const saved = statuses
        .map((node) => node.textContent?.trim())
        .find((text) => text && /saved|saving|unsaved/i.test(text));
      setSaveState(saved || "Local workspace ready");
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
    });
    return () => observer.disconnect();
  }, []);

  const activeTarget = useMemo(() => {
    if (currentView === "Requirements") return "Requirements";
    if (currentView === "Architecture") return "Architecture";
    if (currentView === "Verification") return "Verification";
    if (currentView === "Impact") return "Impact";
    if (currentView === "Baselines") return "Baselines";
    if (currentView === "Elicitation") return "Elicitation";
    return "";
  }, [currentView]);

  const startSample = () => {
    if (navigateTo("Overview")) return;
    clickButtonByText("Open sample project");
  };

  const restartTour = () => {
    if (clickButtonByText("Start five-minute tour")) return;
    if (navigateTo("Overview")) {
      window.setTimeout(() => clickButtonByText("Start five-minute tour"), 0);
    }
  };

  return (
    <aside className="case-study-chrome" aria-label="TraceGraph workflow guide">
      <div className="case-study-chrome__meta">
        <div>
          <span className="case-study-chrome__kicker">TraceGraph case-study build</span>
          <strong>Emergency Response Drone</strong>
        </div>
        <div className="case-study-chrome__badges" aria-label="Workspace characteristics">
          <span>Synthetic demo</span>
          <span>Local-first</span>
          <span>Canonical model</span>
          <span>{saveState}</span>
        </div>
        <div className="case-study-chrome__actions">
          <button type="button" onClick={startSample}>
            Explore sample
          </button>
          <button type="button" onClick={restartTour}>
            Restart guided workflow
          </button>
        </div>
      </div>

      <nav className="workflow-rail" aria-label="Canonical digital-thread workflow">
        <span className="workflow-rail__label">Digital thread</span>
        <ol>
          {workflow.map((step, index) => {
            const active = Boolean(activeTarget && activeTarget === step.target);
            return (
              <li key={`${step.label}-${index}`}>
                <button
                  type="button"
                  className={active ? "is-active" : ""}
                  aria-current={active ? "step" : undefined}
                  onClick={() => navigateTo(step.target)}
                  title={`Open ${step.target}`}
                >
                  <span className="workflow-rail__index">{String(index + 1).padStart(2, "0")}</span>
                  <span>{step.label}</span>
                </button>
                {index < workflow.length - 1 && (
                  <span className="workflow-rail__arrow" aria-hidden="true">
                    →
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <p className="case-study-chrome__scope">
        Practical systems-engineering projections over canonical artifacts. SysML, UML, and SoSE views are not standards-conformance claims.
      </p>
    </aside>
  );
}
