import { describe, expect, it } from "vitest";
import { instantiate, tokenize } from "./signature";

describe("signature", () => {
  it("fills applied type variables only", () => {
    expect(instantiate("(A → F<B>) → T<A> → F<T<B>>", { F: "Either", T: "List" })).toBe("(A → Either<B>) → List<A> → Either<List<B>>");
    expect(instantiate("(E → E₂) → P<E, A> → P<E₂, A>", { P: "Validation" })).toBe("(E → E₂) → Validation<E, A> → Validation<E₂, A>");
    expect(instantiate("(A → B) → F<A> → F<B>", {})).toBe("(A → B) → F<A> → F<B>");
  });
  it("tokenizes the receiver's variable", () => {
    expect(tokenize("F<A> → F<B>", "F").filter((t) => t.isVar)).toHaveLength(2);
    expect(tokenize("T<A> → F<T<B>>", "F").map((t) => t.text).join("")).toBe("T<A> → F<T<B>>");
  });
});
