import { concatNonEmpty, failure, left, type Either, type NonEmpty, type Option, type Validation } from "./receivers";
import { call, noCalls, type Run } from "./trace";

// Error handling: the failure side changes, gets replaced, or is eliminated.

export function mapErrorEither<E, A, E2>(fa: Either<E, A>, f: (e: E) => E2): Run<Either<E2, A>, E, E2> {
  if (fa.tag === "right") return { result: fa, trace: noCalls };
  const c = call(f, fa.error);
  return { result: left(c.output), trace: { calls: [c.call], skipped: [] } };
}

export function mapErrorValidation<E, A, E2>(fa: Validation<E, A>, f: (e: E) => E2): Run<Validation<E2, A>, E, E2> {
  if (fa.tag === "success") return { result: fa, trace: noCalls };
  const calls = fa.errors.map((e, index) => call(f, e, undefined, index).call);
  return { result: failure(calls.map((c) => c.output) as unknown as NonEmpty<E2>), trace: { calls, skipped: [] } };
}

// recover: only the failure path enters the handler, and it may change the
// error type (E -> E2).
export function recoverEither<E, A, E2>(fa: Either<E, A>, handler: (e: E) => Either<E2, A>): Run<Either<E2, A>, E, Either<E2, A>> {
  if (fa.tag === "right") return { result: fa, trace: noCalls };
  const c = call(handler, fa.error);
  return { result: c.output, trace: { calls: [c.call], skipped: [] } };
}

// alt: the first success wins; the fallback is only evaluated when needed.
export function altOption<A>(fa: Option<A>, fallback: () => Option<A>): Run<Option<A>, void, Option<A>> {
  if (fa.tag === "some") return { result: fa, trace: noCalls };
  const c = call(fallback, undefined, "fallback");
  return { result: c.output, trace: { calls: [c.call], skipped: [] } };
}

export function altEither<E, A>(fa: Either<E, A>, fallback: () => Either<E, A>): Run<Either<E, A>, void, Either<E, A>> {
  if (fa.tag === "right") return { result: fa, trace: noCalls };
  const c = call(fallback, undefined, "fallback");
  return { result: c.output, trace: { calls: [c.call], skipped: [] } };
}

// Validation's alt keeps every failure when both sides fail.
export function altValidation<E, A>(fa: Validation<E, A>, fallback: () => Validation<E, A>): Run<Validation<E, A>, void, Validation<E, A>> {
  if (fa.tag === "success") return { result: fa, trace: noCalls };
  const c = call(fallback, undefined, "fallback");
  const fb = c.output;
  return { result: fb.tag === "failure" ? failure(concatNonEmpty(fa.errors, fb.errors)) : fb, trace: { calls: [c.call], skipped: [] } };
}

// List's alt is concatenation, so the fallback always runs.
export function altList<A>(as: readonly A[], fallback: () => readonly A[]): Run<readonly A[], void, readonly A[]> {
  const c = call(fallback, undefined, "fallback");
  return { result: [...as, ...c.output], trace: { calls: [c.call], skipped: [] } };
}

// getOrElse leaves the context. Two variants: a constant default (no call),
// or a default computed from the error (called only on failure).
export const getOrElseOption = <A>(fa: Option<A>, fallback: A): Run<A> => ({ result: fa.tag === "some" ? fa.value : fallback, trace: noCalls });

export function getOrElseOptionWith<A>(fa: Option<A>, fallback: () => A): Run<A, void, A> {
  if (fa.tag === "some") return { result: fa.value, trace: noCalls };
  const c = call(fallback, undefined, "fallback");
  return { result: c.output, trace: { calls: [c.call], skipped: [] } };
}

export const getOrElseEither = <E, A>(fa: Either<E, A>, fallback: A): Run<A> => ({ result: fa.tag === "right" ? fa.value : fallback, trace: noCalls });

export function getOrElseEitherWith<E, A>(fa: Either<E, A>, fallback: (e: E) => A): Run<A, E, A> {
  if (fa.tag === "right") return { result: fa.value, trace: noCalls };
  const c = call(fallback, fa.error, "fallback");
  return { result: c.output, trace: { calls: [c.call], skipped: [] } };
}
