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
  "pure:either": { api: "Right", status: "equivalent", note: "Throws `ValueIsNullException` on `null`." },
  "pure:option": { api: "Some", status: "partial", note: "`Some(null)` throws `ValueIsNullException`, where JS gives `Some(null)`; use `Optional` for nullable input." },
  "pure:validation": { api: "Success", status: "equivalent", note: "Throws `ValueIsNullException` on `null`." },
  "pure:list": { api: "Seq1", status: "equivalent" },
  "fail:either": { api: "Left", status: "equivalent" },
  "fail:option": { api: "None", status: "equivalent" },
  "fail:validation": { api: "Fail", status: "equivalent" },
  "fail:list": { api: "Empty", status: "equivalent" },
  "fromNullable:either": { api: "Optional(a).ToEither(e)", status: "partial", note: "No direct constructor; go through Option." },
  "fromNullable:option": { api: "Optional", status: "equivalent" },
  "fromNullable:validation": { api: "Optional(a).ToValidation(e)", status: "partial", note: "No direct constructor; go through Option." },
  "fromNullable:list": { api: "Optional(a).ToSeq()", status: "partial", note: "No direct constructor; go through Option." },
  "fromPredicate:either": { api: "Cond(p)(a).ToEither(e)", status: "partial", note: "No Either version of `Cond`; convert its Option." },
  "fromPredicate:option": { api: "Cond", status: "equivalent", note: "Returns a function; a `null` input gives `None` even when the predicate passes." },
  "fromPredicate:validation": { api: "Cond(p)(a).ToValidation(e)", status: "partial", note: "No Validation version of `Cond`; convert its Option." },
  "fromPredicate:list": { api: "Cond(p)(a).ToSeq()", status: "partial", note: "No Seq version of `Cond`; convert its Option." },
  "tryCatch:either": { api: "Try(f).ToEither(onThrow)", status: "partial", note: "A returned `null` throws `ValueIsNullException` instead of becoming a `Right`." },
  "tryCatch:option": { api: "Try(f).ToOption()", status: "partial", note: "A returned `null` becomes `None`, where JS gives `Some(null)`." },
  "tryCatch:validation": { api: "Try(f).ToValidation(onThrow)", status: "partial", note: "A returned `null` throws `ValueIsNullException` instead of becoming a `Success`." },
  "map:either": { api: "Either.Map", status: "equivalent" },
  "map:option": { api: "Option.Map", status: "equivalent" },
  "map:list": { api: "Seq.Map", status: "equivalent" },
  "bimap:either": { api: "Either.BiMap", status: "equivalent", note: "Takes the Right function first; use named arguments." },
  "bimap:tuple": { api: "ValueTuple.BiMap", status: "equivalent" },
  "flatMap:either": { api: "Either.Bind", status: "equivalent", note: "LINQ query syntax calls it `SelectMany`." },
  "flatMap:option": { api: "Option.Bind", status: "equivalent", note: "LINQ query syntax calls it `SelectMany`." },
  "flatMap:list": { api: "Seq.Bind", status: "equivalent", note: "LINQ query syntax calls it `SelectMany`." },
  "flatten:either": { api: "Either.Flatten", status: "equivalent" },
  "flatten:option": { api: "Option.Flatten", status: "equivalent" },
  "flatten:list": { api: "Seq.Flatten", status: "equivalent" },
  "tap:either": { api: "from x in … from _ in Audit(x) select x", status: "partial", note: "v4 has no named tap; bind the step in a query and select the original value." },
  "tap:option": { api: "from x in … from _ in Audit(x) select x", status: "partial", note: "v4 has no named tap; bind the step in a query and select the original value." },
  "peek:either": { api: "Either.Do", status: "equivalent" },
  "peek:list": { api: "Seq.Do", status: "equivalent" },
  "zip:either": { api: "Func.Apply", status: "equivalent", note: "Called on the combining function (`fun(f).Apply(a, b)`); v4 has no tuple `Apply` for Either." },
  "zip:validation": { api: "(a, b).Apply", status: "equivalent" },
  "zip:list": { api: "from … from … select", status: "equivalent" },
  "zip:ziplist": { api: "Seq.Zip", status: "equivalent" },
  "traverse:either:short-circuit": { api: "IEnumerable.Sequence", status: "equivalent", note: "On `IEnumerable`, not `Seq`, whose `Sequence(f)` is eager; v4 swaps the names, so `Sequence(f)` is traverse." },
  "traverse:either:eager": { api: "Seq.Sequence", status: "equivalent", note: "v4 swaps the names: `Sequence(f)` is traverse." },
  "traverse:option:short-circuit": { api: "IEnumerable.Sequence", status: "equivalent", note: "On `IEnumerable`, not `Seq`, whose `Sequence(f)` is eager; v4 swaps the names, so `Sequence(f)` is traverse." },
  "traverse:option:eager": { api: "Seq.Sequence", status: "equivalent", note: "v4 swaps the names: `Sequence(f)` is traverse." },
  "traverse:validation:eager": { api: "Seq.Sequence", status: "equivalent", note: "v4 swaps the names: `Sequence(f)` is traverse." },
  "sequence:either:short-circuit": { api: "IEnumerable.Sequence", status: "equivalent", note: "On `IEnumerable` it stops at the first failure; on `Seq` it reads every element." },
  "sequence:either:eager": { api: "Seq.Sequence", status: "equivalent", note: "On `Seq` it reads every element; on `IEnumerable` it stops at the first failure." },
  "sequence:option:short-circuit": { api: "IEnumerable.Sequence", status: "equivalent", note: "On `IEnumerable` it stops at the first failure; on `Seq` it reads every element." },
  "sequence:option:eager": { api: "Seq.Sequence", status: "equivalent", note: "On `Seq` it reads every element; on `IEnumerable` it stops at the first failure." },
  "sequence:validation": { api: "Seq.Sequence", status: "equivalent" },
  "mapError:either": { api: "Either.MapLeft", status: "equivalent" },
  "mapError:validation": { api: "Validation.MapFail", status: "equivalent" },
  "recover:either": { api: "Either.BindLeft", status: "equivalent" },
  "alt:either": { api: "||", status: "equivalent" },
  "alt:option": { api: "||", status: "equivalent" },
  "alt:validation": { api: "No equivalent", status: "none", note: "v4's `|` and `||` on Validation fail if either side fails, so match on the first instead." },
  "alt:list": { api: "+", status: "equivalent" },
  "getOrElse:either": { api: "Either.IfLeft", status: "equivalent" },
  "getOrElse:option": { api: "Option.IfNone", status: "equivalent", note: "Also takes a function, `IfNone(() => …)`, which runs only on `None`." },
  "match:either": { api: "Either.Match", status: "equivalent", note: "Takes the Right handler first; use named arguments." },
  "match:option": { api: "Option.Match", status: "equivalent", note: "Takes the Some handler first; use named arguments." },
  "match:validation": { api: "Validation.Match", status: "equivalent", note: "Takes the success handler first; `Fail` receives a `Seq` of every error." },
  "filter:list": { api: "Seq.Filter", status: "equivalent", note: "LINQ calls it `Where`." },
  "filter:option": { api: "Option.Filter", status: "equivalent" },
  "filterMap:list": { api: "Seq.Choose", status: "equivalent" },
  "filterMap:option": { api: "Option.Bind", status: "equivalent", note: "v4 has no `Choose` on Option; `Bind` with an Option-returning function does the same." },
  "partition:list": { api: "(Seq.Filter(p), Seq.Filter(!p))", status: "partial", note: "v4's `Partition` splits a Seq of Eithers, not by a predicate, so filter twice." },
  "filterOrElse:either": { api: "Either.Bind", status: "partial", note: "v4 has no filterOrElse, and Either's `Filter` gives Bottom instead of a `Left`, so bind with a condition." },
};
