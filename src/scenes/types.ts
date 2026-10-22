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
