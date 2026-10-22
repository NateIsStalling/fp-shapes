import { useId } from "react";
import type { Scene, SceneInput, SceneNode, SlotNode, Step } from "../scenes/scene";
import { RichText } from "./RichText";
import { useStackWhenTooWide } from "./useStackWhenTooWide";

// Draws any Scene. Knows nothing about which operation produced it.
// Editable inputs are shape-sorter slots: real radio groups, one hole per
// case, with exactly one piece in place.

type SetInput = (key: string, fails: boolean) => void;

// Short spoken form of a node, for radio labels: "Right b₂", "Left e₁".
const text = (n: SceneNode): string => n.label;

const kindClass = (kind: string) => (kind === "collection" ? "layer-collection" : kind === "tuple" ? "layer-tuple" : "layer-effect");

function Node({ node, onSet, ghost = false }: { node: SceneNode; onSet: SetInput; ghost?: boolean }) {
  if (node.type === "ball") return <span className={`ball ball-${node.tone}${ghost ? " ball-ghost" : ""}`}>{node.label}</span>;
  if (node.type === "slot") return ghost ? <span className="ghost-box">{node.label}</span> : <Slot slot={node} onSet={onSet} />;
  return (
    <div className={`layer ${kindClass(node.kind)}${ghost ? " layer-ghost" : ""}`}>
      <span className="layer-label">{node.label}</span>
      <div className="layer-children">{node.children.map((c, i) => <Node key={i} node={c} onSet={onSet} ghost={ghost} />)}</div>
    </div>
  );
}

function Slot({ slot, onSet }: { slot: SlotNode; onSet: SetInput }) {
  const name = useId();
  return (
    <fieldset className="slot">
      <legend className="slot-label">{slot.label}</legend>
      <div className="slot-holes">
        {slot.options.map((o, i) => {
          const filled = i === slot.selected;
          return (
            <label key={o.name} className={`hole ${filled ? "hole-filled" : "hole-empty"}`}>
              <input type="radio" className="sr-only" name={name} checked={filled} aria-label={`${o.name} ${o.content.map(text).join(" ")}`.trim()} onChange={() => onSet(slot.key, o.fails)} />
              <span className="hole-name">{o.name}</span>
              <span className="hole-content">{o.content.map((c, j) => <Node key={j} node={c} onSet={onSet} ghost={!filled} />)}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function StepCell({ step, onSet }: { step: Step; onSet: SetInput }) {
  return (
    <div className={`step-cell${step.called ? "" : " step-not-called"}`}>
      <span className={step.called ? "connector" : "connector connector-skipped"} aria-hidden="true" />
      {step.label && <span className="step-label">{step.label}</span>}
      {step.effect && (
        <span className="effect-tag" title="A side effect: not a value, and not part of the result">
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" /><circle cx="8" cy="8" r="2" /></svg>
          <span><span className="sr-only">side effect: </span>{step.effect}</span>
        </span>
      )}
      {step.result ? <Node node={step.result} onSet={onSet} /> : step.called && !step.effect && <span className="step-text">called</span>}
      {!step.called && <span className="step-text step-text-skipped">not called</span>}
    </div>
  );
}

// When a container has one step per child, children and steps share grid
// columns, so each call sits directly under its element.
function Input({ input, onSet }: { input: SceneInput; onSet: SetInput }) {
  const { node, steps } = input;
  const aligned = steps && node.type === "container" && steps.length === node.children.length && steps.length > 1;
  return (
    <div className="scene-input">
      {input.caption && <span className="input-caption">{input.caption}</span>}
      {aligned && node.type === "container" ? (
        <div className="aligned" style={{ gridTemplateColumns: `repeat(${steps.length}, auto)` }}>
          <div className={`aligned-bg layer ${kindClass(node.kind)}`}><span className="layer-label">{node.label}</span></div>
          {node.children.map((c, i) => <div key={`c${i}`} className="aligned-child" style={{ gridColumn: i + 1 }}><Node node={c} onSet={onSet} /></div>)}
          {steps.map((s, i) => <div key={`s${i}`} className="aligned-step" style={{ gridColumn: i + 1 }}><StepCell step={s} onSet={onSet} /></div>)}
        </div>
      ) : (
        <div className="stacked">
          <Node node={node} onSet={onSet} />
          {steps?.map((s, i) => <StepCell key={i} step={s} onSet={onSet} />)}
        </div>
      )}
    </div>
  );
}

// Inputs (with their calls hanging underneath) sit left of the result when
// they fit. When they don't, the lane stacks and a "result" divider replaces
// the arrow, so the calls never read as a stage that feeds the result.
export function SceneView({ scene, onSet }: { scene: Scene; onSet: SetInput }) {
  const rowRef = useStackWhenTooWide<HTMLDivElement>("lane-stacked", scene);
  return (
    <figure className="card lane">
      <div className="lane-row" ref={rowRef}>
        {scene.inputsAs === "tuple" ? (
          <div className="lane-inputs">
            <div className="layer layer-tuple tuple-inputs" role="group" aria-label="Tuple">
              <span className="layer-label">Tuple</span>
              <div className="tuple-items">{scene.inputs.map((input, i) => <Input key={i} input={input} onSet={onSet} />)}</div>
            </div>
          </div>
        ) : (
          <div className="lane-inputs">{scene.inputs.map((input, i) => <Input key={i} input={input} onSet={onSet} />)}</div>
        )}
        <svg className="lane-arrow" viewBox="0 0 56 14" aria-hidden="true"><path d="M1 7h50" /><path d="M46 2l7 5-7 5" /></svg>
        <span className="lane-divider" aria-hidden="true">result</span>
        <div className="lane-output" aria-label="Result"><Node node={scene.output} onSet={() => undefined} /></div>
      </div>
      <figcaption aria-live="polite" className="lane-caption"><RichText text={scene.caption} /></figcaption>
    </figure>
  );
}
