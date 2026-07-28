import { Outlet, Link } from "react-router-dom"
import { Leaf, Check } from "lucide-react"

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row antialiased">
      {/* Left Side Banner (45%) */}
      <div className="relative md:w-[45%] bg-[#081c15] hidden md:flex flex-col justify-between p-12 text-white overflow-hidden shrink-0">
        {/* Background Image Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/images/nature5.jpg" 
            alt="Forest patrol" 
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#081c15] via-[#081c15]/50 to-transparent z-10" />
        </div>

        <div className="relative z-20">
          <Link to="/" className="flex items-center space-x-2.5">
            <Leaf className="h-6 w-6 text-emerald-455" />
            <span className="font-extrabold text-xl tracking-tight uppercase font-mono">Gaia</span>
          </Link>
        </div>

        <div className="relative z-20 space-y-6">
          <div className="space-y-3">
            <h1 className="text-3xl font-black tracking-tight leading-tight">
              Protecting Wildlife <br />Through Intelligence
            </h1>
            <p className="text-xs text-emerald-150 leading-relaxed font-semibold">
              Gaia integrates AI analytics grids, live telemetry, and instant ranger alerts to protect communities while keeping habitats secure.
            </p>
          </div>

          <div className="space-y-3.5 pt-4 border-t border-white/10">
            <div className="flex items-center space-x-2.5">
              <div className="p-1 bg-emerald-700/30 border border-emerald-500/20 text-emerald-400 rounded-md">
                <Check className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-extrabold text-emerald-100 uppercase tracking-wide">✓ AI Wildlife Detection</span>
            </div>

            <div className="flex items-center space-x-2.5">
              <div className="p-1 bg-emerald-700/30 border border-emerald-500/20 text-emerald-400 rounded-md">
                <Check className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-extrabold text-emerald-100 uppercase tracking-wide">✓ GIS Monitoring</span>
            </div>

            <div className="flex items-center space-x-2.5">
              <div className="p-1 bg-emerald-700/30 border border-emerald-500/20 text-emerald-400 rounded-md">
                <Check className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-extrabold text-emerald-100 uppercase tracking-wide">✓ Incident Management</span>
            </div>
          </div>
        </div>

        <div className="relative z-20 text-[10px] text-emerald-350/50 font-semibold uppercase tracking-widest">
          State Forest Department Command Cell
        </div>
      </div>

      {/* Right Side (55%) - Forms Outlet */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 overflow-y-auto bg-background">
        <div className="w-full max-w-[480px] bg-white border border-border rounded-2xl shadow-xs p-8 space-y-6 animate-in fade-in-0 duration-200">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
