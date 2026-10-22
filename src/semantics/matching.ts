import { left, none, type Either, type NonEmpty, type Option, type Validation } from "./receivers";
import { call, type Run } from "./trace";

// Pattern matching: handle every case and leave the container.
// Exactly one handler runs.

export function matchOption<A, R>(fa: Option<A>, onNone: () => R, onSome: (a: A) => R): Run<R> {
  const c = fa.tag === "some" ? call(onSome, fa.value, "some") : call(onNone, undefined, "none");
  return { result: c.output, trace: { calls: [c.call], skipped: [] } };
}

export function matchEither<E, A, R>(fa: Either<E, A>, onLeft: (e: E) => R, onRight: (a: A) => R): Run<R> {
  const c = fa.tag === "right" ? call(onRight, fa.value, "right") : call(onLeft, fa.error, "left");
  return { result: c.output, trace: { calls: [c.call], skipped: [] } };
}

export function matchValidation<E, A, R>(fa: Validation<E, A>, onFailure: (es: NonEmpty<E>) => R, onSuccess: (a: A) => R): Run<R> {
  const c = fa.tag === "success" ? call(onSuccess, fa.value, "success") : call(onFailure, fa.errors, "failure");
  return { result: c.output, trace: { calls: [c.call], skipped: [] } };
}

// Filtering: a success that fails the predicate becomes a failure.
// Option has no error to report, so it becomes None.
export function filterOption<A>(fa: Option<A>, predicate: (a: A) => boolean): Run<Option<A>> {
  if (fa.tag === "none") return { result: fa, trace: { calls: [], skipped: [] } };
  const c = call(predicate, fa.value, "predicate");
  return { result: c.output ? fa : none, trace: { calls: [c.call], skipped: [] } };
}

export function filterOrElseEither<E, A>(fa: Either<E, A>, predicate: (a: A) => boolean, onFalse: (a: A) => E): Run<Either<E, A>> {
  if (fa.tag === "left") return { result: fa, trace: { calls: [], skipped: [] } };
  const p = call(predicate, fa.value, "predicate");
  if (p.output) return { result: fa, trace: { calls: [p.call], skipped: [] } };
  const e = call(onFalse, fa.value, "onFalse");
  return { result: left(e.output), trace: { calls: [p.call, e.call], skipped: [] } };
}
