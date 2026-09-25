import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { api } from "@/services/api";
import { EyeOff, Lock, Mail, User as UserIcon, Phone, MapPin, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";

interface Village {
  id: number;
  village_name: string;
  district?: string;
  state?: string;
}

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const prefill = location.state?.prefill || {};

  const [fullName, setFullName] = useState(prefill.full_name || "");
  const [email, setEmail] = useState(prefill.email || "");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  interface StateObj {
    id: number;
    state_name: string;
  }

  interface DistrictObj {
    id: number;
    district_name: string;
    state_id: number;
  }

  const [villageId, setVillageId] = useState<number | "">("");
  const [showPassword, setShowPassword] = useState(false);

  const [states, setStates] = useState<StateObj[]>([]);
  const [districts, setDistricts] = useState<DistrictObj[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);

  const [selectedStateId, setSelectedStateId] = useState<number | "">("");
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | "">("");

  const [isLoadingStates, setIsLoadingStates] = useState(false);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingVillages, setIsLoadingVillages] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatesList = async () => {
      setIsLoadingStates(true);
      try {
        const data = await api.getStates();
        setStates(data);
      } catch (err) {
        console.error("Failed to load states", err);
      } finally {
        setIsLoadingStates(false);
      }
    };
    fetchStatesList();
  }, []);

  useEffect(() => {
    if (!selectedStateId) {
      setDistricts([]);
      setSelectedDistrictId("");
      setVillages([]);
      setVillageId("");
      return;
    }
    const fetchDistrictsList = async () => {
      setIsLoadingDistricts(true);
      try {
        const data = await api.getDistricts(selectedStateId);
        setDistricts(data);
        setSelectedDistrictId("");
        setVillages([]);
        setVillageId("");
      } catch (err) {
        console.error("Failed to load districts", err);
      } finally {
        setIsLoadingDistricts(false);
      }
    };
    fetchDistrictsList();
  }, [selectedStateId]);

  useEffect(() => {
    if (!selectedDistrictId) {
      setVillages([]);
      setVillageId("");
      return;
    }
    const fetchVillagesList = async () => {
      setIsLoadingVillages(true);
      try {
        const data = await api.getVillages(selectedDistrictId);
        setVillages(data);
        setVillageId("");
      } catch (err) {
        console.error("Failed to load villages", err);
      } finally {
        setIsLoadingVillages(false);
      }
    };
    fetchVillagesList();
  }, [selectedDistrictId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!selectedStateId) {
      setError("Please select your state.");
      return;
    }

    if (!selectedDistrictId) {
      setError("Please select your district.");
      return;
    }

    if (!villageId) {
      setError("Please select your village.");
      return;
    }

    setIsSubmitting(true);

    try {
      await api.registerVillager({
        full_name: fullName,
        email,
        phone,
        password,
        village_id: Number(villageId),
      });

      // Redirect directly to Pending Approval Page
      navigate("/pending-approval", { replace: true });
    } catch (err: any) {
      setError(err.message || "Registration failed. Please check your information.");
    } finally {
      setIsSubmitting(false);
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
          src="/images/nature5.jpg"
          alt="Cinematic Forest"
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
              JOIN GAIA
            </span>
            <h1 className="text-4xl lg:text-5xl xl:text-[56px] font-serif font-bold text-white tracking-wide leading-[1.1] drop-shadow-lg max-w-lg">
              Be part of a smarter approach to wildlife protection.
            </h1>
            <p className="text-[15px] lg:text-[17px] font-light text-[#E0E5E2] max-w-md leading-relaxed drop-shadow-md">
              Report human-wildlife conflicts and help connect communities with forest response teams.
            </p>
            <div className="pt-8">
              <span className="text-[10px] lg:text-[11px] font-bold text-[#A8ADA8] uppercase tracking-[0.2em] drop-shadow-md">
                COMMUNITY • REPORTING • CONSERVATION
              </span>
            </div>
          </div>
        </div>

        {/* MOBILE VISUAL TEXT */}
        <div className="flex md:hidden relative w-full pt-10 pb-4 px-8 flex-col shrink-0">
          <span className="text-3xl font-serif font-bold text-white tracking-wide drop-shadow-md">JOIN GAIA</span>
        </div>

        {/* RIGHT PANEL: Auth Form */}
        <div className="w-full md:w-[55%] lg:w-[50%] h-full flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16 overflow-y-auto">
          <div className="w-full max-w-[560px] animate-fade-in-up" style={{ animationDelay: '0.1s' }}>

            <div className="mb-8 text-center md:text-left">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#A8ADA8] mb-3 block">Create Account</span>
              <h2 className="text-3xl lg:text-[34px] font-serif font-bold text-white tracking-tight">Register for Gaia</h2>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-md bg-red-900/20 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Full Name */}
                <div className="group">
                  <label htmlFor="fullName" className="block text-[14px] font-medium text-[#E0E5E2] mb-1.5 drop-shadow-sm">
                    Full Name
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="fullName"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your name"
                      data-testid="register-full-name"
                      className="w-full pl-4 pr-10 h-[52px] rounded-lg bg-gradient-to-br from-[#FAFCFB] to-[#F0F6F3] border border-[#A8ADA8]/40 text-[#151A18] text-[15px] focus:outline-none focus:border-[#3FBF7F] focus:ring-[2px] focus:ring-[#3FBF7F]/30 transition-all placeholder:text-[#65726B] shadow-sm"
                    />
                    <UserIcon className="w-[18px] h-[18px] text-[#65726B] group-focus-within:text-[#3FBF7F] absolute right-4 shrink-0 transition-colors pointer-events-none" />
                  </div>
                </div>

                {/* Phone Number */}
                <div className="group">
                  <label htmlFor="phone" className="block text-[14px] font-medium text-[#E0E5E2] mb-1.5 drop-shadow-sm">
                    Phone Number
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Your mobile number"
                      data-testid="register-phone"
                      className="w-full pl-4 pr-10 h-[52px] rounded-lg bg-gradient-to-br from-[#FAFCFB] to-[#F0F6F3] border border-[#A8ADA8]/40 text-[#151A18] text-[15px] focus:outline-none focus:border-[#3FBF7F] focus:ring-[2px] focus:ring-[#3FBF7F]/30 transition-all placeholder:text-[#65726B] shadow-sm"
                    />
                    <Phone className="w-[18px] h-[18px] text-[#65726B] group-focus-within:text-[#3FBF7F] absolute right-4 shrink-0 transition-colors pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Email Address */}
              <div className="group">
                <label htmlFor="email" className="block text-[14px] font-medium text-[#E0E5E2] mb-1.5 drop-shadow-sm">
                  Email Address
                </label>
                <div className="relative flex items-center">
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    readOnly={!!prefill.email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    data-testid="register-email"
                    className={`w-full pl-4 pr-10 h-[52px] rounded-lg border text-[15px] focus:outline-none transition-all placeholder:text-[#65726B] shadow-sm ${prefill.email
                      ? 'bg-[#E3EBE7] border-[#A8ADA8]/20 text-[#65726B] cursor-not-allowed'
                      : 'bg-gradient-to-br from-[#FAFCFB] to-[#F0F6F3] border-[#A8ADA8]/40 text-[#151A18] focus:border-[#3FBF7F] focus:ring-[2px] focus:ring-[#3FBF7F]/30'
                      }`}
                  />
                  <Mail className="w-[18px] h-[18px] text-[#65726B] group-focus-within:text-[#3FBF7F] absolute right-4 shrink-0 transition-colors pointer-events-none" />
                </div>
              </div>

              {/* Location Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {/* State */}
                <div className="group">
                  <label htmlFor="state" className="block text-[14px] font-medium text-[#E0E5E2] mb-1.5 drop-shadow-sm">
                    State
                  </label>
                  <div className="relative flex items-center">
                    <select
                      id="state"
                      required
                      value={selectedStateId}
                      onChange={(e) => setSelectedStateId(e.target.value === "" ? "" : Number(e.target.value))}
                      disabled={isLoadingStates}
                      className="w-full pl-4 pr-10 h-[52px] rounded-lg bg-gradient-to-br from-[#FAFCFB] to-[#F0F6F3] border border-[#A8ADA8]/40 text-[#151A18] text-[15px] focus:outline-none focus:border-[#3FBF7F] focus:ring-[2px] focus:ring-[#3FBF7F]/30 transition-all appearance-none cursor-pointer shadow-sm [&>option]:bg-white"
                    >
                      <option value="">Select</option>
                      {!isLoadingStates && states.map((s) => (
                        <option key={s.id} value={s.id}>{s.state_name}</option>
                      ))}
                    </select>
                    <MapPin className="w-[18px] h-[18px] text-[#65726B] group-focus-within:text-[#3FBF7F] absolute right-4 shrink-0 pointer-events-none transition-colors" />
                  </div>
                </div>

                {/* District */}
                <div className="group">
                  <label htmlFor="district" className="block text-[14px] font-medium text-[#E0E5E2] mb-1.5 drop-shadow-sm">
                    District
                  </label>
                  <div className="relative flex items-center">
                    <select
                      id="district"
                      required
                      value={selectedDistrictId}
                      onChange={(e) => setSelectedDistrictId(e.target.value === "" ? "" : Number(e.target.value))}
                      disabled={isLoadingDistricts || !selectedStateId}
                      className="w-full pl-4 pr-10 h-[52px] rounded-lg bg-gradient-to-br from-[#FAFCFB] to-[#F0F6F3] border border-[#A8ADA8]/40 text-[#151A18] text-[15px] focus:outline-none focus:border-[#3FBF7F] focus:ring-[2px] focus:ring-[#3FBF7F]/30 transition-all appearance-none shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed [&>option]:bg-white"
                    >
                      <option value="">Select</option>
                      {!isLoadingDistricts && districts.map((d) => (
                        <option key={d.id} value={d.id}>{d.district_name}</option>
                      ))}
                    </select>
                    <MapPin className="w-[18px] h-[18px] text-[#65726B] group-focus-within:text-[#3FBF7F] absolute right-4 shrink-0 pointer-events-none transition-colors" />
                  </div>
                </div>

                {/* Village */}
                <div className="group">
                  <label htmlFor="village" className="block text-[14px] font-medium text-[#E0E5E2] mb-1.5 drop-shadow-sm">
                    Village
                  </label>
                  <div className="relative flex items-center">
                    <select
                      id="village"
                      required
                      value={villageId}
                      onChange={(e) => setVillageId(e.target.value === "" ? "" : Number(e.target.value))}
                      disabled={isLoadingVillages || !selectedDistrictId}
                      className="w-full pl-4 pr-10 h-[52px] rounded-lg bg-gradient-to-br from-[#FAFCFB] to-[#F0F6F3] border border-[#A8ADA8]/40 text-[#151A18] text-[15px] focus:outline-none focus:border-[#3FBF7F] focus:ring-[2px] focus:ring-[#3FBF7F]/30 transition-all appearance-none shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed [&>option]:bg-white"
                    >
                      <option value="">Select</option>
                      {!isLoadingVillages && villages.map((v) => (
                        <option key={v.id} value={v.id}>{v.village_name}</option>
                      ))}
                    </select>
                    <MapPin className="w-[18px] h-[18px] text-[#65726B] group-focus-within:text-[#3FBF7F] absolute right-4 shrink-0 pointer-events-none transition-colors" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Password */}
                <div className="group">
                  <label htmlFor="password" className="block text-[14px] font-medium text-[#E0E5E2] mb-1.5 drop-shadow-sm">
                    Password
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      data-testid="register-password"
                      className="w-full pl-4 pr-12 h-[52px] rounded-lg bg-gradient-to-br from-[#FAFCFB] to-[#F0F6F3] border border-[#A8ADA8]/40 text-[#151A18] text-[15px] focus:outline-none focus:border-[#3FBF7F] focus:ring-[2px] focus:ring-[#3FBF7F]/30 transition-all placeholder:text-[#65726B] shadow-sm"
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

                {/* Confirm Password */}
                <div className="group">
                  <label htmlFor="confirmPassword" className="block text-[14px] font-medium text-[#E0E5E2] mb-1.5 drop-shadow-sm">
                    Confirm Password
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      data-testid="register-confirm-password"
                      className="w-full pl-4 pr-12 h-[52px] rounded-lg bg-gradient-to-br from-[#FAFCFB] to-[#F0F6F3] border border-[#A8ADA8]/40 text-[#151A18] text-[15px] focus:outline-none focus:border-[#3FBF7F] focus:ring-[2px] focus:ring-[#3FBF7F]/30 transition-all placeholder:text-[#65726B] shadow-sm"
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
              </div>

              {/* Register Button & Account Link Container */}
              <div className="w-full max-w-[400px] mx-auto pt-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  data-testid="register-submit"
                  className="w-full flex items-center justify-center gap-3 h-[54px] rounded-lg bg-[#3FBF7F] hover:bg-[#4dd38f] text-[#090D0B] font-semibold text-[15px] transition-all duration-200 disabled:opacity-70 group shadow-lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-[18px] h-[18px] animate-spin text-[#090D0B]" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      CREATE ACCOUNT
                      <ArrowRight className="w-[18px] h-[18px] group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="w-full max-w-[400px] mx-auto mt-8 text-center drop-shadow-sm">
              <span className="text-[14px] text-[#E0E5E2]">
                Already have an account?{" "}
              </span>
              <Link to="/login" className="text-[14px] font-semibold text-[#3FBF7F] hover:text-[#4dd38f] transition-colors">
                Login
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
