"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  TrendingUp,
  Calendar,
  MapPin,
  DollarSign,
  Percent,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  PackageCheck,
  ReceiptText,
  BadgeCheck,
  Truck,
  ClipboardCheck,
  Sparkles
} from "lucide-react";

export default function Dashboard() {
  const router = useRouter();
  const [project, setProject] = useState<any>(null);
  const [overview, setOverview] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboardData = async () => {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const activeProjId = localStorage.getItem("selected_project_id");
    if (!activeProjId) {
      router.push("/project-select");
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };

      const projRes = await fetch(`http://localhost:8000/api/projects/${activeProjId}`, { headers });
      if (!projRes.ok) throw new Error("Failed to load project details");
      const projData = await projRes.json();
      setProject(projData);

      const overviewRes = await fetch(`http://localhost:8000/api/procurement/overview?project_id=${activeProjId}`, { headers });
      const overviewData = await overviewRes.json();
      setOverview(overviewData);

      const notifRes = await fetch("http://localhost:8000/api/notifications", { headers });
      const notifData = await notifRes.ok ? await notifRes.json() : [];
      setNotifications(notifData.slice(0, 4));
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load procurement dashboard data.");
      setOverview(null);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="pl-64 min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="h-8 w-8 text-orange-500 animate-spin" />
        <span className="text-slate-400 text-sm font-semibold">Syncing procurement intelligence...</span>
      </div>
    );
  }

  return (
    <div className="pl-64 min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="border-b border-slate-900 bg-slate-950/40 p-6 flex justify-between items-center backdrop-blur-md">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">AI Procurement Command Center</h2>
          <p className="text-xs text-slate-500 mt-1">Live purchasing status, vendor intelligence, and invoice verification</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-800 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
          <span>Refresh Intelligence</span>
        </button>
      </header>

      <main className="p-6 flex-1 space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-xs text-red-400 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {project && (
          <div className="bg-slate-900 border border-slate-800/80 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
            <div className="space-y-3 relative z-10">
              <div className="flex items-center space-x-2 text-slate-400 text-xs font-medium">
                <MapPin className="h-4 w-4 text-orange-500" />
                <span>{project.location}</span>
                <span className="text-slate-700">•</span>
                <Calendar className="h-4 w-4 text-orange-500" />
                <span>Budget {project.budget.toLocaleString()} INR</span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-extrabold text-slate-100">{project.name}</h1>
                <span className="bg-orange-500/10 text-orange-400 text-[10px] px-2.5 py-1 rounded-full border border-orange-500/20 font-mono font-bold uppercase tracking-wider">
                  {project.code}
                </span>
              </div>
              <div className="flex items-center space-x-3 text-xs">
                <span className="bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-bold uppercase tracking-wider">{project.status}</span>
                <span className="text-slate-500">Project progress {project.progress}%</span>
              </div>
            </div>
            <div className="md:w-72 space-y-2 relative z-10">
              <div className="flex justify-between items-end text-xs font-bold uppercase tracking-wider text-slate-400">
                <span>Execution Progress</span>
                <span className="text-orange-400 text-sm">{project.progress}%</span>
              </div>
              <div className="h-2.5 bg-slate-950 rounded-full border border-slate-850 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-500" style={{ width: `${project.progress}%` }}></div>
              </div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="bg-slate-900 border border-slate-800/60 p-5 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-bold uppercase tracking-widest">Pending Approval</span>
              <ClipboardCheck className="h-5 w-5 text-orange-400" />
            </div>
            <div className="my-3 space-y-1">
              <h3 className="text-3xl font-extrabold text-slate-100">{overview?.pending_requests ?? 0}</h3>
              <p className="text-[10px] text-slate-500">Requisitions waiting for review</p>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800/60 p-5 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-bold uppercase tracking-widest">Active Purchase Orders</span>
              <Truck className="h-5 w-5 text-cyan-400" />
            </div>
            <div className="my-3 space-y-1">
              <h3 className="text-3xl font-extrabold text-slate-100">{overview?.active_purchase_orders ?? 0}</h3>
              <p className="text-[10px] text-slate-500">Orders moving through approval and dispatch</p>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800/60 p-5 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-bold uppercase tracking-widest">Delayed Deliveries</span>
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="my-3 space-y-1">
              <h3 className="text-3xl font-extrabold text-slate-100">{overview?.delayed_deliveries ?? 0}</h3>
              <p className="text-[10px] text-slate-500">Material receipts at risk</p>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800/60 p-5 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-bold uppercase tracking-widest">Vendor Performance</span>
              <BadgeCheck className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="my-3 space-y-1">
              <h3 className="text-3xl font-extrabold text-slate-100">{overview?.vendor_performance ?? 0}%</h3>
              <p className="text-[10px] text-slate-500">Average reliability across suppliers</p>
            </div>
          </div>
        </div>

        <div className="grid xl:grid-cols-[1.2fr_0.8fr] gap-6">
          <div className="bg-slate-900 border border-slate-800/60 p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-orange-500" />
                <span>AI Recommendations</span>
              </h3>
              <span className="text-[10px] text-orange-400">Risk score {overview?.risk_score ?? 0}</span>
            </div>
            <div className="space-y-3">
              {(overview?.recommendations || []).map((rec: string, idx: number) => (
                <div key={idx} className="bg-slate-950 border border-slate-850 p-4 rounded-xl text-sm text-slate-300 leading-relaxed">
                  {rec}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800/60 p-6 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-emerald-400" />
                <span>Spend & Verification</span>
              </h3>
              <div className="grid gap-3">
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">Procurement Spend</p>
                  <p className="text-2xl font-semibold text-slate-100">₹{overview?.spend?.toLocaleString() ?? 0}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">Invoice Verification</p>
                  <p className="text-2xl font-semibold text-slate-100">{overview?.invoice_verified ?? 0}/{overview?.invoice_total ?? 0}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">Procurement Confidence</p>
                  <p className="text-2xl font-semibold text-slate-100">{overview?.confidence ?? 0}%</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800/60 p-6 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center space-x-2">
                <ShieldAlert className="h-4 w-4 text-red-500" />
                <span>Live Notifications</span>
              </h3>
              <div className="space-y-3">
                {notifications.map((n) => (
                  <div key={n.id} className="bg-slate-950 border border-slate-850 p-4 rounded-xl text-xs text-slate-400 leading-relaxed">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-slate-200">{n.title}</span>
                      <span className="text-[8px] uppercase tracking-wider text-orange-400">{n.category}</span>
                    </div>
                    <p>{n.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800/60 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-orange-500" />
              <span>Procurement Workflow</span>
            </h3>
            <span className="text-[10px] text-slate-500">Auto-updating across project and owner dashboards</span>
          </div>
          <div className="grid md:grid-cols-4 gap-3">
            {(overview?.workflow || []).map((step: any, idx: number) => (
              <div key={idx} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-500">
                  <span>Stage {idx + 1}</span>
                  <span className={step.status === "Complete" ? "text-emerald-400" : "text-orange-400"}>{step.status}</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-200">{step.name}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
