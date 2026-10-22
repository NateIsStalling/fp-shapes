import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  EitherApplicative,
  IdentityApplicative,
  ListApplicative,
  OptionApplicative,
  ValidationApplicative,
  sequenceArray,
  traverseArray,
  type Applicative,
  type Kind,
  type URIS,
} from "./applicative";
import { failure, left, none, right, some, success, type Either, type NonEmpty, type Option } from "./receivers";

// Laws as stated in the Haskell base docs (Data.Functor, Control.Applicative,
// Data.Traversable, base-4.22.0.0), checked against the reference instances.

type Wrap<F extends URIS> = <T>(arb: fc.Arbitrary<T>) => fc.Arbitrary<Kind<F, string, T>>;

const wrapOption: Wrap<"Option"> = (arb) => fc.oneof(fc.constant(none), arb.map((v) => some(v)));
const wrapEither: Wrap<"Either"> = (arb) =>
  fc.oneof(fc.string({ maxLength: 3 }).map((e) => left(e)), arb.map((v) => right(v)));
const wrapValidation: Wrap<"Validation"> = (arb) =>
  fc.oneof(
    fc.array(fc.string({ maxLength: 3 }), { minLength: 1, maxLength: 3 }).map((es) => failure(es as unknown as NonEmpty<string>)),
    arb.map((v) => success(v)),
  );

const wrapList: Wrap<"List"> = (arb) => fc.array(arb, { maxLength: 3 });

const int = fc.integer({ min: -50, max: 50 });
const intFn = fc.func(int);

function functorAndApplicativeLaws<F extends URIS>(F: Applicative<F>, wrap: Wrap<F>) {
  describe(`${F.URI} functor laws`, () => {
    it("identity: fmap id == id", () => {
      fc.assert(fc.property(wrap(int), (fa) => void expect(F.map(fa, (x) => x)).toEqual(fa)));
    });
    it("composition: fmap (f . g) == fmap f . fmap g", () => {
      fc.assert(
        fc.property(wrap(int), intFn, intFn, (fa, f, g) =>
          void expect(F.map(fa, (x: number) => f(g(x)))).toEqual(F.map(F.map(fa, g), f)),
        ),
      );
    });
  });

  describe(`${F.URI} applicative laws`, () => {
    const of = <A>(a: A) => F.of<string, A>(a);
    it("identity: pure id <*> v = v", () => {
      fc.assert(fc.property(wrap(int), (v) => void expect(F.ap(of((x: number) => x), v)).toEqual(v)));
    });
    it("homomorphism: pure f <*> pure x = pure (f x)", () => {
      fc.assert(fc.property(intFn, int, (f, x) => void expect(F.ap(of(f), of(x))).toEqual(of(f(x)))));
    });
    it("interchange: u <*> pure y = pure ($ y) <*> u", () => {
      fc.assert(
        fc.property(wrap(intFn), int, (u, y) =>
          void expect(F.ap(u, of(y))).toEqual(F.ap(of((f: (n: number) => number) => f(y)), u)),
        ),
      );
    });
    it("composition: pure (.) <*> u <*> v <*> w = u <*> (v <*> w)", () => {
      const compose = (f: (n: number) => number) => (g: (n: number) => number) => (x: number) => f(g(x));
      fc.assert(
        fc.property(wrap(intFn), wrap(intFn), wrap(int), (u, v, w) =>
          void expect(F.ap(F.ap(F.ap(of(compose), u), v), w)).toEqual(F.ap(u, F.ap(v, w))),
        ),
      );
    });
  });

  describe(`${F.URI} traversable laws (array)`, () => {
    it("purity: traverse pure = pure", () => {
      fc.assert(fc.property(fc.array(int, { maxLength: 6 }), (xs) => void expect(traverseArray(F)(xs, (x) => F.of<string, number>(x))).toEqual(F.of(xs))));
    });
    it("sequence = traverse id", () => {
      fc.assert(
        fc.property(fc.array(wrap(int), { maxLength: 6 }), (fas) =>
          void expect(sequenceArray(F)(fas)).toEqual(traverseArray(F)(fas, (fa) => fa)),
        ),
      );
    });
  });
}

functorAndApplicativeLaws(OptionApplicative, wrapOption);
functorAndApplicativeLaws(EitherApplicative, wrapEither);
functorAndApplicativeLaws(ValidationApplicative, wrapValidation);
functorAndApplicativeLaws(ListApplicative, wrapList);

describe("traversable laws that need two applicatives", () => {
  const xs = fc.array(int, { maxLength: 6 });
  const eitherFn = fc.func(wrapEither(int));
  const optionFn = fc.func(wrapOption(int));

  it("identity: traverse Identity = Identity", () => {
    fc.assert(fc.property(xs, (as) => void expect(traverseArray(IdentityApplicative)(as, (a) => a)).toEqual(as)));
  });

  // t is an applicative transformation Either -> Option: t (pure x) = pure x, t (f <*> x) = t f <*> t x.
  const t = <A>(e: Either<string, A>): Option<A> => (e.tag === "right" ? some(e.value) : none);

  it("t is an applicative transformation (precondition for naturality)", () => {
    fc.assert(
      fc.property(wrapEither(intFn), wrapEither(int), (ff, fa) =>
        void expect(t(EitherApplicative.ap(ff, fa))).toEqual(OptionApplicative.ap(t(ff), t(fa))),
      ),
    );
  });

  it("naturality: t . traverse f = traverse (t . f)", () => {
    fc.assert(
      fc.property(xs, eitherFn, (as, f) =>
        void expect(t(traverseArray(EitherApplicative)(as, f))).toEqual(traverseArray(OptionApplicative)(as, (a) => t(f(a)))),
      ),
    );
  });

  it("composition: traverse (Compose . fmap g . f) = Compose . fmap (traverse g) . traverse f", () => {
    // Compose Option (Either string): ap lifts Either's ap through Option.
    type C<A> = Option<Either<string, A>>;
    const C = {
      of: <A>(a: A): C<A> => some(right(a)),
      map: <A, B>(fa: C<A>, f: (a: A) => B): C<B> => OptionApplicative.map(fa, (ea) => EitherApplicative.map(ea, f)),
      ap: <A, B>(fab: C<(a: A) => B>, fa: C<A>): C<B> =>
        OptionApplicative.ap(
          OptionApplicative.map(fab, (eab: Either<string, (a: A) => B>) => (ea: Either<string, A>) => EitherApplicative.ap(eab, ea)),
          fa,
        ),
    };
    const traverseC = <A, B>(as: readonly A[], f: (a: A) => C<B>): C<readonly B[]> =>
      as.reduce<C<readonly B[]>>((acc, a) => C.ap(C.map(acc, (bs: readonly B[]) => (b: B): readonly B[] => [...bs, b]), f(a)), C.of([]));

    fc.assert(
      fc.property(xs, optionFn, eitherFn, (as, f, g) => {
        const lhs = traverseC(as, (a) => OptionApplicative.map(f(a), g));
        const rhs = OptionApplicative.map(traverseArray(OptionApplicative)(as, f), (bs) => traverseArray(EitherApplicative)(bs, g));
        expect(lhs).toEqual(rhs);
      }),
    );
  });
});
