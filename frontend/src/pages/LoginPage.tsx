import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Leaf, Eye, EyeOff, Lock, Mail, ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function LoginPage() {
  const navigate = useNavigate()
  const [role, setRole] = useState<"admin" | "officer" | "villager">("admin")
  const [username, setUsername] = useState("admin@gaia.io")
  const [password, setPassword] = useState("••••••••••••")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    localStorage.setItem("authToken", "sample-token")
    localStorage.setItem("userRole", role)

    if (role === "admin") navigate("/admin/dashboard")
    else if (role === "officer") navigate("/officer/dashboard")
    else navigate("/villager/dashboard")
  }

  const roleDefaults = {
    admin: "admin@gaia.io",
    officer: "officer.marcus@gaia.io",
    villager: "resident.raman@gaia.io"
  }

  return (
    <div className="min-h-screen bg-[#0b2316] text-slate-900 font-sans antialiased flex items-center justify-center p-0 lg:p-6">
      
      {/* Main Split Container */}
      <div className="w-full max-w-5xl bg-white rounded-none lg:rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px] border border-[#123c27]/20">
        
        {/* Left Side: Wildlife Image & Platform Vision (6 Cols on large screens) */}
        <div className="lg:col-span-6 relative bg-[#0b2316] text-white p-8 lg:p-12 flex flex-col justify-between overflow-hidden hidden md:flex">
          
          {/* Background Wildlife Image */}
          <div className="absolute inset-0 z-0">
            <img 
              src="/images/nature2.jpg" 
              alt="Gaia Nature" 
              className="w-full h-full object-cover opacity-45 scale-105 transition duration-700 hover:scale-100"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b2316] via-[#0b2316]/60 to-transparent" />
          </div>

          {/* Top Brand Logo */}
          <div className="relative z-10 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#10b981] to-[#059669] text-white flex items-center justify-center font-bold shadow-lg">
              <Leaf className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-extrabold tracking-tight text-white font-sans">gaia</span>
              <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-widest -mt-1">
                Wildlife Platform
              </span>
            </div>
          </div>

          {/* Middle Vision Quote */}
          <div className="relative z-10 space-y-4 my-auto py-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#10b981]/20 border border-[#10b981]/30 text-emerald-300 text-xs font-bold">
              <Sparkles className="h-3.5 w-3.5" /> Next-Gen Nature SaaS
            </div>
            <h2 className="text-2xl lg:text-3xl font-extrabold text-white leading-tight tracking-tight">
              Harmonizing Human Settlements & Wildlife Corridors.
            </h2>
            <p className="text-xs lg:text-sm text-slate-300 leading-relaxed max-w-md">
              Real-time telemetry monitoring, automated SOS conflict alerts, and field ranger dispatch in one seamless platform.
            </p>

            <div className="pt-4 grid grid-cols-2 gap-4 border-t border-white/10 text-xs">
              <div>
                <p className="text-xl font-extrabold text-emerald-400 font-mono">99.4%</p>
                <p className="text-[11px] text-slate-300">Conflict Mitigation SLA</p>
              </div>
              <div>
                <p className="text-xl font-extrabold text-white font-mono">24 / 7</p>
                <p className="text-[11px] text-slate-300">Automated Early Warning</p>
              </div>
            </div>
          </div>

          {/* Bottom Footer Note */}
          <div className="relative z-10 text-[11px] text-slate-400 font-medium">
            © 2026 Gaia Platform Inc. All rights reserved.
          </div>

        </div>

        {/* Right Side: Modern SaaS Authentication Card (6 Cols) */}
        <div className="lg:col-span-6 p-6 sm:p-10 lg:p-12 bg-white flex flex-col justify-center space-y-6">
          
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Welcome back</h2>
            <p className="text-xs text-slate-500 font-medium">
              Please enter your credentials to access your portal.
            </p>
          </div>

          {/* Role Selection Tabs */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Select Account Role</label>
            <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs">
              {(["admin", "officer", "villager"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => { setRole(r); setUsername(roleDefaults[r]) }}
                  className={`py-2 px-2 font-bold rounded-xl capitalize transition-all duration-200 ${
                    role === r 
                      ? "bg-white text-slate-900 shadow-sm border border-slate-200" 
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input 
                  type="email" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 font-medium transition"
                  required 
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="font-bold text-slate-700">Password</label>
                <a href="#forgot" onClick={(e) => { e.preventDefault(); alert("Password reset link sent to your registered email.") }} className="text-[11px] font-bold text-[#10b981] hover:underline">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input 
                  type={showPassword ? "text" : "password"}
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 font-medium transition"
                  required 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center space-x-2 pt-1">
              <input 
                type="checkbox" 
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-[#10b981] focus:ring-[#10b981] border-slate-300"
              />
              <label htmlFor="remember" className="text-xs text-slate-600 font-medium cursor-pointer">
                Remember me for 30 days
              </label>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              size="lg" 
              className="w-full bg-gradient-to-r from-[#0b2316] via-[#123c27] to-[#10b981] text-white hover:opacity-95 shadow-md font-bold h-11 rounded-2xl transition-all duration-200 mt-2"
            >
              Sign In to Gaia <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>

          </form>

          {/* Footer Register Link */}
          <p className="text-center text-xs text-slate-500 pt-2 font-medium">
            Don't have an account?{" "}
            <Link to="/register" className="font-extrabold text-[#10b981] hover:underline">
              Create an account
            </Link>
          </p>

        </div>

      </div>

    </div>
  )
}
