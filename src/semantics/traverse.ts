import {
  concatNonEmpty,
  failure,
  left,
  none,
  right,
  some,
  success,
  type Either,
  type NonEmpty,
  type Option,
  type Validation,
} from "./receivers";

// Instrumented traverse: the same results as the lawful traverseArray, plus a
// trace of which calls happened. Ecosystems differ in *when they stop calling
// f*, so that difference is modeled as named variants.

export type TraverseReceiver = "option" | "either" | "validation";

export type TraverseVariant =
  | "stop-at-first" // monadic: f is not called after the first failure
  | "call-all-first-wins" // applicative over a strict Either: every call happens, the first failure survives
  | "accumulate"; // Validation: every call happens, every failure survives

export const traverseVariants: Readonly<Record<TraverseReceiver, readonly TraverseVariant[]>> = {
  option: ["stop-at-first", "call-all-first-wins"],
  either: ["stop-at-first", "call-all-first-wins"],
  validation: ["accumulate"],
};

export interface Call<A, R> {
  readonly index: number;
  readonly input: A;
  readonly output: R;
}

export interface Trace<A, R> {
  readonly calls: readonly Call<A, R>[];
  readonly skipped: readonly number[];
}

export interface Run<Result, A, R> {
  readonly result: Result;
  readonly trace: Trace<A, R>;
}

type Outcome<E, B> = { readonly ok: true; readonly value: B } | { readonly ok: false; readonly error: E };

// Shared walker. `isFailure` and `stopOnFailure` are the only knobs.
function walk<A, R, E, B>(
  as: readonly A[],
  f: (a: A) => R,
  read: (r: R) => Outcome<E, B>,
  stopOnFailure: boolean,
): { calls: Call<A, R>[]; skipped: number[]; values: B[]; errors: E[] } {
  const calls: Call<A, R>[] = [];
  const skipped: number[] = [];
  const values: B[] = [];
  const errors: E[] = [];
  let stopped = false;
  as.forEach((input, index) => {
    if (stopped) {
      skipped.push(index);
      return;
    }
    const output = f(input);
    calls.push({ index, input, output });
    const o = read(output);
    if (o.ok) values.push(o.value);
    else {
      errors.push(o.error);
      if (stopOnFailure) stopped = true;
    }
  });
  return { calls, skipped, values, errors };
}

export function traverseEither<A, E, B>(
  variant: "stop-at-first" | "call-all-first-wins",
  as: readonly A[],
  f: (a: A) => Either<E, B>,
): Run<Either<E, readonly B[]>, A, Either<E, B>> {
  const w = walk(as, f, (r): Outcome<E, B> => (r.tag === "right" ? { ok: true, value: r.value } : { ok: false, error: r.error }), variant === "stop-at-first");
  const [first] = w.errors;
  const result: Either<E, readonly B[]> = w.errors.length > 0 ? left(first as E) : right(w.values);
  return { result, trace: { calls: w.calls, skipped: w.skipped } };
}

export function traverseOption<A, B>(
  variant: "stop-at-first" | "call-all-first-wins",
  as: readonly A[],
  f: (a: A) => Option<B>,
): Run<Option<readonly B[]>, A, Option<B>> {
  const w = walk(as, f, (r): Outcome<null, B> => (r.tag === "some" ? { ok: true, value: r.value } : { ok: false, error: null }), variant === "stop-at-first");
  const result: Option<readonly B[]> = w.errors.length > 0 ? none : some(w.values);
  return { result, trace: { calls: w.calls, skipped: w.skipped } };
}

export function traverseValidation<A, E, B>(
  as: readonly A[],
  f: (a: A) => Validation<E, B>,
): Run<Validation<E, readonly B[]>, A, Validation<E, B>> {
  const w = walk(
    as,
    f,
    (r): Outcome<NonEmpty<E>, B> => (r.tag === "success" ? { ok: true, value: r.value } : { ok: false, error: r.errors }),
    false,
  );
  const [first, ...rest] = w.errors;
  const result: Validation<E, readonly B[]> =
    first === undefined ? success(w.values) : failure(rest.reduce((acc, e) => concatNonEmpty(acc, e), first));
  return { result, trace: { calls: w.calls, skipped: w.skipped } };
}
