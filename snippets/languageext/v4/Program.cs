// LanguageExt 4.4.9 samples shown on FP Shapes. Every sample between
// "// <sample KEY>" and "// </sample>" is shown on the site verbatim
// (tests/samples.test.ts checks that). Each one is checked below with Expect;
// the program exits non-zero if any check fails. Samples use the scenario
// values from the page, so they read as translations of the other ecosystems.
using LanguageExt;
using static LanguageExt.Prelude;

var failures = 0;
void Expect(string key, bool ok, string detail)
{
    Console.WriteLine($"{(ok ? "PASS" : "FAIL")} {key}: {detail}");
    if (!ok) failures++;
}
string ShowE<L, R>(Either<L, R> e) => e.Match(Right: r => $"Right({r})", Left: l => $"Left({l})");
string ShowO<A>(Option<A> o) => o.Match(Some: a => $"Some({a})", None: () => "None");
string ShowS<A>(IEnumerable<A> s) => "[" + string.Join(", ", s) + "]";
string ShowV<E, A>(Validation<E, A> v) => v.Match(Succ: a => $"Success({a})", Fail: es => $"Failure([{string.Join(", ", es)}])");

// --- Constructors ------------------------------------------------------------
{
    // <sample pure:option>
    Option<int> result = Some(2);
    // </sample>
    Expect("pure:option", ShowO(result) == "Some(2)", ShowO(result));
    // v4's Some rejects null, unlike fp-ts O.of(null) and Effect Option.some(null).
    var threw = false;
    try { Some<string>(null!); } catch (ValueIsNullException) { threw = true; }
    Expect("pure:option null", threw, threw ? "throws" : "no throw");
}
{
    // <sample pure:either>
    Either<string, int> result = Right(2);
    // </sample>
    Expect("pure:either", ShowE(result) == "Right(2)", ShowE(result));
    var threw = false;
    try { Right<string, string>(null!); } catch (ValueIsNullException) { threw = true; }
    Expect("pure:either null", threw, threw ? "throws" : "no throw");
}
{
    // <sample pure:validation>
    Validation<string, int> result = Success<string, int>(2);
    // </sample>
    Expect("pure:validation", ShowV(result) == "Success(2)", ShowV(result));
    var threw = false;
    try { Success<string, string>(null!); } catch (ValueIsNullException) { threw = true; }
    Expect("pure:validation null", threw, threw ? "throws" : "no throw");
}
{
    // <sample pure:list>
    Seq<int> result = Seq1(2);
    // </sample>
    Expect("pure:list", ShowS(result) == "[2]", ShowS(result));
}
{
    // <sample fail:either>
    Either<string, int> result = Left<string, int>("oops");
    // </sample>
    Expect("fail:either", ShowE(result) == "Left(oops)", ShowE(result));
}
{
    // <sample fail:option>
    Option<int> result = None;
    // </sample>
    Expect("fail:option", ShowO(result) == "None", ShowO(result));
}
{
    // <sample fail:validation>
    Validation<string, int> result = Fail<string, int>("oops");
    // </sample>
    Expect("fail:validation", ShowV(result) == "Failure([oops])", ShowV(result));
}
{
    // <sample fail:list>
    Seq<int> result = Empty;
    // </sample>
    Expect("fail:list", ShowS(result) == "[]", ShowS(result));
}
{
    // <sample fromNullable:option>
    Dictionary<string, int?> ages = new() { ["ada"] = 36 };
    Option<int> result = Optional(ages.GetValueOrDefault("bob"));
    // </sample>
    Expect("fromNullable:option", ShowO(result) == "None", ShowO(result));
    Expect("fromNullable:option present", ShowO(Optional(ages.GetValueOrDefault("ada"))) == "Some(36)", ShowO(Optional(ages.GetValueOrDefault("ada"))));
}
{
    // <sample fromNullable:either>
    Dictionary<string, int?> ages = new() { ["ada"] = 36 };
    Either<string, int> result = Optional(ages.GetValueOrDefault("bob")).ToEither("missing");
    // </sample>
    Expect("fromNullable:either", ShowE(result) == "Left(missing)", ShowE(result));
}
{
    // <sample fromNullable:validation>
    Dictionary<string, int?> ages = new() { ["ada"] = 36 };
    Validation<string, int> result = Optional(ages.GetValueOrDefault("bob")).ToValidation("missing");
    // </sample>
    Expect("fromNullable:validation", ShowV(result) == "Failure([missing])", ShowV(result));
}
{
    // <sample fromNullable:list>
    Dictionary<string, int?> ages = new() { ["ada"] = 36 };
    Seq<int> result = Optional(ages.GetValueOrDefault("bob")).ToSeq();
    // </sample>
    Expect("fromNullable:list", ShowS(result) == "[]", ShowS(result));
}
{
    // <sample fromPredicate:option>
    int input = 3;
    Option<int> result = Cond<int>(x => x > 5)(input);
    // </sample>
    Expect("fromPredicate:option", ShowO(result) == "None", ShowO(result));
    var nullResult = Cond<string>(s => true)(null!);
    Expect("fromPredicate:option null", nullResult.IsNone, nullResult.IsNone ? "None" : "Some");
}
{
    // <sample fromPredicate:either>
    int input = 3;
    Either<string, int> result = Cond<int>(x => x > 5)(input).ToEither($"too small: {input}");
    // </sample>
    Expect("fromPredicate:either", ShowE(result) == "Left(too small: 3)", ShowE(result));
}
{
    // <sample fromPredicate:validation>
    int input = 3;
    Validation<string, int> result = Cond<int>(x => x > 5)(input).ToValidation($"too small: {input}");
    // </sample>
    Expect("fromPredicate:validation", ShowV(result) == "Failure([too small: 3])", ShowV(result));
}
{
    // <sample fromPredicate:list>
    int input = 3;
    Seq<int> result = Cond<int>(x => x > 5)(input).ToSeq();
    // </sample>
    Expect("fromPredicate:list", ShowS(result) == "[]", ShowS(result));
}
{
    // <sample tryCatch:option>
    Option<int> result = Try(() => int.Parse("x")).ToOption();
    // </sample>
    Expect("tryCatch:option", ShowO(result) == "None", ShowO(result));
    var nullResult = Try<string>(() => null!).ToOption();
    Expect("tryCatch:option null", nullResult.IsNone, ShowO(nullResult.Map(x => 0)));
}
{
    // <sample tryCatch:either>
    Either<string, int> result = Try(() => int.Parse("x")).ToEither(ex => "invalid input");
    // </sample>
    Expect("tryCatch:either", ShowE(result) == "Left(invalid input)", ShowE(result));
    var threw = false;
    try { Try<string>(() => null!).ToEither(ex => "invalid input"); } catch (ValueIsNullException) { threw = true; }
    Expect("tryCatch:either null", threw, threw ? "throws" : "no throw");
}
{
    // <sample tryCatch:validation>
    Validation<string, int> result = Try(() => int.Parse("x")).ToValidation(ex => "invalid input");
    // </sample>
    Expect("tryCatch:validation", ShowV(result) == "Failure([invalid input])", ShowV(result));
    var threw = false;
    try { Try<string>(() => null!).ToValidation(ex => "invalid input"); } catch (ValueIsNullException) { threw = true; }
    Expect("tryCatch:validation null", threw, threw ? "throws" : "no throw");
}

// --- Mapping -----------------------------------------------------------------
{
    // <sample map:either>
    Either<string, int> input = Right(2);
    Either<string, int> result = input.Map(x => x * 10);
    // </sample>
    Expect("map:either", ShowE(result) == "Right(20)", ShowE(result));
}
{
    // <sample map:option>
    Option<int> input = Some(2);
    Option<int> result = input.Map(x => x * 10);
    // </sample>
    Expect("map:option", ShowO(result) == "Some(20)", ShowO(result));
}
{
    // <sample map:list>
    Seq<int> input = Seq(1, 2, 3);
    Seq<int> result = input.Map(x => x * 10);
    // </sample>
    Expect("map:list", ShowS(result) == "[10, 20, 30]", ShowS(result));
}
{
    // <sample bimap:either>
    Either<string, int> input = Left("oops");
    Either<int, int> result = input.BiMap<int, int>(
        Right: x => x * 10,
        Left: e => e.Length);
    // </sample>
    Expect("bimap:either", ShowE(result) == "Left(4)", ShowE(result));
    // Only one side runs (not shown on the site).
    var calls = 0;
    input.BiMap<int, int>(Right: x => { calls++; return x; }, Left: e => { calls++; return 0; });
    Expect("bimap:either calls", calls == 1, $"{calls} call(s)");
}
{
    // <sample bimap:tuple>
    (string, int) input = ("oops", 2);
    (int, int) result = input.BiMap(e => e.Length, x => x * 10);
    // </sample>
    Expect("bimap:tuple", result == (4, 20), result.ToString());
}

// --- Sequencing --------------------------------------------------------------
{
    // <sample flatMap:either>
    Either<string, int> Half(int x) => x % 2 == 0 ? Right<string, int>(x / 2) : Left<string, int>("odd");
    Either<string, int> input = Right(4);
    Either<string, int> result = input.Bind(Half);
    // </sample>
    Expect("flatMap:either", ShowE(result) == "Right(2)", ShowE(result));
}
{
    // <sample flatMap:option>
    Option<int> Half(int x) => x % 2 == 0 ? Some(x / 2) : None;
    Option<int> input = Some(4);
    Option<int> result = input.Bind(Half);
    // </sample>
    Expect("flatMap:option", ShowO(result) == "Some(2)", ShowO(result));
}
{
    // <sample flatMap:list>
    Seq<int> input = Seq(1, 2, 3);
    Seq<int> result = input.Bind(x => Seq(x, x));
    // </sample>
    Expect("flatMap:list", ShowS(result) == "[1, 1, 2, 2, 3, 3]", ShowS(result));
}
{
    // <sample flatten:either>
    Either<string, Either<string, int>> input = Right<string, Either<string, int>>(Right<string, int>(1));
    Either<string, int> result = input.Flatten();
    // </sample>
    Expect("flatten:either", ShowE(result) == "Right(1)", ShowE(result));
}
{
    // <sample flatten:option>
    Option<Option<int>> input = Some(Some(1));
    Option<int> result = input.Flatten();
    // </sample>
    Expect("flatten:option", ShowO(result) == "Some(1)", ShowO(result));
}
{
    // <sample flatten:list>
    Seq<Seq<int>> input = Seq(Seq(1, 2), Seq1(3));
    Seq<int> result = input.Flatten();
    // </sample>
    Expect("flatten:list", ShowS(result) == "[1, 2, 3]", ShowS(result));
}
{
    // <sample tap:either>
    Either<string, Unit> Audit(int x) => x > 0 ? Right<string, Unit>(unit) : Left<string, Unit>("audit failed");
    Either<string, int> input = Right(2);
    Either<string, int> result =
        from x in input
        from _ in Audit(x)
        select x;
    // </sample>
    Expect("tap:either", ShowE(result) == "Right(2)", ShowE(result));
    var failed = from x in Right<string, int>(-1) from _ in Audit(x) select x;
    Expect("tap:either fails", ShowE(failed) == "Left(audit failed)", ShowE(failed));
}
{
    // <sample tap:option>
    Option<Unit> Audit(int x) => x > 0 ? Some(unit) : None;
    Option<int> input = Some(2);
    Option<int> result =
        from x in input
        from _ in Audit(x)
        select x;
    // </sample>
    Expect("tap:option", ShowO(result) == "Some(2)", ShowO(result));
    var failed = from x in Some(-1) from _ in Audit(x) select x;
    Expect("tap:option fails", ShowO(failed) == "None", ShowO(failed));
}
{
    // <sample peek:either>
    List<int> seen = new();
    Either<string, int> input = Right(2);
    Either<string, int> result = input.Do(x => seen.Add(x));
    // </sample>
    Expect("peek:either", ShowE(result) == "Right(2)" && seen.SequenceEqual(new[] { 2 }), $"{ShowE(result)}, saw {ShowS(seen)}");
}
{
    // <sample peek:list>
    List<int> seen = new();
    Seq<int> input = Seq(1, 2, 3);
    Seq<int> result = input.Do(x => seen.Add(x));
    // </sample>
    Expect("peek:list", ShowS(result) == "[1, 2, 3]" && seen.SequenceEqual(new[] { 1, 2, 3 }), $"{ShowS(result)}, saw {ShowS(seen)}");
}

// --- Zipping -----------------------------------------------------------------
{
    // <sample zip:either>
    Either<string, int> a = Left("e1");
    Either<string, int> b = Left("e2");
    Either<string, int> result = fun((int x, int y) => x + y).Apply(a, b);
    // </sample>
    Expect("zip:either", ShowE(result) == "Left(e1)", ShowE(result));
    var both = fun((int x, int y) => x + y).Apply(Right<string, int>(1), Right<string, int>(2));
    Expect("zip:either both succeed", ShowE(both) == "Right(3)", ShowE(both));
}
{
    // <sample zip:validation>
    Validation<string, int> a = Fail<string, int>("e1");
    Validation<string, int> b = Fail<string, int>("e2");
    Validation<string, int> result = (a, b).Apply((x, y) => x + y);
    // </sample>
    Expect("zip:validation", ShowV(result) == "Failure([e1, e2])", ShowV(result));
}
{
    // <sample zip:list>
    Seq<int> a = Seq(1, 2, 3);
    Seq<string> b = Seq("a", "b");
    Seq<string> result =
        from n in a
        from s in b
        select $"{n}{s}";
    // </sample>
    Expect("zip:list", ShowS(result) == "[1a, 1b, 2a, 2b, 3a, 3b]", ShowS(result));
}
{
    // <sample zip:ziplist>
    Seq<int> a = Seq(1, 2, 3);
    Seq<string> b = Seq("a", "b");
    Seq<string> result = a.Zip(b, (n, s) => $"{n}{s}");
    // </sample>
    Expect("zip:ziplist", ShowS(result) == "[1a, 2b]", ShowS(result));
}

// --- Traversing (v4 names are swapped relative to Haskell) -------------------
// The receiver decides the result; the call log after each sample proves the
// evaluation strategy (not shown on the site).
{
    // <sample traverse:either:short-circuit>
    Either<string, int> Check(int x) => x < 0 ? Left<string, int>($"e{x}") : Right<string, int>(x * 10);
    IEnumerable<int> input = new[] { 1, -2, 3, -4 };
    Either<string, IEnumerable<int>> result = input.Sequence(Check);
    // </sample>
    Expect("traverse:either:short-circuit", ShowE(result.Map(xs => ShowS(xs))) == "Left(e-2)", ShowE(result.Map(xs => ShowS(xs))));
    var called = new List<int>();
    input.Sequence(x => { called.Add(x); return Check(x); });
    Expect("traverse:either:short-circuit calls", called.SequenceEqual(new[] { 1, -2 }), $"called on {ShowS(called)}");
}
{
    // <sample traverse:either:eager>
    Either<string, int> Check(int x) => x < 0 ? Left<string, int>($"e{x}") : Right<string, int>(x * 10);
    Seq<int> input = Seq(1, -2, 3, -4);
    Either<string, Seq<int>> result = input.Sequence(Check);
    // </sample>
    Expect("traverse:either:eager", ShowE(result.Map(xs => ShowS(xs))) == "Left(e-2)", ShowE(result.Map(xs => ShowS(xs))));
    var called = new List<int>();
    input.Sequence(x => { called.Add(x); return Check(x); });
    Expect("traverse:either:eager calls", called.SequenceEqual(new[] { 1, -2, 3, -4 }), $"called on {ShowS(called)}");
}
{
    // <sample traverse:option:short-circuit>
    Option<int> Check(int x) => x < 0 ? None : Some(x * 10);
    IEnumerable<int> input = new[] { 1, -2, 3, -4 };
    Option<IEnumerable<int>> result = input.Sequence(Check);
    // </sample>
    Expect("traverse:option:short-circuit", ShowO(result.Map(xs => ShowS(xs))) == "None", ShowO(result.Map(xs => ShowS(xs))));
    var called = new List<int>();
    input.Sequence(x => { called.Add(x); return Check(x); });
    Expect("traverse:option:short-circuit calls", called.SequenceEqual(new[] { 1, -2 }), $"called on {ShowS(called)}");
}
{
    // <sample traverse:option:eager>
    Option<int> Check(int x) => x < 0 ? None : Some(x * 10);
    Seq<int> input = Seq(1, -2, 3, -4);
    Option<Seq<int>> result = input.Sequence(Check);
    // </sample>
    Expect("traverse:option:eager", ShowO(result.Map(xs => ShowS(xs))) == "None", ShowO(result.Map(xs => ShowS(xs))));
    var called = new List<int>();
    input.Sequence(x => { called.Add(x); return Check(x); });
    Expect("traverse:option:eager calls", called.SequenceEqual(new[] { 1, -2, 3, -4 }), $"called on {ShowS(called)}");
}
{
    // <sample traverse:validation:eager>
    Validation<string, int> Check(int x) => x < 0 ? Fail<string, int>($"e{x}") : Success<string, int>(x * 10);
    Seq<int> input = Seq(1, -2, 3, -4);
    Validation<string, Seq<int>> result = input.Sequence(Check);
    // </sample>
    Expect("traverse:validation:eager", ShowV(result.Map(xs => ShowS(xs))) == "Failure([e-2, e-4])", ShowV(result.Map(xs => ShowS(xs))));
    var called = new List<int>();
    input.Sequence(x => { called.Add(x); return Check(x); });
    Expect("traverse:validation:eager calls", called.SequenceEqual(new[] { 1, -2, 3, -4 }), $"called on {ShowS(called)}");
}
{
    // <sample sequence:either>
    Seq<Either<string, int>> input = Seq(Right<string, int>(1), Left<string, int>("e2"), Right<string, int>(3), Left<string, int>("e4"));
    Either<string, Seq<int>> result = input.Sequence();
    // </sample>
    Expect("sequence:either", ShowE(result.Map(xs => ShowS(xs))) == "Left(e2)", ShowE(result.Map(xs => ShowS(xs))));
}
{
    // <sample sequence:option>
    Seq<Option<int>> input = Seq(Some(1), None, Some(3), None);
    Option<Seq<int>> result = input.Sequence();
    // </sample>
    Expect("sequence:option", ShowO(result.Map(xs => ShowS(xs))) == "None", ShowO(result.Map(xs => ShowS(xs))));
}
{
    // <sample sequence:validation>
    Seq<Validation<string, int>> input = Seq(Success<string, int>(1), Fail<string, int>("e2"), Success<string, int>(3), Fail<string, int>("e4"));
    Validation<string, Seq<int>> result = input.Sequence();
    // </sample>
    Expect("sequence:validation", ShowV(result.Map(xs => ShowS(xs))) == "Failure([e2, e4])", ShowV(result.Map(xs => ShowS(xs))));
}

// --- Error handling ----------------------------------------------------------
{
    // <sample mapError:either>
    Either<string, int> input = Left("oops");
    Either<int, int> result = input.MapLeft(e => e.Length);
    // </sample>
    Expect("mapError:either", ShowE(result) == "Left(4)", ShowE(result));
}
{
    // <sample mapError:validation>
    Validation<string, int> input = Fail<string, int>(Seq("e1", "e2"));
    Validation<string, int> result = input.MapFail(e => e.ToUpper());
    // </sample>
    Expect("mapError:validation", ShowV(result) == "Failure([E1, E2])", ShowV(result));
}
{
    // <sample recover:either>
    Either<string, int> input = Left("oops");
    Either<string, int> result = input.BindLeft(e => Right<string, int>(e.Length));
    // </sample>
    Expect("recover:either", ShowE(result) == "Right(4)", ShowE(result));
}
{
    // <sample alt:option>
    Option<int> first = None;
    Option<int> result = first || Some(9);
    // </sample>
    Expect("alt:option", ShowO(result) == "Some(9)", ShowO(result));
}
{
    // <sample alt:either>
    Either<string, int> first = Left("e1");
    Either<string, int> result = first || Left<string, int>("e2");
    // </sample>
    Expect("alt:either", ShowE(result) == "Left(e2)", ShowE(result));
}
{
    // <sample alt:validation>
    Validation<string, int> first = Fail<string, int>("e1");
    Validation<string, int> result = first | Fail<string, int>("e2");
    // </sample>
    Expect("alt:validation", ShowV(result) == "Failure([e1, e2])", ShowV(result));
}
{
    // <sample alt:list>
    Seq<int> first = Seq(1, 2);
    Seq<int> result = first + Seq1(3);
    // </sample>
    Expect("alt:list", ShowS(result) == "[1, 2, 3]", ShowS(result));
}
{
    // <sample getOrElse:either>
    Either<string, int> input = Left("oops");
    int result = input.IfLeft(e => e.Length);
    // </sample>
    Expect("getOrElse:either", result == 4, result.ToString());
}
{
    // <sample getOrElse:option>
    Option<int> input = None;
    int result = input.IfNone(0);
    // </sample>
    Expect("getOrElse:option", result == 0, result.ToString());
    var calls = 0;
    Some(2).IfNone(() => { calls++; return 0; });
    Expect("getOrElse:option lazy", calls == 0, $"{calls} call(s) on Some");
}

// --- Pattern matching --------------------------------------------------------
{
    // <sample match:either>
    Either<string, int> input = Left("oops");
    string result = input.Match(
        Right: x => $"value {x}",
        Left: e => $"error {e}");
    // </sample>
    Expect("match:either", result == "error oops", result);
}
{
    // <sample match:option>
    Option<int> input = Some(2);
    string result = input.Match(
        Some: x => $"value {x}",
        None: () => "nothing");
    // </sample>
    Expect("match:option", result == "value 2", result);
}
{
    // <sample match:validation>
    Validation<string, int> input = Fail<string, int>(Seq("e1", "e2"));
    string result = input.Match(
        Succ: x => $"value {x}",
        Fail: errors => $"{errors.Count} errors");
    // </sample>
    Expect("match:validation", result == "2 errors", result);
}

// --- Filtering ---------------------------------------------------------------
{
    // <sample filter:list>
    Seq<int> input = Seq(1, 2, 3, 4);
    Seq<int> result = input.Filter(x => x % 2 == 0);
    // </sample>
    Expect("filter:list", ShowS(result) == "[2, 4]", ShowS(result));
}
{
    // <sample filter:option>
    Option<int> input = Some(3);
    Option<int> result = input.Filter(x => x > 5);
    // </sample>
    Expect("filter:option", ShowO(result) == "None", ShowO(result));
}
{
    // <sample filterMap:list>
    Seq<int> input = Seq(1, 2, 3, 4);
    Seq<int> result = input.Choose(x => x % 2 == 0 ? Some(x * 10) : None);
    // </sample>
    Expect("filterMap:list", ShowS(result) == "[20, 40]", ShowS(result));
}
{
    // <sample filterMap:option>
    Option<int> Half(int x) => x % 2 == 0 ? Some(x / 2) : None;
    Option<int> input = Some(4);
    Option<int> result = input.Bind(Half);
    // </sample>
    Expect("filterMap:option", ShowO(result) == "Some(2)", ShowO(result));
}
{
    // <sample partition:list>
    Seq<int> input = Seq(1, 2, 3, 4);
    (Seq<int>, Seq<int>) result = (input.Filter(x => x % 2 == 0), input.Filter(x => x % 2 != 0));
    // </sample>
    var (passes, fails) = result;
    Expect("partition:list", ShowS(passes) == "[2, 4]" && ShowS(fails) == "[1, 3]", $"{ShowS(passes)} {ShowS(fails)}");
}
{
    // <sample filterOrElse:either>
    Either<string, int> input = Right(3);
    Either<string, int> result = input.Bind(x =>
        x > 5 ? Right<string, int>(x) : Left<string, int>($"too small: {x}"));
    // </sample>
    Expect("filterOrElse:either", ShowE(result) == "Left(too small: 3)", ShowE(result));
    var filtered = input.Filter(x => x > 5);
    Expect("filterOrElse:either Filter is Bottom", filtered.IsBottom, filtered.IsBottom ? "Bottom" : ShowE(filtered));
}

Console.WriteLine(failures == 0 ? "ALL PASS" : $"{failures} FAILED");
return failures == 0 ? 0 : 1;
