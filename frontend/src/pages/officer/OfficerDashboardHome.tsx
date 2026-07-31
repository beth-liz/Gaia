import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { PageHeader } from "@/components/common/PageHeader";
import {
  Radio,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Loader2,
  User,
  Users,
  FileText,
  CheckCircle2,
} from "lucide-react";

const OfficerDashboardHome: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isRFO = user?.designation_name === "Range Forest Officer" || user?.role === "Range Forest Officer" || user?.role === "Admin";

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [sData, incData] = await Promise.all([
          api.getDashboardStats(),
          api.getIncidents({ assigned_to_me: !isRFO }),
        ]);
        setStats(sData);
        setIncidents(incData.slice(0, 5));
      } catch (err) {
        console.error("Failed to load officer dashboard data", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [isRFO]);

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
    <div className="space-y-6">
      <PageHeader
        title={isRFO ? "Range Officer Command Center" : "Forest Guard Field Operations"}
        subtitle={`Station: ${user?.station_name || user?.station || "Range Office"} • District: ${user?.district_name || "Wayanad"} • State: ${user?.state_name || "Kerala"}`}
        icon={Radio}
        badge={user?.designation_name || user?.role}
      />

      {/* 6 Cards Responsive Grid (Desktop: 6, Laptop: 3, Tablet: 2, Mobile: 1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-stretch">
        <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-emerald-950/10 shadow-xs flex flex-col justify-between h-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider">Pending Incidents</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-amber-900">{stats?.pending_incidents || 0}</p>
            <p className="text-[10px] text-amber-800/70 font-semibold">Awaiting Dispatch</p>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-emerald-950/10 shadow-xs flex flex-col justify-between h-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">Available Guards</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-emerald-950">{stats?.available_guards_count || 0}</p>
            <p className="text-[10px] text-emerald-800/70 font-semibold">Ready on Patrol</p>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-emerald-950/10 shadow-xs flex flex-col justify-between h-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">Resolved Missions</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-emerald-950">{stats?.resolved_incidents || 0}</p>
            <p className="text-[10px] text-emerald-800/70 font-semibold">Missions Completed</p>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-emerald-950/10 shadow-xs flex flex-col justify-between h-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">Active Sector Hub</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center shrink-0">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-xs font-black text-emerald-950 truncate">{user?.station_name || user?.station || "Muthanga HQ"}</p>
            <p className="text-[10px] text-emerald-800/70 font-semibold">Range Station</p>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-emerald-950/10 shadow-xs flex flex-col justify-between h-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">Duty Status</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center shrink-0">
              <User className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-extrabold text-xs">
              {user?.work_status || "Available"}
            </span>
            <p className="text-[10px] text-emerald-800/70 font-semibold mt-1">Duty Readiness</p>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-emerald-950/10 shadow-xs flex flex-col justify-between h-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">Assigned Incidents</span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-900 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-emerald-950">{isRFO ? stats?.open_incidents || 0 : stats?.guard_assigned || 0}</p>
            <p className="text-[10px] text-emerald-800/70 font-semibold">{isRFO ? "Total Open Incidents" : "Directly Assigned"}</p>
          </div>
        </div>
      </div>

      {/* Designation-Based Permission Actions Bar */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-emerald-950/10 p-5 space-y-3 shadow-xs">
        <h3 className="text-xs font-black uppercase text-emerald-800 tracking-wider">
          {isRFO ? "Range Forest Officer Operational Controls" : "Forest Guard Field Actions"}
        </h3>

        <div className="flex flex-wrap items-center gap-3">
          {isRFO ? (
            <>
              <Link
                to="/officer/incidents"
                className="px-4 py-2.5 rounded-xl bg-emerald-900 text-white font-bold text-xs hover:bg-emerald-950 transition-all flex items-center gap-2"
              >
                <Radio className="w-4 h-4 text-amber-300" />
                Assign Incident
              </Link>
              <Link
                to="/admin/officers"
                className="px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-950/10 text-emerald-950 font-bold text-xs hover:bg-emerald-100 transition-all flex items-center gap-2"
              >
                <Users className="w-4 h-4 text-emerald-700" />
                Manage Guards
              </Link>
              <Link
                to="/admin/monitoring-stations"
                className="px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-950/10 text-emerald-950 font-bold text-xs hover:bg-emerald-100 transition-all flex items-center gap-2"
              >
                <Radio className="w-4 h-4 text-emerald-700" />
                Station Overview
              </Link>
              <Link
                to="/officer/incidents"
                className="px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-950/10 text-emerald-950 font-bold text-xs hover:bg-emerald-100 transition-all flex items-center gap-2"
              >
                <FileText className="w-4 h-4 text-emerald-700" />
                View Reports
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/guard/incidents"
                className="px-4 py-2.5 rounded-xl bg-emerald-900 text-white font-bold text-xs hover:bg-emerald-950 transition-all flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-amber-300" />
                My Assigned Incidents
              </Link>
              <Link
                to="/guard/reports"
                className="px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-950/10 text-emerald-950 font-bold text-xs hover:bg-emerald-100 transition-all flex items-center gap-2"
              >
                <FileText className="w-4 h-4 text-emerald-700" />
                Submit Incident Report
              </Link>
              <Link
                to="/guard/profile"
                className="px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-950/10 text-emerald-950 font-bold text-xs hover:bg-emerald-100 transition-all flex items-center gap-2"
              >
                <User className="w-4 h-4 text-emerald-700" />
                My Profile & Settings
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Officer Duty Credentials Card */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl p-5 border border-emerald-950/10 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-emerald-950/10 pb-3">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-900" />
            <h3 className="text-sm font-black text-emerald-950">Duty Credentials & Station Assignment</h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-900">
            PostgreSQL Database Verified
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-emerald-900 text-amber-300 font-black text-xl flex items-center justify-center border-2 border-white shadow-sm overflow-hidden shrink-0">
            {profileImg ? (
              <img src={profileImg} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              user?.full_name ? user.full_name.charAt(0).toUpperCase() : "O"
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-1 text-xs w-full">
            <div className="p-3 rounded-xl bg-emerald-50/50">
              <span className="text-[10px] font-bold text-emerald-800/70 uppercase block">Name & Role</span>
              <span className="font-bold text-emerald-950 block">{user?.full_name || "N/A"}</span>
              <span className="text-[11px] text-emerald-800/70">{user?.designation_name || user?.role}</span>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/50">
              <span className="text-[10px] font-bold text-emerald-800/70 uppercase block">Monitoring Station</span>
              <span className="font-bold text-emerald-950">{user?.station_name || user?.station || "Muthanga Range Office"}</span>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/50">
              <span className="text-[10px] font-bold text-emerald-800/70 uppercase block">District & State</span>
              <span className="font-bold text-emerald-950">{user?.district_name || "Wayanad"}, {user?.state_name || "Kerala"}</span>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/50">
              <span className="text-[10px] font-bold text-emerald-800/70 uppercase block">Contact Info</span>
              <span className="font-semibold text-emerald-950 block">{user?.phone || "N/A"}</span>
              <span className="text-[11px] text-emerald-800/70 block">{user?.email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Incidents Table Section */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-emerald-950/10 p-5 space-y-3 shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-emerald-950/10">
          <h3 className="text-sm font-extrabold text-emerald-950">Active Range Incidents</h3>
          <Link to="/officer/incidents" className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1">
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="py-8 text-center">
            <Loader2 className="w-6 h-6 text-emerald-800 animate-spin mx-auto mb-2" />
          </div>
        ) : incidents.length === 0 ? (
          <p className="text-xs text-emerald-900/50 py-6 text-center">No active incidents logged for your sector.</p>
        ) : (
          <div className="space-y-2.5">
            {incidents.map((inc) => (
              <div key={inc.id} className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-950/5 flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-950">{inc.animal}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900">{inc.severity}</span>
                  </div>
                  <p className="text-[11px] text-emerald-800/70">{inc.location} &bull; Village: {inc.village_name}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  inc.status === "Pending" ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-900"
                }`}>
                  {inc.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OfficerDashboardHome;
