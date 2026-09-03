// The video gate: the featured video on a content page, opt-in per page via
// `gateVideo`.
//
// Three things have to hold. On a page that opts in, the player must NOT mount
// until the visitor is known — asserted on the iframe rather than on the dialog,
// because a gate that renders a form while the video loads behind it has gated
// nothing. A visitor already known from ANY other gate on the site is not asked
// again. And on every other page, which is all of them, the click plays the
// video with no dialog at all.

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
  });

  it("asks for a first name and an email, and nothing else", () => {
    renderPage({ gateVideo: true });
    play();
    expect(screen.getByLabelText("First name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    // The fuller profile belongs on the contact form, not in front of a video.
    expect(screen.queryByLabelText(/Industry/)).toBeNull();
    expect(screen.queryByLabelText(/Department/)).toBeNull();
  });

  it("does not ask a visitor who identified at any other gate on the site", () => {
    // What CalculatorGateDialog, ShareGate and EventActionGate all write.
    localStorage.setItem(
      "etu_lead_identity",
      JSON.stringify({ firstName: "Alex", email: "alex@example.com" }),
    );
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
    expect(screen.queryByText("Watch the replay")).toBeNull();
  });
});
