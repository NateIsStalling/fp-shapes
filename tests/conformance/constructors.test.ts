import { Array as Arr, Option as EO, Result } from "effect";
import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import * as RA from "fp-ts/ReadonlyArray";
import type * as RNEA from "fp-ts/ReadonlyNonEmptyArray";
import { describe, expect, it } from "vitest";
import {
  failEither,
  failList,
  failOption,
  failure,
  failValidation,
  fromNullableEither,
  fromNullableList,
  fromNullableOption,
  fromNullableValidation,
  fromPredicateEither,
  fromPredicateList,
  fromPredicateOption,
  fromPredicateValidation,
  left,
  none,
  pureEither,
  pureList,
  pureOption,
  pureValidation,
  right,
  some,
  success,
  tryCatchEither,
  tryCatchOption,
  tryCatchValidation,
  type Either,
  type NonEmpty,
  type Option,
  type Run,
  type Validation,
} from "../../src/semantics";

// Constructors in fp-ts 2.16.11 and effect 4.0.5 against the reference
// semantics: the results, and which callbacks ran, in order. The library's
// callbacks are recorded by name and compared with the reference trace.

const fromE = <L, R>(e: E.Either<L, R>): Either<L, R> => (E.isLeft(e) ? left(e.left) : right(e.right));
const fromV = <L, R>(e: E.Either<RNEA.ReadonlyNonEmptyArray<L>, R>): Validation<L, R> =>
  E.isLeft(e) ? failure(e.left as unknown as NonEmpty<L>) : success(e.right);
const fromO = <A>(o: O.Option<A>): Option<A> => (O.isNone(o) ? none : some(o.value));
const fromR = <A, Er>(r: Result.Result<A, Er>): Either<Er, A> => (Result.isSuccess(r) ? right(r.success) : left(r.failure));
const fromEO = <A>(o: EO.Option<A>): Option<A> => (EO.isNone(o) ? none : some(o.value));

// Records each callback's name as it runs.
function recorder() {
  const log: string[] = [];
  const wrap = <Args extends unknown[], R>(name: string, f: (...args: Args) => R) => (...args: Args): R => { log.push(name); return f(...args); };
  return { log, wrap };
}
const callsOf = (run: Run<unknown, unknown, unknown>) => run.trace.calls.map((c) => c.fn);

const nullish: readonly (number | string | boolean | null | undefined)[] = [null, undefined, 0, "", false, 7];
const isBig = (x: number) => x > 5;
const small = (x: number) => `small ${x}`;
// What a computation can do: return, return undefined, throw an Error, or
// throw something that is not an Error.
const computations: readonly (() => unknown)[] = [
  () => 1,
  () => undefined,
  () => { throw new Error("boom"); },
  () => { throw "a string"; },
  () => { throw undefined; },
];
const describeThrown = (e: unknown) => (e instanceof Error ? `Error(${e.message})` : `raw(${String(e)})`);

describe("fp-ts 2.16.11 constructors", () => {
  it("of, left, none", () => {
    expect(fromO(O.of(1))).toEqual(pureOption(1).result);
    expect(fromE(E.of(1))).toEqual(pureEither(1).result);
    expect(RA.of(1)).toEqual(pureList(1).result);
    expect(fromE(E.left("e"))).toEqual(failEither("e").result);
    expect(fromO(O.none)).toEqual(failOption().result);
  });

  it("Validation: E.of and E.left with a non-empty error list", () => {
    expect(fromV(E.of(1))).toEqual(pureValidation(1).result);
    const failed: E.Either<RNEA.ReadonlyNonEmptyArray<string>, number> = E.left(["e"]);
    expect(fromV(failed)).toEqual(failValidation("e").result);
  });

  it("pure doesn't inspect its input: O.of(null) is Some(null)", () => {
    expect(fromO(O.of(null))).toEqual(pureOption(null).result);
  });

  it("fromNullable: only null and undefined are missing", () => {
    for (const v of nullish) {
      expect(fromO(O.fromNullable(v))).toEqual(fromNullableOption(v).result);
      expect(fromE(E.fromNullable("missing")(v))).toEqual(fromNullableEither("missing", v).result);
    }
  });

  it("fromPredicate: the predicate runs once; onFalse runs only when it fails", () => {
    for (const n of [3, 8]) {
      const o = recorder();
      expect(fromO(O.fromPredicate(o.wrap("predicate", isBig))(n))).toEqual(fromPredicateOption(isBig, n).result);
      expect(o.log).toEqual(callsOf(fromPredicateOption(isBig, n)));
      const e = recorder();
      expect(fromE(E.fromPredicate(e.wrap("predicate", isBig), e.wrap("onFalse", small))(n))).toEqual(fromPredicateEither(isBig, small, n).result);
      expect(e.log).toEqual(callsOf(fromPredicateEither(isBig, small, n)));
    }
  });

  it("tryCatch: the computation runs once; onThrow gets exactly what was thrown, and only then", () => {
    for (const f of computations) {
      const e = recorder();
      expect(fromE(E.tryCatch(e.wrap("thunk", f), e.wrap("onThrow", describeThrown)))).toEqual(tryCatchEither(f, describeThrown).result);
      expect(e.log).toEqual(callsOf(tryCatchEither(f, describeThrown)));
      const o = recorder();
      expect(fromO(O.tryCatch(o.wrap("thunk", f)))).toEqual(tryCatchOption(f).result);
      expect(o.log).toEqual(callsOf(tryCatchOption(f)));
    }
  });
});

describe("fp-ts 2.16.11 constructors for Validation and List", () => {
  it("RA.empty is fail for List", () => {
    expect(RA.empty).toEqual(failList().result);
  });

  it("Validation reuses Either's constructors with a wrapped error", () => {
    for (const v of nullish) expect(fromV(E.fromNullable<RNEA.ReadonlyNonEmptyArray<string>>(["missing"])(v))).toEqual(fromNullableValidation("missing", v).result);
    for (const n of [3, 8]) {
      const e = recorder();
      const got = E.fromPredicate(e.wrap("predicate", isBig), e.wrap("onFalse", (x: number): RNEA.ReadonlyNonEmptyArray<string> => [small(x)]))(n);
      expect(fromV(got)).toEqual(fromPredicateValidation(isBig, small, n).result);
      expect(e.log).toEqual(callsOf(fromPredicateValidation(isBig, small, n)));
    }
    for (const f of computations) {
      const e = recorder();
      const got = E.tryCatch(e.wrap("thunk", f), e.wrap("onThrow", (u: unknown): RNEA.ReadonlyNonEmptyArray<string> => [describeThrown(u)]));
      expect(fromV(got)).toEqual(tryCatchValidation(f, describeThrown).result);
      expect(e.log).toEqual(callsOf(tryCatchValidation(f, describeThrown)));
    }
  });

  it("RA.fromPredicate and RA.fromOption(O.fromNullable(a)) build an empty or one-element list", () => {
    for (const n of [3, 8]) {
      const o = recorder();
      expect(RA.fromPredicate(o.wrap("predicate", isBig))(n)).toEqual(fromPredicateList(isBig, n).result);
      expect(o.log).toEqual(callsOf(fromPredicateList(isBig, n)));
    }
    for (const v of nullish) expect(RA.fromOption(O.fromNullable(v))).toEqual(fromNullableList(v).result);
  });
});

describe("effect 4.0.5 constructors for List", () => {
  it("Array.empty, Array.liftPredicate and Array.fromNullishOr", () => {
    expect(Arr.empty()).toEqual(failList().result);
    for (const n of [3, 8]) {
      const o = recorder();
      expect(Arr.liftPredicate(o.wrap("predicate", isBig))(n)).toEqual(fromPredicateList(isBig, n).result);
      expect(o.log).toEqual(callsOf(fromPredicateList(isBig, n)));
    }
    for (const v of nullish) expect(Arr.fromNullishOr(v)).toEqual(fromNullableList(v).result);
  });
});

describe("effect 4.0.5 constructors", () => {
  it("some, succeed, of, fail, none", () => {
    expect(fromEO(EO.some(1))).toEqual(pureOption(1).result);
    expect(fromR(Result.succeed(1))).toEqual(pureEither(1).result);
    expect(Arr.of(1)).toEqual(pureList(1).result);
    expect(fromR(Result.fail("e"))).toEqual(failEither("e").result);
    expect(fromEO(EO.none())).toEqual(failOption().result);
  });

  it("pure doesn't inspect its input: Option.some(null) is Some(null)", () => {
    expect(fromEO(EO.some(null))).toEqual(pureOption(null).result);
  });

  it("fromNullishOr: only null and undefined are missing; onNullish runs only then, with the original value", () => {
    for (const v of nullish) {
      expect(fromEO(EO.fromNullishOr(v))).toEqual(fromNullableOption(v).result);
      const seen: unknown[] = [];
      const onNullish = (x: unknown) => { seen.push(x); return "missing"; };
      expect(fromR(Result.fromNullishOr(v, onNullish))).toEqual(fromNullableEither("missing", v).result);
      expect(seen).toEqual(v === null || v === undefined ? [v] : []);
    }
  });

  it("liftPredicate: the predicate runs once; orFailWith runs only when it fails", () => {
    for (const n of [3, 8]) {
      const o = recorder();
      expect(fromEO(EO.liftPredicate(o.wrap("predicate", isBig))(n))).toEqual(fromPredicateOption(isBig, n).result);
      expect(o.log).toEqual(callsOf(fromPredicateOption(isBig, n)));
      const e = recorder();
      expect(fromR(Result.liftPredicate(e.wrap("predicate", isBig), e.wrap("onFalse", small))(n))).toEqual(fromPredicateEither(isBig, small, n).result);
      expect(e.log).toEqual(callsOf(fromPredicateEither(isBig, small, n)));
    }
  });

  it("Result.try and Option.liftThrowable: the computation runs once; catch gets exactly what was thrown, and only then", () => {
    for (const f of computations) {
      const e = recorder();
      expect(fromR(Result.try({ try: e.wrap("thunk", f), catch: e.wrap("onThrow", describeThrown) }))).toEqual(tryCatchEither(f, describeThrown).result);
      expect(e.log).toEqual(callsOf(tryCatchEither(f, describeThrown)));
      const o = recorder();
      expect(fromEO(EO.liftThrowable(o.wrap("thunk", f))())).toEqual(tryCatchOption(f).result);
      expect(o.log).toEqual(callsOf(tryCatchOption(f)));
    }
  });
});
