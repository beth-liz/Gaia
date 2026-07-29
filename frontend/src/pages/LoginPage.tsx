import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthHeader } from "@/components/AuthHeader";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { Eye, EyeOff, Lock, Mail, ShieldCheck, ArrowRight, AlertCircle, Loader2 } from "lucide-react";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await api.login({ email, password });
      login(res.access_token, res.user);

      // Redirect based on role & verification
      const user = res.user;
      if (user.role === "Admin") {
        navigate("/admin/dashboard", { replace: true });
      } else if (user.role === "Range Forest Officer") {
        navigate("/officer/dashboard", { replace: true });
      } else if (user.role === "Forest Guard") {
        navigate("/guard/dashboard", { replace: true });
      } else if (user.role === "Villager") {
        if (user.is_verified) {
          navigate("/villager/dashboard", { replace: true });
        } else {
          navigate("/pending-approval", { replace: true });
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to log in. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fdfbf7] via-[#f7f4eb] to-[#eef5ef] flex flex-col justify-center pt-20 pb-10 px-4 sm:px-6 lg:px-8">
      <AuthHeader />

      <div className="max-w-4xl w-full mx-auto grid grid-cols-1 md:grid-cols-2 rounded-3xl overflow-hidden shadow-2xl border border-emerald-900/10 bg-white">
        {/* Left Side: Wildlife Illustration / Visual */}
        <div className="relative hidden md:flex flex-col justify-between p-8 bg-emerald-950 text-white overflow-hidden">
          <img
            src="/images/tiger1.jpg"
            alt="Gaia Wildlife Officer"
            className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-luminosity"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/60 to-transparent" />

          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800/80 text-amber-300 text-xs font-semibold tracking-wider uppercase backdrop-blur-md border border-emerald-700/50">
              <ShieldCheck className="w-3.5 h-3.5" />
              Secure Portal
            </span>
          </div>

          <div className="relative z-10 space-y-4">
            <blockquote className="text-xl font-medium tracking-tight text-emerald-50 leading-relaxed">
              "Protecting human lives and preserving wild ecosystems through intelligent operational workflows."
            </blockquote>
            <div className="pt-2 border-t border-emerald-800/50">
              <p className="text-sm font-semibold text-amber-300">Gaia Operations Command</p>
              <p className="text-xs text-emerald-300">Range Management & Village Alert System</p>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="p-8 sm:p-10 flex flex-col justify-center">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-emerald-950 tracking-tight">System Sign In</h2>
            <p className="text-sm text-emerald-900/70 mt-1">Access your Gaia operational dashboard</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-emerald-950 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-emerald-700 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@gaia.com or villager@gaia.com"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-emerald-50/50 border border-emerald-900/15 text-emerald-950 text-sm placeholder:text-emerald-900/40 focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-emerald-950 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-emerald-700 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-11 py-3 rounded-2xl bg-emerald-50/50 border border-emerald-900/15 text-emerald-950 text-sm placeholder:text-emerald-900/40 focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-700 hover:text-emerald-950 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-emerald-950 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-800 focus:ring-emerald-800 border-emerald-900/20"
                />
                Remember me
              </label>
              <a href="#forgot" onClick={(e) => { e.preventDefault(); alert("Contact Admin at admin@gaia.com to reset password."); }} className="text-emerald-800 hover:text-emerald-950 font-semibold">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-emerald-900 hover:bg-emerald-950 text-white font-semibold shadow-lg shadow-emerald-950/20 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-amber-300" />
                  Authenticating...
                </>
              ) : (
                <>
                  Sign In to Dashboard
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-emerald-900/10 text-center">
            <p className="text-xs text-emerald-900/70">
              Are you a local villager needing incident access?{" "}
              <Link to="/register" className="font-bold text-emerald-800 hover:text-emerald-950 underline underline-offset-4">
                Register New Villager Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
