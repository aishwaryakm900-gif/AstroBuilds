"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, PlusCircle, Phone, Pencil } from "lucide-react";

export default function VendorsPage() {
  const router = useRouter();
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newName, setNewName] = useState("");
  const [newContact, setNewContact] = useState("");

  const resetForm = () => {
    setNewName("");
    setNewContact("");
    setEditingId(null);
    setShowForm(false);
  };

  const fetchVendors = async () => {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch("http://localhost:8000/api/vendors", { headers });
      if (!res.ok) throw new Error("Failed to load vendors");
      setVendors(await res.json());
    } catch (err: any) {
      setError(err.message || "Failed to load vendors. Please verify backend connection.");
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const openEdit = (vendor: any) => {
    setEditingId(vendor.id);
    setNewName(vendor.name);
    setNewContact(vendor.contact_details || "");
    setShowForm(true);
  };

  const handleSaveVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const url = editingId
        ? `http://localhost:8000/api/vendors/${editingId}`
        : "http://localhost:8000/api/vendors";
      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newName,
          contact_details: newContact,
        }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.detail || "Failed to save vendor");
      }

      resetForm();
      fetchVendors();
    } catch (err: any) {
      alert(err.message || "Error saving vendor. Please try again.");
    }
  };

  return (
    <div className="pl-64 min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="border-b border-slate-900 bg-slate-950/40 p-6 flex justify-between items-center backdrop-blur-md">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">Vendor Directory</h2>
          <p className="text-xs text-slate-500 mt-1">
            Supplier registry with auto-calculated reliability and risk scores
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center space-x-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-xs font-semibold px-4 py-2.5 rounded-xl border border-orange-500/20 transition-all shadow-lg shadow-orange-500/10"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Add Vendor</span>
        </button>
      </header>

      {error && (
        <div className="mx-6 mt-6 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs">
          {error}
        </div>
      )}

      <main className="p-6 flex-grow space-y-6">
        {showForm && (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h3 className="text-md font-bold text-slate-200">
              {editingId ? "Edit Supplier" : "Register Supplier"}
            </h3>
            <form onSubmit={handleSaveVendor} className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Vendor Name</label>
                <input required value={newName} onChange={(e) => setNewName(e.target.value)} type="text" placeholder="Global Logistics Inc" className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Contact Details</label>
                <input required value={newContact} onChange={(e) => setNewContact(e.target.value)} type="text" placeholder="sales@global.com | +1 555-0100" className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500" />
              </div>
              <div className="md:col-span-2 flex justify-end space-x-3 pt-2">
                <button type="button" onClick={resetForm} className="bg-slate-950 hover:bg-slate-850 border border-slate-850 text-slate-400 px-4 py-2 rounded-xl text-xs font-semibold">Cancel</button>
                <button type="submit" className="bg-gradient-to-r from-orange-600 to-amber-600 text-white px-5 py-2 rounded-xl text-xs font-bold">
                  {editingId ? "Save Changes" : "Register Vendor"}
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <p className="text-sm text-slate-500">Loading vendors...</p>
        ) : vendors.length === 0 ? (
          <div className="bg-slate-900/20 border border-dashed border-slate-850 p-16 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 max-w-lg mx-auto my-8">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-full">
              <Users className="h-10 w-10 text-orange-500/80" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-350">No vendors registered.</h3>
              <p className="text-xs text-slate-500 max-w-xs">
                Register suppliers to track delivery performance and procurement reliability automatically.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-5 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Vendor Directories</h3>
              <span className="text-xs bg-slate-950 px-2 py-0.5 rounded text-slate-500 border border-slate-850">{vendors.length} Registered Suppliers</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-850 font-bold uppercase tracking-wider">
                    <th className="p-4">Supplier</th>
                    <th className="p-4">Contact</th>
                    <th className="p-4 text-center">Reliability</th>
                    <th className="p-4 text-center">Performance</th>
                    <th className="p-4 text-right">Risk</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-200">
                  {vendors.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-850/40 transition-colors">
                      <td className="p-4 font-bold text-slate-100 flex items-center space-x-2">
                        <Users className="h-4 w-4 text-orange-500" />
                        <span>{v.name}</span>
                      </td>
                      <td className="p-4 text-slate-400">
                        <div className="flex items-center space-x-1">
                          <Phone className="h-3.5 w-3.5 text-slate-650 mr-1" />
                          <span>{v.contact_details}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className="bg-slate-950 border border-slate-850 px-2.5 py-1 rounded font-mono font-bold text-slate-200">
                          {v.reliability_score}%
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="bg-slate-950 border border-slate-850 px-2.5 py-1 rounded font-mono font-bold text-orange-400">
                          {v.performance_score}%
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <span className={`px-2.5 py-1 rounded font-bold text-[10px] uppercase border ${
                          v.risk_score < 8
                            ? "bg-green-500/10 text-green-400 border-green-500/15"
                            : v.risk_score < 18
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/15"
                            : "bg-red-500/10 text-red-400 border-red-500/15"
                        }`}>
                          {v.risk_score < 8 ? "Low Risk" : v.risk_score < 18 ? "Medium Risk" : "High Risk"} ({v.risk_score}%)
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => openEdit(v)}
                          className="p-2 rounded-lg border border-slate-850 hover:border-orange-500/50 text-slate-400 hover:text-orange-400"
                          title="Edit vendor"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
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
