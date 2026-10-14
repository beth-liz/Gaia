import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import { Mail, KeyRound, Lock, EyeOff, ArrowRight, AlertCircle, CheckCircle2, Loader2, ArrowLeft, RefreshCw } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";

type ResetStep = "REQUEST_CODE" | "VERIFY_CODE" | "SET_PASSWORD" | "SUCCESS";

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState<ResetStep>("REQUEST_CODE");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [resendCooldown, setResendCooldown] = useState<number>(0);

  // Handle countdown timer for resend
  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Step 1: Request Code
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setFieldErrors({ email: "Email address is required." });
      return;
    }

    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setFieldErrors({ email: "Please enter a valid email address." });
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.forgotPassword(trimmedEmail);
      setInfoMessage(res.message || "A verification code has been dispatched to your email address.");
      setStep("VERIFY_CODE");
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.message || "Failed to process password reset request.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify Code
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const trimmedCode = code.trim();
    if (!trimmedCode) {
      setFieldErrors({ code: "Verification code is required." });
      return;
    }
    if (!/^\d{6}$/.test(trimmedCode)) {
      setFieldErrors({ code: "Verification code must be exactly 6 digits." });
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.verifyResetCode(email.trim().toLowerCase(), trimmedCode);
      setResetToken(res.reset_token);
      setInfoMessage(res.message || "Verification code verified successfully.");
      setStep("SET_PASSWORD");
    } catch (err: any) {
      setError(err.message || "Invalid or expired verification code.");
    } finally {
      setIsLoading(false);
    }
  };

  // Resend Code
  const handleResendCode = async () => {
    if (resendCooldown > 0 || isLoading) return;
    setError(null);
    setIsLoading(true);
    try {
      const res = await api.forgotPassword(email.trim().toLowerCase());
      setInfoMessage(res.message || "A new verification code has been dispatched.");
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.message || "Failed to resend code.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Set New Password
  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const errors: Record<string, string> = {};
    if (!newPassword) {
      errors.newPassword = "New password is required.";
    } else if (newPassword.length < 6) {
      errors.newPassword = "Password must be at least 6 characters long.";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Confirm password is required.";
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.resetPassword({
        email: email.trim().toLowerCase(),
        reset_token: resetToken,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      setInfoMessage(res.message || "Password reset complete!");
      setStep("SUCCESS");
    } catch (err: any) {
      setError(err.message || "Failed to reset password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="md:h-screen md:overflow-hidden bg-[#050806] text-[#F4F1EA] font-sans flex flex-col selection:bg-[#3FBF7F]/30 selection:text-white relative">
      <Navbar forceSolid={true} />

      {/* FULL-SCREEN BACKGROUND IMAGE WITH GRADIENT OVERLAY */}
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
        <img
          src="/images/nature5.jpg"
          alt="Cinematic Forest"
          className="w-full h-full object-cover animate-[kenburns_20s_ease-out_forwards]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050806]/10 via-[#050806]/70 to-[#050806] md:to-[#050806]/95"></div>
      </div>

      {/* FOREGROUND CONTENT */}
      <div className="relative z-10 flex-1 flex flex-col md:flex-row mt-[76px] h-[calc(100vh-76px)] max-w-[1600px] mx-auto w-full">
        {/* LEFT PANEL */}
        <div className="hidden md:flex relative w-[45%] lg:w-[50%] h-full flex-col justify-center px-12 lg:px-24">
          <div className="space-y-6 animate-fade-in-up">
            <span className="text-[11px] font-bold text-[#3FBF7F] uppercase tracking-[0.3em]">
              SECURITY CONSOLE
            </span>
            <h1 className="text-4xl lg:text-5xl xl:text-[54px] font-serif font-bold text-white tracking-wide leading-[1.1] drop-shadow-lg max-w-lg">
              Recover access to your surveillance console.
            </h1>
            <p className="text-[15px] lg:text-[17px] font-light text-[#E0E5E2] max-w-md leading-relaxed drop-shadow-md">
              Gaia protected accounts utilize encrypted email verification codes to maintain operational integrity across wildlife sectors.
            </p>
          </div>
        </div>

        {/* RIGHT PANEL: Auth Form */}
        <div className="w-full md:w-[55%] lg:w-[50%] h-full flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16 overflow-y-auto">
          <div className="w-full max-w-[460px] animate-fade-in-up">
            <div className="mb-8 text-center md:text-left">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#A8ADA8] mb-3 block">
                Account Recovery
              </span>
              <h2 className="text-3xl lg:text-[34px] font-serif font-bold text-white tracking-tight">
                {step === "REQUEST_CODE" && "Reset Password"}
                {step === "VERIFY_CODE" && "Verify Email Code"}
                {step === "SET_PASSWORD" && "Set New Password"}
                {step === "SUCCESS" && "Password Reset Complete"}
              </h2>
              <p className="text-sm text-[#c4cdc8] mt-2">
                {step === "REQUEST_CODE" && "Enter your registered email address to receive a 6-digit security code."}
                {step === "VERIFY_CODE" && `We sent a 6-digit verification code to ${email}.`}
                {step === "SET_PASSWORD" && "Enter and confirm your new secure password."}
                {step === "SUCCESS" && "Your password has been updated. You can now log in."}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-md bg-red-900/20 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {infoMessage && step !== "SUCCESS" && (
              <div className="mb-6 p-4 rounded-md bg-emerald-900/20 border border-emerald-500/20 text-emerald-300 text-sm flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>{infoMessage}</span>
              </div>
            )}

            {/* STEP 1: REQUEST CODE */}
            {step === "REQUEST_CODE" && (
              <form onSubmit={handleRequestCode} className="space-y-6" autoComplete="off">
                <input type="text" name="fake_email_prevent" style={{ display: "none" }} tabIndex={-1} aria-hidden="true" autoComplete="off" />

                <div className="group">
                  <label htmlFor="email" className="block text-[14px] font-medium text-[#E0E5E2] mb-2 drop-shadow-sm">
                    Registered Email Address *
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="email"
                      name="gaia_reset_email"
                      type="email"
                      required
                      autoComplete="off"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: "" }));
                      }}
                      placeholder="name@example.com"
                      className={`w-full pl-4 pr-10 h-[54px] rounded-lg bg-gradient-to-br from-[#FAFCFB] to-[#F0F6F3] border ${
                        fieldErrors.email ? 'border-red-500 ring-1 ring-red-500/50' : 'border-[#A8ADA8]/40'
                      } text-[#151A18] text-[15px] focus:outline-none focus:border-[#3FBF7F] focus:ring-[2px] focus:ring-[#3FBF7F]/30 transition-all placeholder:text-[#65726B] shadow-md`}
                    />
                    <Mail className="w-5 h-5 text-[#65726B] group-focus-within:text-[#3FBF7F] absolute right-4 shrink-0 transition-colors pointer-events-none" />
                  </div>
                  {fieldErrors.email && (
                    <p className="mt-1.5 text-xs text-red-400 font-medium">{fieldErrors.email}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 h-[54px] rounded-lg bg-[#3FBF7F] hover:bg-[#4dd38f] text-[#090D0B] font-semibold text-[15px] transition-all duration-200 disabled:opacity-70 group shadow-lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-[18px] h-[18px] animate-spin text-[#090D0B]" />
                      Sending Verification Code...
                    </>
                  ) : (
                    <>
                      SEND VERIFICATION CODE
                      <ArrowRight className="w-[18px] h-[18px] group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* STEP 2: VERIFY CODE */}
            {step === "VERIFY_CODE" && (
              <form onSubmit={handleVerifyCode} className="space-y-6" autoComplete="off">
                <div className="group">
                  <label htmlFor="code" className="block text-[14px] font-medium text-[#E0E5E2] mb-2 drop-shadow-sm">
                    6-Digit Verification Code *
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="code"
                      name="gaia_reset_code"
                      type="text"
                      required
                      maxLength={6}
                      autoComplete="off"
                      value={code}
                      onChange={(e) => {
                        setCode(e.target.value.replace(/\D/g, ""));
                        if (fieldErrors.code) setFieldErrors(prev => ({ ...prev, code: "" }));
                      }}
                      placeholder="123456"
                      className={`w-full pl-4 pr-10 h-[54px] rounded-lg bg-gradient-to-br from-[#FAFCFB] to-[#F0F6F3] border ${
                        fieldErrors.code ? 'border-red-500 ring-1 ring-red-500/50' : 'border-[#A8ADA8]/40'
                      } text-[#151A18] text-center font-mono font-bold tracking-[0.3em] text-xl focus:outline-none focus:border-[#3FBF7F] focus:ring-[2px] focus:ring-[#3FBF7F]/30 transition-all placeholder:text-[#65726B] shadow-md`}
                    />
                    <KeyRound className="w-5 h-5 text-[#65726B] group-focus-within:text-[#3FBF7F] absolute right-4 shrink-0 transition-colors pointer-events-none" />
                  </div>
                  {fieldErrors.code && (
                    <p className="mt-1.5 text-xs text-red-400 font-medium">{fieldErrors.code}</p>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-[#E0E5E2]">
                  <button
                    type="button"
                    onClick={() => setStep("REQUEST_CODE")}
                    className="hover:text-white flex items-center gap-1 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Change Email
                  </button>

                  <button
                    type="button"
                    disabled={resendCooldown > 0 || isLoading}
                    onClick={handleResendCode}
                    className="hover:text-[#3FBF7F] transition-colors disabled:opacity-40 disabled:hover:text-inherit flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
                    {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend code"}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 h-[54px] rounded-lg bg-[#3FBF7F] hover:bg-[#4dd38f] text-[#090D0B] font-semibold text-[15px] transition-all duration-200 disabled:opacity-70 group shadow-lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-[18px] h-[18px] animate-spin text-[#090D0B]" />
                      Verifying Code...
                    </>
                  ) : (
                    <>
                      VERIFY CODE
                      <ArrowRight className="w-[18px] h-[18px] group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* STEP 3: SET NEW PASSWORD */}
            {step === "SET_PASSWORD" && (
              <form onSubmit={handleSetPassword} className="space-y-6" autoComplete="off">
                <input type="password" name="fake_password_trap" style={{ display: "none" }} tabIndex={-1} aria-hidden="true" autoComplete="off" />

                <div className="group">
                  <label htmlFor="newPassword" className="block text-[14px] font-medium text-[#E0E5E2] mb-2 drop-shadow-sm">
                    New Password *
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="newPassword"
                      name="gaia_new_password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (fieldErrors.newPassword) setFieldErrors(prev => ({ ...prev, newPassword: "" }));
                      }}
                      placeholder="••••••••••••"
                      className={`w-full pl-4 pr-12 h-[54px] rounded-lg bg-gradient-to-br from-[#FAFCFB] to-[#F0F6F3] border ${
                        fieldErrors.newPassword ? 'border-red-500 ring-1 ring-red-500/50' : 'border-[#A8ADA8]/40'
                      } text-[#151A18] text-[15px] focus:outline-none focus:border-[#3FBF7F] focus:ring-[2px] focus:ring-[#3FBF7F]/30 transition-all placeholder:text-[#65726B] shadow-md`}
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
                  {fieldErrors.newPassword && (
                    <p className="mt-1.5 text-xs text-red-400 font-medium">{fieldErrors.newPassword}</p>
                  )}
                </div>

                <div className="group">
                  <label htmlFor="confirmPassword" className="block text-[14px] font-medium text-[#E0E5E2] mb-2 drop-shadow-sm">
                    Confirm New Password *
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="confirmPassword"
                      name="gaia_confirm_new_password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (fieldErrors.confirmPassword) setFieldErrors(prev => ({ ...prev, confirmPassword: "" }));
                      }}
                      placeholder="••••••••••••"
                      className={`w-full pl-4 pr-12 h-[54px] rounded-lg bg-gradient-to-br from-[#FAFCFB] to-[#F0F6F3] border ${
                        fieldErrors.confirmPassword ? 'border-red-500 ring-1 ring-red-500/50' : 'border-[#A8ADA8]/40'
                      } text-[#151A18] text-[15px] focus:outline-none focus:border-[#3FBF7F] focus:ring-[2px] focus:ring-[#3FBF7F]/30 transition-all placeholder:text-[#65726B] shadow-md`}
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

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 h-[54px] rounded-lg bg-[#3FBF7F] hover:bg-[#4dd38f] text-[#090D0B] font-semibold text-[15px] transition-all duration-200 disabled:opacity-70 group shadow-lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-[18px] h-[18px] animate-spin text-[#090D0B]" />
                      Updating Password...
                    </>
                  ) : (
                    <>
                      SAVE NEW PASSWORD
                      <ArrowRight className="w-[18px] h-[18px] group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* STEP 4: SUCCESS */}
            {step === "SUCCESS" && (
              <div className="space-y-6 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <p className="text-[#E0E5E2] text-sm leading-relaxed">
                    Your password has been changed securely. You can now use your new password to access your Gaia account.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/login", { replace: true })}
                  className="w-full flex items-center justify-center gap-3 h-[54px] rounded-lg bg-[#3FBF7F] hover:bg-[#4dd38f] text-[#090D0B] font-semibold text-[15px] transition-all duration-200 shadow-lg"
                >
                  RETURN TO LOGIN
                  <ArrowRight className="w-[18px] h-[18px]" />
                </button>
              </div>
            )}

            {/* Return to Login link */}
            {step !== "SUCCESS" && (
              <div className="mt-8 text-center drop-shadow-sm">
                <Link to="/login" className="text-[14px] font-semibold text-[#3FBF7F] hover:text-[#4dd38f] transition-colors inline-flex items-center gap-1.5">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Login
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
