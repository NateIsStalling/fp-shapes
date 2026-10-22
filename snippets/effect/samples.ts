// effect 4.0.5 samples shown on FP Shapes. Code between "// <sample KEY>"
// and "// </sample>" is shown on the site verbatim. Each sample ends with a
// `result`, which tests/samples.test.ts checks.
import { Array as Arr, Effect, Option, Result } from "effect";

export const effect: Record<string, () => unknown> = {
  "pure:option": () => {
    // <sample pure:option>
    const result = Option.some(2);
    // </sample>
    return result;
  },
  "pure:either": () => {
    // <sample pure:either>
    const result = Result.succeed(2);
    // </sample>
    return result;
  },
  "pure:list": () => {
    // <sample pure:list>
    const result = Arr.of(2);
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
    const result = Option.none<number>();
    // </sample>
    return result;
  },
  "fromNullable:option": () => {
    // <sample fromNullable:option>
    const ages: Record<string, number | undefined> = { ann: 31 };
    const result = Option.fromNullishOr(ages["bob"]);
    // </sample>
    return result;
  },
  "fromNullable:either": () => {
    // <sample fromNullable:either>
    const ages: Record<string, number | undefined> = { ann: 31 };
    const result = Result.fromNullishOr(ages["bob"], () => "missing");
    // </sample>
    return result;
  },
  "fromPredicate:option": () => {
    // <sample fromPredicate:option>
    const result = Option.liftPredicate((x: number) => x > 5)(3);
    // </sample>
    return result;
  },
  "fromPredicate:either": () => {
    // <sample fromPredicate:either>
    const result = Result.liftPredicate((x: number) => x > 5, (x) => `too small: ${x}`)(3);
    // </sample>
    return result;
  },
  "tryCatch:option": () => {
    // <sample tryCatch:option>
    const parse = Option.liftThrowable(JSON.parse);
    const result = parse("{");
    // </sample>
    return result;
  },
  "tryCatch:either": () => {
    // <sample tryCatch:either>
    const result = Result.try({
      try: () => JSON.parse("{"),
      catch: () => "invalid JSON",
    });
    // </sample>
    return result;
  },
  "map:either": () => {
    // <sample map:either>
    const result = Result.map(Result.succeed(2), (x) => x * 10);
    // </sample>
    return result;
  },
  "map:option": () => {
    // <sample map:option>
    const result = Option.map(Option.some(2), (x) => x * 10);
    // </sample>
    return result;
  },
  "map:list": () => {
    // <sample map:list>
    const result = Arr.map([1, 2, 3], (x) => x * 10);
    // </sample>
    return result;
  },
  "bimap:either": () => {
    // <sample bimap:either>
    const result = Result.mapBoth(Result.fail("oops"), {
      onFailure: (e) => e.length,
      onSuccess: (x: number) => x * 10,
    });
    // </sample>
    return result;
  },
  "flatMap:either": () => {
    // <sample flatMap:either>
    const half = (x: number) => (x % 2 === 0 ? Result.succeed(x / 2) : Result.fail("odd"));
    const result = Result.flatMap(Result.succeed(4), half);
    // </sample>
    return result;
  },
  "flatMap:option": () => {
    // <sample flatMap:option>
    const half = (x: number) => (x % 2 === 0 ? Option.some(x / 2) : Option.none());
    const result = Option.flatMap(Option.some(4), half);
    // </sample>
    return result;
  },
  "flatMap:list": () => {
    // <sample flatMap:list>
    const result = Arr.flatMap([1, 2, 3], (x) => [x, x]);
    // </sample>
    return result;
  },
  "flatten:option": () => {
    // <sample flatten:option>
    const result = Option.flatten(Option.some(Option.some(1)));
    // </sample>
    return result;
  },
  "flatten:list": () => {
    // <sample flatten:list>
    const result = Arr.flatten([[1, 2], [3]]);
    // </sample>
    return result;
  },
  "zip:ziplist": () => {
    // <sample zip:ziplist>
    const result = Arr.zipWith([1, 2, 3], ["a", "b"], (n, s) => `${n}${s}`);
    // </sample>
    return result;
  },
  "traverse:either:short-circuit": () => {
    // <sample traverse:either:short-circuit>
    const check = (x: number) => (x < 0 ? Effect.fail(`e${x}`) : Effect.succeed(x * 10));
    const result = Effect.runSync(Effect.result(Effect.forEach([1, -2, 3, -4], check)));
    // </sample>
    return result;
  },
  "traverse:validation:eager": () => {
    // <sample traverse:validation:eager>
    const check = (x: number) => (x < 0 ? Effect.fail(`e${x}`) : Effect.succeed(x * 10));
    const result = Effect.runSync(Effect.result(Effect.validate([1, -2, 3, -4], check)));
    // </sample>
    return result;
  },
  "mapError:either": () => {
    // <sample mapError:either>
    const result = Result.mapError(Result.fail("oops"), (e) => e.length);
    // </sample>
    return result;
  },
  "recover:either": () => {
    // <sample recover:either>
    const result = Result.orElse(Result.fail("oops"), (e) => Result.fail(e.length));
    // </sample>
    return result;
  },
  "alt:option": () => {
    // <sample alt:option>
    const result = Option.orElse(Option.none(), () => Option.some(9));
    // </sample>
    return result;
  },
  "getOrElse:either": () => {
    // <sample getOrElse:either>
    const result = Result.getOrElse(Result.fail("oops"), (e) => e.length);
    // </sample>
    return result;
  },
  "getOrElse:option": () => {
    // <sample getOrElse:option>
    const result = Option.getOrElse(Option.none(), () => 0);
    // </sample>
    return result;
  },
  "match:either": () => {
    // <sample match:either>
    const result = Result.match(Result.fail("oops"), {
      onFailure: (e) => `error ${e}`,
      onSuccess: (x: number) => `value ${x}`,
    });
    // </sample>
    return result;
  },
  "match:option": () => {
    // <sample match:option>
    const result = Option.match(Option.some(2), {
      onNone: () => "nothing",
      onSome: (x) => `value ${x}`,
    });
    // </sample>
    return result;
  },
  "filterOrElse:either": () => {
    // <sample filterOrElse:either>
    const result = Result.filterOrFail(Result.succeed(3), (x) => x > 5, (x) => `too small: ${x}`);
    // </sample>
    return result;
  },
  "filterOrElse:option": () => {
    // <sample filterOrElse:option>
    const result = Option.filter(Option.some(3), (x) => x > 5);
    // </sample>
    return result;
  },
};
