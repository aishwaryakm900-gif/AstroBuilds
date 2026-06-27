"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  PackageOpen, 
  Calendar, 
  DollarSign, 
  User, 
  Truck, 
  CheckCircle,
  PlusCircle,
  RefreshCw,
  Info,
  Pencil
} from "lucide-react";

export default function MaterialsPage() {
  const router = useRouter();
  const [materials, setMaterials] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // New Order Form state
  const [showAddOrder, setShowAddOrder] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("Cement");
  const [newQty, setNewQty] = useState("");
  const [newUnit, setNewUnit] = useState("bags");
  const [newCost, setNewCost] = useState("");
  const [newVendorId, setNewVendorId] = useState("");
  const [newEta, setNewEta] = useState("");
  const [newPriority, setNewPriority] = useState("Medium");
  const [newStatus, setNewStatus] = useState("Required");
  const [projectStatus, setProjectStatus] = useState("");
  const [editingMaterial, setEditingMaterial] = useState<any | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError("");
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
      
      // Fetch project details for status
      const projRes = await fetch(`http://localhost:8000/api/projects/${selectedProjectId}`, { headers });
      if (projRes.ok) {
        const projData = await projRes.json();
        setProjectStatus(projData.status);
      }

      // Load materials filtered by selected project ID
      const matRes = await fetch(`http://localhost:8000/api/materials?project_id=${selectedProjectId}`, { headers });
      if (!matRes.ok) throw new Error("Failed to load materials");
      const matData = await matRes.json();
      setMaterials(matData);

      // Load vendors list
      const vendorRes = await fetch("http://localhost:8000/api/vendors", { headers });
      const vendorData = await vendorRes.ok ? await vendorRes.json() : [];
      setVendors(vendorData);
      
    } catch (err: any) {
      setError(err.message || "Failed to load materials. Please verify backend is running.");
      setMaterials([]);
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetOrderForm = () => {
    setNewName("");
    setNewCategory("Cement");
    setNewQty("");
    setNewUnit("bags");
    setNewCost("");
    setNewVendorId("");
    setNewEta("");
    setNewPriority("Medium");
    setEditingMaterial(null);
    setShowAddOrder(false);
  };

  const openEditMaterial = (m: any) => {
    setEditingMaterial(m);
    setNewName(m.name);
    setNewCategory(m.category);
    setNewQty(String(m.quantity));
    setNewUnit(m.unit);
    setNewCost(String(m.cost));
    setNewVendorId(m.vendor_id ? String(m.vendor_id) : "");
    setNewEta(m.eta ? new Date(m.eta).toISOString().split("T")[0] : "");
    setNewPriority(m.priority || "Medium");
    setShowAddOrder(true);
  };

  const handleOrderMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return;

    const selectedProjectId = localStorage.getItem("selected_project_id");
    if (!selectedProjectId) {
      router.push("/project-select");
      return;
    }

    try {
      const payload = {
        name: newName,
        category: newCategory,
        quantity: parseFloat(newQty),
        unit: newUnit,
        cost: parseFloat(newCost),
        vendor_id: newVendorId ? parseInt(newVendorId) : null,
        current_location: editingMaterial?.current_location || "Vendor Facility",
        status: editingMaterial?.status || "Required",
        eta: newEta || null,
        priority: newPriority
      };

      const url = editingMaterial
        ? `http://localhost:8000/api/materials/${editingMaterial.id}`
        : `http://localhost:8000/api/projects/${selectedProjectId}/materials`;
      const response = await fetch(url, {
        method: editingMaterial ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        resetOrderForm();
        fetchData();
      } else {
        const errData = await response.json();
        throw new Error(errData.detail || "Error placing order");
      }
    } catch (err: any) {
      alert(err.message || "Error placing order.");
    }
  };

  const handleUpdateStatus = async (materialId: number, nextStatus: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:8000/api/materials/${materialId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      if (response.ok) {
        fetchData();
      }
    } catch (err) {
      setMaterials(materials.map(m => m.id === materialId ? { ...m, status: nextStatus } : m));
    }
  };

  return (
    <div className="pl-64 min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="border-b border-slate-900 bg-slate-950/40 p-6 flex justify-between items-center backdrop-blur-md">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">
            Material Procurement
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Order tracking log and vendor supply chain status
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {projectStatus !== "Completed" && (
            <button
              onClick={() => setShowAddOrder(!showAddOrder)}
              className="flex items-center space-x-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-xs font-semibold px-4 py-2.5 rounded-xl border border-orange-500/20 transition-all shadow-lg shadow-orange-500/10"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Place Order</span>
            </button>
          )}
        </div>
      </header>

      <main className="p-6 flex-grow space-y-6">

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs">
            {error}
          </div>
        )}
        {/* Order Form Modal Drawer */}
        {showAddOrder && (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h3 className="text-md font-bold text-slate-200">{editingMaterial ? "Edit Procurement Order" : "New Procurement Order"}</h3>
            <form onSubmit={handleOrderMaterial} className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Material Name</label>
                <input required value={newName} onChange={e => setNewName(e.target.value)} type="text" placeholder="Portland Cement" className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Category</label>
                <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-orange-500">
                  <option value="Cement">Cement</option>
                  <option value="Steel">Steel</option>
                  <option value="Sand">Sand</option>
                  <option value="Bricks">Bricks</option>
                  <option value="Paint">Paint</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Select Supplier</label>
                <select value={newVendorId} onChange={e => setNewVendorId(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-orange-500">
                  <option value="">Choose a Supplier</option>
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Quantity</label>
                  <input required value={newQty} onChange={e => setNewQty(e.target.value)} type="number" placeholder="500" className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Unit (e.g. bags, tons)</label>
                  <input required value={newUnit} onChange={e => setNewUnit(e.target.value)} type="text" placeholder="bags" className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Estimated Cost ($)</label>
                  <input required value={newCost} onChange={e => setNewCost(e.target.value)} type="number" placeholder="4200" className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Priority Level</label>
                  <select value={newPriority} onChange={e => setNewPriority(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-355 focus:outline-none focus:border-orange-500">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Delivery Date / Target ETA</label>
                <input value={newEta} onChange={e => setNewEta(e.target.value)} type="date" className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-350 focus:outline-none focus:border-orange-500" />
              </div>
              <div className="md:col-span-2 flex justify-end space-x-3 pt-2">
                <button type="button" onClick={resetOrderForm} className="bg-slate-950 hover:bg-slate-850 border border-slate-850 text-slate-400 px-4 py-2 rounded-xl text-xs font-semibold">Cancel</button>
                <button type="submit" className="bg-gradient-to-r from-orange-600 to-amber-600 text-white px-5 py-2 rounded-xl text-xs font-bold">{editingMaterial ? "Save Changes" : "Submit Order"}</button>
              </div>
            </form>
          </div>
        )}

        {/* Materials Table Log or Empty State */}
        {materials.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800/80 p-16 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 shadow-xl">
            <PackageOpen className="h-12 w-12 text-slate-600" />
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-350">No materials added.</h3>
              <p className="text-xs text-slate-500 max-w-sm">Start tracking site materials by placing your first procurement order.</p>
            </div>
            <button
              onClick={() => setShowAddOrder(true)}
              className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-xs font-bold px-5 py-2.5 rounded-xl border border-orange-500/20 transition-all shadow-lg shadow-orange-500/10"
            >
              Add First Material
            </button>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-5 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Order Logs</h3>
              <span className="text-xs bg-slate-950 px-2 py-0.5 rounded text-slate-500 border border-slate-850">{materials.length} Active Orders</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-850 font-bold uppercase tracking-wider">
                    <th className="p-4">Material description</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Supplier</th>
                    <th className="p-4">Quantity</th>
                    <th className="p-4">Total Cost</th>
                    <th className="p-4">ETA</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-200">
                  {materials.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-850/40 transition-colors">
                      <td className="p-4 font-semibold text-slate-100 flex items-center space-x-2">
                        <PackageOpen className="h-4 w-4 text-orange-500" />
                        <div>
                          <span>{m.name}</span>
                          <span className="block text-[9px] text-slate-500 font-medium font-mono uppercase tracking-wider">{m.priority} Priority</span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-400">{m.category}</td>
                      <td className="p-4 text-slate-400">{m.vendor?.name || m.vendor_id || "Direct Supply"}</td>
                      <td className="p-4 font-mono">{m.quantity} {m.unit}</td>
                      <td className="p-4 font-mono font-semibold">${m.cost?.toLocaleString()}</td>
                      <td className="p-4 text-slate-400">{m.eta ? new Date(m.eta).toLocaleDateString() : "—"}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                          m.status === "Installed"
                            ? "bg-green-500/10 text-green-400 border-green-500/15"
                            : m.status === "Delivered" || m.status === "Site Verification"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/15"
                            : ["Transit", "In Transit", "Dispatch"].includes(m.status)
                            ? "bg-sky-500/10 text-sky-400 border-sky-500/15 animate-pulse"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/15"
                        }`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {projectStatus !== "Completed" && (
                            <button
                              onClick={() => openEditMaterial(m)}
                              className="p-1.5 rounded-lg border border-slate-850 hover:border-orange-500/50 text-slate-400 hover:text-orange-400"
                              title="Edit order"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <select
                            value={m.status}
                            disabled={projectStatus === "Completed"}
                            onChange={(e) => handleUpdateStatus(m.id, e.target.value)}
                            className="bg-slate-950 border border-slate-850 text-slate-300 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-orange-500/80 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <option value="Required">Required</option>
                            <option value="Approved">Approved</option>
                            <option value="Ordered">Ordered</option>
                            <option value="Vendor Accepted">Vendor Accepted</option>
                            <option value="Fabrication">Fabrication</option>
                            <option value="Dispatch">Dispatch</option>
                            <option value="Transit">Transit</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Site Verification">Site Verification</option>
                            <option value="Installed">Installed</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
