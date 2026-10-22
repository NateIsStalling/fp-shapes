# FP Shapes prototype handoff

This package contains the current working FP Shapes prototype and an implementation plan for migrating it to a maintainable, static React application.

## Contents

```text
fp-shapes-prototype-handoff/
├── AGENT_HANDOFF.md
├── README.md
├── prototype/
│   ├── index.html
│   ├── app.js
│   └── styles.css
└── reference/
    └── fp-shapes-production.png
```



Opening `index.html` directly may work for most interactions

## Current product surface

- Operation and alias search
- Twelve interactive operations
- Ecosystem-specific examples
- Canonical shape and concrete-case visualizations
- Composition-neighborhood navigation
- Learn, Concepts, Glossary, and example pages
- Eight concept-detail pages with documentation links and snippets
- Hash-based navigation
- Responsive desktop and mobile layouts

The production screenshot in `reference/` is the visual parity baseline. The source files in `prototype/` are authoritative for behavior and content.

## Intended migration target

- Vite
- React
- TypeScript
- Static build output
- GitHub Pages hosting
- No backend, accounts, database, authentication, or server-side rendering

See `AGENT_HANDOFF.md` for the complete migration plan and acceptance criteria.
