import { Effect, Result } from "effect";
import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import * as RA from "fp-ts/ReadonlyArray";
import * as RNEA from "fp-ts/ReadonlyNonEmptyArray";
import * as T from "fp-ts/Task";
import * as TE from "fp-ts/TaskEither";
import { describe, expect, it } from "vitest";
import {
  failure,
  left,
  none,
  right,
  some,
  success,
  traverseEither,
  traverseOption,
  traverseValidation,
  type EvaluationStrategy,
} from "../../src/semantics";

// Conformance: the reference semantics that draw the diagrams must agree with
// real libraries, both in results and in which calls happen. Each test names
// the library API, the version pinned in package.json, and the strategy the
// catalog claims it uses. A failure here means a catalog claim is wrong.

const inputs = [1, -2, 3, -4] as const;
const ok = [1, 2, 3] as const;

// Records which inputs f was called with.
function instrument<R>(f: (n: number) => R) {
  const calls: number[] = [];
  return { calls, f: (n: number) => (calls.push(n), f(n)) };
}

const referenceEither = (strategy: EvaluationStrategy, xs: readonly number[]) => {
  const run = traverseEither(strategy, xs, (n) => (n < 0 ? left(`e${n}`) : right(n * 10)));
  return { result: run.result, calls: run.trace.calls.map((c) => c.input) };
};

describe("fp-ts 2.16.11", () => {
  it("E.traverseArray is short-circuit", () => {
    for (const xs of [inputs, ok]) {
      const { calls, f } = instrument((n) => (n < 0 ? E.left(`e${n}`) : E.right(n * 10)));
      const got = E.traverseArray(f)(xs);
      const ref = referenceEither("short-circuit", xs);
      expect(E.isLeft(got) ? left(got.left) : right(got.right)).toEqual(ref.result);
      expect(calls).toEqual(ref.calls);
    }
  });

  it("O.traverseArray is short-circuit", () => {
    const { calls, f } = instrument((n) => (n < 0 ? O.none : O.some(n * 10)));
    const got = O.traverseArray(f)(inputs);
    const ref = traverseOption("short-circuit", inputs, (n) => (n < 0 ? none : some(n * 10)));
    expect(O.isNone(got) ? none : some(got.value)).toEqual(ref.result);
    expect(calls).toEqual(ref.trace.calls.map((c) => c.input));
  });

  it("RA.traverse(E.getApplicativeValidation(S)) accumulates every failure", () => {
    const V = E.getApplicativeValidation(RNEA.getSemigroup<string>());
    const { calls, f } = instrument((n): E.Either<RNEA.ReadonlyNonEmptyArray<string>, number> => (n < 0 ? E.left([`e${n}`]) : E.right(n * 10)));
    const got = RA.traverse(V)(f)(inputs);
    const ref = traverseValidation(inputs, (n) => (n < 0 ? failure([`e${n}`]) : success(n * 10)));
    expect(E.isLeft(got) ? failure(got.left as unknown as [string, ...string[]]) : success(got.right)).toEqual(ref.result);
    expect(calls).toEqual([...inputs]);
  });

  it("TE.traverseArray (parallel) is eager: every task runs, the first Left in array order wins", async () => {
    const { calls, f } = instrument((n) => (n < 0 ? TE.left(`e${n}`) : TE.right(n * 10)));
    const got = await TE.traverseArray(f)(inputs)();
    const ref = referenceEither("eager", inputs);
    expect(E.isLeft(got) ? left(got.left) : right(got.right)).toEqual(ref.result);
    expect([...calls].sort((a, b) => a - b)).toEqual([...ref.calls].sort((a, b) => a - b));
  });

  it("TE.traverseSeqArray is short-circuit", async () => {
    const started: number[] = [];
    const f = (n: number) =>
      TE.fromTask<number, string>(T.fromIO(() => (started.push(n), n))) as TE.TaskEither<string, number>;
    const g = (n: number) => (n < 0 ? TE.leftIO<string, number>(() => (started.push(n), `e${n}`)) : f(n));
    const got = await TE.traverseSeqArray(g)(inputs)();
    const ref = referenceEither("short-circuit", inputs);
    expect(E.isLeft(got) ? left(got.left) : right(got.right.map((n) => n * 10))).toEqual(ref.result);
    expect(started).toEqual(ref.calls);
  });
});

describe("effect 4.0.5", () => {
  it("Effect.forEach (default, sequential) is short-circuit", () => {
    for (const xs of [inputs, ok]) {
      const calls: number[] = [];
      const f = (n: number) => Effect.suspend(() => (calls.push(n), n < 0 ? Effect.fail(`e${n}`) : Effect.succeed(n * 10)));
      const got = Effect.runSync(Effect.result(Effect.forEach(xs, f)));
      const ref = referenceEither("short-circuit", xs);
      expect(Result.isFailure(got) ? left(got.failure) : right(got.success)).toEqual(ref.result);
      expect(calls).toEqual(ref.calls);
    }
  });

  it("Effect.validate evaluates every element and keeps every failure", () => {
    const calls: number[] = [];
    const f = (n: number) => Effect.suspend(() => (calls.push(n), n < 0 ? Effect.fail(`e${n}`) : Effect.succeed(n * 10)));
    const got = Effect.runSync(Effect.result(Effect.validate(inputs, f)));
    const ref = traverseValidation(inputs, (n) => (n < 0 ? failure([`e${n}`]) : success(n * 10)));
    expect(Result.isFailure(got) ? failure(got.failure as unknown as [string, ...string[]]) : success(got.success)).toEqual(ref.result);
    expect(calls).toEqual([...inputs]);
  });
});
