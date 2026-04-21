import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AdminCoverCropModal from "./AdminCoverCropModal";
import {
  clampCoverCropTransform,
  COVER_CROP_OUTPUT_HEIGHT,
  COVER_CROP_OUTPUT_WIDTH,
  exportCoverCropBlob,
  getCoverCropFrame,
  getCoverCropMinScale,
  getStableCoverCropViewport,
} from "./cover-crop";

class MockLoadedImage {
  height = 630;
  naturalHeight = 630;
  naturalWidth = 1200;
  onerror: null | (() => void) = null;
  onload: null | (() => void) = null;
  width = 1200;

  set src(_value: string) {
    queueMicrotask(() => {
      this.onload?.();
    });
  }
}

const copy = {
  eyebrow: "Cover",
  title: "Crop cover image",
  description: "Drag or zoom the image until it fully covers the fixed 1200×630 cover area before uploading.",
  zoom: "Zoom",
  reset: "Reset crop",
  confirm: "Crop and upload",
  loading: "Preparing cover...",
  dragHint: "Drag or zoom the image so it fully covers the fixed 1200×630 cover area.",
  cancel: "Cancel",
  exportFailed: "Failed to prepare the cropped cover image.",
};

describe("AdminCoverCropModal", () => {
  it("initializes the image to fully cover the crop frame before any dragging", async () => {
    const originalImage = window.Image;
    Object.defineProperty(window, "Image", { configurable: true, writable: true, value: MockLoadedImage });

    render(
      <AdminCoverCropModal
        isOpen
        source={{
          file: new File(["cover"], "cover.png", { type: "image/png" }),
          objectUrl: "blob:cover-preview",
        }}
        error=""
        isSubmitting={false}
        copy={copy}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        viewportSizeOverride={{ width: 1000, height: 700 }}
      />,
    );

    const workspace = await screen.findByTestId("cover-crop-workspace");
    const editor = await screen.findByTestId("cover-crop-editor");
    const panel = await screen.findByTestId("cover-crop-panel");
    const frame = await screen.findByTestId("cover-crop-frame");
    const image = await screen.findByTestId("cover-crop-image");
    const meta = await screen.findByTestId("cover-crop-meta");
    const toolbar = await screen.findByTestId("cover-crop-toolbar");

    expect(workspace).toBeInTheDocument();
    expect(editor).toContainElement(panel);
    expect(editor).toContainElement(meta);
    expect(panel).toContainElement(frame);
    expect(panel).toContainElement(toolbar);
    expect(panel).not.toContainElement(meta);
    expect(frame.contains(meta)).toBe(false);
    expect(meta).toHaveTextContent(copy.dragHint);
    await waitFor(() => {
      expect(image).toHaveAttribute("data-scale", "0.7933");
      expect(image).toHaveAttribute("data-rendered-width", "952.00");
      expect(image).toHaveAttribute("data-rendered-height", "499.80");
      expect(frame).toHaveAttribute("data-width", "952.00");
      expect(frame).toHaveAttribute("data-height", "499.80");
      expect(image).toHaveAttribute("data-left", "24.00");
      expect(image).toHaveAttribute("data-top", "100.10");
    });

    Object.defineProperty(window, "Image", { configurable: true, writable: true, value: originalImage });
  });

  it("keeps the crop mask fixed while zooming and dragging the image beneath it", async () => {
    const originalImage = window.Image;
    const originalSetPointerCapture = HTMLElement.prototype.setPointerCapture;
    const originalHasPointerCapture = HTMLElement.prototype.hasPointerCapture;
    const originalReleasePointerCapture = HTMLElement.prototype.releasePointerCapture;
    Object.defineProperty(window, "Image", { configurable: true, writable: true, value: MockLoadedImage });
    HTMLElement.prototype.setPointerCapture = vi.fn();
    HTMLElement.prototype.hasPointerCapture = vi.fn(() => true);
    HTMLElement.prototype.releasePointerCapture = vi.fn();

    render(
      <AdminCoverCropModal
        isOpen
        source={{
          file: new File(["cover"], "cover.png", { type: "image/png" }),
          objectUrl: "blob:cover-preview",
        }}
        error=""
        isSubmitting={false}
        copy={copy}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        viewportSizeOverride={{ width: 1000, height: 700 }}
      />,
    );

    const workspace = await screen.findByTestId("cover-crop-workspace");
    const frame = await screen.findByTestId("cover-crop-frame");
    const image = await screen.findByTestId("cover-crop-image");
    const frameLeft = frame.getAttribute("data-left");
    const frameTop = frame.getAttribute("data-top");
    const frameWidth = frame.getAttribute("data-width");
    const frameHeight = frame.getAttribute("data-height");

    fireEvent.change(screen.getByTestId("cover-crop-zoom"), { target: { value: "1.25" } });

    await waitFor(() => {
      expect(image).toHaveAttribute("data-scale", "1.2500");
      expect(frame).toHaveAttribute("data-left", frameLeft ?? "");
      expect(frame).toHaveAttribute("data-top", frameTop ?? "");
      expect(frame).toHaveAttribute("data-width", frameWidth ?? "");
      expect(frame).toHaveAttribute("data-height", frameHeight ?? "");
    });

    const beforeDragLeft = image.getAttribute("data-left");
    fireEvent.pointerDown(workspace, { pointerId: 1, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(workspace, { pointerId: 1, clientX: 140, clientY: 125 });
    fireEvent.pointerUp(workspace, { pointerId: 1, clientX: 140, clientY: 125 });

    await waitFor(() => {
      expect(image.getAttribute("data-left")).not.toBe(beforeDragLeft);
      expect(frame).toHaveAttribute("data-left", frameLeft ?? "");
      expect(frame).toHaveAttribute("data-top", frameTop ?? "");
    });

    Object.defineProperty(window, "Image", { configurable: true, writable: true, value: originalImage });
    HTMLElement.prototype.setPointerCapture = originalSetPointerCapture;
    HTMLElement.prototype.hasPointerCapture = originalHasPointerCapture;
    HTMLElement.prototype.releasePointerCapture = originalReleasePointerCapture;
  });

  it("recomputes the fixed 1200:630 mask when the workspace changes", async () => {
    const originalImage = window.Image;
    Object.defineProperty(window, "Image", { configurable: true, writable: true, value: MockLoadedImage });

    const { rerender } = render(
      <AdminCoverCropModal
        isOpen
        source={{
          file: new File(["cover"], "cover.png", { type: "image/png" }),
          objectUrl: "blob:cover-preview",
        }}
        error=""
        isSubmitting={false}
        copy={copy}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        viewportSizeOverride={{ width: 960, height: 700 }}
      />,
    );

    const frame = await screen.findByTestId("cover-crop-frame");
    const image = await screen.findByTestId("cover-crop-image");
    await waitFor(() => {
      expect(frame).toHaveAttribute("data-width", "912.00");
      expect(frame).toHaveAttribute("data-height", "478.80");
      expect(image).toHaveAttribute("data-scale", "0.7600");
    });

    rerender(
      <AdminCoverCropModal
        isOpen
        source={{
          file: new File(["cover"], "cover.png", { type: "image/png" }),
          objectUrl: "blob:cover-preview",
        }}
        error=""
        isSubmitting={false}
        copy={copy}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        viewportSizeOverride={{ width: 1400, height: 700 }}
      />,
    );

    await waitFor(() => {
      expect(frame).toHaveAttribute("data-width", "1100.00");
      expect(frame).toHaveAttribute("data-height", "577.50");
      expect(image).toHaveAttribute("data-scale", "0.9167");
    });

    Object.defineProperty(window, "Image", { configurable: true, writable: true, value: originalImage });
  });

  it("keeps the crop workspace usable in shorter viewports without relying on body scrolling", async () => {
    const originalImage = window.Image;
    Object.defineProperty(window, "Image", { configurable: true, writable: true, value: MockLoadedImage });

    render(
      <AdminCoverCropModal
        isOpen
        source={{
          file: new File(["cover"], "cover.png", { type: "image/png" }),
          objectUrl: "blob:cover-preview",
        }}
        error=""
        isSubmitting={false}
        copy={copy}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        viewportSizeOverride={{ width: 1000, height: 560 }}
      />,
    );

    const body = await screen.findByTestId("cover-crop-body");
    const frame = await screen.findByTestId("cover-crop-frame");
    const image = await screen.findByTestId("cover-crop-image");

    expect(body).toHaveClass("admin-cover-crop-body");
    await waitFor(() => {
      expect(image).toHaveAttribute("data-scale", "0.7933");
      expect(frame).toHaveAttribute("data-width", "952.00");
      expect(frame).toHaveAttribute("data-height", "499.80");
    });

    expect(Number(frame.getAttribute("data-height"))).toBeLessThan(560);

    Object.defineProperty(window, "Image", { configurable: true, writable: true, value: originalImage });
  });

  it("uses the crop frame to determine the minimum scale and drag bounds", () => {
    const workspace = { width: 1000, height: 700 };
    const cropRect = getCoverCropFrame(workspace);
    const imageSize = { width: 1200, height: 630 };

    expect(getCoverCropMinScale(imageSize, workspace, cropRect)).toBeCloseTo(0.7933, 4);

    const clamped = clampCoverCropTransform(
      { scale: 0.6, offsetX: 400, offsetY: -400 },
      imageSize,
      workspace,
      cropRect,
    );

    expect(clamped.scale).toBeCloseTo(0.7933, 4);
    expect(clamped.offsetX).toBeCloseTo(0, 4);
    expect(clamped.offsetY).toBeCloseTo(0, 4);
  });

  it("keeps the toolbar, stage, and hint inside one editor card", async () => {
    const originalImage = window.Image;
    Object.defineProperty(window, "Image", { configurable: true, writable: true, value: MockLoadedImage });

    render(
      <AdminCoverCropModal
        isOpen
        source={{
          file: new File(["cover"], "cover.png", { type: "image/png" }),
          objectUrl: "blob:cover-preview",
        }}
        error=""
        isSubmitting={false}
        copy={copy}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        viewportSizeOverride={{ width: 1000, height: 700 }}
      />,
    );

    const editor = await screen.findByTestId("cover-crop-editor");
    const panel = await screen.findByTestId("cover-crop-panel");
    const toolbar = await screen.findByTestId("cover-crop-toolbar");
    const frame = await screen.findByTestId("cover-crop-frame");
    const meta = await screen.findByTestId("cover-crop-meta");
    const zoom = await screen.findByTestId("cover-crop-zoom");

    expect(editor).toContainElement(panel);
    expect(editor).toContainElement(meta);
    expect(panel).toContainElement(toolbar);
    expect(panel).toContainElement(frame);
    expect(panel).not.toContainElement(meta);
    expect(toolbar).toContainElement(zoom);
    expect(meta).toHaveTextContent(copy.dragHint);

    Object.defineProperty(window, "Image", { configurable: true, writable: true, value: originalImage });
  });

  it("falls back to a stable 1200:630 workspace when height is missing", () => {
    expect(getStableCoverCropViewport(1100, 0)).toEqual({
      width: 1100,
      height: 577.5,
    });
  });

  it("clamps the transform before export so the cover always fills the output", async () => {
    const clearRect = vi.fn();
    const drawImage = vi.fn();
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    const originalToBlob = HTMLCanvasElement.prototype.toBlob;

    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      clearRect,
      drawImage,
    })) as unknown as typeof HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.toBlob = vi.fn(function (callback: BlobCallback, type?: string) {
      expect((this as HTMLCanvasElement).width).toBe(COVER_CROP_OUTPUT_WIDTH);
      expect((this as HTMLCanvasElement).height).toBe(COVER_CROP_OUTPUT_HEIGHT);
      callback(new Blob(["cropped"], { type: type ?? "image/webp" }));
    });

    const workspace = { width: 1000, height: 700 };
    const cropRect = getCoverCropFrame(workspace);
    const image = document.createElement("img");
    const blob = await exportCoverCropBlob({
      image,
      imageSize: { width: 400, height: 200 },
      workspace,
      cropRect,
      transform: { scale: 1, offsetX: 0, offsetY: 0 },
    });

    expect(blob.type).toBe("image/webp");
    expect(clearRect).toHaveBeenCalledWith(0, 0, COVER_CROP_OUTPUT_WIDTH, COVER_CROP_OUTPUT_HEIGHT);
    expect(drawImage).toHaveBeenCalledTimes(1);
    expect(drawImage.mock.calls[0]?.[5]).toBeCloseTo(0, 4);
    expect(drawImage.mock.calls[0]?.[6]).toBeCloseTo(0, 4);
    expect(drawImage.mock.calls[0]?.[7]).toBeCloseTo(COVER_CROP_OUTPUT_WIDTH, 4);
    expect(drawImage.mock.calls[0]?.[8]).toBeCloseTo(COVER_CROP_OUTPUT_HEIGHT, 4);

    HTMLCanvasElement.prototype.getContext = originalGetContext;
    HTMLCanvasElement.prototype.toBlob = originalToBlob;
  });
});
