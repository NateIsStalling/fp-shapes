import { describe, expect, it } from "vitest";
import { describeTypes } from "./ribbon";
import { errorsOf, parseFn, parseType, showType, spine } from "./types";

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
  it("flatten: a repeated error type is not a change", () => {
    expect(describeTypes("Either<E, Either<E, A>>", "Either<E, A>").caption).toBe("One `Either` layer is removed. The payload stays `A`.");
  });
});

describe("parseFn", () => {
  const v = (name: string) => ({ kind: "var", name });
  it("reads a plain function", () => {
    expect(parseFn("A → bool")).toEqual([{ kind: "fn", args: [v("A")], out: v("bool") }]);
  });
  it("reads a thunk as a function of no arguments", () => {
    expect(parseFn("() → Option<A>")).toEqual([{ kind: "fn", args: [], out: { kind: "app", ctor: "Option", args: [v("A")] } }]);
  });
  it("reads two functions", () => {
    expect(parseFn("(E → E₂) × (A → B)")).toEqual([{ kind: "fn", args: [v("E")], out: v("E₂") }, { kind: "fn", args: [v("A")], out: v("B") }]);
  });
  it("reads a value and a function of two arguments, filling in the error side", () => {
    expect(parseFn("Either<B> × ((A, B) → C)")).toEqual([
      { kind: "value", type: { kind: "app", ctor: "Either", args: [v("E"), v("B")] } },
      { kind: "fn", args: [v("A"), v("B")], out: v("C") },
    ]);
  });
  it("keeps an error side that is already written", () => {
    expect(parseFn("E → Either<E₂, A>")).toEqual([{ kind: "fn", args: [v("E")], out: { kind: "app", ctor: "Either", args: [v("E₂"), v("A")] } }]);
  });
});
