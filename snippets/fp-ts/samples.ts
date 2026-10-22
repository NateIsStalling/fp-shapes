// fp-ts 2.16.11 samples shown on FP Shapes. Code between "// <sample KEY>"
// and "// </sample>" is shown on the site verbatim. Each sample ends with a
// `result`, which tests/samples.test.ts checks.
import { sequenceT } from "fp-ts/Apply";
import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as RA from "fp-ts/ReadonlyArray";
import * as RNEA from "fp-ts/ReadonlyNonEmptyArray";
import * as TE from "fp-ts/TaskEither";

export const fpts: Record<string, () => unknown> = {
  "pure:option": () => {
    // <sample pure:option>
    const result = O.of(2);
    // </sample>
    return result;
  },
  "pure:either": () => {
    // <sample pure:either>
    const result: E.Either<string, number> = E.of(2);
    // </sample>
    return result;
  },
  "pure:validation": () => {
    // <sample pure:validation>
    // fp-ts Validation is an Either whose errors accumulate
    // through E.getApplicativeValidation.
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
    const result: E.Either<string, number> = E.left("oops");
    // </sample>
    return result;
  },
  "fail:option": () => {
    // <sample fail:option>
    const result: O.Option<number> = O.none;
    // </sample>
    return result;
  },
  "fail:validation": () => {
    // <sample fail:validation>
    const result: E.Either<RNEA.ReadonlyNonEmptyArray<string>, number> = E.left(["oops"]);
    // </sample>
    return result;
  },
  "fromNullable:option": () => {
    // <sample fromNullable:option>
    const ages: Record<string, number | undefined> = { ann: 31 };
    const result = O.fromNullable(ages["bob"]);
    // </sample>
    return result;
  },
  "fromNullable:either": () => {
    // <sample fromNullable:either>
    const ages: Record<string, number | undefined> = { ann: 31 };
    const result = pipe(ages["bob"], E.fromNullable("missing"));
    // </sample>
    return result;
  },
  "fromPredicate:option": () => {
    // <sample fromPredicate:option>
    const result = pipe(3, O.fromPredicate((x: number) => x > 5));
    // </sample>
    return result;
  },
  "fromPredicate:either": () => {
    // <sample fromPredicate:either>
    const result = pipe(3, E.fromPredicate((x: number) => x > 5, (x) => `too small: ${x}`));
    // </sample>
    return result;
  },
  "tryCatch:option": () => {
    // <sample tryCatch:option>
    const result = O.tryCatch(() => JSON.parse("{"));
    // </sample>
    return result;
  },
  "tryCatch:either": () => {
    // <sample tryCatch:either>
    const result = E.tryCatch(() => JSON.parse("{"), () => "invalid JSON");
    // </sample>
    return result;
  },
  "map:either": () => {
    // <sample map:either>
    const input: E.Either<string, number> = E.right(2);
    const result = pipe(input, E.map((x) => x * 10));
    // </sample>
    return result;
  },
  "map:option": () => {
    // <sample map:option>
    const result = pipe(O.some(2), O.map((x) => x * 10));
    // </sample>
    return result;
  },
  "map:list": () => {
    // <sample map:list>
    const result = pipe([1, 2, 3], RA.map((x) => x * 10));
    // </sample>
    return result;
  },
  "bimap:either": () => {
    // <sample bimap:either>
    const input: E.Either<string, number> = E.left("oops");
    const result = pipe(input, E.bimap((e) => e.length, (x) => x * 10));
    // </sample>
    return result;
  },
  "flatMap:either": () => {
    // <sample flatMap:either>
    const half = (x: number): E.Either<string, number> => (x % 2 === 0 ? E.right(x / 2) : E.left("odd"));
    const result = pipe(E.right(4), E.flatMap(half));
    // </sample>
    return result;
  },
  "flatMap:option": () => {
    // <sample flatMap:option>
    const half = (x: number): O.Option<number> => (x % 2 === 0 ? O.some(x / 2) : O.none);
    const result = pipe(O.some(4), O.flatMap(half));
    // </sample>
    return result;
  },
  "flatMap:list": () => {
    // <sample flatMap:list>
    const result = pipe([1, 2, 3], RA.flatMap((x) => [x, x]));
    // </sample>
    return result;
  },
  "flatten:either": () => {
    // <sample flatten:either>
    const result = E.flatten(E.right(E.right(1)));
    // </sample>
    return result;
  },
  "flatten:option": () => {
    // <sample flatten:option>
    const result = O.flatten(O.some(O.some(1)));
    // </sample>
    return result;
  },
  "flatten:list": () => {
    // <sample flatten:list>
    const result = RA.flatten([[1, 2], [3]]);
    // </sample>
    return result;
  },
  "tap:either": () => {
    // <sample tap:either>
    const audit = (x: number): E.Either<string, void> => (x > 0 ? E.right(undefined) : E.left("audit failed"));
    const result = pipe(E.right(2), E.tap(audit));
    // </sample>
    return result;
  },
  "tap:option": () => {
    // <sample tap:option>
    const result = pipe(O.some(2), O.tap(() => O.none));
    // </sample>
    return result;
  },
  "zip:either": () => {
    // <sample zip:either>
    const result = sequenceT(E.Apply)(E.left("e1"), E.left("e2"));
    // </sample>
    return result;
  },
  "zip:validation": () => {
    // <sample zip:validation>
    const V = E.getApplicativeValidation(RNEA.getSemigroup<string>());
    const result = sequenceT(V)(E.left(["e1"]), E.left(["e2"]));
    // </sample>
    return result;
  },
  "zip:list": () => {
    // <sample zip:list>
    const result = sequenceT(RA.Apply)([1, 2, 3], ["a", "b"]);
    // </sample>
    return result;
  },
  "zip:ziplist": () => {
    // <sample zip:ziplist>
    const result = RA.zipWith([1, 2, 3], ["a", "b"], (n, s) => `${n}${s}`);
    // </sample>
    return result;
  },
  "traverse:either:short-circuit": () => {
    // <sample traverse:either:short-circuit>
    const check = (x: number): E.Either<string, number> => (x < 0 ? E.left(`e${x}`) : E.right(x * 10));
    const result = pipe([1, -2, 3, -4], E.traverseArray(check));
    // </sample>
    return result;
  },
  "traverse:either:eager": async () => {
    // <sample traverse:either:eager>
    const load = (x: number): TE.TaskEither<string, number> => (x < 0 ? TE.left(`e${x}`) : TE.right(x * 10));
    const result = await pipe([1, -2, 3, -4], TE.traverseArray(load))();
    // </sample>
    return result;
  },
  "traverse:option:short-circuit": () => {
    // <sample traverse:option:short-circuit>
    const check = (x: number): O.Option<number> => (x < 0 ? O.none : O.some(x * 10));
    const result = pipe([1, -2, 3], O.traverseArray(check));
    // </sample>
    return result;
  },
  "traverse:validation:eager": () => {
    // <sample traverse:validation:eager>
    const V = E.getApplicativeValidation(RNEA.getSemigroup<string>());
    const check = (x: number): E.Either<RNEA.ReadonlyNonEmptyArray<string>, number> => (x < 0 ? E.left([`e${x}`]) : E.right(x * 10));
    const result = pipe([1, -2, 3, -4], RA.traverse(V)(check));
    // </sample>
    return result;
  },
  "sequence:either:short-circuit": () => {
    // <sample sequence:either:short-circuit>
    const result = E.sequenceArray([E.right(1), E.left("e2"), E.left("e3")]);
    // </sample>
    return result;
  },
  "mapError:either": () => {
    // <sample mapError:either>
    const input: E.Either<string, number> = E.left("oops");
    const result = pipe(input, E.mapLeft((e) => e.length));
    // </sample>
    return result;
  },
  "recover:either": () => {
    // <sample recover:either>
    const input: E.Either<string, number> = E.left("oops");
    const result = pipe(input, E.orElse((e) => E.left(e.length)));
    // </sample>
    return result;
  },
  "alt:option": () => {
    // <sample alt:option>
    const result = pipe(O.none, O.alt(() => O.some(9)));
    // </sample>
    return result;
  },
  "alt:either": () => {
    // <sample alt:either>
    const input: E.Either<string, number> = E.left("e1");
    const result = pipe(input, E.alt(() => E.right(9)));
    // </sample>
    return result;
  },
  "alt:validation": () => {
    // <sample alt:validation>
    const V = E.getAltValidation(RNEA.getSemigroup<string>());
    const first: E.Either<RNEA.ReadonlyNonEmptyArray<string>, number> = E.left(["e1"]);
    const result = V.alt(first, () => E.left(["e2"]));
    // </sample>
    return result;
  },
  "alt:list": () => {
    // <sample alt:list>
    const result = pipe([1, 2], RA.alt(() => [3]));
    // </sample>
    return result;
  },
  "getOrElse:either": () => {
    // <sample getOrElse:either>
    const input: E.Either<string, number> = E.left("oops");
    const result = pipe(input, E.getOrElse((e) => e.length));
    // </sample>
    return result;
  },
  "getOrElse:option": () => {
    // <sample getOrElse:option>
    const result = pipe(O.none, O.getOrElse(() => 0));
    // </sample>
    return result;
  },
  "match:either": () => {
    // <sample match:either>
    const input: E.Either<string, number> = E.left("oops");
    const result = pipe(input, E.match((e) => `error ${e}`, (x) => `value ${x}`));
    // </sample>
    return result;
  },
  "match:option": () => {
    // <sample match:option>
    const result = pipe(O.some(2), O.match(() => "nothing", (x) => `value ${x}`));
    // </sample>
    return result;
  },
  "filterOrElse:either": () => {
    // <sample filterOrElse:either>
    const result = pipe(E.right(3), E.filterOrElse((x) => x > 5, (x) => `too small: ${x}`));
    // </sample>
    return result;
  },
  "filter:list": () => {
    // <sample filter:list>
    const result = pipe([1, 2, 3, 4], RA.filter((x) => x % 2 === 0));
    // </sample>
    return result;
  },
  "filterMap:list": () => {
    // <sample filterMap:list>
    const result = pipe([1, 2, 3, 4], RA.filterMap((x) => (x % 2 === 0 ? O.some(x * 10) : O.none)));
    // </sample>
    return result;
  },
  "filterMap:option": () => {
    // <sample filterMap:option>
    const half = (x: number) => (x % 2 === 0 ? O.some(x / 2) : O.none);
    const result = pipe(O.some(4), O.filterMap(half));
    // </sample>
    return result;
  },
  "partition:list": () => {
    // <sample partition:list>
    const { left: fails, right: passes } = pipe([1, 2, 3, 4], RA.partition((x) => x % 2 === 0));
    const result = [passes, fails];
    // </sample>
    return result;
  },
  "filter:option": () => {
    // <sample filter:option>
    const result = pipe(O.some(3), O.filter((x) => x > 5));
    // </sample>
    return result;
  },
};
