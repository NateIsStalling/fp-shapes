import type { BallNode, Scene, SceneInput, SceneNode, Step } from "../scenes/scene";

// Draws any Scene. Knows nothing about which operation produced it.

interface Props {
  scene: Scene;
  toggles: Readonly<Record<string, boolean>>;
  onToggle: (key: string) => void;
}

const kindClass = (kind: string) => (kind === "collection" ? "layer-collection" : kind === "tuple" ? "layer-tuple" : "layer-effect");

function Ball({ node, toggles, onToggle }: { node: BallNode } & Pick<Props, "toggles" | "onToggle">) {
  const cls = `ball ball-${node.tone}`;
  if (!node.toggle) return <span className={cls}>{node.label}</span>;
  const failing = !!toggles[node.toggle];
  return (
    <button type="button" className={`${cls} ball-toggle`} aria-pressed={failing}
      aria-label={`${node.label}: ${failing ? "failing" : "succeeding"}. Activate to make it ${failing ? "succeed" : "fail"}.`}
      onClick={() => onToggle(node.toggle as string)}>
      {node.label}
    </button>
  );
}

function Node({ node, ...rest }: { node: SceneNode } & Pick<Props, "toggles" | "onToggle">) {
  if (node.type === "ball") return <Ball node={node} {...rest} />;
  const label = node.toggle ? (
    <button type="button" className="layer-label layer-label-toggle" aria-label={`${node.label} layer: succeeding. Activate to make it fail.`} onClick={() => rest.onToggle(node.toggle as string)}>{node.label}</button>
  ) : (
    <span className="layer-label">{node.label}</span>
  );
  return (
    <div className={`layer ${kindClass(node.kind)}`}>
      {label}
      <div className="layer-children">{node.children.map((c, i) => <Node key={i} node={c} {...rest} />)}</div>
    </div>
  );
}

function StepCell({ step }: { step: Step }) {
  return (
    <div className="step-cell">
      <span className={step.called ? "connector" : "connector connector-skipped"} aria-hidden="true" />
      {step.label && <span className="step-label">{step.label}</span>}
      {step.result ? <span className={`ball ball-${step.result.tone}`}>{step.result.label}</span>
        : step.called ? <span className="step-text">used</span>
        : <span className="step-text step-text-skipped">{`skipped`}</span>}
    </div>
  );
}

// When a container has one step per child, children and steps share grid
// columns, so each call sits directly under its element.
function Input({ input, ...rest }: { input: SceneInput } & Pick<Props, "toggles" | "onToggle">) {
  const { node, steps } = input;
  const aligned = steps && node.type === "container" && steps.length === node.children.length;
  return (
    <div className="scene-input">
      {input.caption && <span className="input-caption">{input.caption}</span>}
      {aligned ? (
        <div className="aligned" style={{ gridTemplateColumns: `repeat(${steps.length}, auto)` }}>
          <div className={`aligned-bg layer ${kindClass(node.kind)}`}><span className="layer-label">{node.label}</span></div>
          {node.children.map((c, i) => <div key={`c${i}`} className="aligned-child" style={{ gridColumn: i + 1 }}><Node node={c} {...rest} /></div>)}
          {steps.map((s, i) => <div key={`s${i}`} className="aligned-step" style={{ gridColumn: i + 1 }}><StepCell step={s} /></div>)}
        </div>
      ) : (
        <div className="stacked">
          <Node node={node} {...rest} />
          {steps?.map((s, i) => <StepCell key={i} step={s} />)}
        </div>
      )}
    </div>
  );
}

export function SceneView({ scene, toggles, onToggle }: Props) {
  return (
    <figure className="card lane">
      <div className="lane-row">
        <div className="lane-inputs">{scene.inputs.map((input, i) => <Input key={i} input={input} toggles={toggles} onToggle={onToggle} />)}</div>
        <svg className="ribbon-arrow" viewBox="0 0 56 14" aria-hidden="true"><path d="M1 7h50" /><path d="M46 2l7 5-7 5" /></svg>
        <div className="lane-output"><Node node={scene.output} toggles={{}} onToggle={() => undefined} /></div>
      </div>
      <figcaption aria-live="polite" className="lane-caption">{scene.caption}</figcaption>
    </figure>
  );
}
