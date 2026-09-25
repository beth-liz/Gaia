import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { EyeOff, Lock, Mail, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { Navbar } from "@/components/layout/Navbar";

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

      // Redirect logic
      const user = res.user;
      const roleLower = (user.role || "").toLowerCase();

      if (user.role === "Admin" || roleLower === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else if (user.role === "Forest Guard" || roleLower === "forest guard") {
        navigate("/guard/dashboard", { replace: true });
      } else if (
        user.role === "Range Forest Officer" ||
        user.role === "Officer" ||
        roleLower.includes("officer") ||
        roleLower.includes("ranger") ||
        user.designation_id ||
        user.station_id
      ) {
        navigate("/officer/dashboard", { replace: true });
      } else if (user.role === "Villager" || roleLower === "villager") {
        if (user.is_verified) {
          navigate("/villager/dashboard", { replace: true });
        } else {
          navigate("/pending-approval", { replace: true });
        }
      } else {
        navigate("/officer/dashboard", { replace: true });
      }
    } catch (err: any) {
      setError(err.message || "Failed to log in. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.googleSignIn(credentialResponse.credential);
      if (res.needs_registration) {
        navigate("/register", { state: { prefill: res.prefill }, replace: true });
        return;
      }
      login(res.access_token, res.user);
      navigate("/officer/incidents", { replace: true });
    } catch (err: any) {
      setError(err.message || "Google Sign-In failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="md:h-screen md:overflow-hidden bg-[#050806] text-[#F4F1EA] font-sans flex flex-col selection:bg-[#3FBF7F]/30 selection:text-white relative">
      <style>{`
        /* Strong override for Chrome Autofill */
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 50px #F4F9F6 inset !important;
          -webkit-text-fill-color: #151A18 !important;
          border: 1px solid #3FBF7F !important;
          border-radius: 0.5rem !important;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>

      {/* EXACT SAME HOME NAVBAR */}
      <Navbar forceSolid={true} />

      {/* FULL-SCREEN BACKGROUND IMAGE WITH GRADIENT OVERLAY */}
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
        <img
          src="/images/tiger3.jpg"
          alt="Cinematic Tiger"
          className="w-full h-full object-cover animate-[kenburns_20s_ease-out_forwards]"
        />
        {/* Gradient: Transparent on left, smoothly transitioning to solid dark on the right for the form */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#050806]/10 via-[#050806]/70 to-[#050806] md:to-[#050806]/95"></div>
      </div>

      {/* FOREGROUND CONTENT */}
      <div className="relative z-10 flex-1 flex flex-col md:flex-row mt-[76px] h-[calc(100vh-76px)] max-w-[1600px] mx-auto w-full">

        {/* LEFT PANEL: Text Content */}
        <div className="hidden md:flex relative w-[45%] lg:w-[50%] h-full flex-col justify-center px-12 lg:px-24">
          <div className="space-y-6 animate-fade-in-up">
            <span className="text-[11px] font-bold text-[#3FBF7F] uppercase tracking-[0.3em]">
              GAIA
            </span>
            <h1 className="text-4xl lg:text-5xl xl:text-[56px] font-serif font-bold text-white tracking-wide leading-[1.1] drop-shadow-lg max-w-lg">
              Technology that helps us understand and protect the wild.
            </h1>
            <p className="text-[15px] lg:text-[17px] font-light text-[#E0E5E2] max-w-md leading-relaxed drop-shadow-md">
              Connecting wildlife intelligence, field operations and conservation through one unified platform.
            </p>
            <div className="pt-8">
              <span className="text-[10px] lg:text-[11px] font-bold text-[#A8ADA8] uppercase tracking-[0.2em] drop-shadow-md">
                WILDLIFE • INTELLIGENCE • CONSERVATION
              </span>
            </div>
          </div>
        </div>

        {/* MOBILE VISUAL TEXT */}
        <div className="flex md:hidden relative w-full pt-10 pb-4 px-8 flex-col shrink-0">
          <span className="text-3xl font-serif font-bold text-white tracking-wide drop-shadow-md">GAIA</span>
        </div>

        {/* RIGHT PANEL: Auth Form */}
        <div className="w-full md:w-[55%] lg:w-[50%] h-full flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16 overflow-y-auto">
          <div className="w-full max-w-[400px] animate-fade-in-up" style={{ animationDelay: '0.1s' }}>

            <div className="mb-10 text-center md:text-left">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#A8ADA8] mb-3 block">Welcome back</span>
              <h2 className="text-3xl lg:text-[34px] font-serif font-bold text-white tracking-tight">Login to your Gaia account</h2>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-md bg-red-900/20 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">

              {/* Email Input */}
              <div className="group">
                <label htmlFor="email" className="block text-[14px] font-medium text-[#E0E5E2] mb-2 drop-shadow-sm">
                  Email
                </label>
                <div className="relative flex items-center">
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    data-testid="login-email"
                    className="w-full pl-4 pr-10 h-[54px] rounded-lg bg-gradient-to-br from-[#FAFCFB] to-[#F0F6F3] border border-[#A8ADA8]/40 text-[#151A18] text-[15px] focus:outline-none focus:border-[#3FBF7F] focus:ring-[2px] focus:ring-[#3FBF7F]/30 transition-all placeholder:text-[#65726B] shadow-md"
                  />
                  <Mail className="w-5 h-5 text-[#65726B] group-focus-within:text-[#3FBF7F] absolute right-4 shrink-0 transition-colors pointer-events-none" />
                </div>
              </div>

              {/* Password Input */}
              <div className="group">
                <label htmlFor="password" className="block text-[14px] font-medium text-[#E0E5E2] mb-2 drop-shadow-sm">
                  Password
                </label>
                <div className="relative flex items-center">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    data-testid="login-password"
                    className="w-full pl-4 pr-12 h-[54px] rounded-lg bg-gradient-to-br from-[#FAFCFB] to-[#F0F6F3] border border-[#A8ADA8]/40 text-[#151A18] text-[15px] focus:outline-none focus:border-[#3FBF7F] focus:ring-[2px] focus:ring-[#3FBF7F]/30 transition-all placeholder:text-[#65726B] shadow-md"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 shrink-0 text-[#65726B] hover:text-[#151A18] focus:outline-none transition-colors p-1"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Lock className="w-[18px] h-[18px]" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-[13.5px] pt-1 pb-1">
                <label className="flex items-center gap-2.5 text-[#E0E5E2] cursor-pointer hover:text-white transition-colors select-none drop-shadow-sm">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-[15px] h-[15px] rounded-sm text-[#3FBF7F] focus:ring-[#3FBF7F] border-white/20 bg-white/10 cursor-pointer"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); alert("Contact Admin at admin@gaia.com to reset password."); }}
                  className="text-[#E0E5E2] hover:text-white font-medium transition-colors drop-shadow-sm"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                data-testid="login-submit"
                className="w-full flex items-center justify-center gap-3 h-[54px] rounded-lg bg-[#3FBF7F] hover:bg-[#4dd38f] text-[#090D0B] font-semibold text-[15px] transition-all duration-200 disabled:opacity-70 group shadow-lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-[18px] h-[18px] animate-spin text-[#090D0B]" />
                    Signing in...
                  </>
                ) : (
                  <>
                    LOGIN
                    <ArrowRight className="w-[18px] h-[18px] group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* OR divider */}
            <div className="mt-7 mb-7 flex items-center justify-center">
              <div className="flex-1 h-[1px] bg-white/10"></div>
              <span className="px-4 text-[11px] font-semibold text-white/50 uppercase tracking-[0.15em]">OR</span>
              <div className="flex-1 h-[1px] bg-white/10"></div>
            </div>

            {/* Google Auth - Styled perfectly white with theme="outline" */}
            <div className="w-full flex justify-center bg-white rounded-lg" data-testid="google-login">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError("Google Sign-In failed.")}
                useOneTap
                theme="outline"
                size="large"
                text="signin_with"
                shape="rectangular"
                width="400"
              />
            </div>

            <div className="mt-8 text-center drop-shadow-sm">
              <span className="text-[14px] text-[#E0E5E2]">
                Don't have an account?{" "}
              </span>
              <Link to="/register" className="text-[14px] font-semibold text-[#3FBF7F] hover:text-[#4dd38f] transition-colors">
                Register
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
