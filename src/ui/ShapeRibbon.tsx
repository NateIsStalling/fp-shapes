import { describeTypes, layerKind } from "../scenes/ribbon";
import { Fragment } from "react";
import { casesOf, parseFn, parseType, showType, type FnPart, type TypeExpr } from "../scenes/types";
import { RichText } from "./RichText";
import { useStackWhenTooWide } from "./useStackWhenTooWide";

interface Props {
  before: string;
  after: string;
  op: string;
  fn?: string | undefined;
  caption?: string | undefined;
}

// Variables on the input side are drawn as inputs; on the output side, a
// variable that also appears in the input is the same value passing through.
// `free`: output variables nothing supplies (pure's E, fail's A). They are
// still free type variables, so they are drawn as ghosts, not as values.
type Side = { readonly inputs: ReadonlySet<string>; readonly output: boolean; readonly free?: ReadonlySet<string> };

function vars(t: TypeExpr, into = new Set<string>()): Set<string> {
  if (t.kind === "var") into.add(t.name);
  else t.args.forEach((a) => vars(a, into));
  return into;
}

function Payload({ name, role, side }: { name: string; role: "value" | "error"; side: Side }) {
  if (side.output && side.free?.has(name)) {
    return <span className={`ball ball-free${role === "error" ? " ball-error" : ""}`} title={`${name} is still a free type variable: no value is supplied`}>{name}</span>;
  }
  if (role === "error") return <span className="ball ball-error">{name}</span>;
  const tone = side.output && !side.inputs.has(name) ? "ball-out" : "ball-in";
  return <span className={`ball ${tone}`}>{name}</span>;
}

// Draws a type: a sum type as its cases (the same "one of" language as the
// behavior slots), List and Tuple as containers, a variable as a ball.
function Type({ t, side, role = "value" }: { t: TypeExpr; side: Side; role?: "value" | "error" }) {
  if (t.kind === "var") return <Payload name={t.name} role={role} side={side} />;
  const cases = casesOf(t);
  if (cases) {
    return (
      <div className="sum layer-effect" role="group" aria-label={`${t.ctor}: one of ${cases.map((c) => c.name).join(" or ")}`}>
        <span className="layer-label">{t.ctor}</span>
        <div className="cases">
          {cases.map((c) => (
            <div key={c.name} className="case">
              <span className="case-name">{c.name}</span>
              {c.role === "empty" ? <span className={`ball ball-empty${isWord(c.name) ? " ball-word" : ""}`}>{c.name}</span> : c.arg && <Type t={c.arg} side={side} role={c.role === "error" ? "error" : "value"} />}
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className={`layer layer-${layerKind(t.ctor)}`}>
      <span className="layer-label">{t.ctor}</span>
      <div className="layer-children">{t.args.map((a, i) => <Type key={i} t={a} side={side} role={role} />)}</div>
    </div>
  );
}

// Type variables (A, E₂) are drawn as balls; anything else a function takes or
// returns (bool, void, unknown, Errors) is a type name, drawn as a label.
const isVar = (t: TypeExpr) => t.kind === "var" && /^[A-Z_][₀-₉′]*$/.test(t.name);
const isError = (t: TypeExpr) => t.kind === "var" && t.name.startsWith("E");

// A type built only from error variables (E, NonEmpty<E>) is drawn as errors.
const errorRole = (t: TypeExpr): "error" | "value" => ([...vars(t)].every((v) => v.startsWith("E")) ? "error" : "value");

function FnEnd({ t, side }: { t: TypeExpr; side: Side }) {
  if (t.kind === "app") return <Type t={t} side={side} role={errorRole(t)} />;
  if (!isVar(t)) return <span className={`fn-atom${isError(t) ? " fn-atom-error" : ""}`}>{t.name}</span>;
  return <Payload name={t.name} role={isError(t) ? "error" : "value"} side={side} />;
}

function FnPartView({ part, inputs }: { part: FnPart; inputs: ReadonlySet<string> }) {
  if (part.kind === "value") return <Type t={part.type} side={{ inputs, output: false }} role={errorRole(part.type)} />;
  return (
    <span className="fn-call">
      {part.args.length === 0 ? <span className="fn-atom">()</span> : part.args.map((a, i) => <FnEnd key={i} t={a} side={{ inputs, output: false }} />)}
      <span aria-hidden="true">→</span>
      <FnEnd t={part.out} side={{ inputs, output: true }} />
    </span>
  );
}

// The function argument as its signature reads; several arguments are joined by ×.
function FnView({ fn, inputs }: { fn: string; inputs: ReadonlySet<string> }) {
  return (
    <div className="ribbon-fn">
      {parseFn(fn).map((part, i) => (
        <Fragment key={i}>
          {i > 0 && <Times className="fn-times" />}
          <FnPartView part={part} inputs={inputs} />
        </Fragment>
      ))}
    </div>
  );
}

// Labels longer than a short name ("undefined", "nullish") get a pill, not a circle.
export const isWord = (label: string) => [...label].length > 4;

// A product joint, drawn in the arrow's stroke so the two read as a pair.
export function Times({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 14 14" aria-hidden="true">
      <path d="M3 3l8 8M11 3l-8 8" />
    </svg>
  );
}

export function ShapeRibbon({ before, after, op, fn, caption }: Props) {
  const b = parseType(before);
  const a = parseType(after);
  const inputs = vars(b);
  // Variables the input or the function supplies; any other output variable is free.
  const supplied = new Set(inputs);
  if (fn) for (const part of parseFn(fn)) for (const t of part.kind === "fn" ? [...part.args, part.out] : [part.type]) vars(t, supplied);
  const free = new Set([...vars(a)].filter((v) => !supplied.has(v)));
  const diff = describeTypes(before, after);
  const gridRef = useStackWhenTooWide<HTMLDivElement>("ribbon-stacked", `${before}|${after}|${fn ?? ""}`);
  // A function argument is parenthesized; a plain value argument is not.
  const signature = fn ? `${showType(b)} × ${fn.includes("→") ? `(${fn})` : fn} → ${showType(a)}` : `${showType(b)} → ${showType(a)}`;
  // A bare error type (E, E₂) is drawn as an error, wherever it appears.
  const roleOf = (t: TypeExpr) => (t.kind === "var" && t.name.startsWith("E") ? "error" : "value");
  const arrow = (
    <svg className="ribbon-arrow" viewBox="0 0 56 14" aria-hidden="true">
      <path d="M1 7h50" /><path d="M46 2l7 5-7 5" />
    </svg>
  );
  // The joints read like the signature: × between the arguments, → to the result.
  const joint = fn ? <Times className="ribbon-times" /> : arrow;
  return (
    <figure className="ribbon">
      {/* Break lines only between types, never inside one. */}
      <p className="ribbon-signature">{signature.split(/( → | × )/).map((part, i) => (i % 2 ? part : <span key={i} className="nowrap">{part}</span>))}</p>
      <div className="ribbon-grid" ref={gridRef}>
        <div className="ribbon-col"><span className="ribbon-type">{showType(b)}</span><Type t={b} side={{ inputs, output: false }} role={roleOf(b)} /></div>
        <div className="ribbon-col"><span className="ribbon-type" aria-hidden="true"> </span>{joint}</div>
        {fn && (
          <>
            <div className="ribbon-col">
              <span className="ribbon-type">{fn}</span>
              <FnView fn={fn} inputs={inputs} />
            </div>
            <div className="ribbon-col"><span className="ribbon-type" aria-hidden="true"> </span>{arrow}</div>
          </>
        )}
        <div className="ribbon-col"><span className="ribbon-type">{showType(a)}</span><Type t={a} side={{ inputs, output: true, free }} /></div>
      </div>
      <figcaption className="ribbon-caption"><code className="tok">{op}</code>: <RichText text={caption ?? diff.caption} /></figcaption>
    </figure>
  );
}
