import { useEffect, useState } from "react";

export type LeadCoverTone = "light" | "dark";

export interface LeadCoverTheme {
  backgroundStart: string;
  backgroundEnd: string;
  accent: string;
  tone: LeadCoverTone;
}

interface RgbColor {
  r: number;
  g: number;
  b: number;
}

const FALLBACK_DARK: LeadCoverTheme = {
  backgroundStart: "rgb(18 18 20)",
  backgroundEnd: "rgb(34 35 38)",
  accent: "rgb(98 102 112)",
  tone: "dark",
};

const themeCache = new Map<string, LeadCoverTheme>();

function clampChannel(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function rgbToCss(color: RgbColor) {
  return `rgb(${clampChannel(color.r)} ${clampChannel(color.g)} ${clampChannel(color.b)})`;
}

function mixColors(a: RgbColor, b: RgbColor, amount: number): RgbColor {
  return {
    r: a.r + (b.r - a.r) * amount,
    g: a.g + (b.g - a.g) * amount,
    b: a.b + (b.b - a.b) * amount,
  };
}

function softenColor(color: RgbColor, amount: number): RgbColor {
  const gray = 0.299 * color.r + 0.587 * color.g + 0.114 * color.b;
  return mixColors(color, { r: gray, g: gray, b: gray }, amount);
}

function getRelativeLuminance(color: RgbColor) {
  const convert = (value: number) => {
    const normalized = value / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * convert(color.r) + 0.7152 * convert(color.g) + 0.0722 * convert(color.b);
}

function sampleRegion(data: Uint8ClampedArray, width: number, height: number, startX: number, endX: number) {
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = startX; x < endX; x += 1) {
      const index = (y * width + x) * 4;
      const alpha = data[index + 3];

      if (alpha === 0) {
        continue;
      }

      r += data[index];
      g += data[index + 1];
      b += data[index + 2];
      count += 1;
    }
  }

  if (count === 0) {
    return { r: 0, g: 0, b: 0 };
  }

  return {
    r: r / count,
    g: g / count,
    b: b / count,
  };
}

export function deriveLeadCoverThemeFromImageData(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): LeadCoverTheme {
  if (width <= 0 || height <= 0 || data.length === 0) {
    return FALLBACK_DARK;
  }

  const stripWidth = Math.max(1, Math.round(width * 0.18));
  const left = softenColor(sampleRegion(data, width, height, 0, stripWidth), 0.42);
  const right = softenColor(sampleRegion(data, width, height, width - stripWidth, width), 0.42);
  const middleStart = Math.max(0, Math.floor(width * 0.35));
  const middleEnd = Math.min(width, Math.ceil(width * 0.65));
  const middle = softenColor(sampleRegion(data, width, height, middleStart, middleEnd), 0.3);
  const overall = softenColor(sampleRegion(data, width, height, 0, width), 0.32);
  const tone: LeadCoverTone = getRelativeLuminance(overall) > 0.38 ? "light" : "dark";
  const target = tone === "light" ? { r: 255, g: 255, b: 255 } : { r: 0, g: 0, b: 0 };

  return {
    backgroundStart: rgbToCss(mixColors(left, target, tone === "light" ? 0.34 : 0.48)),
    backgroundEnd: rgbToCss(mixColors(right, target, tone === "light" ? 0.24 : 0.42)),
    accent: rgbToCss(mixColors(middle, target, tone === "light" ? 0.12 : 0.18)),
    tone,
  };
}

function createImageBitmap(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load lead cover image: ${url}`));
    image.src = url;
  });
}

export async function extractLeadCoverTheme(url: string) {
  const trimmedUrl = url.trim();

  if (!trimmedUrl || typeof document === "undefined") {
    return FALLBACK_DARK;
  }

  const cached = themeCache.get(trimmedUrl);
  if (cached) {
    return cached;
  }

  try {
    const image = await createImageBitmap(trimmedUrl);
    const canvas = document.createElement("canvas");
    const width = 24;
    const height = 24;
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) {
      return FALLBACK_DARK;
    }

    context.drawImage(image, 0, 0, width, height);
    const imageData = context.getImageData(0, 0, width, height);
    const theme = deriveLeadCoverThemeFromImageData(imageData.data, width, height);
    themeCache.set(trimmedUrl, theme);
    return theme;
  } catch {
    return FALLBACK_DARK;
  }
}

export function useLeadCoverTheme(url: string) {
  const [theme, setTheme] = useState<LeadCoverTheme>(FALLBACK_DARK);

  useEffect(() => {
    let active = true;

    void extractLeadCoverTheme(url).then((nextTheme) => {
      if (active) {
        setTheme(nextTheme);
      }
    });

    return () => {
      active = false;
    };
  }, [url]);

  return theme;
}
