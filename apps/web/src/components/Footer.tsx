export default function Footer() {
  return (
    <footer className="w-full py-12 mt-20 border-t border-outline-variant/15 bg-surface">
      <div className="flex flex-col md:flex-row justify-between items-center px-8 max-w-[1440px] mx-auto gap-8 md:gap-0">
        <div className="flex flex-col items-center md:items-start gap-2">
          <span className="font-black tracking-tighter text-lg uppercase">Rebuilt in SwiftUI</span>
          <span className="text-primary/50 text-sm">© 2024 Rebuilt in SwiftUI. Curated SwiftUI snippets.</span>
        </div>
        
        <div className="flex gap-8 text-primary/50 text-sm">
          <a href="/#library-index" className="hover:text-primary transition-colors underline">Library</a>
          <a href="#" className="hover:text-primary transition-colors">Privacy</a>
          <a href="#" className="hover:text-primary transition-colors">Terms</a>
          <a href="#" className="hover:text-primary transition-colors">RSS</a>
        </div>
      </div>
    </footer>
  );
}
