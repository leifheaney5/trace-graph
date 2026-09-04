import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./case-study-chrome.css";
import App from "./App.tsx";
import CaseStudyChrome from "./CaseStudyChrome.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CaseStudyChrome />
    <App />
  </StrictMode>,
);
