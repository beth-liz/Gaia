import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Clock, LogOut, Trees, ShieldAlert } from "lucide-react";

const PendingApprovalPage: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fdfbf7] via-[#f7f4eb] to-[#eef5ef] flex flex-col items-center justify-center p-4">
      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-900 to-emerald-950 flex items-center justify-center text-amber-400 shadow-lg">
          <Trees className="w-7 h-7" />
        </div>
        <div className="text-left">
          <h1 className="text-2xl font-bold tracking-tight text-emerald-950">GAIA</h1>
          <p className="text-xs uppercase font-semibold text-emerald-700 tracking-wider">Wildlife Protection Network</p>
        </div>
      </div>

      {/* Main Card */}
      <div className="max-w-md w-full bg-white/90 backdrop-blur-md rounded-3xl p-8 shadow-xl border border-emerald-900/10 text-center relative overflow-hidden transition-all duration-300 hover:shadow-2xl">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 via-emerald-600 to-emerald-800" />
        
        {/* Status Icon */}
        <div className="w-20 h-20 mx-auto rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-6 shadow-inner animate-pulse">
          <Clock className="w-10 h-10" />
        </div>

        <h2 className="text-2xl font-bold text-emerald-950 mb-3">Registration Request Submitted</h2>

        <div className="space-y-4 text-emerald-900/80 text-sm leading-relaxed mb-8">
          <p className="bg-emerald-50/70 rounded-2xl p-4 border border-emerald-900/10 text-emerald-950 font-medium">
            Welcome, <span className="font-semibold text-emerald-900">{user?.full_name || "Villager"}</span>! Your registration request has been submitted successfully.
          </p>
          <p>
            Your account is currently awaiting administrator approval. You will receive full dashboard access once verified by the Range Forest Officer or System Administrator.
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-amber-800 font-semibold bg-amber-50 py-2.5 px-4 rounded-xl border border-amber-200/60">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            Registered Village: {user?.village_name || "Assigned Village Sector"}
          </div>
        </div>

        {/* Logout Button Only */}
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-emerald-900 hover:bg-emerald-950 text-white font-semibold shadow-lg shadow-emerald-950/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          <LogOut className="w-4 h-4" />
          Logout Account
        </button>
      </div>

      <p className="text-xs text-emerald-900/50 mt-6 font-medium">
        Gaia Wildlife Platform &copy; 2026. All rights reserved.
      </p>
    </div>
  );
};

export default PendingApprovalPage;
