import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { getImageUrl } from "@/utils/imageUrl";
import { PageHeader } from "@/components/common/PageHeader";
import {
  User,
  Phone,
  Mail,
  Lock,
  Save,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MapPin,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";

const ProfilePage: React.FC = () => {
  const { user, refreshUser, updateUser } = useAuth();
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const isVillager = (user?.role || "").toLowerCase() === "villager";

  const [fullName, setFullName] = useState(user?.full_name || "");
  const [phone, setPhone] = useState(user?.phone || "");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      setPhone(user.phone || "");
    }
  }, [user]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please select a valid image file.");
      return;
    }

    try {
      setIsUploading(true);
      setErrorMsg(null);
      const formData = new FormData();
      formData.append("file", file);

      const updatedUser = await api.uploadProfileImage(formData);
      if (updatedUser) {
        updateUser(updatedUser);
      }
      await refreshUser();
      setSuccessMsg("Profile picture uploaded and saved successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to upload profile picture.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleResetForm = () => {
    if (user) {
      setFullName(user.full_name || "");
      setPhone(user.phone || "");
    }
    setCurrentPassword("");
    setNewPassword("");
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const updatedUser = await api.updateProfile({
        full_name: fullName,
        phone,
        current_password: currentPassword || undefined,
        new_password: newPassword || undefined,
      });

      if (updatedUser) {
        updateUser(updatedUser);
      }
      await refreshUser();
      setSuccessMsg("Profile details updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate initials avatar safely
  const getInitials = (name?: string) => {
    if (!name || !name.trim()) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const getProfileImg = () => {
    if (isVillager) return null; // No profile picture for villager
    const rawPath = user?.profile_image || user?.avatar_url;
    if (!rawPath) return null;
    return getImageUrl(rawPath);
  };

  const profileImg = getProfileImg();
  const initials = getInitials(fullName || user?.full_name);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title={isVillager ? "My Profile" : "Profile & Settings"}
        subtitle={
          isVillager
            ? "View and manage your villager account details, registered village sector, and security credentials"
            : "Manage your operational user profile, profile picture, and password credentials"
        }
        icon={User}
      />

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Account Card */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-emerald-950/10 p-6 sm:p-8 space-y-8 shadow-xs">
        {/* Profile Header Banner */}
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-emerald-950/10">
          {/* Avatar representation */}
          <div className="relative shrink-0">
            {isVillager || !profileImg ? (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 text-amber-300 font-black text-2xl tracking-wider flex items-center justify-center border-4 border-emerald-100 shadow-md">
                {initials}
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-emerald-900 text-amber-300 font-black text-3xl flex items-center justify-center border-4 border-white shadow-md overflow-hidden shrink-0">
                <img src={profileImg} alt="Profile Avatar" className="w-full h-full object-cover" />
              </div>
            )}

            {!isVillager && isUploading && (
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
          </div>

          {/* User Role & Identifiers */}
          <div className="text-center sm:text-left space-y-1.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h3 className="text-xl font-black text-emerald-950 tracking-tight truncate">
                {fullName || user?.full_name || "User"}
              </h3>
              <span className="px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-xs font-black border border-emerald-200">
                {user?.role || "Villager"}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${user?.is_active !== false ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-red-50 text-red-800 border-red-200"}`}>
                {user?.is_active !== false ? "Active Account" : "Inactive"}
              </span>
            </div>

            <p className="text-xs text-emerald-800/70 font-medium flex items-center justify-center sm:justify-start gap-1.5">
              <Mail className="w-3.5 h-3.5 text-emerald-700" />
              <span>{user?.email || "No email available"}</span>
            </p>

            {isVillager && (
              <p className="text-xs text-emerald-800/80 font-semibold pt-1">
                Verified community member registered for early conflict prevention and rapid wildlife alerts.
              </p>
            )}

            {/* Profile Picture Upload Buttons: Completely REMOVED for Villagers */}
            {!isVillager && (
              <div className="pt-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="px-4 py-2 rounded-xl bg-emerald-900 hover:bg-emerald-950 text-white font-extrabold text-xs transition-all shadow-md flex items-center gap-2 mx-auto sm:mx-0 active:scale-95"
                >
                  <Upload className="w-3.5 h-3.5 text-amber-300" />
                  {isUploading ? "Uploading Picture..." : "Upload Profile Picture"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Read-Only Informational Cards: Location Information & Account Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Section: Location Information */}
          <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-950/10 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-emerald-900 pb-2 border-b border-emerald-950/10 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-700" /> Location Information
            </h4>

            <dl className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-emerald-950/5">
                <dt className="text-emerald-800/70 font-semibold">Registered Village:</dt>
                <dd className="font-extrabold text-emerald-950">
                  {user?.village_name || (user?.village_id ? `Village #${user.village_id}` : "Not provided")}
                </dd>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-emerald-950/5">
                <dt className="text-emerald-800/70 font-semibold">District:</dt>
                <dd className="font-extrabold text-emerald-950">
                  {user?.district_name || "Not provided"}
                </dd>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-emerald-950/5">
                <dt className="text-emerald-800/70 font-semibold">State:</dt>
                <dd className="font-extrabold text-emerald-950">
                  {user?.state_name || "Not provided"}
                </dd>
              </div>

              <div className="flex justify-between items-center py-1">
                <dt className="text-emerald-800/70 font-semibold">Nearest Station:</dt>
                <dd className="font-extrabold text-emerald-950">
                  {user?.station_name || user?.station || "Assigned via Sector"}
                </dd>
              </div>
            </dl>
          </div>

          {/* Section: Account Information */}
          <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-950/10 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-emerald-900 pb-2 border-b border-emerald-950/10 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700" /> Account Information
            </h4>

            <dl className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-emerald-950/5">
                <dt className="text-emerald-800/70 font-semibold">User Role:</dt>
                <dd className="font-extrabold text-emerald-950">{user?.role || "Villager"}</dd>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-emerald-950/5">
                <dt className="text-emerald-800/70 font-semibold">Verification Status:</dt>
                <dd className="font-extrabold text-emerald-950 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{user?.is_verified ? "Verified User" : "Approved"}</span>
                </dd>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-emerald-950/5">
                <dt className="text-emerald-800/70 font-semibold">Account Created:</dt>
                <dd className="font-extrabold text-emerald-950">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "Not recorded"}
                </dd>
              </div>

              <div className="flex justify-between items-center py-1">
                <dt className="text-emerald-800/70 font-semibold">Operational Status:</dt>
                <dd className="font-extrabold text-emerald-950">
                  {user?.work_status || "Active Member"}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Profile Details & Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-6 pt-2" autoComplete="off">
          {/* Section 1: Personal Information (Editable) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-950/10 pb-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <User className="w-4 h-4 text-emerald-700" /> Personal Information (Editable)
              </h4>
              <span className="text-[10px] text-emerald-700/70 font-semibold">Update contact info below</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-emerald-700 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-emerald-950/15 text-emerald-950 text-xs font-semibold focus:ring-2 focus:ring-emerald-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-emerald-700 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    autoComplete="off"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="E.g. 9876543210"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-emerald-950/15 text-emerald-950 text-xs font-semibold focus:ring-2 focus:ring-emerald-800 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Change Password Section */}
          <div className="space-y-4 pt-4 border-t border-emerald-950/10">
            <h4 className="text-xs font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-emerald-700" /> Change Password Credentials
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5">
                  Current Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-emerald-700 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-emerald-950/15 text-emerald-950 text-xs focus:ring-2 focus:ring-emerald-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-emerald-700 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-emerald-950/15 text-emerald-950 text-xs focus:ring-2 focus:ring-emerald-800 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions: Save and Cancel */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-emerald-950/10">
            <button
              type="button"
              onClick={handleResetForm}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs border border-gray-200 transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Cancel / Reset
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-900 hover:bg-emerald-950 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                  Saving Updates...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-amber-300" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;

