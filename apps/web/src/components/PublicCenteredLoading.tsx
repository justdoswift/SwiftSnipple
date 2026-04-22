import { Spinner } from "../lib/heroui";

interface PublicCenteredLoadingProps {
  label: string;
  testId?: string;
}

export default function PublicCenteredLoading({ label, testId = "public-centered-loading" }: PublicCenteredLoadingProps) {
  return (
    <div data-testid={testId} className="public-centered-loading mx-auto flex w-full max-w-[1400px] flex-1 items-center justify-center px-8 md:px-12 lg:px-16">
      <div className="flex flex-col items-center gap-4 text-center">
        <Spinner size="lg" />
        <p className="type-mono-micro public-loading-label">{label}</p>
      </div>
    </div>
  );
}
