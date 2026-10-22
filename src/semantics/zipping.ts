import { concatNonEmpty, failure, none, right, some, success, type Either, type Option, type Validation } from "./receivers";
import { call, noCalls, type Call, type Run } from "./trace";

// Zipping: two independent containers combine into one. Which failure
// survives, and how list elements pair up, depends on the receiver.

export function zipWithOption<A, B, C>(fa: Option<A>, fb: Option<B>, f: (a: A, b: B) => C): Run<Option<C>> {
  if (fa.tag === "none" || fb.tag === "none") return { result: none, trace: noCalls };
  const c = call(([a, b]: readonly [A, B]) => f(a, b), [fa.value, fb.value] as const);
  return { result: some(c.output), trace: { calls: [c.call], skipped: [] } };
}

// Either keeps the first Left, reading left to right.
export function zipWithEither<E, A, B, C>(fa: Either<E, A>, fb: Either<E, B>, f: (a: A, b: B) => C): Run<Either<E, C>> {
  if (fa.tag === "left") return { result: fa, trace: noCalls };
  if (fb.tag === "left") return { result: fb, trace: noCalls };
  const c = call(([a, b]: readonly [A, B]) => f(a, b), [fa.value, fb.value] as const);
  return { result: right(c.output), trace: { calls: [c.call], skipped: [] } };
}

// Validation keeps every failure, left's errors first.
export function zipWithValidation<E, A, B, C>(fa: Validation<E, A>, fb: Validation<E, B>, f: (a: A, b: B) => C): Run<Validation<E, C>> {
  if (fa.tag === "failure" && fb.tag === "failure") return { result: failure(concatNonEmpty(fa.errors, fb.errors)), trace: noCalls };
  if (fa.tag === "failure") return { result: fa, trace: noCalls };
  if (fb.tag === "failure") return { result: fb, trace: noCalls };
  const c = call(([a, b]: readonly [A, B]) => f(a, b), [fa.value, fb.value] as const);
  return { result: success(c.output), trace: { calls: [c.call], skipped: [] } };
}

// List's applicative: every combination, outer loop over the first list.
export function zipWithListCartesian<A, B, C>(as: readonly A[], bs: readonly B[], f: (a: A, b: B) => C): Run<readonly C[]> {
  const calls: Call<readonly [A, B], C>[] = [];
  for (const a of as) for (const b of bs) calls.push(call(([x, y]: readonly [A, B]) => f(x, y), [a, b] as const, undefined, calls.length).call);
  return { result: calls.map((c) => c.output), trace: { calls, skipped: [] } };
}

// ZipList / zipWith: pair by position and stop at the shorter list.
export function zipWithListPositional<A, B, C>(as: readonly A[], bs: readonly B[], f: (a: A, b: B) => C): Run<readonly C[]> {
  const n = Math.min(as.length, bs.length);
  const calls: Call<readonly [A, B], C>[] = [];
  for (let i = 0; i < n; i++) calls.push(call(([x, y]: readonly [A, B]) => f(x, y), [as[i] as A, bs[i] as B] as const, undefined, i).call);
  const longer = Math.max(as.length, bs.length);
  const skipped = Array.from({ length: longer - n }, (_, k) => n + k);
  return { result: calls.map((c) => c.output), trace: { calls, skipped } };
}
