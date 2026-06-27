"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Bell, 
  Trash2, 
  CheckCheck, 
  AlertTriangle, 
  CloudRain, 
  DollarSign, 
  ShieldCheck, 
  RefreshCw 
} from "lucide-react";

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchNotifications = async () => {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const headers = { "Authorization": `Bearer ${token}` };
      const res = await fetch("http://localhost:8000/api/notifications", { headers });
      if (!res.ok) throw new Error("Failed to load notifications");
      const data = await res.json();
      setNotifications(data);
    } catch (err: any) {
      setError(err.message || "Failed to load notifications. Please verify backend is running.");
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (notifId: number) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:8000/api/notifications/${notifId}/read`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        fetchNotifications();
      }
    } catch (err) {
      // Mock toggle
      setNotifications(notifications.map(n => n.id === notifId ? { ...n, read: true } : n));
    }
  };

  const handleMarkAllRead = async () => {
    // Loop through unread and mark read
    const unread = notifications.filter(n => !n.read);
    for (const u of unread) {
      await handleMarkAsRead(u.id);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Delay":
        return <AlertTriangle className="h-4.5 w-4.5 text-orange-500" />;
      case "Weather":
        return <CloudRain className="h-4.5 w-4.5 text-cyan-400" />;
      case "Budget":
        return <DollarSign className="h-4.5 w-4.5 text-red-500" />;
      default:
        return <Bell className="h-4.5 w-4.5 text-slate-400" />;
    }
  };

  const filteredNotifications = selectedFilter === "All" 
    ? notifications 
    : notifications.filter(n => n.category === selectedFilter);

  const filterTabs = ["All", "Delay", "Weather", "Budget", "Vendor"];

  return (
    <div className="pl-64 min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="border-b border-slate-900 bg-slate-950/40 p-6 flex justify-between items-center backdrop-blur-md">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">
            Notifications Center
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time warnings, delay risks, and budget alarms
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleMarkAllRead}
            className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-805 transition-colors"
          >
            <CheckCheck className="h-4 w-4 text-green-400" />
            <span>Mark All Read</span>
          </button>
        </div>
      </header>

      <main className="p-6 flex-grow space-y-6 max-w-4xl w-full">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs">
            {error}
          </div>
        )}
        {/* Category Filters row */}
        <div className="flex flex-wrap gap-2">
          {filterTabs.map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                selectedFilter === filter
                  ? "bg-slate-900 border-orange-500/80 text-orange-400"
                  : "bg-slate-900/40 border-slate-850 text-slate-450 hover:text-slate-200"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Notifications list */}
        <div className="space-y-3">
          {filteredNotifications.map((n) => (
            <div 
              key={n.id} 
              className={`bg-slate-900 border p-5 rounded-2xl flex items-start justify-between gap-4 transition-all duration-200 ${
                n.read ? "border-slate-850/60 opacity-60" : "border-slate-800"
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className="bg-slate-950 border border-slate-850 p-2.5 rounded-xl shrink-0 mt-0.5">
                  {getCategoryIcon(n.category)}
                </div>
                <div className="space-y-1">
                  <div className="flex items-baseline space-x-2">
                    <h4 className="font-extrabold text-sm text-slate-200">{n.title}</h4>
                    <span className="text-[9px] text-slate-500 font-mono">
                      {new Date(n.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">
                    {n.message}
                  </p>
                </div>
              </div>

              {!n.read && (
                <button
                  onClick={() => handleMarkAsRead(n.id)}
                  className="bg-slate-950 hover:bg-slate-800 text-[10px] font-bold text-orange-400 px-3 py-1.5 rounded-xl border border-slate-850 shrink-0"
                >
                  Mark Read
                </button>
              )}
            </div>
          ))}

          {filteredNotifications.length === 0 && (
            <div className="bg-slate-900/40 border border-dashed border-slate-850 rounded-2xl p-12 text-center text-slate-650 text-xs font-semibold">
              No notifications matching this category.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
