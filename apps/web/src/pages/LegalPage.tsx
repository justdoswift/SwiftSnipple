import MarkdownRenderer from "../components/MarkdownRenderer";

type LegalPageProps = {
  eyebrow: string;
  title: string;
  intro: string;
  content: string;
};

export default function LegalPage({ eyebrow, title, intro, content }: LegalPageProps) {
  return (
    <div className="public-page public-legal-page mx-auto max-w-[1400px] px-8 pb-24 pt-36 md:px-12 md:pt-40 lg:px-16 lg:pt-48">
      <div className="mx-auto max-w-[860px]">
        <header className="mb-12 text-center md:mb-14">
          <span className="public-pill type-mono-label px-3 py-1">
            {eyebrow}
          </span>
          <h1 className="type-display mt-5">{title}</h1>
          <p className="type-body-lg mx-auto mt-4 max-w-[640px]">{intro}</p>
        </header>

        <section className="public-content-panel px-6 py-6 md:px-8 md:py-8 lg:px-10">
          <MarkdownRenderer content={content} />
        </section>
      </div>
    </div>
  );
}
