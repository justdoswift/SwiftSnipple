import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AdminCoverCropModal from "./AdminCoverCropModal";
import { COVER_CROP_OUTPUT_HEIGHT, COVER_CROP_OUTPUT_WIDTH, exportCoverCropBlob } from "./cover-crop";

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
  description: "Position the artwork inside the crop frame.",
  zoom: "Zoom",
  reset: "Reset crop",
  confirm: "Crop and upload",
  loading: "Preparing cover...",
  dragHint: "Drag to choose the part of the image that should stay.",
  cancel: "Cancel",
  exportFailed: "Failed to prepare the cropped cover image.",
};

describe("AdminCoverCropModal", () => {
  it("renders the crop frame and updates zoom state", async () => {
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
        viewportSizeOverride={{ width: 600, height: 315 }}
      />,
    );

    expect(await screen.findByTestId("cover-crop-frame")).toBeInTheDocument();
    const image = await screen.findByTestId("cover-crop-image");
    await waitFor(() => {
      expect(image).toHaveAttribute("data-scale", "0.5000");
    });

    fireEvent.change(screen.getByTestId("cover-crop-zoom"), { target: { value: "1.25" } });
    expect(await screen.findByTestId("cover-crop-image")).toHaveAttribute("data-scale", "1.2500");

    fireEvent.click(screen.getByRole("button", { name: "Reset crop" }));
    expect(await screen.findByTestId("cover-crop-image")).toHaveAttribute("data-scale", "0.5000");

    Object.defineProperty(window, "Image", { configurable: true, writable: true, value: originalImage });
  });

  it("exports a 1200x630 crop", async () => {
    const drawImage = vi.fn();
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    const originalToBlob = HTMLCanvasElement.prototype.toBlob;

    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      drawImage,
    })) as unknown as typeof HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.toBlob = vi.fn(function (callback: BlobCallback, type?: string) {
      expect((this as HTMLCanvasElement).width).toBe(COVER_CROP_OUTPUT_WIDTH);
      expect((this as HTMLCanvasElement).height).toBe(COVER_CROP_OUTPUT_HEIGHT);
      callback(new Blob(["cropped"], { type: type ?? "image/webp" }));
    });

    const image = document.createElement("img");
    const blob = await exportCoverCropBlob({
      image,
      imageSize: { width: 1600, height: 900 },
      viewport: { width: 600, height: 315 },
      transform: { scale: 0.39375, offsetX: 0, offsetY: 0 },
    });

    expect(blob.type).toBe("image/webp");
    expect(drawImage).toHaveBeenCalledTimes(1);

    HTMLCanvasElement.prototype.getContext = originalGetContext;
    HTMLCanvasElement.prototype.toBlob = originalToBlob;
  });
});
