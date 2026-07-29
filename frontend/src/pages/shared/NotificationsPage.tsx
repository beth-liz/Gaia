import React, { useState, useEffect } from "react";
import { api } from "@/services/api";
import { Bell, Check, Trash2, Loader2 } from "lucide-react";

const NotificationsPage: React.FC = () => {
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
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 p-6 rounded-3xl border border-emerald-950/10 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-emerald-950 tracking-tight">System Alerts & Notifications</h1>
          <p className="text-xs text-emerald-900/70 mt-1">Real-time alerts and mission dispatches saved in database</p>
        </div>
        <div className="bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-900/10 text-xs font-bold text-emerald-900 flex items-center gap-2">
          <Bell className="w-4 h-4 text-emerald-700" />
          Unread Alerts: <span className="text-amber-700 font-extrabold text-sm">{unreadCount}</span>
        </div>
      </div>

      {/* Notifications List */}
      <div className="gaia-card p-6 space-y-4">
        {isLoading ? (
          <div className="py-12 text-center">
            <Loader2 className="w-8 h-8 text-emerald-800 animate-spin mx-auto mb-2" />
            <p className="text-xs font-medium text-emerald-950">Loading Notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-12 text-center text-emerald-900/60 text-xs font-medium">
            No notifications available.
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  n.is_read ? "bg-white border-emerald-950/10" : "bg-emerald-50/70 border-emerald-800/30 shadow-xs"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-950">{n.title}</span>
                    {!n.is_read && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-400 text-emerald-950">
                        New Unread
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-emerald-900/80 leading-relaxed">{n.message}</p>
                  <p className="text-[10px] text-emerald-800/60 pt-1">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {!n.is_read && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-900 hover:bg-emerald-950 text-white text-[11px] font-semibold flex items-center gap-1 shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5" /> Mark Read
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(n.id)}
                    className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200"
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
