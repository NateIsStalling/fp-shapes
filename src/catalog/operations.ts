// Navigation data. Most groups follow the @category vocabulary shared by
// fp-ts 2.16.11 and Effect 4.0.5; Constructors is the site's own grouping
// (fp-ts files fromNullable under conversions, fromPredicate under lifting
// and tryCatch under interop). How each ecosystem names
// an operation, and where a name means something else (Haskell's `fail`),
// belongs in the catalog's notes, not here.

export type OperationId =
  | "pure" | "fail" | "fromNullable" | "fromPredicate" | "tryCatch"
  | "map" | "bimap"
  | "flatMap" | "flatten" | "tap" | "peek"
  | "zip"
  | "traverse" | "sequence"
  | "mapError" | "recover" | "alt" | "getOrElse"
  | "match"
  | "filter" | "filterMap" | "partition" | "filterOrElse";

export interface OperationInfo {
  readonly id: OperationId;
  readonly name: string;
  readonly signature: string;
  // The type variable the receiver control fills in (F, or P for two-sided types).
  readonly receiverVar: string;
}

export interface OperationGroup {
  readonly name: string;
  readonly operations: readonly OperationInfo[];
  // Under review: shown only when the viewer turns on Preview.
  readonly preview?: true;
}

export const operationGroups: readonly OperationGroup[] = [
  { name: "Constructors", preview: true, operations: [
    { id: "pure", name: "pure", signature: "A → F<A>", receiverVar: "F" },
    { id: "fail", name: "fail", signature: "E → F<E, A>", receiverVar: "F" },
    { id: "fromNullable", name: "fromNullable", signature: "(A | null | undefined) → F<A>", receiverVar: "F" },
    { id: "fromPredicate", name: "fromPredicate", signature: "(A → bool) → A → F<A>", receiverVar: "F" },
    { id: "tryCatch", name: "tryCatch", signature: "(() → A) → F<A>", receiverVar: "F" },
  ] },
  { name: "Mapping", operations: [
    { id: "map", name: "map", signature: "(A → B) → F<A> → F<B>", receiverVar: "F" },
    { id: "bimap", name: "bimap", signature: "(A → C) × (B → D) → P<A, B> → P<C, D>", receiverVar: "P" },
  ] },
  { name: "Sequencing", operations: [
    { id: "flatMap", name: "flatMap", signature: "(A → F<B>) → F<A> → F<B>", receiverVar: "F" },
    { id: "flatten", name: "flatten", signature: "F<F<A>> → F<A>", receiverVar: "F" },
    { id: "tap", name: "tap", signature: "(A → F<_>) → F<A> → F<A>", receiverVar: "F" },
    { id: "peek", name: "peek", signature: "(A → void) → F<A> → F<A>", receiverVar: "F" },
  ] },
  { name: "Zipping", operations: [
    { id: "zip", name: "zip / map2", signature: "F<A> × F<B> × ((A, B) → C) → F<C>", receiverVar: "F" },
  ] },
  { name: "Traversing", operations: [
    { id: "traverse", name: "traverse", signature: "(A → F<B>) → T<A> → F<T<B>>", receiverVar: "F" },
    { id: "sequence", name: "sequence", signature: "T<F<A>> → F<T<A>>", receiverVar: "F" },
  ] },
  { name: "Error handling", operations: [
    { id: "mapError", name: "mapError", signature: "(E → E₂) → P<E, A> → P<E₂, A>", receiverVar: "P" },
    { id: "recover", name: "recover", signature: "(E → F<E₂, A>) → F<E, A> → F<E₂, A>", receiverVar: "F" },
    { id: "alt", name: "alt", signature: "F<A> × (() → F<A>) → F<A>", receiverVar: "F" },
    { id: "getOrElse", name: "getOrElse", signature: "A → F<A> → A", receiverVar: "F" },
  ] },
  { name: "Pattern matching", operations: [
    { id: "match", name: "match", signature: "(cases → R) → F<A> → R", receiverVar: "F" },
  ] },
  { name: "Filtering", operations: [
    { id: "filter", name: "filter", signature: "(A → bool) → F<A> → F<A>", receiverVar: "F" },
    { id: "filterMap", name: "filterMap", signature: "(A → Option<B>) → F<A> → F<B>", receiverVar: "F" },
    { id: "partition", name: "partition", signature: "(A → bool) → F<A> → (F<A>, F<A>)", receiverVar: "F" },
    { id: "filterOrElse", name: "filterOrElse", signature: "(A → bool) × (A → E) → F<E, A> → F<E, A>", receiverVar: "F" },
  ] },
];

export const operationsById: ReadonlyMap<OperationId, OperationInfo & { group: string; preview?: true }> = new Map(
  operationGroups.flatMap((g) => g.operations.map((o) => [o.id, { ...o, group: g.name, ...(g.preview ? { preview: true as const } : {}) }] as const)),
);

// The groups a viewer sees: preview groups only when Preview is on.
export const visibleGroups = (preview: boolean): readonly OperationGroup[] =>
  preview ? operationGroups : operationGroups.filter((g) => !g.preview);
