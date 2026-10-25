// Types with an error parameter written first. Filling F<B> with one of them
// keeps the error visible: Either<E, B>, never Either<B> (which a Haskeller
// reads as "B is the error", and which fp-ts would reject).
const WITH_ERROR = new Set(["Either", "Validation"]);

// The number of top-level arguments in the application starting at `open`
// (the index of its "<").
function arity(s: string, open: number): number {
  let depth = 0;
  let n = 1;
  for (let i = open; i < s.length; i++) {
    const c = s[i];
    if (c === "<" || c === "(") depth++;
    else if (c === ">" || c === ")") { depth--; if (depth === 0) return n; }
    else if (c === "," && depth === 1) n++;
  }
  return n;
}

// Fill a canonical signature's type variables with a receiver's types,
// e.g. "(A → F<B>) → T<A> → F<T<B>>" with { F: "Either", T: "List" }
// gives "(A → Either<E, B>) → List<A> → Either<E, List<B>>". Only a variable
// that is applied (directly followed by "<") is replaced, so payload variables
// such as A and B are left alone.
export function instantiate(signature: string, binds: Readonly<Record<string, string>>): string {
  return signature.replace(/\b([A-Z])</g, (match: string, v: string, offset: number) => {
    const t = binds[v];
    if (!t) return match;
    const withError = WITH_ERROR.has(t) && arity(signature, offset + v.length) === 1;
    return withError ? `${t}<E, ` : `${t}<`;
  });
}

// Split a signature into text and type-variable tokens, for highlighting.
export function tokenize(signature: string, variable: string): { text: string; isVar: boolean }[] {
  const out: { text: string; isVar: boolean }[] = [];
  const re = new RegExp(`\\b${variable}(?=<)`, "g");
  let last = 0;
  for (const m of signature.matchAll(re)) {
    if (m.index > last) out.push({ text: signature.slice(last, m.index), isVar: false });
    out.push({ text: variable, isVar: true });
    last = m.index + variable.length;
  }
  if (last < signature.length) out.push({ text: signature.slice(last), isVar: false });
  return out;
}

// Split a filled-in signature so the type that replaced the variable can be
// emphasized, e.g. "Either" in "(A → Either<B>) → List<A> → Either<List<B>>".
export function markType(signature: string, typeName: string): { text: string; isType: boolean }[] {
  const out: { text: string; isType: boolean }[] = [];
  const re = new RegExp(`\\b${typeName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=<)`, "g");
  let last = 0;
  for (const m of signature.matchAll(re)) {
    if (m.index > last) out.push({ text: signature.slice(last, m.index), isType: false });
    out.push({ text: typeName, isType: true });
    last = m.index + typeName.length;
  }
  if (last < signature.length) out.push({ text: signature.slice(last), isType: false });
  return out;
}
