// The video gate, tested where it now lives: the featured video on a content
// page, opt-in per page via `gateVideo`.
//
// Two things have to hold, and they pull in opposite directions. On a page that
// opts in, the player must NOT mount until the profile is given — asserting on
// the iframe rather than on the dialog, because a gate that renders a form while
// the video loads behind it has gated nothing. On every other page, which is all
// of them, the click must still play the video with no dialog at all.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PlayCircle } from "lucide-react";
import ContentPageLayout from "@/components/ContentPageLayout";

vi.mock("@/components/Navbar", () => ({ default: () => <nav /> }));
vi.mock("@/components/Footer", () => ({ default: () => <footer /> }));

const VIDEO = { youtubeId: "_HRXa3hjlec", title: "Webinar Series Part 2" };

const renderPage = (extra: Record<string, unknown> = {}) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <ContentPageLayout
          badge="" title="Replay" highlight="" intro="Intro"
          icon={PlayCircle} sections={[]} video={VIDEO} hideMeta hideCta
          {...extra}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

const play = () => fireEvent.click(screen.getByLabelText(`Play video: ${VIDEO.title}`));
const player = () => document.querySelector("iframe");

beforeEach(() => { localStorage.clear(); window.scrollTo = () => {}; });
afterEach(() => { cleanup(); localStorage.clear(); vi.restoreAllMocks(); });

describe("a page that opts into the gate", () => {
  it("does not load the player when a new visitor clicks play", () => {
    renderPage({ gateVideo: true });
    play();
    expect(player()).toBeNull();
  });

  it("asks for the visitor's details instead", () => {
    renderPage({ gateVideo: true });
    play();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText(/Industry/)).toBeInTheDocument();
  });

  it("plays straight away for a visitor who already gave them", () => {
    localStorage.setItem("etu_video_access", "1");
    renderPage({ gateVideo: true });
    play();
    expect(player()).not.toBeNull();
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

describe("every other content page", () => {
  it("plays on click, with no gate", () => {
    renderPage();
    play();
    expect(player()).not.toBeNull();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders no gate dialog at all, even closed", () => {
    // The dialog is only mounted for a page that opted in, so an unrelated page
    // carries none of its markup.
    renderPage();
    expect(screen.queryByText("Watch the video")).toBeNull();
  });
});
