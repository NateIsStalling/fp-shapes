import { Effect, Iterable, Option as EO, Result } from "effect";
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
  sequenceEither,
  sequenceOption,
  sequenceValidation,
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

// Records which indices of an array are read, in order, so sequence's
// "calls" (the elements it inspects) can be compared with the reference.
function watched<A>(xs: readonly A[]) {
  const reads: number[] = [];
  const proxy = new Proxy(xs as A[], {
    get(target, key, receiver) {
      if (typeof key === "string" && /^\d+$/.test(key) && !reads.includes(Number(key))) reads.push(Number(key));
      return Reflect.get(target, key, receiver);
    },
  });
  return { reads, proxy: proxy as readonly A[] };
}
const indices = (run: { trace: { calls: readonly { index: number }[] } }) => run.trace.calls.map((c) => c.index);

const eithersSeq = [right(1), left("e2"), right(3), left("e4")] as const;
const optionsSeq = [some(1), none, some(3), none] as const;

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

  it("RA.traverse(E.Applicative) is eager: f runs on every element, the first Left wins", () => {
    for (const xs of [inputs, ok]) {
      const { calls, f } = instrument((n) => (n < 0 ? E.left(`e${n}`) : E.right(n * 10)));
      const got = RA.traverse(E.Applicative)(f)(xs);
      const ref = referenceEither("eager", xs);
      expect(E.isLeft(got) ? left(got.left) : right(got.right)).toEqual(ref.result);
      expect(calls).toEqual(ref.calls);
    }
  });

  it("RA.traverse(O.Applicative) is eager: f runs on every element", () => {
    const { calls, f } = instrument((n) => (n < 0 ? O.none : O.some(n * 10)));
    const got = RA.traverse(O.Applicative)(f)(inputs);
    const ref = traverseOption("eager", inputs, (n) => (n < 0 ? none : some(n * 10)));
    expect(O.isNone(got) ? none : some(got.value)).toEqual(ref.result);
    expect(calls).toEqual(ref.trace.calls.map((c) => c.input));
  });

  it("RA.sequence(E.Applicative) and RA.sequence(O.Applicative) match sequence's results", () => {
    const es = [right(1), left("e2"), left("e3")] as const;
    const got = RA.sequence(E.Applicative)(es.map((e) => (e.tag === "right" ? E.right(e.value) : E.left(e.error))));
    expect(E.isLeft(got) ? left(got.left) : right(got.right)).toEqual(sequenceEither("eager", es).result);
    const os = [some(1), none, some(3)] as const;
    const gotO = RA.sequence(O.Applicative)(os.map((o) => (o.tag === "some" ? O.some(o.value) : O.none)));
    expect(O.isNone(gotO) ? none : some(gotO.value)).toEqual(sequenceOption("eager", os).result);
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
  it("sequence: E.sequenceArray and O.sequenceArray stop reading at the first failure; RA.sequence reads every element", () => {
    const toE = (e: (typeof eithersSeq)[number]) => (e.tag === "right" ? E.right(e.value) : E.left(e.error));
    const toO = (o: (typeof optionsSeq)[number]) => (o.tag === "some" ? O.some(o.value) : O.none);
    const fromE = <L, R>(e: E.Either<L, R>) => (E.isLeft(e) ? left(e.left) : right(e.right));
    const fromO = <A>(o: O.Option<A>) => (O.isNone(o) ? none : some(o.value));
    for (const [strategy, run] of [["short-circuit", E.sequenceArray], ["eager", RA.sequence(E.Applicative)]] as const) {
      const w = watched(eithersSeq.map(toE));
      const ref = sequenceEither(strategy, eithersSeq);
      expect(fromE(run(w.proxy))).toEqual(ref.result);
      expect(w.reads).toEqual(indices(ref));
    }
    for (const [strategy, run] of [["short-circuit", O.sequenceArray], ["eager", RA.sequence(O.Applicative)]] as const) {
      const w = watched(optionsSeq.map(toO));
      const ref = sequenceOption(strategy, optionsSeq);
      expect(fromO(run(w.proxy))).toEqual(ref.result);
      expect(w.reads).toEqual(indices(ref));
    }
  });

  it("RA.sequence(E.getApplicativeValidation(S)) reads every element and keeps every failure", () => {
    const V = E.getApplicativeValidation(RNEA.getSemigroup<string>());
    const vs = [success(1), failure(["e2"]), success(3), failure(["e4"])] as const;
    const w = watched(vs.map((v): E.Either<RNEA.ReadonlyNonEmptyArray<string>, number> => (v.tag === "success" ? E.right(v.value) : E.left(v.errors))));
    const got = RA.sequence(V)(w.proxy);
    const ref = sequenceValidation(vs);
    expect(E.isLeft(got) ? failure(got.left as unknown as [string, ...string[]]) : success(got.right)).toEqual(ref.result);
    expect(w.reads).toEqual(indices(ref));
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
  it("Result.all(Iterable.map(xs, f)) is short-circuit; Result.all(Array.map(xs, f)) is eager", () => {
    const check = (n: number) => (n < 0 ? Result.fail(`e${n}`) : Result.succeed(n * 10));
    for (const xs of [inputs, ok]) {
      for (const [strategy, run] of [
        ["short-circuit", (f: typeof check) => Result.all(Iterable.map(xs, f))],
        ["eager", (f: typeof check) => Result.all(xs.map(f))],
      ] as const) {
        const { calls, f } = instrument(check);
        const got = run(f);
        const ref = referenceEither(strategy, xs);
        expect(Result.isFailure(got) ? left(got.failure) : right(got.success)).toEqual(ref.result);
        expect(calls).toEqual(ref.calls);
      }
    }
  });

  it("Option.all(Iterable.map(xs, f)) is short-circuit; Option.all(Array.map(xs, f)) is eager", () => {
    const check = (n: number) => (n < 0 ? EO.none<number>() : EO.some(n * 10));
    for (const xs of [inputs, ok]) {
      for (const [strategy, run] of [
        ["short-circuit", (f: typeof check) => EO.all(Iterable.map(xs, f))],
        ["eager", (f: typeof check) => EO.all(xs.map(f))],
      ] as const) {
        const { calls, f } = instrument(check);
        const got = run(f);
        const ref = traverseOption(strategy, xs, (n) => (n < 0 ? none : some(n * 10)));
        expect(EO.isNone(got) ? none : some(got.value)).toEqual(ref.result);
        expect(calls).toEqual(ref.trace.calls.map((c) => c.input));
      }
    }
  });

  it("sequence: Result.all and Option.all stop reading at the first failure (short-circuit only)", () => {
    const w = watched(eithersSeq.map((e) => (e.tag === "right" ? Result.succeed(e.value) : Result.fail(e.error))));
    const got = Result.all(w.proxy);
    const ref = sequenceEither("short-circuit", eithersSeq);
    expect(Result.isFailure(got) ? left(got.failure) : right(got.success)).toEqual(ref.result);
    expect(w.reads).toEqual(indices(ref));
    expect(w.reads).not.toEqual(indices(sequenceEither("eager", eithersSeq)));
    const wo = watched(optionsSeq.map((o) => (o.tag === "some" ? EO.some(o.value) : EO.none<number>())));
    const gotO = EO.all(wo.proxy);
    const refO = sequenceOption("short-circuit", optionsSeq);
    expect(EO.isNone(gotO) ? none : some(gotO.value)).toEqual(refO.result);
    expect(wo.reads).toEqual(indices(refO));
    expect(wo.reads).not.toEqual(indices(sequenceOption("eager", optionsSeq)));
  });
});
