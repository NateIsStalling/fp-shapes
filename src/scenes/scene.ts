import type { EvaluationStrategy } from "../semantics";

// A Scene is everything the renderer needs to draw one operation run. It
// never names the operation; the UI draws any Scene the same way.

// Shape carries meaning as well as color: a value is a circle, an error a
// square, an absent value an empty ring.
export type Tone = "in" | "out" | "error" | "empty" | "plain";

export interface BallNode {
  readonly type: "ball";
  readonly label: string;
  readonly tone: Tone;
}

export interface ContainerNode {
  readonly type: "container";
  readonly kind: "collection" | "effect" | "tuple";
  readonly label: string;
  readonly children: readonly SceneNode[];
}

// A sum type is "one of" its cases, drawn as a shape-sorter slot: one hole
// per case, and exactly one piece in place. Picking a hole sets the input.
export interface SlotOption {
  readonly name: string; // constructor: Right, Left, Some, None, ...
  readonly fails: boolean;
  readonly content: readonly SceneNode[];
}

export interface SlotNode {
  readonly type: "slot";
  readonly label: string; // what the slot holds: "Either", "f(a₂) returns", ...
  readonly key: string; // the input this slot controls
  readonly options: readonly SlotOption[];
  readonly selected: number;
}

export type SceneNode = BallNode | ContainerNode | SlotNode;

// One function call, aligned with an input element (or the single value).
// `result` shows what the function returns; when it was not called, the UI
// still shows it (dimmed) so the viewer can set what it would return.
export interface Step {
  readonly called: boolean;
  readonly label?: string;
  readonly result?: SceneNode;
  // A side effect the call performed (e.g. "saw a"). It is not a value and
  // never reaches the output.
  readonly effect?: string;
}

export interface SceneInput {
  readonly caption?: string;
  readonly node: SceneNode;
  readonly steps?: readonly Step[];
}

export interface Scene {
  readonly inputs: readonly SceneInput[];
  readonly output: SceneNode;
  readonly caption: string;
}

// Types are written like signatures and parsed: "Either<E, List<B>>".
export interface RibbonSpec {
  readonly before: string;
  readonly after: string;
  readonly fn?: string;
  readonly fnIn?: string;
  readonly fnOut?: string;
}

export type Toggles = Readonly<Record<string, boolean>>; // true = the failing case is selected

export interface ReceiverScene {
  readonly id: string;
  readonly label: string;
  readonly ribbon: RibbonSpec;
  // What the operation's type variables stand for with this receiver.
  readonly binds: Readonly<Record<string, string>>;
  // The full signature, when this receiver's shape differs from the canonical one.
  readonly signature?: string;
  readonly defaults: Toggles;
  readonly strategies?: readonly EvaluationStrategy[]; // the control appears only when there are two or more
  readonly note?: string;
  readonly build: (toggles: Toggles, strategy: EvaluationStrategy) => Scene;
}

export interface OperationScenes {
  readonly receivers: readonly ReceiverScene[];
}

// --- node helpers -----------------------------------------------------------

export const ball = (label: string, tone: Tone): BallNode => ({ type: "ball", label, tone });

export const container = (kind: ContainerNode["kind"], label: string, children: readonly SceneNode[]): ContainerNode => ({
  type: "container",
  kind,
  label,
  children,
});

export const list = (children: readonly SceneNode[]) => container("collection", "List", children);
export const listOf = (labels: readonly string[], tone: Tone) => list(labels.map((l) => ball(l, tone)));

function slot(label: string, key: string, t: Toggles, ok: SlotOption, bad: SlotOption): SlotNode {
  return { type: "slot", label, key, options: [ok, bad], selected: t[key] ? 1 : 0 };
}

// Slots for each sum type. `tone` is "in" for inputs and "out" for values a
// function returns.
export const eitherSlot = (t: Toggles, key: string, ok: string, err: string, tone: Tone = "in", label = "Either") =>
  slot(label, key, t, { name: "Right", fails: false, content: [ball(ok, tone)] }, { name: "Left", fails: true, content: [ball(err, "error")] });

export const optionSlot = (t: Toggles, key: string, ok: string, tone: Tone = "in", label = "Option") =>
  slot(label, key, t, { name: "Some", fails: false, content: [ball(ok, tone)] }, { name: "None", fails: true, content: [ball("None", "empty")] });

export const validationSlot = (t: Toggles, key: string, ok: string, errs: readonly string[], tone: Tone = "in", label = "Validation") =>
  slot(label, key, t, { name: "Success", fails: false, content: [ball(ok, tone)] }, { name: "Failure", fails: true, content: errs.map((e) => ball(e, "error")) });

export const boolSlot = (t: Toggles, key: string, label: string) =>
  slot(label, key, t, { name: "true", fails: false, content: [ball("true", "out")] }, { name: "false", fails: true, content: [ball("false", "error")] });

// A slot whose success case holds another node, e.g. the outer layer of a
// nested Either.
export const nestedSlot = (t: Toggles, key: string, label: string, okName: string, inner: SceneNode, badName: string, bad: BallNode) =>
  slot(label, key, t, { name: okName, fails: false, content: [inner] }, { name: badName, fails: true, content: [bad] });

export const SUB = ["₁", "₂", "₃", "₄", "₅", "₆"];
export const sub = (i: number) => SUB[i] ?? String(i + 1);
