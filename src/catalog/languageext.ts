// LanguageExt 4.4.9 entries. Their samples are compiled and checked in
// snippets/languageext/v4/Program.cs (`npm run samples:languageext`) and
// reach the site through src/catalog/samples.generated.ts.

export interface LanguageExtEntry {
  readonly api: string;
  readonly status: "equivalent" | "library" | "partial" | "analogy" | "none";
  readonly note?: string;
  // Under review: shown only when Preview is on.
  readonly preview?: true;
}

export const LANGUAGEEXT_VERSION = "4.4.9";

export const languageExt: Readonly<Record<string, LanguageExtEntry>> = {
  "pure:option": { api: "Some(a)", status: "partial", note: "Throws `ValueIsNullException` on `null`, where fp-ts and Effect give `Some(null)`. Use `Optional` for nullable input." },
  "pure:either": { api: "Right(a)", status: "equivalent", note: "Throws on `null`." },
  "pure:validation": { api: "Success<E, A>(a)", status: "equivalent", note: "Throws on `null`." },
  "pure:list": { api: "Seq1(a)", status: "equivalent" },
  "fail:either": { api: "Left<E, A>(e)", status: "equivalent" },
  "fail:option": { api: "None", status: "equivalent" },
  "fail:validation": { api: "Fail<E, A>(e)", status: "equivalent" },
  "fail:list": { api: "Seq<A>()", status: "equivalent" },
  "fromNullable:validation": { api: "Optional(a).ToValidation(e)", status: "partial", note: "No direct constructor; go through Option." },
  "fromNullable:list": { api: "Optional(a).ToSeq()", status: "partial", note: "No direct constructor; go through Option." },
  "fromPredicate:validation": { api: "Cond<A>(p)(a).ToValidation(e)", status: "partial", note: "No Validation version of `Cond`; convert its Option." },
  "fromPredicate:list": { api: "Cond<A>(p)(a).ToSeq()", status: "partial", note: "No Seq version of `Cond`; convert its Option." },
  "tryCatch:validation": { api: "Try(f).ToValidation(ex => e)", status: "partial", note: "The mapper plays `onThrow`. Only `Exception`s are caught." },
  "fromNullable:option": { api: "Optional(a)", status: "equivalent" },
  "fromNullable:either": { api: "Optional(a).ToEither(e)", status: "partial", note: "No direct constructor; go through Option." },
  "fromPredicate:option": { api: "Cond<A>(p)(a)", status: "equivalent", note: "`Cond` builds an Option-returning function. A `null` input gives `None` even when `p` passes." },
  "fromPredicate:either": { api: "Cond<A>(p)(a).ToEither(() => e)", status: "partial", note: "No Either version of `Cond`; convert its Option. The function form builds the error only when needed." },
  "tryCatch:option": { api: "Try(f).ToOption()", status: "partial", note: "`Try` is lazy; `ToOption` runs it. A returned `null` becomes `None`, where fp-ts and Effect give `Some`." },
  "tryCatch:either": { api: "Try(f).ToEither(ex => e)", status: "partial", note: "The mapper plays `onThrow`. Only `Exception`s are caught, and Either can't hold a returned `null`." },
  "map:either": { api: "Map", status: "equivalent", },
  "map:option": { api: "Map", status: "equivalent", },
  "map:list": { api: "Seq.Map", status: "equivalent", },
  "bimap:either": { api: "BiMap(Right, Left)", status: "equivalent", note: "v4 takes the Right function first. Use named arguments.", },
  "flatMap:either": { api: "Bind", status: "equivalent", note: "LINQ query syntax uses `SelectMany`.", },
  "flatMap:option": { api: "Bind", status: "equivalent", },
  "flatMap:list": { api: "Seq.Bind", status: "equivalent", },
  "flatten:option": { api: "Flatten", status: "equivalent", },
  "peek:either": { api: "Do", status: "equivalent", note: "`Do` runs an `Action` and returns the same Either. It cannot fail, so it is a peek, not an effectful tap.", },
  "zip:either": { api: "from … from … select", status: "partial", note: "v4 has no tuple Apply for Either; the LINQ query is monadic. For Either the result is the same: the first Left wins.", },
  "zip:validation": { api: "(a, b).Apply(f)", status: "equivalent", note: "Keeps both failures.", },
  "traverse:either:eager": { api: "Seq.Sequence(f)", status: "equivalent", note: "v4 swaps the names: `Sequence(f)` is traverse. Eager: f is called on every element.", },
  "sequence:either": { api: "Seq.Sequence()", status: "equivalent", },
  "mapError:either": { api: "MapLeft", status: "equivalent", },
  "recover:either": { api: "BindLeft", status: "equivalent", note: "Can change the error type.", },
  "alt:option": { api: "||", status: "equivalent", },
  "getOrElse:either": { api: "IfLeft(e => …)", status: "equivalent", },
  "getOrElse:option": { api: "IfNone(value)", status: "equivalent", note: "Also takes a function: IfNone(() => …).", },
  "match:either": { api: "Match(Right, Left)", status: "equivalent", note: "v4 takes the Right handler first. Use named arguments.", },
  "match:option": { api: "Match(Some, None)", status: "equivalent", },
  "filter:option": { api: "Filter", status: "equivalent", },
  "filter:list": { api: "Seq.Filter", status: "equivalent", note: "LINQ's `Where` does the same." },
  "filterMap:list": { api: "Seq.Choose", status: "equivalent" },
  "filterMap:option": { api: "Bind", status: "equivalent", note: "For Option, filterMap is `Bind` with an Option-returning function." },
  "partition:list": { api: "(Filter(p), Filter(not p))", status: "partial", note: "v4 has no predicate partition (its `Partition` splits a Seq of Eithers), so filter twice." },
  "bimap:tuple": { api: "(a, b).BiMap(f, g)", status: "equivalent" },
  "flatten:either": { api: "Flatten", status: "equivalent" },
  "flatten:list": { api: "Seq.Flatten", status: "equivalent" },
  "tap:either": { api: "from x in … from _ in step(x) select x", status: "partial", note: "v4 has no named effectful tap; a query that binds the step and selects the original value does the same. The step's `Left` replaces the result." },
  "tap:option": { api: "from x in … from _ in step(x) select x", status: "partial", note: "v4 has no named effectful tap; use a query that binds the step and selects the original value." },
  "peek:list": { api: "Seq.Do", status: "equivalent" },
  "zip:list": { api: "from … from … select", status: "equivalent", note: "LINQ query syntax over Seq gives every combination." },
  "zip:ziplist": { api: "Seq.Zip", status: "equivalent", note: "Pairs by position and stops at the shorter Seq." },
  "traverse:option:eager": { api: "Seq.Sequence(f)", status: "equivalent", note: "v4 swaps the names: `Sequence(f)` is traverse. Eager: f is called on every element." },
  "traverse:validation:eager": { api: "Seq.Sequence(f)", status: "equivalent", note: "v4 swaps the names: `Sequence(f)` is traverse. Keeps every failure." },
  "sequence:option": { api: "Seq.Sequence()", status: "equivalent" },
  "sequence:validation": { api: "Seq.Sequence()", status: "equivalent", note: "Keeps every failure." },
  "mapError:validation": { api: "MapFail", status: "equivalent", note: "Maps each error." },
  "alt:either": { api: "||", status: "equivalent", note: "When both fail, the second `Left` is the result." },
  "alt:validation": { api: "|", status: "equivalent", note: "When both fail, both errors are kept." },
  "alt:list": { api: "+", status: "equivalent", note: "Seq's alt is concatenation (`+`)." },
  "match:validation": { api: "Match(Succ, Fail)", status: "equivalent", note: "v4 takes the success handler first. `Fail` receives every error." },
  "filterOrElse:either": { api: "Bind(x => cond ? Right(x) : Left(…))", status: "partial", note: "v4 has no filterOrElse. Either's `Filter` yields a Bottom state instead of a `Left`, so bind with a condition." },
};
