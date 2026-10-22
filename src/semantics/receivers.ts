// Receivers: the data shapes operations act on. Plain values, no classes, so
// scenes and tests can compare them structurally.

export type Option<A> =
  | { readonly tag: "none" }
  | { readonly tag: "some"; readonly value: A };

export type Either<E, A> =
  | { readonly tag: "left"; readonly error: E }
  | { readonly tag: "right"; readonly value: A };

export type NonEmpty<A> = readonly [A, ...A[]];

// Validation accumulates errors. Using a non-empty list fixes the Semigroup to
// concatenation, which is what the receiver lanes on the site need.
export type Validation<E, A> =
  | { readonly tag: "failure"; readonly errors: NonEmpty<E> }
  | { readonly tag: "success"; readonly value: A };

export const none: Option<never> = { tag: "none" };
export const some = <A>(value: A): Option<A> => ({ tag: "some", value });

export const left = <E>(error: E): Either<E, never> => ({ tag: "left", error });
export const right = <A>(value: A): Either<never, A> => ({ tag: "right", value });

export const failure = <E>(errors: NonEmpty<E>): Validation<E, never> => ({ tag: "failure", errors });
export const success = <A>(value: A): Validation<never, A> => ({ tag: "success", value });

export const concatNonEmpty = <E>(x: NonEmpty<E>, y: NonEmpty<E>): NonEmpty<E> => [...x, ...y] as unknown as NonEmpty<E>;
