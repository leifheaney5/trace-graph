import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./case-study-chrome.css";
import "./digital-thread-workbench.css";
import App from "./App.tsx";
import CaseStudyChrome from "./CaseStudyChrome.tsx";
import DigitalThreadWorkbench from "./DigitalThreadWorkbench.tsx";

function TraceGraphRoot() {
  const [coreRevision, setCoreRevision] = useState(0);

  useEffect(() => {
    const reloadCore = () => setCoreRevision((revision) => revision + 1);
    window.addEventListener("tracegraph:reload-core", reloadCore);
    return () => window.removeEventListener("tracegraph:reload-core", reloadCore);
  }, []);

  return (
    <>
      <CaseStudyChrome />
      <App key={coreRevision} />
      <DigitalThreadWorkbench />
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TraceGraphRoot />
  </StrictMode>,
);
