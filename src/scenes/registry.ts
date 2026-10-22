import {
  altEither,
  altList,
  altOption,
  altValidation,
  bimapEither,
  bimapTuple,
  evaluationStrategies,
  failure,
  filterOption,
  filterOrElseEither,
  flatMapEither,
  flatMapList,
  flatMapOption,
  flattenEither,
  flattenList,
  flattenOption,
  getOrElseEitherWith,
  getOrElseOption,
  left,
  mapEither,
  mapErrorEither,
  mapErrorValidation,
  mapList,
  mapOption,
  matchEither,
  matchOption,
  matchValidation,
  none,
  peek,
  peekList,
  recoverEither,
  right,
  some,
  success,
  tapEither,
  tapOption,
  traverseEither,
  traverseOption,
  traverseValidation,
  zipWithEither,
  zipWithListCartesian,
  zipWithListPositional,
  zipWithValidation,
  type Either,
  type Option,
  type Validation,
} from "../semantics";
import {
  ball,
  container,
  eitherNode,
  inputEither,
  list,
  optionNode,
  show,
  sub,
  validationNode,
  type BallNode,
  type OperationScenes,
  type Scene,
  type Step,
  type Toggles,
} from "./scene";

// Each operation lists the receivers it is drawn for. A builder runs the real
// semantics and describes the run as a Scene. No React here.

const eitherIn = (t: Toggles, key: string, ok = "a", err = "e"): Either<string, string> => (t[key] ? left(err) : right(ok));
const optionIn = (t: Toggles, key: string, ok = "a"): Option<string> => (t[key] ? none : some(ok));
const stepOf = (called: boolean, result?: BallNode, label?: string): Step => ({ called, ...(result ? { result } : {}), ...(label ? { label } : {}) });
const resultBall = (e: Either<string, string>, toggle?: string) => (e.tag === "right" ? ball(e.value, "out", toggle) : ball(e.error, "error", toggle));
const optBall = (o: Option<string>, toggle?: string) => (o.tag === "some" ? ball(o.value, "out", toggle) : ball("None", "error", toggle));
const bare = (label: string, tone: BallNode["tone"] = "out") => ball(label, tone);

const listOf = (labels: readonly string[], tone: BallNode["tone"]) => list(labels.map((l) => ball(l, tone)));
const elems = (n: number, prefix: string) => Array.from({ length: n }, (_, i) => `${prefix}${sub(i)}`);

// --- traverse and sequence share the element toggles and strategies ---------

const four = { a1: false, a2: true, a3: false, a4: true };
const idx = [0, 1, 2, 3];

function traverseScene(kind: "either" | "option" | "validation", t: Toggles, strategy: Parameters<typeof traverseEither>[0], isSequence: boolean): Scene {
  const fails = idx.map((i) => !!t[`a${i + 1}`]);
  const toggle = (i: number) => `a${i + 1}`;
  type Out = { ok: boolean; label: string };
  let calls: Map<number, Out>;
  let output: Scene["output"];
  let resultText: string;
  if (kind === "either") {
    const r = traverseEither(strategy, idx, (i) => (fails[i] ? left(`e${sub(i)}`) : right(`b${sub(i)}`)));
    calls = new Map(r.trace.calls.map((c) => [c.input, c.output.tag === "right" ? { ok: true, label: c.output.value } : { ok: false, label: c.output.error }]));
    output = r.result.tag === "right" ? container("effect", "Either", [listOf(r.result.value, "out")]) : container("effect", "Either", [ball(r.result.error, "error")]);
    resultText = show.either(r.result);
  } else if (kind === "option") {
    const r = traverseOption(strategy, idx, (i) => (fails[i] ? none : some(`b${sub(i)}`)));
    calls = new Map(r.trace.calls.map((c) => [c.input, c.output.tag === "some" ? { ok: true, label: c.output.value } : { ok: false, label: "None" }]));
    output = r.result.tag === "some" ? container("effect", "Option", [listOf(r.result.value, "out")]) : container("effect", "Option", [ball("None", "error")]);
    resultText = show.option(r.result);
  } else {
    const r = traverseValidation(idx, (i) => (fails[i] ? failure([`e${sub(i)}`]) : success(`b${sub(i)}`)));
    calls = new Map(r.trace.calls.map((c) => [c.input, c.output.tag === "success" ? { ok: true, label: c.output.value } : { ok: false, label: c.output.errors.join(", ") }]));
    output = r.result.tag === "success" ? container("effect", "Validation", [listOf(r.result.value, "out")]) : container("effect", "Validation", r.result.errors.map((e) => ball(e, "error")));
    resultText = show.validation(r.result);
  }
  const eff = kind === "either" ? "Either" : kind === "option" ? "Option" : "Validation";
  const input = isSequence
    ? list(idx.map((i) => container("effect", eff, [fails[i] ? ball(kind === "option" ? "None" : `e${sub(i)}`, "error", toggle(i)) : ball(`b${sub(i)}`, "in", toggle(i))])))
    : list(idx.map((i) => ball(`a${sub(i)}`, fails[i] ? "error" : "in", toggle(i))));
  const steps = idx.map((i) => {
    const c = calls.get(i);
    return c ? stepOf(true, isSequence ? undefined : ball(c.label, c.ok ? "out" : "error")) : stepOf(false);
  });
  const n = fails.filter(Boolean).length;
  const who = isSequence ? "Each element was inspected" : "f ran";
  const caption =
    (n === 0
      ? `${isSequence ? "Every element succeeded" : "f ran on all 4 elements and none failed"}.`
      : kind === "validation"
        ? `${isSequence ? "Every element was inspected" : "f ran on all 4 elements"}. All ${n} failures are kept.`
        : strategy === "short-circuit"
          ? `${isSequence ? `${calls.size} of 4 elements were inspected` : `f ran on ${calls.size} of 4 elements`}, then stopped at the first failure.`
          : `${isSequence ? "All 4 elements were inspected" : `${who} on all 4 elements`}. ${n} failed, and only the first failure survives.`) +
    ` Result: ${resultText}.` +
    (n && kind !== "validation" ? " The other evaluation gives the same result." : "");
  return { inputs: [{ node: input, steps }], output, caption };
}

const VALIDATION_NOTE = "Validation looks at every element so it can keep every failure. The accumulation comes from the receiver, not from the operation.";

export const operationScenes: Readonly<Record<string, OperationScenes>> = {
  // --- Mapping ---------------------------------------------------------------
  map: { receivers: [
    { id: "either", label: "Either", ribbon: { before: ["Either", "A"], after: ["Either", "B"], fn: "A → B", fnOut: ["B"] }, defaults: { input: false },
      build: (t) => {
        const r = mapEither(eitherIn(t, "input"), () => "b");
        const called = r.trace.calls.length > 0;
        return { inputs: [{ node: inputEither(eitherIn(t, "input"), "input"), steps: [stepOf(called, called ? ball("b", "out") : undefined)] }], output: eitherNode(r.result),
          caption: called ? "f ran on a. The Either stays; its payload changes from a to b." : "The input is a Left, so f never runs. The Left passes through unchanged." };
      } },
    { id: "option", label: "Option", ribbon: { before: ["Option", "A"], after: ["Option", "B"], fn: "A → B", fnOut: ["B"] }, defaults: { input: false },
      build: (t) => {
        const r = mapOption(optionIn(t, "input"), () => "b");
        const called = r.trace.calls.length > 0;
        return { inputs: [{ node: optionNode(optionIn(t, "input"), "in", "input"), steps: [stepOf(called, called ? ball("b", "out") : undefined)] }], output: optionNode(r.result, "out"),
          caption: called ? "f ran on a. The Option stays; its payload changes from a to b." : "The input is None, so f never runs." };
      } },
    { id: "list", label: "List", ribbon: { before: ["List", "A"], after: ["List", "B"], fn: "A → B", fnOut: ["B"] }, defaults: {},
      build: () => {
        const r = mapList(elems(3, "a"), (a) => a.replace("a", "b"));
        return { inputs: [{ node: listOf(elems(3, "a"), "in"), steps: r.trace.calls.map((c) => stepOf(true, ball(c.output, "out"))) }], output: listOf(r.result, "out"),
          caption: "f ran once per element. The list keeps its length and order." };
      } },
  ] },

  bimap: { receivers: [
    { id: "either", label: "Either", ribbon: { before: ["Either", "A"], after: ["Either", "B"], fn: "E → E₂ | A → B" }, defaults: { input: false },
      build: (t) => {
        const r = bimapEither(eitherIn(t, "input"), () => "e₂", () => "b");
        const c = r.trace.calls[0];
        return { inputs: [{ node: inputEither(eitherIn(t, "input"), "input"), steps: [stepOf(true, resultBall(r.result as Either<string, string>), c?.fn === "left" ? "f (left)" : "g (right)")] }],
          output: eitherNode(r.result as Either<string, string>),
          caption: c?.fn === "left" ? "Only the left function ran: Either holds one side at a time." : "Only the right function ran: Either holds one side at a time." };
      } },
    { id: "tuple", label: "Tuple", ribbon: { before: ["Tuple", "A, X"], after: ["Tuple", "B, Y"], fn: "A → B | X → Y" }, defaults: {},
      build: () => {
        const r = bimapTuple(["a", "x"], () => "b", () => "y");
        return { inputs: [{ node: container("tuple", "Tuple", [ball("a", "in"), ball("x", "in")]), steps: [stepOf(true, ball("b", "out"), "f"), stepOf(true, ball("y", "out"), "g")] }],
          output: container("tuple", "Tuple", [ball(r.result[0], "out"), ball(r.result[1], "out")]),
          caption: "Both functions ran: a Tuple holds both sides at once." };
      } },
  ] },

  // --- Sequencing ------------------------------------------------------------
  flatMap: { receivers: [
    { id: "either", label: "Either", ribbon: { before: ["Either", "A"], after: ["Either", "B"], fn: "A → Either<B>", fnOut: ["Either", "B"] }, defaults: { input: false, f: false },
      build: (t) => {
        const f = () => (t.f ? left("e₂") : right("b"));
        const r = flatMapEither(eitherIn(t, "input", "a", "e₁"), f);
        const called = r.trace.calls.length > 0;
        return { inputs: [{ node: inputEither(eitherIn(t, "input", "a", "e₁"), "input"), steps: [stepOf(called, called ? resultBall(f(), "f") : undefined)] }], output: eitherNode(r.result),
          caption: !called ? "The input is a Left, so f never runs." : t.f ? "f returned a Left, and that Left becomes the result. No nested Either is left behind." : "f returned Right b. Its Either merges with the outer one, so one layer remains." };
      } },
    { id: "option", label: "Option", ribbon: { before: ["Option", "A"], after: ["Option", "B"], fn: "A → Option<B>", fnOut: ["Option", "B"] }, defaults: { input: false, f: false },
      build: (t) => {
        const f = () => (t.f ? none : some("b"));
        const r = flatMapOption(optionIn(t, "input"), f);
        const called = r.trace.calls.length > 0;
        return { inputs: [{ node: optionNode(optionIn(t, "input"), "in", "input"), steps: [stepOf(called, called ? optBall(f(), "f") : undefined)] }], output: optionNode(r.result, "out"),
          caption: !called ? "The input is None, so f never runs." : t.f ? "f returned None, so the result is None." : "f returned Some b, and the layers merge into one." };
      } },
    { id: "list", label: "List", ribbon: { before: ["List", "A"], after: ["List", "B"], fn: "A → List<B>", fnOut: ["List", "B"] }, defaults: {},
      build: () => {
        const as = ["1", "2", "3"];
        const r = flatMapList(as, (n) => Array.from({ length: Number(n) }, () => `b${n}`));
        return { inputs: [{ node: listOf(as, "in"), steps: r.trace.calls.map((c) => stepOf(true, ball(`×${c.output.length}`, "out"))) }], output: listOf(r.result, "out"),
          caption: `f returned a list for each element, and the lists were joined. Length changed from ${as.length} to ${r.result.length}.` };
      } },
  ] },

  flatten: { receivers: [
    { id: "either", label: "Either", ribbon: { before: ["Either", "Either", "A"], after: ["Either", "A"] }, defaults: { outer: false, inner: false },
      build: (t) => {
        const innerE: Either<string, string> = t.inner ? left("e₂") : right("a");
        const outer: Either<string, Either<string, string>> = t.outer ? left("e₁") : right(innerE);
        const r = flattenEither(outer);
        const node = outer.tag === "left" ? container("effect", "Either", [ball("e₁", "error", "outer")]) : container("effect", "Either", [inputEither(innerE, "inner")], "outer");
        return { inputs: [{ node }], output: eitherNode(r.result), caption: outer.tag === "left" ? "The outer Left becomes the result." : "One Either layer is removed; the inner value comes out." };
      } },
    { id: "list", label: "List", ribbon: { before: ["List", "List", "A"], after: ["List", "A"] }, defaults: {},
      build: () => {
        const r = flattenList([["a₁", "a₂"], ["a₃"]]);
        return { inputs: [{ node: list([listOf(["a₁", "a₂"], "in"), listOf(["a₃"], "in")]) }], output: listOf(r.result, "out"), caption: "The inner lists are joined, in order. One List layer is removed." };
      } },
    { id: "option", label: "Option", ribbon: { before: ["Option", "Option", "A"], after: ["Option", "A"] }, defaults: { outer: false, inner: false },
      build: (t) => {
        const innerO: Option<string> = t.inner ? none : some("a");
        const outer: Option<Option<string>> = t.outer ? none : some(innerO);
        const r = flattenOption(outer);
        const node = outer.tag === "none" ? container("effect", "Option", [ball("None", "error", "outer")]) : container("effect", "Option", [optionNode(innerO, "in", "inner")], "outer");
        return { inputs: [{ node }], output: optionNode(r.result, "out"), caption: "One Option layer is removed." };
      } },
  ] },

  tap: { receivers: [
    { id: "either", label: "Either", ribbon: { before: ["Either", "A"], after: ["Either", "A"], fn: "A → Either<_>" }, defaults: { input: false, step: false },
      build: (t) => {
        const step = () => (t.step ? left("e₂") : right("ok"));
        const r = tapEither(eitherIn(t, "input", "a", "e₁"), step);
        const called = r.trace.calls.length > 0;
        return { inputs: [{ node: inputEither(eitherIn(t, "input", "a", "e₁"), "input"), steps: [stepOf(called, called ? resultBall(step(), "step") : undefined)] }],
          output: eitherNode(r.result),
          caption: !called ? "The input is a Left, so the step never runs." : t.step ? "The step failed, and its Left replaces the result. A tap can fail." : "The step succeeded, and the original value a is kept." };
      } },
    { id: "option", label: "Option", ribbon: { before: ["Option", "A"], after: ["Option", "A"], fn: "A → Option<_>" }, defaults: { input: false, step: false },
      build: (t) => {
        const step = () => (t.step ? none : some("ok"));
        const r = tapOption(optionIn(t, "input"), step);
        const called = r.trace.calls.length > 0;
        return { inputs: [{ node: optionNode(optionIn(t, "input"), "in", "input"), steps: [stepOf(called, called ? optBall(step(), "step") : undefined)] }], output: optionNode(r.result, "out"),
          caption: !called ? "The input is None, so the step never runs." : t.step ? "The step returned None, so the result is None." : "The step succeeded, and a is kept." };
      } },
  ] },

  peek: { receivers: [
    { id: "either", label: "Either", ribbon: { before: ["Either", "A"], after: ["Either", "A"], fn: "A → void" }, defaults: { input: false },
      build: (t) => {
        const r = peek(eitherIn(t, "input"), () => undefined);
        const called = r.trace.calls.length > 0;
        return { inputs: [{ node: inputEither(eitherIn(t, "input"), "input"), steps: [stepOf(called, called ? ball("log", "plain") : undefined)] }], output: eitherNode(r.result),
          caption: called ? "The side effect saw a. The result is the input, unchanged: peek cannot fail or replace anything." : "The input is a Left, so the side effect never runs." };
      } },
    { id: "list", label: "List", ribbon: { before: ["List", "A"], after: ["List", "A"], fn: "A → void" }, defaults: {},
      build: () => {
        const as = elems(3, "a");
        const r = peekList(as, () => undefined);
        return { inputs: [{ node: listOf(as, "in"), steps: r.trace.calls.map(() => stepOf(true, ball("log", "plain"))) }], output: listOf(r.result, "in"), caption: "The side effect ran once per element. The list comes out unchanged." };
      } },
  ] },

  // --- Zipping ---------------------------------------------------------------
  zip: { receivers: [
    { id: "either", label: "Either", ribbon: { before: ["Either", "A"], after: ["Either", "C"], fn: "Either<B> × ((A, B) → C)" }, defaults: { a: false, b: false },
      build: (t) => {
        const a = eitherIn(t, "a", "a", "e₁"), b = eitherIn(t, "b", "b", "e₂");
        const r = zipWithEither(a, b, () => "c");
        return { inputs: [{ node: inputEither(a, "a") }, { node: inputEither(b, "b") }], output: eitherNode(r.result),
          caption: t.a && t.b ? "Both failed. Either keeps only the first Left, e₁." : t.a || t.b ? "One side failed, so its Left is the result." : "Both succeeded, and f combined a and b into c." };
      } },
    { id: "validation", label: "Validation", note: VALIDATION_NOTE, ribbon: { before: ["Validation", "A"], after: ["Validation", "C"], fn: "Validation<B> × ((A, B) → C)" }, defaults: { a: true, b: true },
      build: (t) => {
        const a: Validation<string, string> = t.a ? failure(["e₁"]) : success("a");
        const b: Validation<string, string> = t.b ? failure(["e₂"]) : success("b");
        const r = zipWithValidation(a, b, () => "c");
        return { inputs: [{ node: validationNode(a, "in", "a") }, { node: validationNode(b, "in", "b") }], output: validationNode(r.result, "out"),
          caption: t.a && t.b ? "Both failed, and Validation keeps both errors: e₁ then e₂." : t.a || t.b ? "One side failed, so its error is the result." : "Both succeeded, and f combined a and b into c." };
      } },
    { id: "list", label: "List (cartesian)", ribbon: { before: ["List", "A"], after: ["List", "C"], fn: "List<B> × ((A, B) → C)" }, defaults: {},
      build: () => {
        const r = zipWithListCartesian(["1", "2", "3"], ["a", "b"], (x, y) => x + y);
        return { inputs: [{ node: listOf(["1", "2", "3"], "in") }, { node: listOf(["a", "b"], "in") }], output: listOf(r.result, "out"),
          caption: "Every element meets every element: 3 × 2 = 6 results. This is List's applicative (liftA2, query syntax, sequenceT)." };
      } },
    { id: "ziplist", label: "List (positional)", ribbon: { before: ["List", "A"], after: ["List", "C"], fn: "List<B> × ((A, B) → C)" }, defaults: {},
      build: () => {
        const r = zipWithListPositional(["1", "2", "3"], ["a", "b"], (x, y) => x + y);
        return { inputs: [{ node: listOf(["1", "2", "3"], "in"), steps: [0, 1, 2].map((i) => stepOf(!r.trace.skipped.includes(i))) }, { node: listOf(["a", "b"], "in") }], output: listOf(r.result, "out"),
          caption: "Elements pair up by position, and the extra 3 is dropped. This is zipWith, ZipList, and LINQ Zip." };
      } },
  ] },

  // --- Traversing ------------------------------------------------------------
  traverse: { receivers: [
    { id: "either", label: "Either", ribbon: { before: ["List", "A"], after: ["Either", "List", "B"], fn: "A → Either<B>", fnOut: ["Either", "B"] }, defaults: four, strategies: evaluationStrategies.either,
      build: (t, s) => traverseScene("either", t, s, false) },
    { id: "option", label: "Option", ribbon: { before: ["List", "A"], after: ["Option", "List", "B"], fn: "A → Option<B>", fnOut: ["Option", "B"] }, defaults: four, strategies: evaluationStrategies.option,
      build: (t, s) => traverseScene("option", t, s, false) },
    { id: "validation", label: "Validation", note: VALIDATION_NOTE, ribbon: { before: ["List", "A"], after: ["Validation", "List", "B"], fn: "A → Validation<B>", fnOut: ["Validation", "B"] }, defaults: four, strategies: evaluationStrategies.validation,
      build: (t, s) => traverseScene("validation", t, s, false) },
  ] },

  sequence: { receivers: [
    { id: "either", label: "Either", ribbon: { before: ["List", "Either", "A"], after: ["Either", "List", "A"] }, defaults: four, strategies: evaluationStrategies.either,
      build: (t, s) => traverseScene("either", t, s, true) },
    { id: "option", label: "Option", ribbon: { before: ["List", "Option", "A"], after: ["Option", "List", "A"] }, defaults: four, strategies: evaluationStrategies.option,
      build: (t, s) => traverseScene("option", t, s, true) },
    { id: "validation", label: "Validation", note: VALIDATION_NOTE, ribbon: { before: ["List", "Validation", "A"], after: ["Validation", "List", "A"] }, defaults: four, strategies: evaluationStrategies.validation,
      build: (t, s) => traverseScene("validation", t, s, true) },
  ] },

  // --- Error handling --------------------------------------------------------
  mapError: { receivers: [
    { id: "either", label: "Either", ribbon: { before: ["Either", "E"], after: ["Either", "E₂"], fn: "E → E₂", fnIn: "E", fnOut: ["E₂"] }, defaults: { input: true },
      build: (t) => {
        const r = mapErrorEither(eitherIn(t, "input"), () => "e₂");
        const called = r.trace.calls.length > 0;
        return { inputs: [{ node: inputEither(eitherIn(t, "input"), "input"), steps: [stepOf(called, called ? ball("e₂", "error") : undefined)] }], output: eitherNode(r.result),
          caption: called ? "f ran on the error. The Either stays; the error changes, and its type can change too." : "The input is a Right, so f never runs." };
      } },
    { id: "validation", label: "Validation", ribbon: { before: ["Validation", "E"], after: ["Validation", "E₂"], fn: "E → E₂", fnIn: "E", fnOut: ["E₂"] }, defaults: { input: true },
      build: (t) => {
        const v: Validation<string, string> = t.input ? failure(["e₁", "e₂"]) : success("a");
        const r = mapErrorValidation(v, (e) => e.toUpperCase());
        return { inputs: [{ node: validationNode(v, "in", "input"), steps: r.trace.calls.length ? r.trace.calls.map((c) => stepOf(true, ball(c.output, "error"))) : [stepOf(false)] }], output: validationNode(r.result, "out"),
          caption: r.trace.calls.length ? `f ran once per error (${r.trace.calls.length}).` : "The input is a Success, so f never runs." };
      } },
  ] },

  recover: { receivers: [
    { id: "either", label: "Either", ribbon: { before: ["Either", "A"], after: ["Either", "A"], fn: "E → Either<A>", fnIn: "E", fnOut: ["Either", "A"] }, defaults: { input: true, handler: false },
      build: (t) => {
        const handler = () => (t.handler ? left("n") : right("a′"));
        const r = recoverEither(eitherIn(t, "input", "a", "e"), handler);
        const called = r.trace.calls.length > 0;
        return { inputs: [{ node: inputEither(eitherIn(t, "input", "a", "e"), "input"), steps: [stepOf(called, called ? resultBall(handler(), "handler") : undefined)] }], output: eitherNode(r.result),
          caption: !called ? "The input is a Right, so the handler never runs." : t.handler ? "The handler failed with a new error, n. Recovery can change the error type." : "The handler replaced the failure with a success." };
      } },
  ] },

  alt: { receivers: [
    { id: "option", label: "Option", ribbon: { before: ["Option", "A"], after: ["Option", "A"], fn: "() → Option<A>" }, defaults: { primary: true, fallback: false },
      build: (t) => {
        const fb = optionIn(t, "fallback", "b");
        const r = altOption(optionIn(t, "primary"), () => fb);
        const called = r.trace.calls.length > 0;
        return { inputs: [{ node: optionNode(optionIn(t, "primary"), "in", "primary") }, { caption: "fallback", node: optionNode(fb, "in", "fallback"), steps: [stepOf(called)] }], output: optionNode(r.result, "out"),
          caption: called ? "The first was None, so the fallback was evaluated." : "The first was Some, so the fallback was never evaluated." };
      } },
    { id: "either", label: "Either", ribbon: { before: ["Either", "A"], after: ["Either", "A"], fn: "() → Either<A>" }, defaults: { primary: true, fallback: true },
      build: (t) => {
        const fb = eitherIn(t, "fallback", "b", "e₂");
        const r = altEither(eitherIn(t, "primary", "a", "e₁"), () => fb);
        const called = r.trace.calls.length > 0;
        return { inputs: [{ node: inputEither(eitherIn(t, "primary", "a", "e₁"), "primary") }, { caption: "fallback", node: inputEither(fb, "fallback"), steps: [stepOf(called)] }], output: eitherNode(r.result),
          caption: !called ? "The first was a Right, so the fallback was never evaluated." : t.fallback ? "Both failed. Either keeps only the fallback's error, e₂." : "The fallback succeeded." };
      } },
    { id: "validation", label: "Validation", ribbon: { before: ["Validation", "A"], after: ["Validation", "A"], fn: "() → Validation<A>" }, defaults: { primary: true, fallback: true },
      build: (t) => {
        const a: Validation<string, string> = t.primary ? failure(["e₁"]) : success("a");
        const fb: Validation<string, string> = t.fallback ? failure(["e₂"]) : success("b");
        const r = altValidation(a, () => fb);
        const called = r.trace.calls.length > 0;
        return { inputs: [{ node: validationNode(a, "in", "primary") }, { caption: "fallback", node: validationNode(fb, "in", "fallback"), steps: [stepOf(called)] }], output: validationNode(r.result, "out"),
          caption: !called ? "The first succeeded, so the fallback was never evaluated." : t.fallback ? "Both failed, and Validation keeps both errors." : "The fallback succeeded." };
      } },
    { id: "list", label: "List", ribbon: { before: ["List", "A"], after: ["List", "A"], fn: "() → List<A>" }, defaults: {},
      build: () => {
        const r = altList(["a₁", "a₂"], () => ["b₁"]);
        return { inputs: [{ node: listOf(["a₁", "a₂"], "in") }, { caption: "fallback", node: listOf(["b₁"], "in"), steps: [stepOf(true)] }], output: listOf(r.result, "out"),
          caption: "For List, alt concatenates, so the fallback always runs." };
      } },
  ] },

  getOrElse: { receivers: [
    { id: "either", label: "Either · computed", ribbon: { before: ["Either", "A"], after: ["A"], fn: "E → A", fnIn: "E", fnOut: ["A"] }, defaults: { input: true },
      build: (t) => {
        const r = getOrElseEitherWith(eitherIn(t, "input", "a", "e"), () => "d");
        const called = r.trace.calls.length > 0;
        return { inputs: [{ node: inputEither(eitherIn(t, "input", "a", "e"), "input"), steps: [stepOf(called, called ? ball("d", "out") : undefined)] }], output: bare(r.result),
          caption: called ? "The fallback was computed from the error. The Either is gone; a plain value remains." : "The input is a Right, so the fallback never runs. Its value comes out." };
      } },
    { id: "option", label: "Option · constant", ribbon: { before: ["Option", "A"], after: ["A"] }, defaults: { input: true },
      build: (t) => {
        const r = getOrElseOption(optionIn(t, "input"), "d");
        return { inputs: [{ node: optionNode(optionIn(t, "input"), "in", "input") }], output: bare(r.result),
          caption: t.input ? "The input is None, so the constant default d comes out. No function runs." : "The input is Some, so its value comes out." };
      } },
  ] },

  // --- Pattern matching ------------------------------------------------------
  match: { receivers: [
    { id: "either", label: "Either", ribbon: { before: ["Either", "A"], after: ["R"], fn: "E → R | A → R" }, defaults: { input: false },
      build: (t) => {
        const r = matchEither(eitherIn(t, "input"), () => "r", () => "r");
        const fn = r.trace.calls[0]?.fn;
        return { inputs: [{ node: inputEither(eitherIn(t, "input"), "input"), steps: [stepOf(true, ball("r", "out"), fn === "left" ? "onLeft" : "onRight")] }], output: bare(r.result),
          caption: `Exactly one handler ran (${fn === "left" ? "onLeft" : "onRight"}). Both return the same type, so the Either disappears.` };
      } },
    { id: "option", label: "Option", ribbon: { before: ["Option", "A"], after: ["R"], fn: "() → R | A → R" }, defaults: { input: false },
      build: (t) => {
        const r = matchOption(optionIn(t, "input"), () => "r", () => "r");
        const fn = r.trace.calls[0]?.fn;
        return { inputs: [{ node: optionNode(optionIn(t, "input"), "in", "input"), steps: [stepOf(true, ball("r", "out"), fn === "none" ? "onNone" : "onSome")] }], output: bare(r.result),
          caption: `Exactly one handler ran (${fn === "none" ? "onNone" : "onSome"}).` };
      } },
    { id: "validation", label: "Validation", ribbon: { before: ["Validation", "A"], after: ["R"], fn: "Errors → R | A → R" }, defaults: { input: true },
      build: (t) => {
        const v: Validation<string, string> = t.input ? failure(["e₁", "e₂"]) : success("a");
        const r = matchValidation(v, () => "r", () => "r");
        const fn = r.trace.calls[0]?.fn;
        return { inputs: [{ node: validationNode(v, "in", "input"), steps: [stepOf(true, ball("r", "out"), fn === "failure" ? "onFailure" : "onSuccess")] }], output: bare(r.result),
          caption: fn === "failure" ? "onFailure ran once, with every error." : "onSuccess ran with the value." };
      } },
  ] },

  // --- Filtering -------------------------------------------------------------
  filterOrElse: { receivers: [
    { id: "either", label: "Either", ribbon: { before: ["Either", "A"], after: ["Either", "A"], fn: "A → bool" }, defaults: { input: false, predicate: true },
      build: (t) => {
        const r = filterOrElseEither(eitherIn(t, "input", "a", "e₁"), () => !t.predicate, () => "e₂");
        const p = r.trace.calls.find((c) => c.fn === "predicate");
        return { inputs: [{ node: inputEither(eitherIn(t, "input", "a", "e₁"), "input"), steps: [stepOf(!!p, p ? ball(p.output ? "true" : "false", p.output ? "out" : "error", "predicate") : undefined)] }],
          output: eitherNode(r.result as Either<string, string>),
          caption: !p ? "The input is a Left, so the predicate never runs." : p.output ? "The predicate passed, so the value is kept." : "The predicate failed, so the success becomes a Left built from the value." };
      } },
    { id: "option", label: "Option · filter", ribbon: { before: ["Option", "A"], after: ["Option", "A"], fn: "A → bool" }, defaults: { input: false, predicate: true },
      build: (t) => {
        const r = filterOption(optionIn(t, "input"), () => !t.predicate);
        const p = r.trace.calls[0];
        return { inputs: [{ node: optionNode(optionIn(t, "input"), "in", "input"), steps: [stepOf(!!p, p ? ball(p.output ? "true" : "false", p.output ? "out" : "error", "predicate") : undefined)] }], output: optionNode(r.result, "out"),
          caption: !p ? "The input is None, so the predicate never runs." : p.output ? "The predicate passed, so the value is kept." : "The predicate failed. Option has no error to report, so the result is None." };
      } },
  ] },
};

