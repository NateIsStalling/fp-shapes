import { errorsOf, parseType, spine } from "./types";

// Shape Ribbon scene: compare the layer stacks before and after an operation.
// Layers are listed outermost first; the last entry is the payload.

export type LayerKind = "collection" | "effect" | "tuple";

const PRODUCTS = new Set(["Tuple"]);
const COLLECTIONS = new Set(["List", "T", "Seq", "Lst", "Array", "IEnumerable", "ZipList", "NonEmpty"]);
export const layerKind = (name: string): LayerKind => (PRODUCTS.has(name) ? "tuple" : COLLECTIONS.has(name) ? "collection" : "effect");

export interface RibbonDiff {
  readonly unchanged: readonly string[];
  readonly moved: readonly string[];
  readonly introduced: readonly string[];
  readonly removed: readonly string[];
  readonly payloadChanged: boolean;
  readonly caption: string;
}

export const typeOf = (layers: readonly string[]): string =>
  layers.slice(0, -1).reduceRight((acc, n) => `${n}<${acc}>`, layers[layers.length - 1] ?? "");

export function diffLayers(before: readonly string[], after: readonly string[]): RibbonDiff {
  const cb = before.slice(0, -1);
  const ca = after.slice(0, -1);
  const unchanged: string[] = [];
  const restB: string[] = [];
  const restA: string[] = [];
  // Same layer at the same depth stays; leftovers are matched by name as
  // multisets, so F<F<A>> → F<A> reads "one F removed".
  for (let i = 0; i < Math.max(cb.length, ca.length); i++) {
    const b = cb[i];
    const a = ca[i];
    if (b !== undefined && b === a) unchanged.push(b);
    else {
      if (b !== undefined) restB.push(b);
      if (a !== undefined) restA.push(a);
    }
  }
  const moved: string[] = [];
  for (const n of [...restB]) {
    const j = restA.indexOf(n);
    if (j >= 0) {
      moved.push(n);
      restA.splice(j, 1);
      restB.splice(restB.indexOf(n), 1);
    }
  }
  const pb = before[before.length - 1] ?? "";
  const pa = after[after.length - 1] ?? "";
  const payloadChanged = pb !== pa;

  const parts: string[] = [];
  if (moved.length === 2) parts.push(`\`${moved[0]}\` and \`${moved[1]}\` swap places.`);
  else if (moved.length === 1) parts.push(`\`${moved[0]}\` moves inside.`);
  if (restA.length) parts.push(`${restA.map((n) => `\`${n}\``).join(" and ")} is introduced on the outside.`);
  if (restB.length) parts.push(restB.length === 1 && unchanged.includes(restB[0] as string) ? `One \`${restB[0]}\` layer is removed.` : `${restB.map((n) => `\`${n}\``).join(" and ")} is removed.`);
  if (!moved.length && !restA.length && !restB.length && unchanged.length) parts.push(`${unchanged.map((n) => `\`${n}\``).join(" and ")} stays the same.`);
  const product = (p: string) => (p.includes(",") ? `\`(${p})\`` : `\`${p}\``);
  parts.push(payloadChanged ? `The payload changes from ${product(pb)} to ${product(pa)}.` : `The payload stays ${product(pb)}.`);

  return { unchanged, moved, introduced: restA, removed: restB, payloadChanged, caption: parts.join(" ") };
}

// Describe a ribbon from type expressions: layers that move, appear or
// disappear along the payload's spine, the payload, and the error side.
export function describeTypes(before: string, after: string): RibbonDiff {
  const b = parseType(before);
  const a = parseType(after);
  const d = diffLayers(spine(b), spine(a));
  const eb = errorsOf(b);
  const ea = errorsOf(a);
  const errorChanged = eb.length > 0 && ea.length > 0 && eb.join() !== ea.join();
  if (!errorChanged) return d;
  // When only the error side changed, "the payload stays" leads; say what changed first.
  const caption = d.caption.replace(/(The payload [^.]*\.)$/, `The error changes from \`${eb[0]}\` to \`${ea[ea.length - 1]}\`. $1`);
  return { ...d, caption };
}
