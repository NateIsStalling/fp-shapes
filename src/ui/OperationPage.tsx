import { useState } from "react";
import { namesFor } from "../catalog/names";
import type { OperationInfo } from "../catalog/operations";
import { operationScenes } from "../scenes/registry";
import type { EvaluationStrategy } from "../semantics";
import { SceneView } from "./SceneView";
import { ShapeRibbon } from "./ShapeRibbon";

const STRATEGY_LABEL: Record<EvaluationStrategy, string> = { "short-circuit": "Short-circuiting", eager: "Eager" };
const STRATEGY_NOTE: Record<EvaluationStrategy, string> = {
  "short-circuit": "Nothing more is evaluated after the first failure. Eager evaluation gives the same result.",
  eager: "Every element is evaluated. Only the first failure survives, so the result matches short-circuiting.",
};

// One page for every operation: header, Shape Ribbon, behavior lane, names.
// Everything specific to an operation comes from the catalog and the scene
// registry.
export function OperationPage({ op }: { op: OperationInfo & { group: string } }) {
  const receivers = operationScenes[op.id]?.receivers ?? [];
  const [receiverId, setReceiverId] = useState(receivers[0]?.id ?? "");
  const receiver = receivers.find((r) => r.id === receiverId) ?? receivers[0];
  const [toggleState, setToggleState] = useState<Record<string, Record<string, boolean>>>({});
  const [strategy, setStrategy] = useState<EvaluationStrategy>("short-circuit");

  if (!receiver) return null;
  const toggles = toggleState[receiver.id] ?? receiver.defaults;
  const strategies = receiver.strategies ?? [];
  const activeStrategy: EvaluationStrategy = strategies.includes(strategy) ? strategy : (strategies[0] ?? "short-circuit");
  const scene = receiver.build(toggles, activeStrategy);
  const entries = namesFor(op.id, receiver.id, strategies.length ? activeStrategy : undefined);
  const setInput = (key: string, fails: boolean) => setToggleState((s) => ({ ...s, [receiver.id]: { ...toggles, [key]: fails } }));
  const hasToggles = Object.keys(receiver.defaults).length > 0;

  return (
    <div className="page-with-aside">
      <main className="main">
        <header className="op-header">
          <p className="eyebrow">{op.group}</p>
          <div className="op-title">
            <h1>{op.name}</h1>
            <span className="abstraction-tag"><span>abstraction</span>{op.abstraction}</span>
          </div>
          <p className="mono op-signature">{op.signature}</p>
          {receivers.length > 1 && (
            <div className="control-row">
              <span className="eyebrow">Receiver</span>
              <div className="seg" role="group" aria-label="Receiver">
                {receivers.map((r) => (
                  <button key={r.id} type="button" className={r.id === receiver.id ? "on" : ""} aria-pressed={r.id === receiver.id} onClick={() => setReceiverId(r.id)}>{r.label}</button>
                ))}
              </div>
            </div>
          )}
        </header>

        <section aria-labelledby="shape-h" className="section">
          <h2 id="shape-h"><span className="step">1</span>Shape: which layers move?</h2>
          <div className="card">
            <ShapeRibbon op={op.name} {...receiver.ribbon} />
          </div>
        </section>

        <section aria-labelledby="behavior-h" className="section">
          <h2 id="behavior-h"><span className="step">2</span>Behavior: what runs, and what comes out?</h2>
          <div className="control-row">
            {strategies.length > 1 && (
              <>
                <span className="eyebrow">Evaluation</span>
                <div className="seg" role="group" aria-label="Evaluation">
                  {strategies.map((s) => (
                    <button key={s} type="button" className={s === activeStrategy ? "on" : ""} aria-pressed={s === activeStrategy} onClick={() => setStrategy(s)}>{STRATEGY_LABEL[s]}</button>
                  ))}
                </div>
                <span className="note">{STRATEGY_NOTE[activeStrategy]}</span>
              </>
            )}
            {receiver.note && <span className="note">{receiver.note}</span>}
            {hasToggles && <span className="note">Each slot holds one of its cases. Move a piece into another hole to change that input.</span>}
          </div>
          <SceneView scene={scene} onSet={setInput} />
          {hasToggles && (
            <button type="button" className="link-button" onClick={() => setToggleState((s) => { const next = { ...s }; delete next[receiver.id]; return next; })}>Reset example</button>
          )}
        </section>
      </main>

      <aside className="aside" aria-labelledby="eco-h">
        <p className="eyebrow"><span className="step">3</span>Ecosystems: what is it called here?</p>
        <h2 id="eco-h" className="aside-title">{op.name} · {receiver.label}{strategies.length > 1 ? ` · ${STRATEGY_LABEL[activeStrategy].toLowerCase()}` : ""}</h2>
        {entries.length === 0 && <p className="muted">No conformance-tested entry yet for this combination.</p>}
        {entries.map((n) => (
          <div key={n.eco + n.api} className="eco-row">
            <div className="eco-head"><strong>{n.eco}</strong><span className="version">{n.version}</span></div>
            <span className="mono">{n.api}</span>
            {n.status === "partial" && <span className="status-partial">partial</span>}
            {n.note && <span className="muted">{n.note}</span>}
          </div>
        ))}
        <p className="muted small">Only entries confirmed by a conformance test are shown. LanguageExt, C#, F# and Haskell come with the catalog.</p>
      </aside>
    </div>
  );
}
