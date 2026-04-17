import MarkdownRenderer from "../components/MarkdownRenderer";

type LegalPageProps = {
  eyebrow: string;
  title: string;
  intro: string;
  content: string;
};

export default function LegalPage({ eyebrow, title, intro, content }: LegalPageProps) {
  return (
    <div className="public-page public-legal-page mx-auto max-w-[1380px] px-6 pb-24 pt-44 md:px-10 md:pt-56">
      <div className="mx-auto max-w-[860px]">
        <header className="mb-14 text-center">
          <span className="public-pill type-mono-label rounded-full px-3 py-1">
            {eyebrow}
          </span>
          <h1 className="type-display mt-6">{title}</h1>
          <p className="type-body-lg mx-auto mt-5 max-w-[640px]">{intro}</p>
        </header>

        <section className="public-content-panel rounded-[32px] px-6 py-8 md:px-10 md:py-10">
          <MarkdownRenderer content={content} />
        </section>
      </div>
    </div>
  );
}
