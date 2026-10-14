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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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

  const validateForm = () => {
    const errors: Record<string, string> = {};

    // Full name validation
    const trimmedName = fullName.trim().replace(/\s+/g, " ");
    if (!trimmedName) {
      errors.fullName = "Full name is required.";
    } else if (trimmedName.length < 2) {
      errors.fullName = "Full name must be at least 2 characters.";
    } else if (trimmedName.length > 100) {
      errors.fullName = "Full name cannot exceed 100 characters.";
    } else {
      // Allow alphabetic characters (including accented and international Unicode letters) and spaces only
      const nameRegex = /^[\p{L}\s]+$/u;
      if (!nameRegex.test(trimmedName)) {
        errors.fullName = "Full name must contain letters and spaces only. Digits and special characters are not allowed.";
      }
    }

    // Phone validation
    const trimmedPhone = phone.trim();
    if (!trimmedPhone) {
      errors.phone = "Phone number is required.";
    } else {
      const phoneDigits = trimmedPhone.replace(/\D/g, "");
      if (trimmedPhone.startsWith("+")) {
        if (!/^\+\d{10,15}$/.test(trimmedPhone)) {
          errors.phone = "Invalid international phone format. (e.g. +919876543210)";
        }
      } else if (!/^\d{10,15}$/.test(trimmedPhone)) {
        errors.phone = "Phone number must contain digits only.";
      }

      if (!errors.phone) {
        if (phoneDigits.length === 10) {
          if (!["6", "7", "8", "9"].includes(phoneDigits[0])) {
            errors.phone = "10-digit mobile number must start with 6, 7, 8, or 9.";
          }
        } else if (phoneDigits.length === 12 && phoneDigits.startsWith("91")) {
          if (!["6", "7", "8", "9"].includes(phoneDigits[2])) {
            errors.phone = "Indian mobile number must start with 6, 7, 8, or 9.";
          }
        } else {
          errors.phone = "Please enter a valid 10-digit mobile number (e.g. 9876543210).";
        }
      }
    }

    // Email validation
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      errors.email = "Email address is required.";
    } else {
      const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
      if (!emailRegex.test(trimmedEmail)) {
        errors.email = "Please enter a valid email address (e.g. name@example.com).";
      }
    }

    // Password validation
    if (!password) {
      errors.password = "Password is required.";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters long.";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Confirm password is required.";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }

    // Location selection
    if (!selectedStateId) {
      errors.state = "Please select your state.";
    }
    if (!selectedDistrictId) {
      errors.district = "Please select your district.";
    }
    if (!villageId) {
      errors.village = "Please select your village.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const trimmedName = fullName.trim().replace(/\s+/g, " ");
      const normalizedPhone = phone.trim().replace(/\D/g, "");
      const finalPhone = normalizedPhone.length === 12 && normalizedPhone.startsWith("91") ? normalizedPhone.slice(2) : normalizedPhone;

      await api.registerVillager({
        full_name: trimmedName,
        email: email.trim().toLowerCase(),
        phone: finalPhone,
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
              {/* Fake hidden input traps to discourage browser password manager autofill */}
              <input type="text" name="fake_username_register" style={{ display: "none" }} tabIndex={-1} aria-hidden="true" autoComplete="off" />
              <input type="password" name="fake_password_register" style={{ display: "none" }} tabIndex={-1} aria-hidden="true" autoComplete="off" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Full Name */}
                <div className="group">
                  <label htmlFor="fullName" className="block text-[14px] font-medium text-[#E0E5E2] mb-1.5 drop-shadow-sm">
                    Full Name *
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="fullName"
                      name="gaia_reg_fullname"
                      type="text"
                      required
                      autoComplete="off"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        if (fieldErrors.fullName) setFieldErrors(prev => ({ ...prev, fullName: "" }));
                      }}
                      placeholder="Enter your name"
                      data-testid="register-full-name"
                      className={`w-full pl-4 pr-10 h-[52px] rounded-lg bg-gradient-to-br from-[#FAFCFB] to-[#F0F6F3] border ${
                        fieldErrors.fullName ? 'border-red-500 ring-1 ring-red-500/50' : 'border-[#A8ADA8]/40'
                      } text-[#151A18] text-[15px] focus:outline-none focus:border-[#3FBF7F] focus:ring-[2px] focus:ring-[#3FBF7F]/30 transition-all placeholder:text-[#65726B] shadow-sm`}
                    />
                    <UserIcon className="w-[18px] h-[18px] text-[#65726B] group-focus-within:text-[#3FBF7F] absolute right-4 shrink-0 transition-colors pointer-events-none" />
                  </div>
                  {fieldErrors.fullName && (
                    <p className="mt-1.5 text-xs text-red-400 font-medium">{fieldErrors.fullName}</p>
                  )}
                </div>

                {/* Phone Number */}
                <div className="group">
                  <label htmlFor="phone" className="block text-[14px] font-medium text-[#E0E5E2] mb-1.5 drop-shadow-sm">
                    Phone Number *
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="phone"
                      name="gaia_reg_phone"
                      type="tel"
                      required
                      autoComplete="off"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (fieldErrors.phone) setFieldErrors(prev => ({ ...prev, phone: "" }));
                      }}
                      placeholder="10-digit mobile number"
                      data-testid="register-phone"
                      className={`w-full pl-4 pr-10 h-[52px] rounded-lg bg-gradient-to-br from-[#FAFCFB] to-[#F0F6F3] border ${
                        fieldErrors.phone ? 'border-red-500 ring-1 ring-red-500/50' : 'border-[#A8ADA8]/40'
                      } text-[#151A18] text-[15px] focus:outline-none focus:border-[#3FBF7F] focus:ring-[2px] focus:ring-[#3FBF7F]/30 transition-all placeholder:text-[#65726B] shadow-sm`}
                    />
                    <Phone className="w-[18px] h-[18px] text-[#65726B] group-focus-within:text-[#3FBF7F] absolute right-4 shrink-0 transition-colors pointer-events-none" />
                  </div>
                  {fieldErrors.phone && (
                    <p className="mt-1.5 text-xs text-red-400 font-medium">{fieldErrors.phone}</p>
                  )}
                </div>
              </div>

              {/* Email Address */}
              <div className="group">
                <label htmlFor="email" className="block text-[14px] font-medium text-[#E0E5E2] mb-1.5 drop-shadow-sm">
                  Email Address *
                </label>
                <div className="relative flex items-center">
                  <input
                    id="email"
                    name="gaia_reg_email"
                    type="email"
                    required
                    autoComplete="off"
                    value={email}
                    readOnly={!!prefill.email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: "" }));
                    }}
                    placeholder="email@example.com"
                    data-testid="register-email"
                    className={`w-full pl-4 pr-10 h-[52px] rounded-lg border text-[15px] focus:outline-none transition-all placeholder:text-[#65726B] shadow-sm ${
                      fieldErrors.email
                        ? 'border-red-500 ring-1 ring-red-500/50 bg-[#FAFCFB] text-[#151A18]'
                        : prefill.email
                        ? 'bg-[#E3EBE7] border-[#A8ADA8]/20 text-[#65726B] cursor-not-allowed'
                        : 'bg-gradient-to-br from-[#FAFCFB] to-[#F0F6F3] border-[#A8ADA8]/40 text-[#151A18] focus:border-[#3FBF7F] focus:ring-[2px] focus:ring-[#3FBF7F]/30'
                    }`}
                  />
                  <Mail className="w-[18px] h-[18px] text-[#65726B] group-focus-within:text-[#3FBF7F] absolute right-4 shrink-0 transition-colors pointer-events-none" />
                </div>
                {fieldErrors.email && (
                  <p className="mt-1.5 text-xs text-red-400 font-medium">{fieldErrors.email}</p>
                )}
              </div>

              {/* Location Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {/* State */}
                <div className="group">
                  <label htmlFor="state" className="block text-[14px] font-medium text-[#E0E5E2] mb-1.5 drop-shadow-sm">
                    State *
                  </label>
                  <div className="relative flex items-center">
                    <select
                      id="state"
                      name="gaia_reg_state"
                      required
                      value={selectedStateId}
                      onChange={(e) => {
                        setSelectedStateId(e.target.value === "" ? "" : Number(e.target.value));
                        if (fieldErrors.state) setFieldErrors(prev => ({ ...prev, state: "" }));
                      }}
                      disabled={isLoadingStates}
                      className={`w-full pl-4 pr-10 h-[52px] rounded-lg bg-gradient-to-br from-[#FAFCFB] to-[#F0F6F3] border ${
                        fieldErrors.state ? 'border-red-500 ring-1 ring-red-500/50' : 'border-[#A8ADA8]/40'
                      } text-[#151A18] text-[15px] focus:outline-none focus:border-[#3FBF7F] focus:ring-[2px] focus:ring-[#3FBF7F]/30 transition-all appearance-none cursor-pointer shadow-sm [&>option]:bg-white`}
                    >
                      <option value="">Select</option>
                      {!isLoadingStates && states.map((s) => (
                        <option key={s.id} value={s.id}>{s.state_name}</option>
                      ))}
                    </select>
                    <MapPin className="w-[18px] h-[18px] text-[#65726B] group-focus-within:text-[#3FBF7F] absolute right-4 shrink-0 pointer-events-none transition-colors" />
                  </div>
                  {fieldErrors.state && (
                    <p className="mt-1.5 text-xs text-red-400 font-medium">{fieldErrors.state}</p>
                  )}
                </div>

                {/* District */}
                <div className="group">
                  <label htmlFor="district" className="block text-[14px] font-medium text-[#E0E5E2] mb-1.5 drop-shadow-sm">
                    District *
                  </label>
                  <div className="relative flex items-center">
                    <select
                      id="district"
                      name="gaia_reg_district"
                      required
                      value={selectedDistrictId}
                      onChange={(e) => {
                        setSelectedDistrictId(e.target.value === "" ? "" : Number(e.target.value));
                        if (fieldErrors.district) setFieldErrors(prev => ({ ...prev, district: "" }));
                      }}
                      disabled={isLoadingDistricts || !selectedStateId}
                      className={`w-full pl-4 pr-10 h-[52px] rounded-lg bg-gradient-to-br from-[#FAFCFB] to-[#F0F6F3] border ${
                        fieldErrors.district ? 'border-red-500 ring-1 ring-red-500/50' : 'border-[#A8ADA8]/40'
                      } text-[#151A18] text-[15px] focus:outline-none focus:border-[#3FBF7F] focus:ring-[2px] focus:ring-[#3FBF7F]/30 transition-all appearance-none shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed [&>option]:bg-white`}
                    >
                      <option value="">Select</option>
                      {!isLoadingDistricts && districts.map((d) => (
                        <option key={d.id} value={d.id}>{d.district_name}</option>
                      ))}
                    </select>
                    <MapPin className="w-[18px] h-[18px] text-[#65726B] group-focus-within:text-[#3FBF7F] absolute right-4 shrink-0 pointer-events-none transition-colors" />
                  </div>
                  {fieldErrors.district && (
                    <p className="mt-1.5 text-xs text-red-400 font-medium">{fieldErrors.district}</p>
                  )}
                </div>

                {/* Village */}
                <div className="group">
                  <label htmlFor="village" className="block text-[14px] font-medium text-[#E0E5E2] mb-1.5 drop-shadow-sm">
                    Village *
                  </label>
                  <div className="relative flex items-center">
                    <select
                      id="village"
                      name="gaia_reg_village"
                      required
                      value={villageId}
                      onChange={(e) => {
                        setVillageId(e.target.value === "" ? "" : Number(e.target.value));
                        if (fieldErrors.village) setFieldErrors(prev => ({ ...prev, village: "" }));
                      }}
                      disabled={isLoadingVillages || !selectedDistrictId}
                      className={`w-full pl-4 pr-10 h-[52px] rounded-lg bg-gradient-to-br from-[#FAFCFB] to-[#F0F6F3] border ${
                        fieldErrors.village ? 'border-red-500 ring-1 ring-red-500/50' : 'border-[#A8ADA8]/40'
                      } text-[#151A18] text-[15px] focus:outline-none focus:border-[#3FBF7F] focus:ring-[2px] focus:ring-[#3FBF7F]/30 transition-all appearance-none shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed [&>option]:bg-white`}
                    >
                      <option value="">Select</option>
                      {!isLoadingVillages && villages.map((v) => (
                        <option key={v.id} value={v.id}>{v.village_name}</option>
                      ))}
                    </select>
                    <MapPin className="w-[18px] h-[18px] text-[#65726B] group-focus-within:text-[#3FBF7F] absolute right-4 shrink-0 pointer-events-none transition-colors" />
                  </div>
                  {fieldErrors.village && (
                    <p className="mt-1.5 text-xs text-red-400 font-medium">{fieldErrors.village}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Password */}
                <div className="group">
                  <label htmlFor="password" className="block text-[14px] font-medium text-[#E0E5E2] mb-1.5 drop-shadow-sm">
                    Password *
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="password"
                      name="gaia_reg_password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: "" }));
                      }}
                      placeholder="••••••••"
                      data-testid="register-password"
                      className={`w-full pl-4 pr-12 h-[52px] rounded-lg bg-gradient-to-br from-[#FAFCFB] to-[#F0F6F3] border ${
                        fieldErrors.password ? 'border-red-500 ring-1 ring-red-500/50' : 'border-[#A8ADA8]/40'
                      } text-[#151A18] text-[15px] focus:outline-none focus:border-[#3FBF7F] focus:ring-[2px] focus:ring-[#3FBF7F]/30 transition-all placeholder:text-[#65726B] shadow-sm`}
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
                  {fieldErrors.password && (
                    <p className="mt-1.5 text-xs text-red-400 font-medium">{fieldErrors.password}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="group">
                  <label htmlFor="confirmPassword" className="block text-[14px] font-medium text-[#E0E5E2] mb-1.5 drop-shadow-sm">
                    Confirm Password *
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="confirmPassword"
                      name="gaia_reg_confirm_password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (fieldErrors.confirmPassword) setFieldErrors(prev => ({ ...prev, confirmPassword: "" }));
                      }}
                      placeholder="••••••••"
                      data-testid="register-confirm-password"
                      className={`w-full pl-4 pr-12 h-[52px] rounded-lg bg-gradient-to-br from-[#FAFCFB] to-[#F0F6F3] border ${
                        fieldErrors.confirmPassword ? 'border-red-500 ring-1 ring-red-500/50' : 'border-[#A8ADA8]/40'
                      } text-[#151A18] text-[15px] focus:outline-none focus:border-[#3FBF7F] focus:ring-[2px] focus:ring-[#3FBF7F]/30 transition-all placeholder:text-[#65726B] shadow-sm`}
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
                  {fieldErrors.confirmPassword && (
                    <p className="mt-1.5 text-xs text-red-400 font-medium">{fieldErrors.confirmPassword}</p>
                  )}
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
