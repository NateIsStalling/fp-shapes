import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { flatMapEither, flatMapOption } from "./sequencing";
import {
  failEither,
  failOption,
  failValidation,
  fromNullableEither,
  fromNullableOption,
  fromPredicateEither,
  fromPredicateOption,
  pureEither,
  pureList,
  pureOption,
  pureValidation,
  tryCatchEither,
  tryCatchOption,
} from "./constructors";
import { left, none, right, some } from "./receivers";

describe("pure and fail", () => {
  it("pure builds the success case and calls nothing", () => {
    expect(pureOption(1)).toEqual({ result: some(1), trace: { calls: [], skipped: [] } });
    expect(pureEither(1).result).toEqual(right(1));
    expect(pureValidation(1).result).toEqual({ tag: "success", value: 1 });
    expect(pureList(1).result).toEqual([1]);
  });

  it("left identity: flatMap(pure(a), f) is f(a)", () => {
    fc.assert(fc.property(fc.integer(), (a) => {
      const f = (n: number) => (n % 2 === 0 ? right(n / 2) : left("odd"));
      void expect(flatMapEither(pureEither(a).result, f).result).toEqual(f(a));
      const g = (n: number) => (n > 0 ? some(n) : none);
      void expect(flatMapOption(pureOption(a).result, g).result).toEqual(g(a));
    }));
  });

  it("fail builds the failure case; Option's holds nothing; Validation's holds a list", () => {
    expect(failEither("e").result).toEqual(left("e"));
    expect(failOption().result).toEqual(none);
    expect(failValidation("e").result).toEqual({ tag: "failure", errors: ["e"] });
  });
});

describe("fromNullable", () => {
  it("null and undefined are missing", () => {
    expect(fromNullableOption(null).result).toEqual(none);
    expect(fromNullableOption(undefined).result).toEqual(none);
    expect(fromNullableEither("missing", null).result).toEqual(left("missing"));
  });

  it("trap: 0, empty string and false are present values", () => {
    for (const v of [0, "", false]) {
      expect(fromNullableOption(v).result).toEqual(some(v));
      expect(fromNullableEither("missing", v).result).toEqual(right(v));
    }
  });
});

describe("fromPredicate", () => {
  it("calls the predicate once; Option drops the value when it fails", () => {
    const r = fromPredicateOption((n: number) => n > 5, 3);
    expect(r.result).toEqual(none);
    expect(r.trace.calls.map((c) => c.fn)).toEqual(["predicate"]);
    expect(fromPredicateOption((n: number) => n > 5, 8).result).toEqual(some(8));
  });

  it("Either builds the error from the value, only when the predicate fails", () => {
    const pass = fromPredicateEither((n: number) => n > 5, (n) => `small ${n}`, 8);
    expect(pass.result).toEqual(right(8));
    expect(pass.trace.calls.map((c) => c.fn)).toEqual(["predicate"]);
    const fail = fromPredicateEither((n: number) => n > 5, (n) => `small ${n}`, 3);
    expect(fail.result).toEqual(left("small 3"));
    expect(fail.trace.calls.map((c) => c.fn)).toEqual(["predicate", "onFalse"]);
  });
});

describe("tryCatch", () => {
  const boom = (): number => { throw new Error("boom"); };

  it("a return becomes the success case; onThrow never runs", () => {
    const r = tryCatchEither(() => 1, () => "e");
    expect(r.result).toEqual(right(1));
    expect(r.trace.calls.map((c) => c.fn)).toEqual(["thunk"]);
    expect(tryCatchOption(() => 1).result).toEqual(some(1));
  });

  it("a throw becomes the failure case; onThrow receives what was thrown", () => {
    const r = tryCatchEither(boom, (e) => (e instanceof Error ? e.message : "?"));
    expect(r.result).toEqual(left("boom"));
    expect(r.trace.calls.map((c) => c.fn)).toEqual(["thunk", "onThrow"]);
    expect(tryCatchOption(boom).result).toEqual(none);
  });

  it("trap: a returned undefined is still a success", () => {
    expect(tryCatchOption(() => undefined).result).toEqual(some(undefined));
  });
});
