import { Card } from "../lib/heroui";

export default function Footer() {
  return (
    <footer className="mt-24 w-full px-6 pb-12 md:px-8">
      <div className="vibe-glass mx-auto max-w-[1380px] rounded-[24px] px-8 py-10 md:py-12">
        <div className="flex flex-col justify-between gap-10 md:flex-row md:items-start">
          <div className="flex flex-col gap-4">
            <span className="type-card-title font-bold text-white">SwiftSnipple</span>
            <p className="type-body-sm max-w-xs text-white/40">
              A curated collection of exceptional SwiftUI builds, deconstructed and ready for reuse.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-12 md:grid-cols-3">
            <div className="flex flex-col gap-4">
              <span className="type-mono-micro text-white/20">Product</span>
              <a href="/#library-index" className="type-action text-white/50 transition-colors hover:text-white">Library</a>
              <a href="/#latest-additions" className="type-action text-white/50 transition-colors hover:text-white">Snippets</a>
            </div>
            <div className="flex flex-col gap-4">
              <span className="type-mono-micro text-white/20">Resources</span>
              <a href="#" className="type-action text-white/50 transition-colors hover:text-white">Privacy</a>
              <a href="#" className="type-action text-white/50 transition-colors hover:text-white">Terms</a>
            </div>
            <div className="flex flex-col gap-4">
              <span className="type-mono-micro text-white/20">Connect</span>
              <a href="#" className="type-action text-white/50 transition-colors hover:text-white">RSS</a>
              <a href="#" className="type-action text-white/50 transition-colors hover:text-white">Twitter</a>
            </div>
          </div>
        </div>
        
        <div className="mt-12 border-t border-white/5 pt-8">
          <p className="type-mono-micro text-white/20">© 2026 SwiftSnipple Lab. Built for the modern ecosystem.</p>
        </div>
      </div>
    </footer>
  );
}
