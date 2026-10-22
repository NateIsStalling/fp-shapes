import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { filterList, filterMapList, filterMapOption, partitionList } from "./filtering";
import { flatMapOption } from "./sequencing";
import { none, some } from "./receivers";

const p = (n: number) => n % 3 !== 0;

describe("filter, filterMap, partition", () => {
  it("filter keeps passing elements in order and calls the predicate once per element", () => {
    const r = filterList([1, 2, 3, 4], (n) => n % 2 === 0);
    expect(r.result).toEqual([2, 4]);
    expect(r.trace.calls.map((c) => c.input)).toEqual([1, 2, 3, 4]);
  });

  it("filter is filterMap with a function that keeps or drops", () => {
    fc.assert(fc.property(fc.array(fc.integer()), (as) => {
      void expect(filterList(as, p).result).toEqual(filterMapList(as, (a) => (p(a) ? some(a) : none)).result);
    }));
  });

  it("filterMap drops None and unwraps Some", () => {
    expect(filterMapList([1, 2, 3, 4], (n) => (n % 2 === 0 ? some(n * 10) : none)).result).toEqual([20, 40]);
  });

  it("for Option, filterMap is flatMap", () => {
    const f = (n: number) => (n > 0 ? some(n * 2) : none);
    for (const o of [none, some(3), some(-3)]) expect(filterMapOption(o, f).result).toEqual(flatMapOption(o, f).result);
    expect(filterMapOption(none, f).trace.calls).toEqual([]);
  });

  it("partition is (filter p, filter not-p): every element lands on exactly one side", () => {
    fc.assert(fc.property(fc.array(fc.integer()), (as) => {
      const [pass, fail] = partitionList(as, p).result;
      void expect(pass).toEqual(filterList(as, p).result);
      void expect(fail).toEqual(filterList(as, (a) => !p(a)).result);
      void expect(pass.length + fail.length).toBe(as.length);
    }));
  });
});
