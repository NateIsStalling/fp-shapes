import { describeTypes, layerKind } from "../scenes/ribbon";
import { casesOf, parseType, showType, type TypeExpr } from "../scenes/types";
import { RichText } from "./RichText";
import { useStackWhenTooWide } from "./useStackWhenTooWide";

interface Props {
  before: string;
  after: string;
  op: string;
  fn?: string | undefined;
  fnIn?: string | undefined;
  fnOut?: string | undefined;
  caption?: string | undefined;
}

// Variables on the input side are drawn as inputs; on the output side, a
// variable that also appears in the input is the same value passing through.
type Side = { readonly inputs: ReadonlySet<string>; readonly output: boolean };

function vars(t: TypeExpr, into = new Set<string>()): Set<string> {
  if (t.kind === "var") into.add(t.name);
  else t.args.forEach((a) => vars(a, into));
  return into;
}

function Payload({ name, role, side }: { name: string; role: "value" | "error"; side: Side }) {
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
              {c.role === "empty" ? <span className="ball ball-empty">{c.name}</span> : c.arg && <Type t={c.arg} side={side} role={c.role === "error" ? "error" : "value"} />}
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

export function ShapeRibbon({ before, after, op, fn, fnIn = "A", fnOut, caption }: Props) {
  const b = parseType(before);
  const a = parseType(after);
  const inputs = vars(b);
  const diff = describeTypes(before, after);
  const gridRef = useStackWhenTooWide<HTMLDivElement>("ribbon-stacked", `${before}|${after}|${fn ?? ""}`);
  const signature = fn ? `${showType(b)} × (${fn}) → ${showType(a)}` : `${showType(b)} → ${showType(a)}`;
  const errorIn = fnIn.startsWith("E");
  // A bare error type (E, E₂) is drawn as an error, wherever it appears.
  const roleOf = (t: TypeExpr) => (t.kind === "var" && t.name.startsWith("E") ? "error" : "value");
  const arrow = (
    <svg className="ribbon-arrow" viewBox="0 0 56 14" aria-hidden="true">
      <path d="M1 7h50" /><path d="M46 2l7 5-7 5" />
    </svg>
  );
  return (
    <figure className="ribbon">
      {/* Break lines only between types, never inside one. */}
      <p className="ribbon-signature">{signature.split(/( → | × )/).map((part, i) => (i % 2 ? part : <span key={i} className="nowrap">{part}</span>))}</p>
      <div className="ribbon-grid" ref={gridRef}>
        <div className="ribbon-col"><span className="ribbon-type">{showType(b)}</span><Type t={b} side={{ inputs, output: false }} role={roleOf(b)} /></div>
        <div className="ribbon-col"><span className="ribbon-type" aria-hidden="true"> </span>{arrow}</div>
        {fn && (
          <>
            <div className="ribbon-col">
              <span className="ribbon-type">{fn}</span>
              <div className="ribbon-fn">
                <span className={`ball ${errorIn ? "ball-error" : "ball-in"}`}>{fnIn}</span>
                <span aria-hidden="true">→</span>
                {fnOut ? <Type t={parseType(fnOut)} side={{ inputs, output: true }} role={(errorIn || fnOut.startsWith("E")) && !fnOut.includes("<") ? "error" : "value"} /> : <span>ƒ</span>}
              </div>
            </div>
            <div className="ribbon-col"><span className="ribbon-type" aria-hidden="true"> </span>{arrow}</div>
          </>
        )}
        <div className="ribbon-col"><span className="ribbon-type">{showType(a)}</span><Type t={a} side={{ inputs, output: true }} /></div>
      </div>
      <figcaption className="ribbon-caption"><code className="tok">{op}</code>: <RichText text={caption ?? diff.caption} /></figcaption>
    </figure>
  );
}
