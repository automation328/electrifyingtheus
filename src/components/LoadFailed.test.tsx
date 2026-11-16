import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ChunkErrorBoundary } from "./LoadFailed";

const Broken = () => {
  throw new Error("Failed to fetch dynamically imported module");
};

describe("ChunkErrorBoundary", () => {
  it("shows the Reload message instead of a blank page when a page fails", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(<ChunkErrorBoundary><Broken /></ChunkErrorBoundary>);
    expect(screen.getByRole("button", { name: "Reload" })).toBeTruthy();
  });

  it("renders the page when nothing fails", () => {
    render(<ChunkErrorBoundary><p>page</p></ChunkErrorBoundary>);
    expect(screen.getByText("page")).toBeTruthy();
  });
});
