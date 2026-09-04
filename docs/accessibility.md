# Accessibility

TraceGraph treats accessible alternatives as part of engineering inspectability rather than an optional presentation layer.

## Current baseline

The application includes:

- semantic buttons, labels, headings, tables, dialogs, and status regions;
- visible keyboard focus treatment;
- non-drag controls for important relationship operations;
- text and table alternatives alongside visual trace and diagram views;
- persisted light and dark themes;
- reduced-motion behavior;
- high-contrast focus treatment;
- deterministic workflow navigation that remains operable with the keyboard.

The case-study workflow rail is exposed as a named navigation region and uses `aria-current` for the active workflow stage.

## Automated checks

`tests/e2e/accessibility.spec.ts` runs axe checks against:

1. the landing experience;
2. the opened sample workbench;
3. requirement authoring;
4. architecture;
5. verification;
6. change impact;
7. baselines.

The automated gate fails on critical or serious axe violations in those surfaces.

Run:

```bash
npm run test:accessibility
```

The full end-to-end suite also exercises keyboard-operable controls, accessible labels, dialogs, tables, graph alternatives, and theme persistence.

## Limitations

Automated axe checks are not a substitute for manual assistive-technology testing. TraceGraph does not claim:

- WCAG certification;
- complete screen-reader conformance;
- exhaustive keyboard testing for every combination of dense engineering controls;
- accessibility certification of exported diagrams or third-party viewers.

Manual testing with common screen readers, browser zoom/reflow checks, high-contrast operating-system modes, and a full WCAG conformance review remain appropriate before representing the product as production-certified accessible software.
