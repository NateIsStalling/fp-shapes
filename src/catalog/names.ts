// Ecosystem names shown in an operation page's names panel. Reviewed entries
// are checked at their pinned version: fp-ts and Effect by conformance tests
// in tests/conformance/, LanguageExt by compiled samples in snippets/. An
// entry marked `preview` is still under review and shows only when the viewer
// turns on Preview. Keys are "operation:receiver" or
// "operation:receiver:strategy".

import { HASKELL_PACKAGES, haskell } from "./haskell";
import { LANGUAGEEXT_VERSION, languageExt } from "./languageext";
import { samples } from "./samples.generated";

export interface NameEntry {
  readonly eco: "fp-ts" | "Effect" | "LanguageExt" | "Haskell";
  readonly version: string;
  readonly api: string;
  // CLAUDE.md's vocabulary. `none` is a real answer: the library has no counterpart.
  readonly status: "equivalent" | "library" | "partial" | "analogy" | "none";
  readonly note?: string;
  readonly sample?: string;
  // Under review: shown only when Preview is on.
  readonly preview?: true;
}

const FP = { eco: "fp-ts", version: "2.16.11" } as const;
const EF = { eco: "Effect", version: "4.0.5" } as const;
const eq = (base: typeof FP | typeof EF, api: string, note?: string): NameEntry => ({ ...base, api, status: "equivalent", ...(note ? { note } : {}) });
const part = (base: typeof FP | typeof EF, api: string, note: string): NameEntry => ({ ...base, api, status: "partial", note });
const none = (base: typeof FP | typeof EF, note: string): NameEntry => ({ ...base, api: "No equivalent", status: "none", note });
const NO_VALIDATION = "Effect 4 has no Validation type; `Effect.validate` accumulates failures on `Effect` instead.";
const WRAP_ERROR = "fp-ts Validation is an `Either` whose error is a non-empty array, so wrap the error to let it combine.";
const MAP_TUPLE = (map: string) => `Returns a tuple; \`${map}\` combines it.`;

const jsNames: Readonly<Record<string, readonly NameEntry[]>> = {
  "pure:either": [eq(FP, "E.of", "Same as `E.right`."), eq(EF, "Result.succeed")],
  "pure:option": [eq(FP, "O.of", "Same as `O.some`."), eq(EF, "Option.some")],
  "pure:validation": [eq(FP, "E.of", "fp-ts Validation is an `Either`; errors accumulate only through `E.getApplicativeValidation(S)`."), none(EF, NO_VALIDATION)],
  "pure:list": [eq(FP, "RA.of"), eq(EF, "Array.of")],
  "fail:either": [eq(FP, "E.left"), eq(EF, "Result.fail")],
  "fail:option": [eq(FP, "O.none", "A value, not a function."), eq(EF, "Option.none", "A function, not a value.")],
  "fail:validation": [eq(FP, "E.left", WRAP_ERROR), none(EF, NO_VALIDATION)],
  "fail:list": [eq(FP, "RA.empty", "A value, not a function."), eq(EF, "Array.empty", "A function, not a value.")],
  "fromNullable:either": [eq(FP, "E.fromNullable", "Takes the error first, then the value."), eq(EF, "Result.fromNullishOr", "Takes the value first, then a function that builds the error.")],
  "fromNullable:option": [eq(FP, "O.fromNullable"), eq(EF, "Option.fromNullishOr")],
  "fromNullable:validation": [eq(FP, "E.fromNullable", WRAP_ERROR), none(EF, NO_VALIDATION)],
  "fromNullable:list": [part(FP, "RA.fromOption(O.fromNullable(a))", "No `RA.fromNullable`; go through Option."), eq(EF, "Array.fromNullishOr")],
  "fromPredicate:either": [eq(FP, "E.fromPredicate"), eq(EF, "Result.liftPredicate")],
  "fromPredicate:option": [eq(FP, "O.fromPredicate"), eq(EF, "Option.liftPredicate")],
  "fromPredicate:validation": [eq(FP, "E.fromPredicate", WRAP_ERROR), none(EF, NO_VALIDATION)],
  "fromPredicate:list": [eq(FP, "RA.fromPredicate"), eq(EF, "Array.liftPredicate")],
  "tryCatch:either": [eq(FP, "E.tryCatch"), eq(EF, "Result.try", "Takes named fields `{ try, catch }`.")],
  "tryCatch:option": [eq(FP, "O.tryCatch"), part(EF, "Option.liftThrowable", "Lifts a function; calling the lifted function runs it.")],
  "tryCatch:validation": [eq(FP, "E.tryCatch", WRAP_ERROR), none(EF, NO_VALIDATION)],
  "map:either": [eq(FP, "E.map"), eq(EF, "Result.map")],
  "map:option": [eq(FP, "O.map"), eq(EF, "Option.map")],
  "map:list": [eq(FP, "RA.map"), eq(EF, "Array.map")],
  "bimap:either": [eq(FP, "E.bimap"), eq(EF, "Result.mapBoth", "Takes named fields `{ onFailure, onSuccess }`.")],
  "bimap:tuple": [eq(FP, "T.bimap", "Takes the second slot's function first; `T.map` maps the first slot."), eq(EF, "Tuple.evolve", "Takes an array with one function per slot.")],
  "flatMap:either": [eq(FP, "E.flatMap", "Legacy name: `chain`."), eq(EF, "Result.flatMap")],
  "flatMap:option": [eq(FP, "O.flatMap", "Legacy name: `chain`."), eq(EF, "Option.flatMap")],
  "flatMap:list": [eq(FP, "RA.flatMap", "Legacy name: `chain`."), eq(EF, "Array.flatMap")],
  "flatten:either": [eq(FP, "E.flatten"), part(EF, "Result.flatMap(r, identity)", "No `Result.flatten`; flatMap with `identity`.")],
  "flatten:option": [eq(FP, "O.flatten"), eq(EF, "Option.flatten")],
  "flatten:list": [eq(FP, "RA.flatten"), eq(EF, "Array.flatten")],
  "tap:either": [eq(FP, "E.tap", "Legacy name: `chainFirst`."), part(EF, "Result.flatMap(r, (a) => Result.map(f(a), () => a))", "No effectful tap, since `Result.tap` ignores the step's result; bind the step and keep the value.")],
  "tap:option": [eq(FP, "O.tap", "Legacy name: `chainFirst`."), eq(EF, "Option.tap")],
  "peek:either": [none(FP, "`E.tap` needs a step that returns an Either; for a plain callback use `E.map((x) => (f(x), x))`."), eq(EF, "Result.tap", "Ignores the callback's return value, unlike `Option.tap`, which is the effectful kind.")],
  "peek:list": [none(FP, "No peek on ReadonlyArray; `RA.map((x) => (f(x), x))` does the same."), none(EF, "`Array.forEach` returns `void`; `Array.map((x) => (f(x), x))` does the same.")],
  "zip:either": [eq(FP, "sequenceT(E.Apply)", MAP_TUPLE("E.map")), eq(EF, "Result.all", MAP_TUPLE("Result.map"))],
  "zip:validation": [eq(FP, "sequenceT(E.getApplicativeValidation(S))", MAP_TUPLE("E.map")), none(EF, NO_VALIDATION)],
  "zip:list": [eq(FP, "sequenceT(RA.Apply)", MAP_TUPLE("RA.map")), eq(EF, "Array.cartesianWith")],
  "zip:ziplist": [eq(FP, "RA.zipWith"), eq(EF, "Array.zipWith")],
  "traverse:either:short-circuit": [eq(FP, "E.traverseArray"), part(EF, "Result.all(Iterable.map(xs, f))", "No Result traverse; `Iterable.map` is lazy, so `Result.all` stops calling `f` at the first failure.")],
  "traverse:either:eager": [eq(FP, "RA.traverse(E.Applicative)"), part(EF, "Result.all(Array.map(xs, f))", "No Result traverse; `Array.map` calls `f` on every element before `Result.all` collects.")],
  "traverse:option:short-circuit": [eq(FP, "O.traverseArray"), part(EF, "Option.all(Iterable.map(xs, f))", "No Option traverse; `Iterable.map` is lazy, so `Option.all` stops calling `f` at the first `None`.")],
  "traverse:option:eager": [eq(FP, "RA.traverse(O.Applicative)"), part(EF, "Option.all(Array.map(xs, f))", "No Option traverse; `Array.map` calls `f` on every element before `Option.all` collects.")],
  "traverse:validation:eager": [eq(FP, "RA.traverse(E.getApplicativeValidation(S))"), part(EF, "Effect.validate", "On `Effect`, not `Result`.")],
  "sequence:either:short-circuit": [eq(FP, "E.sequenceArray"), eq(EF, "Result.all")],
  "sequence:either:eager": [eq(FP, "RA.sequence(E.Applicative)"), none(EF, "`Result.all` gives the same result but stops reading at the first failure.")],
  "sequence:option:short-circuit": [eq(FP, "O.sequenceArray"), eq(EF, "Option.all")],
  "sequence:option:eager": [eq(FP, "RA.sequence(O.Applicative)"), none(EF, "`Option.all` gives the same result but stops reading at the first `None`.")],
  "sequence:validation:eager": [eq(FP, "RA.sequence(E.getApplicativeValidation(S))"), none(EF, NO_VALIDATION)],
  "mapError:either": [eq(FP, "E.mapLeft"), eq(EF, "Result.mapError")],
  "mapError:validation": [part(FP, "E.mapLeft(RNEA.map(f))", "`E.mapLeft` alone gets the whole error array; map inside it to reach each error."), none(EF, NO_VALIDATION)],
  "recover:either": [eq(FP, "E.orElse"), eq(EF, "Result.orElse")],
  "alt:option": [eq(FP, "O.orElse", "Legacy name: `alt`."), eq(EF, "Option.orElse")],
  "alt:either": [eq(FP, "E.alt"), eq(EF, "Result.orElse", "The fallback receives the first error, which alt ignores.")],
  "alt:validation": [eq(FP, "E.getAltValidation(S).alt"), none(EF, NO_VALIDATION)],
  "alt:list": [eq(FP, "RA.alt"), eq(EF, "Array.appendAll", "Takes the fallback array itself, not a thunk.")],
  "getOrElse:either": [eq(FP, "E.getOrElse"), eq(EF, "Result.getOrElse")],
  "getOrElse:option": [part(FP, "O.getOrElse", "Takes a thunk, not a constant."), part(EF, "Option.getOrElse", "Takes a thunk, not a constant.")],
  "match:either": [eq(FP, "E.match", "Also named `fold`."), eq(EF, "Result.match", "Takes named fields `{ onFailure, onSuccess }`.")],
  "match:option": [eq(FP, "O.match", "Also named `fold`."), eq(EF, "Option.match", "Takes named fields `{ onNone, onSome }`.")],
  "match:validation": [eq(FP, "E.match"), none(EF, NO_VALIDATION)],
  "filter:list": [eq(FP, "RA.filter"), eq(EF, "Array.filter")],
  "filter:option": [eq(FP, "O.filter"), eq(EF, "Option.filter")],
  "filterMap:list": [eq(FP, "RA.filterMap"), eq(EF, "Array.filterMap", "Takes a `Filter`; `Filter.fromPredicateOption` adapts an Option-returning function.")],
  "filterMap:option": [eq(FP, "O.filterMap"), eq(EF, "Option.filterMap", "Takes a `Filter`; `Filter.fromPredicateOption` adapts an Option-returning function.")],
  "partition:list": [eq(FP, "RA.partition", "Returns `Separated`: `right` holds the passes, `left` the fails."), eq(EF, "Array.partition", "Takes a `Filter`; `Filter.fromPredicate` adapts a predicate.")],
  "filterOrElse:either": [eq(FP, "E.filterOrElse"), eq(EF, "Result.filterOrFail")],
};

// LanguageExt first, matching the column order of the ecosystem index.
export const names: Readonly<Record<string, readonly NameEntry[]>> = (() => {
  const all: Record<string, NameEntry[]> = {};
  for (const [key, e] of Object.entries(languageExt)) {
    (all[key] ??= []).push({ eco: "LanguageExt", version: LANGUAGEEXT_VERSION, api: e.api, status: e.status, ...(e.note ? { note: e.note } : {}), ...(e.preview ? { preview: true } : {}) });
  }
  for (const [key, list] of Object.entries(jsNames)) (all[key] ??= []).push(...list);
  // Haskell last; its version names the package the entry comes from.
  for (const [key, e] of Object.entries(haskell)) {
    (all[key] ??= []).push({ eco: "Haskell", version: `${e.pkg} ${HASKELL_PACKAGES[e.pkg]}`, api: e.api, status: e.status, preview: true, ...(e.note ? { note: e.note } : {}) });
  }
  // Attach each entry's compiled sample: by full key, else by operation:receiver.
  for (const [key, list] of Object.entries(all)) {
    all[key] = list.map((e) => {
      const sample = samples[e.eco]?.[key] ?? samples[e.eco]?.[key.split(":").slice(0, 2).join(":")];
      return sample ? { ...e, sample } : e;
    });
  }
  return all;
})();

// Entries that hold for the chosen strategy, plus entries that hold for any.
// Preview entries are left out unless the viewer turned Preview on.
// Always in the same order, whichever key an entry came from.
const ECO_ORDER: readonly NameEntry["eco"][] = ["LanguageExt", "fp-ts", "Effect", "Haskell"];
export function namesFor(operation: string, receiver: string, strategy?: string, preview = false): readonly NameEntry[] {
  const all = [...((strategy && names[`${operation}:${receiver}:${strategy}`]) || []), ...(names[`${operation}:${receiver}`] ?? [])]
    .sort((x, y) => ECO_ORDER.indexOf(x.eco) - ECO_ORDER.indexOf(y.eco));
  return preview ? all : all.filter((e) => !e.preview);
}
