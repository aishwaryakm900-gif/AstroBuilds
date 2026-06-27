"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardCheck, PlusCircle, Pencil } from "lucide-react";

const STATUS_OPTIONS = [
  "Pending approval",
  "Awaiting vendor quote",
  "Approved",
  "Rejected",
  "Converted to PO",
];

export default function PurchaseRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [projectStatus, setProjectStatus] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("Cement");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("bags");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [status, setStatus] = useState("Pending approval");
  const [requestedBy, setRequestedBy] = useState("");

  const resetForm = () => {
    setName("");
    setCategory("Cement");
    setQuantity("");
    setUnit("bags");
    setEstimatedCost("");
    setPriority("Medium");
    setStatus("Pending approval");
    setRequestedBy("");
    setEditingId(null);
    setShowForm(false);
  };

  const fetchData = async () => {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("token");
    const projectId = localStorage.getItem("selected_project_id");
    if (!token) {
      router.push("/login");
      return;
    }
    if (!projectId) {
      router.push("/project-select");
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const projRes = await fetch(`http://localhost:8000/api/projects/${projectId}`, { headers });
      if (projRes.ok) {
        const projData = await projRes.json();
        setProjectStatus(projData.status);
      }
      const res = await fetch(
        `http://localhost:8000/api/purchase-requests?project_id=${projectId}`,
        { headers }
      );
      if (!res.ok) throw new Error("Failed to load purchase requests");
      setRequests(await res.json());
    } catch (err: any) {
      setError(err.message || "Failed to load purchase requests");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openEdit = (req: any) => {
    setEditingId(req.id);
    setName(req.name);
    setCategory(req.category);
    setQuantity(String(req.quantity));
    setUnit(req.unit);
    setEstimatedCost(String(req.estimated_cost));
    setPriority(req.priority || "Medium");
    setStatus(req.status || "Pending approval");
    setRequestedBy(req.requested_by || "");
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const projectId = localStorage.getItem("selected_project_id");
    if (!token || !projectId) return;

    const payload = {
      name,
      category,
      quantity: parseFloat(quantity),
      unit,
      estimated_cost: parseFloat(estimatedCost),
      priority,
      status,
      requested_by: requestedBy || null,
    };

    try {
      const url = editingId
        ? `http://localhost:8000/api/purchase-requests/${editingId}`
        : `http://localhost:8000/api/projects/${projectId}/purchase-requests`;
      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Save failed");
      }
      resetForm();
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to save purchase request");
    }
  };

  const isReadOnly = false;

  return (
    <div className="pl-64 min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="mx-auto max-w-5xl rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-orange-400">Purchase requests</p>
            <h1 className="text-2xl font-semibold">Track new procurement requests</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-sm text-orange-300">
              {requests.length} open
            </div>
            {!isReadOnly && (
              <button
                onClick={() => {
                  resetForm();
                  setShowForm(true);
                }}
                className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-amber-600 text-xs font-bold px-4 py-2 rounded-xl"
              >
                <PlusCircle className="h-4 w-4" />
                New Request
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs">
            {error}
          </div>
        )}

        {showForm && !isReadOnly && (
          <form onSubmit={handleSubmit} className="mt-6 grid md:grid-cols-2 gap-4 bg-slate-950/60 border border-slate-800 p-5 rounded-xl">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Title</label>
              <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs">
                <option>Cement</option>
                <option>Steel</option>
                <option>Electrical</option>
                <option>Paint</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Quantity</label>
              <input required type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Unit</label>
              <input required value={unit} onChange={(e) => setUnit(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Estimated cost ($)</label>
              <input required type="number" value={estimatedCost} onChange={(e) => setEstimatedCost(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs">
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
                <option>Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs">
                {STATUS_OPTIONS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Raised by</label>
              <input value={requestedBy} onChange={(e) => setRequestedBy(e.target.value)} placeholder="Site engineer" className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs" />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2">
              <button type="button" onClick={resetForm} className="px-4 py-2 text-xs border border-slate-800 rounded-xl">Cancel</button>
              <button type="submit" className="px-4 py-2 text-xs bg-orange-600 rounded-xl font-bold">
                {editingId ? "Save Changes" : "Create Request"}
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 space-y-3">
          {loading ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : requests.length === 0 ? (
            <p className="text-sm text-slate-500">No purchase requests yet.</p>
          ) : (
            requests.map((request) => (
              <div key={request.id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-orange-500/10 p-2 text-orange-400">
                    <ClipboardCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">{request.name}</p>
                    <p className="text-sm text-slate-400">
                      {request.category} • {request.quantity} {request.unit} • Raised by {request.requested_by || "Team"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full border border-slate-700 px-3 py-1 text-sm text-slate-300">{request.status}</span>
                  {!isReadOnly && (
                    <button
                      onClick={() => openEdit(request)}
                      className="p-2 rounded-lg border border-slate-800 hover:border-orange-500/50 text-slate-400 hover:text-orange-400"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
