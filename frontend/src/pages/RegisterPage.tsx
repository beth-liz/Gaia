import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthHeader } from "@/components/AuthHeader";
import { api } from "@/services/api";
import { Eye, EyeOff, Lock, Mail, User as UserIcon, Phone, MapPin, ArrowRight, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";

interface Village {
  id: number;
  village_name: string;
  district?: string;
  state?: string;
}

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [villageId, setVillageId] = useState<number | "">("");
  const [showPassword, setShowPassword] = useState(false);

  const [villages, setVillages] = useState<Village[]>([]);
  const [isLoadingVillages, setIsLoadingVillages] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVillagesList = async () => {
      try {
        const data = await api.getVillages();
        setVillages(data);
        if (data.length > 0) {
          setVillageId(data[0].id);
        }
      } catch (err: any) {
        console.error("Failed to load villages", err);
      } finally {
        setIsLoadingVillages(false);
      }
    };
    fetchVillagesList();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!villageId) {
      setError("Please select your village from the dropdown.");
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

      // Redirect directly to Pending Approval Page as required
      navigate("/pending-approval", { replace: true });
    } catch (err: any) {
      setError(err.message || "Registration failed. Please check your information.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fdfbf7] via-[#f7f4eb] to-[#eef5ef] flex flex-col justify-center pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <AuthHeader />

      <div className="max-w-5xl w-full mx-auto grid grid-cols-1 md:grid-cols-12 rounded-3xl overflow-hidden shadow-2xl border border-emerald-900/10 bg-white">
        {/* Left Side: Wildlife Illustration / Information */}
        <div className="md:col-span-5 relative hidden md:flex flex-col justify-between p-8 bg-emerald-950 text-white overflow-hidden">
          <img
            src="/images/elephant1.jpg"
            alt="Gaia Villager Protection"
            className="absolute inset-0 w-full h-full object-cover opacity-45 mix-blend-luminosity"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/65 to-transparent" />

          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800/80 text-amber-300 text-xs font-semibold tracking-wider uppercase backdrop-blur-md border border-emerald-700/50">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Villager Registration
            </span>
          </div>

          <div className="relative z-10 space-y-4">
            <h3 className="text-2xl font-bold tracking-tight text-white">Join Your Local Alert System</h3>
            <p className="text-xs text-emerald-200/90 leading-relaxed">
              Villagers can report wildlife sightings, track incident resolutions in real time, and receive instant alert notifications from Range Forest Officers.
            </p>
            <div className="p-3.5 rounded-2xl bg-emerald-900/60 backdrop-blur-md border border-emerald-700/40 text-xs text-emerald-100 space-y-1">
              <p className="font-semibold text-amber-300">Approval Requirement:</p>
              <p className="text-[11px] leading-tight text-emerald-200">
                Newly registered accounts require administrator verification prior to accessing the dashboard.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Registration Form */}
        <div className="md:col-span-7 p-8 sm:p-10 flex flex-col justify-center">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-emerald-950 tracking-tight">Register Villager Account</h2>
            <p className="text-sm text-emerald-900/70 mt-1">Connect with your forest range officer network</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            <div>
              <label className="block text-xs font-semibold text-emerald-950 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-emerald-700 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ramesh Varma"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-emerald-50/50 border border-emerald-900/15 text-emerald-950 text-sm placeholder:text-emerald-900/40 focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-emerald-950 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-emerald-700 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ramesh@gmail.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-emerald-50/50 border border-emerald-900/15 text-emerald-950 text-sm placeholder:text-emerald-900/40 focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-950 uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-emerald-700 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-emerald-50/50 border border-emerald-900/15 text-emerald-950 text-sm placeholder:text-emerald-900/40 focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-emerald-950 uppercase tracking-wider mb-1.5">
                Village (Loaded from Database)
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-emerald-700 absolute left-3.5 top-1/2 -translate-y-1/2 z-10 pointer-events-none" />
                <select
                  required
                  value={villageId}
                  onChange={(e) => setVillageId(Number(e.target.value))}
                  disabled={isLoadingVillages}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-emerald-50/50 border border-emerald-900/15 text-emerald-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:bg-white transition-all appearance-none cursor-pointer"
                >
                  {isLoadingVillages ? (
                    <option value="">Loading Villages from DB...</option>
                  ) : (
                    villages.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.village_name} ({v.district}, {v.state})
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-emerald-950 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-emerald-700 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-emerald-50/50 border border-emerald-900/15 text-emerald-950 text-sm placeholder:text-emerald-900/40 focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-950 uppercase tracking-wider mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-emerald-700 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-emerald-50/50 border border-emerald-900/15 text-emerald-950 text-sm placeholder:text-emerald-900/40 focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-700 hover:text-emerald-950 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-emerald-900 hover:bg-emerald-950 text-white font-semibold shadow-lg shadow-emerald-950/20 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-amber-300" />
                  Submitting Registration...
                </>
              ) : (
                <>
                  Submit Account Request
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-emerald-900/70">
              Already have an account?{" "}
              <Link to="/login" className="font-bold text-emerald-800 hover:text-emerald-950 underline underline-offset-4">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
