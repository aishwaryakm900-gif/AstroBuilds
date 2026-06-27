"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Clock, 
  Calendar, 
  DollarSign, 
  Package, 
  Sparkles, 
  Download, 
  RefreshCw, 
  FileText,
  X,
  TrendingUp,
  Award
} from "lucide-react";

export default function ConstructionTimeline() {
  const router = useRouter();
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [monthlyRollup, setMonthlyRollup] = useState<any>(null);
  const [rollupLoading, setRollupLoading] = useState(false);
  const [showRollupModal, setShowRollupModal] = useState(false);
  const [projectStatus, setProjectStatus] = useState("");

  // Get active project ID
  const selectedProjectId = typeof window !== "undefined" ? localStorage.getItem("selected_project_id") : null;

  const fetchTimelineData = async () => {
    if (!selectedProjectId) return;
    setLoading(true);
    setError("");
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const headers = { "Authorization": `Bearer ${token}` };
      
      // Fetch project details for status
      const projRes = await fetch(`http://localhost:8000/api/projects/${selectedProjectId}`, { headers });
      if (projRes.ok) {
        const projData = await projRes.json();
        setProjectStatus(projData.status);
      }

      const res = await fetch(`http://localhost:8000/api/projects/${selectedProjectId}/timeline`, { headers });
      if (!res.ok) throw new Error("Failed to fetch timeline logs");
      const data = await res.json();
      setTimeline(data);
    } catch (err: any) {
      setError(err.message || "Failed to load timeline events. Please verify backend connection.");
      setTimeline([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMonthlyRollup = async () => {
    if (!selectedProjectId) return;
    setRollupLoading(true);
    const token = localStorage.getItem("token");
    try {
      const headers = { "Authorization": `Bearer ${token}` };
      const res = await fetch(`http://localhost:8000/api/projects/${selectedProjectId}/reports/monthly`, { headers });
      if (!res.ok) throw new Error("Failed to load monthly AI Project Rollup");
      const data = await res.json();
      setMonthlyRollup(data);
      setShowRollupModal(true);
    } catch (err: any) {
      alert(err.message || "Error generating monthly rollup summary.");
      setMonthlyRollup(null);
    } finally {
      setRollupLoading(false);
    }
  };

  useEffect(() => {
    fetchTimelineData();
  }, [selectedProjectId]);

  if (loading) {
    return (
      <div className="pl-64 min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="h-8 w-8 text-orange-500 animate-spin" />
        <span className="text-slate-400 text-sm font-semibold">Loading Construction Journal...</span>
      </div>
    );
  }

  return (
    <div className="pl-64 min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-950/40 p-6 flex justify-between items-center backdrop-blur-md">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">
            Digital Construction Journal
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Day-by-day structural validation history and costs logs
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={loadMonthlyRollup}
            disabled={rollupLoading}
            className="flex items-center space-x-2 bg-gradient-to-r from-orange-600/90 to-amber-600/90 hover:from-orange-500 hover:to-amber-500 text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md"
          >
            {rollupLoading ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-white" />
            ) : (
              <FileText className="h-3.5 w-3.5 text-white" />
            )}
            <span>Generate Monthly AI Rollup</span>
          </button>
          <button
            onClick={fetchTimelineData}
            className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-800 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
            <span>Reload</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 flex-1 max-w-4xl mx-auto w-full relative space-y-8">

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-xs text-red-400 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Timeline Path line */}
        <div className="absolute left-[39px] md:left-1/2 top-10 bottom-10 w-0.5 bg-slate-800 pointer-events-none"></div>

        {/* Timeline Node List */}
        <div className="space-y-12 relative z-10">
          {timeline.map((item, idx) => {
            const isEven = idx % 2 === 0;
            return (
              <div 
                key={item.id}
                className={`flex flex-col md:flex-row items-stretch md:justify-between gap-6 relative ${
                  isEven ? "md:flex-row-reverse" : ""
                }`}
              >
                {/* Visual Circle Node */}
                <div className="absolute left-[24px] md:left-1/2 -translate-x-[7.5px] md:-translate-x-1/2 w-8 h-8 rounded-full bg-slate-900 border-2 border-orange-500 flex items-center justify-center text-orange-400 shadow-lg shadow-orange-500/10">
                  <Clock className="h-4 w-4" />
                </div>

                {/* Timeline Card */}
                <div className="w-full md:w-[45%] pl-16 md:pl-0">
                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 hover:border-slate-700 transition-colors shadow-lg">
                    {/* Timestamp */}
                    <div className="flex items-center justify-between border-b border-slate-850 pb-2.5">
                      <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest flex items-center space-x-1">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(item.date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <span className="text-[9px] bg-slate-950 px-2 py-0.5 border border-slate-800 rounded font-mono font-bold text-slate-400">
                        DAY #{timeline.length - idx}
                      </span>
                    </div>

                    {/* Headline and details */}
                    <div className="space-y-2">
                      <h3 className="text-sm font-extrabold text-slate-100 leading-snug">
                        {item.activity}
                      </h3>
                      
                      {/* AI Translation block */}
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 space-y-1">
                        <div className="flex items-center space-x-1 text-[9px] font-bold text-orange-400 tracking-wider uppercase">
                          <Sparkles className="h-3.5 w-3.5 text-orange-500" />
                          <span>AI Explanatory Log</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed italic">
                          {item.ai_summary}
                        </p>
                      </div>
                    </div>

                    {/* Cost and material boxes */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2 text-xs">
                      {/* Expense */}
                      {item.expense > 0 && (
                        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850 flex flex-col justify-center">
                          <span className="text-[9px] text-slate-500 font-bold uppercase block mb-0.5">Daily Expenses</span>
                          <span className="font-extrabold text-emerald-400 flex items-center">
                            <DollarSign className="h-3.5 w-3.5 shrink-0" />
                            {item.expense.toLocaleString()}
                          </span>
                        </div>
                      )}

                      {/* Wages */}
                      {item.labor_wages > 0 && (
                        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850 flex flex-col justify-center">
                          <span className="text-[9px] text-slate-500 font-bold uppercase block mb-0.5">Daily Wages</span>
                          <span className="font-extrabold text-amber-500 flex items-center">
                            <DollarSign className="h-3.5 w-3.5 shrink-0" />
                            {item.labor_wages.toLocaleString()}
                          </span>
                        </div>
                      )}

                      {/* Materials */}
                      {Object.keys(item.materials_used || {}).length > 0 && (
                        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850 flex flex-col justify-center col-span-2 md:col-span-1">
                          <span className="text-[9px] text-slate-500 font-bold uppercase block mb-0.5">Resources Used</span>
                          <div className="space-y-0.5">
                            {Object.entries(item.materials_used).map(([name, qty]) => (
                              <div key={name} className="flex items-center space-x-1 text-[10px] text-slate-300 font-medium">
                                <Package className="h-3 w-3 text-orange-400 shrink-0" />
                                <span>{String(qty)} {name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Attached Verification Photos */}
                    {item.photos_urls && item.photos_urls.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-slate-850">
                        <span className="text-[9px] text-slate-500 font-bold uppercase block">Verified Stage Photos</span>
                        <div className="grid grid-cols-2 gap-2">
                          {item.photos_urls.map((url: string, index: number) => (
                            <a 
                              key={index}
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="block aspect-video rounded-lg overflow-hidden border border-slate-800 bg-slate-950 hover:opacity-85 transition-opacity"
                            >
                              <img 
                                src={url} 
                                alt="Verification document" 
                                className="object-cover w-full h-full"
                              />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Empty block to align track on md layout */}
                <div className="hidden md:block w-[45%]"></div>
              </div>
            );
          })}

          {timeline.length === 0 && (
            <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
              <Clock className="h-8 w-8 text-slate-500 mx-auto" />
              <p className="text-sm font-semibold text-slate-400">No journal logs registered yet.</p>
              <p className="text-xs text-slate-500">Wait for your contractor to post daily reports.</p>
            </div>
          )}
        </div>

        {/* AI Rollup Report Modal */}
        {showRollupModal && monthlyRollup && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl relative">
              
              {/* Modal header */}
              <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
                <div className="flex items-center space-x-2">
                  <Award className="h-5 w-5 text-orange-400" />
                  <h3 className="font-extrabold text-slate-100">Monthly AI Project Rollup</h3>
                </div>
                <button 
                  onClick={() => setShowRollupModal(false)}
                  className="text-slate-400 hover:text-slate-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal body */}
              <div className="p-6 space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Project</h4>
                  <p className="text-lg font-bold text-slate-100">{monthlyRollup.project_name}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Status / Stages</span>
                    <p className="text-sm font-extrabold text-orange-400">{monthlyRollup.stage_completion_ratio}</p>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Progress Index</span>
                    <p className="text-sm font-extrabold text-orange-400">{monthlyRollup.progress_percentage}%</p>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Material Consumed This Month</span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold">Cement:</span>
                      <p className="font-bold text-slate-200">{monthlyRollup.material_summary.cement_bags} Bags</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold">Steel:</span>
                      <p className="font-bold text-slate-200">{monthlyRollup.material_summary.steel_kg} Kg</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Monthly Financial spent</span>
                  <p className="text-xl font-extrabold text-emerald-400">₹{monthlyRollup.total_cost.toLocaleString()}</p>
                  <p className="text-[10px] text-slate-400 leading-normal font-medium">{monthlyRollup.budget_forecast}</p>
                </div>
              </div>

              {/* Modal footer */}
              <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex justify-end">
                <button
                  onClick={() => {
                    // Simulating generating PDF
                    alert("PDF generated! Construction audit report exported to C:\\Users\\aishw\\Downloads\\AstroTower_Monthly_Report.pdf");
                    setShowRollupModal(false);
                  }}
                  className="flex items-center space-x-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-xs font-bold px-4 py-2 rounded-xl text-white transition-all shadow-md"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Signed PDF</span>
                </button>
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}
