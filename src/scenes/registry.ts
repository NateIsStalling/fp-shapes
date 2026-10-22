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
  type EvaluationStrategy,
  type Either,
  type Option,
  type Validation,
} from "../semantics";
import {
  ball,
  boolSlot,
  container,
  eitherSlot,
  list,
  listOf,
  nestedSlot,
  optionSlot,
  sub,
  validationSlot,
  type OperationScenes,
  type Scene,
  type SceneNode,
  type Step,
  type Toggles,
} from "./scene";

// Each operation lists the receivers it is drawn for. A builder runs the real
// semantics and describes the run as a Scene. Inputs the viewer can change
// are slots ("one of" their cases); outputs are plain nodes. No React here.

const eitherIn = (t: Toggles, key: string, ok = "a", err = "e"): Either<string, string> => (t[key] ? left(err) : right(ok));
const optionIn = (t: Toggles, key: string, ok = "a"): Option<string> => (t[key] ? none : some(ok));
const step = (called: boolean, result?: SceneNode, label?: string): Step => ({ called, ...(result ? { result } : {}), ...(label ? { label } : {}) });

// Output nodes (not editable).
// `tone` is "out" for a new value, "in" when the input value passes through unchanged.
const eitherOut = (e: Either<string, string>, tone: "in" | "out" = "out") => container("effect", "Either", [e.tag === "right" ? ball(e.value, tone) : ball(e.error, "error")]);
const optionOut = (o: Option<string>, tone: "in" | "out" = "out") => container("effect", "Option", [o.tag === "some" ? ball(o.value, tone) : ball("None", "empty")]);
const validationOut = (v: Validation<string, string>) => container("effect", "Validation", v.tag === "success" ? [ball(v.value, "out")] : v.errors.map((e) => ball(e, "error")));
const plain = (label: string) => ball(label, "out");
const elems = (n: number, prefix: string) => Array.from({ length: n }, (_, i) => `${prefix}${sub(i)}`);
const show = {
  either: (e: Either<string, unknown>) => (e.tag === "right" ? `Right(${fmt(e.value)})` : `Left(${e.error})`),
  option: (o: Option<unknown>) => (o.tag === "some" ? `Some(${fmt(o.value)})` : "None"),
  validation: (v: Validation<string, unknown>) => (v.tag === "success" ? `Success(${fmt(v.value)})` : `Failure([${v.errors.join(", ")}])`),
};
function fmt(v: unknown): string {
  return Array.isArray(v) ? `[${v.map(fmt).join(", ")}]` : String(v);
}

// --- traverse and sequence ---------------------------------------------------

const four = { a1: false, a2: true, a3: false, a4: true };
const idx = [0, 1, 2, 3];
const key = (i: number) => `a${i + 1}`;
type Kind3 = "either" | "option" | "validation";

// The slot for one element: what f returns for it (traverse), or the element
// itself (sequence).
function elementSlot(k: Kind3, t: Toggles, i: number, label: string, tone: "in" | "out") {
  if (k === "either") return eitherSlot(t, key(i), `b${sub(i)}`, `e${sub(i)}`, tone, label);
  if (k === "option") return optionSlot(t, key(i), `b${sub(i)}`, tone, label);
  return validationSlot(t, key(i), `b${sub(i)}`, [`e${sub(i)}`], tone, label);
}

function traverseScene(k: Kind3, t: Toggles, strategy: EvaluationStrategy, isSequence: boolean): Scene {
  const fails = idx.map((i) => !!t[key(i)]);
  let called: Set<number>;
  let output: SceneNode;
  let resultText: string;
  if (k === "either") {
    const r = traverseEither(strategy, idx, (i) => (fails[i] ? left(`e${sub(i)}`) : right(`b${sub(i)}`)));
    called = new Set(r.trace.calls.map((c) => c.input));
    output = container("effect", "Either", [r.result.tag === "right" ? listOf(r.result.value, "out") : ball(r.result.error, "error")]);
    resultText = show.either(r.result);
  } else if (k === "option") {
    const r = traverseOption(strategy, idx, (i) => (fails[i] ? none : some(`b${sub(i)}`)));
    called = new Set(r.trace.calls.map((c) => c.input));
    output = container("effect", "Option", [r.result.tag === "some" ? listOf(r.result.value, "out") : ball("None", "empty")]);
    resultText = show.option(r.result);
  } else {
    const r = traverseValidation(idx, (i) => (fails[i] ? failure([`e${sub(i)}`]) : success(`b${sub(i)}`)));
    called = new Set(r.trace.calls.map((c) => c.input));
    output = container("effect", "Validation", r.result.tag === "success" ? [listOf(r.result.value, "out")] : r.result.errors.map((e) => ball(e, "error")));
    resultText = show.validation(r.result);
  }
  const input = isSequence ? list(idx.map((i) => elementSlot(k, t, i, `element ${i + 1}`, "in"))) : listOf(elems(4, "a"), "in");
  const steps = idx.map((i) => (isSequence ? step(called.has(i)) : step(called.has(i), elementSlot(k, t, i, `f(a${sub(i)})`, "out"))));
  const n = fails.filter(Boolean).length;
  const caption =
    (n === 0
      ? `${isSequence ? "Every element succeeded" : "`f` succeeded on all 4 elements"}.`
      : k === "validation"
        ? `${isSequence ? "Every element was inspected" : "`f` was called on all 4 elements"}. All ${n} failures are kept.`
        : strategy === "short-circuit"
          ? `${isSequence ? `${called.size} of 4 elements were inspected` : `\`f\` was called on ${called.size} of 4 elements`}, then it stopped at the first failure.`
          : `${isSequence ? "All 4 elements were inspected" : "`f` was called on all 4 elements"}. ${n} failed, and only the first failure survives.`) +
    ` Result: \`${resultText}\`.` +
    (n && k !== "validation" ? " The other evaluation gives the same result." : "");
  return { inputs: [{ node: input, steps }], output, caption };
}

const VALIDATION_NOTE = "Validation looks at every element so it can keep every failure. The accumulation comes from the receiver, not from the operation.";

export const operationScenes: Readonly<Record<string, OperationScenes>> = {
  // --- Mapping ---------------------------------------------------------------
  map: { receivers: [
    { id: "either", label: "Either", binds: {F: "Either"}, ribbon: { before: "Either<E, A>", after: "Either<E, B>", fn: "A → B", fnOut: "B" }, defaults: { input: false },
      build: (t) => {
        const r = mapEither(eitherIn(t, "input"), () => "b");
        const called = r.trace.calls.length > 0;
        return { inputs: [{ node: eitherSlot(t, "input", "a", "e"), steps: [step(called, called ? plain("b") : undefined)] }], output: eitherOut(r.result),
          caption: called ? "`f` ran on `a`. The Either stays; its payload changes from `a` to `b`." : "The input is a `Left`, so `f` never runs. The `Left` passes through unchanged." };
      } },
    { id: "option", label: "Option", binds: {F: "Option"}, ribbon: { before: "Option<A>", after: "Option<B>", fn: "A → B", fnOut: "B" }, defaults: { input: false },
      build: (t) => {
        const r = mapOption(optionIn(t, "input"), () => "b");
        const called = r.trace.calls.length > 0;
        return { inputs: [{ node: optionSlot(t, "input", "a"), steps: [step(called, called ? plain("b") : undefined)] }], output: optionOut(r.result),
          caption: called ? "`f` ran on `a`. The Option stays; its payload changes from `a` to `b`." : "The input is `None`, so `f` never runs." };
      } },
    { id: "list", label: "List", binds: {F: "List"}, ribbon: { before: "List<A>", after: "List<B>", fn: "A → B", fnOut: "B" }, defaults: {},
      build: () => {
        const r = mapList(elems(3, "a"), (a) => a.replace("a", "b"));
        return { inputs: [{ node: listOf(elems(3, "a"), "in"), steps: r.trace.calls.map((c) => step(true, plain(c.output))) }], output: listOf(r.result, "out"),
          caption: "`f` ran once per element. The list keeps its length and order." };
      } },
  ] },

  bimap: { receivers: [
    { id: "either", label: "Either", binds: {P: "Either"}, ribbon: { before: "Either<E, A>", after: "Either<E₂, B>", fn: "E → E₂ | A → B" }, defaults: { input: false },
      build: (t) => {
        const r = bimapEither(eitherIn(t, "input"), () => "e₂", () => "b");
        const isLeft = r.trace.calls[0]?.fn === "left";
        return { inputs: [{ node: eitherSlot(t, "input", "a", "e"), steps: [step(true, isLeft ? ball("e₂", "error") : plain("b"), isLeft ? "f (left)" : "g (right)")] }],
          output: eitherOut(r.result as Either<string, string>),
          caption: `Only the ${isLeft ? "left" : "right"} function ran: an Either holds one case at a time.` };
      } },
    { id: "tuple", label: "Tuple", binds: {P: "Tuple"}, ribbon: { before: "Tuple<A, X>", after: "Tuple<B, Y>", fn: "A → B | X → Y" }, defaults: {},
      build: () => {
        const r = bimapTuple(["a", "x"], () => "b", () => "y");
        return { inputs: [{ node: container("tuple", "Tuple", [ball("a", "in"), ball("x", "in")]), steps: [step(true, plain("b"), "f"), step(true, plain("y"), "g")] }],
          output: container("tuple", "Tuple", [plain(r.result[0]), plain(r.result[1])]),
          caption: "Both functions ran: a Tuple holds both parts at once." };
      } },
  ] },

  // --- Sequencing ------------------------------------------------------------
  flatMap: { receivers: [
    { id: "either", label: "Either", binds: {F: "Either"}, ribbon: { before: "Either<E, A>", after: "Either<E, B>", fn: "A → Either<B>", fnOut: "Either<E, B>" }, defaults: { input: false, f: false },
      build: (t) => {
        const r = flatMapEither(eitherIn(t, "input", "a", "e₁"), () => eitherIn(t, "f", "b", "e₂"));
        const called = r.trace.calls.length > 0;
        return { inputs: [{ node: eitherSlot(t, "input", "a", "e₁"), steps: [step(called, eitherSlot(t, "f", "b", "e₂", "out", "f returns"))] }], output: eitherOut(r.result),
          caption: !called ? "The input is a `Left`, so `f` never runs." : t.f ? "`f` returned a `Left`, and that `Left` is the result. No nested Either is left behind." : "`f` returned `Right b`, and its Either merges with the outer one." };
      } },
    { id: "option", label: "Option", binds: {F: "Option"}, ribbon: { before: "Option<A>", after: "Option<B>", fn: "A → Option<B>", fnOut: "Option<B>" }, defaults: { input: false, f: false },
      build: (t) => {
        const r = flatMapOption(optionIn(t, "input"), () => optionIn(t, "f", "b"));
        const called = r.trace.calls.length > 0;
        return { inputs: [{ node: optionSlot(t, "input", "a"), steps: [step(called, optionSlot(t, "f", "b", "out", "f returns"))] }], output: optionOut(r.result),
          caption: !called ? "The input is `None`, so `f` never runs." : t.f ? "`f` returned `None`, so the result is `None`." : "`f` returned `Some b`, and the layers merge into one." };
      } },
    { id: "list", label: "List", binds: {F: "List"}, ribbon: { before: "List<A>", after: "List<B>", fn: "A → List<B>", fnOut: "List<B>" }, defaults: {},
      build: () => {
        const as = ["1", "2", "3"];
        const r = flatMapList(as, (n) => Array.from({ length: Number(n) }, () => `b${n}`));
        return { inputs: [{ node: listOf(as, "in"), steps: r.trace.calls.map((c) => step(true, listOf(c.output, "out"))) }], output: listOf(r.result, "out"),
          caption: `\`f\` returned a list for each element, and the lists were joined. Length changed from ${as.length} to ${r.result.length}.` };
      } },
  ] },

  flatten: { receivers: [
    { id: "either", label: "Either", binds: {F: "Either"}, ribbon: { before: "Either<E, Either<E, A>>", after: "Either<E, A>" }, defaults: { outer: false, inner: false },
      build: (t) => {
        const innerE = eitherIn(t, "inner", "a", "e₂");
        const r = flattenEither(t.outer ? left("e₁") : right(innerE));
        return { inputs: [{ node: nestedSlot(t, "outer", "outer Either", "Right", eitherSlot(t, "inner", "a", "e₂", "in", "inner Either"), "Left", ball("e₁", "error")) }], output: eitherOut(r.result),
          caption: t.outer ? "The outer `Left` becomes the result." : "One Either layer is removed; the inner value comes out as it is." };
      } },
    { id: "option", label: "Option", binds: {F: "Option"}, ribbon: { before: "Option<Option<A>>", after: "Option<A>" }, defaults: { outer: false, inner: false },
      build: (t) => {
        const r = flattenOption(t.outer ? none : some(optionIn(t, "inner")));
        return { inputs: [{ node: nestedSlot(t, "outer", "outer Option", "Some", optionSlot(t, "inner", "a", "in", "inner Option"), "None", ball("None", "empty")) }], output: optionOut(r.result),
          caption: "One Option layer is removed." };
      } },
    { id: "list", label: "List", binds: {F: "List"}, ribbon: { before: "List<List<A>>", after: "List<A>" }, defaults: {},
      build: () => {
        const r = flattenList([["a₁", "a₂"], ["a₃"]]);
        return { inputs: [{ node: list([listOf(["a₁", "a₂"], "in"), listOf(["a₃"], "in")]) }], output: listOf(r.result, "out"), caption: "The inner lists are joined, in order. One List layer is removed." };
      } },
  ] },

  tap: { receivers: [
    { id: "either", label: "Either", binds: {F: "Either"}, ribbon: { before: "Either<E, A>", after: "Either<E, A>", fn: "A → Either<_>" }, defaults: { input: false, step: false },
      build: (t) => {
        const r = tapEither(eitherIn(t, "input", "a", "e₁"), () => eitherIn(t, "step", "_", "e₂"));
        const called = r.trace.calls.length > 0;
        return { inputs: [{ node: eitherSlot(t, "input", "a", "e₁"), steps: [step(called, eitherSlot(t, "step", "_", "e₂", "out", "the step returns"))] }], output: eitherOut(r.result, "in"),
          caption: !called ? "The input is a `Left`, so the step never runs." : t.step ? "The step failed, and its `Left` replaces the result. A tap can fail." : "The step succeeded. Its own value (`_`) is discarded, and the original value `a` is kept." };
      } },
    { id: "option", label: "Option", binds: {F: "Option"}, ribbon: { before: "Option<A>", after: "Option<A>", fn: "A → Option<_>" }, defaults: { input: false, step: false },
      build: (t) => {
        const r = tapOption(optionIn(t, "input"), () => optionIn(t, "step", "_"));
        const called = r.trace.calls.length > 0;
        return { inputs: [{ node: optionSlot(t, "input", "a"), steps: [step(called, optionSlot(t, "step", "_", "out", "the step returns"))] }], output: optionOut(r.result, "in"),
          caption: !called ? "The input is `None`, so the step never runs." : t.step ? "The step returned `None`, so the result is `None`." : "The step succeeded. Its value (`_`) is discarded, and `a` is kept." };
      } },
  ] },

  peek: { receivers: [
    { id: "either", label: "Either", binds: {F: "Either"}, ribbon: { before: "Either<E, A>", after: "Either<E, A>", fn: "A → void" }, defaults: { input: false },
      build: (t) => {
        const r = peek(eitherIn(t, "input"), () => undefined);
        const called = r.trace.calls.length > 0;
        return { inputs: [{ node: eitherSlot(t, "input", "a", "e"), steps: [{ called, label: "returns void", ...(called ? { effect: "saw a" } : {}) }] }], output: eitherOut(r.result, "in"),
          caption: called ? "`f` saw `a` and returned nothing. Its side effect (logging, metrics) stays outside the result, so the same `Right a` comes out: peek cannot fail or replace anything." : "The input is a `Left`, so `f` never runs and nothing is observed. The `Left` passes through." };
      } },
    { id: "list", label: "List", binds: {F: "List"}, ribbon: { before: "List<A>", after: "List<A>", fn: "A → void" }, defaults: {},
      build: () => {
        const as = elems(3, "a");
        const r = peekList(as, () => undefined);
        return { inputs: [{ node: listOf(as, "in"), steps: r.trace.calls.map((c) => ({ called: true, effect: `saw ${c.input}` })) }], output: listOf(r.result, "in"), caption: "`f` saw each element once and returned nothing. The same list comes out, unchanged." };
      } },
  ] },

  // --- Zipping ---------------------------------------------------------------
  zip: { receivers: [
    { id: "either", label: "Either", binds: {F: "Either"}, ribbon: { before: "Either<E, A>", after: "Either<E, C>", fn: "Either<B> × ((A, B) → C)" }, defaults: { a: false, b: false },
      build: (t) => {
        const r = zipWithEither(eitherIn(t, "a", "a", "e₁"), eitherIn(t, "b", "b", "e₂"), () => "c");
        return { inputsAs: "tuple", inputs: [{ node: eitherSlot(t, "a", "a", "e₁", "in", "first Either") }, { node: eitherSlot(t, "b", "b", "e₂", "in", "second Either") }], output: eitherOut(r.result),
          caption: t.a && t.b ? "Both failed. Either keeps only the first `Left`, `e₁`." : t.a || t.b ? "One side failed, so its `Left` is the result." : "Both succeeded, and `f` combined `a` and `b` into `c`." };
      } },
    { id: "validation", label: "Validation", note: VALIDATION_NOTE, binds: {F: "Validation"}, ribbon: { before: "Validation<E, A>", after: "Validation<E, C>", fn: "Validation<B> × ((A, B) → C)" }, defaults: { a: true, b: true },
      build: (t) => {
        const a: Validation<string, string> = t.a ? failure(["e₁"]) : success("a");
        const b: Validation<string, string> = t.b ? failure(["e₂"]) : success("b");
        const r = zipWithValidation(a, b, () => "c");
        return { inputsAs: "tuple", inputs: [{ node: validationSlot(t, "a", "a", ["e₁"], "in", "first Validation") }, { node: validationSlot(t, "b", "b", ["e₂"], "in", "second Validation") }], output: validationOut(r.result),
          caption: t.a && t.b ? "Both failed, and Validation keeps both errors: `e₁` then `e₂`." : t.a || t.b ? "One side failed, so its error is the result." : "Both succeeded, and `f` combined `a` and `b` into `c`." };
      } },
    { id: "list", label: "List (cartesian)", binds: {F: "List"}, ribbon: { before: "List<A>", after: "List<C>", fn: "List<B> × ((A, B) → C)" }, defaults: {},
      build: () => {
        const r = zipWithListCartesian(["1", "2", "3"], ["a", "b"], (x, y) => x + y);
        return { inputsAs: "tuple", inputs: [{ node: listOf(["1", "2", "3"], "in") }, { node: listOf(["a", "b"], "in") }], output: listOf(r.result, "out"),
          caption: "Every element meets every element: 3 × 2 = 6 results. This is List's applicative (`liftA2`, query syntax, `sequenceT`)." };
      } },
    { id: "ziplist", label: "List (positional)", binds: {F: "ZipList"}, ribbon: { before: "List<A>", after: "List<C>", fn: "List<B> × ((A, B) → C)" }, defaults: {},
      build: () => {
        const r = zipWithListPositional(["1", "2", "3"], ["a", "b"], (x, y) => x + y);
        return { inputsAs: "tuple", inputs: [{ node: listOf(["1", "2", "3"], "in"), steps: [0, 1, 2].map((i) => step(!r.trace.skipped.includes(i))) }, { node: listOf(["a", "b"], "in") }], output: listOf(r.result, "out"),
          caption: "Elements pair up by position, and the extra `3` is dropped. This is `zipWith`, `ZipList`, and LINQ `Zip`." };
      } },
  ] },

  // --- Traversing ------------------------------------------------------------
  traverse: { receivers: [
    { id: "either", label: "Either", binds: {F: "Either",T: "List"}, ribbon: { before: "List<A>", after: "Either<E, List<B>>", fn: "A → Either<B>", fnOut: "Either<E, B>" }, defaults: four, strategies: evaluationStrategies.either,
      build: (t, s) => traverseScene("either", t, s, false) },
    { id: "option", label: "Option", binds: {F: "Option",T: "List"}, ribbon: { before: "List<A>", after: "Option<List<B>>", fn: "A → Option<B>", fnOut: "Option<B>" }, defaults: four, strategies: evaluationStrategies.option,
      build: (t, s) => traverseScene("option", t, s, false) },
    { id: "validation", label: "Validation", note: VALIDATION_NOTE, binds: {F: "Validation",T: "List"}, ribbon: { before: "List<A>", after: "Validation<E, List<B>>", fn: "A → Validation<B>", fnOut: "Validation<E, B>" }, defaults: four, strategies: evaluationStrategies.validation,
      build: (t, s) => traverseScene("validation", t, s, false) },
  ] },

  sequence: { receivers: [
    { id: "either", label: "Either", binds: {F: "Either",T: "List"}, ribbon: { before: "List<Either<E, A>>", after: "Either<E, List<A>>" }, defaults: four, strategies: evaluationStrategies.either,
      build: (t, s) => traverseScene("either", t, s, true) },
    { id: "option", label: "Option", binds: {F: "Option",T: "List"}, ribbon: { before: "List<Option<A>>", after: "Option<List<A>>" }, defaults: four, strategies: evaluationStrategies.option,
      build: (t, s) => traverseScene("option", t, s, true) },
    { id: "validation", label: "Validation", note: VALIDATION_NOTE, binds: {F: "Validation",T: "List"}, ribbon: { before: "List<Validation<E, A>>", after: "Validation<E, List<A>>" }, defaults: four, strategies: evaluationStrategies.validation,
      build: (t, s) => traverseScene("validation", t, s, true) },
  ] },

  // --- Error handling --------------------------------------------------------
  mapError: { receivers: [
    { id: "either", label: "Either", binds: {P: "Either"}, ribbon: { before: "Either<E, A>", after: "Either<E₂, A>", fn: "E → E₂", fnIn: "E", fnOut: "E₂" }, defaults: { input: true },
      build: (t) => {
        const r = mapErrorEither(eitherIn(t, "input"), () => "e₂");
        const called = r.trace.calls.length > 0;
        return { inputs: [{ node: eitherSlot(t, "input", "a", "e"), steps: [step(called, called ? ball("e₂", "error") : undefined)] }], output: eitherOut(r.result),
          caption: called ? "`f` ran on the error. The Either stays; the error changes, and its type can change too." : "The input is a `Right`, so `f` never runs." };
      } },
    { id: "validation", label: "Validation", binds: {P: "Validation"}, ribbon: { before: "Validation<E, A>", after: "Validation<E₂, A>", fn: "E → E₂", fnIn: "E", fnOut: "E₂" }, defaults: { input: true },
      build: (t) => {
        const r = mapErrorValidation(t.input ? failure(["e₁", "e₂"]) : success("a"), (e) => e.toUpperCase());
        const n = r.trace.calls.length;
        return { inputs: [{ node: validationSlot(t, "input", "a", ["e₁", "e₂"]), steps: [step(n > 0, n ? container("effect", "errors", r.trace.calls.map((c) => ball(c.output, "error"))) : undefined)] }],
          output: validationOut(r.result),
          caption: n ? `\`f\` ran once per error (${n}).` : "The input is a Success, so `f` never runs." };
      } },
  ] },

  recover: { receivers: [
    { id: "either", label: "Either", binds: {F: "Either"}, ribbon: { before: "Either<E, A>", after: "Either<E₂, A>", fn: "E → Either<E₂, A>", fnIn: "E", fnOut: "Either<E₂, A>" }, defaults: { input: true, handler: false },
      build: (t) => {
        const r = recoverEither(eitherIn(t, "input", "a", "e"), () => eitherIn(t, "handler", "a′", "n"));
        const called = r.trace.calls.length > 0;
        return { inputs: [{ node: eitherSlot(t, "input", "a", "e"), steps: [step(called, eitherSlot(t, "handler", "a′", "n", "out", "the handler returns"))] }], output: eitherOut(r.result),
          caption: !called ? "The input is a `Right`, so the handler never runs." : t.handler ? "The handler failed with a new error, `n`. Recovery can change the error type." : "The handler replaced the failure with a success." };
      } },
  ] },

  alt: { receivers: [
    { id: "option", label: "Option", binds: {F: "Option"}, ribbon: { before: "Option<A>", after: "Option<A>", fn: "() → Option<A>" }, defaults: { primary: true, fallback: false },
      build: (t) => {
        const r = altOption(optionIn(t, "primary"), () => optionIn(t, "fallback", "b"));
        const called = r.trace.calls.length > 0;
        return { inputs: [{ node: optionSlot(t, "primary", "a", "in", "first") }, { node: optionSlot(t, "fallback", "b", "in", "fallback"), steps: [step(called)] }], output: optionOut(r.result),
          caption: called ? "The first was `None`, so the fallback was evaluated." : "The first was Some, so the fallback was never evaluated." };
      } },
    { id: "either", label: "Either", binds: {F: "Either"}, ribbon: { before: "Either<E, A>", after: "Either<E, A>", fn: "() → Either<A>" }, defaults: { primary: true, fallback: true },
      build: (t) => {
        const r = altEither(eitherIn(t, "primary", "a", "e₁"), () => eitherIn(t, "fallback", "b", "e₂"));
        const called = r.trace.calls.length > 0;
        return { inputs: [{ node: eitherSlot(t, "primary", "a", "e₁", "in", "first") }, { node: eitherSlot(t, "fallback", "b", "e₂", "in", "fallback"), steps: [step(called)] }], output: eitherOut(r.result),
          caption: !called ? "The first was a `Right`, so the fallback was never evaluated." : t.fallback ? "Both failed. Either keeps only the fallback's error, `e₂`." : "The fallback succeeded." };
      } },
    { id: "validation", label: "Validation", binds: {F: "Validation"}, ribbon: { before: "Validation<E, A>", after: "Validation<E, A>", fn: "() → Validation<A>" }, defaults: { primary: true, fallback: true },
      build: (t) => {
        const r = altValidation(t.primary ? failure(["e₁"]) : success("a"), () => (t.fallback ? failure(["e₂"]) : success("b")));
        const called = r.trace.calls.length > 0;
        return { inputs: [{ node: validationSlot(t, "primary", "a", ["e₁"], "in", "first") }, { node: validationSlot(t, "fallback", "b", ["e₂"], "in", "fallback"), steps: [step(called)] }], output: validationOut(r.result),
          caption: !called ? "The first succeeded, so the fallback was never evaluated." : t.fallback ? "Both failed, and Validation keeps both errors." : "The fallback succeeded." };
      } },
    { id: "list", label: "List", binds: {F: "List"}, ribbon: { before: "List<A>", after: "List<A>", fn: "() → List<A>" }, defaults: {},
      build: () => {
        const r = altList(["a₁", "a₂"], () => ["b₁"]);
        return { inputs: [{ node: listOf(["a₁", "a₂"], "in") }, { caption: "fallback", node: listOf(["b₁"], "in"), steps: [step(true)] }], output: listOf(r.result, "out"),
          caption: "For List, alt concatenates, so the fallback always runs." };
      } },
  ] },

  getOrElse: { receivers: [
    { id: "either", label: "Either · computed", binds: {F: "Either"}, signature: "(E → A) → Either<E, A> → A", ribbon: { before: "Either<E, A>", after: "A", fn: "E → A", fnIn: "E", fnOut: "A" }, defaults: { input: true },
      build: (t) => {
        const r = getOrElseEitherWith(eitherIn(t, "input", "a", "e"), () => "d");
        const called = r.trace.calls.length > 0;
        return { inputs: [{ node: eitherSlot(t, "input", "a", "e"), steps: [step(called, called ? plain("d") : undefined)] }], output: plain(r.result),
          caption: called ? "The fallback was computed from the error. The Either is gone; a plain value remains." : "The input is a `Right`, so the fallback never runs. Its value comes out." };
      } },
    { id: "option", label: "Option · constant", binds: {F: "Option"}, signature: "A → Option<A> → A", ribbon: { before: "Option<A>", after: "A" }, defaults: { input: true },
      build: (t) => {
        const r = getOrElseOption(optionIn(t, "input"), "d");
        return { inputs: [{ node: optionSlot(t, "input", "a") }], output: plain(r.result),
          caption: t.input ? "The input is `None`, so the constant default `d` comes out. No function runs." : "The input is Some, so its value comes out." };
      } },
  ] },

  // --- Pattern matching ------------------------------------------------------
  match: { receivers: [
    { id: "either", label: "Either", binds: {F: "Either"}, signature: "(E → R) × (A → R) → Either<E, A> → R", ribbon: { before: "Either<E, A>", after: "R", fn: "E → R | A → R" }, defaults: { input: false },
      build: (t) => {
        const r = matchEither(eitherIn(t, "input"), () => "r", () => "r");
        const which = r.trace.calls[0]?.fn === "left" ? "onLeft" : "onRight";
        return { inputs: [{ node: eitherSlot(t, "input", "a", "e"), steps: [step(true, plain("r"), which)] }], output: plain(r.result),
          caption: `Exactly one handler ran (\`${which}\`). Both return the same type, so the Either disappears.` };
      } },
    { id: "option", label: "Option", binds: {F: "Option"}, signature: "(() → R) × (A → R) → Option<A> → R", ribbon: { before: "Option<A>", after: "R", fn: "() → R | A → R" }, defaults: { input: false },
      build: (t) => {
        const r = matchOption(optionIn(t, "input"), () => "r", () => "r");
        const which = r.trace.calls[0]?.fn === "none" ? "onNone" : "onSome";
        return { inputs: [{ node: optionSlot(t, "input", "a"), steps: [step(true, plain("r"), which)] }], output: plain(r.result), caption: `Exactly one handler ran (\`${which}\`).` };
      } },
    { id: "validation", label: "Validation", binds: {F: "Validation"}, signature: "(Errors → R) × (A → R) → Validation<E, A> → R", ribbon: { before: "Validation<E, A>", after: "R", fn: "Errors → R | A → R" }, defaults: { input: true },
      build: (t) => {
        const r = matchValidation(t.input ? failure(["e₁", "e₂"]) : success("a"), () => "r", () => "r");
        const which = r.trace.calls[0]?.fn === "failure" ? "onFailure" : "onSuccess";
        return { inputs: [{ node: validationSlot(t, "input", "a", ["e₁", "e₂"]), steps: [step(true, plain("r"), which)] }], output: plain(r.result),
          caption: which === "onFailure" ? "`onFailure` ran once, with every error." : "`onSuccess` ran with the value." };
      } },
  ] },

  // --- Filtering -------------------------------------------------------------
  filterOrElse: { receivers: [
    { id: "either", label: "Either", binds: {F: "Either"}, signature: "(A → bool) × (A → E) → Either<E, A> → Either<E, A>", ribbon: { before: "Either<E, A>", after: "Either<E, A>", fn: "A → bool" }, defaults: { input: false, predicate: true },
      build: (t) => {
        const r = filterOrElseEither(eitherIn(t, "input", "a", "e₁"), () => !t.predicate, () => "e₂");
        const called = r.trace.calls.some((c) => c.fn === "predicate");
        return { inputs: [{ node: eitherSlot(t, "input", "a", "e₁"), steps: [step(called, boolSlot(t, "predicate", "the predicate returns"))] }], output: eitherOut(r.result as Either<string, string>),
          caption: !called ? "The input is a `Left`, so the predicate never runs." : t.predicate ? "The predicate failed, so the success becomes a `Left` built from the value." : "The predicate passed, so the value is kept." };
      } },
    { id: "option", label: "Option · filter", binds: {F: "Option"}, signature: "(A → bool) → Option<A> → Option<A>", ribbon: { before: "Option<A>", after: "Option<A>", fn: "A → bool" }, defaults: { input: false, predicate: true },
      build: (t) => {
        const r = filterOption(optionIn(t, "input"), () => !t.predicate);
        const called = r.trace.calls.length > 0;
        return { inputs: [{ node: optionSlot(t, "input", "a"), steps: [step(called, boolSlot(t, "predicate", "the predicate returns"))] }], output: optionOut(r.result),
          caption: !called ? "The input is `None`, so the predicate never runs." : t.predicate ? "The predicate failed. Option has no error to report, so the result is `None`." : "The predicate passed, so the value is kept." };
      } },
  ] },
};
