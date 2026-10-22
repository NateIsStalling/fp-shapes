import { Array as Arr, Option as EO, Result } from "effect";
import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import * as RA from "fp-ts/ReadonlyArray";
import { describe, expect, it } from "vitest";
import {
  failEither,
  failOption,
  fromNullableEither,
  fromNullableOption,
  fromPredicateEither,
  fromPredicateOption,
  left,
  none,
  pureEither,
  pureList,
  pureOption,
  right,
  some,
  tryCatchEither,
  tryCatchOption,
  type Either,
  type Option,
} from "../../src/semantics";

// Constructors in fp-ts 2.16.11 and effect 4.0.5 against the reference
// semantics: results, and which callbacks ran.

const fromE = <L, R>(e: E.Either<L, R>): Either<L, R> => (E.isLeft(e) ? left(e.left) : right(e.right));
const fromO = <A>(o: O.Option<A>): Option<A> => (O.isNone(o) ? none : some(o.value));
const fromR = <A, Er>(r: Result.Result<A, Er>): Either<Er, A> => (Result.isSuccess(r) ? right(r.success) : left(r.failure));
const fromEO = <A>(o: EO.Option<A>): Option<A> => (EO.isNone(o) ? none : some(o.value));
const counter = () => { let n = 0; return { tick: () => { n++; }, get count() { return n; } }; };

const nullish: readonly (number | string | boolean | null | undefined)[] = [null, undefined, 0, "", false, 7];
const boom = (): number => { throw new Error("boom"); };
const message = (e: unknown) => (e instanceof Error ? e.message : "?");

describe("fp-ts 2.16.11 constructors", () => {
  it("of, left, none", () => {
    expect(fromO(O.of(1))).toEqual(pureOption(1).result);
    expect(fromE(E.of(1))).toEqual(pureEither(1).result);
    expect(RA.of(1)).toEqual(pureList(1).result);
    expect(fromE(E.left("e"))).toEqual(failEither("e").result);
    expect(fromO(O.none)).toEqual(failOption().result);
  });

  it("fromNullable: only null and undefined are missing", () => {
    for (const v of nullish) {
      expect(fromO(O.fromNullable(v))).toEqual(fromNullableOption(v).result);
      expect(fromE(E.fromNullable("missing")(v))).toEqual(fromNullableEither("missing", v).result);
    }
  });

  it("fromPredicate: onFalse runs only when the predicate fails", () => {
    for (const n of [3, 8]) {
      expect(fromO(O.fromPredicate((x: number) => x > 5)(n))).toEqual(fromPredicateOption((x: number) => x > 5, n).result);
      const c = counter();
      const onFalse = (x: number) => { c.tick(); return `small ${x}`; };
      expect(fromE(E.fromPredicate((x: number) => x > 5, onFalse)(n))).toEqual(fromPredicateEither((x: number) => x > 5, (x) => `small ${x}`, n).result);
      expect(c.count).toBe(n > 5 ? 0 : 1);
    }
  });

  it("tryCatch: onThrow runs only on a throw; a returned undefined is a success", () => {
    const c = counter();
    const onThrow = (e: unknown) => { c.tick(); return message(e); };
    expect(fromE(E.tryCatch(() => 1, onThrow))).toEqual(tryCatchEither(() => 1, message).result);
    expect(c.count).toBe(0);
    expect(fromE(E.tryCatch(boom, onThrow))).toEqual(tryCatchEither(boom, message).result);
    expect(c.count).toBe(1);
    expect(fromO(O.tryCatch(boom))).toEqual(tryCatchOption(boom).result);
    expect(fromO(O.tryCatch(() => undefined))).toEqual(tryCatchOption(() => undefined).result);
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

  it("fromNullishOr: only null and undefined are missing", () => {
    for (const v of nullish) {
      expect(fromEO(EO.fromNullishOr(v))).toEqual(fromNullableOption(v).result);
      expect(fromR(Result.fromNullishOr(v, () => "missing"))).toEqual(fromNullableEither("missing", v).result);
    }
  });

  it("liftPredicate: orFailWith runs only when the predicate fails", () => {
    for (const n of [3, 8]) {
      expect(fromEO(EO.liftPredicate((x: number) => x > 5)(n))).toEqual(fromPredicateOption((x: number) => x > 5, n).result);
      const c = counter();
      const onFalse = (x: number) => { c.tick(); return `small ${x}`; };
      expect(fromR(Result.liftPredicate((x: number) => x > 5, onFalse)(n))).toEqual(fromPredicateEither((x: number) => x > 5, (x) => `small ${x}`, n).result);
      expect(c.count).toBe(n > 5 ? 0 : 1);
    }
  });

  it("Result.try and Option.liftThrowable: catch runs only on a throw", () => {
    const c = counter();
    const onThrow = (e: unknown) => { c.tick(); return message(e); };
    expect(fromR(Result.try({ try: () => 1, catch: onThrow }))).toEqual(tryCatchEither(() => 1, message).result);
    expect(c.count).toBe(0);
    expect(fromR(Result.try({ try: boom, catch: onThrow }))).toEqual(tryCatchEither(boom, message).result);
    expect(c.count).toBe(1);
    expect(fromEO(EO.liftThrowable(boom)())).toEqual(tryCatchOption(boom).result);
    expect(fromEO(EO.liftThrowable(() => undefined)())).toEqual(tryCatchOption(() => undefined).result);
  });
});
