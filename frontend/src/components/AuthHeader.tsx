import React from "react";
import { Link } from "react-router-dom";
import { Trees, ArrowLeft } from "lucide-react";

export const AuthHeader: React.FC = () => {
  return (
    <header className="w-full bg-white/80 backdrop-blur-md border-b border-emerald-950/10 px-6 py-4 fixed top-0 left-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-800 to-emerald-900 flex items-center justify-center text-amber-300 shadow-md group-hover:scale-105 transition-transform duration-300">
            <Trees className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-emerald-950 block">GAIA</span>
            <span className="text-[10px] uppercase font-semibold text-emerald-700 tracking-wider block">Wildlife Protection Network</span>
          </div>
        </Link>

        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-sm font-medium transition-all duration-200 border border-emerald-900/10 hover:shadow-sm hover:-translate-x-0.5"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-700" />
          Back to Home
        </Link>
      </div>
    </header>
  );
};
