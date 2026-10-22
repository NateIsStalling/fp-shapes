import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { EitherApplicative, ListApplicative, OptionApplicative, ValidationApplicative, sequenceArray } from "./applicative";
import { altEither, altList, altOption, altValidation, getOrElseEither, getOrElseEitherWith, getOrElseOption, getOrElseOptionWith, mapErrorEither, mapErrorValidation, recoverEither } from "./errors";
import { bimapEither, bimapTuple, bimapValidation, mapEither, mapList, mapOption, mapValidation } from "./mapping";
import { filterOption, filterOrElseEither, matchEither, matchOption } from "./matching";
import { failure, left, none, right, some, success, type Either, type NonEmpty, type Option, type Validation } from "./receivers";
import { flatMapEither, flatMapList, flatMapOption, flattenEither, flattenList, flattenOption, peek, peekList, tapEither, tapOption } from "./sequencing";
import { sequenceEither, sequenceOption, sequenceValidation } from "./traverse";
import { zipWithEither, zipWithListCartesian, zipWithListPositional, zipWithOption, zipWithValidation } from "./zipping";

// Laws as stated in the Haskell base docs (base-4.22.0.0), plus the fixed
// "trap" cases the site's diagrams must show correctly.

const int = fc.integer({ min: -20, max: 20 });
const str = fc.string({ maxLength: 3 });
const option = <T>(a: fc.Arbitrary<T>): fc.Arbitrary<Option<T>> => fc.oneof(fc.constant(none), a.map((v) => some(v)));
const either = <T>(a: fc.Arbitrary<T>): fc.Arbitrary<Either<string, T>> => fc.oneof(str.map((e) => left(e)), a.map((v) => right(v)));
const validation = <T>(a: fc.Arbitrary<T>): fc.Arbitrary<Validation<string, T>> =>
  fc.oneof(fc.array(str, { minLength: 1, maxLength: 3 }).map((es) => failure(es as unknown as NonEmpty<string>)), a.map((v) => success(v)));
const list = <T>(a: fc.Arbitrary<T>) => fc.array(a, { maxLength: 4 });
const f = fc.func(int);
const g = fc.func(int);

describe("monad laws (flatMap)", () => {
  it("Option: left identity, right identity, associativity", () => {
    fc.assert(fc.property(int, option(int), fc.func(option(int)), fc.func(option(int)), (a, m, k, h) => {
      expect(flatMapOption(some(a), k).result).toEqual(k(a));
      expect(flatMapOption(m, (x) => some(x)).result).toEqual(m);
      expect(flatMapOption(flatMapOption(m, k).result, h).result).toEqual(flatMapOption(m, (x) => flatMapOption(k(x), h).result).result);
    }));
  });
  it("Either: left identity, right identity, associativity", () => {
    fc.assert(fc.property(int, either(int), fc.func(either(int)), fc.func(either(int)), (a, m, k, h) => {
      expect(flatMapEither(right(a), k).result).toEqual(k(a));
      expect(flatMapEither(m, (x) => right(x)).result).toEqual(m);
      expect(flatMapEither(flatMapEither(m, k).result, h).result).toEqual(flatMapEither(m, (x) => flatMapEither(k(x), h).result).result);
    }));
  });
  it("List: left identity, right identity, associativity", () => {
    fc.assert(fc.property(int, list(int), fc.func(list(int)), fc.func(list(int)), (a, m, k, h) => {
      expect(flatMapList([a], k).result).toEqual(k(a));
      expect(flatMapList(m, (x) => [x]).result).toEqual(m);
      expect(flatMapList(flatMapList(m, k).result, h).result).toEqual(flatMapList(m, (x) => flatMapList(k(x), h).result).result);
    }));
  });
  it("flatten = flatMap id, and flatMap f = flatten . map f", () => {
    fc.assert(fc.property(option(option(int)), option(int), fc.func(option(int)), (ffa, fa, k) => {
      expect(flattenOption(ffa).result).toEqual(flatMapOption(ffa, (x) => x).result);
      expect(flatMapOption(fa, k).result).toEqual(flattenOption(mapOption(fa, k).result).result);
    }));
    fc.assert(fc.property(either(either(int)), either(int), fc.func(either(int)), (ffa, fa, k) => {
      expect(flattenEither(ffa).result).toEqual(flatMapEither(ffa, (x) => x).result);
      expect(flatMapEither(fa, k).result).toEqual(flattenEither(mapEither(fa, k).result).result);
    }));
    fc.assert(fc.property(list(list(int)), list(int), fc.func(list(int)), (ffa, fa, k) => {
      expect(flattenList(ffa).result).toEqual(flatMapList(ffa, (x) => x).result);
      expect(flatMapList(fa, k).result).toEqual(flattenList(mapList(fa, k).result).result);
    }));
  });
});

describe("map agrees with the lawful applicative instances", () => {
  it("Option, Either, Validation, List", () => {
    fc.assert(fc.property(option(int), either(int), validation(int), list(int), f, (o, e, v, l, h) => {
      expect(mapOption(o, h).result).toEqual(OptionApplicative.map(o, h));
      expect(mapEither(e, h).result).toEqual(EitherApplicative.map(e, h));
      expect(mapValidation(v, h).result).toEqual(ValidationApplicative.map(v, h));
      expect(mapList(l, h).result).toEqual(ListApplicative.map(l, h));
    }));
  });
});

describe("bifunctor laws", () => {
  const id = <T>(x: T) => x;
  it("bimap id id = id; bimap (f . g) (h . i) = bimap f h . bimap g i", () => {
    fc.assert(fc.property(either(int).map((e) => (e.tag === "left" ? left(e.error.length) : e)), f, g, f, g, (fa, f1, g1, h1, i1) => {
      expect(bimapEither(fa, id, id).result).toEqual(fa);
      expect(bimapEither(fa, (x) => f1(g1(x)), (x) => h1(i1(x))).result).toEqual(bimapEither(bimapEither(fa, g1, i1).result, f1, h1).result);
    }));
    fc.assert(fc.property(int, int, f, g, f, g, (a, b, f1, g1, h1, i1) => {
      expect(bimapTuple([a, b], id, id).result).toEqual([a, b]);
      expect(bimapTuple([a, b], (x) => f1(g1(x)), (x) => h1(i1(x))).result).toEqual(bimapTuple(bimapTuple([a, b], g1, i1).result, f1, h1).result);
    }));
  });
  it("mapError f = bimap f id; map f = bimap id f", () => {
    fc.assert(fc.property(either(int), validation(int), f, (e, v, h) => {
      const len = (s: string) => s.length;
      expect(mapErrorEither(e, len).result).toEqual(bimapEither(e, len, id).result);
      expect(mapErrorValidation(v, len).result).toEqual(bimapValidation(v, len, id).result);
      expect(mapEither(e, h).result).toEqual(bimapEither(e, id, h).result);
    }));
  });
});

describe("zipWith agrees with applicative ap", () => {
  const plus = (a: number, b: number) => a + b;
  const curried = (a: number) => (b: number) => a + b;
  it("Option, Either, Validation, List (cartesian)", () => {
    fc.assert(fc.property(option(int), option(int), (a, b) => void expect(zipWithOption(a, b, plus).result).toEqual(OptionApplicative.ap(OptionApplicative.map(a, curried), b))));
    fc.assert(fc.property(either(int), either(int), (a, b) => void expect(zipWithEither(a, b, plus).result).toEqual(EitherApplicative.ap(EitherApplicative.map(a, curried), b))));
    fc.assert(fc.property(validation(int), validation(int), (a, b) => void expect(zipWithValidation(a, b, plus).result).toEqual(ValidationApplicative.ap(ValidationApplicative.map(a, curried), b))));
    fc.assert(fc.property(list(int), list(int), (a, b) => void expect(zipWithListCartesian(a, b, plus).result).toEqual(ListApplicative.ap(ListApplicative.map(a, curried), b))));
  });
  it("positional zip pairs by index and stops at the shorter list", () => {
    fc.assert(fc.property(list(int), list(int), (a, b) => {
      const run = zipWithListPositional(a, b, plus);
      expect(run.result.length).toBe(Math.min(a.length, b.length));
      run.result.forEach((x, i) => expect(x).toBe((a[i] as number) + (b[i] as number)));
    }));
  });
});

describe("alt", () => {
  it("is associative (Option, Either, List)", () => {
    fc.assert(fc.property(option(int), option(int), option(int), (a, b, c) =>
      void expect(altOption(altOption(a, () => b).result, () => c).result).toEqual(altOption(a, () => altOption(b, () => c).result).result)));
    fc.assert(fc.property(either(int), either(int), either(int), (a, b, c) =>
      void expect(altEither(altEither(a, () => b).result, () => c).result).toEqual(altEither(a, () => altEither(b, () => c).result).result)));
    fc.assert(fc.property(list(int), list(int), list(int), (a, b, c) =>
      void expect(altList(altList(a, () => b).result, () => c).result).toEqual(altList(a, () => altList(b, () => c).result).result)));
  });
});

describe("consistency between operations", () => {
  it("getOrElse with a function = match(fallback, id)", () => {
    fc.assert(fc.property(option(int), int, (fa, d) => void expect(getOrElseOptionWith(fa, () => d).result).toEqual(matchOption(fa, () => d, (x) => x).result)));
    fc.assert(fc.property(either(int), (fa) => void expect(getOrElseEitherWith(fa, (e) => e.length).result).toEqual(matchEither(fa, (e) => e.length, (x) => x).result)));
  });
  it("tap with a step that succeeds leaves the value unchanged", () => {
    fc.assert(fc.property(option(int), either(int), (o, e) => {
      expect(tapOption(o, () => some("ok")).result).toEqual(o);
      expect(tapEither(e, () => right("ok")).result).toEqual(e);
    }));
  });
  it("peek never changes the result", () => {
    fc.assert(fc.property(option(int), either(int), validation(int), list(int), (o, e, v, l) => {
      expect(peek(o, () => undefined).result).toBe(o);
      expect(peek(e, () => undefined).result).toBe(e);
      expect(peek(v, () => undefined).result).toBe(v);
      expect(peekList(l, () => undefined).result).toBe(l);
    }));
  });
  it("filterOrElse with an always-true predicate is the identity", () => {
    fc.assert(fc.property(either(int), option(int), (e, o) => {
      expect(filterOrElseEither(e, () => true, () => "never").result).toEqual(e);
      expect(filterOption(o, () => true).result).toEqual(o);
    }));
  });
  it("instrumented sequence agrees with the lawful sequence", () => {
    fc.assert(fc.property(list(either(int)), list(option(int)), list(validation(int)), (es, os, vs) => {
      expect(sequenceEither("short-circuit", es).result).toEqual(sequenceArray(EitherApplicative)(es));
      expect(sequenceEither("eager", es).result).toEqual(sequenceArray(EitherApplicative)(es));
      expect(sequenceOption("short-circuit", os).result).toEqual(sequenceArray(OptionApplicative)(os));
      expect(sequenceValidation(vs).result).toEqual(sequenceArray(ValidationApplicative)(vs));
    }));
  });
});

describe("traps the diagrams must show", () => {
  it("zip: [1,2,3] with 'ab' is 6 cartesian pairs, but 2 positional pairs and one skipped", () => {
    const pair = (a: number, b: string) => `${a}${b}`;
    expect(zipWithListCartesian([1, 2, 3], ["a", "b"], pair).result).toEqual(["1a", "1b", "2a", "2b", "3a", "3b"]);
    const positional = zipWithListPositional([1, 2, 3], ["a", "b"], pair);
    expect(positional.result).toEqual(["1a", "2b"]);
    expect(positional.trace.skipped).toEqual([2]);
  });
  it("zip: when both fail, Either keeps the left error and Validation keeps both", () => {
    expect(zipWithEither(left("e1"), left("e2"), () => 0).result).toEqual(left("e1"));
    expect(zipWithValidation(failure(["e1"]), failure(["e2"]), () => 0).result).toEqual(failure(["e1", "e2"]));
  });
  it("bimap: Either runs one function, a Tuple runs both", () => {
    expect(bimapEither(left("e"), (s) => s.length, (n: number) => n).trace.calls.map((c) => c.fn)).toEqual(["left"]);
    expect(bimapTuple([1, "x"], (n) => n + 1, (s) => s.length).trace.calls.map((c) => c.fn)).toEqual(["first", "second"]);
  });
  it("getOrElse: a constant makes no call; a computed default runs only on failure", () => {
    expect(getOrElseOption(none, 0).trace.calls).toEqual([]);
    expect(getOrElseEither(left("e"), 0).trace.calls).toEqual([]);
    expect(getOrElseEitherWith(right(5), () => 0).trace.calls).toEqual([]);
    expect(getOrElseEitherWith(left("oops"), (e) => e.length)).toEqual({ result: 4, trace: { calls: [{ index: 0, input: "oops", output: 4, fn: "fallback" }], skipped: [] } });
  });
  it("recover can change the error type, and skips success", () => {
    expect(recoverEither(left("oops"), (e) => left(e.length)).result).toEqual(left(4));
    expect(recoverEither(right(1), () => left(0)).trace.calls).toEqual([]);
  });
  it("tap's step can turn a success into a failure; peek's cannot", () => {
    expect(tapEither(right(1), () => left("audit failed")).result).toEqual(left("audit failed"));
    const seen: unknown[] = [];
    expect(peek(right(1), (v) => void seen.push(v)).result).toEqual(right(1));
    expect(seen).toEqual([1]);
  });
  it("flatMap on a List can change its length", () => {
    expect(flatMapList([1, 2, 3], (n) => Array.from({ length: n }, () => n)).result).toEqual([1, 2, 2, 3, 3, 3]);
  });
  it("Validation's alt keeps both failures; Option's fallback runs only on None", () => {
    expect(altValidation(failure(["e1"]), () => failure(["e2"])).result).toEqual(failure(["e1", "e2"]));
    expect(altOption(some(1), () => some(2)).trace.calls).toEqual([]);
  });
  it("filterOrElse turns a failing success into a Left built from the value", () => {
    expect(filterOrElseEither(right(3), (n) => n > 5, (n) => `too small: ${n}`).result).toEqual(left("too small: 3"));
  });
});
