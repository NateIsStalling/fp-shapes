import { useEffect, useState } from "react";
import { namesFor, type NameEntry } from "../catalog/names";
import type { OperationInfo } from "../catalog/operations";
import { operationScenes } from "../scenes/registry";
import { instantiate, markType, tokenize } from "../scenes/signature";
import type { EvaluationStrategy } from "../semantics";
import { SampleBlock } from "./SampleBlock";
import { RichText } from "./RichText";
import { SceneView } from "./SceneView";
import { ShapeRibbon } from "./ShapeRibbon";
import { usePreview } from "./preview";

const LANGUAGE = { LanguageExt: "C#", "fp-ts": "TypeScript", Effect: "TypeScript", Haskell: "Haskell" } as const;
// Plain words for the catalog's status, shown as a chip on examples that
// aren't a direct match. "none" needs no chip: its api already says so.
const STATUS_CHIP: Partial<Record<NameEntry["status"], { label: string; title: string }>> = {
  library: { label: "extra package", title: "Not in the standard library; it comes from the package named above." },
  partial: { label: "not exact", title: "Close, but it differs from this page; the note says how." },
  analogy: { label: "workaround", title: "No direct counterpart; this is the usual way to get the same result." },
};

// Which calls run after a failure. The receiver decides the result; this only
// decides how many calls happen. ("Evaluation strategy" would mean lazy vs
// strict to a Haskeller, so the control says what it does.)
const STRATEGY_LABEL: Record<EvaluationStrategy, string> = { "short-circuit": "Stop", eager: "Keep going" };
const STRATEGY_NOTE: Record<EvaluationStrategy, string> = {
  "short-circuit": "Elements after the first failure are skipped. When every call returns, both settings give the same result.",
  eager: "Every element is reached, and only the first failure survives. When every call returns, both settings give the same result.",
};

// One page for every operation: header, Shape Ribbon, behavior lane, names.
// Everything specific to an operation comes from the catalog and the scene
// registry.
export function OperationPage({ op }: { op: OperationInfo & { group: string } }) {
  const receivers = operationScenes[op.id]?.receivers ?? [];
  const [receiverId, setReceiverId] = useState(receivers[0]?.id ?? "");
  const receiver = receivers.find((r) => r.id === receiverId) ?? receivers[0];
  const [toggleState, setToggleState] = useState<Record<string, Record<string, boolean | number>>>({});
  const [strategy, setStrategy] = useState<EvaluationStrategy>("short-circuit");
  const preview = usePreview().on;
  useEffect(() => {
    document.title = `${op.name} · FP Shapes`;
    return () => { document.title = "FP Shapes"; };
  }, [op.name]);

  if (!receiver) return null;
  const toggles = toggleState[receiver.id] ?? receiver.defaults;
  const strategies = receiver.strategies ?? [];
  const activeStrategy: EvaluationStrategy = strategies.includes(strategy) ? strategy : (strategies[0] ?? "short-circuit");
  const scene = receiver.build(toggles, activeStrategy);
  const entries = namesFor(op.id, receiver.id, strategies.length ? activeStrategy : undefined, preview);
  const setInput = (key: string, value: boolean | number) => setToggleState((s) => ({ ...s, [receiver.id]: { ...toggles, [key]: value } }));
  const hasToggles = Object.keys(receiver.defaults).length > 0;

  return (
    <div className="op-page">
      <header className="title-bar">
        <div className="op-header">
          <nav aria-label="Breadcrumb" className="breadcrumb">
            <ol><li>Operations</li><li>{op.group}</li></ol>
          </nav>
          <h1>{op.name}</h1>
          <div className="op-shape">
            <p className="mono op-signature">
              {tokenize(op.signature, op.receiverVar).map((tk, i) => (tk.isVar ? <span key={i} className="type-var">{tk.text}</span> : tk.text))}
            </p>
          </div>
          <div className="control-row receiver-row">
            <span className="receiver-label" aria-hidden="true"><span className="type-var">{op.receiverVar}</span> =</span>
            {receivers.length > 1 ? (
              <div className="seg" role="group" aria-label={`Receiver: ${op.receiverVar}`}>
                {receivers.map((r) => (
                  <button key={r.id} type="button" className={r.id === receiver.id ? "on" : ""} aria-pressed={r.id === receiver.id} onClick={() => setReceiverId(r.id)}>{r.label}</button>
                ))}
              </div>
            ) : (
              <span className="seg seg-fixed" aria-label={`Receiver: ${op.receiverVar}`}><span className="on">{receiver.label}</span></span>
            )}
          </div>
          <p className="mono op-signature-concrete" aria-live="polite">
            <span className="sr-only">With {receiver.label}: </span>
            {markType(receiver.signature ?? instantiate(op.signature, receiver.binds), receiver.binds[op.receiverVar] ?? "").map((p, i) => (p.isType ? <strong key={i} className="bound-type">{p.text}</strong> : p.text))}
          </p>
        </div>
      </header>
      <div className="page-with-aside">
      <main className="main">

        <section aria-labelledby="shape-h" className="section">
          <h2 id="shape-h">Shape</h2>
          <div className="card">
            <ShapeRibbon op={op.name} {...receiver.ribbon} />
          </div>
        </section>

        <section aria-labelledby="behavior-h" className="section">
          <h2 id="behavior-h">Behavior</h2>
          {strategies.length > 1 && (
            <div className="control-row">
              <span className="eyebrow">After a failure</span>
              <div className="seg" role="group" aria-label="After a failure">
                {strategies.map((s) => (
                  <button key={s} type="button" className={s === activeStrategy ? "on" : ""} aria-pressed={s === activeStrategy} onClick={() => setStrategy(s)}>{STRATEGY_LABEL[s]}</button>
                ))}
              </div>
            </div>
          )}
          {/* One note per line, so they read as a list, not as columns. */}
          <div className="behavior-notes">
            {strategies.length > 1 && <p className="note">{STRATEGY_NOTE[activeStrategy]}</p>}
            {receiver.note && <p className="note"><RichText text={receiver.note} /></p>}
            {hasToggles && <p className="note">Each slot holds one of its cases. Choose a different case to change that input.</p>}
          </div>
          <SceneView scene={scene} onSet={setInput} />
          {hasToggles && (
            <button type="button" className="link-button" onClick={() => setToggleState((s) => { const next = { ...s }; delete next[receiver.id]; return next; })}>Reset example</button>
          )}
        </section>
      </main>

      <aside className="aside" aria-labelledby="eco-h">
        <div className="aside-head">
          <h2 id="eco-h" className="aside-title">Examples</h2>
          <p className="aside-context">
            For <span className="bound-type">{receiver.label}</span>{strategies.length > 1 ? `, ${STRATEGY_LABEL[activeStrategy].toLowerCase()}` : ""}
          </p>
        </div>
        {entries.length === 0 && <p className="muted">Under construction.</p>}
        <div className="eco-list">
        {entries.map((n) => (
          <div key={n.eco + n.api} className="eco-row">
            <div className="eco-head"><strong>{n.eco}</strong><span className="version">{n.version}</span></div>
            <span className="mono">{n.api}</span>
            {STATUS_CHIP[n.status] && (
              <span className="status-tags">
                <span className={`status-pill status-${n.status}`} title={STATUS_CHIP[n.status]?.title}>{STATUS_CHIP[n.status]?.label}</span>
              </span>
            )}
            {n.note && <span className="muted"><RichText text={n.note} /></span>}
            {n.sample && <SampleBlock code={n.sample} language={LANGUAGE[n.eco]} />}
          </div>
        ))}
        </div>
      </aside>
    </div>
    </div>
  );
}
