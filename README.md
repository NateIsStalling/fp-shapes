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

The production screenshot in `reference/` is the visual parity baseline. The source files in `prototype/` are a reference for UX, interaction, and visual design.

The prototype is **not** authoritative for semantics. Its signatures, laws, aliases, ecosystem mappings, notes, and code snippets contain known errors. Verify every semantic claim against the primary documentation for a specific library and version before adding it to the typed catalog.

## Intended target

RxMarbles plus a reverse Hoogle: a Rosetta stone for functional programming. You find an operation by its name in any ecosystem or by its type signature. Shape is the organizing principle. One reusable **Shape Ribbon** shows which structural layers move, stay, appear or disappear, and it appears on every operation page, search result, matrix cell and abstraction example. Each operation page shows a diagram computed by running a reference implementation on inputs you can manipulate. A matrix index shows how each target ecosystem spells the operation, with versioned snippets and glossary terms. "No equivalent" is a valid answer in the matrix.

The prototype's Learn paths, concept essays and example labs are out of scope.

Target ecosystems (pinned versions):

- C# LanguageExt 4.4.9 (v5 deferred; the model supports multiple version tracks)
- C# BCL/LINQ
- F#: FSharp.Core 10.1.402, FsToolkit.ErrorHandling 5.2.0, FSharpPlus 1.9.1
- fp-ts 2.16.11
- Effect 4.0.5
- Haskell: base 4.22, mtl, and `either` for Validation

Stack:

- Vite, React and TypeScript
- Static build output hosted on GitHub Pages
- No backend, accounts, database, authentication, or server-side rendering

See `AGENT_HANDOFF.md` for the full plan, decisions and acceptance criteria.
