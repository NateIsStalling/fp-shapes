import { Array as Arr, Filter, Option as EO } from "effect";
import * as O from "fp-ts/Option";
import { pipe } from "fp-ts/function";
import * as RA from "fp-ts/ReadonlyArray";
import { describe, expect, it } from "vitest";
import { filterList, filterMapList, filterMapOption, filterOption, none, partitionList, some, type Option } from "../../src/semantics";

// Filterable in fp-ts 2.16.11 and effect 4.0.5 against the reference semantics.

const fromO = <A>(o: O.Option<A>): Option<A> => (O.isNone(o) ? none : some(o.value));
const fromEO = <A>(o: EO.Option<A>): Option<A> => (EO.isNone(o) ? none : some(o.value));
const xs = [1, 2, 3, 4, 5, 6];
const even = (n: number) => n % 2 === 0;
const f = (n: number): Option<number> => (n % 3 === 0 ? none : some(n * 10));
const fFp = (n: number) => (n % 3 === 0 ? O.none : O.some(n * 10));
const fEf = (n: number) => (n % 3 === 0 ? EO.none<number>() : EO.some(n * 10));

describe("fp-ts 2.16.11 filtering", () => {
  it("filter, filterMap", () => {
    expect(pipe(xs, RA.filter(even))).toEqual(filterList(xs, even).result);
    expect(pipe(xs, RA.filterMap(fFp))).toEqual(filterMapList(xs, f).result);
    for (const o of [none, some(3), some(4)]) {
      const fo = o.tag === "some" ? O.some(o.value) : O.none;
      expect(fromO(pipe(fo, O.filter(even)))).toEqual(filterOption(o, even).result);
      expect(fromO(pipe(fo, O.filterMap(fFp)))).toEqual(filterMapOption(o, f).result);
    }
  });

  it("partition: Separated's right holds the passes, left the fails", () => {
    const { left, right } = pipe(xs, RA.partition(even));
    expect([right, left]).toEqual(partitionList(xs, even).result);
  });
});

describe("effect 4.0.5 filtering", () => {
  it("filter; filterMap through Filter.fromPredicateOption", () => {
    expect(Arr.filter(xs, even)).toEqual(filterList(xs, even).result);
    expect(Arr.filterMap(xs, Filter.fromPredicateOption(fEf))).toEqual(filterMapList(xs, f).result);
    for (const o of [none, some(3), some(4)]) {
      const eo = o.tag === "some" ? EO.some(o.value) : EO.none<number>();
      expect(fromEO(EO.filter(eo, even))).toEqual(filterOption(o, even).result);
      expect(fromEO(EO.filterMap(eo, Filter.fromPredicateOption(fEf)))).toEqual(filterMapOption(o, f).result);
    }
  });

  it("partition through Filter.fromPredicate: [passes, fails]", () => {
    expect(Arr.partition(xs, Filter.fromPredicate(even))).toEqual(partitionList(xs, even).result);
  });
});
