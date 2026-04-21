import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Modal } from "../../lib/heroui";
import {
  clampCoverCropTransform,
  COVER_CROP_MIME_TYPE,
  exportCoverCropBlob,
  getCoverCropFrame,
  getCoverCropMinScale,
  getStableCoverCropViewport,
  type CoverCropImageSize,
  type CoverCropRect,
  type CoverCropTransform,
  type CoverCropViewport,
} from "./cover-crop";

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
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const previewImageRef = useRef<HTMLImageElement | null>(null);
  const dragStartRef = useRef<{ pointerX: number; pointerY: number; offsetX: number; offsetY: number } | null>(null);
  const [imageSize, setImageSize] = useState<CoverCropImageSize | null>(null);
  const [workspace, setWorkspace] = useState<CoverCropViewport | null>(viewportSizeOverride ?? null);
  const [transform, setTransform] = useState<CoverCropTransform>(EMPTY_TRANSFORM);
  const [localError, setLocalError] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (!isOpen || !source) {
      setImageSize(null);
      setWorkspace(viewportSizeOverride ?? null);
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
    if (!viewportSizeOverride) {
      return;
    }

    setWorkspace(viewportSizeOverride);
  }, [viewportSizeOverride]);

  useEffect(() => {
    if (!isOpen || viewportSizeOverride) {
      return;
    }

    let frameId = 0;
    const commitWorkspace = (width: number, height: number) => {
      const nextWorkspace = getStableCoverCropViewport(width, height);
      setWorkspace((currentWorkspace) => {
        const roundedWidth = Math.round(nextWorkspace.width * 100) / 100;
        const roundedHeight = Math.round(nextWorkspace.height * 100) / 100;

        if (
          currentWorkspace &&
          Math.abs(currentWorkspace.width - roundedWidth) < 0.5 &&
          Math.abs(currentWorkspace.height - roundedHeight) < 0.5
        ) {
          return currentWorkspace;
        }

        return {
          width: roundedWidth,
          height: roundedHeight,
        };
      });
    };

    const measureWorkspace = () => {
      const workspaceElement = workspaceRef.current;
      if (!workspaceElement) {
        return;
      }

      const nextRect = workspaceElement.getBoundingClientRect();
      commitWorkspace(nextRect.width, nextRect.height);
    };

    frameId = window.requestAnimationFrame(measureWorkspace);
    const WorkspaceResizeObserver = window.ResizeObserver;
    const workspaceObserver = WorkspaceResizeObserver
      ? new WorkspaceResizeObserver((entries) => {
          const entry = entries[0];
          if (entry) {
            commitWorkspace(entry.contentRect.width, entry.contentRect.height);
            return;
          }

          window.cancelAnimationFrame(frameId);
          frameId = window.requestAnimationFrame(measureWorkspace);
        })
      : null;

    if (workspaceRef.current && workspaceObserver) {
      workspaceObserver.observe(workspaceRef.current);
    }

    return () => {
      workspaceObserver?.disconnect();
      window.cancelAnimationFrame(frameId);
    };
  }, [isOpen, viewportSizeOverride]);

  const cropRect = useMemo<CoverCropRect | null>(() => {
    if (!workspace) {
      return null;
    }

    return getCoverCropFrame(workspace);
  }, [workspace]);

  useEffect(() => {
    if (!imageSize || !workspace || !cropRect) {
      return;
    }

    const minScale = getCoverCropMinScale(imageSize, workspace, cropRect);
    setTransform((current) => {
      const nextTransform = current.scale > 0
        ? { ...current, scale: Math.max(current.scale, minScale) }
        : { scale: minScale, offsetX: 0, offsetY: 0 };

      return clampCoverCropTransform(nextTransform, imageSize, workspace, cropRect);
    });
  }, [cropRect, imageSize, workspace]);

  const minScale = useMemo(() => {
    if (!imageSize || !workspace || !cropRect) {
      return 1;
    }

    return getCoverCropMinScale(imageSize, workspace, cropRect);
  }, [cropRect, imageSize, workspace]);

  const maxScale = Math.max(minScale * 4, minScale + 0.5);
  const isCropReady = Boolean(imageSize && workspace && cropRect);
  const renderedWidth = imageSize ? imageSize.width * transform.scale : 0;
  const renderedHeight = imageSize ? imageSize.height * transform.scale : 0;
  const imageLeft = workspace ? (workspace.width - renderedWidth) / 2 + transform.offsetX : 0;
  const imageTop = workspace ? (workspace.height - renderedHeight) / 2 + transform.offsetY : 0;

  const updateTransform = (nextTransform: CoverCropTransform) => {
    if (!imageSize || !workspace || !cropRect) {
      return;
    }

    setTransform(clampCoverCropTransform(nextTransform, imageSize, workspace, cropRect));
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
    if (!imageSize || !workspace) {
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
    if (!imageSize || !workspace) {
      return;
    }

    event.preventDefault();
    const direction = event.deltaY > 0 ? -1 : 1;
    const nextScale = transform.scale * (direction > 0 ? 1.08 : 1 / 1.08);
    handleScaleChange(Math.max(minScale, Math.min(maxScale, nextScale)));
  };

  const handleConfirm = async () => {
    if (!source || !previewImageRef.current || !imageSize || !workspace || !cropRect) {
      return;
    }

    try {
      setLocalError("");
      setIsExporting(true);
      const blob = await exportCoverCropBlob({
        image: previewImageRef.current,
        imageSize,
        workspace,
        cropRect,
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
        <Modal.Container placement="center" scroll="outside">
          <Modal.Dialog className="admin-cover-crop-dialog">
            <Modal.Header className="admin-cover-crop-header">
              <div className="admin-cover-crop-header-copy min-w-0">
                <span className="admin-eyebrow type-mono-micro">{copy.eyebrow}</span>
                <Modal.Heading className="admin-section-title admin-section-title-lg admin-cover-crop-title">
                  {copy.title}
                </Modal.Heading>
                <p className="admin-copy-muted admin-cover-crop-copy">{copy.description}</p>
              </div>
            </Modal.Header>
            <Modal.Body className="admin-cover-crop-body" data-testid="cover-crop-body">
              <div className="admin-cover-crop-workspace">
                <div className="admin-cover-crop-editor" data-testid="cover-crop-editor">
                  <div className="admin-cover-crop-panel" data-testid="cover-crop-panel">
                    <div className="admin-cover-crop-toolbar" data-testid="cover-crop-toolbar">
                      <div className="admin-cover-crop-toolbar-copy">
                        <span className="admin-eyebrow type-mono-micro">{copy.zoom}</span>
                      </div>
                      <label className="admin-cover-crop-zoom">
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
                      <div className="admin-cover-crop-toolbar-actions">
                        <Button
                          className="admin-button-secondary admin-button-md"
                          isDisabled={!isCropReady || isSubmitting || isExporting}
                          onPress={handleReset}
                        >
                          {copy.reset}
                        </Button>
                      </div>
                    </div>

                    <div className="admin-cover-crop-frame-shell">
                      <div className="admin-cover-crop-frame">
                        <div
                          ref={workspaceRef}
                          className="admin-cover-crop-stage"
                          data-testid="cover-crop-workspace"
                          onPointerDown={handlePointerDown}
                          onPointerMove={handlePointerMove}
                          onPointerUp={handlePointerUp}
                          onPointerCancel={handlePointerUp}
                          onWheel={handleWheel}
                        >
                          {imageSize && workspace ? (
                            <img
                              ref={previewImageRef}
                              src={source.objectUrl}
                              alt={source.file.name}
                              data-testid="cover-crop-image"
                              data-scale={transform.scale.toFixed(4)}
                              data-left={imageLeft.toFixed(2)}
                              data-top={imageTop.toFixed(2)}
                              data-rendered-width={renderedWidth.toFixed(2)}
                              data-rendered-height={renderedHeight.toFixed(2)}
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

                          {cropRect ? (
                            <div className="admin-cover-crop-overlay" aria-hidden="true">
                              <div className="admin-cover-crop-shade admin-cover-crop-shade-top" style={{ height: `${cropRect.top}px` }} />
                              <div
                                className="admin-cover-crop-shade admin-cover-crop-shade-left"
                                style={{
                                  top: `${cropRect.top}px`,
                                  width: `${cropRect.left}px`,
                                  height: `${cropRect.height}px`,
                                }}
                              />
                              <div
                                className="admin-cover-crop-shade admin-cover-crop-shade-right"
                                style={{
                                  top: `${cropRect.top}px`,
                                  left: `${cropRect.left + cropRect.width}px`,
                                  height: `${cropRect.height}px`,
                                }}
                              />
                              <div
                                className="admin-cover-crop-shade admin-cover-crop-shade-bottom"
                                style={{ top: `${cropRect.top + cropRect.height}px` }}
                              />
                              <div
                                className="admin-cover-crop-window"
                                data-testid="cover-crop-frame"
                                data-left={cropRect.left.toFixed(2)}
                                data-top={cropRect.top.toFixed(2)}
                                data-width={cropRect.width.toFixed(2)}
                                data-height={cropRect.height.toFixed(2)}
                                style={{
                                  left: `${cropRect.left}px`,
                                  top: `${cropRect.top}px`,
                                  width: `${cropRect.width}px`,
                                  height: `${cropRect.height}px`,
                                }}
                              />
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="admin-cover-crop-meta" data-testid="cover-crop-meta">
                    <p className="admin-copy-faint type-mono-micro admin-cover-crop-hint">{copy.dragHint}</p>
                    {localError || error ? <p className="admin-copy-muted admin-cover-crop-error text-red-300">{localError || error}</p> : null}
                  </div>
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer className="admin-cover-crop-footer">
              <div className="admin-cover-crop-footer-actions">
                <Button className="admin-button-secondary admin-button-lg px-5" isDisabled={isSubmitting || isExporting} onPress={onClose}>
                  {copy.cancel}
                </Button>
                <Button
                  className="admin-button-primary admin-button-lg px-5"
                  isDisabled={!isCropReady || isSubmitting || isExporting}
                  onPress={handleConfirm}
                >
                  {isSubmitting || isExporting ? copy.loading : copy.confirm}
                </Button>
              </div>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
