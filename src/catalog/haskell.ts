// Haskell entries: base 4.22.0.0 (GHC 9.14), mtl 2.3.2, either 5.0.3
// (Data.Either.Validation) and semigroupoids 6.0.1 (Data.Functor.Alt).
// Samples live in snippets/haskell/Main.hs (`npm run samples:haskell`).
// Every entry stays in Preview until that run passes on the pinned GHC.

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
const NOT_MONAD = "Validation is not a Monad, so `sequence` and `mapM` won't compile for it; `sequenceA` and `traverse` need only Applicative.";

export const haskell: Readonly<Record<string, HaskellEntry>> = {
  // Constructors
  "pure:either": { api: "pure / Right", status: "equivalent", pkg: "base", ...P },
  "pure:option": { api: "pure / Just", status: "equivalent", pkg: "base", note: "`pure` never inspects its argument. Haskell has no `null` to put in.", ...P },
  "pure:validation": { api: "pure / Success", status: "library", pkg: "either", note: "The Applicative needs `Semigroup e`.", ...P },
  "pure:list": { api: "pure / [a]", status: "equivalent", pkg: "base", ...P },
  "fail:either": { api: "throwError / Left", status: "equivalent", pkg: "mtl", note: "Not `fail`: `MonadFail.fail :: String -> m a` is for pattern-match failure, and Either has no instance.", ...P },
  "fail:option": { api: "throwError () / Nothing", status: "equivalent", pkg: "mtl", note: "mtl's `MonadError () Maybe` instance: the error type is `()`. `empty` and `Nothing` work too.", ...P },
  "fail:validation": { api: "Failure", status: "library", pkg: "either", note: "A constructor with no class behind it: Validation is not a Monad, so it has no MonadError.", ...P },
  "fail:list": { api: "empty / []", status: "equivalent", pkg: "base", note: "Alternative's `empty`. mtl has no MonadError instance for lists.", ...P },
  "fromNullable:either": { api: "maybe (Left e) Right", status: "analogy", pkg: "base", note: "Haskell has no `null`. A missing value is already a `Maybe`, here from `lookup`.", ...P },
  "fromNullable:option": { api: "No equivalent", status: "none", pkg: "base", note: "Haskell has no `null`: `Maybe` already plays this role.", ...P },
  "fromNullable:validation": { api: "maybe (Failure [e]) Success", status: "analogy", pkg: "either", note: "Haskell has no `null`; start from a `Maybe`.", ...P },
  "fromNullable:list": { api: "maybeToList", status: "analogy", pkg: "base", note: "Haskell has no `null`; start from a `Maybe`.", ...P },
  "fromPredicate:either": { api: "if p a then Right a else Left (f a)", status: "analogy", pkg: "base", note: "base has no named function for this.", ...P },
  "fromPredicate:option": { api: "mfilter p (Just a)", status: "partial", pkg: "base", note: "A composition: `pure` then `mfilter`. `a <$ guard (p a)` also works.", ...P },
  "fromPredicate:validation": { api: "if p a then Success a else Failure [f a]", status: "analogy", pkg: "either", ...P },
  "fromPredicate:list": { api: "filter p [a]", status: "partial", pkg: "base", ...P },
  "tryCatch:either": { api: "try (evaluate x)", status: "analogy", pkg: "base", note: "Haskell catches exceptions only in `IO`. `evaluate` forces the value first; a lazy value would escape the `try`. The caught type is chosen by `try`'s type.", ...P },
  "tryCatch:option": { api: "either (const Nothing) Just <$> try (evaluate x)", status: "analogy", pkg: "base", note: "Only in `IO`, and only once `evaluate` forces the value.", ...P },
  "tryCatch:validation": { api: "either (const (Failure [e])) Success <$> try (evaluate x)", status: "analogy", pkg: "either", note: "Only in `IO`, and only once `evaluate` forces the value.", ...P },
  // Mapping
  "map:either": { api: "fmap / <$>", status: "equivalent", pkg: "base", ...P },
  "map:option": { api: "fmap / <$>", status: "equivalent", pkg: "base", ...P },
  "map:list": { api: "map / fmap", status: "equivalent", pkg: "base", ...P },
  "bimap:either": { api: "bimap", status: "equivalent", pkg: "base", note: "From Data.Bifunctor. The Left function comes first.", ...P },
  "bimap:tuple": { api: "bimap", status: "equivalent", pkg: "base", note: "The first function maps the first slot. fp-ts's `T.bimap` is reversed.", ...P },
  // Sequencing
  "flatMap:either": { api: ">>= / =<<", status: "equivalent", pkg: "base", note: "`=<<` takes the function first, like this page's signature; `>>=` takes the value first.", ...P },
  "flatMap:option": { api: ">>= / =<<", status: "equivalent", pkg: "base", ...P },
  "flatMap:list": { api: ">>= / concatMap", status: "equivalent", pkg: "base", ...P },
  "flatten:either": { api: "join", status: "equivalent", pkg: "base", ...P },
  "flatten:option": { api: "join", status: "equivalent", pkg: "base", ...P },
  "flatten:list": { api: "join / concat", status: "equivalent", pkg: "base", ...P },
  "tap:either": { api: "m >>= \\a -> a <$ f a", status: "partial", pkg: "base", note: "base has no named tap; bind the step and keep the original value. `<*` does it when the step doesn't need the value.", ...P },
  "tap:option": { api: "m >>= \\a -> a <$ f a", status: "partial", pkg: "base", note: "base has no named tap.", ...P },
  "peek:either": { api: "fmap traceShowId", status: "analogy", pkg: "base", note: "Pure code can't perform effects. `Debug.Trace` prints to stderr when the value is forced, and is for debugging only.", ...P },
  "peek:list": { api: "map traceShowId", status: "analogy", pkg: "base", note: "For debugging only; prints when each element is forced.", ...P },
  // Zipping
  "zip:either": { api: "liftA2", status: "equivalent", pkg: "base", note: "The first `Left` wins.", ...P },
  "zip:validation": { api: "liftA2", status: "library", pkg: "either", note: "Errors combine with `<>`: e₁ then e₂.", ...P },
  "zip:list": { api: "liftA2", status: "equivalent", pkg: "base", note: "Not `zip`: Haskell's `zip` pairs by position. List's Applicative gives every combination.", ...P },
  "zip:ziplist": { api: "zipWith", status: "equivalent", pkg: "base", note: "Pairs by position and stops at the shorter list. `ZipList`'s `liftA2` does the same.", ...P },
  // Traversing
  "traverse:either:short-circuit": { api: "traverse / mapM", status: "equivalent", pkg: "base", note: "Laziness stops it: after the first `Left`, later elements are never forced.", ...P },
  "traverse:either:eager": { api: "No equivalent", status: "none", pkg: "base", note: "Haskell's `traverse` stops forcing at the first `Left`; there is no idiomatic strict version.", ...P },
  "traverse:option:short-circuit": { api: "traverse / mapM", status: "equivalent", pkg: "base", ...P },
  "traverse:option:eager": { api: "No equivalent", status: "none", pkg: "base", note: "Haskell's `traverse` stops forcing at the first `Nothing`.", ...P },
  "traverse:validation": { api: "traverse", status: "library", pkg: "either", note: NOT_MONAD, ...P },
  "sequence:either:short-circuit": { api: "sequenceA / sequence", status: "equivalent", pkg: "base", note: "Haskell's name for this is `sequenceA`; `sequence` is the Monad-only version.", ...P },
  "sequence:either:eager": { api: "No equivalent", status: "none", pkg: "base", note: "The elements are lazy, so later ones are never forced after the first `Left`.", ...P },
  "sequence:option:short-circuit": { api: "sequenceA / sequence", status: "equivalent", pkg: "base", ...P },
  "sequence:option:eager": { api: "No equivalent", status: "none", pkg: "base", note: "The elements are lazy, so later ones are never forced after the first `Nothing`.", ...P },
  "sequence:validation": { api: "sequenceA", status: "library", pkg: "either", note: NOT_MONAD, ...P },
  // Error handling
  "mapError:either": { api: "first", status: "equivalent", pkg: "base", note: "From Data.Bifunctor. mtl's `mapError` is a different function.", ...P },
  "mapError:validation": { api: "first (map f)", status: "partial", pkg: "either", note: "`first f` alone calls `f` once, on the whole error list; map inside it to reach each error.", ...P },
  "recover:either": { api: "either h Right", status: "equivalent", pkg: "base", note: "mtl's `catchError` and `handleError` keep the error type, so they can't change it as this does.", ...P },
  "alt:option": { api: "<|>", status: "equivalent", pkg: "base", note: "Alternative, in base.", ...P },
  "alt:either": { api: "<!>", status: "library", pkg: "semigroupoids", note: "base has no Alternative for Either. semigroupoids' `<!>` keeps the last `Left`; `ExceptT`'s `<|>` combines both errors instead.", ...P },
  "alt:validation": { api: "<!>", status: "library", pkg: "semigroupoids", note: "Keeps both failures. `<|>` needs `Monoid e`, and either's `ealt` keeps only the second failure.", ...P },
  "alt:list": { api: "<|> / ++", status: "equivalent", pkg: "base", ...P },
  "getOrElse:either": { api: "either f id", status: "equivalent", pkg: "base", note: "`fromRight d` for a constant default.", ...P },
  "getOrElse:option": { api: "fromMaybe", status: "equivalent", pkg: "base", note: "The default is lazy: it is evaluated only for `Nothing`, so a constant and a thunk behave the same.", ...P },
  // Pattern matching
  "match:either": { api: "either", status: "equivalent", pkg: "base", note: "Left handler first, the same order as fp-ts.", ...P },
  "match:option": { api: "maybe", status: "equivalent", pkg: "base", note: "Takes the default value first, not a function.", ...P },
  "match:validation": { api: "case", status: "partial", pkg: "either", note: "either 5.0.3 has no `validation` eliminator; match on the constructors.", ...P },
  // Filtering
  "filter:list": { api: "filter", status: "equivalent", pkg: "base", ...P },
  "filter:option": { api: "mfilter", status: "equivalent", pkg: "base", note: "From Control.Monad, for any MonadPlus.", ...P },
  "filterMap:list": { api: "mapMaybe", status: "equivalent", pkg: "base", note: "From Data.Maybe.", ...P },
  "filterMap:option": { api: ">>=", status: "equivalent", pkg: "base", ...P },
  "partition:list": { api: "partition", status: "equivalent", pkg: "base", note: "From Data.List. Passes come first.", ...P },
  "filterOrElse:either": { api: "m >>= \\a -> if p a then Right a else Left (f a)", status: "analogy", pkg: "base", note: "base, mtl and either have no filterOrElse.", ...P },
};
