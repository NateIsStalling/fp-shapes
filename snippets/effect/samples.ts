// effect 4.0.5 samples shown on FP Shapes. Code between "// <sample KEY>"
// and "// </sample>" is shown on the site verbatim. Each sample ends with a
// `result`, which tests/samples.test.ts checks. Samples follow the page
// scenarios in the conventions: same values in every ecosystem, data-first.
import { Array, Effect, Filter, identity, Iterable, Option, Result, Tuple } from "effect";

export const effect: Record<string, () => unknown> = {
  "pure:either": () => {
    // <sample pure:either>
    const result = Result.succeed(2);
    // </sample>
    return result;
  },
  "pure:option": () => {
    // <sample pure:option>
    const result = Option.some(2);
    // </sample>
    return result;
  },
  "pure:list": () => {
    // <sample pure:list>
    const result = Array.of(2);
    // </sample>
    return result;
  },
  "fail:either": () => {
    // <sample fail:either>
    const result = Result.fail("oops");
    // </sample>
    return result;
  },
  "fail:option": () => {
    // <sample fail:option>
    const result = Option.none();
    // </sample>
    return result;
  },
  "fail:list": () => {
    // <sample fail:list>
    const result = Array.empty();
    // </sample>
    return result;
  },
  "fromNullable:either": () => {
    // <sample fromNullable:either>
    const ages: Record<string, number> = { ada: 36 };
    const result = Result.fromNullishOr(ages["bob"], () => "missing");
    // </sample>
    return result;
  },
  "fromNullable:option": () => {
    // <sample fromNullable:option>
    const ages: Record<string, number> = { ada: 36 };
    const result = Option.fromNullishOr(ages["bob"]);
    // </sample>
    return result;
  },
  "fromNullable:list": () => {
    // <sample fromNullable:list>
    const ages: Record<string, number> = { ada: 36 };
    const result = Array.fromNullishOr(ages["bob"]);
    // </sample>
    return result;
  },
  "fromPredicate:either": () => {
    // <sample fromPredicate:either>
    const result = Result.liftPredicate(3, (x) => x > 5, (x) => `too small: ${x}`);
    // </sample>
    return result;
  },
  "fromPredicate:option": () => {
    // <sample fromPredicate:option>
    const result = Option.liftPredicate(3, (x) => x > 5);
    // </sample>
    return result;
  },
  "fromPredicate:list": () => {
    // <sample fromPredicate:list>
    const result = Array.liftPredicate((x: number) => x > 5)(3);
    // </sample>
    return result;
  },
  "tryCatch:either": () => {
    // <sample tryCatch:either>
    const result = Result.try({ try: () => JSON.parse("x"), catch: () => "invalid input" });
    // </sample>
    return result;
  },
  "tryCatch:option": () => {
    // <sample tryCatch:option>
    const parse = Option.liftThrowable(JSON.parse);
    const result = parse("x");
    // </sample>
    return result;
  },
  "map:either": () => {
    // <sample map:either>
    const input = Result.succeed(2);
    const result = Result.map(input, (x) => x * 10);
    // </sample>
    return result;
  },
  "map:option": () => {
    // <sample map:option>
    const input = Option.some(2);
    const result = Option.map(input, (x) => x * 10);
    // </sample>
    return result;
  },
  "map:list": () => {
    // <sample map:list>
    const input = [1, 2, 3];
    const result = Array.map(input, (x) => x * 10);
    // </sample>
    return result;
  },
  "bimap:either": () => {
    // <sample bimap:either>
    const input = Result.fail("oops");
    const result = Result.mapBoth(input, { onFailure: (e) => e.length, onSuccess: (x) => x * 10 });
    // </sample>
    return result;
  },
  "bimap:tuple": () => {
    // <sample bimap:tuple>
    const input: [string, number] = ["oops", 2];
    const result = Tuple.evolve(input, [(e) => e.length, (x) => x * 10]);
    // </sample>
    return result;
  },
  "flatMap:either": () => {
    // <sample flatMap:either>
    const half = (x: number) => (x % 2 === 0 ? Result.succeed(x / 2) : Result.fail("odd"));
    const input = Result.succeed(4);
    const result = Result.flatMap(input, half);
    // </sample>
    return result;
  },
  "flatMap:option": () => {
    // <sample flatMap:option>
    const half = (x: number) => (x % 2 === 0 ? Option.some(x / 2) : Option.none());
    const input = Option.some(4);
    const result = Option.flatMap(input, half);
    // </sample>
    return result;
  },
  "flatMap:list": () => {
    // <sample flatMap:list>
    const input = [1, 2, 3];
    const result = Array.flatMap(input, (x) => [x, x]);
    // </sample>
    return result;
  },
  "flatten:either": () => {
    // <sample flatten:either>
    const input = Result.succeed(Result.succeed(1));
    const result = Result.flatMap(input, identity);
    // </sample>
    return result;
  },
  "flatten:option": () => {
    // <sample flatten:option>
    const input = Option.some(Option.some(1));
    const result = Option.flatten(input);
    // </sample>
    return result;
  },
  "flatten:list": () => {
    // <sample flatten:list>
    const input = [[1, 2], [3]];
    const result = Array.flatten(input);
    // </sample>
    return result;
  },
  "tap:either": () => {
    // <sample tap:either>
    const audit = (x: number) => (x > 0 ? Result.succeed(undefined) : Result.fail("audit failed"));
    const input = Result.succeed(2);
    const result = Result.flatMap(input, (x) => Result.map(audit(x), () => x));
    // </sample>
    return result;
  },
  "tap:option": () => {
    // <sample tap:option>
    const audit = (x: number) => (x > 0 ? Option.some(undefined) : Option.none());
    const input = Option.some(2);
    const result = Option.tap(input, audit);
    // </sample>
    return result;
  },
  "peek:either": () => {
    // <sample peek:either>
    const seen: number[] = [];
    const input = Result.succeed(2);
    const result = Result.tap(input, (x) => {
      seen.push(x);
    });
    // </sample>
    return result;
  },
  "zip:either": () => {
    // <sample zip:either>
    const a = Result.fail("e1");
    const b = Result.fail("e2");
    const result = Result.map(Result.all([a, b]), ([x, y]) => x + y);
    // </sample>
    return result;
  },
  "zip:list": () => {
    // <sample zip:list>
    const a = [1, 2, 3];
    const b = ["a", "b"];
    const result = Array.cartesianWith(a, b, (n, s) => `${n}${s}`);
    // </sample>
    return result;
  },
  "zip:ziplist": () => {
    // <sample zip:ziplist>
    const a = [1, 2, 3];
    const b = ["a", "b"];
    const result = Array.zipWith(a, b, (n, s) => `${n}${s}`);
    // </sample>
    return result;
  },
  "traverse:either:short-circuit": () => {
    // <sample traverse:either:short-circuit>
    const check = (x: number) => (x < 0 ? Result.fail(`e${x}`) : Result.succeed(x * 10));
    const input = [1, -2, 3, -4];
    const result = Result.all(Iterable.map(input, check));
    // </sample>
    return result;
  },
  "traverse:either:eager": () => {
    // <sample traverse:either:eager>
    const check = (x: number) => (x < 0 ? Result.fail(`e${x}`) : Result.succeed(x * 10));
    const input = [1, -2, 3, -4];
    const result = Result.all(Array.map(input, check));
    // </sample>
    return result;
  },
  "traverse:option:short-circuit": () => {
    // <sample traverse:option:short-circuit>
    const check = (x: number) => (x < 0 ? Option.none() : Option.some(x * 10));
    const input = [1, -2, 3, -4];
    const result = Option.all(Iterable.map(input, check));
    // </sample>
    return result;
  },
  "traverse:option:eager": () => {
    // <sample traverse:option:eager>
    const check = (x: number) => (x < 0 ? Option.none() : Option.some(x * 10));
    const input = [1, -2, 3, -4];
    const result = Option.all(Array.map(input, check));
    // </sample>
    return result;
  },
  "traverse:validation:eager": () => {
    // <sample traverse:validation:eager>
    const check = (x: number) => (x < 0 ? Effect.fail(`e${x}`) : Effect.succeed(x * 10));
    const input = [1, -2, 3, -4];
    const result = Effect.runSync(Effect.result(Effect.validate(input, check)));
    // </sample>
    return result;
  },
  "sequence:either:short-circuit": () => {
    // <sample sequence:either:short-circuit>
    const input = [Result.succeed(1), Result.fail("e2"), Result.succeed(3), Result.fail("e4")];
    const result = Result.all(input);
    // </sample>
    return result;
  },
  "sequence:option:short-circuit": () => {
    // <sample sequence:option:short-circuit>
    const input = [Option.some(1), Option.none(), Option.some(3), Option.none()];
    const result = Option.all(input);
    // </sample>
    return result;
  },
  "mapError:either": () => {
    // <sample mapError:either>
    const input = Result.fail("oops");
    const result = Result.mapError(input, (e) => e.length);
    // </sample>
    return result;
  },
  "recover:either": () => {
    // <sample recover:either>
    const input = Result.fail("oops");
    const result = Result.orElse(input, (e) => Result.succeed(e.length));
    // </sample>
    return result;
  },
  "alt:option": () => {
    // <sample alt:option>
    const first = Option.none();
    const result = Option.orElse(first, () => Option.some(9));
    // </sample>
    return result;
  },
  "alt:either": () => {
    // <sample alt:either>
    const first = Result.fail("e1");
    const result = Result.orElse(first, () => Result.fail("e2"));
    // </sample>
    return result;
  },
  "alt:list": () => {
    // <sample alt:list>
    const first = [1, 2];
    const result = Array.appendAll(first, [3]);
    // </sample>
    return result;
  },
  "getOrElse:either": () => {
    // <sample getOrElse:either>
    const input = Result.fail("oops");
    const result = Result.getOrElse(input, (e) => e.length);
    // </sample>
    return result;
  },
  "getOrElse:option": () => {
    // <sample getOrElse:option>
    const input = Option.none();
    const result = Option.getOrElse(input, () => 0);
    // </sample>
    return result;
  },
  "match:either": () => {
    // <sample match:either>
    const input = Result.fail("oops");
    const result = Result.match(input, { onFailure: (e) => `error ${e}`, onSuccess: (x) => `value ${x}` });
    // </sample>
    return result;
  },
  "match:option": () => {
    // <sample match:option>
    const input = Option.some(2);
    const result = Option.match(input, { onNone: () => "nothing", onSome: (x) => `value ${x}` });
    // </sample>
    return result;
  },
  "filter:list": () => {
    // <sample filter:list>
    const input = [1, 2, 3, 4];
    const result = Array.filter(input, (x) => x % 2 === 0);
    // </sample>
    return result;
  },
  "filter:option": () => {
    // <sample filter:option>
    const input = Option.some(3);
    const result = Option.filter(input, (x) => x > 5);
    // </sample>
    return result;
  },
  "filterMap:list": () => {
    // <sample filterMap:list>
    const input = [1, 2, 3, 4];
    const result = Array.filterMap(input, Filter.fromPredicateOption((x: number) => (x % 2 === 0 ? Option.some(x * 10) : Option.none())));
    // </sample>
    return result;
  },
  "filterMap:option": () => {
    // <sample filterMap:option>
    const half = (x: number) => (x % 2 === 0 ? Option.some(x / 2) : Option.none());
    const input = Option.some(4);
    const result = Option.filterMap(input, Filter.fromPredicateOption(half));
    // </sample>
    return result;
  },
  "partition:list": () => {
    // <sample partition:list>
    const input = [1, 2, 3, 4];
    const result = Array.partition(input, Filter.fromPredicate((x: number) => x % 2 === 0));
    // </sample>
    return result;
  },
  "filterOrElse:either": () => {
    // <sample filterOrElse:either>
    const input = Result.succeed(3);
    const result = Result.filterOrFail(input, (x) => x > 5, (x) => `too small: ${x}`);
    // </sample>
    return result;
  },
};
