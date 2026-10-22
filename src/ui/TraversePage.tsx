import { useState } from "react";
import { Link } from "react-router-dom";
import {
  evaluationStrategies,
  failure,
  left,
  none,
  right,
  some,
  success,
  traverseEither,
  traverseOption,
  traverseValidation,
  type EvaluationStrategy,
  type TraverseReceiver,
} from "../semantics";
import { ShapeRibbon } from "./ShapeRibbon";

const SUB = ["₁", "₂", "₃", "₄"];
const RECEIVERS: { id: TraverseReceiver; label: string }[] = [
  { id: "either", label: "Either" },
  { id: "option", label: "Option" },
  { id: "validation", label: "Validation" },
];
const STRATEGY_LABEL: Record<EvaluationStrategy, string> = { "short-circuit": "Short-circuiting", eager: "Eager" };
const STRATEGY_NOTE: Record<EvaluationStrategy, string> = {
  "short-circuit": "f is not called after the first failure. Eager evaluation gives the same result with more calls.",
  eager: "f is called on every element. Only the first failure survives, so the result matches short-circuiting.",
};
const VALIDATION_NOTE = "Validation calls f on every element so it can keep every failure. The accumulation comes from the receiver, not from traverse.";

// Ecosystem names backed by conformance tests (tests/conformance/traverse.test.ts).
const NAMES: Record<string, { eco: string; version: string; api: string; note: string }[]> = {
  "either:short-circuit": [
    { eco: "fp-ts", version: "2.16.11", api: "E.traverseArray", note: "Short-circuit." },
    { eco: "Effect", version: "4.0.5", api: "Effect.forEach", note: "On Effect, not Result. Sequential by default." },
  ],
  "either:eager": [{ eco: "fp-ts", version: "2.16.11", api: "TE.traverseArray", note: "TaskEither, parallel: every task runs, the first Left wins." }],
  "option:short-circuit": [{ eco: "fp-ts", version: "2.16.11", api: "O.traverseArray", note: "Short-circuit." }],
  "option:eager": [],
  "validation:eager": [
    { eco: "fp-ts", version: "2.16.11", api: "RA.traverse(E.getApplicativeValidation(S))", note: "Keeps every failure." },
    { eco: "Effect", version: "4.0.5", api: "Effect.validate", note: "On Effect. Evaluates every element and keeps every failure." },
  ],
};

type Cell = { index: number; label: string; fails: boolean; called: boolean; result?: string; ok?: boolean };

export function TraversePage() {
  const [receiver, setReceiver] = useState<TraverseReceiver>("either");
  const [strategy, setStrategy] = useState<EvaluationStrategy>("short-circuit");
  const [fails, setFails] = useState<boolean[]>([false, true, false, true]);

  const strategies = evaluationStrategies[receiver];
  const activeStrategy = strategies.includes(strategy) ? strategy : (strategies[0] as EvaluationStrategy);
  const indices = fails.map((_, i) => i);
  const sub = (i: number) => SUB[i] ?? String(i + 1);

  // Run the real semantics; the diagram is drawn from the result and trace.
  let calledSet: Set<number>;
  let outputs: Map<number, { ok: boolean; label: string }>;
  let resultLabel: string;
  let resultOk: boolean;
  let errLabels: string[] = [];
  if (receiver === "either") {
    const run = traverseEither(activeStrategy, indices, (i) => (fails[i] ? left(`e${sub(i)}`) : right(`b${sub(i)}`)));
    calledSet = new Set(run.trace.calls.map((c) => c.input));
    outputs = new Map(run.trace.calls.map((c) => [c.input, c.output.tag === "right" ? { ok: true, label: c.output.value } : { ok: false, label: c.output.error }]));
    resultOk = run.result.tag === "right";
    errLabels = run.result.tag === "left" ? [run.result.error] : [];
    resultLabel = run.result.tag === "right" ? `Right([${run.result.value.join(", ")}])` : `Left(${run.result.error})`;
  } else if (receiver === "option") {
    const run = traverseOption(activeStrategy, indices, (i) => (fails[i] ? none : some(`b${sub(i)}`)));
    calledSet = new Set(run.trace.calls.map((c) => c.input));
    outputs = new Map(run.trace.calls.map((c) => [c.input, c.output.tag === "some" ? { ok: true, label: c.output.value } : { ok: false, label: "None" }]));
    resultOk = run.result.tag === "some";
    errLabels = resultOk ? [] : ["None"];
    resultLabel = run.result.tag === "some" ? `Some([${run.result.value.join(", ")}])` : "None";
  } else {
    const run = traverseValidation(indices, (i) => (fails[i] ? failure([`e${sub(i)}`]) : success(`b${sub(i)}`)));
    calledSet = new Set(run.trace.calls.map((c) => c.input));
    outputs = new Map(run.trace.calls.map((c) => [c.input, c.output.tag === "success" ? { ok: true, label: c.output.value } : { ok: false, label: c.output.errors.join(", ") }]));
    resultOk = run.result.tag === "success";
    errLabels = run.result.tag === "failure" ? [...run.result.errors] : [];
    resultLabel = run.result.tag === "success" ? `Success([${run.result.value.join(", ")}])` : `Failure([${run.result.errors.join(", ")}])`;
  }

  const cells: Cell[] = indices.map((i) => {
    const out = outputs.get(i);
    return { index: i, label: `a${sub(i)}`, fails: fails[i] ?? false, called: calledSet.has(i), ...(out ? { result: out.label, ok: out.ok } : {}) };
  });
  const calls = calledSet.size;
  const failures = fails.filter(Boolean).length;
  const effName = RECEIVERS.find((r) => r.id === receiver)?.label ?? "";
  const firstFail = fails.findIndex(Boolean);
  const summary =
    (failures === 0
      ? "f ran on all 4 elements and none failed."
      : receiver === "validation"
        ? `f ran on all 4 elements. All ${failures} failures are kept.`
        : activeStrategy === "short-circuit"
          ? `f ran on ${calls} of 4 elements, then stopped at the failure on a${sub(firstFail)}.`
          : `f ran on all 4 elements. ${failures} failed, and only the first failure survives.`) +
    ` Result: ${resultLabel}.` +
    (failures && receiver !== "validation" ? " The other evaluation gives the same result." : "");
  const names = NAMES[`${receiver}:${activeStrategy}`] ?? [];

  return (
    <div className="page-with-aside">
      <main className="main">
        <header className="op-header">
          <p className="eyebrow">Traversing</p>
          <div className="op-title">
            <h1>traverse</h1>
            <Link className="abstraction-tag" to="/"><span>abstraction</span>Traversable</Link>
          </div>
          <p className="mono op-signature">(A → F&lt;B&gt;) → T&lt;A&gt; → F&lt;T&lt;B&gt;&gt;</p>
          <div className="control-row">
            <span className="eyebrow">Receiver F</span>
            <div className="seg" role="group" aria-label="Receiver">
              {RECEIVERS.map((r) => (
                <button key={r.id} type="button" className={r.id === receiver ? "on" : ""} aria-pressed={r.id === receiver} onClick={() => setReceiver(r.id)}>{r.label}</button>
              ))}
            </div>
            <span className="muted">Decides the result: which failures survive.</span>
          </div>
        </header>

        <section aria-labelledby="shape-h" className="section">
          <h2 id="shape-h"><span className="step">1</span>Shape: which layers move?</h2>
          <div className="card">
            <ShapeRibbon before={["List", "A"]} fn={`A → ${effName}<B>`} fnOut={[effName, "B"]} after={[effName, "List", "B"]} op="traverse" />
          </div>
          <p className="muted">Without f, the same layer swap is sequence:</p>
          <ShapeRibbon before={["List", effName, "A"]} after={[effName, "List", "A"]} op="sequence" compact />
        </section>

        <section aria-labelledby="behavior-h" className="section">
          <h2 id="behavior-h"><span className="step">2</span>Behavior: which calls run, and which failures survive?</h2>
          <div className="control-row">
            {strategies.length > 1 && (
              <>
                <span className="eyebrow">Evaluation</span>
                <div className="seg" role="group" aria-label="Evaluation">
                  {strategies.map((s) => (
                    <button key={s} type="button" className={s === activeStrategy ? "on" : ""} aria-pressed={s === activeStrategy} onClick={() => setStrategy(s)}>{STRATEGY_LABEL[s]}</button>
                  ))}
                </div>
              </>
            )}
            <span className="note">{receiver === "validation" ? VALIDATION_NOTE : STRATEGY_NOTE[activeStrategy]}</span>
          </div>

          <figure className="card lane">
            <div className="lane-row">
              <div className="lane-input">
                <div className="layer layer-collection">
                  <span className="layer-label">List</span>
                  <div className="lane-grid">
                    {cells.map((c) => (
                      <button key={c.index} type="button" className={`ball ball-toggle${c.fails ? " ball-failing" : ""}`} aria-pressed={c.fails}
                        aria-label={`${c.label}: f ${c.fails ? "fails" : "succeeds"} here. Activate to toggle.`}
                        onClick={() => setFails((fs) => fs.map((v, i) => (i === c.index ? !v : v)))}>{c.label}</button>
                    ))}
                  </div>
                </div>
                <div className="lane-grid lane-pad" aria-hidden="true">
                  {cells.map((c) => <span key={c.index} className={c.called ? "connector" : "connector connector-skipped"} />)}
                </div>
                <div className="lane-grid lane-pad">
                  {cells.map((c) =>
                    c.called ? (
                      <span key={c.index} className={`ball ${c.ok ? "ball-out" : "ball-error"}`}>{c.result}</span>
                    ) : (
                      <span key={c.index} className="ball ball-skipped" aria-label="not called" />
                    ),
                  )}
                </div>
              </div>
              <svg className="ribbon-arrow" viewBox="0 0 56 14" aria-hidden="true"><path d="M1 7h50" /><path d="M46 2l7 5-7 5" /></svg>
              <div className="layer layer-effect" role="img" aria-label={`Result: ${resultLabel}`}>
                <span className="layer-label">{effName}</span>
                {resultOk ? (
                  <div className="layer layer-collection">
                    <span className="layer-label">List</span>
                    <div className="ball-row">{cells.map((c) => <span key={c.index} className="ball ball-small ball-out">b{sub(c.index)}</span>)}</div>
                  </div>
                ) : (
                  <div className="ball-row">{errLabels.map((e) => <span key={e} className="ball ball-error">{e}</span>)}</div>
                )}
              </div>
            </div>
            <figcaption aria-live="polite" className="lane-caption">{summary}</figcaption>
            <button type="button" className="link-button" onClick={() => { setReceiver("either"); setStrategy("short-circuit"); setFails([false, true, false, true]); }}>Reset example</button>
          </figure>
        </section>
      </main>

      <aside className="aside" aria-labelledby="eco-h">
        <p className="eyebrow"><span className="step">3</span>Ecosystems: what is it called here?</p>
        <h2 id="eco-h" className="aside-title">traverse · {effName}{receiver === "validation" ? "" : ` · ${STRATEGY_LABEL[activeStrategy].toLowerCase()}`}</h2>
        {names.length === 0 && <p className="muted">No conformance-tested entry yet for this combination.</p>}
        {names.map((n) => (
          <div key={n.api} className="eco-row">
            <div className="eco-head"><strong>{n.eco}</strong><span className="version">{n.version}</span></div>
            <span className="mono">{n.api}</span>
            <span className="muted">{n.note}</span>
          </div>
        ))}
        <p className="muted small">Only entries verified by a conformance test are shown. LanguageExt, C#, F# and Haskell entries come with the catalog.</p>
      </aside>
    </div>
  );
}
