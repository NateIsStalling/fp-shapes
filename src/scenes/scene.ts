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
  // What choosing this case stores for the slot's key: true/false for a
  // two-case slot (true = the failing case), an index for a choice slot.
  readonly value: boolean | number;
  readonly content: readonly SceneNode[];
}

export interface SlotNode {
  readonly type: "slot";
  readonly label: string; // what the slot holds: "Either", "f(a₂)", ...
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
  // No function runs: the element itself is looked at (sequence). The UI
  // draws no call connector and says "not reached" when skipped.
  readonly lookedAt?: boolean;
}

export interface SceneInput {
  readonly caption?: string;
  readonly node: SceneNode;
  readonly steps?: readonly Step[];
}

export interface Scene {
  readonly inputs: readonly SceneInput[];
  // "tuple": the inputs are one argument, a tuple, drawn in one Tuple box.
  readonly inputsAs?: "tuple";
  readonly output: SceneNode;
  readonly caption: string;
}

// Types are written like signatures and parsed: "Either<E, List<B>>".
export interface RibbonSpec {
  readonly before: string;
  readonly after: string;
  // The function argument, as the signature writes it; the ribbon draws it.
  readonly fn?: string;
  // Replaces the generated caption when "layers moved, payload changed" would mislead.
  readonly caption?: string;
}

// One entry per input: true = the failing case of a two-case slot is
// selected; a number = the chosen case of a choice slot.
export type Toggles = Readonly<Record<string, boolean | number>>;

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

// Cases follow the type's parameter order, failure first: Left | Right,
// Failure | Success, None | Some (the Shape Ribbon uses the same order).
type Case = { readonly name: string; readonly content: readonly SceneNode[] };

function slot(label: string, key: string, t: Toggles, ok: Case, bad: Case): SlotNode {
  return { type: "slot", label, key, options: [{ ...bad, value: true }, { ...ok, value: false }], selected: t[key] ? 0 : 1 };
}

// A slot with any number of cases; the toggle stores the chosen index.
export function choiceSlot(t: Toggles, key: string, label: string, cases: readonly Case[]): SlotNode {
  const chosen = t[key];
  const selected = typeof chosen === "number" && chosen >= 0 && chosen < cases.length ? chosen : 0;
  return { type: "slot", label, key, options: cases.map((c, i) => ({ ...c, value: i })), selected };
}

// The chosen index of a choice slot.
export const choice = (t: Toggles, key: string): number => (typeof t[key] === "number" ? (t[key] as number) : 0);

// Slots for each sum type. `tone` is "in" for inputs and "out" for values a
// function returns.
export const eitherSlot = (t: Toggles, key: string, ok: string, err: string, tone: Tone = "in", label = "Either") =>
  slot(label, key, t, { name: "Right", content: [ball(ok, tone)] }, { name: "Left", content: [ball(err, "error")] });

export const optionSlot = (t: Toggles, key: string, ok: string, tone: Tone = "in", label = "Option") =>
  slot(label, key, t, { name: "Some", content: [ball(ok, tone)] }, { name: "None", content: [ball("None", "empty")] });

export const validationSlot = (t: Toggles, key: string, ok: string, errs: readonly string[], tone: Tone = "in", label = "Validation") =>
  slot(label, key, t, { name: "Success", content: [ball(ok, tone)] }, { name: "Failure", content: errs.map((e) => ball(e, "error")) });

export const boolSlot = (t: Toggles, key: string, label: string) =>
  slot(label, key, t, { name: "true", content: [ball("true", "out")] }, { name: "false", content: [ball("false", "error")] });

// A possibly missing value: null or a value.
export const nullableSlot = (t: Toggles, key: string, ok: string, label = "A | null") =>
  slot(label, key, t, { name: "value", content: [ball(ok, "in")] }, { name: "null", content: [ball("null", "empty")] });

// A slot whose success case holds another node, e.g. the outer layer of a
// nested Either.
export const nestedSlot = (t: Toggles, key: string, label: string, okName: string, inner: SceneNode, badName: string, bad: BallNode) =>
  slot(label, key, t, { name: okName, content: [inner] }, { name: badName, content: [bad] });

export const SUB = ["₁", "₂", "₃", "₄", "₅", "₆"];
export const sub = (i: number) => SUB[i] ?? String(i + 1);
