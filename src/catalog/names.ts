// Ecosystem names shown in an operation page's names panel. Every entry is
// verified at its pinned version: fp-ts and Effect by conformance tests in
// tests/conformance/, LanguageExt by compiled samples in snippets/. Keys are
// "operation:receiver" or "operation:receiver:strategy".

import { LANGUAGEEXT_VERSION, languageExt } from "./languageext";

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
  "map:either": [eq(FP, "E.map"), eq(EF, "Result.map")],
  "map:option": [eq(FP, "O.map"), eq(EF, "Option.map")],
  "map:list": [eq(FP, "RA.map"), eq(EF, "Array.map")],
  "bimap:either": [eq(FP, "E.bimap"), eq(EF, "Result.mapBoth", "Named fields: { onFailure, onSuccess }.")],
  "flatMap:either": [eq(FP, "E.flatMap", "Legacy alias: chain."), eq(EF, "Result.flatMap")],
  "flatMap:option": [eq(FP, "O.flatMap"), eq(EF, "Option.flatMap")],
  "flatMap:list": [eq(FP, "RA.flatMap"), eq(EF, "Array.flatMap")],
  "flatten:either": [eq(FP, "E.flatten")],
  "flatten:option": [eq(FP, "O.flatten"), eq(EF, "Option.flatten")],
  "flatten:list": [eq(FP, "RA.flatten"), eq(EF, "Array.flatten")],
  "tap:either": [eq(FP, "E.tap", "Legacy alias: chainFirst.")],
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
  "alt:option": [eq(FP, "O.alt", "Current name: O.orElse."), eq(EF, "Option.orElse")],
  "alt:either": [eq(FP, "E.alt")],
  "alt:validation": [eq(FP, "E.getAltValidation(S).alt")],
  "alt:list": [eq(FP, "RA.alt", "Concatenation.")],
  "getOrElse:either": [eq(FP, "E.getOrElse"), eq(EF, "Result.getOrElse")],
  "getOrElse:option": [part(FP, "O.getOrElse", "Takes a thunk, not a constant."), part(EF, "Option.getOrElse", "Takes a thunk, not a constant.")],
  "match:either": [eq(FP, "E.match", "Legacy alias: fold."), eq(EF, "Result.match")],
  "match:option": [eq(FP, "O.match"), eq(EF, "Option.match")],
  "filterOrElse:either": [eq(FP, "E.filterOrElse"), eq(EF, "Result.filterOrFail")],
  "filterOrElse:option": [eq(FP, "O.filter"), eq(EF, "Option.filter")],
};

// LanguageExt first, matching the column order of the ecosystem index.
export const names: Readonly<Record<string, readonly NameEntry[]>> = (() => {
  const all: Record<string, NameEntry[]> = {};
  for (const [key, e] of Object.entries(languageExt)) {
    (all[key] ??= []).push({ eco: "LanguageExt", version: LANGUAGEEXT_VERSION, api: e.api, status: e.status, sample: e.sample, verifiedBy: "compiled sample", ...(e.note ? { note: e.note } : {}) });
  }
  for (const [key, list] of Object.entries(jsNames)) (all[key] ??= []).push(...list);
  return all;
})();

// Entries that hold for the chosen strategy, plus entries that hold for any.
export function namesFor(operation: string, receiver: string, strategy?: string): readonly NameEntry[] {
  return [...((strategy && names[`${operation}:${receiver}:${strategy}`]) || []), ...(names[`${operation}:${receiver}`] ?? [])];
}
