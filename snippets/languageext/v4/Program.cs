// LanguageExt 4.4.9 samples shown on FP Shapes. Every sample between
// "// <sample KEY>" and "// </sample>" is shown on the site verbatim
// (tests/samples.test.ts checks that). Each one is checked below; the program
// exits non-zero if any check fails.
using LanguageExt;
using static LanguageExt.Prelude;

var failures = 0;
void Check(string key, bool ok, string detail)
{
    Console.WriteLine($"{(ok ? "PASS" : "FAIL")} {key}: {detail}");
    if (!ok) failures++;
}
string ShowE<L, R>(Either<L, R> e) => e.Match(Right: r => $"Right({r})", Left: l => $"Left({l})");
string ShowO<A>(Option<A> o) => o.Match(Some: a => $"Some({a})", None: () => "None");
string ShowS<A>(Seq<A> s) => "[" + string.Join(", ", s) + "]";

// --- Mapping -----------------------------------------------------------------
{
    // <sample map:either>
    Either<string, int> input = Right(2);
    Either<string, int> result = input.Map(x => x * 10);
    // </sample>
    Check("map:either", ShowE(result) == "Right(20)", ShowE(result));
}
{
    // <sample map:option>
    Option<int> input = Some(2);
    Option<int> result = input.Map(x => x * 10);
    // </sample>
    Check("map:option", ShowO(result) == "Some(20)", ShowO(result));
}
{
    // <sample map:list>
    Seq<int> input = Seq(1, 2, 3);
    Seq<int> result = input.Map(x => x * 10);
    // </sample>
    Check("map:list", ShowS(result) == "[10, 20, 30]", ShowS(result));
}
{
    // <sample bimap:either>
    Either<string, int> input = Left("oops");
    Either<int, int> result = input.BiMap<int, int>(
        Right: x => x * 10,
        Left: e => e.Length);
    // </sample>
    Check("bimap:either", ShowE(result) == "Left(4)", ShowE(result));
    // Only one side runs (not shown on the site).
    var calls = 0;
    input.BiMap<int, int>(Right: x => { calls++; return x; }, Left: e => { calls++; return 0; });
    Check("bimap:either calls", calls == 1, $"{calls} call(s)");
}

// --- Sequencing --------------------------------------------------------------
{
    // <sample flatMap:either>
    Either<string, int> input = Right(4);
    Either<string, int> result = input.Bind(x => x % 2 == 0 ? Right<string, int>(x / 2) : Left<string, int>("odd"));
    // </sample>
    Check("flatMap:either", ShowE(result) == "Right(2)", ShowE(result));
}
{
    // <sample flatMap:option>
    Option<int> input = Some(4);
    Option<int> result = input.Bind(x => x % 2 == 0 ? Some(x / 2) : None);
    // </sample>
    Check("flatMap:option", ShowO(result) == "Some(2)", ShowO(result));
}
{
    // <sample flatMap:list>
    Seq<int> input = Seq(1, 2, 3);
    Seq<int> result = input.Bind(x => Seq(x, x));
    // </sample>
    Check("flatMap:list", ShowS(result) == "[1, 1, 2, 2, 3, 3]", ShowS(result));
}
{
    // <sample flatten:option>
    Option<Option<int>> input = Some(Some(1));
    Option<int> result = input.Flatten();
    // </sample>
    Check("flatten:option", ShowO(result) == "Some(1)", ShowO(result));
}
{
    var seen = new List<int>();
    // <sample peek:either>
    Either<string, int> input = Right(2);
    Either<string, int> result = input.Do(x => seen.Add(x));
    // </sample>
    Check("peek:either", ShowE(result) == "Right(2)" && seen.SequenceEqual(new[] { 2 }), $"{ShowE(result)}, saw [{string.Join(", ", seen)}]");
}

// --- Zipping -----------------------------------------------------------------
{
    // <sample zip:either>
    Either<string, int> a = Left("e1");
    Either<string, int> b = Left("e2");
    Either<string, int> result =
        from x in a
        from y in b
        select x + y;
    // </sample>
    Check("zip:either", ShowE(result) == "Left(e1)", ShowE(result));
}
{
    // <sample zip:validation>
    Validation<string, int> a = Fail<string, int>("e1");
    Validation<string, int> b = Fail<string, int>("e2");
    Validation<string, int> result = (a, b).Apply((x, y) => x + y);
    // </sample>
    var shown = result.Match(Succ: v => $"Success({v})", Fail: es => $"Failure([{string.Join(", ", es)}])");
    Check("zip:validation", shown == "Failure([e1, e2])", shown);
}

// --- Traversing (v4 names are swapped relative to Haskell) -------------------
{
    // <sample traverse:either>
    Seq<int> input = Seq(1, -2, 3, -4);
    Either<string, Seq<int>> result = input.Sequence(x =>
        x < 0 ? Left<string, int>($"e{x}") : Right<string, int>(x * 10));
    // </sample>
    Check("traverse:either", ShowE(result) == "Left(e-2)", ShowE(result));
    // Which evaluation strategy does v4 use? Count the calls (not shown on the site).
    var called = new List<int>();
    input.Sequence(x => { called.Add(x); return x < 0 ? Left<string, int>("e") : Right<string, int>(x); });
    var strategy = called.Count == 2 ? "short-circuit" : called.Count == 4 ? "eager" : "unknown";
    Check("traverse:either strategy", strategy == "eager", $"called on [{string.Join(", ", called)}] => {strategy}");
}
{
    // <sample sequence:either>
    Seq<Either<string, int>> input = Seq(Right<string, int>(1), Left<string, int>("e2"), Left<string, int>("e3"));
    Either<string, Seq<int>> result = input.Sequence();
    // </sample>
    Check("sequence:either", ShowE(result) == "Left(e2)", ShowE(result));
}

// --- Error handling ----------------------------------------------------------
{
    // <sample mapError:either>
    Either<string, int> input = Left("oops");
    Either<int, int> result = input.MapLeft(e => e.Length);
    // </sample>
    Check("mapError:either", ShowE(result) == "Left(4)", ShowE(result));
}
{
    // <sample recover:either>
    Either<string, int> input = Left("oops");
    Either<int, int> result = input.BindLeft(e => Left<int, int>(e.Length));
    // </sample>
    Check("recover:either", ShowE(result) == "Left(4)", ShowE(result));
}
{
    // <sample alt:option>
    Option<int> first = None;
    Option<int> result = first || Some(9);
    // </sample>
    Check("alt:option", ShowO(result) == "Some(9)", ShowO(result));
}
{
    // <sample getOrElse:either>
    Either<string, int> input = Left("oops");
    int result = input.IfLeft(e => e.Length);
    // </sample>
    Check("getOrElse:either", result == 4, result.ToString());
}
{
    // <sample getOrElse:option>
    Option<int> input = None;
    int result = input.IfNone(0);
    // </sample>
    Check("getOrElse:option", result == 0, result.ToString());
}

// --- Pattern matching and filtering ------------------------------------------
{
    // <sample match:either>
    Either<string, int> input = Left("oops");
    string result = input.Match(
        Right: x => $"value {x}",
        Left: e => $"error {e}");
    // </sample>
    Check("match:either", result == "error oops", result);
}
{
    // <sample match:option>
    Option<int> input = Some(2);
    string result = input.Match(
        Some: x => $"value {x}",
        None: () => "nothing");
    // </sample>
    Check("match:option", result == "value 2", result);
}
{
    // <sample filterOrElse:option>
    Option<int> input = Some(3);
    Option<int> result = input.Filter(x => x > 5);
    // </sample>
    Check("filterOrElse:option", ShowO(result) == "None", ShowO(result));
}

// --- Remaining receivers ------------------------------------------------------
string ShowV<E, A>(Validation<E, A> v) => v.Match(Succ: a => $"Success({a})", Fail: es => $"Failure([{string.Join(", ", es)}])");
{
    // <sample bimap:tuple>
    (string, int) input = ("a", 1);
    (int, string) result = input.BiMap(a => a.Length, n => $"#{n}");
    // </sample>
    Check("bimap:tuple", result == (1, "#1"), result.ToString());
}
{
    // <sample flatten:either>
    Either<string, Either<string, int>> input = Right<string, Either<string, int>>(Right<string, int>(1));
    Either<string, int> result = input.Flatten();
    // </sample>
    Check("flatten:either", ShowE(result) == "Right(1)", ShowE(result));
}
{
    // <sample flatten:list>
    Seq<Seq<int>> input = Seq(Seq(1, 2), Seq1(3));
    Seq<int> result = input.Flatten();
    // </sample>
    Check("flatten:list", ShowS(result) == "[1, 2, 3]", ShowS(result));
}
{
    // <sample tap:either>
    Either<string, int> Audit(int x) => x > 0 ? Right<string, int>(x) : Left<string, int>("audit failed");
    Either<string, int> input = Right(2);
    Either<string, int> result =
        from x in input
        from _ in Audit(x)
        select x;
    // </sample>
    Check("tap:either", ShowE(result) == "Right(2)", ShowE(result));
    var failed = from x in Right<string, int>(-1) from _ in Audit(x) select x;
    Check("tap:either fails", ShowE(failed) == "Left(audit failed)", ShowE(failed));
}
{
    // <sample tap:option>
    Option<int> Check2(int x) => x > 0 ? Some(x) : None;
    Option<int> input = Some(2);
    Option<int> result =
        from x in input
        from _ in Check2(x)
        select x;
    // </sample>
    Check("tap:option", ShowO(result) == "Some(2)", ShowO(result));
}
{
    var seen = new List<int>();
    // <sample peek:list>
    Seq<int> input = Seq(1, 2, 3);
    Seq<int> result = input.Do(x => seen.Add(x));
    // </sample>
    Check("peek:list", ShowS(result) == "[1, 2, 3]" && seen.SequenceEqual(new[] { 1, 2, 3 }), $"{ShowS(result)}, saw [{string.Join(", ", seen)}]");
}
{
    // <sample zip:list>
    Seq<string> result =
        from n in Seq(1, 2, 3)
        from s in Seq("a", "b")
        select $"{n}{s}";
    // </sample>
    Check("zip:list", ShowS(result) == "[1a, 1b, 2a, 2b, 3a, 3b]", ShowS(result));
}
{
    // <sample zip:ziplist>
    Seq<string> result = Seq(1, 2, 3).Zip(Seq("a", "b"), (n, s) => $"{n}{s}");
    // </sample>
    Check("zip:ziplist", ShowS(result) == "[1a, 2b]", ShowS(result));
}
{
    // <sample traverse:option>
    Seq<int> input = Seq(1, -2, 3);
    Option<Seq<int>> result = input.Sequence(x => x < 0 ? None : Some(x * 10));
    // </sample>
    Check("traverse:option", ShowO(result.Map(ShowS)) == "None", ShowO(result.Map(ShowS)));
    var called = new List<int>();
    input.Sequence(x => { called.Add(x); return x < 0 ? Option<int>.None : Some(x); });
    Console.WriteLine($"STRATEGY traverse:option {(called.Count == 2 ? "short-circuit" : called.Count == 3 ? "eager" : "unknown")}");
}
{
    // <sample traverse:validation>
    Seq<int> input = Seq(1, -2, 3, -4);
    Validation<string, Seq<int>> result = input.Sequence(x =>
        x < 0 ? Fail<string, int>($"e{x}") : Success<string, int>(x * 10));
    // </sample>
    Check("traverse:validation", ShowV(result.Map(ShowS)) == "Failure([e-2, e-4])", ShowV(result.Map(ShowS)));
}
{
    // <sample sequence:option>
    Seq<Option<int>> input = Seq(Some(1), None, Some(3));
    Option<Seq<int>> result = input.Sequence();
    // </sample>
    Check("sequence:option", ShowO(result.Map(ShowS)) == "None", ShowO(result.Map(ShowS)));
}
{
    // <sample sequence:validation>
    Seq<Validation<string, int>> input = Seq(Success<string, int>(1), Fail<string, int>("e2"), Fail<string, int>("e3"));
    Validation<string, Seq<int>> result = input.Sequence();
    // </sample>
    Check("sequence:validation", ShowV(result.Map(ShowS)) == "Failure([e2, e3])", ShowV(result.Map(ShowS)));
}
{
    // <sample mapError:validation>
    Validation<string, int> input = Fail<string, int>("e1") | Fail<string, int>("e2");
    Validation<string, int> result = input.MapFail(e => e.ToUpper());
    // </sample>
    Check("mapError:validation", ShowV(result) == "Failure([E1, E2])", ShowV(result));
}
{
    // <sample alt:either>
    Either<string, int> first = Left("e1");
    Either<string, int> result = first || Left<string, int>("e2");
    // </sample>
    Check("alt:either", ShowE(result) == "Left(e2)", ShowE(result));
}
{
    // <sample alt:validation>
    Validation<string, int> first = Fail<string, int>("e1");
    Validation<string, int> result = first | Fail<string, int>("e2");
    // </sample>
    Check("alt:validation", ShowV(result) == "Failure([e1, e2])", ShowV(result));
}
{
    // <sample alt:list>
    Seq<int> result = Seq(1, 2) + Seq1(3);
    // </sample>
    Check("alt:list", ShowS(result) == "[1, 2, 3]", ShowS(result));
}
{
    // <sample match:validation>
    Validation<string, int> input = Fail<string, int>("e1") | Fail<string, int>("e2");
    string result = input.Match(
        Succ: x => $"value {x}",
        Fail: errors => $"{errors.Count} errors");
    // </sample>
    Check("match:validation", result == "2 errors", result);
}
{
    // <sample filterOrElse:either>
    Either<string, int> input = Right(3);
    Either<string, int> result = input.Bind(x =>
        x > 5 ? Right<string, int>(x) : Left<string, int>($"too small: {x}"));
    // </sample>
    Check("filterOrElse:either", ShowE(result) == "Left(too small: 3)", ShowE(result));
}

Console.WriteLine(failures == 0 ? "ALL PASS" : $"{failures} FAILED");
return failures == 0 ? 0 : 1;
