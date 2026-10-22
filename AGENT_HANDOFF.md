# FP Shapes: build handoff

## Assignment

Build FP Shapes as a static Vite, React and TypeScript site deployed to GitHub Pages. The supplied prototype is a reference for its visual language and some interactions. It is not a reference for semantics, and it is no longer the scope target.

The spirit of the project is **RxMarbles plus a reverse Hoogle**: a Rosetta stone for functional programming.

- **RxMarbles:**
  - One operation per page.
  - Inputs that you can manipulate.
  - A diagram **computed** by running a reference implementation of the operation on those inputs.
- **Reverse Hoogle:**
  - Find an operation from a name in any ecosystem (`SelectMany`, `>>=`, `traverseResultA`, `Effect.validate`).
  - Or find it from a type signature or shape (`List<Option<A>> -> Option<List<A>>` finds `sequence`).
  - Then see how every target ecosystem spells it, including explicit "no equivalent" answers.

## Product thesis

```text
name (any ecosystem)  ─┐
                       ├→ operation + abstraction + canonical signature
signature / shape    ──┘
        ↓
abstraction and canonical signature
        ↓
computed, interactive transformation (per receiver, per behavior variant)
        ↓
ecosystem expression, version, and caveats
```

Keep these three levels separate in the data model and the UI:

1. **Abstraction**: e.g. Functor, with its laws, and how each ecosystem represents it. The representation can be first-class, encoded, library-only, duck-typed, or absent.
2. **Instance**: a receiver type that satisfies the abstraction, with its own behavior (failure handling, evaluation, cardinality).
3. **API name**: what an ecosystem calls the operation on that receiver.

`IEnumerable.Select` satisfies the functor laws in practice, but that does not make LINQ a Functor abstraction.

## Decisions (2026-10-21)

| Topic | Decision |
|---|---|
| Scope | Keep: operation pages with computed diagrams, alias search, receiver lanes, abstraction pages, and the ecosystem matrix index. **Cut:** Learn paths, concept essays, and the Validation/Parsing/Async labs. |
| Glossary | Kept **inside the matrix index**, not as a standalone page. Terms are derived from catalog records (abstractions, receivers, operations, aliases), each with a one-line definition stored on that record. |
| Code snippets | Kept **inside the matrix index**, attached to individual ecosystem entries. Optional per entry, versioned, and compile-checked where CI supports it (see [Versioning](#versioning)). |
| Effect | Pinned to **v4** (`effect` 4.0.5). v3 names (`Either`, `catchAll`, `validateAll`, `Option.fromNullable`, `Effect.orElse`) are indexed only as legacy aliases that point to the v4 replacement. |
| fp-ts | **Kept**, pinned to 2.16.11 and labeled "maintenance; Effect is the successor". Legacy aliases (`chain`, `chainFirst`, `fold`, …) are indexed as aliases. |
| F# | One F# column. Each entry is tagged by library: **FSharp.Core 10.1.402**, **FsToolkit.ErrorHandling 5.2.0**, **FSharpPlus 1.9.1**. |
| Haskell | base 4.22.0.0, mtl 2.3.2, transformers 0.6.3.0, async 2.2.6. Validation comes from **`either` 5.0.3, `Data.Either.Validation`**. |
| LanguageExt | **Both v4 and v5 are documented** as separate version tracks: `v4` = 4.4.9 (stable, the default) and `v5` = `5.0.0-beta-78` (beta). Many APIs differ between them. `Either.Match`/`BiMap` argument order flipped, the async types were replaced, and `Traverse`/`Sequence` swapped meanings. |
| Multiple versions | **An ecosystem can document more than one version track** (see [Versioning](#versioning)). LanguageExt uses this now. Effect stays on a single v4 track, but the model allows adding v3 later. |
| C# BCL / LINQ | **Proposed:** a "C# · BCL" column covering `IEnumerable`, `Nullable` and `Task`, filled only where an equivalent exists. Mark analogies as `analogy`. |

## Explicit non-goals

Do not add:

- User accounts or authentication
- A backend or API
- A database or CMS
- Server-side rendering
- Arbitrary pasted-code analysis
- Language-server or compiler integration at runtime (compiling snippets in CI is in scope)
- Package-wide API indexing
- AI-generated search results
- Telemetry that requires a hosted service
- Standalone learning content: paths, essays, labs

Do not present ecosystem analogues as exact semantic equivalents.

## Supplied baseline

`prototype/` (`index.html`, `app.js`, `styles.css`) and `reference/fp-shapes-production.png` are the reference for the visual language: the lavender palette, Manrope/DM Mono, the shapes and badges, the responsive behavior, and the high-contrast toggle. The search, alias and inspector interactions are a starting point.

## Semantic authority

The prototype is **not** a source of truth for functional-programming semantics. Its signatures, laws, aliases, ecosystem mappings, notes and snippets contain known errors. Examples:

- The `traverse` and `sequence` laws contradict each other.
- F# `Result` is shown with its type parameters in the wrong order.
- Functions are attributed to FSharp.Core that it does not contain.
- `liftA2` and `zipWith` are presented as one operation, though they differ for lists.
- `tap` conflates an effectful step with a side-effect peek.
- Short-circuiting `Either` traversal is presented as accumulating errors.
- Alias resolution silently picks a receiver by object key order.

Rules:

- The authority for each semantic claim is the primary documentation for the pinned library version, recorded alongside the claim.
- Diagrams are computed by reference implementations, never hand-authored. Laws are verified against those implementations with property-based tests.
- When a claim can't be verified, mark it `unverified` in the catalog rather than asserting it.
- Do not write tests that encode the prototype's semantic behavior.

## Semantic guardrails

The receiver type is part of the answer. Never imply that preserving an abstract `F` preserves object identity, a concrete collection class, evaluation strategy, cardinality, or error behavior.

Distinctions the site must keep visible:

- **Short-circuit vs accumulate.** Either-based traverse stops at the first Left. Only Validation accumulates. Some APIs (LanguageExt applicative `Traverse`, fp-ts parallel `TE.traverseArray`) call every function but still return only the first error.
- **Positional vs cartesian.** Haskell `liftA2` on lists and LINQ query syntax produce the cartesian product. `zipWith`, `Enumerable.Zip` and `RA.zipWith` pair by position and truncate.
- **Parameter order.**
  - Success first: F# `Result<'T,'E>`, Effect `Result<A, E>`.
  - Error first: Haskell `Either e a`, fp-ts `Either<E, A>`.
  - The two F# Validation types differ: FSharpPlus `Validation<'e,'t>` is a separate type with the error first, while FsToolkit's `Validation<'ok,'e>` is an alias for `Result<'ok, 'e list>`.
- **Validation is Applicative, not Monad.** A library that offers a bind on Validation short-circuits.
- **Concurrency and cancellation.**
  - `Task.WhenAll` waits for every task.
  - fp-ts parallel TaskEither runs every task.
  - Haskell `mapConcurrently` and Effect cancel the remaining work on failure.
  - Effect is sequential unless `concurrency` is set.
- **Names that mean different things.**
  - `fold`: match in fp-ts, Foldable in Haskell.
  - `join`: string concatenation in JS and C#.
  - `Do`: fp-ts do-notation vs a LanguageExt peek.
  - mtl `mapError`: not a map over the error.
  - `first`: Data.Bifunctor vs Control.Arrow.

## Topics

**Tier 1 (launch):**
- `map`, `flatMap`, `flatten`
- `zip`/`map2`
- `traverse`, with variants: stop-at-first, call-all/first-wins, accumulate
- `sequence`
- `mapError`, `bimap`
- `match`
- `getOrElse`, in two variants: a constant default, and a default computed from the error
- `recover`, `alt`
- `tap` (effectful), `peek` (side effect only)
- `filterOrElse`

**Tier 2:**
- concurrent traverse (timeline marbles)
- `ap`, `pure`
- `fold`/`reduce` (Foldable, distinct from `match`)
- Kleisli composition
- comprehension syntax
- from-nullable

**Receivers:** Option, Either, Validation, List, ZipList, Tuple (for `bimap`), and a simulated Async on a virtual clock.

**Abstractions:** Functor, Applicative, Monad, Foldable, Traversable, Bifunctor, Alternative, Semigroup/Monoid, MonadError.

The full per-topic deep dive and the name/abstraction matrices are in the FP Shapes Build Plan artifact.

## Recommended stack

- Current stable Node.js LTS
- Vite, React, TypeScript (strict)
- React Router with `HashRouter`. GitHub Pages has no SPA rewrites, so hash routes survive a refresh.
- Vitest, React Testing Library, and fast-check for law property tests
- The existing CSS, ported first
- GitHub Actions for Pages deployment and the snippet compile checks

Avoid a UI framework or CSS-in-JS unless a concrete need appears.

## Architecture

The layers depend only downward. Enforce this with a lint rule (e.g. `no-restricted-imports` or dependency-cruiser) from the first commit.

```text
src/
├── semantics/   receivers, reference operations, behavior variants, traces; imports nothing else in src and never React
├── scenes/      pure (operation, receiver, variant, inputs) → Scene builders, plus text summaries; imports semantics only
├── catalog/     ecosystems, libraries, versions, entries, aliases, abstractions, glossary definitions, snippet refs
├── search/      name search (alias index derived from the catalog; ambiguous queries return several candidates)
│                and signature search (TypeExpression matching, Hoogle-style)
└── ui/          React: ShapeDiagram, InputEditor, NamesPanel, MatrixIndex, routes; imports scenes, catalog, search
snippets/        real source files for each ecosystem, compiled in CI against the pinned versions
```

### Semantics

- Receivers are plain TypeScript discriminated unions.
- Each operation returns a `Run`: the result plus a trace of the calls that were made, those that were skipped, and timing on the virtual clock.
- Operations with ecosystem-dependent behavior expose named **variants**. Example: traverse has `stop-at-first`, `call-all-first-wins` and `accumulate`.

### Scenes

`ShapeDiagram` receives a `Scene` and never an operation name:

```ts
interface Scene { lanes: Lane[]; links: Link[]; annotations: Note[]; summary: string[]; timeline?: { ticks: number } }
interface Lane  { id: string; role: "input" | "function" | "output"; receiver: ReceiverId; items: Item[] }
interface Item  { id: ItemId; kind: "value" | "error" | "none" | "nested"; label: string; t?: number; state?: "computed" | "skipped" }
```

Item IDs are stable, so the renderer can animate continuity between scenes. The text summary is generated from the same Scene.

### Catalog

```ts
interface EcosystemEntry {
  operationId: OperationId
  ecosystem: EcosystemId          // "languageext" | "csharp-bcl" | "fsharp" | "fp-ts" | "effect" | "haskell"
  library: LibraryId              // e.g. "fsharp-core", "fstoolkit", "fsharpplus", "mtl", "either"
  receiver: ReceiverId
  status: "equivalent" | "library" | "partial" | "analogy" | "none"
  api?: { name: string; module?: string; signature: string }  // that ecosystem's own parameter order
  variant?: VariantId             // links the API to the semantics variant it implements
  caveat?: string
  verified: { against: string; on: string; url: string }      // library version, ISO date, doc URL
  aliases?: AliasRecord[]
  snippet?: SnippetRef
}
```

Signatures are structured `TypeExpression`s, not display strings. That covers the canonical signature on each operation and the `api.signature` on each entry, which must keep that ecosystem's own parameter order. A formatter renders them for display in each ecosystem's own notation.

```ts
type TypeExpression =
  | { kind: "var"; name: string }                                  // A, B, E
  | { kind: "ctor"; name: string; args: TypeExpression[] }         // F<A>, Either<E, A>, List<A>
  | { kind: "fn"; params: TypeExpression[]; result: TypeExpression }
  | { kind: "tuple"; elements: TypeExpression[] }
```

"No equivalent" is an explicit `status: "none"` record, never a missing key. A missing entry renders as "not yet researched", never as another ecosystem's example.

### Signature search (reverse Hoogle)

The query is a signature in a neutral notation, for example `List<Option<A>> -> Option<List<A>>`, `(A -> F<B>) -> F<A> -> F<B>` or `F<F<A>> -> F<A>`. Matching works as follows:

- **Equivalences.** Matching is up to:
  - renaming type variables (alpha-equivalence)
  - currying and uncurrying
  - argument order, including receiver-first vs receiver-last (pipe) styles
- **Concrete types.** A concrete receiver in the query (`List`, `Option`, `Either<E, _>`, `Validation`, `Task`) unifies with abstract constructor variables (`F`, `T`) when that receiver is a known instance of the required abstraction.
- **Ranking.** Exact matches rank first, then matches that needed argument reordering or currying, then matches that only fit once the query is generalized (e.g. `Either<E, A>` read as `P<E, A>`).
- **Results.** The operation, the abstraction it belongs to, and the matching ecosystem entries, so a query can land directly on "fp-ts `RA.traverse(E.getApplicativeValidation(S))`".
- **Scope.** Keep it small: a few hundred catalog signatures, no general type checker, no type classes beyond the catalog's abstraction table. The input syntax should accept common ecosystem spellings (`a -> m b`, `Func<A, B>`, `'a -> 'b`) and normalize them.

## Versioning

An ecosystem can document **several version tracks** side by side. Version tags are required at four levels.

1. **Version tracks (pins).** `catalog/ecosystems.ts` declares one or more tracks for each library, each with an exact pin:

   ```ts
   interface VersionTrack { id: string; version: string; channel: "stable" | "beta" | "maintenance"; default?: boolean }

   languageext: [{ id: "v4", version: "4.4.9", channel: "stable", default: true },
                 { id: "v5", version: "5.0.0-beta-78", channel: "beta" }]
   effect:      [{ id: "v4", version: "4.0.5", channel: "stable", default: true }]
   ```

   - Column headers and the names panel show the active track as a chip.
   - An ecosystem with more than one track gets a **version switcher**. Its choice is kept in the URL (`?languageext=v5`) so links stay shareable.
   - Abstraction records are per track too. For example, LanguageExt v5 has first-class traits (`Functor<F>` via `K<F,A>`), while v4 has struct-based type classes.

2. **Entries per track.**
   - An entry lists the tracks it applies to (`tracks: ["v4", "v5"]` when the API is identical in both), so unchanged APIs aren't duplicated.
   - When an API differs between tracks, there is one entry per track, linked by a `crossTrack` note that says what changed:
     - `argument-order`: e.g. `Match(Right, Left)` → `Match(Left, Right)`
     - `renamed`
     - `semantics`: e.g. v4 `Traverse`/`Sequence` vs Haskell's meaning
     - `removed`: e.g. v4 `EitherAsync`
   - Each entry records the version it was verified against and the date.
   - Catalog validation flags an entry as **stale** when `verified.against` differs from its track's pin, so upgrading a pin produces a re-verification list instead of silent drift.

3. **Name history.**
   - Aliases carry `track`, `since`, `legacy` (with its replacement) and `removedIn`/`renamedTo`.
   - Search covers names from every track and labels each result with its track. Searching `EitherAsync` shows "LanguageExt v4 only; removed in v5".
   - Versions that are not documented tracks (Effect v3, fp-ts legacy aliases) exist only as aliases. Searching `catchAll` shows "Effect v3 name; in v4 use `catch`".

4. **Snippets.**
   - Each snippet records its track and the exact versions it was tested with, and lives as a real file under `snippets/<ecosystem>/<track>/`.
   - CI compiles each track separately against lockfiles that match its pins:
     - TypeScript: `tsc --noEmit` with `fp-ts@2.16.11` and `effect@4.0.5`.
     - C#/F#: one `dotnet build` project per track. LanguageExt 4.4.9 and 5.0.0-beta-78 get separate projects, so a snippet can't compile by accident against the wrong version.
     - Haskell: `cabal build` with a freeze file. This can come later.
   - A snippet displays its track/version tag and either "compiled in CI" or "unchecked".

## Routes

```text
#/                                       operation list
#/op/:operationId?receiver=&variant=&ecosystem=
#/abstraction/:abstractionId
#/index                                  matrix index: names, glossary terms, snippets
```

Redirect old prototype hashes: `#explore` → `#/`, and `#concept/<id>` → `#/abstraction/<id>` where that abstraction exists, otherwise `#/`. Unknown routes fall back to `#/`.

## Styling and accessibility

- Port the existing CSS before refactoring it.
- Keep the lavender interface, Manrope/DM Mono, the badges and shapes, the responsive collapse, and the high-contrast toggle.
- Move repeated colors and spacing into CSS custom properties.
- The screenshot is a comparison reference, not a reason to hard-code desktop dimensions.

Accessibility requirements:

- Semantic landmarks
- Keyboard operation of search, of result selection, and of every input-editor control
- Visible focus states
- `aria-live` announcements when a scene changes
- A text summary next to every diagram, so meaning never depends on animation or color
- Sufficient contrast in both modes
- `prefers-reduced-motion`: render the stable end state with no automatic movement

## Testing strategy

- **Laws:** fast-check property tests of the Functor, Applicative, Monad and Traversable laws (as stated in the Haskell base docs) for every receiver that claims them. Validation is tested as an Applicative that is not a Monad.
- **Traps:** a fixed test for each guardrail above, e.g. elements 2 and 4 fail under each traverse variant, or `[1,2]` × `"ab"` gives 4 cartesian pairs vs 2 positional pairs.
- **Scenes:** structural assertions on scene output, not pixel snapshots.
- **Catalog validation:**
  - unique IDs
  - every entry has `verified`
  - every `variant` exists in semantics
  - stale-version report
  - no alias resolves ambiguously without returning several candidates
- **Search:** exact beats prefix, prefix beats substring. For signatures: alpha-equivalence, currying, argument reordering and concrete-to-abstract unification each have tests, plus a golden query list. `SelectMany`, `fold` and `join` return several qualified candidates.
- **Snippets:** compiled in CI against the pinned versions.
- **Routes:** every route renders, old hashes redirect, and URL state restores the selection.
- **Smoke:** one Playwright test that loads an operation, edits an input, switches variant and ecosystem, opens the index, and checks that a mobile viewport doesn't overflow.

## GitHub Pages deployment

Static `dist/` output. For `https://<username>.github.io/fp-shapes/`, use Vite `base: "/fp-shapes/"`.

The Pages workflow (based on the current official guidance):

1. Trigger on pushes to the default branch and on manual dispatch.
2. Check out the repository.
3. Install Node.
4. Run a reproducible install.
5. Run the tests and the snippet checks.
6. Build.
7. Upload `dist/`.
8. Deploy through the Pages action.

Grant only the permissions Pages needs. No secrets are required.

## Milestones

1. **Decisions and research.** Done (2026-10-21). The research reports are kept in the "FP Shapes Research" artifact (https://claude.ai/artifact/SA8MMv26fNWtq1wSuXWKPX) for now. It is private to the repo owner.
2. **Scaffold.** Vite/React/TS strict, Vitest, fast-check, `HashRouter`, the Pages workflow, the ported CSS, and the layer-boundary lint rule. *Exit:* the empty shell deploys, and importing React from `src/semantics` fails lint.
3. **Semantics core.** Receivers, the Tier 1 operations with variants and traces, and the law and trap tests. *Exit:* all laws pass for every receiver that claims them.
4. **Scenes.** Builders for each visual family (preserve, flatten, both branches, eliminate, flip nesting, combine) and the text summaries. *Exit:* every Tier 1 topic has scenes for all of its receivers.
5. **Rendering and input editing.** `ShapeDiagram`, `InputEditor`, ghosted skipped calls, reduced motion. *Exit:* switching traverse variants visibly changes which calls happened.
6. **Catalog, versioning and search.** Fill entries from the research with their verification records, derive the alias index and the glossary, and add catalog validation and the stale report. *Exit:* every matrix cell is a typed entry, including `none`.
7. **Pages and the index.** Operation pages with the names panel, abstraction pages that lead with how each ecosystem represents the abstraction and show laws as pairs of equal diagrams, the matrix index with glossary terms and versioned snippets, and the snippet CI.
8. **Signature search.** Parse queries in the neutral notation and the common ecosystem spellings, normalize them, and match and rank them against catalog signatures. *Exit:* `List<Option<A>> -> Option<List<A>>`, `a -> m b` style bind, `F<F<A>> -> F<A>`, and `(A -> B) -> List<A> -> List<B>` each return the expected operation as the top result, together with its ecosystem entries.
9. **Async marbles.** A timeline renderer for concurrent vs sequential traverse, cancellation, and async `zip`.
10. **Optional.** Static HTML pages for each operation, generated at build time for search-engine discoverability.

## Definition of done (launch)

- Every Tier 1 topic is interactive, with computed scenes, for each of its receivers and variants.
- Laws and trap tests pass, and no diagram is hand-authored.
- Every matrix cell exists as a typed entry with its version, its verification record, and either a status or an explicit `none`.
- Pinned versions appear in the UI, and catalog validation reports no stale entries.
- Snippets shown on the site compile in CI, or are labeled "unchecked".
- Ambiguous aliases return several qualified candidates, and signature search finds every Tier 1 operation from its canonical signature and from at least one concrete instantiation.
- The static build deploys to GitHub Pages and needs no account. No backend or secrets.

## Agent working rules

- Verify semantics against the primary docs for the pinned version before adding them to the catalog. Never port claims from the prototype unchecked.
- Keep each milestone runnable, and prefer small, reviewable commits.
- Keep semantic corrections, catalog expansion and UI work in separate commits.
- Add a regression test whenever you fix a catalog-resolution, ecosystem-selection or variant bug.
- Record semantic uncertainty as `unverified` rather than asserting equivalence.
- The typed catalog is the single source of truth. Navigation, the glossary and the alias index are derived from it, never maintained as parallel lists.
