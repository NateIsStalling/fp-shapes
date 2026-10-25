import { describe, expect, it } from "vitest";
import { instantiate, markType, tokenize } from "./signature";

describe("signature", () => {
  it("fills applied type variables only", () => {
    expect(instantiate("(A → F<B>) → T<A> → F<T<B>>", { F: "Either", T: "List" })).toBe("(A → Either<E, B>) → List<A> → Either<E, List<B>>");
    expect(instantiate("(E → E₂) → P<E, A> → P<E₂, A>", { P: "Validation" })).toBe("(E → E₂) → Validation<E, A> → Validation<E₂, A>");
    expect(instantiate("(A → B) → F<A> → F<B>", {})).toBe("(A → B) → F<A> → F<B>");
    expect(instantiate("T<F<A>> → F<T<A>>", { F: "Option", T: "List" })).toBe("List<Option<A>> → Option<List<A>>");
  });
  it("tokenizes the receiver's variable", () => {
    expect(tokenize("F<A> → F<B>", "F").filter((t) => t.isVar)).toHaveLength(2);
    expect(tokenize("T<A> → F<T<B>>", "F").map((t) => t.text).join("")).toBe("T<A> → F<T<B>>");
  });
});

describe("markType", () => {
  it("marks the filled-in type and keeps the text intact", () => {
    const parts = markType("(A → Either<E, B>) → List<A> → Either<E, List<B>>", "Either");
    expect(parts.filter((p) => p.isType)).toHaveLength(2);
    expect(parts.map((p) => p.text).join("")).toBe("(A → Either<E, B>) → List<A> → Either<E, List<B>>");
  });
});
