# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Current state

The repo has not been migrated yet. It contains a working vanilla HTML/JS/CSS **prototype** and a plan for moving it to Vite + React + TypeScript, deployed as static files on GitHub Pages. `AGENT_HANDOFF.md` is the full migration spec: domain model, component boundaries, routes, test plan, phases and definition of done. Read it before doing migration work.

- `prototype/` is a reference for UX, interaction and visual design only (`app.js` holds the catalog data, search, routing and rendering; `styles.css` holds the whole visual system; `index.html` is the shell and the Explore markup). **It is not a source of truth for semantics.** Its operation signatures, laws, aliases, ecosystem mappings, notes and code snippets contain known errors. Before porting any semantic claim, verify it against the primary documentation for the specific library and version. See "Semantic authority" in `AGENT_HANDOFF.md`.
- `reference/fp-shapes-production.png` is the desktop visual-parity baseline. Compare against it, but don't hard-code its dimensions.

There is no `package.json`, build, lint or test tooling yet. To run the prototype, open `prototype/index.html` directly.

When the Vite project exists, the plan expects `npm run build` → static `dist/`, Vitest + React Testing Library for unit and component tests, at most one Playwright smoke test, and a GitHub Actions Pages workflow (install → test → build → upload `dist/` → deploy). Vite `base` must be `/fp-shapes/`. Update this file with the real commands once they exist.

## Prototype architecture (what you are porting)

- **Operations catalog**: the `operations` array at the top of `app.js` holds 12 operations (map, flatMap, mapError, match, traverse, sequence, bimap, recover, getOrElse, tap, flatten, zip). Each one has `aliases`, a per-ecosystem `ecosystem` name map, `theory`/`law`, `neighbors` (the composition neighborhood), a default `concrete` triple `[input, function, output]`, and optional per-ecosystem `examples` whose `kind` (`either` | `sequence` | `pair` | `value`) picks how the concrete shapes are drawn.
- **Ecosystem keys**: the prototype uses PascalCase keys (`CsharpLinq`, `CsharpLanguageExt`, `Fsharp`, `Haskell`, `TypeScriptArray`, `TypeScriptFpTs`), while the filter `<select>` uses kebab-case ids (`csharp-linq`, …). `preferredEcosystem` maps between them. The target model uses the kebab-case `EcosystemId` plus `canonical`.
- **Search**: `rankOperations` scores the canonical name and aliases case-insensitively (exact 100, prefix 70, substring 50, description match 25). Port this behavior as is into a pure `rankOperations(catalog, query, ecosystemId)` and cover it with tests before tuning relevance.
- **Explore rendering**: `render()` fills fixed DOM ids from the selected operation and example. The success/failure case switch only appears for `either` shapes. The operation-to-concept-page mapping (`conceptRoute` inside `render`) is currently hard-coded and should become catalog data (`conceptIds`).
- **Content routes**: `renderRoute()` switches on `location.hash`. Routes: `explore`, `learn`, `concepts`, `concept/<id>` (from `conceptDefinitions`), `glossary`, `validation`, `parsing`, `async` (from `pageTemplates`). Unknown routes fall back to Explore. The three example pages share `examplePage()` and the `runLab()` logic.
- **Glossary**: `operationForGlossaryTerm` derives the "Explore example" badge by matching the term against operation id, canonical name and aliases. Keep it derived from the catalog. Never add a manual list or a boolean flag.
- `data-query` buttons (aliases, neighbors, chips, glossary badges) re-run search and navigate to Explore. If nothing matches, they fall through to the glossary.

## Rules that are easy to violate

- This is a structural migration, not a redesign. Keep the existing CSS, content, lavender palette, Manrope/DM Mono fonts, the three-column layout and the high-contrast toggle. Don't mix redesign, catalog expansion and migration in one commit.
- **Receiver type is part of the answer.** LINQ `Select`/`SelectMany` work on `IEnumerable`, LanguageExt on `Either`, TS `Array.map`/`flatMap` on arrays, and fp-ts on `Either`. An alias like `SelectMany` or `flatMap` must not resolve without ecosystem context where that matters. Ecosystem analogues must never be presented as exactly equivalent. Preserving an abstract `F` does not imply the same object identity, collection class, evaluation strategy, cardinality or error behavior.
- Treat the typed catalog as the single source of truth. Adding an ordinary operation should only mean adding a catalog module. `ShapeDiagram` must render from declarative shape data, with no conditionals on operation names.
- Out of scope: backend, accounts, database, CMS, SSR, hosted telemetry, AI search.
- Use `HashRouter`. Old `#concept/monad`-style links must keep working, and Explore state should be encoded in the URL (`#/explore?operation=flatMap&ecosystem=csharp-linq`).
- Whenever you fix a catalog-resolution or ecosystem-selection bug, add a regression test.
