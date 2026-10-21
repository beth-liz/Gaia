import React, { useState, useEffect } from "react";
import { api } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { Bell, Check, Trash2, Loader2, CheckCheck } from "lucide-react";

const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const isVillager = (user?.role || "").toLowerCase() === "villager";

  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error("Failed to load notifications", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkRead = async (id: number) => {
    try {
      await api.markNotificationRead(id);
      loadNotifications();
    } catch (err: any) {
      alert(err.message || "Failed to mark as read");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      loadNotifications();
    } catch (err: any) {
      alert(err.message || "Failed to mark all as read");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteNotification(id);
      loadNotifications();
    } catch (err: any) {
      alert(err.message || "Failed to delete notification");
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6">
      {/* Header - Transparent clean layout without floating box, with white headings on nature background */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/20">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-800 to-emerald-950 border border-emerald-500/30 text-amber-300 shadow-md shrink-0">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-white tracking-tight drop-shadow-sm">
                System Alerts & Notifications
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white border border-white/30 backdrop-blur-sm">
                {unreadCount} Unread
              </span>
            </div>
            <p className="text-xs text-emerald-100/90 font-medium mt-0.5 drop-shadow-xs">
              Real-time alerts and mission dispatches saved in database
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-emerald-950/60 backdrop-blur-sm px-4 py-2 rounded-2xl border border-emerald-500/30 text-xs font-bold text-white flex items-center gap-2 shadow-xs">
            <Bell className="w-4 h-4 text-emerald-300" />
            Unread Alerts: <span className="text-amber-300 font-extrabold text-sm">{unreadCount}</span>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-4 py-2 rounded-2xl bg-emerald-800/90 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md border border-emerald-400/30 backdrop-blur-sm transition-all active:scale-95"
            >
              <CheckCheck className="w-4 h-4 text-amber-300" /> Mark All Read
            </button>
          )}
        </div>
      </div>

      {/* Notifications List - Nature Green Frosted Glass in Villager Module */}
      <div className={`p-6 space-y-4 rounded-2xl ${
        isVillager 
          ? "bg-emerald-950/45 backdrop-blur-md border border-emerald-500/25 shadow-lg shadow-black/10" 
          : "gaia-card"
      }`}>
        {isLoading ? (
          <div className="py-12 text-center">
            <Loader2 className="w-8 h-8 text-emerald-300 animate-spin mx-auto mb-2" />
            <p className="text-xs font-medium text-white">Loading Notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-12 text-center text-emerald-100/70 text-xs font-medium">
            No notifications available.
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isVillager
                    ? n.is_read
                      ? "bg-emerald-900/30 border-emerald-500/20 text-white"
                      : "bg-emerald-900/60 border-emerald-400/40 shadow-sm text-white"
                    : n.is_read
                    ? "bg-white border-emerald-950/10 text-emerald-950"
                    : "bg-emerald-50/70 border-emerald-800/30 shadow-xs text-emerald-950"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${isVillager ? "text-white" : "text-emerald-950"}`}>
                      {n.title}
                    </span>
                    {!n.is_read && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-400/90 text-emerald-950 shadow-xs">
                        New Unread
                      </span>
                    )}
                  </div>
                  <p className={`text-xs leading-relaxed ${isVillager ? "text-emerald-100/90" : "text-emerald-900/80"}`}>
                    {n.message}
                  </p>
                  <p className={`text-[10px] pt-1 ${isVillager ? "text-emerald-300/70" : "text-emerald-800/60"}`}>
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {!n.is_read && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-[11px] font-semibold flex items-center gap-1 shadow-xs border border-emerald-500/30 transition-all active:scale-95"
                    >
                      <Check className="w-3.5 h-3.5" /> Mark Read
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(n.id)}
                    className="p-2 rounded-xl bg-red-900/30 hover:bg-red-900/50 text-red-200 border border-red-500/30 transition-colors"
                    title="Delete Notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
