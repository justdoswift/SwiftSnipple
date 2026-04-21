export const COVER_CROP_OUTPUT_WIDTH = 1200;
export const COVER_CROP_OUTPUT_HEIGHT = 630;
export const COVER_CROP_MIME_TYPE = "image/webp";

export type CoverCropViewport = {
  width: number;
  height: number;
};

export type CoverCropImageSize = {
  width: number;
  height: number;
};

export type CoverCropTransform = {
  scale: number;
  offsetX: number;
  offsetY: number;
};

export function getCoverCropMinScale(imageSize: CoverCropImageSize, viewport: CoverCropViewport) {
  if (imageSize.width <= 0 || imageSize.height <= 0 || viewport.width <= 0 || viewport.height <= 0) {
    return 1;
  }

  return Math.max(viewport.width / imageSize.width, viewport.height / imageSize.height);
}

export function clampCoverCropTransform(
  transform: CoverCropTransform,
  imageSize: CoverCropImageSize,
  viewport: CoverCropViewport,
) {
  const renderedWidth = imageSize.width * transform.scale;
  const renderedHeight = imageSize.height * transform.scale;
  const maxOffsetX = Math.max(0, (renderedWidth - viewport.width) / 2);
  const maxOffsetY = Math.max(0, (renderedHeight - viewport.height) / 2);

  return {
    scale: transform.scale,
    offsetX: Math.min(maxOffsetX, Math.max(-maxOffsetX, transform.offsetX)),
    offsetY: Math.min(maxOffsetY, Math.max(-maxOffsetY, transform.offsetY)),
  };
}

export function getCoverCropDrawRect(
  transform: CoverCropTransform,
  imageSize: CoverCropImageSize,
  viewport: CoverCropViewport,
) {
  const renderedWidth = imageSize.width * transform.scale;
  const renderedHeight = imageSize.height * transform.scale;
  const left = (viewport.width - renderedWidth) / 2 + transform.offsetX;
  const top = (viewport.height - renderedHeight) / 2 + transform.offsetY;

  return {
    sx: Math.max(0, -left / transform.scale),
    sy: Math.max(0, -top / transform.scale),
    sWidth: Math.min(imageSize.width, viewport.width / transform.scale),
    sHeight: Math.min(imageSize.height, viewport.height / transform.scale),
  };
}

export async function exportCoverCropBlob({
  image,
  imageSize,
  viewport,
  transform,
  mimeType = COVER_CROP_MIME_TYPE,
  quality = 0.92,
}: {
  image: CanvasImageSource;
  imageSize: CoverCropImageSize;
  viewport: CoverCropViewport;
  transform: CoverCropTransform;
  mimeType?: string;
  quality?: number;
}) {
  const canvas = document.createElement("canvas");
  canvas.width = COVER_CROP_OUTPUT_WIDTH;
  canvas.height = COVER_CROP_OUTPUT_HEIGHT;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Failed to create cover crop context.");
  }

  const drawRect = getCoverCropDrawRect(transform, imageSize, viewport);
  context.drawImage(
    image,
    drawRect.sx,
    drawRect.sy,
    drawRect.sWidth,
    drawRect.sHeight,
    0,
    0,
    COVER_CROP_OUTPUT_WIDTH,
    COVER_CROP_OUTPUT_HEIGHT,
  );

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, mimeType, quality);
  });

  if (!blob) {
    throw new Error("Failed to export cover crop.");
  }

  return blob;
}
