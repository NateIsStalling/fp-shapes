import { failure, left, none, right, some, success, type Either, type Option, type Validation } from "./receivers";
import { call, noCalls, type Run } from "./trace";

// Mapping: the container stays, the payload changes.

export type Tuple<A, B> = readonly [A, B];

export function mapOption<A, B>(fa: Option<A>, f: (a: A) => B): Run<Option<B>, A, B> {
  if (fa.tag === "none") return { result: none, trace: noCalls };
  const c = call(f, fa.value);
  return { result: some(c.output), trace: { calls: [c.call], skipped: [] } };
}

export function mapEither<E, A, B>(fa: Either<E, A>, f: (a: A) => B): Run<Either<E, B>, A, B> {
  if (fa.tag === "left") return { result: fa, trace: noCalls };
  const c = call(f, fa.value);
  return { result: right(c.output), trace: { calls: [c.call], skipped: [] } };
}

export function mapValidation<E, A, B>(fa: Validation<E, A>, f: (a: A) => B): Run<Validation<E, B>, A, B> {
  if (fa.tag === "failure") return { result: fa, trace: noCalls };
  const c = call(f, fa.value);
  return { result: success(c.output), trace: { calls: [c.call], skipped: [] } };
}

export function mapList<A, B>(as: readonly A[], f: (a: A) => B): Run<readonly B[], A, B> {
  const calls = as.map((a, index) => call(f, a, undefined, index).call);
  return { result: calls.map((c) => c.output), trace: { calls, skipped: [] } };
}

// bimap on a sum runs exactly one function; on a product (Tuple) it runs both.
export function bimapEither<E, A, E2, B>(fa: Either<E, A>, onLeft: (e: E) => E2, onRight: (a: A) => B): Run<Either<E2, B>> {
  if (fa.tag === "left") {
    const c = call(onLeft, fa.error, "left");
    return { result: left(c.output), trace: { calls: [c.call], skipped: [] } };
  }
  const c = call(onRight, fa.value, "right");
  return { result: right(c.output), trace: { calls: [c.call], skipped: [] } };
}

export function bimapValidation<E, A, E2, B>(
  fa: Validation<E, A>,
  onFailure: (e: E) => E2,
  onSuccess: (a: A) => B,
): Run<Validation<E2, B>> {
  if (fa.tag === "failure") {
    const calls = fa.errors.map((e, index) => call(onFailure, e, "left", index).call);
    const [first, ...rest] = calls.map((c) => c.output);
    return { result: failure([first as E2, ...rest]), trace: { calls, skipped: [] } };
  }
  const c = call(onSuccess, fa.value, "right");
  return { result: success(c.output), trace: { calls: [c.call], skipped: [] } };
}

export function bimapTuple<A, B, C, D>(t: Tuple<A, B>, f: (a: A) => C, g: (b: B) => D): Run<Tuple<C, D>> {
  const first = call(f, t[0], "first");
  const second = call(g, t[1], "second");
  return { result: [first.output, second.output], trace: { calls: [first.call, second.call], skipped: [] } };
}
