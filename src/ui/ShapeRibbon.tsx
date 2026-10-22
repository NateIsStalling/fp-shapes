import type { ReactNode } from "react";
import { diffLayers, layerKind, typeOf } from "../scenes/ribbon";

interface Props {
  before: readonly string[];
  after: readonly string[];
  op: string;
  fn?: string;
  fnIn?: string;
  fnOut?: readonly string[];
  compact?: boolean;
}

function Stack({ layers, payloadClass }: { layers: readonly string[]; payloadClass: string }) {
  const containers = layers.slice(0, -1);
  const payload = <span className={`ball ${payloadClass}`}>{layers[layers.length - 1]}</span>;
  const inner = containers.reduceRight<ReactNode>(
    (child, name) => (
      <div className={`layer layer-${layerKind(name)}`}>
        <span className="layer-label">{name}</span>
        {child}
      </div>
    ),
    containers.length ? payload : <div className="layer-bare">{payload}</div>,
  );
  return <div role="img" aria-label={layers.join(" containing ")}>{inner}</div>;
}

export function ShapeRibbon({ before, after, op, fn, fnIn = "A", fnOut, compact = false }: Props) {
  const diff = diffLayers(before, after);
  const signature = fn ? `${typeOf(before)} × (${fn}) → ${typeOf(after)}` : `${typeOf(before)} → ${typeOf(after)}`;
  const arrow = (
    <svg className="ribbon-arrow" viewBox="0 0 56 14" aria-hidden="true">
      <path d="M1 7h50" /><path d="M46 2l7 5-7 5" />
    </svg>
  );
  return (
    <figure className={`ribbon${compact ? " ribbon-compact" : ""}`}>
      {!compact && <p className="ribbon-signature">{signature}</p>}
      <div className="ribbon-grid">
        <div className="ribbon-col"><span className="ribbon-type">{typeOf(before)}</span><Stack layers={before} payloadClass="ball-in" /></div>
        <div className="ribbon-col"><span className="ribbon-type" aria-hidden="true"> </span>{arrow}</div>
        {fn && (
          <>
            <div className="ribbon-col">
              <span className="ribbon-type">{fn}</span>
              <div className="ribbon-fn">
                <span className="ball ball-in">{fnIn}</span>
                <span aria-hidden="true">→</span>
                {fnOut ? <Stack layers={fnOut} payloadClass="ball-out" /> : <span>ƒ</span>}
              </div>
            </div>
            <div className="ribbon-col"><span className="ribbon-type" aria-hidden="true"> </span>{arrow}</div>
          </>
        )}
        <div className="ribbon-col"><span className="ribbon-type">{typeOf(after)}</span><Stack layers={after} payloadClass={diff.payloadChanged ? "ball-out" : "ball-in"} /></div>
      </div>
      <figcaption className="ribbon-caption">{op}: {diff.caption}</figcaption>
    </figure>
  );
}
