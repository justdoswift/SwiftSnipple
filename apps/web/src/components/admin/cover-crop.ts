export const COVER_CROP_OUTPUT_WIDTH = 1200;
export const COVER_CROP_OUTPUT_HEIGHT = 630;
export const COVER_CROP_MIME_TYPE = "image/webp";
export const COVER_CROP_RATIO = COVER_CROP_OUTPUT_WIDTH / COVER_CROP_OUTPUT_HEIGHT;
export const COVER_CROP_FALLBACK_WIDTH = 960;
export const COVER_CROP_FALLBACK_HEIGHT = COVER_CROP_FALLBACK_WIDTH / COVER_CROP_RATIO;
export const COVER_CROP_FRAME_PADDING = 24;
export const COVER_CROP_FRAME_MAX_WIDTH = 1100;

export type CoverCropViewport = {
  width: number;
  height: number;
};

export type CoverCropRect = CoverCropViewport & {
  left: number;
  top: number;
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

export function getStableCoverCropViewport(width: number, height: number): CoverCropViewport {
  const hasMeasuredWidth = width > 0;
  const hasMeasuredHeight = height > 0;

  if (hasMeasuredWidth && hasMeasuredHeight) {
    return {
      width,
      height,
    };
  }

  if (hasMeasuredWidth) {
    return {
      width,
      height: width / COVER_CROP_RATIO,
    };
  }

  if (hasMeasuredHeight) {
    return {
      width: height * COVER_CROP_RATIO,
      height,
    };
  }

  return {
    width: COVER_CROP_FALLBACK_WIDTH,
    height: COVER_CROP_FALLBACK_HEIGHT,
  };
}

export function getCoverCropFrame(workspace: CoverCropViewport): CoverCropRect {
  const availableWidth = Math.max(1, workspace.width - COVER_CROP_FRAME_PADDING * 2);
  const availableHeight = Math.max(1, workspace.height - COVER_CROP_FRAME_PADDING * 2);

  let width = Math.min(availableWidth, COVER_CROP_FRAME_MAX_WIDTH);
  let height = width / COVER_CROP_RATIO;

  if (height > availableHeight) {
    height = availableHeight;
    width = height * COVER_CROP_RATIO;
  }

  return {
    width,
    height,
    left: (workspace.width - width) / 2,
    top: (workspace.height - height) / 2,
  };
}

export function getCoverCropMinScale(
  imageSize: CoverCropImageSize,
  workspace: CoverCropViewport,
  cropRect: CoverCropRect = getCoverCropFrame(workspace),
) {
  if (
    imageSize.width <= 0 ||
    imageSize.height <= 0 ||
    workspace.width <= 0 ||
    workspace.height <= 0 ||
    cropRect.width <= 0 ||
    cropRect.height <= 0
  ) {
    return 1;
  }

  return Math.max(cropRect.width / imageSize.width, cropRect.height / imageSize.height);
}

export function clampCoverCropTransform(
  transform: CoverCropTransform,
  imageSize: CoverCropImageSize,
  workspace: CoverCropViewport,
  cropRect: CoverCropRect = getCoverCropFrame(workspace),
) {
  if (
    imageSize.width <= 0 ||
    imageSize.height <= 0 ||
    workspace.width <= 0 ||
    workspace.height <= 0 ||
    cropRect.width <= 0 ||
    cropRect.height <= 0
  ) {
    return transform;
  }

  const minScale = getCoverCropMinScale(imageSize, workspace, cropRect);
  const scale = Math.max(transform.scale, minScale);
  const renderedWidth = imageSize.width * scale;
  const renderedHeight = imageSize.height * scale;
  const centeredLeft = (workspace.width - renderedWidth) / 2;
  const centeredTop = (workspace.height - renderedHeight) / 2;
  const minOffsetX = cropRect.left + cropRect.width - renderedWidth - centeredLeft;
  const maxOffsetX = cropRect.left - centeredLeft;
  const minOffsetY = cropRect.top + cropRect.height - renderedHeight - centeredTop;
  const maxOffsetY = cropRect.top - centeredTop;

  return {
    scale,
    offsetX: Math.min(Math.max(transform.offsetX, minOffsetX), maxOffsetX),
    offsetY: Math.min(Math.max(transform.offsetY, minOffsetY), maxOffsetY),
  };
}

export function getCoverCropDrawRect(
  transform: CoverCropTransform,
  imageSize: CoverCropImageSize,
  workspace: CoverCropViewport,
  cropRect: CoverCropRect,
) {
  const renderedWidth = imageSize.width * transform.scale;
  const renderedHeight = imageSize.height * transform.scale;
  const imageLeft = (workspace.width - renderedWidth) / 2 + transform.offsetX;
  const imageTop = (workspace.height - renderedHeight) / 2 + transform.offsetY;

  const intersectionLeft = Math.max(cropRect.left, imageLeft);
  const intersectionTop = Math.max(cropRect.top, imageTop);
  const intersectionRight = Math.min(cropRect.left + cropRect.width, imageLeft + renderedWidth);
  const intersectionBottom = Math.min(cropRect.top + cropRect.height, imageTop + renderedHeight);
  const intersectionWidth = intersectionRight - intersectionLeft;
  const intersectionHeight = intersectionBottom - intersectionTop;

  if (intersectionWidth <= 0 || intersectionHeight <= 0) {
    return null;
  }

  const dx = ((intersectionLeft - cropRect.left) / cropRect.width) * COVER_CROP_OUTPUT_WIDTH;
  const dy = ((intersectionTop - cropRect.top) / cropRect.height) * COVER_CROP_OUTPUT_HEIGHT;
  const dWidth = (intersectionWidth / cropRect.width) * COVER_CROP_OUTPUT_WIDTH;
  const dHeight = (intersectionHeight / cropRect.height) * COVER_CROP_OUTPUT_HEIGHT;

  return {
    sx: (intersectionLeft - imageLeft) / transform.scale,
    sy: (intersectionTop - imageTop) / transform.scale,
    sWidth: intersectionWidth / transform.scale,
    sHeight: intersectionHeight / transform.scale,
    dx,
    dy,
    dWidth,
    dHeight,
  };
}

export async function exportCoverCropBlob({
  image,
  imageSize,
  workspace,
  cropRect,
  transform,
  mimeType = COVER_CROP_MIME_TYPE,
  quality = 0.92,
}: {
  image: CanvasImageSource;
  imageSize: CoverCropImageSize;
  workspace: CoverCropViewport;
  cropRect: CoverCropRect;
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

  context.clearRect(0, 0, canvas.width, canvas.height);

  const safeTransform = clampCoverCropTransform(transform, imageSize, workspace, cropRect);
  const drawRect = getCoverCropDrawRect(safeTransform, imageSize, workspace, cropRect);

  if (!drawRect) {
    throw new Error("Failed to export cover crop.");
  }

  context.drawImage(
    image,
    drawRect.sx,
    drawRect.sy,
    drawRect.sWidth,
    drawRect.sHeight,
    drawRect.dx,
    drawRect.dy,
    drawRect.dWidth,
    drawRect.dHeight,
  );

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, mimeType, quality);
  });

  if (!blob) {
    throw new Error("Failed to export cover crop.");
  }

  return blob;
}
