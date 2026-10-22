// Every operation returns its result plus a trace of the function calls it
// made. Scenes draw from the trace: which calls happened, which were skipped.

export interface Call<A, R> {
  readonly index: number;
  readonly input: A;
  readonly output: R;
  // Which function ran, when an operation takes more than one (e.g. bimap's
  // "left" / "right", match's "none" / "some").
  readonly fn?: string;
}

export interface Trace<A, R> {
  readonly calls: readonly Call<A, R>[];
  readonly skipped: readonly number[];
}

export interface Run<Result, A = unknown, R = unknown> {
  readonly result: Result;
  readonly trace: Trace<A, R>;
}

export const noCalls: Trace<never, never> = { calls: [], skipped: [] };

// Call f once and record it.
export function call<A, R>(f: (a: A) => R, input: A, fn?: string, index = 0): { output: R; call: Call<A, R> } {
  const output = f(input);
  return { output, call: fn === undefined ? { index, input, output } : { index, input, output, fn } };
}
