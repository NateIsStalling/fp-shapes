# FP Shapes

Interactive diagrams of functional programming operations: RxMarbles plus a reverse Hoogle, as a Rosetta stone for functional programming.

Each operation page shows:

- **Shape:** what the operation does to the layers of a type (which move, stay, appear or disappear).
- **Behavior:** a diagram computed by running a reference implementation on inputs you can change.
- **Ecosystems:** what the operation is called in each library, with a sample that is compiled or run in this repo.

## Operations

Grouped as fp-ts and Effect group them:

- **Constructors:** pure, fail, fromNullable, fromPredicate, tryCatch
- **Mapping:** map, bimap
- **Sequencing:** flatMap, flatten, tap, peek
- **Zipping:** zip / map2
- **Traversing:** traverse, sequence
- **Error handling:** mapError, recover, alt, getOrElse
- **Pattern matching:** match
- **Filtering:** filter, filterMap, partition, filterOrElse

## Ecosystems

| Ecosystem | Version | How samples are checked |
|---|---|---|
| fp-ts | 2.16.11 | Run by `npm test`, plus conformance tests against the reference semantics |
| Effect | 4.0.5 | Run by `npm test`, plus conformance tests against the reference semantics |
| LanguageExt | 4.4.9 | Compiled and run by `npm run samples:languageext` (needs the .NET SDK) |

Planned: F# (FSharp.Core, FsToolkit.ErrorHandling, FSharpPlus), Haskell, and C# BCL/LINQ.

## Development

```sh
npm install
npm run dev                  # http://localhost:5173/
npm test                     # semantics, laws, conformance, samples, UI
npm run build                # typecheck + static build to dist/
npm run samples:languageext  # compile and check the LanguageExt samples
npm run samples:extract      # regenerate the sample index after editing a sample
```

Stack: Vite, React and TypeScript, built as a static site for GitHub Pages. There is no backend.

## Docs

- `AGENT_HANDOFF.md`: the spec, with decisions, architecture, versioning model and test plan.
- `CLAUDE.md`: working notes for the codebase, including how to add an operation.
