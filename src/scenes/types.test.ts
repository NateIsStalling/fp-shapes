import { describe, expect, it } from "vitest";
import { describeTypes } from "./ribbon";
import { errorsOf, parseType, showType, spine } from "./types";

describe("type expressions", () => {
  it("parse and print", () => {
    for (const s of ["A", "Option<A>", "Either<E, List<B>>", "Tuple<A, X>", "List<Either<E, A>>"]) expect(showType(parseType(s))).toBe(s);
  });
  it("follow the payload along the spine", () => {
    expect(spine(parseType("Either<E, List<B>>"))).toEqual(["Either", "List", "B"]);
    expect(spine(parseType("Tuple<A, X>"))).toEqual(["Tuple", "A, X"]);
    expect(errorsOf(parseType("List<Either<E, A>>"))).toEqual(["E"]);
  });
  it("reject malformed types", () => {
    expect(() => parseType("Either<E, A")).toThrow();
  });
});

describe("ribbon descriptions from types", () => {
  it("traverse: List moves inside and Either appears outside", () => {
    expect(describeTypes("List<A>", "Either<E, List<B>>").caption).toBe("`List` moves inside. `Either` is introduced on the outside. The payload changes from `A` to `B`.");
  });
  it("mapError: only the error side changes", () => {
    expect(describeTypes("Either<E, A>", "Either<E₂, A>").caption).toBe("`Either` stays the same. The error changes from `E` to `E₂`. The payload stays `A`.");
  });
});
