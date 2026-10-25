# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Current state

The app is a static Vite, React and TypeScript site in `src/`. `AGENT_HANDOFF.md` is the spec. It covers the decisions, architecture, catalog and versioning model, routes, test plan, milestones and definition of done. Read it before starting any build work.

- **Product direction: RxMarbles + reverse Hoogle, as an FP Rosetta stone.** **Shape is the organizing principle:** every operation page, search result, matrix cell detail and abstraction example shows the same **Shape Ribbon**. It is derived from the canonical `TypeExpression` and shows which layers moved, stayed, appeared or disappeared. Operation pages run shape → behavior → ecosystems, the navigation uses fp-ts/Effect `@category` groups (Constructors, Mapping, Sequencing, Zipping, Traversing, Error handling, Pattern matching, Filtering), and each operation page shows its canonical abstraction (Functor, Monad, …) as a tag in its header. The tag names a type class, as Haskell base/mtl names it, or as fp-ts does when base has none (Alt, Filterable); plain functions that belong to no class (conversions, eliminators, side effects) get no tag. Ecosystem-specific remarks (a Haskell name that means something else, an argument-order trap) go in that ecosystem's catalog note, never in page headers or captions. The navigation shows names only. Concurrent traverse is deferred. Each page covers one operation. Inputs are interactive, and the diagram is **computed** by running a reference implementation, never hand-written. You can find an operation by its name in any ecosystem *or* by a type signature (`List<Option<A>> -> Option<List<A>>` → `sequence`). That makes signatures structured `TypeExpression`s, never display strings. A matrix index shows the API name in each target ecosystem, along with versioned snippets and glossary terms. "No equivalent" counts as a real answer. Learn paths, concept essays and example labs are out of scope.
- **Semantics come from primary docs.** Verify every semantic claim against the primary docs for the pinned library version (see "Semantic authority" in `AGENT_HANDOFF.md`).

## Commands

```sh
npm test                                   # vitest run: laws, traps, layer-boundary checks
npx vitest run src/semantics/traverse.test.ts   # one test file
npx vitest run -t "stop at first"          # tests whose name matches
npm run typecheck                          # tsc (strict, noEmit)
npm run dev                                # Vite dev server at http://localhost:5173/ (base / in dev)
npm run build                              # typecheck + static build to dist/ (base /fp-shapes/)
npm run samples:languageext                # compile and check the LanguageExt 4.4.9 samples (needs the .NET SDK)
npm run samples:extract                    # regenerate src/catalog/samples.generated.ts after editing any sample
```

Stack: Vite 8, React 19, TypeScript 7 (strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`), Vitest 5, fast-check 4. In fast-check properties, use `void expect(...)` or a block body. This Vitest's matchers return a value that fast-check reads as a failed property.

`tests/conformance/` runs real fp-ts 2.16.11 and effect 4.0.5 code (exact-pinned devDependencies) against the reference semantics, comparing results and which calls happened. Keep those pins equal to the catalog's. When you add a catalog claim for fp-ts or Effect, add a conformance test for it. Laws belong in the project docs and the tests, not in site copy.

`tests/architecture.test.ts` enforces the layer boundaries described below. Pure layers (`semantics`, `scenes`, `catalog`, `search`) can't import npm packages, except test files, which may use `vitest` and `fast-check`.

## Planned architecture (layers depend only downward; enforce with a lint rule)

- `src/semantics/` contains receivers (Option, Either, Validation; later List, ZipList, Tuple) and reference operations. Each run returns its result plus a trace of the calls made and skipped. **The receiver decides the result; evaluation strategy (`short-circuit` | `eager`) decides only which calls run.** Validation accumulates because of its applicative, not because of a traverse "mode". This layer must never import React or any other layer.
- `src/scenes/` holds pure builders that map (operation, receiver, evaluation strategy, inputs) to a `Scene` plus a text summary. `ShapeDiagram` renders Scenes and never branches on operation names.
- `src/catalog/` holds `EcosystemEntry` records: API name, the ecosystem's own signature order, `status` (`equivalent` | `library` | `partial` | `analogy` | `none`), a `strategy` link, version and verification data, aliases with name history, and optional snippet refs. It also holds abstraction records describing how each ecosystem represents Functor, Monad and so on: first-class, encoded, library-only or absent. Syntax that resolves by method name (LINQ query syntax, F# CE builders) counts as "absent (syntax only)".
- Derived, never hand-maintained: the alias index, the glossary and navigation. An ambiguous alias (`SelectMany`, `fold`, `join`, `Do`) returns several qualified candidates.

## Adding or changing an operation (no per-operation React)

Every operation page is rendered by one generic `src/ui/OperationPage.tsx` and `SceneView.tsx`. To add an operation:
1. **Semantics:** implement it in `src/semantics/` so that it returns a `Run` with a trace. Add law and trap tests.
2. **Scenes:** add a builder for each receiver in `src/scenes/registry.ts`. Each builder supplies the ribbon spec, the default toggles (true means that input fails; a number picks a case of a multi-case slot), the evaluation strategies, and a `build` that runs the semantics and returns a `Scene`.
3. **Catalog:** add the navigation entry to `src/catalog/operations.ts`. Reviewed ecosystem names are always shown. An entry still under review gets `preview: true` and shows only when the viewer turns on the Preview switch, which warns that preview content may not be accurate. fp-ts and Effect entries go in `src/catalog/names.ts`, each backed by a conformance test; LanguageExt 4.4.9 entries go in `src/catalog/languageext.ts`.
4. **Samples:** every entry shows a sample, and every sample is code that runs:
   - fp-ts: `snippets/fp-ts/samples.ts`
   - Effect: `snippets/effect/samples.ts`
   - LanguageExt: `snippets/languageext/v4/Program.cs`

   Put the shown code between `// <sample op:receiver[:strategy]>` and `// </sample>`. Add an expected result: in `tests/samples.test.ts` for TypeScript, or a `Check` in Program.cs. Keep test instrumentation outside the markers. Then run `npm run samples:extract`, which regenerates `src/catalog/samples.generated.ts`. Tests fail if that file is stale, if a sample has no catalog entry, or if an entry has no sample.

`tests/registry.test.ts` checks that the navigation, registry and names agree, that every receiver builds for every strategy, and that every toggle can be clicked in the default state.

## Pinned ecosystems

- Effect 4.0.5. v3 names are indexed only as legacy aliases.
- fp-ts 2.16.11 (in maintenance).
- F#: FSharp.Core 10.1.402, FsToolkit.ErrorHandling 5.2.0, FSharpPlus 1.9.1. Tag each entry with its library.
- Haskell: base 4.22.0.0, mtl 2.3.2, `either` 5.0.3 (`Data.Either.Validation`), async 2.2.6.
- C# BCL/LINQ for .NET 10.
- LanguageExt: **v4 (4.4.9) only in the initial scope.** v5 (5.0.0-beta-78) is deferred, but the model supports several version tracks per ecosystem.

An ecosystem can have several version tracks. Entries list the tracks they apply to. APIs that differ between tracks get one entry per track, linked by a `crossTrack` note (argument-order, renamed, semantics or removed). Snippets are compiled once per track, and the UI shows a version switcher whose choice is kept in the URL. Catalog validation flags any entry whose verified version differs from its track's pin.

## Rules that are easy to violate

- Keep abstraction, instance and API name separate. `Select` is `map` for `IEnumerable` (an instance method), never "LINQ's Functor". `Func<A, B>` is the function argument; `Action<T>` (void) corresponds to peek.
- The receiver type is part of the answer. Keep these distinctions visible:
  - short-circuit vs accumulate
  - positional vs cartesian `zip`
  - each ecosystem's own parameter order (F#/Effect put success first; Haskell/fp-ts put the error first)
  - Validation is not a Monad
  - concurrency and cancellation behavior
- Use HashRouter. Unknown routes fall back to the default operation.
- Add a regression test whenever you fix a catalog-resolution, ecosystem-selection or evaluation-strategy bug.
