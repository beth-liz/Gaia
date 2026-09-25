import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Trees, ArrowRight } from "lucide-react";

interface NavbarProps {
  forceSolid?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ forceSolid = false }) => {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  // If we are on a page where anchor links don't make sense (like login), we could navigate to /#about-mission,
  // but if we are on landing page, just #about-mission. For safety, always prefix with /
  const getHref = (hash: string) => {
    if (location.pathname === "/") {
      return hash;
    }
    return `/${hash}`;
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isSolid = forceSolid || scrolled;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b border-transparent ${
        isSolid
          ? "bg-[#050806]/90 backdrop-blur-xl border-white/10 py-4 shadow-lg shadow-black/50"
          : "bg-transparent py-6"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <Trees className="w-7 h-7 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
          <span className="text-2xl font-serif font-bold tracking-widest text-white block shadow-sm">GAIA</span>
        </Link>

        {/* Desktop Nav Links (Font-serif) */}
        <div className="hidden md:flex items-center gap-10 text-sm font-serif font-medium text-gray-200">
          <a href={getHref("#about-mission")} className="hover:text-white transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-0 hover:after:w-full after:bg-emerald-400 after:transition-all tracking-wide">About</a>
          <a href={getHref("#about-mission")} className="hover:text-white transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-0 hover:after:w-full after:bg-emerald-400 after:transition-all tracking-wide">Mission</a>
          <a href={getHref("#capabilities")} className="hover:text-white transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-0 hover:after:w-full after:bg-emerald-400 after:transition-all tracking-wide">Capabilities</a>
          <a href={getHref("#workflow")} className="hover:text-white transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-0 hover:after:w-full after:bg-emerald-400 after:transition-all tracking-wide">Workflow</a>
        </div>

        {/* Auth Actions */}
        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="hidden sm:block text-sm font-serif font-medium text-gray-200 hover:text-white transition-colors tracking-wide"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="px-5 py-2.5 rounded-full bg-emerald-700/80 hover:bg-emerald-600 text-white text-sm font-medium transition-all flex items-center gap-2 border border-emerald-500/30 hover:border-emerald-400"
          >
            Register
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </nav>
  );
};
