import { Link } from "react-router-dom";
import { getMessages } from "../lib/messages";
import { useAppLocale } from "../lib/locale";

export default function Footer() {
  const { locale } = useAppLocale();
  const copy = getMessages(locale).footer;

  return (
    <footer className="public-footer mt-24 w-full px-6 pb-12 md:px-8">
      <div className="vibe-glass mx-auto max-w-[1380px] rounded-[24px] px-8 py-10 md:py-12">
        <div className="flex flex-col justify-between gap-10 md:flex-row md:items-start">
          <div className="flex flex-col gap-4">
            <span className="type-card-title font-bold">Just Do Swift</span>
            <p className="type-body-sm max-w-xs">
              {copy.brandCopy}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-12 md:grid-cols-3">
            <div className="flex flex-col gap-4">
              <span className="type-mono-micro">{copy.product}</span>
              <a href={`/${locale}#library-index`} className="type-action transition-colors">{copy.library}</a>
              <a href={`/${locale}#latest-additions`} className="type-action transition-colors">{copy.snippets}</a>
            </div>
            <div className="flex flex-col gap-4">
              <span className="type-mono-micro">{copy.resources}</span>
              <Link to={`/${locale}/privacy-policy`} className="type-action transition-colors">{copy.privacy}</Link>
              <Link to={`/${locale}/terms-of-service`} className="type-action transition-colors">{copy.terms}</Link>
            </div>
            <div className="flex flex-col gap-4">
              <span className="type-mono-micro">{copy.connect}</span>
              <a
                href="https://justdoswift.substack.com/"
                target="_blank"
                rel="noreferrer"
                className="type-action transition-colors"
              >
                Substack
              </a>
              <a
                href="https://x.com/@justdoswift"
                target="_blank"
                rel="noreferrer"
                className="type-action transition-colors"
              >
                X
              </a>
            </div>
          </div>
        </div>

        <div className="public-divider-top mt-12 pt-8">
          <p className="type-mono-micro">{copy.copyright}</p>
        </div>
      </div>
    </footer>
  );
}
