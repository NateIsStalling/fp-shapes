# FP Shapes: React and GitHub Pages migration handoff

## Assignment

Migrate the supplied FP Shapes prototype into a maintainable Vite, React, and TypeScript project that builds to static files and deploys to GitHub Pages.

Preserve the current product surface, interactions, and visual language while creating a foundation that can support dozens of additional operations and richer interactive visualizations.

This is a structural migration, not a redesign. It is also not a straight port of content: the prototype's semantic content must be verified before it enters the typed catalog. See [Semantic authority](#semantic-authority).

## Product thesis

FP Shapes is a visual operation index and cross-ecosystem Rosetta Stone for functional programming.

The central interaction is:

```text
known operation or alias
        ↓
canonical concept and signature
        ↓
visual transformation
        ↓
composition neighborhood
        ↓
ecosystem-specific expression and caveats
```

The experience should remain concepts-first. Ecosystem APIs translate the canonical behavior; they do not define the information architecture.

## Required outcome

Deliver a repository that:

1. Reproduces the supplied prototype's interactions and presentation, with semantic content verified against primary documentation rather than copied.
2. Represents operations, concepts, glossary terms, ecosystems, and visualizations as typed data.
3. Renders that data through reusable React components.
4. Supports static GitHub Pages deployment.
5. Requires no accounts, API, database, secrets, or server runtime.
6. Includes focused automated tests for the domain behavior most likely to regress.
7. Makes adding an ordinary new operation a small catalog change rather than a renderer rewrite.

## Explicit non-goals

Do not add:

- User accounts or authentication
- A backend or API
- A database or CMS
- Server-side rendering
- Arbitrary pasted-code analysis
- Language-server or compiler integration
- Package-wide API indexing
- AI-generated search results
- Telemetry that requires a hosted service
- A visual redesign unrelated to the migration

Do not convert ecosystem analogues into claims of exact semantic equivalence.

## Supplied baseline

The current prototype is under `prototype/`:

| File | Purpose |
|---|---|
| `index.html` | Application shell and current Explore markup |
| `app.js` | Catalog data, search, routing, rendering, concept pages, glossary, and labs |
| `styles.css` | Complete visual system and responsive behavior |

`reference/fp-shapes-production.png` is a desktop visual-parity reference.

The prototype currently contains approximately:

- 206 lines of HTML
- 1,019 lines of JavaScript
- 331 lines of CSS

The JavaScript contains no remote data access or persistent application state. Most content is already represented as JavaScript objects, which makes the structure easy to extract. The semantics in those objects still need verification (see below).

## Semantic authority

The prototype is a reference for UX, interaction, and visual design only. It is **not** a source of truth for functional-programming semantics.

Its signatures, laws, aliases, ecosystem mappings, semantic notes, and code snippets contain known errors. Examples:

- The `traverse` and `sequence` laws contradict each other.
- F# `Result` is shown with its type parameters in the wrong order.
- Functions are attributed to FSharp.Core that it does not contain.
- Haskell `liftA2` and `zipWith` are presented as one operation, though they differ for lists.
- `tap` conflates an effectful step with a side-effect peek.
- Short-circuiting `Either` traversal is presented as if it accumulated errors.
- Alias resolution silently picks a receiver type by object key order.

Rules:

- The authority for each semantic claim is the primary documentation for a specific library and version, recorded alongside the claim.
- Port prototype content only after verifying it. When a claim can't be verified, mark it unverified in the catalog rather than asserting it.
- Correcting a semantic error is in scope for the migration and is not a redesign. Make such corrections in their own commits, separate from structural changes.
- Do not write tests that lock in the prototype's semantic behavior. Write tests against verified behavior.

## Current operations

All twelve operations remain in scope and must be searchable and interactive. An operation may be split or renamed when verification shows that it conflates distinct behaviors (for example, `tap`).

1. `map`
2. `flatMap`
3. `mapError`
4. `match`
5. `traverse`
6. `sequence`
7. `bimap`
8. `recover`
9. `getOrElse`
10. `tap`
11. `flatten`
12. `zip`

Alias lookup must resolve names such as `Select`, `SelectMany`, `Bind`, `chain`, `fmap`, `>>=`, `mapLeft`, and `join`. The aliases in `prototype/app.js` are candidates, not requirements:

- Keep an alias only when documentation shows the ecosystem and receiver type it belongs to.
- Drop aliases that can't be traced to a library.
- Qualify aliases whose meaning depends on the receiver (e.g. `join`, `fold`, `Do`, `all`, `orElse`) so they don't resolve without context.

## Semantic guardrails

Receiver type is part of the answer.

Keep these ecosystem distinctions visible:

- C# LINQ `Select` and `SelectMany` operate on `IEnumerable` sequence shapes.
- LanguageExt `Map`, `Bind`, and query-syntax equivalents operate on `Either`-style branch shapes.
- TypeScript `Array.map` and `Array.flatMap` operate on array shapes.
- fp-ts `Either.map`, `flatMap`, `mapLeft`, and related operations operate on `Either` branches.
- F# `Result`, Haskell type classes, native collections, and library abstractions must retain their documented semantic differences.

Distinguish these levels throughout the UI and data model:

1. Canonical structural relationship
2. Common ecosystem expression
3. Important semantic differences or constraints

Never imply that preserving an abstract `F` means preserving object identity, a concrete collection class, evaluation strategy, cardinality, or error behavior.

## Recommended stack

- Current stable Node.js LTS
- Vite
- React
- TypeScript with strict mode
- React Router using `HashRouter`
- Vitest
- React Testing Library
- Existing CSS initially
- GitHub Actions for Pages deployment

Avoid a full UI framework unless a concrete requirement appears. The supplied CSS already defines the product's visual identity.

Use `HashRouter` for the first migration because:

- The prototype already uses hash routes.
- GitHub Pages does not provide arbitrary SPA rewrite rules.
- Existing links can survive the migration.
- Refreshing a concept route will continue to resolve through `index.html`.

## Suggested project structure

```text
fp-shapes/
├── .github/
│   └── workflows/
│       └── deploy-pages.yml
├── public/
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   └── routes.tsx
│   ├── components/
│   │   ├── AppShell.tsx
│   │   ├── Sidebar.tsx
│   │   ├── ConceptInspector.tsx
│   │   ├── CopyCodeButton.tsx
│   │   └── ThemeButton.tsx
│   ├── catalog/
│   │   ├── operations/
│   │   │   ├── map.ts
│   │   │   ├── flatMap.ts
│   │   │   └── index.ts
│   │   ├── concepts.ts
│   │   ├── ecosystems.ts
│   │   ├── glossary.ts
│   │   └── examples.ts
│   ├── domain/
│   │   ├── catalog.ts
│   │   ├── operation.ts
│   │   ├── search.ts
│   │   ├── shape.ts
│   │   └── visualization.ts
│   ├── features/
│   │   ├── explore/
│   │   │   ├── ExplorePage.tsx
│   │   │   ├── OperationSearch.tsx
│   │   │   ├── ShapeDiagram.tsx
│   │   │   ├── ConcreteExample.tsx
│   │   │   └── CompositionNeighborhood.tsx
│   │   ├── concepts/
│   │   ├── glossary/
│   │   ├── learn/
│   │   └── examples/
│   ├── styles/
│   │   └── global.css
│   ├── main.tsx
│   └── vite-env.d.ts
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

This is a suggested boundary map, not a requirement to create one file per small component. Prefer cohesive modules over excessive fragmentation.

## Domain model

### Identifiers

Use stable, explicit identifiers rather than display strings as foreign keys:

```ts
export type OperationId =
  | "map"
  | "flatMap"
  | "mapError"
  | "match"
  | "traverse"
  | "sequence"
  | "bimap"
  | "recover"
  | "getOrElse"
  | "tap"
  | "flatten"
  | "zip";

export type EcosystemId =
  | "canonical"
  | "csharp-linq"
  | "csharp-languageext"
  | "fsharp"
  | "haskell"
  | "typescript-array"
  | "typescript-fpts";
```

The operation union may later be generated from catalog keys, but prioritize readable, strict types during the initial migration.

### Operation definition

Use a shape similar to:

```ts
export interface OperationDefinition {
  id: OperationId;
  canonicalName: string;
  aliases: AliasDefinition[];
  category: OperationCategory;
  summary: string;
  canonicalSignature: TypeExpression;
  theory: TheoryDefinition;
  visualization: VisualizationDefinition;
  examples: Partial<Record<EcosystemId, EcosystemExample>>;
  relationships: OperationRelationship[];
  conceptIds: ConceptId[];
}
```

An alias should optionally identify its ecosystem and documentation context. Avoid flattening every alias into an unqualified string once the typed catalog exists.

```ts
export interface AliasDefinition {
  name: string;
  ecosystemId?: EcosystemId;
  note?: string;
}
```

### Type expressions

Do not store every signature only as rendered text. Introduce a minimal recursive representation that can support later matching and richer diagrams:

```ts
export type TypeExpression =
  | { kind: "variable"; name: string }
  | { kind: "named"; name: string; arguments: TypeExpression[] }
  | { kind: "function"; input: TypeExpression; output: TypeExpression }
  | { kind: "tuple"; elements: TypeExpression[] }
  | { kind: "union"; alternatives: TypeExpression[] };
```

Provide a formatter that produces the current compact signatures. The initial migration does not need a free-text signature parser.

### Shape primitives

Richer visualization should be built from a small vocabulary of composable primitives:

```ts
export type Shape =
  | { kind: "value"; id: string; label: string; tone?: ShapeTone }
  | { kind: "container"; id: string; label: string; content: Shape }
  | { kind: "alternatives"; id: string; left: Shape; right: Shape }
  | { kind: "product"; id: string; members: Shape[] }
  | { kind: "collection"; id: string; items: Shape[] }
  | { kind: "function"; id: string; input: Shape; output: Shape };
```

Keep stable shape IDs so the renderer can animate continuity between input and output.

### Visualization definition

```ts
export interface VisualizationDefinition {
  input: Shape;
  operation: OperationGlyph;
  output: Shape;
  preservedIds: string[];
  changedIds: string[];
  removedIds?: string[];
  introducedIds?: string[];
  annotations: VisualizationAnnotation[];
}
```

Do not build a general graph-layout engine during this migration. Implement the layouts needed by the current operation families:

- Structure-preserving
- Structure-changing or flattening
- Alternative-aware
- Structure-consuming
- Structure-reorienting
- Independent combination

The model should make a later graph renderer possible without delaying parity.

## React component boundaries

### Application shell

`AppShell` owns the responsive three-column shell:

- Primary navigation sidebar
- Main route outlet
- Contextual inspector on Explore

Keep route content responsible for route-specific state.

### Explore page

`ExplorePage` owns:

- Current operation
- Search query
- Ecosystem filter
- Example case
- Theory disclosure
- Animation state

Prefer local React state. A global state library is not justified.

### Search

Move search ranking into a pure domain function:

```ts
rankOperations(catalog, query, ecosystemId): RankedOperation[]
```

Keep the prototype's scoring tiers (exact, prefix, substring, description) as a starting point. Do not keep its ecosystem selection, which picks the first matching ecosystem in object key order. When an alias exists in several ecosystems or for several receiver types, return every candidate and let the UI ask which one is meant. Add unit tests around canonical names, aliases, case insensitivity, exact matches, ecosystem-specific aliases, and empty queries.

### Shape diagram

`ShapeDiagram` should receive a declarative visualization definition and render it without knowing which operation produced it.

Animation may initially remain CSS-class-driven:

```tsx
<ShapeDiagram scene={operation.visualization} phase={animationPhase} />
```

Avoid embedding business semantics in animation timers.

### Ecosystem examples

Use one reusable component for concrete examples and documentation cards. It should make these fields visible:

- Ecosystem
- API or expression name
- Code snippet
- Concrete before/function/after shapes
- Semantic note
- Primary documentation link where available

### Glossary

The `Explore example` indicator must continue to derive from the operation catalog. Do not maintain a second Boolean or manual list.

Resolve a glossary term by its normalized term against operation IDs, canonical names, and aliases. A badge is shown only when the target operation exists and navigation can succeed.

## Content strategy

For the initial migration, keep catalog content in typed TypeScript modules.

Do not introduce a CMS. Do not require authors to edit JSX to add an ordinary operation.

If concept essays later become substantially longer, MDX may be evaluated separately. It is not required for parity.

Each operation module should export one complete definition. The catalog index should validate uniqueness of:

- Operation IDs
- Canonical names after normalization
- Aliases within an ecosystem where ambiguity would be harmful

Allow the same API name to mean different things for different receiver types. `SelectMany` and `flatMap` must not resolve without considering ecosystem or receiver context when that distinction matters.

## Routing

Preserve recognizable routes:

```text
#/explore
#/learn
#/concepts
#/concept/:conceptId
#/glossary
#/validation
#/parsing
#/async
```

It is acceptable to normalize the current `#concept/monad` format into React Router's hash-router output as long as shared links and refresh behavior work on GitHub Pages.

When an operation or glossary link navigates to Explore, encode enough state in the URL to restore the selection where practical:

```text
#/explore?operation=flatMap&ecosystem=csharp-linq
```

This is preferable to invisible global navigation state and makes examples shareable.

## Styling and responsiveness

Port the existing CSS before refactoring it.

Preserve:

- Quiet lavender interface
- Manrope and DM Mono typography treatment
- Three-column desktop hierarchy
- Left navigation and right inspector
- Existing badges, cards, shapes, and diagram colors
- Responsive collapse behavior
- High-contrast toggle

Once parity is achieved:

- Group selectors by component or feature.
- Move repeated colors and spacing into CSS custom properties.
- Retain semantic class names.
- Avoid CSS-in-JS unless there is a demonstrated need.

The production screenshot is a comparison reference, not a reason to hard-code desktop dimensions.

## Accessibility requirements

Preserve or improve:

- Semantic landmarks
- Keyboard operation of search and result selection
- Visible focus states
- `aria-live` announcements for operation changes
- `aria-expanded` and disclosure state
- Button semantics for interactive chips
- Text alternatives for visual transformations
- Sufficient contrast in normal and high-contrast modes
- Reduced-motion behavior

Add a textual transformation summary adjacent to each visualization so meaning does not depend on animation or color.

Respect `prefers-reduced-motion` and render a stable end state without automatic movement.

## Testing strategy

### Unit tests

Cover pure domain behavior:

- Canonical operation lookup
- Alias lookup
- Case normalization
- Ecosystem filtering
- Ranking exact names above partial aliases
- Type-expression formatting
- Glossary-to-operation resolution
- Catalog uniqueness validation

### Component tests

Cover key product interactions:

- Searching `SelectMany` resolves `flatMap`.
- Selecting C# LINQ displays an `IEnumerable` example.
- Selecting LanguageExt displays an `Either` example.
- TypeScript Array and fp-ts display different container shapes.
- Failure cases bypass success transformations where appropriate.
- Glossary badges appear only for backed operations.
- Clicking an Explore badge opens the expected operation.
- Theory disclosure and code-copy controls remain operable.

### Route tests

- Every primary route renders.
- Every concept relationship link resolves.
- Unknown routes fall back safely.
- Direct hash navigation restores the selected operation when encoded.

### Browser smoke test

Use one lightweight Playwright smoke test if the project already accepts the dependency. At minimum verify:

1. Load Explore.
2. Search for `SelectMany`.
3. Resolve `flatMap`.
4. Switch ecosystem.
5. Open Glossary.
6. Follow an Explore example back to Explore.
7. Confirm a mobile viewport does not overflow horizontally.

Do not create a large end-to-end suite during the migration.

## GitHub Pages deployment

The build output must be static `dist/` files.

For a project site hosted at:

```text
https://<username>.github.io/fp-shapes/
```

configure Vite with:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/fp-shapes/",
});
```

If the repository itself is named `<username>.github.io`, use `base: "/"` instead.

Add a Pages workflow based on the current official GitHub Pages and Vite guidance. The workflow should:

1. Trigger on pushes to the default branch and manual dispatch.
2. Check out the repository.
3. Install the supported Node version.
4. Run the reproducible package-manager install.
5. Run tests.
6. Run the Vite production build.
7. Upload `dist/` as the Pages artifact.
8. Deploy through the GitHub Pages deployment action.

Grant only the permissions required by the official Pages workflow.

No repository secret should be required for the standard Pages deployment.

## Migration sequence

### Phase 1: Scaffold and safety net

- Initialize Vite React TypeScript.
- Add strict TypeScript settings.
- Add Vitest and React Testing Library.
- Copy the current CSS and font declarations.
- Establish hash routes.
- Add the GitHub Pages build configuration.
- Add a baseline smoke test that the application shell renders.

Exit criteria:

- `npm run build` produces a static `dist/`.
- Every intended route can be reached on a local static server.

### Phase 2: Extract the catalog

- Convert current operation objects into typed definitions, verifying each semantic claim against primary documentation as it is ported.
- Extract concepts, glossary terms, ecosystems, and example labs.
- Record each ecosystem claim's source: documentation URL, library, and version. Mark claims that couldn't be verified as unverified.
- Implement catalog validation.
- Port search ranking into pure functions.
- Write domain tests against verified behavior, not against the prototype's output.

Exit criteria:

- All twelve operations exist in the typed catalog, with verified aliases, each qualified by ecosystem and receiver type.
- Every ecosystem entry has a recorded source or an explicit unverified marker.
- Search and glossary resolution tests pass.
- Content no longer lives inside page-rendering functions.

### Phase 3: Explore parity

- Build operation search and result selection.
- Build the inspector.
- Build canonical and concrete visualization components.
- Build case switching, ecosystem filtering, theory disclosure, and composition-neighborhood navigation.
- Preserve keyboard behavior and live announcements.

Exit criteria:

- Every current operation renders.
- LINQ/LanguageExt and Array/fp-ts distinctions remain correct.
- The supplied screenshot can be reproduced closely at its viewport size.

### Phase 4: Content routes

- Port Learn.
- Port Concepts overview.
- Port all concept-detail pages.
- Port Glossary and its derived Explore indicators.
- Port Validation, Parsing, and Async workflow examples.

Exit criteria:

- No current route is a placeholder.
- Cross-links resolve without full-page reloads.
- Copy controls and labs work.

### Phase 5: Visualization foundation

- Replace operation-specific DOM assumptions with typed shape primitives.
- Implement the required visualization-family layouts.
- Add stable IDs for preserved and changed shapes.
- Add reduced-motion behavior and textual summaries.

Exit criteria:

- `ShapeDiagram` renders from data rather than operation-name conditionals.
- Adding an operation in an existing family does not require editing the renderer.

### Phase 6: Verification and deployment

- Run unit and component tests.
- Run the production build.
- Serve the built `dist/` locally to catch base-path issues.
- Perform desktop and mobile visual checks.
- Configure GitHub Pages.
- Deploy from the default branch.
- Update the repository README with local development, content-authoring, test, and deployment instructions.

Exit criteria:

- The GitHub Pages URL works without authentication.
- Direct hash links survive refresh.
- No source file or network request references the prior prototype host.

## Definition of done

The migration is complete when:

- The React version has feature parity with the supplied prototype's interactions and presentation.
- Semantic content is verified against primary documentation or explicitly marked unverified. None of it is carried over from the prototype unchecked.
- All twelve operations remain searchable and interactive.
- Ecosystem distinctions are preserved.
- All existing content routes are implemented.
- Operation and visualization data are typed and separate from React rendering.
- An existing-family operation can be added without modifying the generic renderer.
- Automated tests cover search, glossary resolution, critical ecosystem variants, and routes.
- The static production build deploys successfully to GitHub Pages.
- Visitors require no account or login.
- The repository contains no backend, secrets, or unused hosted-service integration.

## Suggested effort

Expected implementation effort for one experienced frontend engineer:

| Work | Estimate |
|---|---:|
| Scaffold, routing, and data extraction | 0.5–1 day |
| Explore and visualization parity | 1–1.5 days |
| Content pages and glossary | 0.5–1 day |
| Tests, accessibility, and GitHub Pages deployment | 1 day |
| Total maintainable migration | 3–4.5 focused days |

The lower end assumes visual parity rather than redesign and reuses the current CSS. Rich new visualization behaviors should be scheduled after the migration baseline is stable.

## Agent working rules

- Inspect the supplied source before replacing UX or interaction behavior.
- Treat the prototype's semantic content as unverified. Verify it against primary documentation before porting it, and correct it in a dedicated commit when it is wrong.
- Keep each migration step runnable.
- Prefer small, reviewable commits aligned with the phases above.
- Do not mix redesign, catalog expansion, and migration in the same commit.
- Add a regression test whenever fixing a catalog-resolution or ecosystem-selection bug.
- Record semantic uncertainties rather than silently asserting cross-ecosystem equivalence.
- Treat the typed catalog as the source of truth; derived navigation and glossary indicators must not use parallel manual lists.

## Recommended first commit

The first commit should include only:

- Vite React TypeScript scaffold
- Existing global CSS
- Static application shell
- Hash routing
- Empty route components matching the current route map
- Test infrastructure
- GitHub Pages-aware Vite base configuration

The second commit should extract, verify, and test the catalog before porting the interactive renderer. This order reduces the risk of burying unverified semantics inside hastily translated JSX.
