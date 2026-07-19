# Diagram architecture

Removing an element from a view is separate from the explicit archive flow,
which previews relationship impact before soft-archiving the canonical artifact.
Saved perspectives are part of the validated `ProjectBundle`, so project
export/import and IndexedDB hydration retain the selected IDs, profile, filter,
layout, positions, diagram type, relationship kinds, and export settings.

The trace view and Diagram Studio are accessible SVG surfaces backed by canonical identifiers. Saved perspectives store references, profile, title, selected diagram type, element filter, layout mode, and element positions rather than duplicate artifacts. Diagram Studio can generate a trace perspective, add/remove existing elements, filter the working view, drag canonical nodes, apply deterministic grid, hierarchy, force, and trace-path layouts, create practical-subset canonical elements, add semantically validated relationships transactionally, and export the resulting canonical view. Every view also exposes a textual alternative containing artifact and relationship IDs. Diagram version comparison and standards-complete diagram semantics remain planned.
