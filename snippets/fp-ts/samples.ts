// fp-ts 2.16.11 samples shown on FP Shapes. Code between "// <sample KEY>"
// and "// </sample>" is shown on the site verbatim. Each sample ends with a
// `result`, which tests/samples.test.ts checks. Samples follow the page
// scenarios in the conventions: same values in every ecosystem, pipe style.
import { sequenceT } from "fp-ts/Apply";
import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as RA from "fp-ts/ReadonlyArray";
import * as RNEA from "fp-ts/ReadonlyNonEmptyArray";
import * as T from "fp-ts/Tuple";

export const fpts: Record<string, () => unknown> = {
  "pure:either": () => {
    // <sample pure:either>
    const result = E.of(2);
    // </sample>
    return result;
  },
  "pure:option": () => {
    // <sample pure:option>
    const result = O.of(2);
    // </sample>
    return result;
  },
  "pure:validation": () => {
    // <sample pure:validation>
    const result: E.Either<RNEA.ReadonlyNonEmptyArray<string>, number> = E.of(2);
    // </sample>
    return result;
  },
  "pure:list": () => {
    // <sample pure:list>
    const result = RA.of(2);
    // </sample>
    return result;
  },
  "fail:either": () => {
    // <sample fail:either>
    const result = E.left("oops");
    // </sample>
    return result;
  },
  "fail:option": () => {
    // <sample fail:option>
    const result = O.none;
    // </sample>
    return result;
  },
  "fail:validation": () => {
    // <sample fail:validation>
    const result = E.left(RNEA.of("oops"));
    // </sample>
    return result;
  },
  "fail:list": () => {
    // <sample fail:list>
    const result = RA.empty;
    // </sample>
    return result;
  },
  "fromNullable:either": () => {
    // <sample fromNullable:either>
    const ages: Record<string, number> = { ada: 36 };
    const result = pipe(ages["bob"], E.fromNullable("missing"));
    // </sample>
    return result;
  },
  "fromNullable:option": () => {
    // <sample fromNullable:option>
    const ages: Record<string, number> = { ada: 36 };
    const result = O.fromNullable(ages["bob"]);
    // </sample>
    return result;
  },
  "fromNullable:validation": () => {
    // <sample fromNullable:validation>
    const ages: Record<string, number> = { ada: 36 };
    const result = pipe(ages["bob"], E.fromNullable(RNEA.of("missing")));
    // </sample>
    return result;
  },
  "fromNullable:list": () => {
    // <sample fromNullable:list>
    const ages: Record<string, number> = { ada: 36 };
    const result = RA.fromOption(O.fromNullable(ages["bob"]));
    // </sample>
    return result;
  },
  "fromPredicate:either": () => {
    // <sample fromPredicate:either>
    const result = pipe(3, E.fromPredicate((x: number) => x > 5, (x) => `too small: ${x}`));
    // </sample>
    return result;
  },
  "fromPredicate:option": () => {
    // <sample fromPredicate:option>
    const result = pipe(3, O.fromPredicate((x: number) => x > 5));
    // </sample>
    return result;
  },
  "fromPredicate:validation": () => {
    // <sample fromPredicate:validation>
    const result = pipe(3, E.fromPredicate((x: number) => x > 5, (x) => RNEA.of(`too small: ${x}`)));
    // </sample>
    return result;
  },
  "fromPredicate:list": () => {
    // <sample fromPredicate:list>
    const result = pipe(3, RA.fromPredicate((x: number) => x > 5));
    // </sample>
    return result;
  },
  "tryCatch:either": () => {
    // <sample tryCatch:either>
    const result = E.tryCatch(() => JSON.parse("x"), () => "invalid input");
    // </sample>
    return result;
  },
  "tryCatch:option": () => {
    // <sample tryCatch:option>
    const result = O.tryCatch(() => JSON.parse("x"));
    // </sample>
    return result;
  },
  "tryCatch:validation": () => {
    // <sample tryCatch:validation>
    const result = E.tryCatch(() => JSON.parse("x"), () => RNEA.of("invalid input"));
    // </sample>
    return result;
  },
  "map:either": () => {
    // <sample map:either>
    const input = E.right(2);
    const result = pipe(input, E.map((x) => x * 10));
    // </sample>
    return result;
  },
  "map:option": () => {
    // <sample map:option>
    const input = O.some(2);
    const result = pipe(input, O.map((x) => x * 10));
    // </sample>
    return result;
  },
  "map:list": () => {
    // <sample map:list>
    const input = [1, 2, 3];
    const result = pipe(input, RA.map((x) => x * 10));
    // </sample>
    return result;
  },
  "bimap:either": () => {
    // <sample bimap:either>
    const input = E.left("oops");
    const result = pipe(input, E.bimap((e) => e.length, (x) => x * 10));
    // </sample>
    return result;
  },
  "bimap:tuple": () => {
    // <sample bimap:tuple>
    const input: [string, number] = ["oops", 2];
    const result = pipe(input, T.bimap((x) => x * 10, (e) => e.length));
    // </sample>
    return result;
  },
  "flatMap:either": () => {
    // <sample flatMap:either>
    const half = (x: number) => (x % 2 === 0 ? E.right(x / 2) : E.left("odd"));
    const input = E.right(4);
    const result = pipe(input, E.flatMap(half));
    // </sample>
    return result;
  },
  "flatMap:option": () => {
    // <sample flatMap:option>
    const half = (x: number) => (x % 2 === 0 ? O.some(x / 2) : O.none);
    const input = O.some(4);
    const result = pipe(input, O.flatMap(half));
    // </sample>
    return result;
  },
  "flatMap:list": () => {
    // <sample flatMap:list>
    const input = [1, 2, 3];
    const result = pipe(input, RA.flatMap((x) => [x, x]));
    // </sample>
    return result;
  },
  "flatten:either": () => {
    // <sample flatten:either>
    const input = E.right(E.right(1));
    const result = pipe(input, E.flatten);
    // </sample>
    return result;
  },
  "flatten:option": () => {
    // <sample flatten:option>
    const input = O.some(O.some(1));
    const result = pipe(input, O.flatten);
    // </sample>
    return result;
  },
  "flatten:list": () => {
    // <sample flatten:list>
    const input = [[1, 2], [3]];
    const result = pipe(input, RA.flatten);
    // </sample>
    return result;
  },
  "tap:either": () => {
    // <sample tap:either>
    const audit = (x: number) => (x > 0 ? E.right(undefined) : E.left("audit failed"));
    const input = E.right(2);
    const result = pipe(input, E.tap(audit));
    // </sample>
    return result;
  },
  "tap:option": () => {
    // <sample tap:option>
    const audit = (x: number) => (x > 0 ? O.some(undefined) : O.none);
    const input = O.some(2);
    const result = pipe(input, O.tap(audit));
    // </sample>
    return result;
  },
  "zip:either": () => {
    // <sample zip:either>
    const a = E.left("e1");
    const b = E.left("e2");
    const result = pipe(sequenceT(E.Apply)(a, b), E.map(([x, y]) => x + y));
    // </sample>
    return result;
  },
  "zip:validation": () => {
    // <sample zip:validation>
    const V = E.getApplicativeValidation(RNEA.getSemigroup<string>());
    const a = E.left(RNEA.of("e1"));
    const b = E.left(RNEA.of("e2"));
    const result = pipe(sequenceT(V)(a, b), E.map(([x, y]) => x + y));
    // </sample>
    return result;
  },
  "zip:list": () => {
    // <sample zip:list>
    const a = [1, 2, 3];
    const b = ["a", "b"];
    const result = pipe(sequenceT(RA.Apply)(a, b), RA.map(([n, s]) => `${n}${s}`));
    // </sample>
    return result;
  },
  "zip:ziplist": () => {
    // <sample zip:ziplist>
    const a = [1, 2, 3];
    const b = ["a", "b"];
    const result = RA.zipWith(a, b, (n, s) => `${n}${s}`);
    // </sample>
    return result;
  },
  "traverse:either:short-circuit": () => {
    // <sample traverse:either:short-circuit>
    const check = (x: number) => (x < 0 ? E.left(`e${x}`) : E.right(x * 10));
    const input = [1, -2, 3, -4];
    const result = pipe(input, E.traverseArray(check));
    // </sample>
    return result;
  },
  "traverse:either:eager": () => {
    // <sample traverse:either:eager>
    const check = (x: number) => (x < 0 ? E.left(`e${x}`) : E.right(x * 10));
    const input = [1, -2, 3, -4];
    const result = pipe(input, RA.traverse(E.Applicative)(check));
    // </sample>
    return result;
  },
  "traverse:option:short-circuit": () => {
    // <sample traverse:option:short-circuit>
    const check = (x: number) => (x < 0 ? O.none : O.some(x * 10));
    const input = [1, -2, 3, -4];
    const result = pipe(input, O.traverseArray(check));
    // </sample>
    return result;
  },
  "traverse:option:eager": () => {
    // <sample traverse:option:eager>
    const check = (x: number) => (x < 0 ? O.none : O.some(x * 10));
    const input = [1, -2, 3, -4];
    const result = pipe(input, RA.traverse(O.Applicative)(check));
    // </sample>
    return result;
  },
  "traverse:validation:eager": () => {
    // <sample traverse:validation:eager>
    const V = E.getApplicativeValidation(RNEA.getSemigroup<string>());
    const check = (x: number) => (x < 0 ? E.left(RNEA.of(`e${x}`)) : E.right(x * 10));
    const input = [1, -2, 3, -4];
    const result = pipe(input, RA.traverse(V)(check));
    // </sample>
    return result;
  },
  "sequence:either:short-circuit": () => {
    // <sample sequence:either:short-circuit>
    const input = [E.right(1), E.left("e2"), E.right(3), E.left("e4")];
    const result = pipe(input, E.sequenceArray);
    // </sample>
    return result;
  },
  "sequence:either:eager": () => {
    // <sample sequence:either:eager>
    const input = [E.right(1), E.left("e2"), E.right(3), E.left("e4")];
    const result = pipe(input, RA.sequence(E.Applicative));
    // </sample>
    return result;
  },
  "sequence:option:short-circuit": () => {
    // <sample sequence:option:short-circuit>
    const input = [O.some(1), O.none, O.some(3), O.none];
    const result = pipe(input, O.sequenceArray);
    // </sample>
    return result;
  },
  "sequence:option:eager": () => {
    // <sample sequence:option:eager>
    const input = [O.some(1), O.none, O.some(3), O.none];
    const result = pipe(input, RA.sequence(O.Applicative));
    // </sample>
    return result;
  },
  "sequence:validation:eager": () => {
    // <sample sequence:validation:eager>
    const V = E.getApplicativeValidation(RNEA.getSemigroup<string>());
    const input = [E.right(1), E.left(RNEA.of("e2")), E.right(3), E.left(RNEA.of("e4"))];
    const result = pipe(input, RA.sequence(V));
    // </sample>
    return result;
  },
  "mapError:either": () => {
    // <sample mapError:either>
    const input = E.left("oops");
    const result = pipe(input, E.mapLeft((e) => e.length));
    // </sample>
    return result;
  },
  "mapError:validation": () => {
    // <sample mapError:validation>
    const input: E.Either<RNEA.ReadonlyNonEmptyArray<string>, number> = E.left(["e1", "e2"]);
    const result = pipe(input, E.mapLeft(RNEA.map((e) => e.toUpperCase())));
    // </sample>
    return result;
  },
  "recover:either": () => {
    // <sample recover:either>
    const input = E.left("oops");
    const result = pipe(input, E.orElse((e) => E.right(e.length)));
    // </sample>
    return result;
  },
  "alt:option": () => {
    // <sample alt:option>
    const first = O.none;
    const result = pipe(first, O.orElse(() => O.some(9)));
    // </sample>
    return result;
  },
  "alt:either": () => {
    // <sample alt:either>
    const first = E.left("e1");
    const result = pipe(first, E.alt(() => E.left("e2")));
    // </sample>
    return result;
  },
  "alt:validation": () => {
    // <sample alt:validation>
    const A = E.getAltValidation(RNEA.getSemigroup<string>());
    const first = E.left(RNEA.of("e1"));
    const result = A.alt(first, () => E.left(RNEA.of("e2")));
    // </sample>
    return result;
  },
  "alt:list": () => {
    // <sample alt:list>
    const first = [1, 2];
    const result = pipe(first, RA.alt(() => [3]));
    // </sample>
    return result;
  },
  "getOrElse:either": () => {
    // <sample getOrElse:either>
    const input = E.left("oops");
    const result = pipe(input, E.getOrElse((e) => e.length));
    // </sample>
    return result;
  },
  "getOrElse:option": () => {
    // <sample getOrElse:option>
    const input = O.none;
    const result = pipe(input, O.getOrElse(() => 0));
    // </sample>
    return result;
  },
  "match:either": () => {
    // <sample match:either>
    const input = E.left("oops");
    const result = pipe(input, E.match((e) => `error ${e}`, (x) => `value ${x}`));
    // </sample>
    return result;
  },
  "match:option": () => {
    // <sample match:option>
    const input = O.some(2);
    const result = pipe(input, O.match(() => "nothing", (x) => `value ${x}`));
    // </sample>
    return result;
  },
  "match:validation": () => {
    // <sample match:validation>
    const input: E.Either<RNEA.ReadonlyNonEmptyArray<string>, number> = E.left(["e1", "e2"]);
    const result = pipe(input, E.match((es) => `${es.length} errors`, (x) => `value ${x}`));
    // </sample>
    return result;
  },
  "filter:list": () => {
    // <sample filter:list>
    const input = [1, 2, 3, 4];
    const result = pipe(input, RA.filter((x) => x % 2 === 0));
    // </sample>
    return result;
  },
  "filter:option": () => {
    // <sample filter:option>
    const input = O.some(3);
    const result = pipe(input, O.filter((x) => x > 5));
    // </sample>
    return result;
  },
  "filterMap:list": () => {
    // <sample filterMap:list>
    const input = [1, 2, 3, 4];
    const result = pipe(input, RA.filterMap((x) => (x % 2 === 0 ? O.some(x * 10) : O.none)));
    // </sample>
    return result;
  },
  "filterMap:option": () => {
    // <sample filterMap:option>
    const half = (x: number) => (x % 2 === 0 ? O.some(x / 2) : O.none);
    const input = O.some(4);
    const result = pipe(input, O.filterMap(half));
    // </sample>
    return result;
  },
  "partition:list": () => {
    // <sample partition:list>
    const input = [1, 2, 3, 4];
    const { left: fails, right: passes } = pipe(input, RA.partition((x) => x % 2 === 0));
    const result = [passes, fails];
    // </sample>
    return result;
  },
  "filterOrElse:either": () => {
    // <sample filterOrElse:either>
    const input = E.right(3);
    const result = pipe(input, E.filterOrElse((x) => x > 5, (x) => `too small: ${x}`));
    // </sample>
    return result;
  },
};
