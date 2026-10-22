import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { EitherApplicative, OptionApplicative, ValidationApplicative, traverseArray } from "./applicative";
import { failure, left, none, right, some, success, type Either, type Option, type Validation } from "./receivers";
import { traverseEither, traverseOption, traverseValidation } from "./traverse";

// The trap from the plan: elements 2 and 4 fail (indices 1 and 3).
const inputs = ["a1", "a2", "a3", "a4"] as const;
const failing = new Set(["a2", "a4"]);
const toB = (a: string) => a.replace("a", "b");
const toE = (a: string) => a.replace("a", "e");

const fEither = (a: string): Either<string, string> => (failing.has(a) ? left(toE(a)) : right(toB(a)));
const fOption = (a: string): Option<string> => (failing.has(a) ? none : some(toB(a)));
const fValidation = (a: string): Validation<string, string> => (failing.has(a) ? failure([toE(a)]) : success(toB(a)));

describe("traverse variants: elements 2 and 4 fail", () => {
  it("Either, stop at first: f is not called after a2; result is Left(e2)", () => {
    const run = traverseEither("stop-at-first", inputs, fEither);
    expect(run.result).toEqual(left("e2"));
    expect(run.trace.calls.map((c) => c.index)).toEqual([0, 1]);
    expect(run.trace.skipped).toEqual([2, 3]);
  });

  it("Either, call all: every call happens; only Left(e2) survives", () => {
    const run = traverseEither("call-all-first-wins", inputs, fEither);
    expect(run.result).toEqual(left("e2"));
    expect(run.trace.calls.map((c) => c.index)).toEqual([0, 1, 2, 3]);
    expect(run.trace.skipped).toEqual([]);
  });

  it("Validation, accumulate: every call happens; both errors survive in order", () => {
    const run = traverseValidation(inputs, fValidation);
    expect(run.result).toEqual(failure(["e2", "e4"]));
    expect(run.trace.calls.map((c) => c.index)).toEqual([0, 1, 2, 3]);
  });

  it("Option, stop at first: None after two calls", () => {
    const run = traverseOption("stop-at-first", inputs, fOption);
    expect(run.result).toEqual(none);
    expect(run.trace.skipped).toEqual([2, 3]);
  });

  it("no failures: every variant rebuilds the list", () => {
    const ok = ["a1", "a3"];
    expect(traverseEither("stop-at-first", ok, fEither).result).toEqual(right(["b1", "b3"]));
    expect(traverseEither("call-all-first-wins", ok, fEither).result).toEqual(right(["b1", "b3"]));
    expect(traverseValidation(ok, fValidation).result).toEqual(success(["b1", "b3"]));
    expect(traverseOption("stop-at-first", ok, fOption).result).toEqual(some(["b1", "b3"]));
  });

  it("empty input succeeds with an empty list and makes no calls", () => {
    const run = traverseEither("stop-at-first", [], fEither);
    expect(run.result).toEqual(right([]));
    expect(run.trace.calls).toEqual([]);
  });
});

// The instrumented variants must agree with the lawful reference traverse on
// results. They differ only in which calls they record.
describe("variants agree with the lawful traverse", () => {
  const xs = fc.array(fc.integer({ min: -9, max: 9 }), { maxLength: 8 });
  const eitherF = (n: number): Either<string, number> => (n < 0 ? left(`e${n}`) : right(n * 2));
  const optionF = (n: number): Option<number> => (n < 0 ? none : some(n * 2));
  const validationF = (n: number): Validation<string, number> => (n < 0 ? failure([`e${n}`]) : success(n * 2));

  it("Either: both variants equal traverseArray(EitherApplicative)", () => {
    fc.assert(
      fc.property(xs, (as) => {
        const lawful = traverseArray(EitherApplicative)(as, eitherF);
        expect(traverseEither("stop-at-first", as, eitherF).result).toEqual(lawful);
        expect(traverseEither("call-all-first-wins", as, eitherF).result).toEqual(lawful);
      }),
    );
  });

  it("Option: both variants equal traverseArray(OptionApplicative)", () => {
    fc.assert(
      fc.property(xs, (as) => {
        const lawful = traverseArray(OptionApplicative)(as, optionF);
        expect(traverseOption("stop-at-first", as, optionF).result).toEqual(lawful);
        expect(traverseOption("call-all-first-wins", as, optionF).result).toEqual(lawful);
      }),
    );
  });

  it("Validation: accumulate equals traverseArray(ValidationApplicative)", () => {
    fc.assert(
      fc.property(xs, (as) => void expect(traverseValidation(as, validationF).result).toEqual(traverseArray(ValidationApplicative)(as, validationF))),
    );
  });

  it("stop-at-first never calls f after the first failure", () => {
    fc.assert(
      fc.property(xs, (as) => {
        const run = traverseEither("stop-at-first", as, eitherF);
        const firstFail = as.findIndex((n) => n < 0);
        const expectedCalls = firstFail < 0 ? as.length : firstFail + 1;
        expect(run.trace.calls.length).toBe(expectedCalls);
        expect(run.trace.calls.length + run.trace.skipped.length).toBe(as.length);
      }),
    );
  });
});
