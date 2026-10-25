# FP Shapes design

FP Shapes is a static site with one page per functional programming operation, such as `map`, `flatMap` and `traverse`. Each page has three parts:

1. **Shape**: what the operation does to the layers of a type, such as which layers move, stay, appear or disappear.
2. **Behavior**: a diagram computed by running a reference implementation on inputs the reader can change. It shows which calls ran and what came out.
3. **Examples**: what LanguageExt, fp-ts, Effect and Haskell call the operation, each with a short sample that is compiled or run in this repo.

The readers are C# and TypeScript developers. Every line should be short and plain. It should also hold up for readers who know Haskell.

## Principles

- **Computed, never drawn.** Diagrams come from running the reference semantics, and Shape diagrams come from the types. Nothing is hand-drawn.
- **Primary sources.** Every claim about a library is checked against that library at its pinned version, by tests or by compiled samples. A claim that hasn't been checked yet is marked Preview.
- **The receiver decides the result.** The evaluation strategy decides only which calls run.
  - Either and Option keep the first failure. Validation keeps every failure, because of its applicative, not because traverse has a mode.
  - Where libraries differ in which calls they make, a page offers named strategies: `short-circuit` ("Stop") and `eager` ("Keep going"). Tests check that every strategy gives the same result.
- **Three levels, kept apart.** An *abstraction*, such as Functor, is separate from an *instance* (a receiver type with its own behavior), which is separate from an *API name*.
  - `IEnumerable.Select` is `map` for one type. That doesn't make LINQ a Functor.
  - `Func<A, B>` is the function argument. `Action<T>`, which returns void, corresponds to peek.
- **"No equivalent" is an answer.** It is an explicit `none` entry, never a missing one.

## Distinctions the site keeps visible

- **Short-circuit vs accumulate.** Some APIs call every function but still return only the first error, such as LanguageExt v4's `Seq.Sequence(f)` and fp-ts's `RA.traverse(E.Applicative)`.
- **Positional vs cartesian zip.** List's applicative pairs every element with every element. `zipWith`, `Enumerable.Zip` and `RA.zipWith` pair by position and stop at the shorter list.
- **Parameter order.** Effect puts the success type first, as in `Result<A, E>`. Haskell and fp-ts put the error first. Argument order for handlers also differs: LanguageExt v4 takes the Right handler first.
- **Validation is not a Monad.** A library that offers bind on Validation stops at the first failure.
- **Names that mean different things.**
  - `fold` is match in fp-ts, but Foldable in Haskell.
  - `Do` is do-notation in fp-ts, but a peek in LanguageExt.
  - mtl's `mapError` isn't a map over the error.
  - `fail` in Haskell belongs to `MonadFail`.

## Architecture

The layers depend only downward. `tests/architecture.test.ts` enforces this.

```text
src/
├── semantics/   receivers and reference operations; each returns a Run (result + trace of calls made and skipped)
├── scenes/      pure builders: (operation, receiver, strategy, inputs) → Scene, Shape Ribbon and captions
├── catalog/     navigation, ecosystem entries, and the generated sample index
└── ui/          React: one generic OperationPage renders every operation from scenes and catalog data
snippets/        runnable samples per ecosystem, checked against the pinned versions
tests/           conformance tests against real fp-ts and Effect, plus registry and sample checks
```

- **No per-operation UI.** Adding an operation means adding semantics, scene builders, catalog entries and samples. `CLAUDE.md` lists the steps.
- **Shape Ribbon.** It is derived from each receiver's before and after types. It shows what moved, what stayed, what was introduced or removed, and whether the payload changed. Free type variables are drawn as ghosts.
- **Catalog entries.** Each entry has an API name, a status, an optional one-sentence note and a sample. The statuses are:
  - `equivalent`: the same behavior
  - `library`: needs an extra package
  - `partial`: close, and the note says how it differs
  - `analogy`: no direct counterpart; this is the usual idiom
  - `none`: no equivalent

## Verification

| Ecosystem | Pin | How it's checked |
|---|---|---|
| fp-ts | 2.16.11 | `tests/conformance/` runs the real library against the reference semantics, comparing results and which calls happened. |
| Effect | 4.0.5 | The same conformance tests. |
| LanguageExt | 4.4.9 | `snippets/languageext/v4` compiles and runs every sample, with a check on each result. |
| Haskell | base 4.22.0.0 (GHC 9.14), mtl 2.3.2, either 5.0.3, semigroupoids 6.0.1 | `snippets/haskell` runs every sample. Entries stay in Preview until this passes on the pinned GHC. |

Samples are extracted into `src/catalog/samples.generated.ts`. Tests fail if that file is stale, or if a sample and its catalog entry don't match up. Laws (Functor, Applicative, Monad, Traversable) are property-tested with fast-check. They live in the tests, not in site copy.

## Non-goals

- Accounts, a backend, a database, or server-side rendering
- Analysis of pasted code, or compilers running in the browser
- Indexing whole library APIs
- Signature search
- Standalone learning content, such as learning paths, essays or labs

## Roadmap

These are planned or deferred, and not built yet:

- **More ecosystems:**
  - F#: FSharp.Core, FsToolkit.ErrorHandling and FSharpPlus, each entry tagged with its library
  - C# BCL and LINQ
- **Version tracks.**
  - LanguageExt v5 alongside v4, with one entry per track where the APIs differ, and a version switcher.
  - Effect v3 names as legacy aliases.
- **Name lookup.** Find an operation by any ecosystem's name. Ambiguous names, such as `SelectMany`, `fold` and `join`, would return several candidates.
- **Index and abstraction pages:**
  - a matrix of every operation's name in every ecosystem
  - pages per abstraction that show its laws as pairs of equal diagrams
- **Async.** Concurrent traverse and cancellation, on a timeline.
