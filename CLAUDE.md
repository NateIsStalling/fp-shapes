# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Current state

The app is a static Vite, React and TypeScript site in `src/`. `docs/design.md` describes the design: principles, architecture, verification, non-goals and roadmap. Read it before starting build work.

- **Product direction: interactive, computed diagrams of FP operations, with each operation's name in every target ecosystem.** Signature search is out of scope. **Shape is the organizing principle:** every operation page shows the same **Shape Ribbon** (and any future index or abstraction page should reuse it). It is derived from the canonical `TypeExpression` and shows which layers moved, stayed, appeared or disappeared. Operation pages run shape → behavior → examples, the navigation uses fp-ts/Effect `@category` groups (Constructors, Mapping, Sequencing, Zipping, Traversing, Error handling, Pattern matching, Filtering). The page header shows the name, the generic signature, an `F =` row naming the receiver (a picker when there are several, a fixed chip when there is one) and the concrete signature. It shows no type-class tag: the site is a cheat sheet for readers coming from C# and TypeScript, so class names (Functor, Monad, …) belong in the Haskell catalog notes until they can be taught properly. Ecosystem-specific remarks (a Haskell name that means something else, an argument-order trap) go in that ecosystem's catalog note, never in page headers or captions. The navigation shows names only. Concurrent traverse is deferred. Each page covers one operation. Inputs are interactive, and the diagram is **computed** by running a reference implementation, never hand-written. "No equivalent" counts as a real answer. Name lookup and a matrix index are on the roadmap in `docs/design.md`, not built. Learn paths, concept essays and example labs are out of scope.
- **Semantics come from primary docs.** Verify every semantic claim against the primary docs for the pinned library version (see "Principles" in `docs/design.md`).

## Commands

```sh
npm test                                   # vitest run: laws, traps, layer-boundary checks
npx vitest run src/semantics/traverse.test.ts   # one test file
npx vitest run -t "stop at first"          # tests whose name matches
npm run typecheck                          # tsc (strict, noEmit)
npm run dev                                # Vite dev server at http://localhost:5173/ (base / in dev)
npm run build                              # typecheck + static build to dist/ (base /fp-shapes/)
npm run samples:languageext                # compile and check the LanguageExt 4.4.9 samples (needs the .NET SDK)
npm run samples:haskell                    # build and check the Haskell samples (needs GHC 9.14 for base 4.22.0.0, and cabal)
npm run samples:extract                    # regenerate src/catalog/samples.generated.ts after editing any sample
```

Stack: Vite 8, React 19, TypeScript 7 (strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`), Vitest 5, fast-check 4. In fast-check properties, use `void expect(...)` or a block body. This Vitest's matchers return a value that fast-check reads as a failed property.

`tests/conformance/` runs real fp-ts 2.16.11 and effect 4.0.5 code (exact-pinned devDependencies) against the reference semantics, comparing results and which calls happened. Keep those pins equal to the catalog's. When you add a catalog claim for fp-ts or Effect, add a conformance test for it. Laws belong in the project docs and the tests, not in site copy.

`tests/architecture.test.ts` enforces the layer boundaries described below. Pure layers (`semantics`, `scenes`, `catalog`, `search`) can't import npm packages, except test files, which may use `vitest` and `fast-check`.

## Architecture (layers depend only downward)

- `src/semantics/` contains receivers (Option, Either, Validation, List, ZipList, Tuple) and reference operations. Each run returns its result plus a trace of the calls made and skipped. **The receiver decides the result; evaluation strategy (`short-circuit` | `eager`) decides only which calls run.** Validation accumulates because of its applicative, not because of a traverse "mode". This layer must never import React or any other layer.
- `src/scenes/` holds pure builders that map (operation, receiver, evaluation strategy, inputs) to a `Scene` plus a text summary. `SceneView` renders Scenes and never branches on operation names.
- `src/catalog/` holds the navigation (`operations.ts`) and the ecosystem entries: API name, `status` (`equivalent` | `library` | `partial` | `analogy` | `none`), an optional note, and a sample from `samples.generated.ts`. Entries are keyed `op:receiver` or `op:receiver:strategy`.
- Planned, not built: a `search/` layer for name lookup (the architecture test already reserves it) and abstraction records. Keep anything derived (aliases, glossary, navigation) derived from the catalog, never hand-maintained.

## Adding or changing an operation (no per-operation React)

Every operation page is rendered by one generic `src/ui/OperationPage.tsx` and `SceneView.tsx`. To add an operation:
1. **Semantics:** implement it in `src/semantics/` so that it returns a `Run` with a trace. Add law and trap tests.
2. **Scenes:** add a builder for each receiver in `src/scenes/registry.ts`. Each builder supplies the ribbon spec, the default toggles (true means that input fails; a number picks a case of a multi-case slot), the evaluation strategies, and a `build` that runs the semantics and returns a `Scene`.
3. **Catalog:** add the navigation entry to `src/catalog/operations.ts`. While `UNDER_CONSTRUCTION` in `src/ui/App.tsx` is true, the whole site sits behind Preview: with it off, every route shows a "Site under construction" landing page. Reviewed ecosystem names are always shown. An entry still under review gets `preview: true` and shows only when the viewer turns on the Preview switch, which warns that preview content may not be accurate. fp-ts and Effect entries go in `src/catalog/names.ts`, each backed by a conformance test; LanguageExt 4.4.9 entries go in `src/catalog/languageext.ts`.
4. **Samples:** every entry shows a sample, and every sample is code that runs:
   - fp-ts: `snippets/fp-ts/samples.ts`
   - Effect: `snippets/effect/samples.ts`
   - LanguageExt: `snippets/languageext/v4/Program.cs`
   - Haskell: `snippets/haskell/Main.hs` (markers use `--`); entries in `src/catalog/haskell.ts`. Haskell entries stay `preview` until `npm run samples:haskell` passes on the pinned GHC.

   Put the shown code between `// <sample op:receiver[:strategy]>` and `// </sample>`. Add an expected result: in `tests/samples.test.ts` for TypeScript, or a `Check` in Program.cs. Keep test instrumentation outside the markers. Then run `npm run samples:extract`, which regenerates `src/catalog/samples.generated.ts`. Tests fail if that file is stale, if a sample has no catalog entry, or if an entry has no sample.

`tests/registry.test.ts` checks that the navigation, registry and names agree, that every receiver builds for every strategy, and that every toggle can be clicked in the default state.

## Page copy and examples

The site is a cheat sheet for C# and TypeScript developers, so every line must be short and consistent from page to page. It also has to hold up for readers who know Haskell.

- **Shape caption:** use the generated one from `describeTypes`. Write a custom `ribbon.caption` only when the generated one would be wrong, as for `fail` and `partition`, and match its voice.
- **Behavior caption:** at most two sentences.
  - First what ran ("`f` ran on `a`", "`p` failed", "so `f` didn't run"), then "The result is `X`."
  - Use past tense, and put constructor names in code (`Some`, `Left`).
  - Don't name the operation, other operations or ecosystems.
- **Value names in diagrams:**
  - Name each value after its type's letter in lowercase: `a` for `A`, `e` for `E`, `b` for `B`, `r` for `R`.
  - Give a second value of the same type a subscript, such as `e₁` and `e₂`, or `a₁` for the input and `a₂` for the fallback. This matches `E₂` in the types.
  - Never use primes or unrelated letters.
- **Behavior note** (`receiver.note`): one sentence, only for a receiver-specific trap the diagram can't show.
- **Examples:**
  - Each page key shows one entry per ecosystem, in the order LanguageExt, fp-ts, Effect, Haskell. Use a `none` entry when there is nothing.
  - The api field is one qualified name: `E.map`, `Result.map`, `Either.Map`, `fmap`.
  - Notes are at most one sentence and only when they add something: argument order or shape, a legacy name ("Legacy name: `chain`."), a trap, or the Haskell module ("From `Data.Bifunctor`.").
  - Samples run the same scenario, with the same values, in every ecosystem: an optional helper, then `input`, then `result`, with no comments.

## Pinned ecosystems

- Effect 4.0.5. Indexing v3 names as legacy aliases is planned, not built.
- fp-ts 2.16.11 (in maintenance).
- Planned, not yet in the catalog: F# (FSharp.Core 10.1.402, FsToolkit.ErrorHandling 5.2.0, FSharpPlus 1.9.1; tag each entry with its library) and C# BCL/LINQ for .NET 10.
- Haskell: base 4.22.0.0 (GHC 9.14), mtl 2.3.2, `either` 5.0.3 (`Data.Either.Validation`), semigroupoids 6.0.1 (`Data.Functor.Alt`, already a dependency of `either`). Each entry names its package.
- LanguageExt: **v4 (4.4.9) only in the initial scope.** v5 (5.0.0-beta-78) is deferred, but the model supports several version tracks per ecosystem.

Version tracks (several pins per ecosystem, such as LanguageExt v4 and v5) are on the roadmap. Until then each ecosystem has one pin, and the catalog, samples and conformance tests must all agree on it.

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
