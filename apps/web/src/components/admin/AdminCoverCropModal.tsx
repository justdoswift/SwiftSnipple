import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Modal } from "../../lib/heroui";
import {
  clampCoverCropTransform,
  COVER_CROP_MIME_TYPE,
  exportCoverCropBlob,
  getCoverCropMinScale,
  type CoverCropImageSize,
  type CoverCropTransform,
  type CoverCropViewport,
} from "./cover-crop";

const COVER_CROP_RATIO = 1200 / 630;

type AdminCoverCropModalProps = {
  isOpen: boolean;
  source: {
    file: File;
    objectUrl: string;
  } | null;
  error: string;
  isSubmitting: boolean;
  copy: {
    eyebrow: string;
    title: string;
    description: string;
    zoom: string;
    reset: string;
    confirm: string;
    loading: string;
    dragHint: string;
    cancel: string;
    exportFailed: string;
  };
  onClose: () => void;
  onConfirm: (file: File) => Promise<void> | void;
  viewportSizeOverride?: CoverCropViewport;
};

const EMPTY_TRANSFORM: CoverCropTransform = {
  scale: 0,
  offsetX: 0,
  offsetY: 0,
};

function replaceFileExtension(filename: string, extension: string) {
  const normalized = filename.replace(/\.[^/.]+$/, "");
  return `${normalized}${extension}`;
}

export default function AdminCoverCropModal({
  isOpen,
  source,
  error,
  isSubmitting,
  copy,
  onClose,
  onConfirm,
  viewportSizeOverride,
}: AdminCoverCropModalProps) {
  const cropViewportRef = useRef<HTMLDivElement | null>(null);
  const previewImageRef = useRef<HTMLImageElement | null>(null);
  const dragStartRef = useRef<{ pointerX: number; pointerY: number; offsetX: number; offsetY: number } | null>(null);
  const [imageSize, setImageSize] = useState<CoverCropImageSize | null>(null);
  const [viewport, setViewport] = useState<CoverCropViewport | null>(viewportSizeOverride ?? null);
  const [transform, setTransform] = useState<CoverCropTransform>(EMPTY_TRANSFORM);
  const [localError, setLocalError] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (!isOpen || !source) {
      setImageSize(null);
      setViewport(viewportSizeOverride ?? null);
      setTransform(EMPTY_TRANSFORM);
      setLocalError("");
      setIsExporting(false);
      return;
    }

    const image = new Image();
    image.onload = () => {
      setImageSize({
        width: image.naturalWidth || image.width,
        height: image.naturalHeight || image.height,
      });
    };
    image.onerror = () => {
      setLocalError(copy.exportFailed);
    };
    image.src = source.objectUrl;
  }, [copy.exportFailed, isOpen, source, viewportSizeOverride]);

  useEffect(() => {
    if (!isOpen || viewportSizeOverride) {
      return;
    }

    const updateViewport = () => {
      const viewportElement = cropViewportRef.current;
      if (!viewportElement) {
        return;
      }

      const nextRect = viewportElement.getBoundingClientRect();
      const nextWidth = nextRect.width || (nextRect.height ? nextRect.height * COVER_CROP_RATIO : 960);
      const nextHeight = nextRect.height || nextWidth / COVER_CROP_RATIO;

      setViewport({
        width: nextWidth,
        height: nextHeight,
      });
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);

    return () => {
      window.removeEventListener("resize", updateViewport);
    };
  }, [isOpen, viewportSizeOverride]);

  useEffect(() => {
    if (!imageSize || !viewport) {
      return;
    }

    const minScale = getCoverCropMinScale(imageSize, viewport);
    setTransform((current) => {
      const nextTransform = current.scale > 0
        ? { ...current, scale: Math.max(current.scale, minScale) }
        : { scale: minScale, offsetX: 0, offsetY: 0 };

      return clampCoverCropTransform(nextTransform, imageSize, viewport);
    });
  }, [imageSize, viewport]);

  const minScale = useMemo(() => {
    if (!imageSize || !viewport) {
      return 1;
    }

    return getCoverCropMinScale(imageSize, viewport);
  }, [imageSize, viewport]);

  const maxScale = Math.max(minScale * 4, minScale + 0.5);
  const renderedWidth = imageSize ? imageSize.width * transform.scale : 0;
  const renderedHeight = imageSize ? imageSize.height * transform.scale : 0;
  const imageLeft = viewport ? (viewport.width - renderedWidth) / 2 + transform.offsetX : 0;
  const imageTop = viewport ? (viewport.height - renderedHeight) / 2 + transform.offsetY : 0;

  const updateTransform = (nextTransform: CoverCropTransform) => {
    if (!imageSize || !viewport) {
      return;
    }

    setTransform(clampCoverCropTransform(nextTransform, imageSize, viewport));
  };

  const handleScaleChange = (nextScale: number) => {
    updateTransform({
      ...transform,
      scale: nextScale,
    });
  };

  const handleReset = () => {
    updateTransform({
      scale: minScale,
      offsetX: 0,
      offsetY: 0,
    });
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!imageSize || !viewport) {
      return;
    }

    dragStartRef.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      offsetX: transform.offsetX,
      offsetY: transform.offsetY,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const dragStart = dragStartRef.current;
    if (!dragStart) {
      return;
    }

    updateTransform({
      ...transform,
      offsetX: dragStart.offsetX + event.clientX - dragStart.pointerX,
      offsetY: dragStart.offsetY + event.clientY - dragStart.pointerY,
    });
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragStartRef.current = null;
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (!imageSize || !viewport) {
      return;
    }

    event.preventDefault();
    const direction = event.deltaY > 0 ? -1 : 1;
    const nextScale = transform.scale * (direction > 0 ? 1.08 : 1 / 1.08);
    handleScaleChange(Math.max(minScale, Math.min(maxScale, nextScale)));
  };

  const handleConfirm = async () => {
    if (!source || !previewImageRef.current || !imageSize || !viewport) {
      return;
    }

    try {
      setLocalError("");
      setIsExporting(true);
      const blob = await exportCoverCropBlob({
        image: previewImageRef.current,
        imageSize,
        viewport,
        transform,
        mimeType: COVER_CROP_MIME_TYPE,
      });

      const croppedFile = new File([blob], replaceFileExtension(source.file.name, ".webp"), {
        type: blob.type || COVER_CROP_MIME_TYPE,
      });

      try {
        await onConfirm(croppedFile);
      } catch {
        return;
      }
    } catch {
      setLocalError(copy.exportFailed);
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen || !source) {
    return null;
  }

  return (
    <Modal>
      <Modal.Backdrop isOpen={isOpen} onOpenChange={(nextOpen: boolean) => !nextOpen && onClose()} className="admin-cover-crop-backdrop">
        <Modal.Container placement="center">
          <Modal.Dialog className="admin-cover-crop-dialog">
            <Modal.Header className="admin-cover-crop-header">
              <div className="min-w-0">
                <span className="admin-eyebrow type-mono-micro">{copy.eyebrow}</span>
                <Modal.Heading className="admin-section-title admin-section-title-lg mt-3">
                  {copy.title}
                </Modal.Heading>
                <p className="admin-copy-muted mt-3 max-w-3xl">{copy.description}</p>
              </div>
            </Modal.Header>
            <Modal.Body className="admin-cover-crop-body">
              <div className="admin-cover-crop-workspace">
                <div className="admin-cover-crop-toolbar">
                  <label className="admin-cover-crop-zoom">
                    <span className="admin-eyebrow type-mono-micro">{copy.zoom}</span>
                    <input
                      aria-label={copy.zoom}
                      data-testid="cover-crop-zoom"
                      type="range"
                      min={minScale}
                      max={maxScale}
                      step={0.01}
                      value={Math.max(minScale, transform.scale || minScale)}
                      onChange={(event) => handleScaleChange(Number(event.target.value))}
                    />
                  </label>
                  <Button
                    className="admin-button-secondary admin-button-md"
                    isDisabled={!imageSize || isSubmitting || isExporting}
                    onPress={handleReset}
                  >
                    {copy.reset}
                  </Button>
                </div>

                <div className="admin-cover-crop-frame">
                  <div
                    ref={cropViewportRef}
                    className="admin-cover-crop-viewport"
                    data-testid="cover-crop-frame"
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    onWheel={handleWheel}
                  >
                    <div className="admin-cover-crop-mask" />
                    {imageSize ? (
                      <img
                        ref={previewImageRef}
                        src={source.objectUrl}
                        alt={source.file.name}
                        data-testid="cover-crop-image"
                        data-scale={transform.scale.toFixed(4)}
                        className="admin-cover-crop-image"
                        draggable={false}
                        style={{
                          width: `${renderedWidth}px`,
                          height: `${renderedHeight}px`,
                          left: `${imageLeft}px`,
                          top: `${imageTop}px`,
                        }}
                      />
                    ) : (
                      <div className="admin-cover-crop-loading">{copy.loading}</div>
                    )}
                  </div>
                </div>

                <p className="admin-copy-faint type-mono-micro">{copy.dragHint}</p>
                {localError || error ? <p className="admin-copy-muted text-red-300">{localError || error}</p> : null}
              </div>
            </Modal.Body>
            <Modal.Footer className="admin-cover-crop-footer">
              <Button className="admin-button-secondary admin-button-lg px-5" isDisabled={isSubmitting || isExporting} onPress={onClose}>
                {copy.cancel}
              </Button>
              <Button
                className="admin-button-primary admin-button-lg px-5"
                isDisabled={!imageSize || isSubmitting || isExporting}
                onPress={handleConfirm}
              >
                {isSubmitting || isExporting ? copy.loading : copy.confirm}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
