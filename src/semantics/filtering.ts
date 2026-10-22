import { none, some, type Option } from "./receivers";
import { call, noCalls, type Call, type Run } from "./trace";

// Filterable: keep some elements, by a test or by a function that may return
// nothing. The predicate (or f) runs once per element, in order.

export function filterList<A>(as: readonly A[], predicate: (a: A) => boolean): Run<readonly A[], A, boolean> {
  const calls = as.map((a, i) => call(predicate, a, undefined, i).call);
  return { result: as.filter((_, i) => calls[i]?.output), trace: { calls, skipped: [] } };
}

// f returns an Option: None is dropped, Some is unwrapped.
export function filterMapList<A, B>(as: readonly A[], f: (a: A) => Option<B>): Run<readonly B[], A, Option<B>> {
  const calls: Call<A, Option<B>>[] = as.map((a, i) => call(f, a, undefined, i).call);
  return { result: calls.flatMap((c) => (c.output.tag === "some" ? [c.output.value] : [])), trace: { calls, skipped: [] } };
}

// For Option, filterMap is flatMap with an Option-returning function.
export function filterMapOption<A, B>(fa: Option<A>, f: (a: A) => Option<B>): Run<Option<B>, A, Option<B>> {
  if (fa.tag === "none") return { result: none, trace: noCalls };
  const c = call(f, fa.value);
  return { result: c.output.tag === "some" ? some(c.output.value) : none, trace: { calls: [c.call], skipped: [] } };
}

// partition: every element lands on exactly one side, in order. The pair is
// (passes, fails), as in Haskell's Data.List.partition and Effect.
export function partitionList<A>(as: readonly A[], predicate: (a: A) => boolean): Run<readonly [readonly A[], readonly A[]], A, boolean> {
  const calls = as.map((a, i) => call(predicate, a, undefined, i).call);
  return { result: [as.filter((_, i) => calls[i]?.output), as.filter((_, i) => !calls[i]?.output)], trace: { calls, skipped: [] } };
}
