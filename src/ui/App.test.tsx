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
