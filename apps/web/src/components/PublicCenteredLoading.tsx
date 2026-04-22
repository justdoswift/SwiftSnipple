import { Spinner } from "../lib/heroui";

interface PublicCenteredLoadingProps {
  label: string;
  testId?: string;
}

export default function PublicCenteredLoading({ label, testId = "public-centered-loading" }: PublicCenteredLoadingProps) {
  return (
    <div
      data-testid={testId}
      className="public-centered-loading fixed left-1/2 top-1/2 z-40 -translate-x-1/2 -translate-y-1/2"
      aria-label={label}
      role="status"
    >
      <div className="flex items-center justify-center text-center">
        <Spinner size="lg" />
      </div>
    </div>
  );
}
