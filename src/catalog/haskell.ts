// Haskell entries: base 4.22.0.0 (GHC 9.14), mtl 2.3.2, either 5.0.3
// (Data.Either.Validation) and semigroupoids 6.0.1 (Data.Functor.Alt).
// Samples live in snippets/haskell/Main.hs (`npm run samples:haskell`).
// Every entry stays in Preview until that run passes on the pinned GHC.
// Status: all samples pass on GHC 9.10.3 (base 4.20.1.0), built with
// `--allow-older=fp-shapes-samples:base`; not yet run on GHC 9.14.1.

export const HASKELL_PACKAGES = { base: "4.22.0.0", mtl: "2.3.2", either: "5.0.3", semigroupoids: "6.0.1" } as const;
export type HaskellPackage = keyof typeof HASKELL_PACKAGES;

export interface HaskellEntry {
  readonly api: string;
  readonly status: "equivalent" | "library" | "partial" | "analogy" | "none";
  readonly pkg: HaskellPackage;
  readonly note?: string;
  // Shown only when Preview is on, until the samples have run.
  readonly preview: true;
}

const P = { preview: true } as const;
const VALIDATION = "From `Data.Either.Validation`.";
const NO_NULL = "Haskell has no `null`; start from the `Maybe` that `lookup` returns.";
const EVALUATE = "Catches only in `IO`, and only after `evaluate` forces the value; a lazy value would escape `try`.";

export const haskell: Readonly<Record<string, HaskellEntry>> = {
  // Constructors
  "pure:either": { api: "pure", status: "equivalent", pkg: "base", note: "`Right` works too.", ...P },
  "pure:option": { api: "pure", status: "equivalent", pkg: "base", note: "`Just` works too, and Haskell has no `null` to put in.", ...P },
  "pure:validation": { api: "pure", status: "library", pkg: "either", note: `${VALIDATION} \`Success\` works too.`, ...P },
  "pure:list": { api: "pure", status: "equivalent", pkg: "base", note: "`[2]` works too.", ...P },
  "fail:either": { api: "Left", status: "equivalent", pkg: "base", note: "Not `fail`, which is `MonadFail`'s and has no `Either` instance; mtl's `throwError` works too.", ...P },
  "fail:option": { api: "Nothing", status: "equivalent", pkg: "base", note: "`empty` works too.", ...P },
  "fail:validation": { api: "Failure", status: "library", pkg: "either", note: VALIDATION, ...P },
  "fail:list": { api: "[]", status: "equivalent", pkg: "base", note: "`empty` works too.", ...P },
  "fromNullable:either": { api: "maybe (Left e) Right", status: "analogy", pkg: "base", note: NO_NULL, ...P },
  "fromNullable:option": { api: "No equivalent", status: "none", pkg: "base", note: "Haskell has no `null`; a missing value is already a `Maybe`, such as the result of `lookup`.", ...P },
  "fromNullable:validation": { api: "maybe (Failure [e]) Success", status: "analogy", pkg: "either", note: `${VALIDATION} ${NO_NULL}`, ...P },
  "fromNullable:list": { api: "maybeToList", status: "analogy", pkg: "base", note: `From \`Data.Maybe\`. ${NO_NULL}`, ...P },
  "fromPredicate:either": { api: "if p a then Right a else Left (f a)", status: "analogy", pkg: "base", note: "base has no named function for this.", ...P },
  "fromPredicate:option": { api: "mfilter p (Just a)", status: "partial", pkg: "base", note: "From `Control.Monad`. There is no single function; wrap in `Just`, then filter.", ...P },
  "fromPredicate:validation": { api: "if p a then Success a else Failure [f a]", status: "analogy", pkg: "either", note: `${VALIDATION} either has no named function for this.`, ...P },
  "fromPredicate:list": { api: "filter p [a]", status: "partial", pkg: "base", note: "There is no single function; wrap in a list, then filter.", ...P },
  "tryCatch:either": { api: "try (evaluate x)", status: "analogy", pkg: "base", note: `From \`Control.Exception\`. ${EVALUATE}`, ...P },
  "tryCatch:option": { api: "either (const Nothing) Just <$> try (evaluate x)", status: "analogy", pkg: "base", note: `From \`Control.Exception\`. ${EVALUATE}`, ...P },
  "tryCatch:validation": { api: "either (const (Failure [e])) Success <$> try (evaluate x)", status: "analogy", pkg: "either", note: `From \`Control.Exception\`. ${EVALUATE}`, ...P },
  // Mapping
  "map:either": { api: "fmap", status: "equivalent", pkg: "base", note: "`<$>` is the operator form.", ...P },
  "map:option": { api: "fmap", status: "equivalent", pkg: "base", note: "`<$>` is the operator form.", ...P },
  "map:list": { api: "map", status: "equivalent", pkg: "base", note: "`fmap` works too.", ...P },
  "bimap:either": { api: "bimap", status: "equivalent", pkg: "base", note: "From `Data.Bifunctor`. Takes the `Left` function first.", ...P },
  "bimap:tuple": { api: "bimap", status: "equivalent", pkg: "base", note: "From `Data.Bifunctor`. Takes the first slot's function first.", ...P },
  // Sequencing
  "flatMap:either": { api: ">>=", status: "equivalent", pkg: "base", note: "`=<<` takes the function first.", ...P },
  "flatMap:option": { api: ">>=", status: "equivalent", pkg: "base", note: "`=<<` takes the function first.", ...P },
  "flatMap:list": { api: ">>=", status: "equivalent", pkg: "base", note: "`concatMap` works too, and takes the function first.", ...P },
  "flatten:either": { api: "join", status: "equivalent", pkg: "base", note: "From `Control.Monad`.", ...P },
  "flatten:option": { api: "join", status: "equivalent", pkg: "base", note: "From `Control.Monad`.", ...P },
  "flatten:list": { api: "concat", status: "equivalent", pkg: "base", note: "`join` from `Control.Monad` works too.", ...P },
  "tap:either": { api: "m >>= \\a -> a <$ f a", status: "partial", pkg: "base", note: "base has no named tap; bind the step, then `<$` puts the original value back.", ...P },
  "tap:option": { api: "m >>= \\a -> a <$ f a", status: "partial", pkg: "base", note: "base has no named tap; bind the step, then `<$` puts the original value back.", ...P },
  "peek:either": { api: "fmap traceShowId", status: "analogy", pkg: "base", note: "From `Debug.Trace`. Pure code can't run effects, so this prints to stderr when the value is evaluated, for debugging only.", ...P },
  "peek:list": { api: "map traceShowId", status: "analogy", pkg: "base", note: "From `Debug.Trace`. Prints when each element is evaluated, not when `map` runs, so use it only for debugging.", ...P },
  // Zipping
  "zip:either": { api: "liftA2", status: "equivalent", pkg: "base", ...P },
  "zip:validation": { api: "liftA2", status: "library", pkg: "either", note: VALIDATION, ...P },
  "zip:list": { api: "liftA2", status: "equivalent", pkg: "base", note: "Not `zip`, which pairs by position.", ...P },
  "zip:ziplist": { api: "zipWith", status: "equivalent", pkg: "base", note: "`liftA2` on `ZipList`, from `Control.Applicative`, does the same.", ...P },
  // Traversing
  "traverse:either:short-circuit": { api: "traverse", status: "equivalent", pkg: "base", note: "`mapM` works too; laziness means `check` never runs on elements after the first `Left`.", ...P },
  "traverse:either:eager": { api: "No equivalent", status: "none", pkg: "base", note: "`traverse` is lazy and stops at the first `Left`; base has no version that runs every element.", ...P },
  "traverse:option:short-circuit": { api: "traverse", status: "equivalent", pkg: "base", note: "`mapM` works too; laziness means `check` never runs on elements after the first `Nothing`.", ...P },
  "traverse:option:eager": { api: "No equivalent", status: "none", pkg: "base", note: "`traverse` is lazy and stops at the first `Nothing`; base has no version that runs every element.", ...P },
  "traverse:validation": { api: "traverse", status: "library", pkg: "either", note: `${VALIDATION} Validation isn't a Monad, so \`mapM\` won't compile.`, ...P },
  "sequence:either:short-circuit": { api: "sequenceA", status: "equivalent", pkg: "base", note: "`sequence` works too.", ...P },
  "sequence:either:eager": { api: "No equivalent", status: "none", pkg: "base", note: "The list is lazy, so elements after the first `Left` are never evaluated.", ...P },
  "sequence:option:short-circuit": { api: "sequenceA", status: "equivalent", pkg: "base", note: "`sequence` works too.", ...P },
  "sequence:option:eager": { api: "No equivalent", status: "none", pkg: "base", note: "The list is lazy, so elements after the first `Nothing` are never evaluated.", ...P },
  "sequence:validation": { api: "sequenceA", status: "library", pkg: "either", note: `${VALIDATION} Validation isn't a Monad, so \`sequence\` won't compile.`, ...P },
  // Error handling
  "mapError:either": { api: "first", status: "equivalent", pkg: "base", note: "From `Data.Bifunctor`. mtl's `mapError` is a different function.", ...P },
  "mapError:validation": { api: "first (map f)", status: "partial", pkg: "either", note: "From `Data.Bifunctor`. `first f` gets the whole error list, so map inside it to reach each error.", ...P },
  "recover:either": { api: "either h Right", status: "equivalent", pkg: "base", note: "mtl's `catchError` works too, but can't change the error type.", ...P },
  "alt:option": { api: "<|>", status: "equivalent", pkg: "base", ...P },
  "alt:either": { api: "<!>", status: "library", pkg: "semigroupoids", note: "From `Data.Functor.Alt`. base has no `<|>` for `Either`, and `ExceptT`'s `<|>` combines both errors instead of keeping the last.", ...P },
  "alt:validation": { api: "<!>", status: "library", pkg: "semigroupoids", note: "From `Data.Functor.Alt`. `<|>` works too, but needs `Monoid e`.", ...P },
  "alt:list": { api: "++", status: "equivalent", pkg: "base", note: "`<|>` works too.", ...P },
  "getOrElse:either": { api: "either f id", status: "equivalent", pkg: "base", note: "`fromRight`, from `Data.Either`, takes a constant default instead.", ...P },
  "getOrElse:option": { api: "fromMaybe", status: "equivalent", pkg: "base", note: "From `Data.Maybe`.", ...P },
  // Pattern matching
  "match:either": { api: "either", status: "equivalent", pkg: "base", note: "Takes the `Left` function first.", ...P },
  "match:option": { api: "maybe", status: "equivalent", pkg: "base", note: "Takes the default value first, not a function.", ...P },
  "match:validation": { api: "case", status: "partial", pkg: "either", note: "either 5.0.3 has no `validation` function, so match on `Failure` and `Success`.", ...P },
  // Filtering
  "filter:list": { api: "filter", status: "equivalent", pkg: "base", ...P },
  "filter:option": { api: "mfilter", status: "equivalent", pkg: "base", note: "From `Control.Monad`.", ...P },
  "filterMap:list": { api: "mapMaybe", status: "equivalent", pkg: "base", note: "From `Data.Maybe`.", ...P },
  "filterMap:option": { api: ">>=", status: "equivalent", pkg: "base", note: "`=<<` takes the function first.", ...P },
  "partition:list": { api: "partition", status: "equivalent", pkg: "base", note: "From `Data.List`.", ...P },
  "filterOrElse:either": { api: "m >>= \\a -> if p a then Right a else Left (f a)", status: "analogy", pkg: "base", note: "base, mtl and either have no named function for this.", ...P },
};
