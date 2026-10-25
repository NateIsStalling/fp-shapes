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
const none = (base: typeof FP | typeof EF, api: string, note: string): NameEntry => ({ ...base, api, status: "none", note });
const NO_VALIDATION = "Effect 4 has no Validation type. `Effect.validate` accumulates failures on Effect instead.";
const WRAP_ERROR = "fp-ts Validation is an `Either` whose error is a non-empty array, so wrap the error to let it combine.";

const jsNames: Readonly<Record<string, readonly NameEntry[]>> = {
  "pure:option": [eq(FP, "O.of", "Same as `O.some`."), eq(EF, "Option.some")],
  "pure:either": [eq(FP, "E.of", "Same as `E.right`."), eq(EF, "Result.succeed")],
  "pure:validation": [eq(FP, "E.of", "fp-ts Validation is an `Either`; errors accumulate through `E.getApplicativeValidation`."), none(EF, "No Validation", NO_VALIDATION)],
  "pure:list": [eq(FP, "RA.of"), eq(EF, "Array.of")],
  "fail:either": [eq(FP, "E.left"), eq(EF, "Result.fail")],
  "fail:option": [eq(FP, "O.none", "A value, not a function."), eq(EF, "Option.none()", "A function in Effect 4.")],
  "fail:validation": [eq(FP, "E.left", "fp-ts Validation is an `Either`; errors combine through `E.getApplicativeValidation(S)` for any Semigroup `S`, here a non-empty array."), none(EF, "No Validation", NO_VALIDATION)],
  "fail:list": [eq(FP, "RA.empty", "A value, not a function."), eq(EF, "Array.empty()")],
  "fromNullable:option": [eq(FP, "O.fromNullable"), eq(EF, "Option.fromNullishOr")],
  "fromNullable:validation": [eq(FP, "E.fromNullable([e])", WRAP_ERROR), none(EF, "No Validation", NO_VALIDATION)],
  "fromNullable:list": [part(FP, "RA.fromOption(O.fromNullable(a))", "No list fromNullable; go through Option."), eq(EF, "Array.fromNullishOr")],
  "fromPredicate:validation": [eq(FP, "E.fromPredicate(p, (a) => [e])", WRAP_ERROR), none(EF, "No Validation", NO_VALIDATION)],
  "fromPredicate:list": [eq(FP, "RA.fromPredicate"), eq(EF, "Array.liftPredicate")],
  "tryCatch:validation": [eq(FP, "E.tryCatch(f, (u) => [e])", WRAP_ERROR), none(EF, "No Validation", NO_VALIDATION)],
  "fromNullable:either": [eq(FP, "E.fromNullable(e)", "Takes the error first, then the value."), eq(EF, "Result.fromNullishOr", "Takes the value first. `onNullish` receives the `null` or `undefined` and builds the error only then.")],
  "fromPredicate:option": [eq(FP, "O.fromPredicate"), eq(EF, "Option.liftPredicate")],
  "fromPredicate:either": [eq(FP, "E.fromPredicate"), eq(EF, "Result.liftPredicate")],
  "tryCatch:option": [eq(FP, "O.tryCatch"), part(EF, "Option.liftThrowable", "Lifts a function; calling the lifted function runs it.")],
  "tryCatch:either": [eq(FP, "E.tryCatch"), eq(EF, "Result.try", "Takes `{ try, catch }`.")],
  "map:either": [eq(FP, "E.map"), eq(EF, "Result.map")],
  "map:option": [eq(FP, "O.map"), eq(EF, "Option.map")],
  "map:list": [eq(FP, "RA.map"), eq(EF, "Array.map")],
  "bimap:tuple": [part(FP, "T.bimap(g, f)", "Reversed: `T.bimap(mapSnd, mapFst)` takes the second slot's function first, and `T.map` maps the first slot. Haskell's `bimap f g` maps the first slot with `f`."), eq(EF, "Tuple.evolve([f, g])")],
  "bimap:either": [eq(FP, "E.bimap"), eq(EF, "Result.mapBoth", "Named fields: `{ onFailure, onSuccess }`.")],
  "flatMap:either": [eq(FP, "E.flatMap", "Legacy alias: `chain`."), eq(EF, "Result.flatMap")],
  "flatMap:option": [eq(FP, "O.flatMap"), eq(EF, "Option.flatMap")],
  "flatMap:list": [eq(FP, "RA.flatMap"), eq(EF, "Array.flatMap")],
  "flatten:either": [eq(FP, "E.flatten")],
  "flatten:option": [eq(FP, "O.flatten"), eq(EF, "Option.flatten")],
  "flatten:list": [eq(FP, "RA.flatten"), eq(EF, "Array.flatten")],
  "tap:either": [eq(FP, "E.tap", "Legacy alias: `chainFirst`.")],
  "tap:option": [eq(FP, "O.tap")],
  "zip:either": [eq(FP, "sequenceT(E.Apply)")],
  "zip:validation": [eq(FP, "sequenceT(E.getApplicativeValidation(S))")],
  "zip:list": [eq(FP, "sequenceT(RA.Apply)")],
  "zip:ziplist": [eq(FP, "RA.zipWith"), eq(EF, "Array.zipWith")],
  "traverse:either:short-circuit": [eq(FP, "E.traverseArray"), part(EF, "Effect.forEach", "On Effect, not Result. Sequential by default.")],
  "traverse:either:eager": [eq(FP, "RA.traverse(E.Applicative)", "Calls `f` on every element; the first Left wins. `TE.traverseArray` does the same for TaskEither, in parallel.")],
  "traverse:option:short-circuit": [eq(FP, "O.traverseArray")],
  "traverse:option:eager": [eq(FP, "RA.traverse(O.Applicative)", "Calls `f` on every element.")],
  "traverse:validation:eager": [eq(FP, "RA.traverse(E.getApplicativeValidation(S))"), part(EF, "Effect.validate", "On Effect. Evaluates every element and keeps every failure.")],
  "sequence:either:short-circuit": [eq(FP, "E.sequenceArray")],
  "sequence:either:eager": [eq(FP, "RA.sequence(E.Applicative)")],
  "sequence:option:eager": [eq(FP, "RA.sequence(O.Applicative)")],
  "mapError:either": [eq(FP, "E.mapLeft"), eq(EF, "Result.mapError")],
  "recover:either": [eq(FP, "E.orElse", "The error type can change."), eq(EF, "Result.orElse")],
  "alt:option": [eq(FP, "O.alt", "Current name: `O.orElse`."), eq(EF, "Option.orElse")],
  "alt:either": [eq(FP, "E.alt")],
  "alt:validation": [eq(FP, "E.getAltValidation(S).alt")],
  "alt:list": [eq(FP, "RA.alt", "Concatenation.")],
  "getOrElse:either": [eq(FP, "E.getOrElse"), eq(EF, "Result.getOrElse")],
  "getOrElse:option": [part(FP, "O.getOrElse", "Takes a thunk, not a constant."), part(EF, "Option.getOrElse", "Takes a thunk, not a constant.")],
  "match:either": [eq(FP, "E.match", "Legacy alias: `fold`."), eq(EF, "Result.match")],
  "match:option": [eq(FP, "O.match"), eq(EF, "Option.match")],
  "filterOrElse:either": [eq(FP, "E.filterOrElse"), eq(EF, "Result.filterOrFail")],
  "filter:list": [eq(FP, "RA.filter"), eq(EF, "Array.filter")],
  "filter:option": [eq(FP, "O.filter"), eq(EF, "Option.filter")],
  "filterMap:list": [eq(FP, "RA.filterMap"), eq(EF, "Array.filterMap", "Takes a `Filter`, a function that returns a `Result`. `Filter.fromPredicateOption` adapts an Option-returning function.")],
  "filterMap:option": [eq(FP, "O.filterMap"), eq(EF, "Option.filterMap", "Takes a `Filter`; `Filter.fromPredicateOption` adapts an Option-returning function.")],
  "partition:list": [eq(FP, "RA.partition", "Returns `Separated`: `right` holds the passes, `left` the fails."), eq(EF, "Array.partition", "Takes a `Filter`; `Filter.fromPredicate` adapts a predicate. Returns `[passes, fails]`.")],
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
export function namesFor(operation: string, receiver: string, strategy?: string, preview = false): readonly NameEntry[] {
  const all = [...((strategy && names[`${operation}:${receiver}:${strategy}`]) || []), ...(names[`${operation}:${receiver}`] ?? [])];
  return preview ? all : all.filter((e) => !e.preview);
}
