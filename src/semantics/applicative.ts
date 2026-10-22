import {
  concatNonEmpty,
  failure,
  left,
  none,
  right,
  some,
  success,
  type Either,
  type Option,
  type Validation,
} from "./receivers";

// A small HKT encoding (URI -> type) so laws and traverse can be written once
// for every receiver.
export interface URItoKind<E, A> {
  readonly Identity: A;
  readonly Option: Option<A>;
  readonly Either: Either<E, A>;
  readonly Validation: Validation<E, A>;
}

export type URIS = keyof URItoKind<unknown, unknown>;
export type Kind<F extends URIS, E, A> = URItoKind<E, A>[F];

export interface Applicative<F extends URIS> {
  readonly URI: F;
  readonly of: <E, A>(a: A) => Kind<F, E, A>;
  readonly map: <E, A, B>(fa: Kind<F, E, A>, f: (a: A) => B) => Kind<F, E, B>;
  readonly ap: <E, A, B>(fab: Kind<F, E, (a: A) => B>, fa: Kind<F, E, A>) => Kind<F, E, B>;
}

export const IdentityApplicative: Applicative<"Identity"> = {
  URI: "Identity",
  of: (a) => a,
  map: (fa, f) => f(fa),
  ap: (fab, fa) => fab(fa),
};

export const OptionApplicative: Applicative<"Option"> = {
  URI: "Option",
  of: (a) => some(a),
  map: (fa, f) => (fa.tag === "some" ? some(f(fa.value)) : none),
  ap: (fab, fa) => (fab.tag === "some" && fa.tag === "some" ? some(fab.value(fa.value)) : none),
};

// Either's applicative keeps the first Left: the function side wins when both fail.
export const EitherApplicative: Applicative<"Either"> = {
  URI: "Either",
  of: (a) => right(a),
  map: (fa, f) => (fa.tag === "right" ? right(f(fa.value)) : fa),
  ap: (fab, fa) => {
    if (fab.tag === "left") return fab;
    if (fa.tag === "left") return fa;
    return right(fab.value(fa.value));
  },
};

// Validation's applicative accumulates: both sides' errors survive, left first.
export const ValidationApplicative: Applicative<"Validation"> = {
  URI: "Validation",
  of: (a) => success(a),
  map: (fa, f) => (fa.tag === "success" ? success(f(fa.value)) : fa),
  ap: (fab, fa) => {
    if (fab.tag === "failure" && fa.tag === "failure") return failure(concatNonEmpty(fab.errors, fa.errors));
    if (fab.tag === "failure") return fab;
    if (fa.tag === "failure") return fa;
    return success(fab.value(fa.value));
  },
};

// The lawful reference traverse over arrays. Every f(a) is evaluated, as with
// any applicative traverse over a strict language; the applicative decides
// which failures survive.
export const traverseArray =
  <F extends URIS>(F: Applicative<F>) =>
  <E, A, B>(as: readonly A[], f: (a: A) => Kind<F, E, B>): Kind<F, E, readonly B[]> =>
    as.reduce<Kind<F, E, readonly B[]>>(
      (acc, a) =>
        F.ap(
          F.map(acc, (bs: readonly B[]) => (b: B): readonly B[] => [...bs, b]),
          f(a),
        ),
      F.of<E, readonly B[]>([]),
    );

export const sequenceArray =
  <F extends URIS>(F: Applicative<F>) =>
  <E, A>(fas: readonly Kind<F, E, A>[]): Kind<F, E, readonly A[]> =>
    traverseArray(F)(fas, (fa) => fa);

export { left, right, some, none, success, failure };
