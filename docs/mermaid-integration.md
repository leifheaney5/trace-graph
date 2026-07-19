# Mermaid integration

Diagram Studio can generate Mermaid source from the selected canonical
subgraph and provides `.mmd`, fenced Markdown, SVG, and browser-safe PNG
downloads from the constrained live preview. This is an approximation layer,
not a claim of standards-conformant SysML rendering.

The exporter produces a `flowchart LR` source document with canonical IDs and relationship labels. This is deliberately a portable text representation; users should review generated source before using it in external documentation.

Diagram Studio accepts a constrained Mermaid subset for model proposals. Previewing
the source parses known artifact IDs and supported directed edges, reports unsupported
lines, and lists each proposed relationship independently. Nothing changes until the
user checks one or more proposals and chooses **Apply accepted relationships**; the
accepted set is validated, applied as one transaction, and retained in local audit and
relationship history. Unsupported Mermaid syntax remains outside the canonical model.
