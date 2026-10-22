// Ecosystem names shown in an operation page's names panel. Every entry is
// verified at its pinned version: fp-ts and Effect by conformance tests in
// tests/conformance/, LanguageExt by compiled samples in snippets/. Keys are
// "operation:receiver" or "operation:receiver:strategy".

import { LANGUAGEEXT_VERSION, languageExt } from "./languageext";
import { samples } from "./samples.generated";

export interface NameEntry {
  readonly eco: "fp-ts" | "Effect" | "LanguageExt";
  readonly version: string;
  readonly api: string;
  readonly status: "equivalent" | "partial";
  readonly note?: string;
  readonly sample?: string;
  readonly verifiedBy: "conformance test" | "compiled sample";
}

const FP = { eco: "fp-ts", version: "2.16.11" } as const;
const EF = { eco: "Effect", version: "4.0.5" } as const;
const eq = (base: typeof FP | typeof EF, api: string, note?: string): NameEntry => ({ ...base, api, status: "equivalent", verifiedBy: "conformance test", ...(note ? { note } : {}) });
const part = (base: typeof FP | typeof EF, api: string, note: string): NameEntry => ({ ...base, api, status: "partial", note, verifiedBy: "conformance test" });

const jsNames: Readonly<Record<string, readonly NameEntry[]>> = {
  "pure:option": [eq(FP, "O.of", "Same as `O.some`."), eq(EF, "Option.some")],
  "pure:either": [eq(FP, "E.of", "Same as `E.right`."), eq(EF, "Result.succeed")],
  "pure:validation": [eq(FP, "E.of", "fp-ts Validation is an `Either`; errors accumulate through `E.getApplicativeValidation`.")],
  "pure:list": [eq(FP, "RA.of"), eq(EF, "Array.of")],
  "fail:either": [eq(FP, "E.left"), eq(EF, "Result.fail")],
  "fail:option": [eq(FP, "O.none"), eq(EF, "Option.none")],
  "fail:validation": [eq(FP, "E.left", "fp-ts Validation is an `Either` with a non-empty list of errors.")],
  "fromNullable:option": [eq(FP, "O.fromNullable"), eq(EF, "Option.fromNullishOr")],
  "fromNullable:either": [eq(FP, "E.fromNullable(e)", "Takes the error first, then the value."), eq(EF, "Result.fromNullishOr", "Computes the error with a function.")],
  "fromPredicate:option": [eq(FP, "O.fromPredicate"), eq(EF, "Option.liftPredicate")],
  "fromPredicate:either": [eq(FP, "E.fromPredicate"), eq(EF, "Result.liftPredicate")],
  "tryCatch:option": [eq(FP, "O.tryCatch"), part(EF, "Option.liftThrowable", "Lifts a function; calling the lifted function runs it.")],
  "tryCatch:either": [eq(FP, "E.tryCatch"), eq(EF, "Result.try", "Takes `{ try, catch }`.")],
  "map:either": [eq(FP, "E.map"), eq(EF, "Result.map")],
  "map:option": [eq(FP, "O.map"), eq(EF, "Option.map")],
  "map:list": [eq(FP, "RA.map"), eq(EF, "Array.map")],
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
  "traverse:either:eager": [part(FP, "TE.traverseArray", "TaskEither, parallel: every task runs, the first Left wins.")],
  "traverse:option:short-circuit": [eq(FP, "O.traverseArray")],
  "traverse:validation:eager": [eq(FP, "RA.traverse(E.getApplicativeValidation(S))"), part(EF, "Effect.validate", "On Effect. Evaluates every element and keeps every failure.")],
  "sequence:either:short-circuit": [eq(FP, "E.sequenceArray")],
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
    (all[key] ??= []).push({ eco: "LanguageExt", version: LANGUAGEEXT_VERSION, api: e.api, status: e.status, verifiedBy: "compiled sample", ...(e.note ? { note: e.note } : {}) });
  }
  for (const [key, list] of Object.entries(jsNames)) (all[key] ??= []).push(...list);
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
export function namesFor(operation: string, receiver: string, strategy?: string): readonly NameEntry[] {
  return [...((strategy && names[`${operation}:${receiver}:${strategy}`]) || []), ...(names[`${operation}:${receiver}`] ?? [])];
}
