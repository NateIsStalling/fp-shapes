import { Option, Result } from "effect";
import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { names } from "../src/catalog/names";
import { samples } from "../src/catalog/samples.generated";
import { effect } from "../snippets/effect/samples";
import { fpts } from "../snippets/fp-ts/samples";
// @ts-expect-error: plain .mjs script without type declarations
import { render } from "../scripts/extract-samples.mjs";

// Samples on the site are code that is compiled and checked:
// - LanguageExt in snippets/languageext/v4 (`npm run samples:languageext`)
// - fp-ts and Effect in snippets/*/samples.ts, executed below.

describe("sample index", () => {
  it("src/catalog/samples.generated.ts is up to date (run `npm run samples:extract`)", () => {
    expect(readFileSync(resolve(import.meta.dirname, "../src/catalog/samples.generated.ts"), "utf8")).toBe(render());
  });

  it("every sample belongs to a catalog entry for its ecosystem", () => {
    for (const [eco, bySample] of Object.entries(samples)) {
      for (const key of Object.keys(bySample)) {
        const owners = Object.entries(names).filter(([k, list]) => (k === key || k.split(":").slice(0, 2).join(":") === key) && list.some((e) => e.eco === eco));
        expect(owners.length, `${eco} ${key}`).toBeGreaterThan(0);
      }
    }
  });

  it("every fp-ts, Effect and LanguageExt entry shows a sample", () => {
    for (const [key, list] of Object.entries(names)) for (const e of list) expect(e.sample, `${e.eco} ${key}`).toBeTruthy();
  });
});

// Normalize library values so expectations read the same for both libraries.
function norm(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(norm);
  if (Result.isResult(v)) return Result.isSuccess(v) ? { ok: norm(v.success) } : { err: norm(v.failure) };
  if (Option.isOption(v)) return Option.isSome(v) ? { some: norm(v.value) } : "none";
  if (E.isLeft(v as E.Either<unknown, unknown>) || E.isRight(v as E.Either<unknown, unknown>)) {
    const e = v as E.Either<unknown, unknown>;
    return E.isRight(e) ? { ok: norm(e.right) } : { err: norm(e.left) };
  }
  if (O.isSome(v as O.Option<unknown>) || O.isNone(v as O.Option<unknown>)) {
    const o = v as O.Option<unknown>;
    return O.isSome(o) ? { some: norm(o.value) } : "none";
  }
  return v;
}

const expected: Record<string, unknown> = {
  "pure:option": { some: 2 },
  "pure:either": { ok: 2 },
  "pure:validation": { ok: 2 },
  "pure:list": [2],
  "fail:either": { err: "oops" },
  "fail:option": "none",
  "fail:validation": { err: ["oops"] },
  "fromNullable:option": "none",
  "fromNullable:either": { err: "missing" },
  "fromPredicate:option": "none",
  "fromPredicate:either": { err: "too small: 3" },
  "tryCatch:option": "none",
  "tryCatch:either": { err: "invalid JSON" },
  "map:either": { ok: 20 },
  "map:option": { some: 20 },
  "map:list": [10, 20, 30],
  "bimap:either": { err: 4 },
  "flatMap:either": { ok: 2 },
  "flatMap:option": { some: 2 },
  "flatMap:list": [1, 1, 2, 2, 3, 3],
  "flatten:either": { ok: 1 },
  "flatten:option": { some: 1 },
  "flatten:list": [1, 2, 3],
  "tap:either": { ok: 2 },
  "tap:option": "none",
  "zip:either": { err: "e1" },
  "zip:validation": { err: ["e1", "e2"] },
  "zip:list": [[1, "a"], [1, "b"], [2, "a"], [2, "b"], [3, "a"], [3, "b"]],
  "zip:ziplist": ["1a", "2b"],
  "traverse:either:short-circuit": { err: "e-2" },
  "traverse:either:eager": { err: "e-2" },
  "traverse:option:short-circuit": "none",
  "traverse:validation:eager": { err: ["e-2", "e-4"] },
  "sequence:either:short-circuit": { err: "e2" },
  "mapError:either": { err: 4 },
  "recover:either": { err: 4 },
  "alt:option": { some: 9 },
  "alt:either": { ok: 9 },
  "alt:validation": { err: ["e1", "e2"] },
  "alt:list": [1, 2, 3],
  "getOrElse:either": 4,
  "getOrElse:option": 0,
  "match:either": "error oops",
  "match:option": "value 2",
  "filterOrElse:either": { err: "too small: 3" },
  "filterOrElse:option": "none",
};

for (const [lib, table] of [["fp-ts 2.16.11", fpts], ["effect 4.0.5", effect]] as const) {
  describe(`${lib} samples run and give the expected result`, () => {
    for (const [key, run] of Object.entries(table)) {
      it(key, async () => {
        expect(key in expected, `no expectation for ${key}`).toBe(true);
        expect(norm(await run())).toEqual(expected[key]);
      });
    }
  });
}
