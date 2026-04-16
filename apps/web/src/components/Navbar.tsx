import { Search } from "lucide-react";
import { Button, Input } from "../lib/heroui";
import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 z-50 w-full px-4 pt-4 md:px-6">
      <div className="public-nav-shell mx-auto flex max-w-[1380px] items-center justify-between rounded-[22px] px-5 py-3 md:px-8">
        <Link to="/" className="type-card-title font-sans font-bold tracking-tight text-white">
          SwiftSnipple
        </Link>
        
        <div className="hidden items-center gap-8 md:flex">
          <Link to="/" className="type-action text-white transition-all hover:opacity-100">
            Browse
          </Link>
          <a href="/#library-index" className="type-action text-white/40 transition-all hover:text-white">
            Library
          </a>
          <a href="/#latest-additions" className="type-action text-white/40 transition-all hover:text-white">
            Snippets
          </a>
          <Link to="/admin" className="type-action text-white/40 transition-all hover:text-white">
            Console
          </Link>
        </div>

        <div className="flex items-center gap-3 md:gap-6">
          <div className="relative hidden md:block">
            <Input
              aria-label="Search"
              isReadOnly
              placeholder="SEARCH"
              className="public-input w-[180px]"
              startContent={<Search size={14} className="text-white/28" />}
            />
          </div>
          <Button
            className="type-action h-10 border border-white/20 bg-white px-6 text-black hover:bg-white/90"
            radius="full"
            variant="solid"
            onPress={() => navigate("/admin")}
          >
            Launch
          </Button>
        </div>
      </div>
    </nav>
  );
}
