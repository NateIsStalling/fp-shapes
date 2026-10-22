// Navigation data: groups follow the @category vocabulary shared by
// fp-ts 2.16.11 and Effect 4.0.5. The abstraction is shown in each operation
// page's header, not in the navigation.

export type OperationId =
  | "pure" | "fail" | "fromNullable" | "fromPredicate" | "tryCatch"
  | "map" | "bimap"
  | "flatMap" | "flatten" | "tap" | "peek"
  | "zip"
  | "traverse" | "sequence"
  | "mapError" | "recover" | "alt" | "getOrElse"
  | "match"
  | "filterOrElse";

export interface OperationInfo {
  readonly id: OperationId;
  readonly name: string;
  readonly abstraction: string;
  readonly signature: string;
  // The type variable the receiver control fills in (F, or P for two-sided types).
  readonly receiverVar: string;
}

export interface OperationGroup {
  readonly name: string;
  readonly operations: readonly OperationInfo[];
}

export const operationGroups: readonly OperationGroup[] = [
  { name: "Constructors", operations: [
    { id: "pure", name: "pure", abstraction: "Applicative", signature: "A → F<A>", receiverVar: "F" },
    { id: "fail", name: "fail", abstraction: "MonadThrow", signature: "E → F<E, A>", receiverVar: "F" },
    { id: "fromNullable", name: "fromNullable", abstraction: "constructor", signature: "(A | null) → F<A>", receiverVar: "F" },
    { id: "fromPredicate", name: "fromPredicate", abstraction: "constructor", signature: "(A → bool) → A → F<A>", receiverVar: "F" },
    { id: "tryCatch", name: "tryCatch", abstraction: "constructor", signature: "(() → A) → F<A>", receiverVar: "F" },
  ] },
  { name: "Mapping", operations: [
    { id: "map", name: "map", abstraction: "Functor", signature: "(A → B) → F<A> → F<B>", receiverVar: "F" },
    { id: "bimap", name: "bimap", abstraction: "Bifunctor", signature: "(E → E₂) × (A → B) → P<E, A> → P<E₂, B>", receiverVar: "P" },
  ] },
  { name: "Sequencing", operations: [
    { id: "flatMap", name: "flatMap", abstraction: "Monad", signature: "(A → F<B>) → F<A> → F<B>", receiverVar: "F" },
    { id: "flatten", name: "flatten", abstraction: "Monad", signature: "F<F<A>> → F<A>", receiverVar: "F" },
    { id: "tap", name: "tap", abstraction: "Monad", signature: "(A → F<_>) → F<A> → F<A>", receiverVar: "F" },
    { id: "peek", name: "peek", abstraction: "Functor", signature: "(A → void) → F<A> → F<A>", receiverVar: "F" },
  ] },
  { name: "Zipping", operations: [
    { id: "zip", name: "zip / map2", abstraction: "Applicative", signature: "F<A> × F<B> × ((A, B) → C) → F<C>", receiverVar: "F" },
  ] },
  { name: "Traversing", operations: [
    { id: "traverse", name: "traverse", abstraction: "Traversable", signature: "(A → F<B>) → T<A> → F<T<B>>", receiverVar: "F" },
    { id: "sequence", name: "sequence", abstraction: "Traversable", signature: "T<F<A>> → F<T<A>>", receiverVar: "F" },
  ] },
  { name: "Error handling", operations: [
    { id: "mapError", name: "mapError", abstraction: "Bifunctor", signature: "(E → E₂) → P<E, A> → P<E₂, A>", receiverVar: "P" },
    { id: "recover", name: "recover", abstraction: "MonadError", signature: "(E → F<E₂, A>) → F<E, A> → F<E₂, A>", receiverVar: "F" },
    { id: "alt", name: "alt", abstraction: "Alt", signature: "F<A> × (() → F<A>) → F<A>", receiverVar: "F" },
    { id: "getOrElse", name: "getOrElse", abstraction: "eliminator", signature: "F<A> → A", receiverVar: "F" },
  ] },
  { name: "Pattern matching", operations: [
    { id: "match", name: "match", abstraction: "eliminator", signature: "(cases → R) → F<A> → R", receiverVar: "F" },
  ] },
  { name: "Filtering", operations: [
    { id: "filterOrElse", name: "filterOrElse", abstraction: "derived", signature: "(A → bool) → F<A> → F<A>", receiverVar: "F" },
  ] },
];

export const operationsById: ReadonlyMap<OperationId, OperationInfo & { group: string }> = new Map(
  operationGroups.flatMap((g) => g.operations.map((o) => [o.id, { ...o, group: g.name }] as const)),
);
