// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { operationGroups, operationsById } from "../catalog/operations";
import { App } from "./App";

afterEach(cleanup);

const renderAt = (path: string) => render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>);

describe("every operation page renders from data", () => {
  afterEach(() => localStorage.clear());
  for (const op of operationGroups.flatMap((g) => g.operations)) {
    it(`${op.id}: header, shape ribbon and behavior lane`, () => {
      if (operationsById.get(op.id)?.preview) localStorage.setItem("fp-shapes-preview", "on");
      const { container } = renderAt(`/op/${op.id}`);
      expect(screen.getByRole("heading", { level: 1, name: op.name })).toBeTruthy();
      expect(container.querySelector(".ribbon-caption")?.textContent).toMatch(new RegExp(`^${op.name}: `));
      expect(container.querySelector(".lane-caption")?.textContent?.length).toBeGreaterThan(10);
      for (const el of container.querySelectorAll(".lane-caption, .ribbon-caption, .note, .muted")) expect(el.textContent).not.toContain("`");
    });
  }
});

describe("interaction", () => {
  // Captions mix text and code tokens, so match on the whole caption text.
  const caption = () => document.querySelector(".lane-caption")?.textContent ?? "";
  const pick = (group: string, option: RegExp) => fireEvent.click(within(screen.getByRole("group", { name: group })).getByRole("radio", { name: option }));

  it("traverse: each slot is a radio group; moving pieces recomputes the result", () => {
    renderAt("/");
    expect(caption()).toMatch(/f was called on 2 of 4 elements, then it stopped at the first failure\. Result: Left\(e₂\)\./);
    expect((within(screen.getByRole("group", { name: "f(a₂)" })).getByRole("radio", { name: /Left/ }) as HTMLInputElement).checked).toBe(true);
    pick("f(a₂)", /Right/);
    pick("f(a₄)", /Right/);
    expect(caption()).toMatch(/f succeeded on all 4 elements\. Result: Right\(\[b₁, b₂, b₃, b₄\]\)\./);
    fireEvent.click(screen.getByRole("button", { name: "Validation" }));
    expect(caption()).toMatch(/All 2 failures are kept\. Result: Failure\(\[e₂, e₄\]\)\./);
    expect(screen.queryByRole("group", { name: "Evaluation" })).toBeNull();
  });

  it("traverse: eager evaluation calls f everywhere but keeps the same result", () => {
    renderAt("/op/traverse");
    fireEvent.click(screen.getByRole("button", { name: "Eager" }));
    expect(caption()).toMatch(/f was called on all 4 elements\. 2 failed, and only the first failure survives\. Result: Left\(e₂\)\./);
  });

  it("flatten: the outer slot holds the inner slot, and both can be changed", () => {
    renderAt("/op/flatten");
    pick("inner Either", /Left/);
    expect(caption()).toMatch(/the inner value comes out as it is/);
    pick("outer Either", /Left e₁/);
    expect(caption()).toMatch(/The outer Left becomes the result\./);
  });

  it("zip: switching to the positional receiver drops the unmatched element", () => {
    renderAt("/op/zip");
    fireEvent.click(screen.getByRole("button", { name: "List (positional)" }));
    expect(caption()).toMatch(/the extra 3 is dropped/);
  });

  it("zip: the two inputs are one tuple argument, drawn in one Tuple box", () => {
    renderAt("/op/zip");
    const tuple = screen.getByRole("group", { name: "Tuple" });
    expect(within(tuple).getByRole("group", { name: "first Either" })).toBeTruthy();
    expect(within(tuple).getByRole("group", { name: "second Either" })).toBeTruthy();
  });

  it("captions render code tokens as code", () => {
    renderAt("/op/traverse");
    const tokens = [...document.querySelectorAll(".lane-caption code.tok")].map((c) => c.textContent);
    expect(tokens).toContain("f");
    expect(tokens).toContain("Left(e₂)");
    expect(document.querySelector(".lane-caption")?.textContent).not.toContain("`");
  });

  it("unknown routes fall back to traverse", () => {
    renderAt("/nope");
    expect(screen.getByRole("heading", { level: 1, name: "traverse" })).toBeTruthy();
  });
});

describe("navigation", () => {
  it("links to the repository on GitHub", () => {
    renderAt("/");
    const link = screen.getByRole("link", { name: /GitHub/ });
    expect(link.getAttribute("href")).toBe("https://github.com/NateIsStalling/fp-shapes");
    expect(link.getAttribute("target")).toBe("_blank");
  });
});

describe("section headings", () => {
  it("name the three parts of every operation page", () => {
    renderAt("/op/traverse");
    expect(screen.getByRole("heading", { level: 2, name: "Shape" })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2, name: "Behavior" })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2, name: "Ecosystems" })).toBeTruthy();
  });
});

describe("page header", () => {
  it("has a breadcrumb, keeps the abstraction next to the signature, and puts the receiver in the title bar", () => {
    const { container } = renderAt("/op/traverse");
    expect(screen.getByRole("navigation", { name: "Breadcrumb" }).textContent).toBe("OperationsTraversing");
    expect(container.querySelector(".op-shape .abstraction-tag")?.textContent).toBe("abstractionTraversable");
    expect(container.querySelector('header.title-bar [aria-label="Receiver: F"]')).toBeTruthy();
  });
});

describe("shape ribbon", () => {
  it("draws a Tuple's payload as one ball per part, inside a tuple layer", () => {
    const { container } = renderAt("/op/bimap");
    fireEvent.click(screen.getByRole("button", { name: "Tuple" }));
    const before = container.querySelector(".ribbon-grid .ribbon-col .layer-tuple");
    expect(before).toBeTruthy();
    expect([...(before?.querySelectorAll(".ball") ?? [])].map((b) => b.textContent)).toEqual(["A", "X"]);
  });
});

describe("samples in the names panel", () => {
  it("show a language chip and copy the code", async () => {
    const writes: string[] = [];
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async (s: string) => void writes.push(s) } });
    const { container } = renderAt("/op/map");
    const chips = [...container.querySelectorAll(".lang-chip")].map((c) => c.textContent);
    expect(chips).toEqual(expect.arrayContaining(["C#", "TypeScript"]));
    fireEvent.click(screen.getByRole("button", { name: "Copy C# sample" }));
    await screen.findByText("Copied");
    expect(writes[0]).toContain("input.Map(x => x * 10)");
  });
});

describe("title bar and theme", () => {
  it("the title bar spans the page, outside the main column", () => {
    const { container } = renderAt("/op/map");
    const bar = container.querySelector("header.title-bar");
    expect(bar?.querySelector("h1")?.textContent).toBe("map");
    expect(bar?.closest("main")).toBeNull();
  });

  it("the theme control shows its state and remembers the choice", () => {
    document.documentElement.removeAttribute("data-theme");
    localStorage.clear();
    renderAt("/op/map");
    const group = screen.getByRole("group", { name: "Theme" });
    const radio = (name: string) => within(group).getByRole("radio", { name }) as HTMLInputElement;
    expect(radio("Auto").checked).toBe(true);
    fireEvent.click(radio("Dark"));
    expect(radio("Dark").checked).toBe(true);
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(localStorage.getItem("fp-shapes-theme")).toBe("dark");
    fireEvent.click(radio("Light"));
    expect(document.documentElement.dataset.theme).toBe("light");
    fireEvent.click(radio("Auto"));
    expect(document.documentElement.dataset.theme).toBeUndefined();
    expect(localStorage.getItem("fp-shapes-theme")).toBeNull();
  });
});

describe("app chrome", () => {
  it("has a full-width app bar with the name and tagline, and puts the theme toggle beside GitHub", () => {
    const { container } = renderAt("/op/map");
    const bar = container.querySelector("header.app-bar");
    expect(bar?.textContent).toContain("FP Shapes");
    expect(bar?.textContent).toContain("Interactive diagrams of functional programming operations");
    expect(bar?.closest("nav")).toBeNull();
    const foot = container.querySelector(".sidebar-foot");
    expect(foot?.querySelector(".github-badge")).toBeTruthy();
    expect(foot?.querySelector(".theme-switch")).toBeTruthy();
  });
});

describe("receiver fills in the type variable", () => {
  it("labels the control with the signature's variable and shows the filled-in signature", () => {
    const { container } = renderAt("/op/traverse");
    expect([...container.querySelectorAll(".op-signature .type-var")].map((n) => n.textContent)).toEqual(["F", "F"]);
    expect(container.querySelector(".receiver-label")?.textContent).toBe("F =");
    const concrete = () => container.querySelector(".op-signature-concrete")?.textContent;
    expect(concrete()).toContain("(A → Either<B>) → List<A> → Either<List<B>>");
    expect([...container.querySelectorAll(".op-signature-concrete .bound-type")].map((n) => n.textContent)).toEqual(["Either", "Either"]);
    fireEvent.click(screen.getByRole("button", { name: "Option" }));
    expect(concrete()).toContain("(A → Option<B>) → List<A> → Option<List<B>>");
  });
  it("two-sided types use P, and receivers with different shapes give their own signature", () => {
    const { container } = renderAt("/op/getOrElse");
    fireEvent.click(screen.getByRole("button", { name: "Option · constant" }));
    expect(container.querySelector(".op-signature-concrete")?.textContent).toContain("A → Option<A> → A");
    cleanup();
    const second = renderAt("/op/bimap");
    expect(second.container.querySelector(".receiver-label")?.textContent).toBe("P =");
  });
});

describe("shape ribbon draws sum types as their cases", () => {
  it("Either shows Left and Right; map changes only the Right payload", () => {
    const { container } = renderAt("/op/map");
    const sums = [...container.querySelectorAll(".ribbon-grid .sum")];
    expect(sums.map((s) => s.getAttribute("aria-label"))).toEqual(["Either: one of Left or Right", "Either: one of Left or Right"]);
    const caseBalls = (sum: Element) => [...sum.querySelectorAll(".case")].map((c) => [c.querySelector(".case-name")?.textContent, c.querySelector(".ball")?.textContent]);
    expect(caseBalls(sums[0] as Element)).toEqual([["Left", "E"], ["Right", "A"]]);
    expect(caseBalls(sums[1] as Element)).toEqual([["Left", "E"], ["Right", "B"]]);
  });
  it("Option shows None and Some, failure first like the other sum types", () => {
    const { container } = renderAt("/op/map");
    fireEvent.click(screen.getByRole("button", { name: "Option" }));
    const names = [...container.querySelectorAll(".ribbon-grid .sum")[0]?.querySelectorAll(".case-name") ?? []].map((n) => n.textContent);
    expect(names).toEqual(["None", "Some"]);
  });
});

describe("preview", () => {
  afterEach(() => localStorage.clear());
  const toggle = () => screen.getByRole("switch", { name: "Preview" });

  it("is off by default, with no banner", () => {
    renderAt("/");
    expect(toggle().getAttribute("aria-checked")).toBe("false");
    expect(screen.queryByText(/under review and may not be accurate/)).toBeNull();
  });

  it("asks for confirmation; cancel leaves it off", () => {
    renderAt("/");
    fireEvent.click(toggle());
    const dialog = screen.getByRole("alertdialog", { name: "Show preview content?" });
    expect(dialog.textContent).toMatch(/under review and may not be accurate/);
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(toggle().getAttribute("aria-checked")).toBe("false");
  });

  it("Escape cancels the confirmation", () => {
    renderAt("/");
    fireEvent.click(toggle());
    fireEvent.keyDown(screen.getByRole("alertdialog"), { key: "Escape" });
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(toggle().getAttribute("aria-checked")).toBe("false");
  });

  it("confirming turns it on, shows the banner and remembers the choice; turning off needs no confirmation", () => {
    renderAt("/");
    fireEvent.click(toggle());
    fireEvent.click(screen.getByRole("button", { name: "Show preview" }));
    expect(toggle().getAttribute("aria-checked")).toBe("true");
    expect(screen.getByRole("status").textContent).toMatch(/Preview on\. Preview content is under review and may not be accurate\./);
    cleanup();
    renderAt("/");
    expect(toggle().getAttribute("aria-checked")).toBe("true");
    fireEvent.click(toggle());
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
  });
});

describe("preview operations", () => {
  afterEach(() => localStorage.clear());
  const nav = () => screen.getByRole("navigation", { name: "Primary" });

  it("Constructors is a preview group", () => {
    expect(operationGroups.find((g) => g.name === "Constructors")?.preview).toBe(true);
  });

  it("are hidden from the sidebar and their routes fall back to the default when Preview is off", () => {
    renderAt("/op/pure");
    expect(screen.getByRole("heading", { level: 1, name: "traverse" })).toBeTruthy();
    expect(within(nav()).queryByText("Constructors")).toBeNull();
    expect(within(nav()).queryByRole("link", { name: "pure" })).toBeNull();
  });

  it("appear in the sidebar, tagged preview, and render when Preview is on", () => {
    localStorage.setItem("fp-shapes-preview", "on");
    renderAt("/op/pure");
    expect(screen.getByRole("heading", { level: 1, name: "pure" })).toBeTruthy();
    expect(within(nav()).getByText("Constructors").textContent).toBe("Constructorspreview");
    expect(within(nav()).getByRole("link", { name: "pure" })).toBeTruthy();
  });

  it("turning Preview off on a preview page falls back to the default", () => {
    localStorage.setItem("fp-shapes-preview", "on");
    renderAt("/op/pure");
    fireEvent.click(screen.getByRole("switch", { name: "Preview" }));
    expect(screen.getByRole("heading", { level: 1, name: "traverse" })).toBeTruthy();
  });
});
