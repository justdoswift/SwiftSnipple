import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  deriveLeadCoverThemeFromImageData,
  extractLeadCoverTheme,
} from "./lead-cover-theme";

function createSolidImageData(width: number, height: number, color: [number, number, number]) {
  const data = new Uint8ClampedArray(width * height * 4);

  for (let index = 0; index < width * height; index += 1) {
    const offset = index * 4;
    data[offset] = color[0];
    data[offset + 1] = color[1];
    data[offset + 2] = color[2];
    data[offset + 3] = 255;
  }

  return data;
}

function createSplitImageData(
  width: number,
  height: number,
  leftColor: [number, number, number],
  rightColor: [number, number, number],
) {
  const data = new Uint8ClampedArray(width * height * 4);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      const color = x < width / 2 ? leftColor : rightColor;
      data[offset] = color[0];
      data[offset + 1] = color[1];
      data[offset + 2] = color[2];
      data[offset + 3] = 255;
    }
  }

  return data;
}

describe("lead-cover-theme", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("marks dark imagery as dark tone", () => {
    const theme = deriveLeadCoverThemeFromImageData(createSolidImageData(8, 8, [24, 28, 36]), 8, 8);

    expect(theme.tone).toBe("dark");
    expect(theme.backgroundStart).not.toBe(theme.backgroundEnd);
  });

  it("marks bright imagery as light tone", () => {
    const theme = deriveLeadCoverThemeFromImageData(createSolidImageData(8, 8, [226, 228, 236]), 8, 8);

    expect(theme.tone).toBe("light");
    expect(theme.accent).toContain("rgb(");
  });

  it("keeps left and right gradients distinct for split-color imagery", () => {
    const theme = deriveLeadCoverThemeFromImageData(
      createSplitImageData(10, 6, [42, 92, 166], [232, 178, 82]),
      10,
      6,
    );

    expect(theme.backgroundStart).not.toBe(theme.backgroundEnd);
  });

  it("falls back when the image cannot be sampled", async () => {
    const originalImage = globalThis.Image;

    class BrokenImage {
      crossOrigin = "";
      decoding = "";
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;

      set src(_value: string) {
        queueMicrotask(() => {
          this.onerror?.();
        });
      }
    }

    vi.stubGlobal("Image", BrokenImage as unknown as typeof Image);

    const theme = await extractLeadCoverTheme("https://example.com/broken-cover.jpg");

    expect(theme).toEqual({
      backgroundStart: "rgb(18 18 20)",
      backgroundEnd: "rgb(34 35 38)",
      accent: "rgb(98 102 112)",
      tone: "dark",
    });

    vi.stubGlobal("Image", originalImage);
  });
});
