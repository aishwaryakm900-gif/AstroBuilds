"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowRight,
  Truck,
  RotateCcw,
  User,
  AlertTriangle,
  RefreshCw
} from "lucide-react";

export default function SupplyChainPage() {
  const router = useRouter();
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const stages = [
    "Required",
    "Approved",
    "Ordered",
    "Vendor Accepted",
    "Fabrication",
    "Dispatch",
    "Transit",
    "Delivered",
    "Site Verification",
    "Installed"
  ];

  const fetchMaterials = async () => {
    setLoading(true);
    setError(false);
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const selectedProjectId = localStorage.getItem("selected_project_id");
    if (!selectedProjectId) {
      router.push("/project-select");
      return;
    }

    try {
      const headers = { "Authorization": `Bearer ${token}` };
      const res = await fetch(`http://localhost:8000/api/materials?project_id=${selectedProjectId}`, { headers });
      if (!res.ok) throw new Error("Failed to load supply chain pipeline");
      const data = await res.json();
      setMaterials(data);
    } catch (err) {
      console.error(err);
      setError(true);
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const moveNext = async (item: any) => {
    const currentIndex = stages.indexOf(item.status);
    if (currentIndex === -1 || currentIndex === stages.length - 1) return;
    const nextStatus = stages[currentIndex + 1];

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:8000/api/materials/${item.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      if (response.ok) {
        fetchMaterials();
      }
    } catch (err) {
      setMaterials(materials.map(m => m.id === item.id ? { ...m, status: nextStatus } : m));
    }
  };

  const movePrevious = async (item: any) => {
    const currentIndex = stages.indexOf(item.status);
    if (currentIndex === -1 || currentIndex === 0) return;
    const prevStatus = stages[currentIndex - 1];

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:8000/api/materials/${item.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: prevStatus })
      });
      if (response.ok) {
        fetchMaterials();
      }
    } catch (err) {
      setMaterials(materials.map(m => m.id === item.id ? { ...m, status: prevStatus } : m));
    }
  };

  return (
    <div className="pl-64 min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="border-b border-slate-900 bg-slate-950/40 p-6 flex justify-between items-center backdrop-blur-md">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">
            Supply Chain Pipeline
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time material flow tracker: Approved → Installed
          </p>
        </div>
        <button
          onClick={fetchMaterials}
          className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-800 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
          <span>Reload Flow</span>
        </button>
      </header>

      {/* Kanban Board Container */}
      <main className="p-6 flex-grow flex overflow-x-auto space-x-4 select-none scrollbar-thin">
        {materials.length === 0 ? (
          <div className="flex-grow bg-slate-900/20 border border-dashed border-slate-850 p-16 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 my-auto mx-auto max-w-lg">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-full">
              <Truck className="h-10 w-10 text-orange-500/80 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-355">No materials added.</h3>
              <p className="text-xs text-slate-500 max-w-xs">
                Your construction workspace supply chain is clean. Go to the Materials page to add materials and request orders to trigger the pipeline stages.
              </p>
            </div>
            <button
              onClick={() => router.push("/materials")}
              className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-xs font-bold px-6 py-2.5 rounded-xl border border-orange-500/20 transition-all shadow-lg shadow-orange-500/10"
            >
              Add Materials & Order
            </button>
          </div>
        ) : (
          stages.map((stage) => {
            const stageItems = materials.filter(m => m.status === stage);
            return (
              <div 
                key={stage} 
                className="w-72 bg-slate-900/60 border border-slate-900 rounded-2xl p-4 flex flex-col h-[calc(100vh-170px)] min-w-[280px]"
              >
                {/* Lane Header */}
                <div className="flex justify-between items-center pb-3 border-b border-slate-800/80 mb-4">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
                    {stage}
                  </span>
                  <span className="bg-slate-950 border border-slate-850 px-2 py-0.5 rounded text-[10px] text-slate-500 font-mono">
                    {stageItems.length}
                  </span>
                </div>

                {/* Lane Cards list */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
                  {stageItems.map((item) => (
                    <div 
                      key={item.id}
                      className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-3 hover:border-orange-500/30 transition-all duration-200"
                    >
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-slate-200">{item.name}</h4>
                        <p className="text-[10px] text-slate-500 font-mono">Qty: {item.quantity} | ${item.cost?.toLocaleString()}</p>
                      </div>

                      <div className="text-[10px] text-slate-400 space-y-1 bg-slate-900/40 p-2 rounded-lg border border-slate-900/60">
                        <div className="truncate"><span className="text-slate-600 font-semibold">Loc:</span> {item.current_location}</div>
                        <div><span className="text-slate-600 font-semibold">ETA:</span> {new Date(item.eta).toLocaleDateString()}</div>
                      </div>

                      {/* Move controls */}
                      <div className="flex justify-between items-center pt-2 border-t border-slate-900">
                        <button 
                          onClick={() => movePrevious(item)}
                          disabled={stage === "Approved"}
                          className="text-[10px] font-bold text-slate-500 hover:text-slate-200 disabled:opacity-30 disabled:hover:text-slate-500 flex items-center"
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          <span>Prev</span>
                        </button>
                        <button 
                          onClick={() => moveNext(item)}
                          disabled={stage === "Installed"}
                          className="text-[10px] font-bold text-orange-400 hover:text-orange-300 disabled:opacity-30 disabled:hover:text-orange-400 flex items-center"
                        >
                          <span>Next</span>
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {stageItems.length === 0 && (
                    <div className="h-24 flex items-center justify-center border border-dashed border-slate-850 rounded-xl text-[10px] text-slate-600">
                      Empty lane
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </main>
    </div>
  );
}
