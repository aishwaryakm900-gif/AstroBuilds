"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Truck, PlusCircle, Pencil } from "lucide-react";

const STATUS_OPTIONS = ["Created", "Ready to dispatch", "In transit", "Delivered", "Closed"];

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [projectStatus, setProjectStatus] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [poNumber, setPoNumber] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [eta, setEta] = useState("");
  const [status, setStatus] = useState("Created");

  const resetForm = () => {
    setPoNumber("");
    setVendorId("");
    setDescription("");
    setAmount("");
    setEta("");
    setStatus("Created");
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
        setProjectStatus((await projRes.json()).status);
      }
      const [ordersRes, vendorsRes] = await Promise.all([
        fetch(`http://localhost:8000/api/purchase-orders?project_id=${projectId}`, { headers }),
        fetch("http://localhost:8000/api/vendors", { headers }),
      ]);
      if (!ordersRes.ok) throw new Error("Failed to load purchase orders");
      setOrders(await ordersRes.json());
      setVendors(vendorsRes.ok ? await vendorsRes.json() : []);
    } catch (err: any) {
      setError(err.message || "Failed to load purchase orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openEdit = (order: any) => {
    setEditingId(order.id);
    setPoNumber(order.po_number);
    setVendorId(order.vendor_id ? String(order.vendor_id) : "");
    setDescription(order.description);
    setAmount(String(order.amount || ""));
    setEta(order.eta || "");
    setStatus(order.status || "Created");
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const projectId = localStorage.getItem("selected_project_id");
    if (!token || !projectId) return;

    const payload = {
      po_number: poNumber,
      vendor_id: vendorId ? parseInt(vendorId) : null,
      description,
      amount: parseFloat(amount) || 0,
      eta: eta || null,
      status,
    };

    try {
      const url = editingId
        ? `http://localhost:8000/api/purchase-orders/${editingId}`
        : `http://localhost:8000/api/projects/${projectId}/purchase-orders`;
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
      alert(err.message || "Failed to save purchase order");
    }
  };

  const isReadOnly = false;

  return (
    <div className="pl-64 min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="mx-auto max-w-5xl rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Purchase orders</p>
            <h1 className="text-2xl font-semibold">Live order tracking</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-sm text-cyan-300">
              {orders.length} active
            </div>
            {!isReadOnly && (
              <button
                onClick={() => {
                  resetForm();
                  setShowForm(true);
                }}
                className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-xs font-bold px-4 py-2 rounded-xl"
              >
                <PlusCircle className="h-4 w-4" />
                New PO
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
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">PO Number</label>
              <input required value={poNumber} onChange={(e) => setPoNumber(e.target.value)} placeholder="PO-104" className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Supplier</label>
              <select value={vendorId} onChange={(e) => setVendorId(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs">
                <option value="">Select vendor</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Description</label>
              <input required value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Amount ($)</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">ETA</label>
              <input value={eta} onChange={(e) => setEta(e.target.value)} placeholder="3 days" className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs">
                {STATUS_OPTIONS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2 flex justify-end gap-2">
              <button type="button" onClick={resetForm} className="px-4 py-2 text-xs border border-slate-800 rounded-xl">Cancel</button>
              <button type="submit" className="px-4 py-2 text-xs bg-cyan-600 rounded-xl font-bold">
                {editingId ? "Save Changes" : "Create PO"}
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 space-y-3">
          {loading ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : orders.length === 0 ? (
            <p className="text-sm text-slate-500">No purchase orders yet.</p>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400">
                    <Truck className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">{order.po_number}</p>
                    <p className="text-sm text-slate-400">
                      {order.vendor?.name || "Direct supply"} • {order.description} • ETA {order.eta || "TBD"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full border border-slate-700 px-3 py-1 text-sm text-slate-300">{order.status}</span>
                  {!isReadOnly && (
                    <button
                      onClick={() => openEdit(order)}
                      className="p-2 rounded-lg border border-slate-800 hover:border-cyan-500/50 text-slate-400 hover:text-cyan-400"
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
