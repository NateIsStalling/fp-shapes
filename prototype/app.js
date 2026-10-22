const operations = [
  {
    id: "flatMap",
    concept: "flatMap",
    kind: "Structure-changing",
    aliases: ["bind", "chain", "SelectMany", ">>=", "andThen"],
    description: "Chain an operation that returns the same kind of structure, then remove one layer of nesting.",
    signature: "F<A> × (A → F<B>) → F<B>",
    input: "F<A>", function: "A → F<B>", output: "F<B>",
    ecosystem: { CsharpLinq: "SelectMany", CsharpLanguageExt: "SelectMany / Bind", Fsharp: "Result.bind", Haskell: ">>=", TypeScriptArray: "flatMap", TypeScriptFpTs: "flatMap / chain" },
    theory: "flatMap composes dependent effectful steps while keeping the computation in one context.",
    law: "m.flatMap(f).flatMap(g) = m.flatMap(x ⇒ f(x).flatMap(g))",
    related: ["map", "flatten", "match"],
    neighbors: [["map", "transform first"], ["flatMap", "chain another step"], ["mapError", "transform failure"], ["match", "leave the structure"], ["flatten", "remove nesting"]],
    concrete: ["Result<E, User>", "User → Result<E, Account>", "Result<E, Account>"],
    note: "The failure path passes through unchanged.",
    examples: {
      CsharpLinq: {
        kind: "sequence",
        concrete: ["IEnumerable<Customer>", "Customer → IEnumerable<Order>", "IEnumerable<Order>"],
        before: ["C₁", "C₂", "C₃"], after: ["O₁", "O₂", "O₃", "O₄"],
        note: "SelectMany preserves the sequence context and flattens the inner sequences. It does not add Result-style failure semantics or preserve a concrete collection type."
      },
      CsharpLanguageExt: {
        kind: "either",
        concrete: ["Either<Error, User>", "User → Either<Error, Account>", "Either<Error, Account>"],
        note: "Bind runs only for Right; an existing Left short-circuits unchanged."
      },
      TypeScriptArray: {
        kind: "sequence",
        concrete: ["Customer[]", "Customer → Order[]", "Order[]"],
        before: ["C₁", "C₂", "C₃"], after: ["O₁", "O₂", "O₃", "O₄"],
        note: "Array.flatMap returns a new Array and flattens one array level. It can change cardinality and does not add an error channel."
      },
      TypeScriptFpTs: {
        kind: "either",
        concrete: ["Either<Error, User>", "User → Either<Error, Account>", "Either<Error, Account>"],
        note: "Either.flatMap runs only for Right; Left bypasses the dependent step."
      }
    }
  },
  {
    id: "map",
    concept: "map",
    kind: "Structure-preserving",
    aliases: ["fmap", "Select", "transform", "map"],
    description: "Transform values through the same abstract context without changing its kind.",
    signature: "F<A> × (A → B) → F<B>",
    input: "F<A>", function: "A → B", output: "F<B>",
    ecosystem: { CsharpLinq: "Select", CsharpLanguageExt: "Select / Map", Fsharp: "Result.map", Haskell: "fmap", TypeScriptArray: "map", TypeScriptFpTs: "map" },
    theory: "A lawful map preserves identity and composition. Preserving F does not promise the same concrete runtime collection type or evaluation strategy.",
    law: "map(id) = id    ·    map(f ∘ g) = map(f) ∘ map(g)",
    related: ["Functor", "flatMap", "mapError"],
    neighbors: [["pure", "enter a structure"], ["map", "transform a value"], ["flatMap", "chain effects"], ["tap", "observe a value"], ["match", "leave the structure"]],
    concrete: ["Result<E, User>", "User → UserDto", "Result<E, UserDto>"],
    note: "The Result structure and failure value stay unchanged.",
    examples: {
      CsharpLinq: {
        kind: "sequence",
        concrete: ["IEnumerable<User>", "User → UserDto", "IEnumerable<UserDto>"],
        before: ["U₁", "U₂", "U₃"], after: ["D₁", "D₂", "D₃"],
        note: "Select preserves the IEnumerable sequence context and one-output-per-input shape. The result is deferred IEnumerable<UserDto>, not necessarily the original concrete collection type."
      },
      CsharpLanguageExt: {
        kind: "either",
        concrete: ["Either<Error, User>", "User → UserDto", "Either<Error, UserDto>"],
        note: "Map changes only Right; Left and the Either container remain intact."
      },
      TypeScriptArray: {
        kind: "sequence",
        concrete: ["User[]", "User → UserDto", "UserDto[]"],
        before: ["U₁", "U₂", "U₃"], after: ["D₁", "D₂", "D₃"],
        note: "Array.map creates a new Array from the mapped elements. It preserves the array context and positions—not object identity or Either-style failure behavior."
      },
      TypeScriptFpTs: {
        kind: "either",
        concrete: ["Either<Error, User>", "User → UserDto", "Either<Error, UserDto>"],
        note: "Either.map transforms Right and preserves Left with the same error type."
      }
    }
  },
  {
    id: "mapError",
    concept: "mapError",
    kind: "Alternative-transforming",
    aliases: ["mapLeft", "leftMap", "mapErr", "bimapLeft"],
    description: "Transform the failure alternative while preserving the success value and outer structure.",
    signature: "Result<E, A> × (E → F) → Result<F, A>",
    input: "Result<E,A>", function: "E → F", output: "Result<F,A>",
    ecosystem: { CsharpLanguageExt: "MapLeft", Fsharp: "Result.mapError", Haskell: "first", TypeScriptFpTs: "mapLeft" },
    theory: "For a bifunctor-like structure, each parameter can be transformed independently.",
    law: "mapError(id) = id",
    related: ["bimap", "map", "recover"],
    neighbors: [["map", "transform success"], ["mapError", "transform failure"], ["bimap", "transform both"], ["recover", "replace failure"], ["match", "handle both"]],
    concrete: ["Result<ApiError, User>", "ApiError → Message", "Result<Message, User>"],
    note: "The success path passes through unchanged.",
    examples: {
      CsharpLanguageExt: {
        kind: "either",
        concrete: ["Either<ApiError, User>", "ApiError → Message", "Either<Message, User>"],
        note: "MapLeft transforms only Left; Right and the Either container remain intact."
      },
      TypeScriptFpTs: {
        kind: "either",
        concrete: ["Either<ApiError, User>", "ApiError → Message", "Either<Message, User>"],
        note: "Either.mapLeft transforms the first type argument while preserving Right."
      }
    }
  },
  {
    id: "match",
    concept: "match",
    kind: "Structure-consuming",
    aliases: ["fold", "either", "cata", "Match"],
    description: "Handle every possible alternative and collapse the structure into one result.",
    signature: "Result<E, A> × (E → R) × (A → R) → R",
    input: "Result<E,A>", function: "E → R | A → R", output: "R",
    ecosystem: { CsharpLanguageExt: "Match", Fsharp: "function Ok | Error", Haskell: "either", TypeScriptFpTs: "match / fold" },
    theory: "Elimination is exhaustive: every constructor must provide a path to the shared result type.",
    law: "match(onError, onSuccess) handles exactly one active alternative",
    related: ["Pattern matching", "fold", "exhaustiveness"],
    neighbors: [["map", "stay wrapped"], ["recover", "repair failure"], ["match", "handle every case"], ["render", "produce a view"], ["fold", "collapse values"]],
    concrete: ["Result<Error, User>", "Error → View | User → View", "View"],
    outputKind: "value",
    note: "Both alternatives must produce the same result type.",
    examples: {
      CsharpLanguageExt: {
        kind: "either",
        concrete: ["Either<Error, User>", "Error → View | User → View", "View"],
        outputKind: "value",
        note: "Match leaves Either by handling both Left and Right with the same output type."
      },
      TypeScriptFpTs: {
        kind: "either",
        concrete: ["Either<Error, User>", "Error → View | User → View", "View"],
        outputKind: "value",
        note: "Either.match consumes Left and Right by mapping both branches to the same output type."
      }
    }
  },
  {
    id: "traverse",
    concept: "traverse",
    kind: "Structure-reorienting",
    aliases: ["traverse", "traverseArray", "forEachF"],
    description: "Apply an effectful operation to every value, then collect the effects around the structure.",
    signature: "T<A> × (A → F<B>) → F<T<B>>",
    input: "T<A>", function: "A → F<B>", output: "F<T<B>>",
    ecosystem: { Fsharp: "List.traverse", Haskell: "traverse", TypeScriptFpTs: "traverseArray" },
    theory: "Traverse preserves the traversable shape while sequencing the applicative effects it produces.",
    law: "traverse(identity) = identity",
    related: ["sequence", "Applicative", "map"],
    neighbors: [["map", "transform each"], ["traverse", "effectful transform"], ["sequence", "flip nesting"], ["validate", "accumulate errors"], ["fold", "reduce values"]],
    concrete: ["List<Input>", "Input → Result<E, User>", "Result<E, List<User>>"],
    inputKind: "sequence", before: ["I₁", "I₂", "I₃"],
    note: "The list shape is preserved inside the resulting effect.",
    examples: {
      TypeScriptFpTs: {
        kind: "either", inputKind: "sequence",
        concrete: ["readonly Input[]", "Input → Either<Error, User>", "Either<Error, readonly User[]>"],
        before: ["I₁", "I₂", "I₃"],
        note: "Either.traverseArray applies the fallible function left to right and collects the successful values inside one Either."
      }
    }
  },
  {
    id: "sequence",
    concept: "sequence",
    kind: "Structure-reorienting",
    aliases: ["sequence", "sequenceA", "collectAll", "all"],
    description: "Turn a structure of effects into one effect containing the original structure.",
    signature: "T<F<A>> → F<T<A>>",
    input: "T<F<A>>", function: "sequence", output: "F<T<A>>",
    ecosystem: { Fsharp: "List.sequenceResult", Haskell: "sequenceA", TypeScriptFpTs: "sequenceArray" },
    theory: "Sequence is traverse with the identity function; it swaps compatible layers of structure.",
    law: "sequence = traverse(identity)",
    related: ["traverse", "Applicative", "collect"],
    neighbors: [["map", "create effects"], ["sequence", "flip nesting"], ["traverse", "map + sequence"], ["validate", "collect failures"], ["match", "consume result"]],
    concrete: ["List<Result<E, User>>", "sequence", "Result<E, List<User>>"],
    inputKind: "sequence", before: ["R₁", "R₂", "R₃"],
    note: "The effect moves outside; the collection moves inside.",
    examples: {
      TypeScriptFpTs: {
        kind: "either", inputKind: "sequence",
        concrete: ["readonly Either<Error, User>[]", "Either.sequenceArray", "Either<Error, readonly User[]>"],
        before: ["E₁", "E₂", "E₃"],
        note: "Either.sequenceArray turns an array of Either values into one Either containing a readonly array."
      }
    }
  },
  {
    id: "bimap",
    concept: "bimap",
    kind: "Alternative-transforming",
    aliases: ["BiMap", "mapBoth", "mapLeftAndRight"],
    description: "Transform the failure and success alternatives in one pass while keeping the outer two-case structure.",
    signature: "Result<E, A> × (E → F) × (A → B) → Result<F, B>",
    input: "Result<E,A>", function: "E → F | A → B", output: "Result<F,B>",
    ecosystem: { CsharpLanguageExt: "BiMap", Haskell: "bimap", TypeScriptFpTs: "bimap" },
    theory: "A bifunctor exposes two independently mappable positions. Only the function for the active alternative runs.",
    law: "bimap(id, id) = id",
    related: ["Bifunctor", "map", "mapError"],
    neighbors: [["map", "transform success"], ["mapError", "transform failure"], ["bimap", "transform both"], ["recover", "replace failure"], ["match", "consume both"]],
    concrete: ["Result<ApiError, User>", "ApiError → Message | User → UserDto", "Result<Message, UserDto>"],
    note: "Exactly one mapper runs: the one for the active alternative.",
    examples: {
      CsharpLanguageExt: {
        kind: "either",
        concrete: ["Either<ApiError, User>", "BiMap(showError, toDto)", "Either<Message, UserDto>"],
        note: "LanguageExt BiMap transforms whichever branch is active and preserves Either as the outer structure."
      },
      TypeScriptFpTs: {
        kind: "either",
        concrete: ["Either<ApiError, User>", "E.bimap(showError, toDto)", "Either<Message, UserDto>"],
        note: "fp-ts bimap accepts one function for Left and one for Right; only the active branch is evaluated."
      }
    }
  },
  {
    id: "recover",
    concept: "recover",
    kind: "Alternative-replacing",
    aliases: ["orElse", "BindLeft", "catchError", "recoverWith"],
    description: "Replace a failure with another contextual computation while successful values pass through unchanged.",
    signature: "Result<E, A> × (E → Result<F, A>) → Result<F, A>",
    input: "Result<E,A>", function: "E → Result<F,A>", output: "Result<F,A>",
    ecosystem: { CsharpLanguageExt: "BindLeft", Haskell: "catchError", TypeScriptFpTs: "orElse" },
    theory: "Recovery binds the failure channel: it can change the error type or turn failure into success without unwrapping the result.",
    law: "Ok(a).recover(f) = Ok(a)",
    related: ["orElse", "mapError", "getOrElse"],
    neighbors: [["mapError", "rename failure"], ["recover", "replace failure"], ["flatMap", "chain success"], ["getOrElse", "use plain fallback"], ["match", "consume both"]],
    concrete: ["Result<ApiError, User>", "ApiError → Result<Message, User>", "Result<Message, User>"],
    note: "Recovery runs only for failure; an existing success is preserved.",
    examples: {
      CsharpLanguageExt: {
        kind: "either",
        concrete: ["Either<ApiError, User>", "error → loadCachedUser(error)", "Either<Message, User>"],
        note: "BindLeft runs only on Left and can return a replacement Either; Right passes through unchanged."
      },
      TypeScriptFpTs: {
        kind: "either",
        concrete: ["Either<ApiError, User>", "E.orElse(loadCachedUser)", "Either<Message, User>"],
        note: "fp-ts orElse replaces Left with another Either while preserving an existing Right."
      }
    }
  },
  {
    id: "getOrElse",
    concept: "getOrElse",
    kind: "Structure-consuming",
    aliases: ["IfLeft", "fromRight", "defaultValue", "defaultWith"],
    description: "Leave the context by returning the success value or computing a plain fallback from the failure.",
    signature: "Result<E, A> × (E → A) → A",
    input: "Result<E,A>", function: "E → A", output: "A",
    ecosystem: { CsharpLanguageExt: "IfLeft", Haskell: "either / fromRight", TypeScriptFpTs: "getOrElse" },
    theory: "Unlike recovery, getOrElse eliminates the Result. Both paths converge on the same unwrapped value type.",
    law: "getOrElse(f, Ok(a)) = a",
    related: ["fallback", "recover", "match"],
    neighbors: [["mapError", "transform failure"], ["recover", "stay wrapped"], ["getOrElse", "choose fallback"], ["match", "map both paths"], ["render", "use the value"]],
    concrete: ["Result<Error, User>", "Error → GuestUser", "User"],
    outputKind: "value",
    note: "The Result wrapper is gone; the output is a plain User on either path.",
    examples: {
      CsharpLanguageExt: {
        kind: "either",
        outputKind: "value",
        concrete: ["Either<Error, User>", "error → GuestUser", "User"],
        note: "LanguageExt IfLeft returns Right directly or uses the fallback to produce the same unwrapped right-value type."
      },
      TypeScriptFpTs: {
        kind: "either",
        outputKind: "value",
        concrete: ["Either<Error, User>", "E.getOrElse(() => guest)", "User"],
        note: "fp-ts getOrElse returns Right or computes a fallback for Left, so the Either structure is consumed."
      }
    }
  },
  {
    id: "tap",
    concept: "tap",
    kind: "Structure-preserving",
    aliases: ["Do", "chainFirst", "inspect", "tee"],
    description: "Run a secondary effect for the active value while keeping the original successful value in the context.",
    signature: "F<A> × (A → F<_>) → F<A>",
    input: "F<A>", function: "A → F<_>", output: "F<A>",
    ecosystem: { CsharpLanguageExt: "Do", TypeScriptFpTs: "tap / chainFirst" },
    theory: "tap is sequencing that discards the secondary success value. The surrounding effect still determines whether the secondary step can fail.",
    law: "tap(pure ∘ f) keeps the original successful value",
    related: ["observation", "flatMap", "referential transparency"],
    neighbors: [["map", "replace value"], ["tap", "keep value"], ["flatMap", "keep next value"], ["recover", "handle failure"], ["match", "leave context"]],
    concrete: ["Result<E, User>", "User → Result<E, Unit>", "Result<E, User>"],
    note: "The original success value is kept; the secondary effect can still influence the surrounding context.",
    examples: {
      CsharpLanguageExt: {
        kind: "either",
        concrete: ["Either<Error, User>", "user → log(user)", "Either<Error, User>"],
        note: "LanguageExt Do performs an impure action for Right and returns the original unmodified Either."
      },
      TypeScriptFpTs: {
        kind: "either",
        concrete: ["Either<Error, User>", "E.tap(auditUser)", "Either<Error, User>"],
        note: "fp-ts tap sequences an Either-returning step, keeps the original Right value on success, and can introduce a Left."
      }
    }
  },
  {
    id: "flatten",
    concept: "flatten",
    kind: "Structure-changing",
    aliases: ["join", "concatAll", "SelectMany(identity)", "flat(1)"],
    description: "Remove one layer when the same kind of context is nested inside itself.",
    signature: "F<F<A>> → F<A>",
    input: "F<F<A>>", function: "flatten", output: "F<A>",
    ecosystem: { CsharpLinq: "SelectMany(identity)", CsharpLanguageExt: "Bind(identity)", Fsharp: "Result.bind id", Haskell: "join", TypeScriptArray: "flat(1)", TypeScriptFpTs: "flatten" },
    theory: "flatten is the monadic join operation. flatMap can be expressed as map followed by flatten.",
    law: "flatMap(f) = flatten ∘ map(f)",
    related: ["join", "flatMap", "nested contexts"],
    neighbors: [["map", "create nesting"], ["flatten", "remove one layer"], ["flatMap", "map + flatten"], ["sequence", "swap layers"], ["match", "consume result"]],
    concrete: ["Result<E, Result<E, User>>", "flatten", "Result<E, User>"],
    inputKind: "value",
    note: "Only one matching layer is removed; existing failures remain failures.",
    examples: {
      CsharpLinq: {
        kind: "sequence",
        concrete: ["IEnumerable<IEnumerable<User>>", "SelectMany(users => users)", "IEnumerable<User>"],
        before: ["[U₁,U₂]", "[U₃]"], after: ["U₁", "U₂", "U₃"],
        note: "LINQ SelectMany with the identity selector concatenates the inner sequences into one deferred IEnumerable."
      },
      CsharpLanguageExt: {
        kind: "either", inputKind: "value",
        concrete: ["Either<Error, Either<Error, User>>", "Bind(inner => inner)", "Either<Error, User>"],
        note: "LanguageExt can express flattening as Bind with the identity function; Either remains the surrounding context."
      },
      TypeScriptArray: {
        kind: "sequence",
        concrete: ["User[][]", "flat(1)", "User[]"],
        before: ["[U₁,U₂]", "[U₃]"], after: ["U₁", "U₂", "U₃"],
        note: "Array.flat(1) returns a new Array with exactly one nesting level removed."
      },
      TypeScriptFpTs: {
        kind: "either", inputKind: "value",
        concrete: ["Either<Error, Either<Error, User>>", "E.flatten", "Either<Error, User>"],
        note: "fp-ts flatten removes one nested Either layer and preserves the first Left encountered."
      }
    }
  },
  {
    id: "zip",
    concept: "zip",
    kind: "Structure-combining",
    aliases: ["zipWith", "map2", "liftA2", "sequenceT"],
    description: "Combine independent contextual values with a function; the context decides how the inputs line up or fail.",
    signature: "F<A> × F<B> × (A × B → C) → F<C>",
    input: "F<A> × F<B>", function: "(A, B) → C", output: "F<C>",
    ecosystem: { CsharpLinq: "Zip", Haskell: "liftA2 / zipWith", TypeScriptFpTs: "sequenceT / ap" },
    theory: "This is applicative-style independent combination. Sequence contexts may pair positionally; Either-like contexts combine successes and propagate failure.",
    law: "The selected context determines pairing and failure behavior",
    related: ["Applicative", "independence", "product type"],
    neighbors: [["map", "one context"], ["zip", "combine contexts"], ["flatMap", "make dependent"], ["traverse", "combine many"], ["match", "consume result"]],
    concrete: ["Result<E, User> × Result<E, Permissions>", "toUserContext", "Result<E, UserContext>"],
    inputKind: "pair", before: ["User", "Permissions"],
    note: "Both inputs are available independently; the Result context determines failure propagation.",
    examples: {
      CsharpLinq: {
        kind: "sequence", inputKind: "pair",
        concrete: ["IEnumerable<User> × IEnumerable<Role>", "Zip(roles, toUserRole)", "IEnumerable<UserRole>"],
        before: ["users", "roles"], after: ["UR₁", "UR₂", "UR₃"],
        note: "LINQ Zip combines elements at matching positions and stops when the shorter sequence ends."
      },
      TypeScriptFpTs: {
        kind: "either", inputKind: "pair",
        concrete: ["Either<E, User> × Either<E, Permissions>", "sequenceT(E.Apply)", "Either<E, UserContext>"],
        before: ["User", "Permissions"],
        note: "sequenceT combines independent Either values; a later map can turn the successful tuple into UserContext."
      }
    }
  }
];

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
let current = operations[0];

function displayName(operation, query = "") {
  const normalized = query.trim().toLowerCase();
  return operation.aliases.find(alias => alias.toLowerCase() === normalized) || operation.concept;
}

function ecosystemName(value) {
  return ({ CsharpLinq: "C# · LINQ", CsharpLanguageExt: "C# · LanguageExt", Fsharp: "F#", Haskell: "Haskell", TypeScriptArray: "TypeScript · Array", TypeScriptFpTs: "TypeScript · fp-ts" })[value] || value;
}

function preferredEcosystem(operation, query = "") {
  const filter = $("#ecosystemFilter").value;
  if (filter !== "all") {
    const key = ({ "csharp-linq": "CsharpLinq", "csharp-languageext": "CsharpLanguageExt", fsharp: "Fsharp", haskell: "Haskell", "typescript-array": "TypeScriptArray", "typescript-fpts": "TypeScriptFpTs" })[filter];
    if (operation.ecosystem[key]) return [ecosystemName(key), operation.ecosystem[key], key];
    if (key === "CsharpLinq") return ["C# · LINQ", "No direct operator", key];
    if (key === "CsharpLanguageExt") return ["C# · LanguageExt", "See concept docs", key];
    if (key === "TypeScriptArray") return ["TypeScript · Array", "No direct operator", key];
    if (key === "TypeScriptFpTs") return ["TypeScript · fp-ts", "See concept docs", key];
  }
  const normalized = query.trim().toLowerCase();
  if (normalized === operation.concept.toLowerCase()) return ["Canonical", "concept", "Canonical"];
  for (const [key, expression] of Object.entries(operation.ecosystem)) {
    if (expression.toLowerCase().split(/\s*[/+·]\s*/).some(x => x === normalized)) return [ecosystemName(key), expression, key];
  }
  return ["Canonical", "concept", "Canonical"];
}

function preferredExample(operation, ecosystemKey) {
  return operation.examples?.[ecosystemKey] || {
    kind: "either",
    concrete: operation.concrete,
    inputKind: operation.inputKind,
    outputKind: operation.outputKind,
    before: operation.before,
    after: operation.after,
    note: operation.note
  };
}

function eitherContents(label) {
  const tokens = label.match(/<(.+)>/)?.[1]?.split(/,\s*/) || ["E", "A"];
  const error = tokens[0] || "E";
  const success = tokens[1] || tokens[0] || "A";
  return `<span class="error-shape">${escapeHtml(error)}</span><span class="success-shape">${escapeHtml(success)}</span>`;
}

function sequenceContents(items) {
  return `<div class="sequence-items">${items.map(item => `<span class="sequence-dot">${escapeHtml(item)}</span>`).join("")}</div>`;
}

function pairContents(items) {
  return `<div class="pair-items">${(items || ["F<A>", "F<B>"]).map(item => `<span class="pair-shape">${escapeHtml(item)}</span>`).join("<b>×</b>")}</div>`;
}

function valueContents(label) {
  return `<span class="scalar-shape">${escapeHtml(label)}</span>`;
}

function concreteContents(kind, label, items) {
  if (kind === "sequence") return sequenceContents(items || ["A₁", "A₂", "A₃"]);
  if (kind === "pair") return pairContents(items);
  if (kind === "value") return valueContents(label);
  return eitherContents(label);
}

function applyCaseState(caseName) {
  const failure = caseName === "failure";
  $$(".before-result .success-shape, .after-result .success-shape").forEach(shape => { shape.style.opacity = failure ? ".18" : "1"; });
  $$(".before-result .error-shape, .after-result .error-shape").forEach(shape => { shape.style.opacity = failure ? "1" : ".18"; });
}

function render(operation, query = "") {
  current = operation;
  const [eco, expression, ecosystemKey] = preferredEcosystem(operation, query);
  const filterOverridesAlias = $("#ecosystemFilter").value !== "all" && !expression.startsWith("No ") && expression !== "See concept docs";
  const matched = filterOverridesAlias ? expression : displayName(operation, query);
  const example = preferredExample(operation, ecosystemKey);
  $("#matchedName").textContent = matched;
  $("#matchedEcosystem").textContent = eco === "Canonical" ? "Canonical concept" : `${eco} · ${expression}`;
  $("#canonicalName").textContent = operation.concept;
  $("#operationDescription").textContent = operation.description;
  $("#signature").textContent = operation.signature;
  $("#inputLabel").textContent = operation.input;
  $("#functionLabel").textContent = operation.function;
  $("#outputLabel").textContent = operation.output;
  $("#exampleHeading").textContent = eco === "Canonical" ? "Concrete example" : `Concrete ${eco} example`;
  $("#concreteFunction").textContent = example.concrete[1];
  $(".before-result .result-label").textContent = example.concrete[0];
  $(".after-result .result-label").textContent = example.concrete[2];
  const inputKind = example.inputKind || example.kind;
  const outputKind = example.outputKind || example.kind;
  $("#beforeContents").innerHTML = concreteContents(inputKind, example.concrete[0], example.before);
  $("#afterContents").innerHTML = concreteContents(outputKind, example.concrete[2], example.after);
  $("#annotation").innerHTML = `<span>↳</span> ${escapeHtml(example.note)}`;
  $(".case-switch").hidden = inputKind !== "either" && outputKind !== "either";
  if (inputKind === "either" || outputKind === "either") {
    const activeCase = $(".case-switch .is-selected")?.dataset.case || "success";
    applyCaseState(activeCase);
  }
  $("#inspectorTitle").textContent = operation.concept;
  $("#conceptKind").textContent = operation.kind;
  const conceptRoute = {
    flatMap: "monad", flatten: "monad",
    map: "functor", tap: "functor",
    mapError: "result", bimap: "result", recover: "result", getOrElse: "result",
    match: "sum-types", zip: "applicative",
    traverse: "traversable", sequence: "traversable"
  };
  $("#conceptPageLink").href = `#concept/${conceptRoute[operation.id] || "functions"}`;
  $("#theoryText").textContent = operation.theory;
  $("#lawText").textContent = operation.law;
  $("#aliasList").innerHTML = operation.aliases.map(alias => `<button type="button" data-query="${escapeAttr(alias)}">${escapeHtml(alias)}</button>`).join("");
  $("#ecosystemList").innerHTML = Object.entries(operation.ecosystem).map(([name, value]) => `<div><dt>${ecosystemName(name)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("");
  $("#relatedList").innerHTML = operation.related.map(item => `<button type="button">${escapeHtml(item)}</button>`).join("");
  $("#neighborTrack").innerHTML = operation.neighbors.map(([name, detail], index) => `<button class="neighbor-card" type="button" data-query="${escapeAttr(name)}"><span class="neighbor-icon">${["●","»","▲","≡","◉"][index]}</span><strong>${escapeHtml(name)}</strong><small>${escapeHtml(detail)}</small></button>`).join("");

  bindQueryButtons();
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}
function escapeAttr(value) { return escapeHtml(value); }

function rankOperations(query) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return operations;
  return operations.map(operation => {
    const terms = [operation.concept, ...operation.aliases];
    let score = 0;
    terms.forEach(term => {
      const candidate = term.toLowerCase();
      if (candidate === normalized) score = Math.max(score, 100);
      else if (candidate.startsWith(normalized)) score = Math.max(score, 70);
      else if (candidate.includes(normalized)) score = Math.max(score, 50);
    });
    if (operation.description.toLowerCase().includes(normalized)) score = Math.max(score, 25);
    return { operation, score };
  }).filter(x => x.score > 0).sort((a,b) => b.score - a.score).map(x => x.operation);
}

function showResults() {
  const query = $("#operationSearch").value;
  const matches = rankOperations(query).slice(0, 5);
  const resultBox = $("#searchResults");
  if (!document.activeElement.isSameNode($("#operationSearch"))) return;
  resultBox.innerHTML = matches.length ? matches.map((operation, index) => `<button class="search-result ${index === 0 ? "is-focused" : ""}" type="button" role="option" data-operation="${operation.id}"><span><strong>${escapeHtml(displayName(operation, query))}</strong><small>${escapeHtml(operation.description)}</small></span><em>${escapeHtml(operation.concept)}</em></button>`).join("") : `<div class="search-result"><span><strong>No exact match yet</strong><small>Try map, bind, match, traverse, or sequence.</small></span></div>`;
  resultBox.hidden = false;
  resultBox.querySelectorAll("[data-operation]").forEach(button => button.addEventListener("click", () => selectOperation(button.dataset.operation, query)));
}

function selectOperation(id, query = "") {
  const operation = operations.find(item => item.id === id);
  if (!operation) return;
  $("#operationSearch").value = query || operation.concept;
  $("#searchResults").hidden = true;
  render(operation, $("#operationSearch").value);
}

function bindQueryButtons() {
  $$('[data-query]').forEach(button => {
    button.onclick = () => {
      const query = button.dataset.query;
      $("#operationSearch").value = query;
      const match = rankOperations(query)[0];
      if (match) {
        render(match, query);
        $("#searchResults").hidden = true;
        if (location.hash !== "#explore") location.hash = "explore";
      } else {
        location.hash = "glossary";
        setTimeout(() => {
          const search = $("#glossarySearch");
          if (search) {
            search.value = query;
            renderGlossary();
          }
        }, 0);
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
  });
}

$("#operationSearch").addEventListener("input", showResults);
$("#operationSearch").addEventListener("focus", showResults);
$("#operationSearch").addEventListener("keydown", event => {
  if (event.key === "Enter") {
    const match = rankOperations(event.currentTarget.value)[0];
    if (match) selectOperation(match.id, event.currentTarget.value);
  }
  if (event.key === "Escape") $("#searchResults").hidden = true;
});
document.addEventListener("click", event => {
  if (!event.target.closest(".search-area")) $("#searchResults").hidden = true;
});
document.addEventListener("keydown", event => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    $("#operationSearch").focus();
    $("#operationSearch").select();
  }
});

$("#ecosystemFilter").addEventListener("change", () => render(current, $("#operationSearch").value));
$("#bookmarkButton").addEventListener("click", event => {
  const active = event.currentTarget.getAttribute("aria-pressed") === "true";
  event.currentTarget.setAttribute("aria-pressed", String(!active));
  event.currentTarget.textContent = active ? "◇" : "◆";
});
$("#playButton").addEventListener("click", () => {
  const stage = $("#shapeStage");
  stage.classList.remove("is-playing");
  requestAnimationFrame(() => requestAnimationFrame(() => stage.classList.add("is-playing")));
  setTimeout(() => stage.classList.remove("is-playing"), 1400);
});
$("#themeButton").addEventListener("click", () => document.body.classList.toggle("high-contrast"));
$("#theoryToggle").addEventListener("click", event => {
  const expanded = event.currentTarget.getAttribute("aria-expanded") === "true";
  event.currentTarget.setAttribute("aria-expanded", String(!expanded));
  event.currentTarget.innerHTML = `${expanded ? "Show" : "Hide"} theory <span>${expanded ? "⌄" : "⌃"}</span>`;
  $("#theoryPanel").hidden = expanded;
});
$$('.case-switch button').forEach(button => button.addEventListener("click", () => {
  $$('.case-switch button').forEach(x => x.classList.toggle("is-selected", x === button));
  applyCaseState(button.dataset.case);
}));

render(current, "SelectMany");
$(".case-switch [data-case='success']").click();

const glossaryTerms = [
  { term: "Algebraic data type", type: "Type", practical: "A type assembled from alternatives (sum) and grouped fields (product).", theory: "A composite type formed using algebraic operations such as sums and products.", signature: "Shape = A + B  ·  Record = A × B" },
  { term: "Applicative", type: "Abstraction", practical: "Combine independent wrapped values without making later work depend on earlier results.", theory: "A functor equipped with pure and application, preserving identity, composition, homomorphism, and interchange.", signature: "F<(A → B)> × F<A> → F<B>" },
  { term: "Bifunctor", type: "Abstraction", practical: "A structure with two independently transformable type positions.", theory: "A functor from a product category into another category.", signature: "(A → C) × (B → D) → F<A,B> → F<C,D>" },
  { term: "bimap", type: "Operation", practical: "Transform both alternatives of a two-parameter structure with one function for each side.", theory: "The mapping operation supplied by a bifunctor.", signature: "Result<E,A> × (E → F) × (A → B) → Result<F,B>" },
  { term: "Category", type: "Theory", practical: "A setting where compatible transformations compose and every object has an identity transformation.", theory: "Objects and morphisms with associative composition and identity morphisms.", signature: "A → B → C" },
  { term: "Effect", type: "Behavior", practical: "A computation that describes more than simply returning a value—failure, async work, state, or IO.", theory: "A computational context whose operations and interpretation are modeled explicitly.", signature: "Effect<R, E, A>" },
  { term: "Either / Result", type: "Structure", practical: "Exactly one of two alternatives, commonly failure or success.", theory: "A binary sum type with constructors Left/Right or Error/Ok.", signature: "Result<E,A> = Error(E) + Ok(A)" },
  { term: "Exhaustiveness", type: "Safety", practical: "Every possible alternative is handled before producing a result.", theory: "Elimination of a closed sum requires a branch for each constructor.", signature: "match : Result<E,A> → R" },
  { term: "flatMap", type: "Operation", practical: "Chain a step that produces another wrapped value without accumulating nested wrappers.", theory: "Monadic bind composes Kleisli arrows.", signature: "F<A> × (A → F<B>) → F<B>" },
  { term: "flatten", type: "Operation", practical: "Remove one layer when the same context is nested inside itself.", theory: "The monadic join operation; flatMap is map followed by flatten.", signature: "F<F<A>> → F<A>" },
  { term: "Functor", type: "Abstraction", practical: "Something whose values can be transformed while its surrounding shape stays intact.", theory: "A mapping between categories preserving identity and composition.", signature: "map : (A → B) → F<A> → F<B>" },
  { term: "getOrElse", type: "Operation", practical: "Return the success value or compute a plain fallback, leaving the context.", theory: "An elimination operation that maps failure and success to one unwrapped value type.", signature: "Result<E,A> × (E → A) → A" },
  { term: "Kleisli composition", type: "Composition", practical: "Compose functions whose outputs are wrapped in the same effect.", theory: "Composition in the Kleisli category of a monad.", signature: "(A → F<B>) × (B → F<C>) → (A → F<C>)" },
  { term: "map", type: "Operation", practical: "Change the value inside a structure while keeping the structure.", theory: "The action of a functor on morphisms.", signature: "F<A> × (A → B) → F<B>" },
  { term: "mapError", type: "Operation", practical: "Change the failure value while preserving the success value and Result structure.", theory: "Map the first parameter of a right-biased bifunctor.", signature: "Result<E,A> × (E → F) → Result<F,A>" },
  { term: "match", type: "Operation", practical: "Handle every alternative and collapse the structure into one result.", theory: "Exhaustive elimination of a closed sum type.", signature: "Result<E,A> × (E → R) × (A → R) → R" },
  { term: "Monad", type: "Abstraction", practical: "A structure that supports sequencing dependent wrapped computations.", theory: "A monoid in the category of endofunctors, commonly represented by pure and flatMap.", signature: "pure : A → F<A>  ·  flatMap" },
  { term: "Morphism", type: "Theory", practical: "A compatible transformation from one type or object to another.", theory: "An arrow between objects in a category.", signature: "f : A → B" },
  { term: "Option / Maybe", type: "Structure", practical: "A value that is present or absent without using null as the model.", theory: "A sum of one inhabited case and one unit case.", signature: "Option<A> = None + Some(A)" },
  { term: "Product type", type: "Type", practical: "All listed fields or values exist together.", theory: "The categorical product of component types.", signature: "A × B" },
  { term: "recover", type: "Operation", practical: "Replace a failure with another wrapped computation while preserving success.", theory: "Bind over the failure channel of a two-alternative effect.", signature: "Result<E,A> × (E → Result<F,A>) → Result<F,A>" },
  { term: "Referential transparency", type: "Property", practical: "An expression can be replaced by its value without changing program behavior.", theory: "Evaluation is context-independent and supports equational reasoning.", signature: "expression ≡ value" },
  { term: "sequence", type: "Operation", practical: "Move one compatible effect outside a collection or other traversable structure.", theory: "Traverse using the identity function.", signature: "T<F<A>> → F<T<A>>" },
  { term: "Sum type", type: "Type", practical: "A value is exactly one of a closed set of alternatives.", theory: "The categorical coproduct of component types.", signature: "A + B" },
  { term: "tap", type: "Operation", practical: "Run a secondary effect for a value while keeping the original value in its context.", theory: "Sequence an effect, discard its success value, and retain the prior one.", signature: "F<A> × (A → F<_>) → F<A>" },
  { term: "traverse", type: "Operation", practical: "Apply an effectful transformation across a structure and collect the effects.", theory: "Distribute a traversable functor over an applicative functor.", signature: "T<A> × (A → F<B>) → F<T<B>>" },
  { term: "zip", type: "Operation", practical: "Combine independent contextual values; the context decides how they align or fail.", theory: "Applicative-style lifting of a binary function into a context.", signature: "F<A> × F<B> × (A × B → C) → F<C>" }
];

const conceptDefinitions = {
  functions: {
    title: "Functions & composition", eyebrow: "FOUNDATION", signature: "A → B", glyph: "A→B",
    summary: "A function turns an input into an output. Composition connects compatible outputs and inputs so several small transformations behave like one.",
    shapeNote: "The output shape of one function must fit the input shape of the next. FP Shapes uses arrows to make that compatibility visible.",
    operations: ["map", "tap", "flatMap"],
    laws: [["Identity", "Composing with identity changes nothing."], ["Associativity", "Grouping compatible compositions does not change the result."], ["Compatibility", "The previous output must match the next input."]],
    related: ["functor", "sum-types"],
    docs: [
      ["C# · language", "Lambda expressions", "https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/lambda-expressions", "Func<int, string> show = n => n.ToString();", "Delegates give functions ordinary types. LINQ and LanguageExt both accept them, but provide different surrounding contexts."],
      ["F#", "Functions", "https://learn.microsoft.com/en-us/dotnet/fsharp/language-reference/functions/", "let show (n: int) : string = string n\nlet pipeline = parse >> Result.bind validate", "Functions are curried by default, and the composition operators make pipelines explicit."],
      ["Haskell", "Prelude", "https://hackage.haskell.org/package/base/docs/Prelude.html", "showAge :: Int -> String\nshowAge = show", "Type signatures put the input-to-output relationship at the center of the definition."],
      ["TypeScript · language", "Functions", "https://www.typescriptlang.org/docs/handbook/2/functions.html", "const show = (n: number): string => String(n)", "Function types describe call compatibility; native arrays and fp-ts then supply different higher-order contexts."]
    ]
  },
  functor: {
    title: "Functor", eyebrow: "STRUCTURE-PRESERVING", signature: "map : (A → B) → F<A> → F<B>", glyph: "F",
    summary: "A functor is a context whose contained value can be transformed without changing the kind of context.",
    shapeNote: "The outer F remains fixed at the abstract level. That does not require the same object instance, concrete collection class, or evaluation strategy. This is the shared shape behind operations named map, Select, or fmap.",
    operations: ["map", "tap"],
    laws: [["Identity", "map(id) leaves the value and structure unchanged."], ["Composition", "Mapping two functions equals mapping their composition."], ["Preservation", "map cannot choose a different outer constructor." ]],
    related: ["functions", "applicative", "result"],
    docs: [
      ["C# · LINQ", "Enumerable.Select", "https://learn.microsoft.com/en-us/dotnet/api/system.linq.enumerable.select", "IEnumerable<string> names =\n  users.Select(user => user.Name);", "Select projects one output per input and returns a deferred IEnumerable. It preserves the sequence context—not necessarily List<T>, an object instance, or eager evaluation."],
      ["C# · LanguageExt", "Either.Map / Select", "https://louthy.github.io/language-ext/LanguageExt.Core/Monads/Alternative%20Monads/Either/index.html", "Either<Error, string> name =\n  user.Map(value => value.Name);\n\n// Equivalent query operator:\nvar same = user.Select(value => value.Name);", "Map and LanguageExt's Select transform Right and leave Left in place, so the result remains an Either with the same left type."],
      ["F#", "Result.map", "https://fsharp.github.io/fsharp-core-docs/reference/fsharp-core-resultmodule.html", "let name = result |> Result.map (fun user -> user.Name)", "Result.map transforms Ok and passes Error through unchanged."],
      ["Haskell", "Data.Functor", "https://hackage.haskell.org/package/base/docs/Data-Functor.html", "names = fmap userName users\n-- or: userName <$> users", "fmap is the class operation and must satisfy identity and composition."],
      ["TypeScript · Array", "Array.prototype.map", "https://tc39.es/ecma262/multipage/indexed-collections.html#sec-array.prototype.map", "const names: string[] =\n  users.map(user => user.name);", "The JavaScript runtime constructs a new Array from the mapped elements. This is eager array transformation, not Either-style branch handling."],
      ["TypeScript · fp-ts", "Either.map", "https://gcanti.github.io/fp-ts/modules/Either.ts.html#map", "const name = pipe(\n  userResult,\n  E.map(user => user.name)\n);", "Either.map changes Right while preserving Left and the Either type. fp-ts also defines the shared Functor interfaces."]
    ]
  },
  applicative: {
    title: "Applicative", eyebrow: "INDEPENDENT COMBINATION", signature: "F<(A → B)> × F<A> → F<B>", glyph: "F×F",
    summary: "Applicative composition combines values already inside a context when the computations do not depend on one another's results.",
    shapeNote: "Every input effect is known before evaluation begins. Use flatMap instead when the shape of later work depends on an earlier value.",
    operations: ["zip", "traverse", "sequence"],
    laws: [["Identity", "Applying a wrapped identity changes nothing."], ["Homomorphism", "Wrapping then applying agrees with ordinary application."], ["Interchange", "A wrapped function and wrapped value combine consistently."]],
    related: ["functor", "monad", "traversable"],
    docs: [
      ["C# · BCL", "Task.WhenAll", "https://learn.microsoft.com/en-us/dotnet/api/system.threading.tasks.task.whenall", "var userAndRoles = await Task.WhenAll(loadUser(), loadRoles());", "WhenAll is a practical independent-combination analogy, not a general Applicative abstraction in the BCL."],
      ["F#", "Async.Parallel", "https://fsharp.github.io/fsharp-core-docs/reference/fsharp-control-asyncmodule.html", "let! values = [ loadUser; loadRoles ] |> Async.Parallel", "Async.Parallel combines independent async computations; FSharp.Core does not expose a general Applicative type class."],
      ["Haskell", "Control.Applicative", "https://hackage.haskell.org/package/base/docs/Control-Applicative.html", "userContext <$> loadUser <*> loadRoles", "The Applicative class exposes pure and <*> and documents the required laws."],
      ["TypeScript · fp-ts", "fp-ts Applicative", "https://gcanti.github.io/fp-ts/modules/Applicative.ts.html", "sequenceT(E.Applicative)(loadUser, loadRoles)", "The selected Applicative instance determines how independent effects combine, including error behavior."]
    ]
  },
  monad: {
    title: "Monad", eyebrow: "DEPENDENT SEQUENCING", signature: "flatMap : F<A> × (A → F<B>) → F<B>", glyph: "F²",
    summary: "A monad supports sequencing when the next wrapped computation depends on the previous successful value.",
    shapeNote: "The function produces another F, but flatMap removes the extra layer. That distinction separates flatMap from ordinary map.",
    operations: ["flatMap", "flatten"],
    laws: [["Left identity", "pure(a).flatMap(f) behaves like f(a)."], ["Right identity", "m.flatMap(pure) behaves like m."], ["Associativity", "Regrouping a chain does not change its meaning."]],
    related: ["applicative", "functor", "result"],
    docs: [
      ["C# · LINQ", "Enumerable.SelectMany", "https://learn.microsoft.com/en-us/dotnet/api/system.linq.enumerable.selectmany", "IEnumerable<Order> orders =\n  customers.SelectMany(c => c.Orders);", "SelectMany maps each element to an IEnumerable and flattens those inner sequences. Its context is sequence enumeration, not Either-style error propagation."],
      ["C# · LanguageExt", "Either.Bind / SelectMany", "https://louthy.github.io/language-ext/LanguageExt.Core/Monads/Alternative%20Monads/Either/index.html", "Either<Error, Account> account =\n  user.Bind(loadAccount);\n\nvar same =\n  from value in user\n  from account in loadAccount(value)\n  select account;", "Bind—and the SelectMany used by query syntax—runs only for Right. Left short-circuits and the result remains Either<Error, Account>."],
      ["F#", "Result.bind", "https://fsharp.github.io/fsharp-core-docs/reference/fsharp-core-resultmodule.html", "let account = userResult |> Result.bind loadAccount", "Result.bind invokes the binder only for Ok and preserves Error."],
      ["Haskell", "Control.Monad", "https://hackage.haskell.org/package/base/docs/Control-Monad.html", "loadUser id >>= loadAccount", ">>= is the bind operation; do notation provides syntax over the same sequencing model."],
      ["TypeScript · Array", "Array.prototype.flatMap", "https://tc39.es/ecma262/multipage/indexed-collections.html#sec-array.prototype.flatmap", "const orders: Order[] =\n  customers.flatMap(customer => customer.orders);", "Array.flatMap maps each element and flattens one array level into a new Array. It can change length and has no Left/Right behavior."],
      ["TypeScript · fp-ts", "Either.flatMap", "https://gcanti.github.io/fp-ts/modules/Either.ts.html#flatmap", "const account = pipe(\n  userResult,\n  E.flatMap(loadAccount)\n);", "Either.flatMap chains a computation that may return Left without creating nested Either values. chain is the documented legacy alias."]
    ]
  },
  traversable: {
    title: "Traversable", eyebrow: "EFFECTFUL TRANSFORMATION", signature: "traverse : (A → F<B>) → T<A> → F<T<B>>", glyph: "T↔F",
    summary: "A traversable structure can apply an effectful operation to every value and collect those effects around a structure of the same shape.",
    shapeNote: "traverse is map plus sequence. sequence is traverse with identity. The effect F moves outside while the traversable shape T is retained inside.",
    operations: ["traverse", "sequence"],
    laws: [["Identity", "Traversing with Identity reproduces the original structure."], ["Naturality", "Changing the effect interpretation commutes with traversal."], ["Composition", "Nested lawful effects can be traversed coherently."]],
    related: ["applicative", "functor", "result"],
    docs: [
      ["C# · BCL", "Task.WhenAll + Select", "https://learn.microsoft.com/en-us/dotnet/api/system.threading.tasks.task.whenall", "var users = await Task.WhenAll(ids.Select(loadUserAsync));", "This is a useful async-collection specialization. The BCL does not expose a generic Traversable abstraction."],
      ["F#", "Async.Parallel", "https://fsharp.github.io/fsharp-core-docs/reference/fsharp-control-asyncmodule.html", "let! users = ids |> List.map loadUser |> Async.Parallel", "List.map creates the effects; Async.Parallel collects them. Generic traverse is commonly supplied by libraries."],
      ["Haskell", "Data.Traversable", "https://hackage.haskell.org/package/base/docs/Data-Traversable.html", "validated = traverse validate inputs\ncollected = sequenceA results", "Data.Traversable defines both traverse and sequenceA and states their identity, naturality, and composition laws."],
      ["TypeScript · fp-ts", "Either.traverseArray / sequenceArray", "https://gcanti.github.io/fp-ts/modules/Either.ts.html#traversearray", "const users = E.traverseArray(parseUser)(inputs);\nconst collected = E.sequenceArray(results);", "These specialized helpers preserve the readonly-array shape inside Either. The broader fp-ts interfaces generalize the same relationship."]
    ]
  },
  "sum-types": {
    title: "Sum types", eyebrow: "ONE OF", signature: "A + B", glyph: "A+B",
    summary: "A sum type describes a closed set of alternatives. A concrete value occupies exactly one alternative at a time.",
    shapeNote: "FP Shapes draws each constructor as a distinct possibility. The outline shows every valid case; the fill shows the current runtime case.",
    operations: ["match", "mapError", "bimap"],
    laws: [["Exactly one", "A value inhabits one constructor, never several simultaneously."], ["Closed alternatives", "The type definition determines the complete set of cases."], ["Exhaustive elimination", "Leaving the sum requires handling every possible case."]],
    related: ["result", "product-types", "functions"],
    docs: [
      ["C# · language", "Pattern matching", "https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/functional/pattern-matching", "abstract record Shape;\nrecord Circle(double R) : Shape;\nrecord Square(double S) : Shape;", "Class hierarchies plus patterns approximate sum types, but C# does not generally enforce that the hierarchy is closed."],
      ["F#", "Discriminated unions", "https://learn.microsoft.com/en-us/dotnet/fsharp/language-reference/discriminated-unions", "type Shape =\n  | Circle of radius: float\n  | Square of side: float", "Discriminated unions directly define named alternatives and work with exhaustive pattern matching."],
      ["Haskell", "Data declarations", "https://www.haskell.org/onlinereport/decls.html", "data Shape = Circle Double | Square Double", "Algebraic data declarations provide constructors for each alternative."],
      ["TypeScript · language", "Discriminated unions", "https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions", "type Shape =\n  | { kind: 'circle'; r: number }\n  | { kind: 'square'; s: number }", "A shared literal discriminator enables narrowing; a never check can enforce exhaustiveness."]
    ]
  },
  result: {
    title: "Result / Either", eyebrow: "EXPLICIT FAILURE", signature: "Result<E,A> = Error(E) + Ok(A)", glyph: "E+A",
    summary: "Result makes expected failure an explicit alternative instead of hiding it in nulls, exceptions, or undocumented control flow.",
    shapeNote: "map transforms success, mapError transforms failure, bimap transforms either, flatMap chains success, recover replaces failure, and match or getOrElse consumes the structure.",
    operations: ["map", "mapError", "bimap", "flatMap", "recover", "getOrElse", "match"],
    laws: [["Branch preservation", "One-sided maps leave the opposite branch untouched."], ["Short circuit", "Dependent success work is skipped once failure is active."], ["Explicit exit", "Both alternatives are handled when the structure is consumed."]],
    related: ["sum-types", "monad", "functor"],
    docs: [
      ["C# · BCL", "No general Result type", "https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/functional/pattern-matching", "abstract record Result<T>;\nrecord Ok<T>(T Value) : Result<T>;\nrecord Error<T>(string Message) : Result<T>;", "C# provides records and pattern matching, but the BCL does not define a general Result/Either type or its map/bind operations."],
      ["C# · LanguageExt", "Either<L, R>", "https://louthy.github.io/language-ext/LanguageExt.Core/Monads/Alternative%20Monads/Either/index.html", "Either<Error, string> view = LoadUser(id)\n  .Map(toName)\n  .Bind(validateName);\n\nstring text = view.Match(\n  Left: showError,\n  Right: showValue);", "Either supplies Map, Bind, MapLeft, Match, Select, and SelectMany. Left is the alternative branch; Right is the mapped and bound value."],
      ["F#", "Result type", "https://learn.microsoft.com/en-us/dotnet/fsharp/language-reference/results", "validate request\n|> Result.bind save\n|> Result.map toReceipt", "FSharp.Core provides Result plus map, bind, mapError, and other combinators."],
      ["Haskell", "Data.Either", "https://hackage.haskell.org/package/base/docs/Data-Either.html", "result = parse input >>= validate\nview = either showError showValue result", "Either conventionally uses Left for failure and Right for success, with Functor and Monad instances on Right."],
      ["TypeScript · language", "Custom discriminated union", "https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions", "type Result<E, A> =\n  | { tag: 'error'; error: E }\n  | { tag: 'ok'; value: A };", "TypeScript can model Result as a discriminated union, but the language and runtime do not supply a standard map/bind operation family."],
      ["TypeScript · fp-ts", "Either<E, A>", "https://gcanti.github.io/fp-ts/modules/Either.ts.html", "pipe(\n  input,\n  parse,\n  E.flatMap(validate),\n  E.match(showError, showValue)\n);", "fp-ts Either provides map, flatMap, mapLeft, and match while preserving errors in the type."]
    ]
  },
  "product-types": {
    title: "Product types", eyebrow: "ALL OF", signature: "A × B", glyph: "A×B",
    summary: "A product type groups values that exist together. Records, tuples, and parameter objects are familiar product-shaped structures.",
    shapeNote: "Unlike a sum's alternative cases, every product component is present. FP Shapes groups their shapes inside one enclosing boundary.",
    operations: ["map"],
    laws: [["All components", "Every field or tuple position belongs to the value."], ["Projection", "Each component can be accessed independently."], ["Construction", "Creating the product requires a value for every required component."]],
    related: ["sum-types", "functions"],
    docs: [
      ["C# · language", "Record types", "https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/record", "public record User(string Name, int Age);", "Records give named product data value-oriented equality and concise construction."],
      ["F#", "Records", "https://learn.microsoft.com/en-us/dotnet/fsharp/language-reference/records", "type User = { Name: string; Age: int }", "F# records are immutable by default and require every field during construction."],
      ["Haskell", "Data declarations", "https://www.haskell.org/onlinereport/decls.html", "data User = User { name :: String, age :: Int }", "A single constructor carrying several fields is product-shaped."],
      ["TypeScript · language", "Object types", "https://www.typescriptlang.org/docs/handbook/2/objects.html", "type User = { name: string; age: number }", "Object types describe the complete field shape expected together."]
    ]
  }
};

const pageTemplates = {
  learn: () => `
    <header class="content-hero">
      <div><p class="eyebrow">GUIDED LEARNING</p><h1>Learn by following the shape</h1><p class="lede">Short, connected lessons move from concrete behavior to formal vocabulary. Each lesson reuses the same visual grammar as Explore.</p></div>
      <button class="hero-action" data-query="map">Start with map →</button>
    </header>
    <div class="metric-strip">
      <div class="metric"><strong>3</strong><span>focused learning paths</span></div>
      <div class="metric"><strong>12 min</strong><span>for the foundations path</span></div>
      <div class="metric"><strong>1 grammar</strong><span>shared by every example</span></div>
    </div>
    <section class="content-section">
      <div class="content-section-header"><div><p class="eyebrow">LEARNING PATHS</p><h2>Begin with a problem you recognize</h2></div><p>Theory is available inside each lesson, but never blocks the practical explanation.</p></div>
      <div class="card-grid">
        <article class="path-card"><span class="path-number">01</span><h3>Change values safely</h3><p>See why map changes content but preserves Option, Result, and collection structure.</p><div class="path-meta"><span>4 lessons · 12 min</span><button data-query="map">Begin →</button></div></article>
        <article class="path-card"><span class="path-number">02</span><h3>Chain work that can fail</h3><p>Move from nested Results to flatMap, then learn where mapError and match belong.</p><div class="path-meta"><span>5 lessons · 16 min</span><button data-query="flatMap">Begin →</button></div></article>
        <article class="path-card"><span class="path-number">03</span><h3>Collect many effects</h3><p>Build from map to traverse and sequence using validation and parsing examples.</p><div class="path-meta"><span>4 lessons · 14 min</span><button data-query="traverse">Begin →</button></div></article>
      </div>
    </section>
    <section class="content-section">
      <div class="content-section-header"><div><p class="eyebrow">FOUNDATIONS</p><h2>The shortest useful route</h2></div><p>Each operation answers a different structural question.</p></div>
      <div class="lesson-list">
        <article class="lesson-row"><span class="lesson-icon">A→B</span><div><h3>Transform content</h3><p>Keep the context; change the value inside it.</p></div><code>map</code><button data-query="map">Explore →</button></article>
        <article class="lesson-row"><span class="lesson-icon">F²</span><div><h3>Chain dependent work</h3><p>Avoid nesting when the next step returns the same context.</p></div><code>flatMap</code><button data-query="flatMap">Explore →</button></article>
        <article class="lesson-row"><span class="lesson-icon">A+B</span><div><h3>Handle every alternative</h3><p>Leave a sum type by providing a result for every case.</p></div><code>match</code><button data-query="match">Explore →</button></article>
        <article class="lesson-row"><span class="lesson-icon">T↔F</span><div><h3>Reorient nested structures</h3><p>Collect effectful work without discarding the original shape.</p></div><code>traverse</code><button data-query="traverse">Explore →</button></article>
      </div>
    </section>`,
  concepts: () => `
    <header class="content-hero">
      <div><p class="eyebrow">CONCEPT MAP</p><h1>See how the ideas connect</h1><p class="lede">Concepts are organized by what they let a program do—not by framework or language. Follow the progression or jump directly into an operation.</p></div>
      <button class="hero-action" data-query="map">Open an operation →</button>
    </header>
    <section class="content-section">
      <div class="content-section-header"><div><p class="eyebrow">A PRACTICAL PROGRESSION</p><h2>From function to composable effects</h2></div><p>This is a learning relationship, not a claim that every ecosystem exposes these abstractions explicitly.</p></div>
      <div class="concept-path">
        <a class="concept-path-node" href="#concept/functions"><span>A→B</span><strong>Function</strong><small>transform</small></a>
        <a class="concept-path-node" href="#concept/functor"><span>F</span><strong>Functor</strong><small>map</small></a>
        <a class="concept-path-node" href="#concept/applicative"><span>F×F</span><strong>Applicative</strong><small>combine</small></a>
        <a class="concept-path-node" href="#concept/monad"><span>F²</span><strong>Monad</strong><small>flatMap</small></a>
        <a class="concept-path-node" href="#concept/traversable"><span>T↔F</span><strong>Traversable</strong><small>traverse</small></a>
      </div>
    </section>
    <section class="content-section">
      <div class="content-section-header"><div><p class="eyebrow">BEHAVIORAL FAMILIES</p><h2>Start with what changes</h2></div><p>The same concept can appear under several API names.</p></div>
      <div class="concept-lanes">
        ${conceptLane("Structure-preserving", "Keep the outer context", [["map","change the value"],["tap","observe without replacing"],["mapError","change one alternative"]])}
        ${conceptLane("Structure-changing", "Change or remove a layer", [["flatMap","chain dependent work"],["flatten","remove nesting"],["recover","replace a failure"]])}
        ${conceptLane("Structure-consuming", "Produce a value outside the context", [["match","handle every alternative"],["fold","collapse many values"],["getOrElse","provide a fallback"]])}
        ${conceptLane("Structure-reorienting", "Move compatible layers", [["traverse","map and collect effects"],["sequence","flip nesting"],["zip","combine independent values"]])}
      </div>
    </section>`,
  glossary: () => `
    <header class="content-hero">
      <div><p class="eyebrow">CONNECTED GLOSSARY</p><h1>Translate the jargon</h1><p class="lede">Look up a term in plain language, then reveal its formal meaning only when it helps. Operation terms link directly back to their visual exhibits.</p></div>
    </header>
    <div class="glossary-toolbar">
      <label class="glossary-search"><span>⌕</span><input id="glossarySearch" type="search" placeholder="Search functor, sum type, sequence…" /></label>
      <div class="view-toggle" role="group" aria-label="Glossary explanation view"><button class="is-selected" data-glossary-view="practical">Practical</button><button data-glossary-view="theory">Theory</button></div>
    </div>
    <div class="glossary-index">${"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(letter => `<button type="button" data-letter="${letter}">${letter}</button>`).join("")}</div>
    <div class="glossary-grid" id="glossaryGrid"></div>`,
  validation: () => examplePage("VALIDATION EXAMPLE", "Make invalid states visible", "Turn an ordinary value into an explicit success or failure, then transform only the successful path.", "validation"),
  parsing: () => examplePage("PARSING EXAMPLE", "Parse without hidden failure", "Model conversion as a Result so invalid input stays in the type and composes with later validation.", "parsing"),
  async: () => examplePage("ASYNC WORKFLOW", "Coordinate effects without losing errors", "See how independent async Results combine and how one failure changes the final shape.", "async")
};

function conceptLane(title, subtitle, entries) {
  const routes = { map:"functor", tap:"functor", mapError:"result", flatMap:"monad", flatten:"monad", recover:"result", match:"sum-types", fold:"sum-types", getOrElse:"result", traverse:"traversable", sequence:"traversable", zip:"applicative" };
  return `<section class="concept-lane"><div class="concept-lane-header"><h2>${title}</h2><span>${subtitle}</span></div>${entries.map(([name, detail], i) => `<article class="concept-card"><span class="concept-glyph">${["●","◇","↳"][i]}</span><div><h3>${name}</h3><p>${detail}</p></div><a href="#concept/${routes[name] || "functions"}">View →</a></article>`).join("")}</section>`;
}

function conceptPage(concept) {
  return `
    <nav aria-label="Breadcrumb"><a class="concept-page-link" href="#concepts">← All concepts</a></nav>
    <div class="concept-detail-hero">
      <section class="concept-intro">
        <p class="eyebrow">${escapeHtml(concept.eyebrow)}</p>
        <h1>${escapeHtml(concept.title)}</h1>
        <p class="lede">${escapeHtml(concept.summary)}</p>
        <div class="concept-tags">${concept.operations.map(operation => `<button data-query="${escapeAttr(operation)}">${escapeHtml(operation)} ↗</button>`).join("")}</div>
      </section>
      <aside class="shape-summary">
        <p class="eyebrow">TYPE SHAPE</p>
        <code>${escapeHtml(concept.signature)}</code>
        <p>${escapeHtml(concept.shapeNote)}</p>
      </aside>
    </div>
    <section class="content-section">
      <div class="content-section-header"><div><p class="eyebrow">BEHAVIORAL CONTRACT</p><h2>What must remain true</h2></div><p>Laws describe the behavior callers may safely depend on—not merely naming conventions.</p></div>
      <div class="law-grid">${concept.laws.map(([name, detail]) => `<article class="law-card"><span>${escapeHtml(name)}</span><p>${escapeHtml(detail)}</p></article>`).join("")}</div>
    </section>
    <section class="content-section">
      <div class="content-section-header"><div><p class="eyebrow">ECOSYSTEM TRANSLATIONS</p><h2>How it appears in code</h2></div><p>These are small orientation snippets. Follow the primary documentation for complete semantics and edge cases.</p></div>
      <div class="ecosystem-docs">${concept.docs.map(([ecosystem,label,url,code,note]) => `
        <article class="ecosystem-doc-card">
          <header class="ecosystem-doc-header"><div><h3>${escapeHtml(ecosystem)}</h3><p>${escapeHtml(label)}</p></div><a href="${escapeAttr(url)}" target="_blank" rel="noreferrer">Official docs ↗</a></header>
          <div class="code-shell"><button class="copy-code" type="button" aria-label="Copy ${escapeAttr(ecosystem)} example">Copy</button><pre>${escapeHtml(code)}</pre></div>
          <p class="ecosystem-note">${escapeHtml(note)}</p>
        </article>`).join("")}</div>
    </section>
    <section class="content-section">
      <div class="content-section-header"><div><p class="eyebrow">RELATED CONCEPTS</p><h2>Continue through the graph</h2></div></div>
      <div class="concept-relations">${concept.related.map(id => `<a href="#concept/${escapeAttr(id)}">${escapeHtml(conceptDefinitions[id]?.title || id)} →</a>`).join("")}</div>
    </section>`;
}

function examplePage(eyebrow, title, lede, kind) {
  const configs = {
    validation: {
      control: `<input id="labInput" type="number" value="17" aria-label="Age to validate" /><button id="runLab" type="button">Validate age</button>`,
      nodes: [["Input","17"],["filterOrElse","age ≥ 18"],["Result","Left<Error>"]],
      note: "A predicate does not return a new value; it decides which Result alternative becomes active.",
      recipe: [["01","Start with a value","The input has no failure context yet."],["02","Validate the success path","filterOrElse preserves valid values and creates an error for invalid ones."],["03","Continue explicitly","map and flatMap run only when the Result is successful."]],
      chips: ["map","flatMap","mapError","match"],
      code: `validateAge(age)\n  .map(createProfile)\n  .mapError(toFieldMessage)`
    },
    parsing: {
      control: `<input id="labInput" type="text" value="42" aria-label="Text to parse" /><button id="runLab" type="button">Parse integer</button>`,
      nodes: [["String","\"42\""],["parseInt","String → Result"],["Result","Right(42)"]],
      note: "Parsing becomes composable once failure is returned as data instead of thrown or hidden.",
      recipe: [["01","Receive untrusted text","The string can represent many things."],["02","Parse into a Result","Failure becomes an explicit alternative."],["03","Validate the number","flatMap can chain range checks without nesting."]],
      chips: ["flatMap","mapError","match"],
      code: `parseInteger(input)\n  .flatMap(requirePositive)\n  .mapError(toInputError)`
    },
    async: {
      control: `<select id="labInput" aria-label="Async scenario"><option value="success">Both requests succeed</option><option value="permissions">Permissions fail</option><option value="user">User fails</option></select><button id="runLab" type="button">Run workflow</button>`,
      nodes: [["Task<Result>","load user"],["zip","combine independent work"],["Task<Result>","UserContext"]],
      note: "zip communicates independence. flatMap would instead say the second request depends on the first value.",
      recipe: [["01","Start independent work","User and permissions can load concurrently."],["02","Combine inside the effect","zip retains async and failure structure."],["03","Render every outcome","match turns the final Result into a view state."]],
      chips: ["map","flatMap","match"],
      code: `zip(loadUser(id), loadPermissions(id))\n  .map(toUserContext)\n  .match(showError, render)`
    }
  };
  const config = configs[kind];
  return `
    <header class="content-hero"><div><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p class="lede">${lede}</p></div><button class="hero-action" data-query="${kind === "validation" ? "mapError" : kind === "parsing" ? "flatMap" : "map"}">Open related shape →</button></header>
    <div class="lab-layout">
      <section class="lab-card"><p class="eyebrow">INTERACTIVE WALKTHROUGH</p><h2>Try the pipeline</h2><p>Change the input, then run the transformation to see which shape becomes active.</p>
        <div class="lab-controls">${config.control}</div>
        <div class="pipeline" id="labPipeline">${config.nodes.map((node,index) => `${index ? '<span class="pipeline-arrow">→</span>' : ''}<div class="pipeline-node ${index === 1 ? "is-active" : ""}" data-lab-node="${index}"><span class="node-shape">${index === 1 ? "ƒ" : index === 2 ? "R" : "A"}</span><strong>${node[0]}</strong><small>${node[1]}</small></div>`).join("")}</div>
        <p class="lab-note" id="labNote">↳ ${config.note}</p>
      </section>
      <aside class="lab-card"><p class="eyebrow">RECIPE</p><h2>Read the structure</h2><div class="recipe-list">${config.recipe.map(([n,title,text]) => `<div class="recipe-step"><span>${n}</span><div><strong>${title}</strong><p>${text}</p></div></div>`).join("")}</div><div class="operation-chips">${config.chips.map(chip => `<button data-query="${chip}">${chip}</button>`).join("")}</div><pre class="sample-code">${config.code}</pre></aside>
    </div>`;
}

function operationForGlossaryTerm(item) {
  const term = (item.operation || item.term).toLowerCase();
  return operations.find(operation => [operation.id, operation.concept, ...operation.aliases].some(name => name.toLowerCase() === term));
}

function renderGlossary() {
  const grid = $("#glossaryGrid");
  if (!grid) return;
  const query = ($("#glossarySearch")?.value || "").trim().toLowerCase();
  const view = $("[data-glossary-view].is-selected")?.dataset.glossaryView || "practical";
  const terms = glossaryTerms.filter(item => !query || [item.term,item.type,item.practical,item.theory].some(value => value.toLowerCase().includes(query)));
  grid.innerHTML = terms.length ? terms.map(item => {
    const operation = operationForGlossaryTerm(item);
    return `<article class="glossary-card ${operation ? "has-example" : ""}">
      <header><h3>${escapeHtml(item.term)}</h3><span class="term-type">${escapeHtml(item.type)}</span></header>
      <p>${escapeHtml(item[view])}</p>
      <div class="glossary-card-footer"><code>${escapeHtml(item.signature)}</code>${operation ? `<button class="glossary-example" type="button" data-query="${escapeAttr(operation.concept)}"><span aria-hidden="true">◆</span> Explore example</button>` : ""}</div>
    </article>`;
  }).join("") : '<div class="empty-state">No matching term yet. Try a concept, structure, behavior, or operation.</div>';
  bindQueryButtons();
}

function bindContentInteractions(route) {
  bindQueryButtons();
  if (route === "concept") {
    $$('.copy-code').forEach(button => button.addEventListener("click", async () => {
      const code = button.closest(".code-shell").querySelector("pre").textContent;
      try {
        await navigator.clipboard.writeText(code);
        button.textContent = "Copied";
        setTimeout(() => { button.textContent = "Copy"; }, 1200);
      } catch {
        button.textContent = "Select";
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(button.closest(".code-shell").querySelector("pre"));
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }));
  }
  if (route === "glossary") {
    $("#glossarySearch").addEventListener("input", renderGlossary);
    $$('[data-glossary-view]').forEach(button => button.addEventListener("click", () => {
      $$('[data-glossary-view]').forEach(x => x.classList.toggle("is-selected", x === button));
      renderGlossary();
    }));
    $$('[data-letter]').forEach(button => button.addEventListener("click", () => {
      $("#glossarySearch").value = button.dataset.letter;
      renderGlossary();
    }));
    renderGlossary();
  }
  if (["validation","parsing","async"].includes(route)) $("#runLab").addEventListener("click", () => runLab(route));
}

function runLab(route) {
  const nodes = $$('[data-lab-node]');
  nodes.forEach(node => node.classList.remove("is-success","is-error"));
  const input = $("#labInput").value;
  const output = nodes[2];
  const outputLabel = output.querySelector("small");
  let success = true;
  if (route === "validation") {
    success = Number(input) >= 18;
    nodes[0].querySelector("small").textContent = input;
    outputLabel.textContent = success ? `Right(${input})` : "Left(Must be 18+)";
  } else if (route === "parsing") {
    success = /^[-+]?\d+$/.test(input.trim());
    nodes[0].querySelector("small").textContent = `"${input}" `;
    outputLabel.textContent = success ? `Right(${Number(input)})` : "Left(Invalid integer)";
  } else {
    success = input === "success";
    outputLabel.textContent = success ? "Right(UserContext)" : input === "user" ? "Left(UserError)" : "Left(PermissionError)";
  }
  output.classList.add(success ? "is-success" : "is-error");
  output.querySelector(".node-shape").textContent = success ? "✓" : "!";
}

function renderRoute() {
  const route = location.hash.replace(/^#/, "") || "explore";
  const conceptId = route.startsWith("concept/") ? route.slice("concept/".length) : null;
  const concept = conceptId ? conceptDefinitions[conceptId] : null;
  const knownRoute = concept ? route : route === "explore" || Object.hasOwn(pageTemplates, route) ? route : "explore";
  const activeNav = concept ? "concepts" : knownRoute;
  $$('[data-route]').forEach(item => item.classList.toggle("is-active", item.dataset.route === activeNav));
  const explore = $("#exploreView");
  const content = $("#contentView");
  const inspector = $(".inspector");
  if (knownRoute === "explore") {
    explore.hidden = false;
    content.hidden = true;
    inspector.hidden = false;
    $(".app-shell").classList.remove("content-mode");
  } else {
    explore.hidden = true;
    inspector.hidden = true;
    $(".app-shell").classList.add("content-mode");
    content.hidden = false;
    content.innerHTML = concept ? conceptPage(concept) : pageTemplates[knownRoute]();
    bindContentInteractions(concept ? "concept" : knownRoute);
  }
  window.scrollTo({ top: 0, behavior: "auto" });
}

window.addEventListener("hashchange", renderRoute);
renderRoute();
