// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { operationGroups } from "../catalog/operations";
import { App } from "./App";

afterEach(cleanup);

const renderAt = (path: string) => render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>);

describe("every operation page renders from data", () => {
  for (const op of operationGroups.flatMap((g) => g.operations)) {
    it(`${op.id}: header, shape ribbon and behavior lane`, () => {
      const { container } = renderAt(`/op/${op.id}`);
      expect(screen.getByRole("heading", { level: 1, name: op.name })).toBeTruthy();
      expect(container.querySelector(".ribbon-caption")?.textContent).toMatch(new RegExp(`^${op.name}: `));
      expect(container.querySelector(".lane-caption")?.textContent?.length).toBeGreaterThan(10);
    });
  }
});

describe("interaction", () => {
  const pick = (group: string, option: RegExp) => fireEvent.click(within(screen.getByRole("group", { name: group })).getByRole("radio", { name: option }));

  it("traverse: each slot is a radio group; moving pieces recomputes the result", () => {
    renderAt("/");
    expect(screen.getByText(/f was called on 2 of 4 elements, then it stopped at the first failure\. Result: Left\(e₂\)\./)).toBeTruthy();
    expect((within(screen.getByRole("group", { name: "f(a₂) returns" })).getByRole("radio", { name: /Left/ }) as HTMLInputElement).checked).toBe(true);
    pick("f(a₂) returns", /Right/);
    pick("f(a₄) returns", /Right/);
    expect(screen.getByText(/f succeeded on all 4 elements\. Result: Right\(\[b₁, b₂, b₃, b₄\]\)\./)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Validation" }));
    expect(screen.getByText(/All 2 failures are kept\. Result: Failure\(\[e₂, e₄\]\)\./)).toBeTruthy();
    expect(screen.queryByRole("group", { name: "Evaluation" })).toBeNull();
  });

  it("traverse: eager evaluation calls f everywhere but keeps the same result", () => {
    renderAt("/op/traverse");
    fireEvent.click(screen.getByRole("button", { name: "Eager" }));
    expect(screen.getByText(/f was called on all 4 elements\. 2 failed, and only the first failure survives\. Result: Left\(e₂\)\./)).toBeTruthy();
  });

  it("flatten: the outer slot holds the inner slot, and both can be changed", () => {
    renderAt("/op/flatten");
    pick("inner Either", /Left/);
    expect(screen.getByText(/the inner value comes out as it is/)).toBeTruthy();
    pick("outer Either", /Left e₁/);
    expect(screen.getByText(/The outer Left becomes the result\./)).toBeTruthy();
  });

  it("zip: switching to the positional receiver drops the unmatched element", () => {
    renderAt("/op/zip");
    fireEvent.click(screen.getByRole("button", { name: "List (positional)" }));
    expect(screen.getByText(/the extra 3 is dropped/)).toBeTruthy();
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
    expect(screen.getByRole("heading", { level: 2, name: "Shape: which layers move?" })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2, name: "Behavior: what runs, and what comes out?" })).toBeTruthy();
    expect(screen.getByText("Ecosystems: what is it called here?")).toBeTruthy();
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
