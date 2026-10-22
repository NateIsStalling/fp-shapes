// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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
  it("traverse: toggling elements and switching receivers recomputes the result", () => {
    renderAt("/");
    expect(screen.getByText(/f ran on 2 of 4 elements, then stopped at the first failure\. Result: Left\(e₂\)\./)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /^a₂: failing/ }));
    fireEvent.click(screen.getByRole("button", { name: /^a₄: failing/ }));
    expect(screen.getByText(/none failed\. Result: Right\(\[b₁, b₂, b₃, b₄\]\)\./)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Validation" }));
    expect(screen.getByText(/All 2 failures are kept\. Result: Failure\(\[e₂, e₄\]\)\./)).toBeTruthy();
    expect(screen.queryByRole("group", { name: "Evaluation" })).toBeNull();
  });

  it("traverse: eager evaluation calls f everywhere but keeps the same result", () => {
    renderAt("/op/traverse");
    fireEvent.click(screen.getByRole("button", { name: "Eager" }));
    expect(screen.getByText(/f ran on all 4 elements\. 2 failed, and only the first failure survives\. Result: Left\(e₂\)\./)).toBeTruthy();
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
