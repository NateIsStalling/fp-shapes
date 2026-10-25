import {
  altEither,
  altList,
  altOption,
  altValidation,
  bimapEither,
  bimapTuple,
  evaluationStrategies,
  failEither,
  failList,
  failOption,
  failValidation,
  failure,
  filterList,
  filterMapList,
  filterMapOption,
  filterOption,
  filterOrElseEither,
  flatMapEither,
  flatMapList,
  flatMapOption,
  flattenEither,
  flattenList,
  flattenOption,
  fromNullableEither,
  fromNullableList,
  fromNullableValidation,
  fromNullableOption,
  fromPredicateEither,
  fromPredicateList,
  fromPredicateValidation,
  fromPredicateOption,
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
  partitionList,
  peekList,
  pureEither,
  pureList,
  pureOption,
  pureValidation,
  recoverEither,
  right,
  some,
  success,
  tapEither,
  tapOption,
  traverseEither,
  traverseOption,
  traverseValidation,
  tryCatchEither,
  tryCatchValidation,
  tryCatchOption,
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
  choice,
  choiceSlot,
  container,
  eitherSlot,
  list,
  listOf,
  nestedSlot,
  nullableSlot,
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

// The slot for one element: what f returns for it (traverse, payload b), or
// the element itself (sequence, payload a).
function elementSlot(k: Kind3, t: Toggles, i: number, label: string, tone: "in" | "out", payload: "a" | "b") {
  const v = `${payload}${sub(i)}`;
  if (k === "either") return eitherSlot(t, key(i), v, `e${sub(i)}`, tone, label);
  if (k === "option") return optionSlot(t, key(i), v, tone, label);
  return validationSlot(t, key(i), v, [`e${sub(i)}`], tone, label);
}

function traverseScene(k: Kind3, t: Toggles, strategy: EvaluationStrategy, isSequence: boolean): Scene {
  const fails = idx.map((i) => !!t[key(i)]);
  // Sequence's elements hold A; traverse's f returns B.
  const v = isSequence ? "a" : "b";
  let called: Set<number>;
  let output: SceneNode;
  let resultText: string;
  if (k === "either") {
    const r = traverseEither(strategy, idx, (i) => (fails[i] ? left(`e${sub(i)}`) : right(`${v}${sub(i)}`)));
    called = new Set(r.trace.calls.map((c) => c.input));
    output = container("effect", "Either", [r.result.tag === "right" ? listOf(r.result.value, "out") : ball(r.result.error, "error")]);
    resultText = show.either(r.result);
  } else if (k === "option") {
    const r = traverseOption(strategy, idx, (i) => (fails[i] ? none : some(`${v}${sub(i)}`)));
    called = new Set(r.trace.calls.map((c) => c.input));
    output = container("effect", "Option", [r.result.tag === "some" ? listOf(r.result.value, "out") : ball("None", "empty")]);
    resultText = show.option(r.result);
  } else {
    const r = traverseValidation(idx, (i) => (fails[i] ? failure([`e${sub(i)}`]) : success(`${v}${sub(i)}`)));
    called = new Set(r.trace.calls.map((c) => c.input));
    output = container("effect", "Validation", r.result.tag === "success" ? [listOf(r.result.value, "out")] : r.result.errors.map((e) => ball(e, "error")));
    resultText = show.validation(r.result);
  }
  const label = k === "either" ? "Either" : k === "option" ? "Option" : "Validation";
  const input = isSequence ? list(idx.map((i) => elementSlot(k, t, i, label, "in", "a"))) : listOf(elems(4, "a"), "in");
  const steps = idx.map((i) => (isSequence ? { called: called.has(i), lookedAt: true } : step(called.has(i), elementSlot(k, t, i, `f(a${sub(i)})`, "out", "b"))));
  const n = fails.filter(Boolean).length;
  const reached = (count: number) => (isSequence ? `${count === 4 ? "All 4" : `${count} of 4`} elements ${count === 1 ? "was" : "were"} looked at` : `\`f\` ran on ${count === 4 ? "all 4" : `${count} of 4`} elements`);
  const what =
    n === 0 ? `${reached(4)}, and all succeeded.`
    : k === "validation" ? `${reached(4)}, and every failure was kept.`
    : strategy === "short-circuit" ? `${reached(called.size)}, stopping at the first failure.`
    : `${reached(4)}, and only the first failure was kept.`;
  const caption = `${what} The result is \`${resultText}\`.`;
  return { inputs: [{ node: input, steps }], output, caption };
}

// --- constructors -----------------------------------------------------------

// fromNullable's input: the two missing cases first, then two values. 0 is
// there because it is falsy but present.
const NULLISH = [
  { name: "undefined", raw: undefined, node: ball("undefined", "empty") },
  { name: "null", raw: null, node: ball("null", "empty") },
  { name: "0", raw: 0, node: ball("0", "in") },
  { name: "value", raw: "a", node: ball("a", "in") },
] as const;
const nullishSlot = (t: Toggles) => choiceSlot(t, "input", "A | null | undefined", NULLISH.map((c) => ({ name: c.name, content: [c.node] })));
const nullishCaption = (i: number, missing: string, present: (v: string) => string) =>
  [`\`undefined\` counts as missing, so the result is ${missing}.`,
   `\`null\` counts as missing, so the result is ${missing}.`,
   `\`0\` is a value, not a missing one, so the result is ${present("0")}. So are \`""\` and \`false\`.`,
   `The value is present, so the result is ${present("a")}.`][i] ?? "";

// tryCatch's computation: it throws (an unknown value, u), returns a, or
// returns undefined, which is still a value.
const COMPUTATION = [
  { name: "throws", node: ball("u", "plain") },
  { name: "returns", node: ball("a", "in") },
  { name: "returns undefined", node: ball("undefined", "in") },
] as const;
const computationSlot = (t: Toggles) => choiceSlot(t, "thunk", "the computation", COMPUTATION.map((c) => ({ name: c.name, content: [c.node] })));
const runComputation = (i: number) => () => {
  if (i === 0) throw "u";
  return i === 1 ? "a" : undefined;
};
const shown = (v: unknown) => (v === undefined ? "undefined" : String(v));
// A constructor's result as a layer: its value (shown as text, so 0 and
// undefined read as themselves), its error, or None.
function valueOut(label: "Either" | "Option" | "Validation", r: Either<unknown, unknown> | Option<unknown> | Validation<unknown, unknown>): SceneNode {
  const inner =
    r.tag === "right" || r.tag === "some" || r.tag === "success" ? [ball(shown(r.value), "in")]
    : r.tag === "left" ? [ball(String(r.error), "error")]
    : r.tag === "failure" ? r.errors.map((e) => ball(String(e), "error"))
    : [ball("None", "empty")];
  return container("effect", label, inner);
}

const VALIDATION_NOTE = "Validation keeps every failure, so it always goes through every element.";
// In a strict language sequence's elements already exist, so stopping early
// saves no work. (Haskell's elements are lazy; its catalog note says so.)
const SEQUENCE_NOTE = "In C# and TypeScript the elements already exist, so stopping early saves no work.";

export const operationScenes: Readonly<Record<string, OperationScenes>> = {
  // --- Constructors ----------------------------------------------------------
  pure: { receivers: [
    { id: "either", label: "Either", binds: {F: "Either"}, ribbon: { before: "A", after: "Either<E, A>" }, defaults: {},
      build: () => ({ inputs: [{ node: ball("a", "in") }], output: eitherOut(pureEither("a").result, "in"),
        caption: "Nothing ran. `a` went in the success case, so the result is `Right(a)`." }) },
    { id: "option", label: "Option", binds: {F: "Option"}, ribbon: { before: "A", after: "Option<A>" }, defaults: { input: true },
      build: (t) => {
        const r = pureOption(t.input ? null : "a").result;
        return { inputs: [{ node: nullableSlot(t, "input", "a") }], output: container("effect", "Option", [r.tag === "some" ? ball(shown(r.value), "in") : ball("None", "empty")]),
          caption: t.input
            ? "`null` went in unchecked, so the result is `Some(null)`, not `None`."
            : "Nothing ran. `a` went in the success case, so the result is `Some(a)`." };
      } },
    { id: "validation", label: "Validation", binds: {F: "Validation"}, ribbon: { before: "A", after: "Validation<E, A>" }, defaults: {},
      build: () => ({ inputs: [{ node: ball("a", "in") }], output: valueOut("Validation", pureValidation("a").result),
        caption: "Nothing ran. `a` went in the success case, so the result is `Success(a)`." }) },
    { id: "list", label: "List", binds: {F: "List"}, ribbon: { before: "A", after: "List<A>" }, defaults: {},
      build: () => ({ inputs: [{ node: ball("a", "in") }], output: listOf(pureList("a").result, "in"), caption: "Nothing ran. The result is a list of one element, `[a]`." }) },
  ] },

  fail: { receivers: [
    { id: "either", label: "Either", binds: {F: "Either"}, ribbon: { before: "E", after: "Either<E, A>", caption: "`Either` is introduced on the outside. `E` goes on the error side, and the payload type `A` is open." }, defaults: {},
      build: () => ({ inputs: [{ node: ball("e", "error") }], output: eitherOut(failEither("e").result),
        caption: "Nothing ran. `e` went in the failure case, so the result is `Left(e)`." }) },
    { id: "option", label: "Option", binds: {F: "Option"}, signature: "() → Option<A>", ribbon: { before: "()", after: "Option<A>", caption: "`Option` is introduced on the outside. Nothing goes in, and the payload type `A` is open." }, defaults: {},
      build: () => ({ inputs: [{ node: ball("()", "plain") }], output: optionOut(failOption().result),
        caption: "Nothing ran. `None` holds no error, so nothing goes in and the result is `None`." }) },
    { id: "validation", label: "Validation", binds: {F: "Validation"}, ribbon: { before: "E", after: "Validation<E, A>", caption: "`Validation` is introduced on the outside. `E` goes on the error side, and the payload type `A` is open." }, defaults: {},
      build: () => ({ inputs: [{ node: ball("e", "error") }], output: validationOut(failValidation("e").result),
        caption: "Nothing ran. `e` went in the failure case, so the result is `Failure([e])`." }) },
    { id: "list", label: "List", binds: {F: "List"}, signature: "() → List<A>", ribbon: { before: "()", after: "List<A>", caption: "`List` is introduced on the outside. Nothing goes in, and the payload type `A` is open." }, defaults: {},
      build: () => ({ inputs: [{ node: ball("()", "plain") }], output: listOf(failList().result, "in"),
        caption: "Nothing ran. The empty list holds no error, so nothing goes in and the result is `[]`." }) },
  ] },

  fromNullable: { receivers: [
    { id: "either", label: "Either", binds: {F: "Either"}, signature: "E → (A | null | undefined) → Either<E, A>", ribbon: { before: "Nullable<A>", after: "Either<E, A>", fn: "E" }, defaults: { input: 0 },
      build: (t) => {
        const i = choice(t, "input");
        const r = fromNullableEither("e", NULLISH[i]?.raw).result;
        return { inputs: [{ node: nullishSlot(t) }, { caption: "the error", node: ball("e", "error") }], output: valueOut("Either", r),
          caption: nullishCaption(i, "`Left(e)`", (v) => `\`Right(${v})\``) };
      } },
    { id: "option", label: "Option", binds: {F: "Option"}, ribbon: { before: "Nullable<A>", after: "Option<A>" }, defaults: { input: 0 },
      build: (t) => {
        const i = choice(t, "input");
        return { inputs: [{ node: nullishSlot(t) }], output: valueOut("Option", fromNullableOption(NULLISH[i]?.raw).result),
          caption: nullishCaption(i, "`None`", (v) => `\`Some(${v})\``) };
      } },
    { id: "validation", label: "Validation", binds: {F: "Validation"}, signature: "E → (A | null | undefined) → Validation<E, A>", ribbon: { before: "Nullable<A>", after: "Validation<E, A>", fn: "E" }, defaults: { input: 0 },
      build: (t) => {
        const i = choice(t, "input");
        return { inputs: [{ node: nullishSlot(t) }, { caption: "the error", node: ball("e", "error") }], output: valueOut("Validation", fromNullableValidation("e", NULLISH[i]?.raw).result),
          caption: nullishCaption(i, "`Failure([e])`", (v) => `\`Success(${v})\``) };
      } },
    { id: "list", label: "List", binds: {F: "List"}, ribbon: { before: "Nullable<A>", after: "List<A>" }, defaults: { input: 0 },
      build: (t) => {
        const i = choice(t, "input");
        return { inputs: [{ node: nullishSlot(t) }], output: listOf(fromNullableList(NULLISH[i]?.raw).result.map(shown), "in"),
          caption: nullishCaption(i, "`[]`", (v) => `\`[${v}]\``) };
      } },
  ] },

  fromPredicate: { receivers: [
    { id: "either", label: "Either", binds: {F: "Either"}, signature: "(A → bool) × (A → E) → A → Either<E, A>", ribbon: { before: "A", after: "Either<E, A>", fn: "(A → bool) × (A → E)" }, defaults: { predicate: true },
      build: (t) => {
        const r = fromPredicateEither(() => !t.predicate, () => "e", "a");
        const onFalse = r.trace.calls.some((c) => c.fn === "onFalse");
        return { inputs: [{ node: ball("a", "in"), steps: [step(true, boolSlot(t, "predicate", "p(a)")), step(onFalse, onFalse ? ball("e", "error") : undefined, "onFalse(a)")] }], output: eitherOut(r.result, "in"),
          caption: onFalse ? "`p` failed, so `onFalse` built the error `e` from `a`. The result is `Left(e)`." : "`p` passed, so `onFalse` didn't run. The result is `Right(a)`." };
      } },
    { id: "option", label: "Option", binds: {F: "Option"}, ribbon: { before: "A", after: "Option<A>", fn: "A → bool" }, defaults: { predicate: true },
      build: (t) => {
        const r = fromPredicateOption(() => !t.predicate, "a");
        return { inputs: [{ node: ball("a", "in"), steps: [step(true, boolSlot(t, "predicate", "p(a)"))] }], output: optionOut(r.result, "in"),
          caption: t.predicate ? "`p` failed, and `None` holds no error, so the result is `None`." : "`p` passed, so the result is `Some(a)`." };
      } },
    { id: "validation", label: "Validation", binds: {F: "Validation"}, signature: "(A → bool) × (A → E) → A → Validation<E, A>", ribbon: { before: "A", after: "Validation<E, A>", fn: "(A → bool) × (A → E)" }, defaults: { predicate: true },
      build: (t) => {
        const r = fromPredicateValidation(() => !t.predicate, () => "e", "a");
        const onFalse = r.trace.calls.some((c) => c.fn === "onFalse");
        return { inputs: [{ node: ball("a", "in"), steps: [step(true, boolSlot(t, "predicate", "p(a)")), step(onFalse, onFalse ? ball("e", "error") : undefined, "onFalse(a)")] }], output: valueOut("Validation", r.result),
          caption: onFalse ? "`p` failed, so `onFalse` built the error `e` from `a`. The result is `Failure([e])`." : "`p` passed, so `onFalse` didn't run. The result is `Success(a)`." };
      } },
    { id: "list", label: "List", binds: {F: "List"}, ribbon: { before: "A", after: "List<A>", fn: "A → bool" }, defaults: { predicate: true },
      build: (t) => {
        const r = fromPredicateList(() => !t.predicate, "a");
        return { inputs: [{ node: ball("a", "in"), steps: [step(true, boolSlot(t, "predicate", "p(a)"))] }], output: listOf(r.result, "in"),
          caption: t.predicate ? "`p` failed, so the result is `[]`." : "`p` passed, so the result is `[a]`." };
      } },
  ] },

  tryCatch: { receivers: [
    { id: "either", label: "Either", binds: {F: "Either"}, signature: "(() → A) × (unknown → E) → Either<E, A>", ribbon: { before: "Lazy<A>", after: "Either<E, A>", fn: "unknown → E" }, defaults: { thunk: 0 },
      build: (t) => {
        const i = choice(t, "thunk");
        const r = tryCatchEither(runComputation(i), () => "e");
        const onThrow = r.trace.calls.some((c) => c.fn === "onThrow");
        return { inputs: [{ node: computationSlot(t), steps: [step(onThrow, onThrow ? ball("e", "error") : undefined, "onThrow(u)")] }], output: valueOut("Either", r.result),
          caption: onThrow
            ? "The computation threw `u`, typed `unknown`. `onThrow` turned it into the error `e`, so the result is `Left(e)`."
            : i === 1
              ? "The computation returned `a`, so `onThrow` didn't run. The result is `Right(a)`."
              : "The computation returned `undefined`, which is still a value. The result is `Right(undefined)`." };
      } },
    { id: "option", label: "Option", binds: {F: "Option"}, ribbon: { before: "Lazy<A>", after: "Option<A>" }, defaults: { thunk: 0 },
      build: (t) => {
        const i = choice(t, "thunk");
        return { inputs: [{ node: computationSlot(t) }], output: valueOut("Option", tryCatchOption(runComputation(i)).result),
          caption: i === 0
            ? "The computation threw `u`, and `None` holds no error, so the result is `None`."
            : i === 1
              ? "The computation returned `a`, so the result is `Some(a)`."
              : "The computation returned `undefined`, which is still a value. The result is `Some(undefined)`." };
      } },
    { id: "validation", label: "Validation", binds: {F: "Validation"}, signature: "(() → A) × (unknown → E) → Validation<E, A>", ribbon: { before: "Lazy<A>", after: "Validation<E, A>", fn: "unknown → E" }, defaults: { thunk: 0 },
      build: (t) => {
        const i = choice(t, "thunk");
        const r = tryCatchValidation(runComputation(i), () => "e");
        const onThrow = r.trace.calls.some((c) => c.fn === "onThrow");
        return { inputs: [{ node: computationSlot(t), steps: [step(onThrow, onThrow ? ball("e", "error") : undefined, "onThrow(u)")] }], output: valueOut("Validation", r.result),
          caption: onThrow
            ? "The computation threw `u`, typed `unknown`. `onThrow` turned it into the error `e`, so the result is `Failure([e])`."
            : i === 1
              ? "The computation returned `a`, so `onThrow` didn't run. The result is `Success(a)`."
              : "The computation returned `undefined`, which is still a value. The result is `Success(undefined)`." };
      } },
  ] },

  // --- Mapping ---------------------------------------------------------------
  map: { receivers: [
    { id: "either", label: "Either", binds: {F: "Either"}, ribbon: { before: "Either<E, A>", after: "Either<E, B>", fn: "A → B" }, defaults: { input: false },
      build: (t) => {
        const r = mapEither(eitherIn(t, "input"), () => "b");
        const called = r.trace.calls.length > 0;
        return { inputs: [{ node: eitherSlot(t, "input", "a", "e"), steps: [step(called, called ? plain("b") : undefined, "f(a)")] }], output: eitherOut(r.result),
          caption: called ? "`f` ran on `a`, so the result is `Right(b)`." : "The input is a `Left`, so `f` didn't run. The `Left` comes out unchanged." };
      } },
    { id: "option", label: "Option", binds: {F: "Option"}, ribbon: { before: "Option<A>", after: "Option<B>", fn: "A → B" }, defaults: { input: false },
      build: (t) => {
        const r = mapOption(optionIn(t, "input"), () => "b");
        const called = r.trace.calls.length > 0;
        return { inputs: [{ node: optionSlot(t, "input", "a"), steps: [step(called, called ? plain("b") : undefined, "f(a)")] }], output: optionOut(r.result),
          caption: called ? "`f` ran on `a`, so the result is `Some(b)`." : "The input is `None`, so `f` didn't run. The result is `None`." };
      } },
    { id: "list", label: "List", binds: {F: "List"}, ribbon: { before: "List<A>", after: "List<B>", fn: "A → B" }, defaults: {},
      build: () => {
        const r = mapList(elems(3, "a"), (a) => a.replace("a", "b"));
        return { inputs: [{ node: listOf(elems(3, "a"), "in"), steps: r.trace.calls.map((c) => step(true, plain(c.output), `f(${c.input})`)) }], output: listOf(r.result, "out"),
          caption: "`f` ran once per element. The list keeps its length and order." };
      } },
  ] },

  bimap: { receivers: [
    { id: "either", label: "Either", binds: {P: "Either"}, signature: "(E → E₂) × (A → B) → Either<E, A> → Either<E₂, B>", ribbon: { before: "Either<E, A>", after: "Either<E₂, B>", fn: "(E → E₂) × (A → B)" }, defaults: { input: false },
      build: (t) => {
        const r = bimapEither(eitherIn(t, "input"), () => "e₂", () => "b");
        const isLeft = r.trace.calls[0]?.fn === "left";
        return { inputs: [{ node: eitherSlot(t, "input", "a", "e"), steps: [step(true, isLeft ? ball("e₂", "error") : plain("b"), isLeft ? "f(e)" : "g(a)")] }],
          output: eitherOut(r.result as Either<string, string>),
          caption: `Only \`${isLeft ? "f" : "g"}\` ran: an Either holds one case at a time. The result is \`${isLeft ? "Left(e₂)" : "Right(b)"}\`.` };
      } },
    { id: "tuple", label: "Tuple", binds: {P: "Tuple"}, ribbon: { before: "Tuple<A, B>", after: "Tuple<C, D>", fn: "(A → C) × (B → D)" }, defaults: {},
      build: () => {
        const r = bimapTuple(["a", "b"], () => "c", () => "d");
        return { inputs: [{ node: container("tuple", "Tuple", [ball("a", "in"), ball("b", "in")]), steps: [step(true, plain("c"), "f(a)"), step(true, plain("d"), "g(b)")] }],
          output: container("tuple", "Tuple", [plain(r.result[0]), plain(r.result[1])]),
          caption: "Both `f` and `g` ran: a Tuple holds both parts at once. The result is `(c, d)`." };
      } },
  ] },

  // --- Sequencing ------------------------------------------------------------
  flatMap: { receivers: [
    { id: "either", label: "Either", binds: {F: "Either"}, ribbon: { before: "Either<E, A>", after: "Either<E, B>", fn: "A → Either<E, B>" }, defaults: { input: false, f: false },
      build: (t) => {
        const r = flatMapEither(eitherIn(t, "input", "a", "e₁"), () => eitherIn(t, "f", "b", "e₂"));
        const called = r.trace.calls.length > 0;
        return { inputs: [{ node: eitherSlot(t, "input", "a", "e₁"), steps: [step(called, eitherSlot(t, "f", "b", "e₂", "out", "f(a)"))] }], output: eitherOut(r.result),
          caption: !called ? "The input is a `Left`, so `f` didn't run. The result is `Left(e₁)`." : t.f ? "`f` returned `Left(e₂)`, so that is the result. No nested Either is left." : "`f` returned `Right(b)`, so that is the result. No nested Either is left." };
      } },
    { id: "option", label: "Option", binds: {F: "Option"}, ribbon: { before: "Option<A>", after: "Option<B>", fn: "A → Option<B>" }, defaults: { input: false, f: false },
      build: (t) => {
        const r = flatMapOption(optionIn(t, "input"), () => optionIn(t, "f", "b"));
        const called = r.trace.calls.length > 0;
        return { inputs: [{ node: optionSlot(t, "input", "a"), steps: [step(called, optionSlot(t, "f", "b", "out", "f(a)"))] }], output: optionOut(r.result),
          caption: !called ? "The input is `None`, so `f` didn't run. The result is `None`." : t.f ? "`f` returned `None`, so the result is `None`." : "`f` returned `Some(b)`, so that is the result. No nested Option is left." };
      } },
    { id: "list", label: "List", binds: {F: "List"}, ribbon: { before: "List<A>", after: "List<B>", fn: "A → List<B>" }, defaults: {},
      build: () => {
        const as = ["1", "2", "3"];
        const r = flatMapList(as, (n) => Array.from({ length: Number(n) }, () => `b${n}`));
        return { inputs: [{ node: listOf(as, "in"), steps: r.trace.calls.map((c) => step(true, listOf(c.output, "out"), `f(${c.input})`)) }], output: listOf(r.result, "out"),
          caption: `\`f\` ran once per element and returned a list each time. The lists were joined, ${as.length} elements in and ${r.result.length} out.` };
      } },
  ] },

  flatten: { receivers: [
    { id: "either", label: "Either", binds: {F: "Either"}, ribbon: { before: "Either<E, Either<E, A>>", after: "Either<E, A>" }, defaults: { outer: false, inner: false },
      build: (t) => {
        const innerE = eitherIn(t, "inner", "a", "e₂");
        const r = flattenEither(t.outer ? left("e₁") : right(innerE));
        return { inputs: [{ node: nestedSlot(t, "outer", "outer Either", "Right", eitherSlot(t, "inner", "a", "e₂", "in", "inner Either"), "Left", ball("e₁", "error")) }], output: eitherOut(r.result),
          caption: t.outer ? "The outer `Left` is the result." : "One Either layer was removed; the inner value comes out as it is." };
      } },
    { id: "option", label: "Option", binds: {F: "Option"}, ribbon: { before: "Option<Option<A>>", after: "Option<A>" }, defaults: { outer: false, inner: false },
      build: (t) => {
        const r = flattenOption(t.outer ? none : some(optionIn(t, "inner")));
        return { inputs: [{ node: nestedSlot(t, "outer", "outer Option", "Some", optionSlot(t, "inner", "a", "in", "inner Option"), "None", ball("None", "empty")) }], output: optionOut(r.result),
          caption: t.outer ? "The outer `None` is the result." : "One Option layer was removed; the inner value comes out as it is." };
      } },
    { id: "list", label: "List", binds: {F: "List"}, ribbon: { before: "List<List<A>>", after: "List<A>" }, defaults: {},
      build: () => {
        const r = flattenList([["a₁", "a₂"], ["a₃"]]);
        return { inputs: [{ node: list([listOf(["a₁", "a₂"], "in"), listOf(["a₃"], "in")]) }], output: listOf(r.result, "out"), caption: "The inner lists were joined, in order. One List layer was removed." };
      } },
  ] },

  tap: { receivers: [
    { id: "either", label: "Either", binds: {F: "Either"}, ribbon: { before: "Either<E, A>", after: "Either<E, A>", fn: "A → Either<E, _>" }, defaults: { input: false, step: false },
      build: (t) => {
        const r = tapEither(eitherIn(t, "input", "a", "e₁"), () => eitherIn(t, "step", "_", "e₂"));
        const called = r.trace.calls.length > 0;
        return { inputs: [{ node: eitherSlot(t, "input", "a", "e₁"), steps: [step(called, eitherSlot(t, "step", "_", "e₂", "out", "f(a)"))] }], output: eitherOut(r.result, "in"),
          caption: !called ? "The input is a `Left`, so `f` didn't run. The result is `Left(e₁)`." : t.step ? "`f` failed, so its `Left(e₂)` is the result." : "`f` succeeded. Its value `_` was dropped, and the result keeps `Right(a)`." };
      } },
    { id: "option", label: "Option", binds: {F: "Option"}, ribbon: { before: "Option<A>", after: "Option<A>", fn: "A → Option<_>" }, defaults: { input: false, step: false },
      build: (t) => {
        const r = tapOption(optionIn(t, "input"), () => optionIn(t, "step", "_"));
        const called = r.trace.calls.length > 0;
        return { inputs: [{ node: optionSlot(t, "input", "a"), steps: [step(called, optionSlot(t, "step", "_", "out", "f(a)"))] }], output: optionOut(r.result, "in"),
          caption: !called ? "The input is `None`, so `f` didn't run. The result is `None`." : t.step ? "`f` returned `None`, so the result is `None`." : "`f` succeeded. Its value `_` was dropped, and the result keeps `Some(a)`." };
      } },
  ] },

  peek: { receivers: [
    { id: "either", label: "Either", binds: {F: "Either"}, ribbon: { before: "Either<E, A>", after: "Either<E, A>", fn: "A → void" }, defaults: { input: false },
      build: (t) => {
        const r = peek(eitherIn(t, "input"), () => undefined);
        const called = r.trace.calls.length > 0;
        return { inputs: [{ node: eitherSlot(t, "input", "a", "e"), steps: [{ called, label: "f(a)", ...(called ? { effect: "saw a" } : {}) }] }], output: eitherOut(r.result, "in"),
          caption: called ? "`f` saw `a` and returned nothing, so the same `Right(a)` comes out. It can't fail or change the value." : "The input is a `Left`, so `f` didn't run. The `Left` comes out unchanged." };
      } },
    { id: "list", label: "List", binds: {F: "List"}, ribbon: { before: "List<A>", after: "List<A>", fn: "A → void" }, defaults: {},
      build: () => {
        const as = elems(3, "a");
        const r = peekList(as, () => undefined);
        return { inputs: [{ node: listOf(as, "in"), steps: r.trace.calls.map((c) => ({ called: true, label: `f(${c.input})`, effect: `saw ${c.input}` })) }], output: listOf(r.result, "in"), caption: "`f` saw each element once and returned nothing, so the same list comes out." };
      } },
  ] },

  // --- Zipping ---------------------------------------------------------------
  zip: { receivers: [
    { id: "either", label: "Either", binds: {F: "Either"}, ribbon: { before: "Either<E, A>", after: "Either<E, C>", fn: "Either<E, B> × ((A, B) → C)" }, defaults: { a: false, b: false },
      build: (t) => {
        const r = zipWithEither(eitherIn(t, "a", "a", "e₁"), eitherIn(t, "b", "b", "e₂"), () => "c");
        return { inputsAs: "tuple", inputs: [{ node: eitherSlot(t, "a", "a", "e₁", "in", "first Either") }, { node: eitherSlot(t, "b", "b", "e₂", "in", "second Either") }], output: eitherOut(r.result),
          caption: t.a && t.b ? "Both failed, and Either keeps only the first error. The result is `Left(e₁)`." : t.a || t.b ? "One side failed, so `f` didn't run. That `Left` is the result." : "Both succeeded, so `f` combined `a` and `b`. The result is `Right(c)`." };
      } },
    { id: "validation", label: "Validation", binds: {F: "Validation"}, ribbon: { before: "Validation<E, A>", after: "Validation<E, C>", fn: "Validation<E, B> × ((A, B) → C)" }, defaults: { a: true, b: true },
      build: (t) => {
        const a: Validation<string, string> = t.a ? failure(["e₁"]) : success("a");
        const b: Validation<string, string> = t.b ? failure(["e₂"]) : success("b");
        const r = zipWithValidation(a, b, () => "c");
        return { inputsAs: "tuple", inputs: [{ node: validationSlot(t, "a", "a", ["e₁"], "in", "first Validation") }, { node: validationSlot(t, "b", "b", ["e₂"], "in", "second Validation") }], output: validationOut(r.result),
          caption: t.a && t.b ? "Both failed, and Validation keeps both errors. The result is `Failure([e₁, e₂])`." : t.a || t.b ? "One side failed, so `f` didn't run. That `Failure` is the result." : "Both succeeded, so `f` combined `a` and `b`. The result is `Success(c)`." };
      } },
    { id: "list", label: "List (cartesian)", note: "Every element meets every element. To pair by position, pick List (positional).", binds: {F: "List"}, ribbon: { before: "List<A>", after: "List<C>", fn: "List<B> × ((A, B) → C)" }, defaults: {},
      build: () => {
        const r = zipWithListCartesian(["1", "2", "3"], ["a", "b"], (x, y) => x + y);
        return { inputsAs: "tuple", inputs: [{ node: listOf(["1", "2", "3"], "in") }, { node: listOf(["a", "b"], "in") }], output: listOf(r.result, "out"),
          caption: "`f` ran on every pair: 3 × 2 = 6 results." };
      } },
    { id: "ziplist", label: "List (positional)", binds: {F: "ZipList"}, ribbon: { before: "List<A>", after: "List<C>", fn: "List<B> × ((A, B) → C)" }, defaults: {},
      build: () => {
        const r = zipWithListPositional(["1", "2", "3"], ["a", "b"], (x, y) => x + y);
        return { inputsAs: "tuple", inputs: [{ node: listOf(["1", "2", "3"], "in"), steps: [0, 1, 2].map((i) => step(!r.trace.skipped.includes(i))) }, { node: listOf(["a", "b"], "in") }], output: listOf(r.result, "out"),
          caption: "`f` ran on each pair by position. The extra `3` has no partner, so it was dropped." };
      } },
  ] },

  // --- Traversing ------------------------------------------------------------
  traverse: { receivers: [
    { id: "either", label: "Either", binds: {F: "Either",T: "List"}, ribbon: { before: "List<A>", after: "Either<E, List<B>>", fn: "A → Either<E, B>" }, defaults: four, strategies: evaluationStrategies.either,
      build: (t, s) => traverseScene("either", t, s, false) },
    { id: "option", label: "Option", binds: {F: "Option",T: "List"}, ribbon: { before: "List<A>", after: "Option<List<B>>", fn: "A → Option<B>" }, defaults: four, strategies: evaluationStrategies.option,
      build: (t, s) => traverseScene("option", t, s, false) },
    { id: "validation", label: "Validation", note: VALIDATION_NOTE, binds: {F: "Validation",T: "List"}, ribbon: { before: "List<A>", after: "Validation<E, List<B>>", fn: "A → Validation<E, B>" }, defaults: four, strategies: evaluationStrategies.validation,
      build: (t, s) => traverseScene("validation", t, s, false) },
  ] },

  sequence: { receivers: [
    { id: "either", label: "Either", note: SEQUENCE_NOTE, binds: {F: "Either",T: "List"}, ribbon: { before: "List<Either<E, A>>", after: "Either<E, List<A>>" }, defaults: four, strategies: evaluationStrategies.either,
      build: (t, s) => traverseScene("either", t, s, true) },
    { id: "option", label: "Option", note: SEQUENCE_NOTE, binds: {F: "Option",T: "List"}, ribbon: { before: "List<Option<A>>", after: "Option<List<A>>" }, defaults: four, strategies: evaluationStrategies.option,
      build: (t, s) => traverseScene("option", t, s, true) },
    { id: "validation", label: "Validation", note: VALIDATION_NOTE, binds: {F: "Validation",T: "List"}, ribbon: { before: "List<Validation<E, A>>", after: "Validation<E, List<A>>" }, defaults: four, strategies: evaluationStrategies.validation,
      build: (t, s) => traverseScene("validation", t, s, true) },
  ] },

  // --- Error handling --------------------------------------------------------
  mapError: { receivers: [
    { id: "either", label: "Either", binds: {P: "Either"}, ribbon: { before: "Either<E, A>", after: "Either<E₂, A>", fn: "E → E₂" }, defaults: { input: true },
      build: (t) => {
        const r = mapErrorEither(eitherIn(t, "input"), () => "e₂");
        const called = r.trace.calls.length > 0;
        return { inputs: [{ node: eitherSlot(t, "input", "a", "e"), steps: [step(called, called ? ball("e₂", "error") : undefined, "f(e)")] }], output: eitherOut(r.result),
          caption: called ? "`f` ran on the error, so the result is `Left(e₂)`." : "The input is a `Right`, so `f` didn't run. The `Right` comes out unchanged." };
      } },
    { id: "validation", label: "Validation", binds: {P: "Validation"}, ribbon: { before: "Validation<E, A>", after: "Validation<E₂, A>", fn: "E → E₂" }, defaults: { input: true },
      build: (t) => {
        const r = mapErrorValidation(t.input ? failure(["e₁", "e₂"]) : success("a"), (e) => e.toUpperCase());
        const n = r.trace.calls.length;
        return { inputs: [{ node: validationSlot(t, "input", "a", ["e₁", "e₂"]), steps: [step(n > 0, n ? container("effect", "errors", r.trace.calls.map((c) => ball(c.output, "error"))) : undefined, n ? r.trace.calls.map((c) => `f(${c.input})`).join(", ") : undefined)] }],
          output: validationOut(r.result),
          caption: n ? `\`f\` ran once per error, ${n} times. The result is \`Failure([E₁, E₂])\`.` : "The input is a `Success`, so `f` didn't run. It comes out unchanged." };
      } },
  ] },

  recover: { receivers: [
    { id: "either", label: "Either", binds: {F: "Either"}, ribbon: { before: "Either<E, A>", after: "Either<E₂, A>", fn: "E → Either<E₂, A>" }, defaults: { input: true, handler: false },
      build: (t) => {
        const r = recoverEither(eitherIn(t, "input", "a₁", "e₁"), () => eitherIn(t, "handler", "a₂", "e₂"));
        const called = r.trace.calls.length > 0;
        return { inputs: [{ node: eitherSlot(t, "input", "a₁", "e₁"), steps: [step(called, eitherSlot(t, "handler", "a₂", "e₂", "out", "f(e₁)"))] }], output: eitherOut(r.result),
          caption: !called ? "The input is a `Right`, so `f` didn't run. The `Right` comes out unchanged." : t.handler ? "`f` failed with a new error, so the result is `Left(e₂)`. Its type can differ from `e₁`'s." : "`f` recovered, so the result is `Right(a₂)`." };
      } },
  ] },

  alt: { receivers: [
    { id: "option", label: "Option", binds: {F: "Option"}, ribbon: { before: "Option<A>", after: "Option<A>", fn: "() → Option<A>" }, defaults: { primary: true, fallback: false },
      build: (t) => {
        const r = altOption(optionIn(t, "primary", "a₁"), () => optionIn(t, "fallback", "a₂"));
        const called = r.trace.calls.length > 0;
        return { inputs: [{ node: optionSlot(t, "primary", "a₁", "in", "first") }, { node: optionSlot(t, "fallback", "a₂", "in", "fallback"), steps: [step(called)] }], output: optionOut(r.result),
          caption: called ? "The first is `None`, so the fallback ran. Its value is the result." : "The first is a `Some`, so the fallback didn't run. The first is the result." };
      } },
    { id: "either", label: "Either", binds: {F: "Either"}, ribbon: { before: "Either<E, A>", after: "Either<E, A>", fn: "() → Either<E, A>" }, defaults: { primary: true, fallback: true },
      build: (t) => {
        const r = altEither(eitherIn(t, "primary", "a₁", "e₁"), () => eitherIn(t, "fallback", "a₂", "e₂"));
        const called = r.trace.calls.length > 0;
        return { inputs: [{ node: eitherSlot(t, "primary", "a₁", "e₁", "in", "first") }, { node: eitherSlot(t, "fallback", "a₂", "e₂", "in", "fallback"), steps: [step(called)] }], output: eitherOut(r.result),
          caption: !called ? "The first is a `Right`, so the fallback didn't run. The first is the result." : t.fallback ? "Both failed, and Either keeps only the fallback's error. The result is `Left(e₂)`." : "The first failed, so the fallback ran. The result is `Right(a₂)`." };
      } },
    { id: "validation", label: "Validation", binds: {F: "Validation"}, ribbon: { before: "Validation<E, A>", after: "Validation<E, A>", fn: "() → Validation<E, A>" }, defaults: { primary: true, fallback: true },
      build: (t) => {
        const r = altValidation(t.primary ? failure(["e₁"]) : success("a₁"), () => (t.fallback ? failure(["e₂"]) : success("a₂")));
        const called = r.trace.calls.length > 0;
        return { inputs: [{ node: validationSlot(t, "primary", "a₁", ["e₁"], "in", "first") }, { node: validationSlot(t, "fallback", "a₂", ["e₂"], "in", "fallback"), steps: [step(called)] }], output: validationOut(r.result),
          caption: !called ? "The first is a `Success`, so the fallback didn't run. The first is the result." : t.fallback ? "Both failed, and Validation keeps both errors. The result is `Failure([e₁, e₂])`." : "The first failed, so the fallback ran. The result is `Success(a₂)`." };
      } },
    { id: "list", label: "List", binds: {F: "List"}, ribbon: { before: "List<A>", after: "List<A>", fn: "() → List<A>" }, defaults: {},
      build: () => {
        const r = altList(["a₁", "a₂"], () => ["a₃"]);
        return { inputs: [{ node: listOf(["a₁", "a₂"], "in") }, { caption: "fallback", node: listOf(["a₃"], "in"), steps: [step(true)] }], output: listOf(r.result, "out"),
          caption: "The fallback always runs: the two lists are joined, first list first." };
      } },
  ] },

  getOrElse: { receivers: [
    { id: "either", label: "Either · computed", binds: {F: "Either"}, signature: "(E → A) → Either<E, A> → A", ribbon: { before: "Either<E, A>", after: "A", fn: "E → A" }, defaults: { input: true },
      build: (t) => {
        const r = getOrElseEitherWith(eitherIn(t, "input", "a₁", "e"), () => "a₂");
        const called = r.trace.calls.length > 0;
        return { inputs: [{ node: eitherSlot(t, "input", "a₁", "e"), steps: [step(called, called ? plain("a₂") : undefined, "f(e)")] }], output: plain(r.result),
          caption: called ? "`f` ran on the error, and its value `a₂` is the result." : "The input is a `Right`, so `f` didn't run. Its value `a₁` is the result." };
      } },
    { id: "option", label: "Option · constant", binds: {F: "Option"}, signature: "A → Option<A> → A", ribbon: { before: "Option<A>", after: "A", fn: "A" }, defaults: { input: true },
      build: (t) => {
        const r = getOrElseOption(optionIn(t, "input", "a₁"), "a₂");
        return { inputs: [{ node: optionSlot(t, "input", "a₁") }, { caption: "the default", node: ball("a₂", "in") }], output: ball(r.result, "in"),
          caption: t.input ? "The input is `None`, so the default `a₂` is the result." : "The input is a `Some`, so its value `a₁` is the result." };
      } },
  ] },

  // --- Pattern matching ------------------------------------------------------
  match: { receivers: [
    { id: "either", label: "Either", binds: {F: "Either"}, signature: "(E → R) × (A → R) → Either<E, A> → R", ribbon: { before: "Either<E, A>", after: "R", fn: "(E → R) × (A → R)" }, defaults: { input: false },
      build: (t) => {
        const r = matchEither(eitherIn(t, "input"), () => "r", () => "r");
        const which = r.trace.calls[0]?.fn === "left" ? "onLeft" : "onRight";
        return { inputs: [{ node: eitherSlot(t, "input", "a", "e"), steps: [step(true, plain("r"), which === "onLeft" ? "onLeft(e)" : "onRight(a)")] }], output: plain(r.result),
          caption: `Only \`${which}\` ran, and its value \`r\` is the result.` };
      } },
    { id: "option", label: "Option", binds: {F: "Option"}, signature: "(() → R) × (A → R) → Option<A> → R", ribbon: { before: "Option<A>", after: "R", fn: "(() → R) × (A → R)" }, defaults: { input: false },
      build: (t) => {
        const r = matchOption(optionIn(t, "input"), () => "r", () => "r");
        const which = r.trace.calls[0]?.fn === "none" ? "onNone" : "onSome";
        return { inputs: [{ node: optionSlot(t, "input", "a"), steps: [step(true, plain("r"), which === "onNone" ? "onNone()" : "onSome(a)")] }], output: plain(r.result), caption: `Only \`${which}\` ran, and its value \`r\` is the result.` };
      } },
    { id: "validation", label: "Validation", binds: {F: "Validation"}, signature: "(NonEmpty<E> → R) × (A → R) → Validation<E, A> → R", ribbon: { before: "Validation<E, A>", after: "R", fn: "(NonEmpty<E> → R) × (A → R)" }, defaults: { input: true },
      build: (t) => {
        const r = matchValidation(t.input ? failure(["e₁", "e₂"]) : success("a"), () => "r", () => "r");
        const which = r.trace.calls[0]?.fn === "failure" ? "onFailure" : "onSuccess";
        return { inputs: [{ node: validationSlot(t, "input", "a", ["e₁", "e₂"]), steps: [step(true, plain("r"), which === "onFailure" ? "onFailure(e₁, e₂)" : "onSuccess(a)")] }], output: plain(r.result),
          caption: which === "onFailure" ? "Only `onFailure` ran, once, with every error. Its value `r` is the result." : "Only `onSuccess` ran, and its value `r` is the result." };
      } },
  ] },

  // --- Filtering -------------------------------------------------------------
  filter: { receivers: [
    { id: "list", label: "List", binds: {F: "List"}, ribbon: { before: "List<A>", after: "List<A>", fn: "A → bool" }, defaults: { a1: false, a2: true, a3: false, a4: true },
      build: (t) => {
        const r = filterList(idx, (i) => !t[key(i)]);
        const kept = r.result.map((i) => `a${sub(i)}`);
        return { inputs: [{ node: listOf(elems(4, "a"), "in"), steps: idx.map((i) => step(true, boolSlot(t, key(i), `p(a${sub(i)})`))) }], output: listOf(kept, "in"),
          caption: `\`p\` ran once per element. ${kept.length} of 4 passed and were kept, in order.` };
      } },
    { id: "option", label: "Option", binds: {F: "Option"}, ribbon: { before: "Option<A>", after: "Option<A>", fn: "A → bool" }, defaults: { input: false, predicate: true },
      build: (t) => {
        const r = filterOption(optionIn(t, "input"), () => !t.predicate);
        const called = r.trace.calls.length > 0;
        return { inputs: [{ node: optionSlot(t, "input", "a"), steps: [step(called, boolSlot(t, "predicate", "p(a)"))] }], output: optionOut(r.result),
          caption: !called ? "The input is `None`, so `p` didn't run. The result is `None`." : t.predicate ? "`p` failed, and `None` holds no error, so the result is `None`." : "`p` passed, so the result is `Some(a)`." };
      } },
  ] },

  filterMap: { receivers: [
    { id: "list", label: "List", binds: {F: "List"}, ribbon: { before: "List<A>", after: "List<B>", fn: "A → Option<B>" }, defaults: { a1: false, a2: true, a3: false, a4: true },
      build: (t) => {
        const r = filterMapList(idx, (i) => (t[key(i)] ? none : some(`b${sub(i)}`)));
        return { inputs: [{ node: listOf(elems(4, "a"), "in"), steps: idx.map((i) => step(true, optionSlot(t, key(i), `b${sub(i)}`, "out", `f(a${sub(i)})`))) }], output: listOf(r.result, "out"),
          caption: `\`f\` ran once per element. ${4 - r.result.length} of 4 returned \`None\` and were dropped; the \`Some\` values were unwrapped.` };
      } },
    { id: "option", label: "Option", binds: {F: "Option"}, ribbon: { before: "Option<A>", after: "Option<B>", fn: "A → Option<B>" }, defaults: { input: false, f: true },
      build: (t) => {
        const r = filterMapOption(optionIn(t, "input"), () => optionIn(t, "f", "b"));
        const called = r.trace.calls.length > 0;
        return { inputs: [{ node: optionSlot(t, "input", "a"), steps: [step(called, optionSlot(t, "f", "b", "out", "f(a)"))] }], output: optionOut(r.result),
          caption: !called ? "The input is `None`, so `f` didn't run. The result is `None`." : t.f ? "`f` returned `None`, so the result is `None`." : "`f` returned `Some(b)`, so the result is `Some(b)`." };
      } },
  ] },

  partition: { receivers: [
    { id: "list", label: "List", binds: {F: "List"}, signature: "(A → bool) → List<A> → (List<A>, List<A>)", ribbon: { before: "List<A>", after: "Tuple<List<A>, List<A>>", fn: "A → bool", caption: "`List` becomes a `Tuple` of two lists: passes, then fails. The payload stays `A`." }, defaults: { a1: false, a2: true, a3: false, a4: true },
      build: (t) => {
        const r = partitionList(idx, (i) => !t[key(i)]);
        const [pass, fail] = r.result.map((side) => side.map((i) => `a${sub(i)}`));
        return { inputs: [{ node: listOf(elems(4, "a"), "in"), steps: idx.map((i) => step(true, boolSlot(t, key(i), `p(a${sub(i)})`))) }],
          output: container("tuple", "Tuple", [listOf(pass ?? [], "in"), listOf(fail ?? [], "in")]),
          caption: `\`p\` ran once per element. ${pass?.length ?? 0} passed and ${fail?.length ?? 0} failed; each side keeps its order.` };
      } },
  ] },

  filterOrElse: { receivers: [
    { id: "either", label: "Either", binds: {F: "Either"}, signature: "(A → bool) × (A → E) → Either<E, A> → Either<E, A>", ribbon: { before: "Either<E, A>", after: "Either<E, A>", fn: "(A → bool) × (A → E)" }, defaults: { input: false, predicate: true },
      build: (t) => {
        const r = filterOrElseEither(eitherIn(t, "input", "a", "e₁"), () => !t.predicate, () => "e₂");
        const called = r.trace.calls.some((c) => c.fn === "predicate");
        const onFalse = r.trace.calls.some((c) => c.fn === "onFalse");
        return { inputs: [{ node: eitherSlot(t, "input", "a", "e₁"), steps: [step(called, boolSlot(t, "predicate", "p(a)")), step(onFalse, onFalse ? ball("e₂", "error") : undefined, "onFalse(a)")] }], output: eitherOut(r.result as Either<string, string>),
          caption: !called ? "The input is a `Left`, so `p` didn't run. The result is `Left(e₁)`." : t.predicate ? "`p` failed, so `onFalse` built the error from `a`. The result is `Left(e₂)`." : "`p` passed, so `onFalse` didn't run. The result is `Right(a)`." };
      } },
  ] },
};
