import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { User, Phone, Lock, Save, Camera, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();

  const [fullName, setFullName] = useState(user?.full_name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || "");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      setPhone(user.phone || "");
      setAvatarUrl(user.avatar_url || "");
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      await api.updateProfile({
        full_name: fullName,
        phone,
        avatar_url: avatarUrl,
        current_password: currentPassword || undefined,
        new_password: newPassword || undefined,
      });

      await refreshUser();
      setSuccessMsg("Profile updated successfully in database!");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white/80 p-6 rounded-3xl border border-emerald-950/10 shadow-sm">
        <h1 className="text-2xl font-bold text-emerald-950 tracking-tight">Account Settings & Profile</h1>
        <p className="text-xs text-emerald-900/70 mt-1">Manage your operational identity and password credentials</p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="gaia-card p-8 space-y-6">
        {/* Avatar Section */}
        <div className="flex items-center gap-6 pb-6 border-b border-emerald-950/10">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-emerald-900 text-amber-300 font-extrabold text-2xl flex items-center justify-center border-4 border-white shadow-lg overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                fullName.charAt(0).toUpperCase() || "U"
              )}
            </div>
          </div>
          <div>
            <h3 className="text-base font-bold text-emerald-950">{fullName || "User"}</h3>
            <p className="text-xs text-emerald-800/70">{user?.email}</p>
            <div className="mt-2 inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-[11px] font-bold border border-emerald-300">
              Role: {user?.designation_name || user?.role}
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800">Personal Information</h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-emerald-950 uppercase tracking-wider mb-1.5">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-emerald-700 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-emerald-50/50 border border-emerald-900/15 text-emerald-950 text-xs font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-950 uppercase tracking-wider mb-1.5">Phone Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-emerald-700 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-emerald-50/50 border border-emerald-900/15 text-emerald-950 text-xs font-semibold"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-emerald-950 uppercase tracking-wider mb-1.5">Avatar Image URL</label>
            <div className="relative">
              <Camera className="w-4 h-4 text-emerald-700 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="/images/nature1.jpg"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-emerald-50/50 border border-emerald-900/15 text-emerald-950 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Change Password Section */}
        <div className="space-y-4 pt-4 border-t border-emerald-950/10">
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800">Change Password (Optional)</h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-emerald-950 uppercase tracking-wider mb-1.5">Current Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-emerald-700 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-emerald-50/50 border border-emerald-900/15 text-emerald-950 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-950 uppercase tracking-wider mb-1.5">New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-emerald-700 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-emerald-50/50 border border-emerald-900/15 text-emerald-950 text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-emerald-900 hover:bg-emerald-950 text-white font-bold shadow-md transition-all hover:scale-[1.01]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-amber-300" />
              Saving Profile Updates...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 text-amber-300" />
              Save Profile Changes
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default ProfilePage;
