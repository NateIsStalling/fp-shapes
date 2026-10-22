import { failure, left, none, right, some, success, type Either, type Option, type Validation } from "./receivers";
import { call, noCalls, type Call, type Run } from "./trace";

// Constructors: build a receiver from a plain value, a possibly missing
// value, a test, or a computation that may throw.

// pure: the success case. No function runs, and nothing can fail.
export const pureOption = <A>(a: A): Run<Option<A>> => ({ result: some(a), trace: noCalls });
export const pureEither = <A>(a: A): Run<Either<never, A>> => ({ result: right(a), trace: noCalls });
export const pureValidation = <A>(a: A): Run<Validation<never, A>> => ({ result: success(a), trace: noCalls });
export const pureList = <A>(a: A): Run<readonly A[]> => ({ result: [a], trace: noCalls });

// fail: the failure case. Option's failure holds nothing, so it takes no value.
export const failEither = <E>(e: E): Run<Either<E, never>> => ({ result: left(e), trace: noCalls });
export const failOption = (): Run<Option<never>> => ({ result: none, trace: noCalls });
export const failValidation = <E>(e: E): Run<Validation<E, never>> => ({ result: failure([e]), trace: noCalls });

// fromNullable: null and undefined are missing; every other value is present,
// including 0, "" and false.
const missing = (a: unknown): a is null | undefined => a === null || a === undefined;

export const fromNullableOption = <A>(a: A | null | undefined): Run<Option<A>> => ({ result: missing(a) ? none : some(a), trace: noCalls });

export const fromNullableEither = <E, A>(e: E, a: A | null | undefined): Run<Either<E, A>> => ({ result: missing(a) ? left(e) : right(a), trace: noCalls });

// fromPredicate: the predicate runs once. Either also builds the error from
// the value, and only when the predicate fails.
export function fromPredicateOption<A>(predicate: (a: A) => boolean, a: A): Run<Option<A>, A, boolean> {
  const p = call(predicate, a, "predicate");
  return { result: p.output ? some(a) : none, trace: { calls: [p.call], skipped: [] } };
}

export function fromPredicateEither<E, A>(predicate: (a: A) => boolean, onFalse: (a: A) => E, a: A): Run<Either<E, A>, A, boolean | E> {
  const p = call(predicate, a, "predicate");
  if (p.output) return { result: right(a), trace: { calls: [p.call], skipped: [] } };
  const e = call(onFalse, a, "onFalse");
  return { result: left(e.output), trace: { calls: [p.call, e.call], skipped: [] } };
}

// tryCatch: run the computation once. A throw becomes the failure case; for
// Either, onThrow turns the thrown value into an error, and runs only then.
type Thrown = { readonly threw: true; readonly error: unknown } | { readonly threw: false; readonly value: unknown };

function attempt<A>(f: () => A): { outcome: Thrown; value?: A; call: Call<undefined, unknown> } {
  try {
    const value = f();
    return { outcome: { threw: false, value }, value, call: { index: 0, input: undefined, output: value, fn: "thunk" } };
  } catch (error) {
    return { outcome: { threw: true, error }, call: { index: 0, input: undefined, output: error, fn: "thunk" } };
  }
}

export function tryCatchOption<A>(f: () => A): Run<Option<A>, undefined, unknown> {
  const t = attempt(f);
  return { result: t.outcome.threw ? none : some(t.value as A), trace: { calls: [t.call], skipped: [] } };
}

export function tryCatchEither<E, A>(f: () => A, onThrow: (error: unknown) => E): Run<Either<E, A>, unknown, unknown> {
  const t = attempt(f);
  if (!t.outcome.threw) return { result: right(t.value as A), trace: { calls: [t.call], skipped: [] } };
  const e = call(onThrow, t.outcome.error, "onThrow");
  return { result: left(e.output), trace: { calls: [t.call, e.call], skipped: [] } };
}
