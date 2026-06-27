"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BadgeCheck, ClipboardCheck, DollarSign, ShieldAlert, Truck } from "lucide-react";

export default function ProcurementPage() {
  const router = useRouter();
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const projectId = localStorage.getItem("selected_project_id");
    if (!token) {
      router.push("/login");
      return;
    }

    const load = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const res = await fetch(`http://localhost:8000/api/procurement/overview${projectId ? `?project_id=${projectId}` : ""}`, { headers });
        if (!res.ok) throw new Error("Unable to load procurement overview");
        setOverview(await res.json());
      } catch (e) {
        setOverview({
          project_name: "No procurement data", 
          pending_requests: 0,
          active_purchase_orders: 0,
          delayed_deliveries: 0,
          vendor_performance: 0,
          spend: 0,
          invoice_verified: 0,
          invoice_total: 0,
          risk_score: 0,
          confidence: 100,
          recommendations: ["Add project data to see procurement recommendations."],
          workflow: [
            { name: "Requisition Submitted", status: "Complete" },
            { name: "Vendor Review", status: "Pending" },
            { name: "PO Issued", status: "Pending" },
            { name: "Invoice Verified", status: "Pending" }
          ]
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [router]);

  if (loading) {
    return <div className="pl-64 min-h-screen bg-slate-950 text-slate-300 flex items-center justify-center">Loading procurement workspace…</div>;
  }

  return (
    <div className="pl-64 min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-orange-400">Procurement workspace</p>
              <h1 className="text-2xl font-semibold">{overview?.project_name ?? "Procurement controls"}</h1>
            </div>
            <div className="rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-sm text-orange-300">AI-assisted</div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-xs uppercase text-slate-500">Pending approvals</p>
              <p className="mt-2 text-2xl font-semibold">{overview?.pending_requests ?? 0}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-xs uppercase text-slate-500">Active POs</p>
              <p className="mt-2 text-2xl font-semibold">{overview?.active_purchase_orders ?? 0}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-xs uppercase text-slate-500">Delayed delivery</p>
              <p className="mt-2 text-2xl font-semibold">{overview?.delayed_deliveries ?? 0}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-xs uppercase text-slate-500">Vendor performance</p>
              <p className="mt-2 text-2xl font-semibold">{overview?.vendor_performance ?? 0}%</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex items-center gap-2 text-orange-400">
              <ClipboardCheck className="h-4 w-4" />
              <h2 className="text-lg font-semibold">AI recommendations</h2>
            </div>
            <div className="mt-4 space-y-3">
              {(overview?.recommendations || []).map((item: string, idx: number) => (
                <div key={idx} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">{item}</div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <div className="flex items-center gap-2 text-emerald-400">
                <DollarSign className="h-4 w-4" />
                <h2 className="text-lg font-semibold">Spend & verification</h2>
              </div>
              <div className="mt-4 space-y-3 text-sm">
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <p className="text-slate-500">Spend</p>
                  <p className="mt-1 text-xl font-semibold">₹{overview?.spend?.toLocaleString() ?? 0}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <p className="text-slate-500">Invoice verification</p>
                  <p className="mt-1 text-xl font-semibold">{overview?.invoice_verified ?? 0}/{overview?.invoice_total ?? 0}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <div className="flex items-center gap-2 text-red-400">
                <ShieldAlert className="h-4 w-4" />
                <h2 className="text-lg font-semibold">Risk posture</h2>
              </div>
              <p className="mt-4 text-3xl font-semibold">{overview?.risk_score ?? 0}</p>
              <p className="mt-2 text-sm text-slate-400">Confidence level {overview?.confidence ?? 100}%</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Procurement workflow</h2>
            <a href="/assistant" className="flex items-center gap-2 text-sm text-orange-400">Open AI copilot <ArrowRight className="h-4 w-4" /></a>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            {(overview?.workflow || []).map((step: any, idx: number) => (
              <div key={idx} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Stage {idx + 1}</p>
                <p className="mt-2 font-medium">{step.name}</p>
                <p className="mt-1 text-sm text-slate-400">{step.status}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
