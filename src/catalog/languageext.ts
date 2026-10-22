// LanguageExt 4.4.9 entries. Every sample is copied verbatim from
// snippets/languageext/v4/Program.cs, where it is compiled and checked
// (`npm run samples:languageext`). tests/samples.test.ts keeps the two in sync.

export interface LanguageExtEntry {
  readonly api: string;
  readonly status: "equivalent" | "partial";
  readonly note?: string;
  readonly sample: string;
}

export const LANGUAGEEXT_VERSION = "4.4.9";

export const languageExt: Readonly<Record<string, LanguageExtEntry>> = {
  "map:either": { api: "Map", status: "equivalent", sample: "Either<string, int> input = Right(2);\nEither<string, int> result = input.Map(x => x * 10);" },
  "map:option": { api: "Map", status: "equivalent", sample: "Option<int> input = Some(2);\nOption<int> result = input.Map(x => x * 10);" },
  "map:list": { api: "Seq.Map", status: "equivalent", sample: "Seq<int> input = Seq(1, 2, 3);\nSeq<int> result = input.Map(x => x * 10);" },
  "bimap:either": { api: "BiMap(Right, Left)", status: "equivalent", note: "v4 takes the Right function first. Use named arguments.", sample: "Either<string, int> input = Left(\"oops\");\nEither<int, int> result = input.BiMap<int, int>(\n    Right: x => { calls++; return x * 10; },\n    Left: e => { calls++; return e.Length; });" },
  "flatMap:either": { api: "Bind", status: "equivalent", note: "LINQ query syntax uses SelectMany.", sample: "Either<string, int> input = Right(4);\nEither<string, int> result = input.Bind(x => x % 2 == 0 ? Right<string, int>(x / 2) : Left<string, int>(\"odd\"));" },
  "flatMap:option": { api: "Bind", status: "equivalent", sample: "Option<int> input = Some(4);\nOption<int> result = input.Bind(x => x % 2 == 0 ? Some(x / 2) : None);" },
  "flatMap:list": { api: "Seq.Bind", status: "equivalent", sample: "Seq<int> input = Seq(1, 2, 3);\nSeq<int> result = input.Bind(x => Seq(x, x));" },
  "flatten:option": { api: "Flatten", status: "equivalent", sample: "Option<Option<int>> input = Some(Some(1));\nOption<int> result = input.Flatten();" },
  "peek:either": { api: "Do", status: "equivalent", note: "Do runs an Action and returns the same Either. It cannot fail, so it is a peek, not an effectful tap.", sample: "Either<string, int> input = Right(2);\nEither<string, int> result = input.Do(x => seen.Add(x));" },
  "zip:either": { api: "from … from … select", status: "partial", note: "v4 has no tuple Apply for Either; the LINQ query is monadic. For Either the result is the same: the first Left wins.", sample: "Either<string, int> a = Left(\"e1\");\nEither<string, int> b = Left(\"e2\");\nEither<string, int> result =\n    from x in a\n    from y in b\n    select x + y;" },
  "zip:validation": { api: "(a, b).Apply(f)", status: "equivalent", note: "Keeps both failures.", sample: "Validation<string, int> a = Fail<string, int>(\"e1\");\nValidation<string, int> b = Fail<string, int>(\"e2\");\nValidation<string, int> result = (a, b).Apply((x, y) => x + y);" },
  "traverse:either:eager": { api: "Seq.Sequence(f)", status: "equivalent", note: "v4 swaps the names: Sequence(f) is traverse. Eager: f is called on every element (checked by the compiled sample).", sample: "Seq<int> input = Seq(1, -2, 3, -4);\nEither<string, Seq<int>> result = input.Sequence(x =>\n{\n    called.Add(x);\n    return x < 0 ? Left<string, int>($\"e{x}\") : Right<string, int>(x * 10);\n});" },
  "sequence:either": { api: "Seq.Sequence()", status: "equivalent", note: "Evaluation strategy not checked.", sample: "Seq<Either<string, int>> input = Seq(Right<string, int>(1), Left<string, int>(\"e2\"), Left<string, int>(\"e3\"));\nEither<string, Seq<int>> result = input.Sequence();" },
  "mapError:either": { api: "MapLeft", status: "equivalent", sample: "Either<string, int> input = Left(\"oops\");\nEither<int, int> result = input.MapLeft(e => e.Length);" },
  "recover:either": { api: "BindLeft", status: "equivalent", note: "Can change the error type.", sample: "Either<string, int> input = Left(\"oops\");\nEither<int, int> result = input.BindLeft(e => Left<int, int>(e.Length));" },
  "alt:option": { api: "||", status: "equivalent", sample: "Option<int> first = None;\nOption<int> result = first || Some(9);" },
  "getOrElse:either": { api: "IfLeft(e => …)", status: "equivalent", sample: "Either<string, int> input = Left(\"oops\");\nint result = input.IfLeft(e => e.Length);" },
  "getOrElse:option": { api: "IfNone(value)", status: "equivalent", note: "Also takes a function: IfNone(() => …).", sample: "Option<int> input = None;\nint result = input.IfNone(0);" },
  "match:either": { api: "Match(Right, Left)", status: "equivalent", note: "v4 takes the Right handler first. Use named arguments.", sample: "Either<string, int> input = Left(\"oops\");\nstring result = input.Match(\n    Right: x => $\"value {x}\",\n    Left: e => $\"error {e}\");" },
  "match:option": { api: "Match(Some, None)", status: "equivalent", sample: "Option<int> input = Some(2);\nstring result = input.Match(\n    Some: x => $\"value {x}\",\n    None: () => \"nothing\");" },
  "filterOrElse:option": { api: "Filter", status: "equivalent", sample: "Option<int> input = Some(3);\nOption<int> result = input.Filter(x => x > 5);" },
};
