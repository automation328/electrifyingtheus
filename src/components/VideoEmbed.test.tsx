// The video gate, tested at the point that matters: the player must not mount
// until the visitor has given us the profile.
//
// Asserting on the iframe/<video> element rather than on the dialog is the
// point — a gate that renders a form but loads the video behind it has gated
// nothing. The self-hosted case is tested separately because it is a different
// element (<video src>) reached by a different branch.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import VideoEmbed from "@/components/VideoEmbed";

const renderEmbed = (props: Record<string, unknown> = {}) =>
  render(
    <MemoryRouter>
      <VideoEmbed title="Why I switched" provider="youtube" id="abc123" {...props} />
    </MemoryRouter>,
  );

const play = () => fireEvent.click(screen.getByLabelText("Play video: Why I switched"));
const player = () => document.querySelector("iframe, video");

beforeEach(() => localStorage.clear());
afterEach(() => { cleanup(); localStorage.clear(); vi.restoreAllMocks(); });

describe("video gate", () => {
  it("does not load the player when a new visitor clicks play", () => {
    renderEmbed();
    play();
    expect(player()).toBeNull();
  });

  it("asks for the visitor's details instead", () => {
    renderEmbed();
    play();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText(/Industry/)).toBeInTheDocument();
  });

  it("loads the player for a visitor who already gave them", () => {
    localStorage.setItem("etu_video_access", "1");
    renderEmbed();
    play();
    expect(player()).not.toBeNull();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("gates a self-hosted video too, not just embeds", () => {
    renderEmbed({ provider: "file", id: undefined, src: "/media/testimonial-1.mp4" });
    play();
    expect(document.querySelector("video")).toBeNull();
  });

  it("forgets a failed attempt when the gate is reopened", async () => {
    // One dialog instance serves the whole page. Without a reset, the next video
    // opens showing the last video's error and half-typed answers.
    renderEmbed();
    play();
    fireEvent.change(screen.getByLabelText(/First name/), { target: { value: "Alex" } });
    fireEvent.click(screen.getByRole("button", { name: /Watch now/ }));
    expect(await screen.findByText(/Please fill in: Last name/)).toBeInTheDocument();

    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

    play();
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.queryByText(/Please fill in: Last name/)).toBeNull();
    expect(screen.getByLabelText(/First name/)).toHaveValue("");
  });

  it("leaves a card that links to its own page alone", () => {
    // The webinar card navigates instead of playing, so there is nothing to gate
    // here — the page it lands on carries its own player.
    renderEmbed({ href: "/from-pump-to-plug-part-2" });
    const link = screen.getByLabelText("Watch: Why I switched");
    expect(link).toHaveAttribute("href", "/from-pump-to-plug-part-2");
    expect(screen.queryByLabelText("Play video: Why I switched")).toBeNull();
  });
});
