import { useEffect, useMemo, useRef, useState } from "react";

const workflow = [
  {
    label: "Stakeholder intent",
    target: "Elicitation",
    title: "Start with stakeholder intent",
    body: "Begin with the operational concern, source language, and stakeholder context that explain why the system needs to change.",
  },
  {
    label: "Elicitation",
    target: "Elicitation",
    title: "Preserve elicitation provenance",
    body: "Capture the method, participants, source notes, confidence, open questions, and follow-up actions before formalizing the engineering record.",
  },
  {
    label: "Need",
    target: "Elicitation",
    title: "Review the candidate need",
    body: "Accept, defer, or reject the extracted need with a rationale so progressive formalization remains inspectable and reversible.",
  },
  {
    label: "Requirement",
    target: "Requirements",
    title: "Engineer a measurable requirement",
    body: "Turn the accepted need into a precise statement, then inspect structure, quality findings, rationale, ownership, versions, and upstream provenance.",
  },
  {
    label: "Architecture",
    target: "Architecture",
    title: "Allocate to architecture",
    body: "Inspect how the requirement maps to canonical blocks, interfaces, behavior, and practical SysML, UML, or SoSE projections without creating a second model.",
  },
  {
    label: "Verification",
    target: "Verification",
    title: "Plan verification",
    body: "Review verification method, owner, procedure, result state, and requirement coverage while keeping the metric definition and denominator visible.",
  },
  {
    label: "Evidence",
    target: "Verification",
    title: "Connect verification evidence",
    body: "Follow the verification case into its evidence package and keep evidence completeness distinct from the existence of a verification plan.",
  },
  {
    label: "Change impact",
    target: "Impact",
    title: "Simulate change impact",
    body: "Inspect direct and indirect paths, allocation consequences, verification gaps, and quality changes before creating or applying a change request.",
  },
  {
    label: "Baseline",
    target: "Baselines",
    title: "Freeze and compare a baseline",
    body: "Finish the digital thread with a named engineering snapshot whose artifacts, links, approval context, and differences remain reviewable and exportable.",
  },
] as const;

function clickButtonByText(text: string) {
  const buttons = Array.from(
    document.querySelectorAll<HTMLButtonElement>("button"),
  );
  const match = buttons.find((button) =>
    button.textContent?.trim().includes(text),
  );
  match?.click();
  return Boolean(match);
}

function navigateTo(target: string) {
  const nav = document.querySelector('nav[aria-label="Primary navigation"]');
  if (!nav) return false;
  const buttons = Array.from(nav.querySelectorAll<HTMLButtonElement>("button"));
  const match = buttons.find((button) =>
    button.textContent?.trim().startsWith(target),
  );
  match?.click();
  return Boolean(match);
}

function selectEmergencySample(attempt = 0) {
  const sample = Array.from(
    document.querySelectorAll<HTMLButtonElement>(".sample-card"),
  ).find((button) => button.textContent?.includes("Emergency Response Drone"));
  if (sample) {
    sample.click();
    return;
  }
  if (attempt < 12) {
    window.setTimeout(() => selectEmergencySample(attempt + 1), 25);
  }
}

export default function CaseStudyChrome() {
  const [currentView, setCurrentView] = useState("Landing");
  const [saveState, setSaveState] = useState("Local workspace ready");
  const [tourStep, setTourStep] = useState<number | null>(null);
  const nextTourButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const sync = () => {
      const breadcrumb = document.querySelector(".breadcrumb strong");
      const view = breadcrumb?.textContent?.trim();
      setCurrentView(view || "Landing");

      const statuses = Array.from(
        document.querySelectorAll<HTMLElement>('[role="status"]'),
      );
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

  useEffect(() => {
    if (tourStep === null) return;
    nextTourButtonRef.current?.focus();
    const dismissOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setTourStep(null);
    };
    document.addEventListener("keydown", dismissOnEscape);
    return () => document.removeEventListener("keydown", dismissOnEscape);
  }, [tourStep]);

  const activeLabel = useMemo(() => {
    if (tourStep !== null) return workflow[tourStep].label;
    if (currentView === "Requirements") return "Requirement";
    if (currentView === "Architecture") return "Architecture";
    if (currentView === "Verification") return "Verification";
    if (currentView === "Impact") return "Change impact";
    if (currentView === "Baselines") return "Baseline";
    if (currentView === "Elicitation") return "Elicitation";
    return "";
  }, [currentView, tourStep]);

  const startSample = () => {
    const projectSwitcher =
      document.querySelector<HTMLButtonElement>(".project-switcher");
    if (projectSwitcher) {
      projectSwitcher.click();
      selectEmergencySample();
      return;
    }
    if (clickButtonByText("Open sample project")) selectEmergencySample();
  };

  const showTourStep = (index: number) => {
    const bounded = Math.max(0, Math.min(index, workflow.length - 1));
    setTourStep(bounded);
    navigateTo(workflow[bounded].target);
  };

  const restartTour = () => showTourStep(0);
  const currentTourStep = tourStep === null ? null : workflow[tourStep];

  return (
    <>
      <aside
        className="case-study-chrome"
        aria-label="TraceGraph workflow guide"
      >
        <div className="case-study-chrome__meta">
          <div>
            <span className="case-study-chrome__kicker">
              TraceGraph case-study build
            </span>
            <strong>Emergency Response Drone</strong>
          </div>
          <div
            className="case-study-chrome__badges"
            aria-label="Workspace characteristics"
          >
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

        <nav
          className="workflow-rail"
          aria-label="Canonical digital-thread workflow"
        >
          <span className="workflow-rail__label">Digital thread</span>
          <ol>
            {workflow.map((step, index) => {
              const active = activeLabel === step.label;
              return (
                <li key={`${step.label}-${index}`}>
                  <button
                    type="button"
                    className={active ? "is-active" : ""}
                    aria-current={active ? "step" : undefined}
                    onClick={() => navigateTo(step.target)}
                    title={`Open ${step.target}`}
                  >
                    <span className="workflow-rail__index">
                      {String(index + 1).padStart(2, "0")}
                    </span>
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
          Practical systems-engineering projections over canonical artifacts.
          SysML, UML, and SoSE views are not standards-conformance claims.
        </p>
      </aside>

      {currentTourStep && tourStep !== null && (
        <div className="case-study-tour-backdrop">
          <section
            className="case-study-tour"
            role="dialog"
            aria-modal="true"
            aria-labelledby="case-study-tour-title"
            aria-describedby="case-study-tour-body"
          >
            <div className="case-study-tour__header">
              <span>
                Guided digital thread · {String(tourStep + 1).padStart(2, "0")}{" "}
                of {String(workflow.length).padStart(2, "0")}
              </span>
              <button
                type="button"
                aria-label="Dismiss digital-thread tour"
                onClick={() => setTourStep(null)}
              >
                ×
              </button>
            </div>
            <h2 id="case-study-tour-title">{currentTourStep.title}</h2>
            <p id="case-study-tour-body">{currentTourStep.body}</p>
            <ol
              className="case-study-tour__progress"
              aria-label="Tour progress"
            >
              {workflow.map((step, index) => (
                <li
                  key={step.label}
                  className={
                    index === tourStep
                      ? "is-current"
                      : index < tourStep
                        ? "is-complete"
                        : ""
                  }
                  aria-current={index === tourStep ? "step" : undefined}
                >
                  <span className="sr-only">{step.label}</span>
                </li>
              ))}
            </ol>
            <div className="case-study-tour__actions">
              <button
                type="button"
                disabled={tourStep === 0}
                onClick={() => showTourStep(tourStep - 1)}
              >
                Previous
              </button>
              <button type="button" onClick={() => setTourStep(null)}>
                Dismiss tour
              </button>
              <button
                ref={nextTourButtonRef}
                type="button"
                onClick={() => {
                  if (tourStep === workflow.length - 1) {
                    setTourStep(null);
                  } else {
                    showTourStep(tourStep + 1);
                  }
                }}
              >
                {tourStep === workflow.length - 1
                  ? "Finish tour"
                  : "Next stage"}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
