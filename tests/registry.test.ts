import { describe, expect, it } from "vitest";
import { names, namesFor } from "../src/catalog/names";
import { operationGroups } from "../src/catalog/operations";
import { operationScenes } from "../src/scenes/registry";
import { parseFn } from "../src/scenes/types";
import { instantiate } from "../src/scenes/signature";
import type { Scene, SceneNode } from "../src/scenes/scene";

// The UI renders every operation from data. These checks keep the catalog,
// the scene registry and the names panel consistent with each other.

const allOps = operationGroups.flatMap((g) => g.operations);

// Every slot in a scene: its key and the value each of its cases stores.
function slotsOf(scene: Scene): Map<string, (boolean | number)[]> {
  const slots = new Map<string, (boolean | number)[]>();
  const walk = (n: SceneNode) => {
    if (n.type === "slot") { slots.set(n.key, n.options.map((o) => o.value)); n.options.forEach((o) => o.content.forEach(walk)); }
    else if (n.type === "container") n.children.forEach(walk);
  };
  for (const input of scene.inputs) {
    walk(input.node);
    for (const s of input.steps ?? []) if (s.result) walk(s.result);
  }
  return slots;
}
const toggleKeys = (scene: Scene) => new Set(slotsOf(scene).keys());

describe("scene registry", () => {
  it("covers every operation in the navigation, and nothing else", () => {
    expect(Object.keys(operationScenes).sort()).toEqual(allOps.map((o) => o.id).sort());
  });

  for (const op of allOps) {
    describe(op.id, () => {
      const receivers = operationScenes[op.id]?.receivers ?? [];
      it("every receiver fills in the operation's type variable", () => {
        for (const r of receivers) expect(r.binds[op.receiverVar], `${op.id}:${r.id} binds ${op.receiverVar}`).toBeTruthy();
      });
      it("has at least one receiver with unique ids", () => {
        expect(receivers.length).toBeGreaterThan(0);
        expect(new Set(receivers.map((r) => r.id)).size).toBe(receivers.length);
      });
      for (const r of receivers) {
        it(`${r.id}: builds for every strategy, and every input toggle is clickable`, () => {
          for (const s of r.strategies?.length ? r.strategies : (["short-circuit"] as const)) {
            const scene = r.build(r.defaults, s);
            expect(scene.inputs.length).toBeGreaterThan(0);
            expect(scene.caption.length).toBeGreaterThan(0);
          }
          const visible = toggleKeys(r.build(r.defaults, r.strategies?.[0] ?? "short-circuit"));
          for (const key of Object.keys(r.defaults)) expect(visible, `toggle "${key}"`).toContain(key);
          // Every case of every slot can be chosen, and the scene still builds.
          for (const [key, values] of slotsOf(r.build(r.defaults, r.strategies?.[0] ?? "short-circuit"))) {
            for (const value of values) {
              const chosen = r.build({ ...r.defaults, [key]: value }, r.strategies?.[0] ?? "short-circuit");
              expect(chosen.caption.length, `${key}=${String(value)}`).toBeGreaterThan(0);
            }
          }
          expect(r.ribbon.before.length).toBeGreaterThan(0);
          expect(r.ribbon.after.length).toBeGreaterThan(0);
        });
      }
    });
  }
});

describe("names panel", () => {
  it("only refers to operations and receivers that exist", () => {
    for (const key of Object.keys(names)) {
      const [op, receiver] = key.split(":");
      const receivers = operationScenes[op as string]?.receivers.map((r) => r.id) ?? [];
      expect(receivers, key).toContain(receiver);
    }
  });

  it("hides preview entries unless Preview is on", () => {
    for (const key of Object.keys(names)) {
      const [op = "", receiver = "", strategy] = key.split(":");
      const off = namesFor(op, receiver, strategy, false);
      const on = namesFor(op, receiver, strategy, true);
      expect(off.some((e) => e.preview), key).toBe(false);
      expect(on.filter((e) => !e.preview), key).toEqual(off);
    }
  });
});

describe("scenes show the traps", () => {
  const find = (op: string, receiver: string) => {
    const r = operationScenes[op]?.receivers.find((x) => x.id === receiver);
    if (!r) throw new Error(`${op}:${receiver} missing`);
    return r;
  };
  const balls = (n: SceneNode): string[] => (n.type === "ball" ? [n.label] : n.type === "container" ? n.children.flatMap(balls) : []);

  it("zip: cartesian gives 6 results, positional gives 2", () => {
    expect(balls(find("zip", "list").build({}, "short-circuit").output)).toHaveLength(6);
    expect(balls(find("zip", "ziplist").build({}, "short-circuit").output)).toEqual(["1a", "2b"]);
  });
  it("traverse: strategies change the calls, never the output", () => {
    const r = find("traverse", "either");
    const sc = r.build(r.defaults, "short-circuit");
    const eager = r.build(r.defaults, "eager");
    expect(sc.output).toEqual(eager.output);
    expect(sc.inputs[0]?.steps?.filter((s) => s.called)).toHaveLength(2);
    expect(eager.inputs[0]?.steps?.filter((s) => s.called)).toHaveLength(4);
  });
  it("Validation keeps both errors where Either keeps one", () => {
    expect(balls(find("zip", "validation").build({ a: true, b: true }, "short-circuit").output)).toEqual(["e₁", "e₂"]);
    expect(balls(find("zip", "either").build({ a: true, b: true }, "short-circuit").output)).toEqual(["e₁"]);
  });
  it("bimap runs one function for Either and both for a Tuple", () => {
    expect(find("bimap", "either").build({ input: false }, "short-circuit").inputs[0]?.steps).toHaveLength(1);
    expect(find("bimap", "tuple").build({}, "short-circuit").inputs[0]?.steps?.map((s) => s.label)).toEqual(["f(a)", "g(b)"]);
  });
});

// "Either<B>" reads to a Haskeller as "B is the error", and fp-ts rejects it.
// Every Either and Validation the page shows names its error type.
function oneArgumentErrorTypes(text: string): string[] {
  const bad: string[] = [];
  for (const m of text.matchAll(/\b(Either|Validation)</g)) {
    let depth = 0;
    let commas = 0;
    for (let i = m.index + m[1]!.length; i < text.length; i++) {
      const c = text[i];
      if (c === "<" || c === "(") depth++;
      else if (c === ">" || c === ")") { depth--; if (depth === 0) break; }
      else if (c === "," && depth === 1) commas++;
    }
    if (commas === 0) bad.push(text);
  }
  return bad;
}

describe("signatures name the error type", () => {
  for (const op of allOps) {
    for (const r of operationScenes[op.id]?.receivers ?? []) {
      it(`${op.id}:${r.id}`, () => {
        const shown = [r.signature ?? instantiate(op.signature, r.binds), r.ribbon.before, r.ribbon.after, r.ribbon.fn ?? ""];
        expect(shown.flatMap(oneArgumentErrorTypes)).toEqual([]);
      });
    }
  }
});

// Split at the top level only (outside <> and ()).
function splitTop(text: string, sep: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === "<" || c === "(") depth++;
    else if (c === ">" || c === ")") depth--;
    else if (depth === 0 && text.startsWith(sep, i)) { parts.push(text.slice(start, i)); start = i + sep.length; }
  }
  return [...parts, text.slice(start)];
}

describe("the Shape diagram draws every argument of the signature", () => {
  for (const op of allOps) {
    for (const r of operationScenes[op.id]?.receivers ?? []) {
      it(`${op.id}:${r.id}`, () => {
        const signature = r.signature ?? instantiate(op.signature, r.binds);
        const args = splitTop(signature, " → ").slice(0, -1).flatMap((a) => splitTop(a, " × "));
        const drawn = 1 + (r.ribbon.fn ? parseFn(r.ribbon.fn).length : 0);
        expect(drawn, `${signature} vs ribbon ${r.ribbon.before} × ${r.ribbon.fn ?? "—"}`).toBe(args.length);
      });
    }
  }
});

describe("shape ribbon functions", () => {
  it("every function argument parses into something drawable", () => {
    for (const [op, { receivers }] of Object.entries(operationScenes)) {
      for (const r of receivers) {
        if (!r.ribbon.fn) continue;
        const shape = parseFn(r.ribbon.fn);
        expect(shape.length, `${op}:${r.id}`).toBeGreaterThan(0);
      }
    }
  });
});

describe("behavior joints match the signature", () => {
  // A function argument is drawn as a call hanging under the value it is
  // applied to, labelled in call notation; a value argument is a separate
  // input, joined to the others by ×.
  const call = /^[A-Za-z]+\(.*\)$/;
  const find = (op: string, receiver: string) => {
    const r = operationScenes[op]?.receivers.find((x) => x.id === receiver);
    if (!r) throw new Error(`${op}:${receiver} missing`);
    return r;
  };
  // The defaults, plus every case of every slot chosen in turn.
  const variants = (r: { defaults: Readonly<Record<string, boolean | number>>; build: (t: Readonly<Record<string, boolean | number>>, s: "short-circuit") => Scene }) =>
    [r.defaults, ...[...slotsOf(r.build(r.defaults, "short-circuit"))].flatMap(([k, values]) => values.map((v) => ({ ...r.defaults, [k]: v })))];
  for (const [op, { receivers }] of Object.entries(operationScenes)) {
    for (const r of receivers) {
      it(`${op}:${r.id}: every drawn call is labelled as a call`, () => {
        for (const t of variants(r)) {
          for (const strategy of r.strategies ?? ["short-circuit"]) {
            for (const input of r.build(t, strategy).inputs) {
              for (const s of input.steps ?? []) {
                if (!s.result && !s.effect) continue;
                const label = s.label ?? (s.result?.type === "slot" ? s.result.label : undefined);
                expect(label, `${op}:${r.id}`).toMatch(call);
              }
            }
          }
        }
      });
    }
  }

  it("value arguments are separate inputs", () => {
    expect(find("fromNullable", "either").build({ input: true }, "short-circuit").inputs).toHaveLength(2);
    expect(find("getOrElse", "option").build({ input: true }, "short-circuit").inputs).toHaveLength(2);
  });

  it("filterOrElse draws the onFalse call that builds the error", () => {
    const steps = find("filterOrElse", "either").build({ input: false, predicate: true }, "short-circuit").inputs[0]?.steps ?? [];
    expect(steps.map((s) => [s.label ?? (s.result?.type === "slot" ? s.result.label : ""), s.called])).toEqual([["p(a)", true], ["onFalse(a)", true]]);
  });
});

describe("side effects are not values", () => {
  const peek = operationScenes.peek?.receivers ?? [];
  it("peek's steps carry an effect and no result, and the output keeps the input's tone", () => {
    for (const r of peek) {
      const scene = r.build(r.defaults, "short-circuit");
      for (const s of scene.inputs[0]?.steps ?? []) {
        expect(s.result).toBeUndefined();
        if (s.called) expect(s.effect).toMatch(/^saw /);
      }
      const tones = (n: SceneNode): string[] => (n.type === "ball" ? [n.tone] : n.type === "container" ? n.children.flatMap(tones) : []);
      expect(tones(scene.output).every((t) => t === "in")).toBe(true);
    }
  });
});

describe("LanguageExt coverage", () => {
  it("every receiver of every operation has a LanguageExt entry", async () => {
    const { languageExt } = await import("../src/catalog/languageext");
    const keys = Object.keys(languageExt);
    for (const op of allOps) {
      for (const r of operationScenes[op.id]?.receivers ?? []) {
        expect(keys.some((k) => k === `${op.id}:${r.id}` || k.startsWith(`${op.id}:${r.id}:`)), `${op.id}:${r.id}`).toBe(true);
      }
    }
  });
});

// Regression: the ribbon and the behavior slots once listed cases in
// different orders (Left | Right vs Right | Left).
import { casesOf, parseType } from "../src/scenes/types";
import type { SlotNode } from "../src/scenes/scene";

describe("case order", () => {
  const slots = (n: SceneNode): SlotNode[] =>
    n.type === "slot" ? [n, ...n.options.flatMap((o) => o.content.flatMap(slots))] : n.type === "container" ? n.children.flatMap(slots) : [];
  const ribbonOrder = new Map(["Either<E, A>", "Option<A>", "Validation<E, A>"].map((s) => {
    const cases = casesOf(parseType(s)) ?? [];
    return [cases.map((c) => c.name).sort().join(), cases.map((c) => c.name).join()] as const;
  }));

  it("every slot lists its cases in the Shape Ribbon's order", () => {
    let checked = 0;
    for (const { receivers } of Object.values(operationScenes)) {
      for (const r of receivers) {
        for (const strategy of r.strategies ?? ["short-circuit" as const]) {
          const scene = r.build(r.defaults, strategy);
          const nodes = scene.inputs.flatMap((i) => [i.node, ...(i.steps ?? []).flatMap((s) => (s.result ? [s.result] : []))]);
          for (const s of nodes.flatMap(slots)) {
            const names = s.options.map((o) => o.name);
            const expected = ribbonOrder.get([...names].sort().join());
            if (expected) { expect(names.join()).toBe(expected); checked++; }
          }
        }
      }
    }
    expect(checked).toBeGreaterThan(20);
  });
});

describe("constructor scenes run the cases they teach", () => {
  const find = (op: string, receiver: string) => {
    const r = operationScenes[op]?.receivers.find((x) => x.id === receiver);
    if (!r) throw new Error(`${op}:${receiver} missing`);
    return r;
  };
  const out = (op: string, receiver: string, t: Record<string, boolean | number>) => {
    const node = find(op, receiver).build(t, "short-circuit").output;
    return node.type === "container" ? node.children.map((c) => (c.type === "ball" ? c.label : "?")) : [];
  };

  it("fromNullable: undefined and null are missing; 0 and a value are present", () => {
    expect([0, 1, 2, 3].map((i) => out("fromNullable", "option", { input: i }))).toEqual([["None"], ["None"], ["0"], ["a"]]);
    expect([0, 1, 2, 3].map((i) => out("fromNullable", "either", { input: i }))).toEqual([["e"], ["e"], ["0"], ["a"]]);
  });

  it("tryCatch: only a throw fails; returning undefined is a success", () => {
    expect([0, 1, 2].map((i) => out("tryCatch", "either", { thunk: i }))).toEqual([["e"], ["a"], ["undefined"]]);
    expect([0, 1, 2].map((i) => out("tryCatch", "option", { thunk: i }))).toEqual([["None"], ["a"], ["undefined"]]);
    const steps = find("tryCatch", "either").build({ thunk: 0 }, "short-circuit").inputs[0]?.steps ?? [];
    expect(steps.map((s) => [s.label, s.called])).toEqual([["onThrow(u)", true]]);
  });

  it("pure doesn't inspect its input: null goes in, Some(null) comes out", () => {
    expect(out("pure", "option", { input: true })).toEqual(["null"]);
    expect(out("pure", "option", { input: false })).toEqual(["a"]);
  });
});
