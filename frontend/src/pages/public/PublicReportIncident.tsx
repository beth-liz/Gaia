import React from "react";
import { CreateIncidentForm } from "@/components/incidents/CreateIncidentForm";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
import { GAIA_LOGO_DATA } from "@/assets/logo";

export const PublicReportIncident: React.FC = () => {
  return (
    <div className="min-h-screen text-[#151A18] font-sans flex flex-col selection:bg-[#3FBF7F]/30 selection:text-white relative">
      {/* 
        BACKGROUND LAYER:
        - Full-cover nature5.jpg background image clearly visible across the entire page
        - Subtle, transparent forest-green gradient overlay (25-35% opacity) to enhance atmosphere without hiding the image
      */}
      <div
        className="fixed inset-0 w-full h-full z-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(180deg, rgba(6, 28, 20, 0.35) 0%, rgba(13, 40, 24, 0.25) 50%, rgba(6, 28, 20, 0.40) 100%),
            url('/images/nature5.jpg')
          `,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
        aria-hidden="true"
      />

      {/* HEADER: Dark forest-green header consistent with Gaia branding */}
      <header className="relative z-50 bg-[#061c14]/90 backdrop-blur-md border-b border-emerald-900/30 sticky top-0 shadow-lg shadow-black/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between">
          {/* Logo & Platform Name */}
          <Link
            to="/"
            className="flex items-center gap-3.5 group transition-transform active:scale-95"
            aria-label="Gaia Homepage"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 p-1.5 flex items-center justify-center border border-emerald-500/30 shadow-md shadow-emerald-950/40 group-hover:border-emerald-400/50 transition-all">
              <img
                src={GAIA_LOGO_DATA}
                alt="Gaia Logo"
                className="w-full h-full object-contain filter drop-shadow-sm group-hover:scale-105 transition-transform"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/images/gaia-logo.png";
                }}
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-serif font-black tracking-wider text-white leading-none">
                  GAIA
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  PUBLIC PORTAL
                </span>
              </div>
              <span className="text-[10px] sm:text-[11px] font-medium text-emerald-300/80 tracking-wide mt-1">
                Wildlife Conflict & Sighting Reporting
              </span>
            </div>
          </Link>

          {/* Back to Home Link */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs sm:text-sm font-semibold tracking-wide border border-white/15 backdrop-blur-sm transition-all hover:-translate-x-0.5 shadow-sm active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-300" />
            <span className="hidden xs:inline">Back to</span> Home
          </Link>
        </div>
      </header>

      {/* FOREGROUND MAIN CONTENT */}
      <main className="relative z-10 flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="space-y-8">
          {/* Hero Banner Card with Dark-Green Glass Appearance */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950/85 via-[#0a2319]/80 to-emerald-900/75 border border-emerald-700/30 p-6 sm:p-8 shadow-xl backdrop-blur-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-2.5 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-300" />
                  Official Forest Response Channel
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-white tracking-tight leading-tight">
                  Report Wildlife Incident
                </h1>
                <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-normal">
                  Report wildlife sightings or human-wildlife encounters to immediately notify on-duty Range Forest Officers and Rapid Response Teams. No account or login required.
                </p>
              </div>

              <div className="hidden md:flex flex-col items-end justify-center shrink-0 border-l border-emerald-800/40 pl-6 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Rangers Active 24/7</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                  <span>GPS Auto-Routing</span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Container */}
          <div className="w-full">
            <CreateIncidentForm onSuccessRedirectPath="/" />
          </div>
        </div>
      </main>

      {/* Subtle Footer */}
      <footer className="relative z-10 border-t border-emerald-900/30 bg-[#061c14]/60 backdrop-blur-sm py-6 text-center text-xs text-emerald-200/70 font-medium">
        <p>Gaia Wildlife Monitoring & Human-Wildlife Conflict Management System</p>
      </footer>
    </div>
  );
};

export default PublicReportIncident;
