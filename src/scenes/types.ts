// A small type-expression language for the Shape Ribbon:
// "Either<E, List<B>>", "Option<A>", "Tuple<A, X>", "A".

export type TypeExpr =
  | { readonly kind: "var"; readonly name: string }
  | { readonly kind: "app"; readonly ctor: string; readonly args: readonly TypeExpr[] };

export function parseType(source: string): TypeExpr {
  let i = 0;
  const s = source.trim();
  const ws = () => { while (s[i] === " ") i++; };
  const ident = () => {
    ws();
    const start = i;
    while (i < s.length && !"<>, ".includes(s[i] as string)) i++;
    if (i === start) throw new Error(`Expected a type at ${i} in "${source}"`);
    return s.slice(start, i);
  };
  const expr = (): TypeExpr => {
    const name = ident();
    ws();
    if (s[i] !== "<") return { kind: "var", name };
    i++;
    const args: TypeExpr[] = [expr()];
    ws();
    while (s[i] === ",") { i++; args.push(expr()); ws(); }
    if (s[i] !== ">") throw new Error(`Expected ">" at ${i} in "${source}"`);
    i++;
    return { kind: "app", ctor: name, args };
  };
  const t = expr();
  ws();
  if (i !== s.length) throw new Error(`Unexpected "${s.slice(i)}" in "${source}"`);
  return t;
}

export const showType = (t: TypeExpr): string => (t.kind === "var" ? t.name : `${t.ctor}<${t.args.map(showType).join(", ")}>`);

// Sum types are drawn as their cases, failure first (the behavior slots use
// the same order). The payload is always the last case's
// argument; the error side, when there is one, is the first argument.
export interface Case { readonly name: string; readonly arg?: TypeExpr; readonly role: "value" | "error" | "empty" }

export function casesOf(t: TypeExpr): readonly Case[] | undefined {
  if (t.kind !== "app") return undefined;
  const [first, second] = t.args;
  switch (t.ctor) {
    case "Option": return [{ name: "None", role: "empty" }, { name: "Some", arg: first as TypeExpr, role: "value" }];
    case "Either": return [{ name: "Left", arg: first as TypeExpr, role: "error" }, { name: "Right", arg: second as TypeExpr, role: "value" }];
    case "Nullable": return [{ name: "nullish", role: "empty" }, { name: "value", arg: first as TypeExpr, role: "value" }];
    case "Validation": return [{ name: "Failure", arg: first as TypeExpr, role: "error" }, { name: "Success", arg: second as TypeExpr, role: "value" }];
    default: return undefined;
  }
}

// The spine: constructors from the outside in, following the payload (the
// last argument), ending with the payload. Either<E, List<B>> → [Either, List, B].
export function spine(t: TypeExpr): string[] {
  if (t.kind === "var") return [t.name];
  if (t.ctor === "Tuple") return [t.ctor, t.args.map(showType).join(", ")];
  const last = t.args[t.args.length - 1];
  return [t.ctor, ...(last ? spine(last) : [])];
}

// The error types along the spine (the first argument of Either/Validation).
export function errorsOf(t: TypeExpr): string[] {
  if (t.kind === "var") return [];
  const own = t.ctor === "Either" || t.ctor === "Validation" ? [showType(t.args[0] as TypeExpr)] : [];
  const last = t.args[t.args.length - 1];
  return [...own, ...(last && t.ctor !== "Tuple" ? errorsOf(last) : [])];
}

// A function argument as the signature writes it, drawn in the Shape Ribbon:
// "A → bool", "() → Option<A>", "(E → E₂) × (A → B)" (two functions),
// "Either<B> × ((A, B) → C)" (a value and a function). Each part joined by ×
// is a function or a plain value.
export type FnPart =
  | { readonly kind: "fn"; readonly args: readonly TypeExpr[]; readonly out: TypeExpr }
  | { readonly kind: "value"; readonly type: TypeExpr };
export type FnShape = readonly FnPart[];

// Split on a separator at the top level only (outside <> and ()).
function splitTop(s: string, sep: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "<" || c === "(") depth++;
    else if (c === ">" || c === ")") depth--;
    else if (depth === 0 && s.startsWith(sep, i)) {
      parts.push(s.slice(start, i));
      start = i + sep.length;
      i += sep.length - 1;
    }
  }
  parts.push(s.slice(start));
  return parts.map((p) => p.trim());
}

// "(A → B)" → "A → B" when the parentheses wrap the whole piece.
function unwrap(s: string): string {
  if (!s.startsWith("(") || !s.endsWith(")")) return s;
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "(") depth++;
    else if (s[i] === ")") depth--;
    if (depth === 0 && i < s.length - 1) return s;
  }
  return s.slice(1, -1).trim();
}

// Signatures abbreviate the error side ("Either<B>"); the drawing needs both cases.
function withError(t: TypeExpr): TypeExpr {
  if (t.kind === "var") return t;
  const args = t.args.map(withError);
  return (t.ctor === "Either" || t.ctor === "Validation") && args.length === 1
    ? { kind: "app", ctor: t.ctor, args: [{ kind: "var", name: "E" }, ...args] }
    : { kind: "app", ctor: t.ctor, args };
}

function parsePart(source: string): FnPart {
  const s = unwrap(source);
  const arrow = splitTop(s, " → ");
  if (arrow.length === 1) return { kind: "value", type: withError(parseType(s)) };
  const [params = "", ...rest] = arrow;
  const p = unwrap(params);
  const args = params === "()" ? [] : splitTop(p, ",").map((a) => withError(parseType(a)));
  return { kind: "fn", args, out: withError(parseType(rest.join(" → "))) };
}

export function parseFn(source: string): FnShape {
  return splitTop(unwrap(source.trim()), " × ").map(parsePart);
}
