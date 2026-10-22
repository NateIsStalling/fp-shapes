import { describe, expect, it } from "vitest";
import { diffLayers, typeOf } from "./ribbon";

describe("Shape Ribbon diff", () => {
  it("sequence swaps the two layers", () => {
    const d = diffLayers(["List", "Option", "A"], ["Option", "List", "A"]);
    expect(d.moved).toEqual(["List", "Option"]);
    expect(d.caption).toBe("`List` and `Option` swap places. The payload stays `A`.");
  });
  it("traverse moves List inside and introduces the effect", () => {
    const d = diffLayers(["List", "A"], ["Either", "List", "B"]);
    expect(d).toMatchObject({ moved: ["List"], introduced: ["Either"], payloadChanged: true });
  });
  it("flatten removes one of two identical layers", () => {
    expect(diffLayers(["F", "F", "A"], ["F", "A"]).caption).toBe("One `F` layer is removed. The payload stays `A`.");
  });
  it("match removes the container", () => {
    expect(diffLayers(["Either", "A"], ["R"])).toMatchObject({ removed: ["Either"], payloadChanged: true });
  });
  it("typeOf renders nested types", () => {
    expect(typeOf(["Option", "List", "B"])).toBe("Option<List<B>>");
  });
});

describe("product payloads", () => {
  it("a Tuple's payload reads as a pair", () => {
    expect(diffLayers(["Tuple", "A, X"], ["Tuple", "B, Y"]).caption).toBe("`Tuple` stays the same. The payload changes from `(A, X)` to `(B, Y)`.");
  });
});
