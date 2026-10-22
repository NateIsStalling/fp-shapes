// Navigation data: groups follow the @category vocabulary shared by
// fp-ts 2.16.11 and Effect 4.0.5. The abstraction is shown in each operation
// page's header, not in the navigation.

export type OperationId =
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
}

export interface OperationGroup {
  readonly name: string;
  readonly operations: readonly OperationInfo[];
}

export const operationGroups: readonly OperationGroup[] = [
  { name: "Mapping", operations: [
    { id: "map", name: "map", abstraction: "Functor", signature: "(A → B) → F<A> → F<B>" },
    { id: "bimap", name: "bimap", abstraction: "Bifunctor", signature: "(E → E₂) × (A → B) → P<E, A> → P<E₂, B>" },
  ] },
  { name: "Sequencing", operations: [
    { id: "flatMap", name: "flatMap", abstraction: "Monad", signature: "(A → F<B>) → F<A> → F<B>" },
    { id: "flatten", name: "flatten", abstraction: "Monad", signature: "F<F<A>> → F<A>" },
    { id: "tap", name: "tap", abstraction: "Monad", signature: "(A → F<_>) → F<A> → F<A>" },
    { id: "peek", name: "peek", abstraction: "Functor", signature: "(A → void) → F<A> → F<A>" },
  ] },
  { name: "Zipping", operations: [
    { id: "zip", name: "zip / map2", abstraction: "Applicative", signature: "F<A> × F<B> × ((A, B) → C) → F<C>" },
  ] },
  { name: "Traversing", operations: [
    { id: "traverse", name: "traverse", abstraction: "Traversable", signature: "(A → F<B>) → T<A> → F<T<B>>" },
    { id: "sequence", name: "sequence", abstraction: "Traversable", signature: "T<F<A>> → F<T<A>>" },
  ] },
  { name: "Error handling", operations: [
    { id: "mapError", name: "mapError", abstraction: "Bifunctor", signature: "(E → E₂) → P<E, A> → P<E₂, A>" },
    { id: "recover", name: "recover", abstraction: "MonadError", signature: "(E → F<E₂, A>) → F<E, A> → F<E₂, A>" },
    { id: "alt", name: "alt", abstraction: "Alt", signature: "F<A> × (() → F<A>) → F<A>" },
    { id: "getOrElse", name: "getOrElse", abstraction: "eliminator", signature: "(E → A) → Either<E, A> → A" },
  ] },
  { name: "Pattern matching", operations: [
    { id: "match", name: "match", abstraction: "eliminator", signature: "(E → R) × (A → R) → Either<E, A> → R" },
  ] },
  { name: "Filtering", operations: [
    { id: "filterOrElse", name: "filterOrElse", abstraction: "derived", signature: "(A → bool) × (A → E) → Either<E, A> → Either<E, A>" },
  ] },
];

export const operationsById: ReadonlyMap<OperationId, OperationInfo & { group: string }> = new Map(
  operationGroups.flatMap((g) => g.operations.map((o) => [o.id, { ...o, group: g.name }] as const)),
);
