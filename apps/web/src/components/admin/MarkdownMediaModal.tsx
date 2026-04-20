import { useEffect, useRef, useState } from "react";
import { Button, Input, Modal } from "../../lib/heroui";

type MarkdownMediaModalProps = {
  kind: "image" | "video";
  isOpen: boolean;
  copy: {
    insertImage: string;
    insertVideo: string;
    uploadFile: string;
    useExternalUrl: string;
    altText: string;
    mediaTitle: string;
    mediaUrl: string;
    chooseImage: string;
    chooseVideo: string;
    insertIntoContent: string;
    uploadingMedia: string;
    cancel: string;
    invalidImage: string;
    invalidVideo: string;
  };
  isUploading: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (payload: { file?: File; url?: string; alt?: string; title?: string }) => Promise<void> | void;
};

export default function MarkdownMediaModal({
  kind,
  isOpen,
  copy,
  isUploading,
  error,
  onClose,
  onSubmit,
}: MarkdownMediaModalProps) {
  const [sourceMode, setSourceMode] = useState<"upload" | "url">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");
  const [title, setTitle] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSourceMode("upload");
      setFile(null);
      setUrl("");
      setAlt("");
      setTitle("");
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <Modal>
      <Modal.Backdrop isOpen={isOpen} onOpenChange={(nextOpen: boolean) => !nextOpen && onClose()} className="admin-delete-modal-backdrop">
        <Modal.Container placement="center">
          <Modal.Dialog className="admin-delete-modal w-full max-w-xl">
            <Modal.Header className="admin-delete-modal-header">
              <span className="admin-eyebrow type-mono-micro">{kind === "image" ? copy.insertImage : copy.insertVideo}</span>
              <Modal.Heading className="admin-section-title admin-section-title-lg mt-3">
                {kind === "image" ? copy.insertImage : copy.insertVideo}
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body className="admin-delete-modal-body">
              <div className="grid gap-4">
                <div className="inline-flex gap-2 rounded-full border p-1">
                  <button type="button" className={`admin-media-mode-toggle ${sourceMode === "upload" ? "admin-media-mode-toggle-active" : ""}`} onClick={() => setSourceMode("upload")}>
                    {copy.uploadFile}
                  </button>
                  <button type="button" className={`admin-media-mode-toggle ${sourceMode === "url" ? "admin-media-mode-toggle-active" : ""}`} onClick={() => setSourceMode("url")}>
                    {copy.useExternalUrl}
                  </button>
                </div>

                {sourceMode === "upload" ? (
                  <div className="grid gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="sr-only"
                      accept={kind === "image" ? "image/png,image/jpeg,image/webp,image/gif,image/svg+xml,image/avif" : "video/mp4,video/webm,video/quicktime,.mov"}
                      onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                    />
                    <Button type="button" className="admin-button-secondary justify-start" onPress={() => fileInputRef.current?.click()}>
                      {kind === "image" ? copy.chooseImage : copy.chooseVideo}
                    </Button>
                    {file ? <p className="admin-copy-muted">{file.name}</p> : null}
                  </div>
                ) : (
                  <label className="grid gap-2">
                    <span className="admin-eyebrow type-mono-micro">{copy.mediaUrl}</span>
                    <Input value={url} onChange={(event) => setUrl(event.target.value)} className="admin-input w-full" />
                  </label>
                )}

                <label className="grid gap-2">
                  <span className="admin-eyebrow type-mono-micro">{kind === "image" ? copy.altText : copy.mediaTitle}</span>
                  <Input
                    value={kind === "image" ? alt : title}
                    onChange={(event) => (kind === "image" ? setAlt(event.target.value) : setTitle(event.target.value))}
                    className="admin-input w-full"
                  />
                </label>

                {error ? <p className="admin-copy-muted text-red-300">{error}</p> : null}
              </div>
            </Modal.Body>
            <Modal.Footer className="admin-delete-modal-footer">
              <Button isDisabled={isUploading} className="admin-button-secondary admin-button-lg px-5" onPress={onClose}>
                {copy.cancel}
              </Button>
              <Button
                isDisabled={isUploading || (sourceMode === "upload" ? !file : !url.trim())}
                className="admin-button-primary admin-button-lg px-5"
                onPress={() =>
                  onSubmit({
                    file: sourceMode === "upload" ? file ?? undefined : undefined,
                    url: sourceMode === "url" ? url.trim() : undefined,
                    alt: alt.trim() || undefined,
                    title: title.trim() || undefined,
                  })
                }
              >
                {isUploading ? copy.uploadingMedia : copy.insertIntoContent}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
