import { none, type Either, type Option, type Validation } from "./receivers";
import { call, noCalls, type Call, type Run } from "./trace";

// Sequencing: chain a step that returns the same kind of container.

export function flatMapOption<A, B>(fa: Option<A>, f: (a: A) => Option<B>): Run<Option<B>, A, Option<B>> {
  if (fa.tag === "none") return { result: none, trace: noCalls };
  const c = call(f, fa.value);
  return { result: c.output, trace: { calls: [c.call], skipped: [] } };
}

export function flatMapEither<E, A, B>(fa: Either<E, A>, f: (a: A) => Either<E, B>): Run<Either<E, B>, A, Either<E, B>> {
  if (fa.tag === "left") return { result: fa, trace: noCalls };
  const c = call(f, fa.value);
  return { result: c.output, trace: { calls: [c.call], skipped: [] } };
}

// List flatMap concatenates the inner lists, so the length can change.
export function flatMapList<A, B>(as: readonly A[], f: (a: A) => readonly B[]): Run<readonly B[], A, readonly B[]> {
  const calls = as.map((a, index) => call(f, a, undefined, index).call);
  return { result: calls.flatMap((c) => c.output), trace: { calls, skipped: [] } };
}

// flatten removes one layer. No function runs.
export const flattenOption = <A>(ffa: Option<Option<A>>): Run<Option<A>> => ({ result: ffa.tag === "some" ? ffa.value : none, trace: noCalls });
export const flattenEither = <E, A>(ffa: Either<E, Either<E, A>>): Run<Either<E, A>> => ({ result: ffa.tag === "right" ? ffa.value : ffa, trace: noCalls });
export const flattenList = <A>(ass: readonly (readonly A[])[]): Run<readonly A[]> => ({ result: ass.flat() as readonly A[], trace: noCalls });

// tap (effectful): run a step for its effect and keep the original value.
// The step can fail, and its failure replaces the result.
export function tapOption<A>(fa: Option<A>, f: (a: A) => Option<unknown>): Run<Option<A>, A, Option<unknown>> {
  if (fa.tag === "none") return { result: none, trace: noCalls };
  const c = call(f, fa.value);
  return { result: c.output.tag === "none" ? none : fa, trace: { calls: [c.call], skipped: [] } };
}

export function tapEither<E, A>(fa: Either<E, A>, f: (a: A) => Either<E, unknown>): Run<Either<E, A>, A, Either<E, unknown>> {
  if (fa.tag === "left") return { result: fa, trace: noCalls };
  const c = call(f, fa.value);
  return { result: c.output.tag === "left" ? c.output : fa, trace: { calls: [c.call], skipped: [] } };
}

// peek (side effect only): observe the value. It cannot change the result.
type Peeked = Option<unknown> | Either<unknown, unknown> | Validation<unknown, unknown>;
function valueOf(fa: Peeked): { has: true; value: unknown } | { has: false } {
  if (fa.tag === "some" || fa.tag === "right" || fa.tag === "success") return { has: true, value: fa.value };
  return { has: false };
}

export function peek<F extends Peeked>(fa: F, f: (a: unknown) => void): Run<F, unknown, void> {
  const v = valueOf(fa);
  if (!v.has) return { result: fa, trace: noCalls };
  const c = call(f, v.value);
  return { result: fa, trace: { calls: [c.call], skipped: [] } };
}

export function peekList<A>(as: readonly A[], f: (a: A) => void): Run<readonly A[], A, void> {
  const calls: Call<A, void>[] = as.map((a, index) => call(f, a, undefined, index).call);
  return { result: as, trace: { calls, skipped: [] } };
}

