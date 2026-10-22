// LanguageExt 4.4.9 entries. Their samples are compiled and checked in
// snippets/languageext/v4/Program.cs (`npm run samples:languageext`) and
// reach the site through src/catalog/samples.generated.ts.

export interface LanguageExtEntry {
  readonly api: string;
  readonly status: "equivalent" | "partial";
  readonly note?: string;
}

export const LANGUAGEEXT_VERSION = "4.4.9";

export const languageExt: Readonly<Record<string, LanguageExtEntry>> = {
  "map:either": { api: "Map", status: "equivalent", },
  "map:option": { api: "Map", status: "equivalent", },
  "map:list": { api: "Seq.Map", status: "equivalent", },
  "bimap:either": { api: "BiMap(Right, Left)", status: "equivalent", note: "v4 takes the Right function first. Use named arguments.", },
  "flatMap:either": { api: "Bind", status: "equivalent", note: "LINQ query syntax uses SelectMany.", },
  "flatMap:option": { api: "Bind", status: "equivalent", },
  "flatMap:list": { api: "Seq.Bind", status: "equivalent", },
  "flatten:option": { api: "Flatten", status: "equivalent", },
  "peek:either": { api: "Do", status: "equivalent", note: "Do runs an Action and returns the same Either. It cannot fail, so it is a peek, not an effectful tap.", },
  "zip:either": { api: "from … from … select", status: "partial", note: "v4 has no tuple Apply for Either; the LINQ query is monadic. For Either the result is the same: the first Left wins.", },
  "zip:validation": { api: "(a, b).Apply(f)", status: "equivalent", note: "Keeps both failures.", },
  "traverse:either:eager": { api: "Seq.Sequence(f)", status: "equivalent", note: "v4 swaps the names: Sequence(f) is traverse. Eager: f is called on every element.", },
  "sequence:either": { api: "Seq.Sequence()", status: "equivalent", },
  "mapError:either": { api: "MapLeft", status: "equivalent", },
  "recover:either": { api: "BindLeft", status: "equivalent", note: "Can change the error type.", },
  "alt:option": { api: "||", status: "equivalent", },
  "getOrElse:either": { api: "IfLeft(e => …)", status: "equivalent", },
  "getOrElse:option": { api: "IfNone(value)", status: "equivalent", note: "Also takes a function: IfNone(() => …).", },
  "match:either": { api: "Match(Right, Left)", status: "equivalent", note: "v4 takes the Right handler first. Use named arguments.", },
  "match:option": { api: "Match(Some, None)", status: "equivalent", },
  "filterOrElse:option": { api: "Filter", status: "equivalent", },
};
