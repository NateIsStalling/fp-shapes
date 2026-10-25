import { Array as Arr, Option as EO, Result, Tuple } from "effect";
import { sequenceT } from "fp-ts/Apply";
import * as T from "fp-ts/Tuple";
import * as Effect4 from "effect";
import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import * as RA from "fp-ts/ReadonlyArray";
import * as RNEA from "fp-ts/ReadonlyNonEmptyArray";
import { describe, expect, it } from "vitest";
import {
  altEither,
  altList,
  altOption,
  altValidation,
  bimapEither,
  bimapTuple,
  failure,
  filterOption,
  filterOrElseEither,
  flatMapEither,
  flatMapList,
  flatMapOption,
  flattenEither,
  flattenList,
  flattenOption,
  getOrElseEitherWith,
  getOrElseOptionWith,
  left,
  mapEither,
  mapErrorEither,
  mapList,
  mapOption,
  matchEither,
  matchOption,
  none,
  recoverEither,
  right,
  sequenceEither,
  some,
  success,
  tapEither,
  tapOption,
  zipWithEither,
  zipWithListCartesian,
  zipWithListPositional,
  zipWithOption,
  zipWithValidation,
  type Either,
  type Option,
} from "../../src/semantics";

// Conformance for the remaining Tier 1 operations: results, and for lazy or
// one-sided operations, which callbacks actually ran.

// fp-ts <-> reference
const fromE = <L, R>(e: E.Either<L, R>): Either<L, R> => (E.isLeft(e) ? left(e.left) : right(e.right));
const fromO = <A>(o: O.Option<A>): Option<A> => (O.isNone(o) ? none : some(o.value));
const toE = <L, R>(e: Either<L, R>): E.Either<L, R> => (e.tag === "left" ? E.left(e.error) : E.right(e.value));
const toO = <A>(o: Option<A>): O.Option<A> => (o.tag === "none" ? O.none : O.some(o.value));
// effect <-> reference
const fromR = <A, Er>(r: Result.Result<A, Er>): Either<Er, A> => (Result.isSuccess(r) ? right(r.success) : left(r.failure));
const toR = <Er, A>(e: Either<Er, A>): Result.Result<A, Er> => (e.tag === "left" ? Result.fail(e.error) : Result.succeed(e.value));
const fromEO = <A>(o: EO.Option<A>): Option<A> => (EO.isNone(o) ? none : some(o.value));
const toEO = <A>(o: Option<A>): EO.Option<A> => (o.tag === "none" ? EO.none() : EO.some(o.value));

const eithers: Either<string, number>[] = [right(2), left("e")];
const options: Option<number>[] = [some(2), none];
const double = (n: number) => n * 2;
const half = (n: number): Either<string, number> => (n % 2 === 0 ? right(n / 2) : left(`odd ${n}`));
const halfO = (n: number): Option<number> => (n % 2 === 0 ? some(n / 2) : none);

function spy<A extends unknown[], R>(f: (...a: A) => R) {
  const calls: A[] = [];
  return { calls, f: (...a: A) => (calls.push(a), f(...a)) };
}

describe("fp-ts 2.16.11", () => {
  it("mapping: map, bimap (one side runs), mapLeft", () => {
    for (const e of eithers) {
      expect(fromE(E.map(double)(toE(e)))).toEqual(mapEither(e, double).result);
      const l = spy((s: string) => s.length), r = spy(double);
      expect(fromE(E.bimap(l.f, r.f)(toE(e)))).toEqual(bimapEither(e, (s) => s.length, double).result);
      expect(l.calls.length + r.calls.length).toBe(1);
      expect(fromE(E.mapLeft((s: string) => s.length)(toE(e)))).toEqual(mapErrorEither(e, (s) => s.length).result);
    }
    for (const o of options) expect(fromO(O.map(double)(toO(o)))).toEqual(mapOption(o, double).result);
    expect(RA.map(double)([1, 2, 3])).toEqual(mapList([1, 2, 3], double).result);
  });

  it("sequencing: flatMap, flatten, effectful tap", () => {
    for (const e of [right(4), right(3), left("e")] as Either<string, number>[]) {
      expect(fromE(E.flatMap(toE(e), (n) => toE(half(n))))).toEqual(flatMapEither(e, half).result);
      expect(fromE(E.tap(toE(e), (n) => toE(half(n))))).toEqual(tapEither(e, half).result);
    }
    for (const o of [some(4), some(3), none] as Option<number>[]) {
      expect(fromO(O.flatMap(toO(o), (n) => toO(halfO(n))))).toEqual(flatMapOption(o, halfO).result);
      expect(fromO(O.tap(toO(o), (n) => toO(halfO(n))))).toEqual(tapOption(o, halfO).result);
    }
    const dup = (n: number) => [n, n];
    expect(RA.flatMap([1, 2], dup)).toEqual(flatMapList([1, 2], dup).result);
    expect(fromE(E.flatten(E.right(E.left("inner"))))).toEqual(flattenEither(right(left("inner"))).result);
    expect(fromO(O.flatten(O.some(O.some(1))))).toEqual(flattenOption(some(some(1))).result);
    expect(RA.flatten([[1], [2, 3]])).toEqual(flattenList([[1], [2, 3]]).result);
  });

  it("zipping: first Left wins, Validation keeps both, List is cartesian, zipWith is positional", () => {
    const pair = (a: number, b: number) => [a, b] as const;
    expect(fromE(sequenceT(E.Apply)(E.left("e1"), E.left("e2")))).toEqual(zipWithEither(left("e1"), left("e2"), pair).result);
    expect(fromE(sequenceT(E.Apply)(E.right(1), E.right(2)))).toEqual(zipWithEither(right(1), right(2), pair).result);
    expect(fromO(sequenceT(O.Apply)(O.some(1), O.none))).toEqual(zipWithOption(some(1), none, pair).result);
    const V = E.getApplicativeValidation(RNEA.getSemigroup<string>());
    const got = sequenceT(V)(E.left(["e1"]), E.left(["e2"]));
    expect(E.isLeft(got) ? failure(got.left as unknown as [string, ...string[]]) : success(got.right)).toEqual(zipWithValidation(failure(["e1"]), failure(["e2"]), pair).result);
    expect(sequenceT(RA.Apply)([1, 2, 3], [10, 20])).toEqual(zipWithListCartesian([1, 2, 3], [10, 20], pair).result);
    expect(RA.zipWith([1, 2, 3], [10, 20], (a, b) => a + b)).toEqual(zipWithListPositional([1, 2, 3], [10, 20], (a, b) => a + b).result);
  });

  it("traversing: E.sequenceArray matches the short-circuit sequence", () => {
    const es = [right(1), left("e1"), left("e2")] as Either<string, number>[];
    expect(fromE(E.sequenceArray(es.map(toE)))).toEqual(sequenceEither("short-circuit", es).result);
  });

  it("error handling: orElse can change the error type; alt and getOrElse are lazy", () => {
    expect(fromE(E.orElse((s: string) => E.left(s.length))(E.left("oops")))).toEqual(recoverEither(left("oops"), (s) => left(s.length)).result);
    const fb = spy((): E.Either<string, number> => E.right(9));
    expect(fromE(E.alt(fb.f)(E.right(1) as E.Either<string, number>))).toEqual(altEither(right(1), () => right(9)).result);
    expect(fb.calls).toEqual([]);
    expect(fromE(E.alt((): E.Either<string, number> => E.right(9))(E.left("x")))).toEqual(altEither(left("x"), () => right(9)).result);
    expect(fromO(O.alt(() => O.some(9))(O.none))).toEqual(altOption(none, () => some(9)).result);
    expect(RA.alt(() => [3])([1, 2])).toEqual(altList([1, 2], () => [3]).result);
    const AV = E.getAltValidation(RNEA.getSemigroup<string>());
    const both = AV.alt(E.left(["e1"]) as E.Either<RNEA.ReadonlyNonEmptyArray<string>, number>, () => E.left(["e2"]));
    expect(E.isLeft(both) ? failure(both.left as unknown as [string, ...string[]]) : success(both.right)).toEqual(altValidation(failure(["e1"]), () => failure(["e2"])).result);
    const d = spy(() => 0);
    expect(O.getOrElse(d.f)(O.some(5))).toBe(getOrElseOptionWith(some(5), () => 0).result);
    expect(d.calls).toEqual([]);
    expect(E.getOrElse((s: string) => s.length)(E.left("oops"))).toBe(getOrElseEitherWith(left("oops"), (s) => s.length).result);
  });

  it("pattern matching and filtering", () => {
    for (const e of eithers) expect(E.match((s: string) => `L${s}`, (n: number) => `R${n}`)(toE(e))).toBe(matchEither(e, (s) => `L${s}`, (n) => `R${n}`).result);
    for (const o of options) expect(O.match(() => "none", (n: number) => `some ${n}`)(toO(o))).toBe(matchOption(o, () => "none", (n) => `some ${n}`).result);
    for (const n of [3, 8]) {
      const ref = filterOrElseEither(right(n), (x) => x > 5, (x) => `small ${x}`).result;
      expect(fromE(E.filterOrElse((x: number) => x > 5, (x: number) => `small ${x}`)(E.right(n)))).toEqual(ref);
      expect(fromO(O.filter((x: number) => x > 5)(O.some(n)))).toEqual(filterOption(some(n), (x) => x > 5).result);
    }
  });
});

describe("tuples: fp-ts reverses the slots, Effect and Haskell don't", () => {
  const f = (e: string) => e.length;
  const g = (x: number) => x * 10;
  const ref = bimapTuple(["oops", 2] as const, f, g).result;
  it("fp-ts T.bimap takes the second slot's function first", () => {
    expect(T.bimap(g, f)(["oops", 2])).toEqual(ref);
  });
  it("fp-ts T.map maps the first slot", () => {
    expect(T.map((s: string) => s.length)(["oops", 2])).toEqual([4, 2]);
  });
  it("Effect Tuple.evolve maps each slot in order", () => {
    expect(Tuple.evolve(["oops", 2] as [string, number], [f, g])).toEqual(ref);
  });
});

describe("effect 4.0.5 has no Validation type", () => {
  it("the effect package exports no Validation module", () => {
    expect("Validation" in Effect4).toBe(false);
  });
});

describe("effect 4.0.5", () => {
  it("mapping: Result.map, mapError, mapBoth (one side runs); Option.map; Array.map", () => {
    for (const e of eithers) {
      expect(fromR(Result.map(toR(e), double))).toEqual(mapEither(e, double).result);
      expect(fromR(Result.mapError(toR(e), (s) => s.length))).toEqual(mapErrorEither(e, (s) => s.length).result);
      const l = spy((s: string) => s.length), r = spy(double);
      expect(fromR(Result.mapBoth(toR(e), { onFailure: l.f, onSuccess: r.f }))).toEqual(bimapEither(e, (s) => s.length, double).result);
      expect(l.calls.length + r.calls.length).toBe(1);
    }
    for (const o of options) expect(fromEO(EO.map(toEO(o), double))).toEqual(mapOption(o, double).result);
    expect(Arr.map([1, 2, 3], double)).toEqual(mapList([1, 2, 3], double).result);
  });

  it("sequencing: flatMap and flatten", () => {
    for (const e of [right(4), right(3), left("e")] as Either<string, number>[]) {
      expect(fromR(Result.flatMap(toR(e), (n) => toR(half(n))))).toEqual(flatMapEither(e, half).result);
    }
    for (const o of [some(4), some(3), none] as Option<number>[]) {
      expect(fromEO(EO.flatMap(toEO(o), (n) => toEO(halfO(n))))).toEqual(flatMapOption(o, halfO).result);
    }
    expect(Arr.flatMap([1, 2], (n) => [n, n])).toEqual(flatMapList([1, 2], (n) => [n, n]).result);
    expect(fromEO(EO.flatten(EO.some(EO.some(1))))).toEqual(flattenOption(some(some(1))).result);
    expect(Arr.flatten([[1], [2, 3]])).toEqual(flattenList([[1], [2, 3]]).result);
  });

  it("zipping: Option.zipWith; Array.zipWith is positional", () => {
    expect(fromEO(EO.zipWith(EO.some(1), EO.some(2), (a, b) => a + b))).toEqual(zipWithOption(some(1), some(2), (a, b) => a + b).result);
    expect(fromEO(EO.zipWith(EO.some(1), EO.none(), (a: number, b: number) => a + b))).toEqual(zipWithOption(some(1), none, (a: number, b: number) => a + b).result);
    expect(Arr.zipWith([1, 2, 3], [10, 20], (a, b) => a + b)).toEqual(zipWithListPositional([1, 2, 3], [10, 20], (a, b) => a + b).result);
  });

  it("error handling: Result.orElse, Option.orElse (lazy), getOrElse", () => {
    expect(fromR(Result.orElse(Result.fail("oops"), (s: string) => Result.fail(s.length)))).toEqual(recoverEither(left("oops"), (s) => left(s.length)).result);
    const fb = spy(() => EO.some(9));
    expect(fromEO(EO.orElse(EO.some(1), fb.f))).toEqual(altOption(some(1), () => some(9)).result);
    expect(fb.calls).toEqual([]);
    expect(fromEO(EO.orElse(EO.none(), () => EO.some(9)))).toEqual(altOption(none, () => some(9)).result);
    expect(EO.getOrElse(EO.none(), () => 0)).toBe(getOrElseOptionWith(none, () => 0).result);
    expect(Result.getOrElse(Result.fail("oops"), (s: string) => s.length)).toBe(getOrElseEitherWith(left("oops"), (s) => s.length).result);
  });

  it("pattern matching and filtering", () => {
    for (const e of eithers) expect(Result.match(toR(e), { onFailure: (s) => `L${s}`, onSuccess: (n) => `R${n}` })).toBe(matchEither(e, (s) => `L${s}`, (n) => `R${n}`).result);
    for (const o of options) expect(EO.match(toEO(o), { onNone: () => "none", onSome: (n) => `some ${n}` })).toBe(matchOption(o, () => "none", (n) => `some ${n}`).result);
    for (const n of [3, 8]) {
      expect(fromR(Result.filterOrFail(Result.succeed(n), (x) => x > 5, (x) => `small ${x}`))).toEqual(filterOrElseEither(right(n), (x) => x > 5, (x) => `small ${x}`).result);
      expect(fromEO(EO.filter(EO.some(n), (x) => x > 5))).toEqual(filterOption(some(n), (x) => x > 5).result);
    }
  });
});
