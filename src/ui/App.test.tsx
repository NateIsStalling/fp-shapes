// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "./App";

afterEach(cleanup);

const renderAt = (path: string) => render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>);

describe("app shell", () => {
  it("opens on traverse with the shape ribbon and the behavior lane", () => {
    renderAt("/");
    expect(screen.getByRole("heading", { level: 1, name: "traverse" })).toBeTruthy();
    expect(screen.getByText(/traverse: List moves inside\. Either is introduced on the outside\./)).toBeTruthy();
    expect(screen.getByText(/f ran on 2 of 4 elements, then stopped at the failure on a₂\. Result: Left\(e₂\)\./)).toBeTruthy();
  });

  it("toggling an element and switching receivers recomputes the result", () => {
    renderAt("/op/traverse");
    fireEvent.click(screen.getByRole("button", { name: /a₂: f fails here/ }));
    fireEvent.click(screen.getByRole("button", { name: /a₄: f fails here/ }));
    expect(screen.getByText(/none failed\. Result: Right\(\[b₁, b₂, b₃, b₄\]\)\./)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /a₁: f succeeds here/ }));
    fireEvent.click(screen.getByRole("button", { name: /a₃: f succeeds here/ }));
    fireEvent.click(screen.getByRole("button", { name: "Validation" }));
    expect(screen.getByText(/All 2 failures are kept\. Result: Failure\(\[e₁, e₃\]\)\./)).toBeTruthy();
    expect(screen.queryByRole("group", { name: "Evaluation" })).toBeNull();
  });

  it("eager evaluation calls f everywhere but keeps the same result", () => {
    renderAt("/op/traverse");
    fireEvent.click(screen.getByRole("button", { name: "Eager" }));
    expect(screen.getByText(/f ran on all 4 elements\. 2 failed, and only the first failure survives\. Result: Left\(e₂\)\./)).toBeTruthy();
  });

  it("other operations render their header; unknown routes fall back", () => {
    renderAt("/op/zip");
    expect(screen.getByRole("heading", { level: 1, name: "zip / map2" })).toBeTruthy();
    cleanup();
    renderAt("/nope");
    expect(screen.getByRole("heading", { level: 1, name: "traverse" })).toBeTruthy();
  });
});
