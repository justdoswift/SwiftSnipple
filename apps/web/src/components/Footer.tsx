import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="public-footer mt-24 w-full px-6 pb-12 md:px-8">
      <div className="vibe-glass mx-auto max-w-[1380px] rounded-[24px] px-8 py-10 md:py-12">
        <div className="flex flex-col justify-between gap-10 md:flex-row md:items-start">
          <div className="flex flex-col gap-4">
            <span className="type-card-title font-bold">Just Do Swift</span>
            <p className="type-body-sm max-w-xs">
              A curated collection of exceptional SwiftUI builds, deconstructed and ready for reuse.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-12 md:grid-cols-3">
            <div className="flex flex-col gap-4">
              <span className="type-mono-micro">Product</span>
              <a href="/#library-index" className="type-action transition-colors">Library</a>
              <a href="/#latest-additions" className="type-action transition-colors">Snippets</a>
            </div>
            <div className="flex flex-col gap-4">
              <span className="type-mono-micro">Resources</span>
              <Link to="/privacy-policy" className="type-action transition-colors">Privacy</Link>
              <Link to="/terms-of-service" className="type-action transition-colors">Terms</Link>
            </div>
            <div className="flex flex-col gap-4">
              <span className="type-mono-micro">Connect</span>
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
          <p className="type-mono-micro">© 2026 Just Do Swift. Built for the modern ecosystem.</p>
        </div>
      </div>
    </footer>
  );
}
