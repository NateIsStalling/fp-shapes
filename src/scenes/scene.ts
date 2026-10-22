import type { EvaluationStrategy, Either, Option, Validation } from "../semantics";

// A Scene is everything the renderer needs to draw one operation run. It
// never names the operation; the UI draws any Scene the same way.

export type Tone = "in" | "out" | "error" | "skipped" | "plain";

export interface BallNode {
  readonly type: "ball";
  readonly label: string;
  readonly tone: Tone;
  // When set, the viewer can click this ball to flip the named input.
  readonly toggle?: string;
}

export interface ContainerNode {
  readonly type: "container";
  readonly kind: "collection" | "effect" | "tuple";
  readonly label: string;
  readonly children: readonly SceneNode[];
  // When set, clicking the layer's label flips the named input.
  readonly toggle?: string;
}

export type SceneNode = BallNode | ContainerNode;

// One function call, aligned with an input element (or the single value).
export interface Step {
  readonly called: boolean;
  readonly label?: string; // which function ran, e.g. "g (right)"
  readonly result?: BallNode;
}

export interface SceneInput {
  readonly caption?: string; // e.g. "fallback"
  readonly node: SceneNode;
  readonly steps?: readonly Step[];
}

export interface Scene {
  readonly inputs: readonly SceneInput[];
  readonly output: SceneNode;
  readonly caption: string;
}

export interface RibbonSpec {
  readonly before: readonly string[];
  readonly after: readonly string[];
  readonly fn?: string;
  readonly fnIn?: string;
  readonly fnOut?: readonly string[];
}

export type Toggles = Readonly<Record<string, boolean>>; // true = this input fails

export interface ReceiverScene {
  readonly id: string;
  readonly label: string;
  readonly ribbon: RibbonSpec;
  readonly defaults: Toggles;
  readonly strategies?: readonly EvaluationStrategy[]; // the control appears only when there are two or more
  readonly note?: string;
  readonly build: (toggles: Toggles, strategy: EvaluationStrategy) => Scene;
}

export interface OperationScenes {
  readonly receivers: readonly ReceiverScene[];
}

// --- node helpers -----------------------------------------------------------

export const ball = (label: string, tone: Tone, toggle?: string): BallNode =>
  toggle === undefined ? { type: "ball", label, tone } : { type: "ball", label, tone, toggle };

export const container = (kind: ContainerNode["kind"], label: string, children: readonly SceneNode[], toggle?: string): ContainerNode =>
  toggle === undefined ? { type: "container", kind, label, children } : { type: "container", kind, label, children, toggle };

export const list = (children: readonly SceneNode[]) => container("collection", "List", children);

export function eitherNode(e: Either<string, string>, toggle?: string, label = "Either"): ContainerNode {
  return container("effect", label, [e.tag === "right" ? ball(e.value, "out", toggle) : ball(e.error, "error", toggle)]);
}

export function inputEither(e: Either<string, string>, toggle?: string): ContainerNode {
  return container("effect", "Either", [e.tag === "right" ? ball(e.value, "in", toggle) : ball(e.error, "error", toggle)]);
}

export function optionNode(o: Option<string>, tone: "in" | "out", toggle?: string): ContainerNode {
  return container("effect", "Option", [o.tag === "some" ? ball(o.value, tone, toggle) : ball("None", "error", toggle)]);
}

export function validationNode(v: Validation<string, string>, tone: "in" | "out", toggle?: string): ContainerNode {
  return container("effect", "Validation", v.tag === "success" ? [ball(v.value, tone, toggle)] : v.errors.map((e) => ball(e, "error", toggle)));
}

export const show = {
  either: (e: Either<string, unknown>) => (e.tag === "right" ? `Right(${fmt(e.value)})` : `Left(${e.error})`),
  option: (o: Option<unknown>) => (o.tag === "some" ? `Some(${fmt(o.value)})` : "None"),
  validation: (v: Validation<string, unknown>) => (v.tag === "success" ? `Success(${fmt(v.value)})` : `Failure([${v.errors.join(", ")}])`),
};

function fmt(v: unknown): string {
  return Array.isArray(v) ? `[${v.map(fmt).join(", ")}]` : String(v);
}

export const SUB = ["₁", "₂", "₃", "₄", "₅", "₆"];
export const sub = (i: number) => SUB[i] ?? String(i + 1);
