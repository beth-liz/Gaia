import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { PageHeader } from "@/components/common/PageHeader";
import { User, Phone, Lock, Save, Upload, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

const ProfilePage: React.FC = () => {
  const { user, refreshUser, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
      setSuccessMsg("Profile picture uploaded and saved to database successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to upload profile picture.");
    } finally {
      setIsUploading(false);
    }
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
      setSuccessMsg("Profile details updated successfully in database!");
      setCurrentPassword("");
      setNewPassword("");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getProfileImg = () => {
    if (user?.profile_image) {
      return user.profile_image.startsWith("/static") ? `http://127.0.0.1:8000${user.profile_image}` : user.profile_image;
    }
    if (user?.avatar_url) {
      return user.avatar_url.startsWith("/static") ? `http://127.0.0.1:8000${user.avatar_url}` : user.avatar_url;
    }
    return null;
  };

  const profileImg = getProfileImg();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Profile & Settings"
        subtitle="Manage your operational user profile, profile picture, and password credentials"
        icon={User}
      />

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-emerald-950/10 p-6 sm:p-8 space-y-6 shadow-xs">
        {/* Profile Picture Upload Section */}
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-emerald-950/10">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-emerald-900 text-amber-300 font-black text-3xl flex items-center justify-center border-4 border-white shadow-md overflow-hidden shrink-0">
              {profileImg ? (
                <img src={profileImg} alt="Profile Avatar" className="w-full h-full object-cover" />
              ) : (
                fullName.charAt(0).toUpperCase() || "U"
              )}
            </div>
            {isUploading && (
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
          </div>

          <div className="text-center sm:text-left space-y-2">
            <div>
              <h3 className="text-base font-extrabold text-emerald-950">{fullName || "User"}</h3>
              <p className="text-xs text-emerald-800/70">{user?.email}</p>
              <div className="mt-1.5 inline-block px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[11px] font-bold border border-emerald-200">
                {user?.designation_name || user?.role}
              </div>
            </div>

            <div>
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
          </div>
        </div>

        {/* Profile Details Form */}
        <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-emerald-800">Personal Information</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5">Full Name</label>
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
                <label className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-emerald-700 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    autoComplete="off"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-emerald-950/15 text-emerald-950 text-xs font-semibold focus:ring-2 focus:ring-emerald-800 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Change Password Section */}
          <div className="space-y-4 pt-4 border-t border-emerald-950/10">
            <h4 className="text-xs font-black uppercase tracking-wider text-emerald-800">Change Password Credentials</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5">Current Password</label>
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
                <label className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5">New Password</label>
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

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 rounded-xl bg-emerald-900 hover:bg-emerald-950 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2 active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                  Saving Updates...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-amber-300" />
                  Save Profile & Settings
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
