import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSnippetBySlug } from "../services/snippets";
import type { Snippet } from "../types";
import SnippetDetail from "./SnippetDetail";

vi.mock("../services/snippets", () => ({
  getSnippetBySlug: vi.fn(),
}));

const mockedGetSnippetBySlug = vi.mocked(getSnippetBySlug);

const detailedSnippet: Snippet = {
  id: "snippet-1",
  title: "Smooth Feedback Loops",
  slug: "smooth-feedback-loops",
  excerpt: "A polished snippet preview.",
  category: "Workflow",
  tags: ["SwiftUI"],
  coverImage: "https://example.com/cover.jpg",
  content: `# Notes

## Almost boring state first

Start with the most predictable state you can tolerate.

## Use geometry to do all of the hard work

The layout should come from a single bounded system.

### Derive the radii from one square

That keeps the interaction reusable.

\`\`\`swift
Text("Hello")
\`\`\``,
  code: "Text(\"Source\")",
  prompts: "Keep the action anchored while the state evolves.",
  seoTitle: "Smooth Feedback Loops",
  seoDescription: "SEO copy",
  status: "Published",
  updatedAt: "2026-04-09T12:00:00.000Z",
  publishedAt: "2026-04-09T12:00:00.000Z",
};

function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

const intersectionCallbacks = new Map<Element, IntersectionObserverCallback>();

function mockIntersectionObserver() {
  class MockIntersectionObserver implements IntersectionObserver {
    readonly root = null;
    readonly rootMargin = "";
    readonly thresholds = [0];

    constructor(callback: IntersectionObserverCallback) {
      this.callback = callback;
    }

    private callback: IntersectionObserverCallback;

    disconnect = vi.fn();
    observe = vi.fn((element: Element) => {
      intersectionCallbacks.set(element, this.callback);
    });
    takeRecords = vi.fn(() => []);
    unobserve = vi.fn((element: Element) => {
      intersectionCallbacks.delete(element);
    });
  }

  Object.defineProperty(window, "IntersectionObserver", {
    writable: true,
    configurable: true,
    value: MockIntersectionObserver,
  });
  Object.defineProperty(globalThis, "IntersectionObserver", {
    writable: true,
    configurable: true,
    value: MockIntersectionObserver,
  });
}

function triggerReadingZone(target: Element, isIntersecting: boolean, top = 0) {
  const callback = intersectionCallbacks.get(target);
  if (!callback) {
    throw new Error("IntersectionObserver callback was not registered for the target.");
  }

  act(() => {
    callback(
      [
        {
          isIntersecting,
          target,
          boundingClientRect: { top } as DOMRectReadOnly,
          intersectionRatio: isIntersecting ? 1 : 0,
          intersectionRect: {} as DOMRectReadOnly,
          rootBounds: null,
          time: 0,
        },
      ],
      {} as IntersectionObserver,
    );
  });
}

function HashProbe() {
  const location = useLocation();
  return <output data-testid="location-hash">{location.hash}</output>;
}

function renderSnippetDetail(options?: { initialEntries?: string[]; snippet?: Snippet; isDesktop?: boolean }) {
  const {
    initialEntries = ["/snippets/smooth-feedback-loops"],
    snippet = detailedSnippet,
    isDesktop = true,
  } = options ?? {};

  mockMatchMedia(isDesktop);
  mockedGetSnippetBySlug.mockResolvedValue(snippet);

  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route
          path="/snippets/:slug"
          element={
            <>
              <SnippetDetail />
              <HashProbe />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("SnippetDetail", () => {
  beforeEach(() => {
    mockedGetSnippetBySlug.mockReset();
    Element.prototype.scrollIntoView = vi.fn();
    intersectionCallbacks.clear();
    mockIntersectionObserver();
  });

  it("shows only the first available section on desktop by default", async () => {
    renderSnippetDetail();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Smooth Feedback Loops" })).toBeInTheDocument();
    });

    expect(screen.getByRole("heading", { name: "Implementation Notes" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "SwiftUI Source" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Prompt Logic" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "01 Implementation Notes" })).not.toBeInTheDocument();
    expect(screen.queryByText("Contents")).not.toBeInTheDocument();

    triggerReadingZone(screen.getByTestId("desktop-reading-start"), true);

    const notesButton = await screen.findByRole("button", { name: "01 Implementation Notes" });
    expect(notesButton).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "02 SwiftUI Source" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "03 Prompt Logic" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByText("Contents")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy code block" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copy Swift code" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copy prompt logic" })).not.toBeInTheDocument();

    fireEvent.mouseEnter(notesButton);

    expect(screen.getByText("Contents")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Almost boring state first" })).toBeInTheDocument();
  });

  it("switches desktop panels and syncs the hash", async () => {
    renderSnippetDetail();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Implementation Notes" })).toBeInTheDocument();
    });

    triggerReadingZone(screen.getByTestId("desktop-reading-start"), true);
    fireEvent.click(screen.getByRole("button", { name: "02 SwiftUI Source" }));

    expect(screen.getByRole("heading", { name: "SwiftUI Source" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy Swift code" })).toBeInTheDocument();
    expect(screen.queryByText("Contents")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copy code block" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copy prompt logic" })).not.toBeInTheDocument();
    expect(screen.getByTestId("location-hash")).toHaveTextContent("#code");
  });

  it("restores the requested section from the hash", async () => {
    renderSnippetDetail({ initialEntries: ["/snippets/smooth-feedback-loops#code"] });

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "SwiftUI Source" })).toBeInTheDocument();
    });

    triggerReadingZone(screen.getByTestId("desktop-reading-start"), true);
    expect(screen.getByRole("button", { name: "Copy Swift code" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "02 SwiftUI Source" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("location-hash")).toHaveTextContent("#code");
  });

  it("falls back to the first available section when the hash is invalid", async () => {
    renderSnippetDetail({ initialEntries: ["/snippets/smooth-feedback-loops#missing"] });

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Implementation Notes" })).toBeInTheDocument();
    });

    triggerReadingZone(screen.getByTestId("desktop-reading-start"), true);
    expect(screen.getByRole("button", { name: "01 Implementation Notes" })).toHaveAttribute("aria-pressed", "true");
  });

  it("omits unavailable desktop sections", async () => {
    renderSnippetDetail({
      snippet: {
        ...detailedSnippet,
        code: "",
        prompts: "",
      },
    });

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Implementation Notes" })).toBeInTheDocument();
    });

    triggerReadingZone(screen.getByTestId("desktop-reading-start"), true);
    expect(screen.getByRole("button", { name: "01 Implementation Notes" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "02 SwiftUI Source" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "03 Prompt Logic" })).not.toBeInTheDocument();
  });

  it("hides the contents panel when notes do not contain outline headings", async () => {
    renderSnippetDetail({
      snippet: {
        ...detailedSnippet,
        content: "# Notes\n\nJust one paragraph and no section headings.",
      },
    });

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Implementation Notes" })).toBeInTheDocument();
    });

    triggerReadingZone(screen.getByTestId("desktop-reading-start"), true);
    expect(screen.getByRole("button", { name: "01 Implementation Notes" })).toBeInTheDocument();
    expect(screen.queryByText("Contents")).not.toBeInTheDocument();
  });

  it("scrolls to the matching notes heading from the contents panel", async () => {
    renderSnippetDetail();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Implementation Notes" })).toBeInTheDocument();
    });

    triggerReadingZone(screen.getByTestId("desktop-reading-start"), true);
    fireEvent.mouseEnter(screen.getByRole("button", { name: "01 Implementation Notes" }));

    const targetHeading = screen.getByRole("heading", { name: "Use geometry to do all of the hard work" });
    const scrollIntoView = vi.spyOn(targetHeading, "scrollIntoView");

    fireEvent.click(screen.getByRole("button", { name: "Use geometry to do all of the hard work" }));

    expect(scrollIntoView).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Use geometry to do all of the hard work" })).toHaveAttribute("aria-current", "true");
  });

  it("hides the rail and contents outside the reading zone", async () => {
    renderSnippetDetail();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Implementation Notes" })).toBeInTheDocument();
    });

    triggerReadingZone(screen.getByTestId("desktop-reading-start"), true);
    const notesButton = await screen.findByRole("button", { name: "01 Implementation Notes" });

    fireEvent.mouseEnter(notesButton);
    expect(screen.getByText("Contents")).toBeInTheDocument();

    triggerReadingZone(screen.getByTestId("desktop-reading-end"), true);

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "01 Implementation Notes" })).not.toBeInTheDocument();
      expect(screen.queryByText("Contents")).not.toBeInTheDocument();
    });
  });

  it("keeps all sections visible on mobile", async () => {
    renderSnippetDetail({ isDesktop: false });

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Implementation Notes" })).toBeInTheDocument();
    });

    expect(screen.getByRole("heading", { name: "SwiftUI Source" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Prompt Logic" })).toBeInTheDocument();
    expect(screen.queryByText("Contents")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "01 Implementation Notes" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy Swift code" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy prompt logic" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy code block" })).toBeInTheDocument();
  });
});
