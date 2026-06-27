"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  LineChart as ChartIcon, 
  DollarSign, 
  Settings, 
  TrendingDown, 
  TrendingUp, 
  Layers, 
  RefreshCw,
  Info
} from "lucide-react";

export default function BudgetPage() {
  const router = useRouter();
  const [budgetPlan, setBudgetPlan] = useState<any>(null);
  const [marketTrends, setMarketTrends] = useState<any>(null);
  const [selectedMaterial, setSelectedMaterial] = useState("Cement");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [inputLimit, setInputLimit] = useState("4500000");
  const [inputType, setInputType] = useState("Residential");

  // Get active project ID
  const selectedProjectId = typeof window !== "undefined" ? localStorage.getItem("selected_project_id") : null;

  useEffect(() => {
    const fetchProjectDetails = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      if (!selectedProjectId) {
        router.push("/project-select");
        return;
      }
      try {
        const res = await fetch(`http://localhost:8000/api/projects/${selectedProjectId}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.budget) setInputLimit(String(data.budget));
          if (data.building_type) setInputType(data.building_type);
        }
      } catch (err) {
        console.error("Failed to load project details", err);
      }
    };
    fetchProjectDetails();
  }, [selectedProjectId]);

  const fetchBudgetData = async () => {
    if (!selectedProjectId) return;
    setLoading(true);
    setError("");
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const headers = { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}` 
      };
      
      // Load or create budget optimization plan
      const optRes = await fetch(`http://localhost:8000/api/projects/${selectedProjectId}/budget/optimize`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          building_type: inputType,
          budget_limit: parseFloat(inputLimit) || 4500000.0
        })
      });
      if (!optRes.ok) {
        const errBody = await optRes.json().catch(() => ({}));
        throw new Error(errBody.detail || "Failed to load budget optimization plan");
      }
      const planData = await optRes.json();
      setBudgetPlan(planData);

      // Load market price forecasts
      const trendRes = await fetch(`http://localhost:8000/api/market/trends?material=${selectedMaterial}`, { headers });
      if (!trendRes.ok) throw new Error("Failed to load market price forecasts");
      const trendData = await trendRes.json();
      setMarketTrends(trendData);
      
    } catch (err: any) {
      setError(err.message || "Failed to fetch real-world budget intelligence. Please verify backend is running.");
      setBudgetPlan(null);
      setMarketTrends(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgetData();
  }, [selectedMaterial]);

  const handleOptimizeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBudgetData();
  };

  const materialsList = ["Cement", "Steel", "Sand", "Bricks", "Paint", "Tiles"];
  const details = budgetPlan?.details;

  return (
    <div className="pl-64 min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="border-b border-slate-900 bg-slate-950/40 p-6 flex justify-between items-center backdrop-blur-md">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">
            Budget Optimizer
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            AI-driven procurement tier planners and commodity index tracking
          </p>
        </div>
        <button
          onClick={fetchBudgetData}
          className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-800 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
          <span>Sync Prices</span>
        </button>
      </header>

      {error && (
        <div className="mx-6 mt-6 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs">
          {error}
        </div>
      )}

      <main className="p-6 flex-grow space-y-6">
        {/* Upper Row: Input Parameters and Market trends selector */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Optimization Form */}
          <div className="bg-slate-900 border border-slate-800/80 p-6 rounded-2xl md:col-span-1 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Optimization Parameters</h3>
            <form onSubmit={handleOptimizeSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Project Budget ($)</label>
                <input
                  required
                  value={inputLimit}
                  onChange={e => setInputLimit(e.target.value)}
                  type="number"
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Building Type</label>
                <select
                  value={inputType}
                  onChange={e => setInputType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-orange-500"
                >
                  <option value="Residential">Residential Building</option>
                  <option value="Commercial">Commercial Office Center</option>
                  <option value="Industrial">Industrial Warehouse</option>
                  <option value="Infrastructure">Infrastructure Bridge/Highway</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold py-3 rounded-xl text-xs transition-all border border-orange-500/20"
              >
                Compute Optimized Tiers
              </button>
            </form>
          </div>

          {/* Commodity Price Trends */}
          <div className="bg-slate-900 border border-slate-800/80 p-6 rounded-2xl md:col-span-2 space-y-4 flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center">
                <ChartIcon className="h-4 w-4 text-orange-500 mr-2" />
                <span>Market Price Forecasting</span>
              </h3>
              <select
                value={selectedMaterial}
                onChange={e => setSelectedMaterial(e.target.value)}
                className="bg-slate-950 border border-slate-850 text-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-orange-500"
              >
                {materialsList.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Price values and suggestions */}
            {marketTrends && (
              <div className="space-y-4 flex-grow flex flex-col justify-between pt-2">
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-black text-slate-100">${marketTrends.current_price}</span>
                  <span className="text-xs text-slate-500">Current Unit Index</span>
                </div>

                {/* Graph Simulator */}
                <div className="h-28 bg-slate-950/80 rounded-xl border border-slate-850 p-4 flex items-end justify-between relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-orange-500/5 to-transparent pointer-events-none"></div>
                  
                  {/* Historical Bars */}
                  {marketTrends.history.map((h: any, idx: number) => (
                    <div key={idx} className="flex flex-col items-center space-y-1">
                      <div className="h-12 bg-slate-800 w-6 rounded-sm flex items-end">
                        <div className="bg-slate-700 w-full rounded-sm" style={{ height: `${(h.price / marketTrends.current_price) * 100}%` }}></div>
                      </div>
                      <span className="text-[8px] text-slate-500">{h.month}</span>
                    </div>
                  ))}

                  {/* Divider line */}
                  <div className="h-12 border-l border-dashed border-slate-800 px-0.5"></div>

                  {/* Forecasted Bars */}
                  {marketTrends.forecast.map((f: any, idx: number) => (
                    <div key={idx} className="flex flex-col items-center space-y-1">
                      <div className="h-12 bg-slate-800 w-6 rounded-sm flex items-end">
                        <div className="bg-orange-500/60 w-full rounded-sm animate-pulse" style={{ height: `${(f.price / marketTrends.current_price) * 100}%` }}></div>
                      </div>
                      <span className="text-[8px] text-orange-400/80 font-semibold">{f.month}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-orange-500/10 border border-orange-500/15 p-3 rounded-xl flex items-start space-x-2 text-[11px] text-orange-400">
                  <Info className="h-4 w-4 shrink-0 mt-0.5" />
                  <span><strong>AI Strategy:</strong> {marketTrends.best_timing}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Tier Planning Comparison */}
        {!details ? (
          <div className="bg-slate-900/20 border border-dashed border-slate-850 p-16 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 max-w-lg mx-auto my-8">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-full">
              <DollarSign className="h-10 w-10 text-orange-500/80 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-355">No budget optimization calculated.</h3>
              <p className="text-xs text-slate-500 max-w-xs">
                Provide your total project budget and building type to generate premium, standard, and economy AI tier allocations.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {Object.keys(details.plans).map((planName) => {
              const plan = details.plans[planName];
              return (
                <div 
                  key={planName}
                  className={`bg-slate-900 border p-6 rounded-2xl space-y-4 flex flex-col justify-between ${
                    planName === "Standard" ? "border-orange-500/50 shadow-md shadow-orange-500/5" : "border-slate-800/80"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <h4 className="text-md font-extrabold text-slate-100 flex items-center">
                        <Layers className="h-4.5 w-4.5 text-orange-500 mr-2" />
                        {planName} Plan
                      </h4>
                      {planName === "Standard" && (
                        <span className="bg-orange-500 text-white font-bold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-normal">{plan.description}</p>
                  </div>

                  {/* Breakdown cost categories */}
                  <div className="space-y-2 border-y border-slate-800/80 py-4 my-2 text-[11px]">
                    {Object.keys(plan.breakdown).map((catName) => (
                      <div key={catName} className="flex justify-between">
                        <span className="text-slate-500 truncate mr-2">{catName}</span>
                        <span className="font-mono text-slate-350">${plan.breakdown[catName]?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      </div>
                    ))}
                  </div>

                  {/* Bottom metrics */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-baseline text-xs font-bold">
                      <span className="text-slate-500">Savings</span>
                      <span className="text-green-400 font-mono">${plan.savings?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex justify-between items-baseline text-xs font-bold">
                      <span className="text-slate-500">Utilization</span>
                      <span className="text-slate-300 font-mono">{plan.utilization_pct}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
