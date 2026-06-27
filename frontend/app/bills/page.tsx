"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Receipt, 
  Search, 
  Upload, 
  Camera, 
  Calendar, 
  DollarSign, 
  Building, 
  Tag, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Eye, 
  FileText, 
  RefreshCw,
  Sparkles,
  Info,
  X
} from "lucide-react";

export default function BillsPage() {
  const router = useRouter();
  const [bills, setBills] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [projectStatus, setProjectStatus] = useState("");
  const [editingBill, setEditingBill] = useState<any>(null);
  const [editForm, setEditForm] = useState({ vendor_name: "", amount: "", tags: "" });
  const [updateLoading, setUpdateLoading] = useState(false);
  
  // Selected project context
  const selectedProjectId = typeof window !== "undefined" ? localStorage.getItem("selected_project_id") : null;
  const selectedProjectName = typeof window !== "undefined" ? localStorage.getItem("selected_project_name") : null;
  const [userRole, setUserRole] = useState("");

  const fetchBills = async (query = "") => {
    if (!selectedProjectId) return;
    setLoading(true);
    setError("");

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      // Fetch project details for status check
      const projRes = await fetch(`http://localhost:8000/api/projects/${selectedProjectId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (projRes.ok) {
        const projData = await projRes.json();
        setProjectStatus(projData.status);
      }

      const url = `http://localhost:8000/api/projects/${selectedProjectId}/bills` + (query ? `?q=${encodeURIComponent(query)}` : "");
      const res = await fetch(url, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) {
        throw new Error("Failed to load project bills ledger");
      }
      const data = await res.json();
      setBills(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch bills. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUserRole(parsed.role || "");
    }
    if (selectedProjectId) {
      fetchBills();
    }
  }, [selectedProjectId]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    fetchBills(val);
  };

  const handleChipClick = (tag: string) => {
    setSearchQuery(tag);
    fetchBills(tag);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedProjectId) return;
    
    const file = files[0];
    setUploading(true);
    setError("");

    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`http://localhost:8000/api/projects/${selectedProjectId}/bills`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) {
        throw new Error("Invoice upload and AI analysis failed");
      }

      const newBill = await res.json();
      // Prepend to bills list
      setBills((prev) => [newBill, ...prev]);
      
      // Auto open details of uploaded bill
      setSelectedBill(newBill);
    } catch (err: any) {
      setError(err.message || "Failed to analyze bill photo.");
    } finally {
      setUploading(false);
    }
  };

  // Mock taking a photo by choosing from a selection of realistic template names
  const handleUpdateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBill || !selectedProjectId) return;
    setUpdateLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:8000/api/projects/${selectedProjectId}/bills/${editingBill.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          vendor_name: editForm.vendor_name || null,
          amount: editForm.amount ? parseFloat(editForm.amount) : null,
          tags: editForm.tags || null
        })
      });
      if (!res.ok) throw new Error("Failed to update bill");
      const updatedBill = await res.json();
      setBills(bills.map(b => b.id === updatedBill.id ? updatedBill : b));
      setEditingBill(null);
      if (selectedBill?.id === updatedBill.id) {
        setSelectedBill(updatedBill);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdateLoading(false);
    }
  };

  const openEditModal = (bill: any) => {
    setEditingBill(bill);
    setEditForm({
      vendor_name: bill.vendor_name || "",
      amount: bill.amount ? bill.amount.toString() : "",
      tags: bill.tags || ""
    });
  };

  const handleSimulateCameraCapture = async (billType: string) => {
    if (!selectedProjectId) return;
    setUploading(true);
    setError("");

    const token = localStorage.getItem("token");
    
    // Create a mock File object
    const blob = new Blob(["mock-bill-content"], { type: "image/jpeg" });
    const filename = `${billType}-receipt.jpg`;
    const mockFile = new File([blob], filename, { type: "image/jpeg" });

    const formData = new FormData();
    formData.append("file", mockFile);

    try {
      const res = await fetch(`http://localhost:8000/api/projects/${selectedProjectId}/bills`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) {
        throw new Error("Simulated bill analysis failed");
      }

      const newBill = await res.json();
      setBills((prev) => [newBill, ...prev]);
      setSelectedBill(newBill);
    } catch (err: any) {
      setError(err.message || "Failed to analyze simulated camera capture.");
    } finally {
      setUploading(false);
    }
  };

  if (!selectedProjectId) {
    return (
      <div className="pl-64 min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <Receipt className="h-16 w-16 text-slate-700 mb-4 animate-bounce" />
        <h2 className="text-xl font-bold">No active project selected</h2>
        <p className="text-sm text-slate-500 max-w-sm mt-2">
          Select or link a construction project in the Project Switcher first to access the bills neural ledger.
        </p>
      </div>
    );
  }

  const tagChips = ["cement", "steel", "pipe", "paint", "UltraTech", "Tata", "Ambuja", "Berger", "2026"];

  return (
    <div className="pl-64 min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Page Header */}
      <header className="border-b border-slate-900 bg-slate-950/40 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 backdrop-blur-md sticky top-0 z-20">
        <div>
          <div className="flex items-center space-x-2 text-xs text-orange-400 font-bold uppercase tracking-wider mb-1">
            <span>Neural AI Document Hub</span>
            <span className="text-slate-700">•</span>
            <span className="text-slate-400 font-medium normal-case">{selectedProjectName}</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">
            Digital Invoices Ledger
          </h2>
          <p className="text-xs text-slate-500">
            {userRole === "Project Owner"
              ? "View all bills uploaded by your project team"
              : "Shared repository for visual OCR invoice capturing, verification and instant lookup"}
          </p>
        </div>

        {/* Upload Bill / Take photo — contractors & site engineers only */}
        {projectStatus !== "Completed" && userRole !== "Project Owner" && (
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center space-x-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-xs font-bold px-4.5 py-3 rounded-xl shadow-lg shadow-orange-500/10 cursor-pointer border border-orange-500/25 transition-all">
              <Upload className="h-4 w-4" />
              <span>Upload Invoice Image</span>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleFileUpload} 
                disabled={uploading}
              />
            </label>

            {/* Direct Camera Capture option */}
            <label className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-xs font-semibold px-4.5 py-3 rounded-xl border border-slate-800 cursor-pointer transition-all shadow-md">
              <Camera className="h-4 w-4 text-orange-500" />
              <span>Take Photo & Upload</span>
              <input 
                type="file" 
                accept="image/*" 
                capture="environment"
                className="hidden" 
                onChange={handleFileUpload} 
                disabled={uploading}
              />
            </label>

            {/* Quick Simulated Photo Capture buttons for evaluation */}
            <div className="dropdown relative group">
              <button
                disabled={uploading}
                className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-xs font-semibold px-4.5 py-3 rounded-xl border border-slate-800 transition-all"
              >
                <Camera className="h-4 w-4 text-orange-500 mr-0.5" />
                <span>Simulate Cam Capture</span>
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-30">
                <button 
                  onClick={() => handleSimulateCameraCapture("cement")}
                  className="w-full text-left px-4 py-2.5 text-xs text-slate-300 hover:bg-slate-800 transition-colors border-b border-slate-850"
                >
                  👷 Cement Bill Photo
                </button>
                <button 
                  onClick={() => handleSimulateCameraCapture("steel")}
                  className="w-full text-left px-4 py-2.5 text-xs text-slate-300 hover:bg-slate-800 transition-colors border-b border-slate-850"
                >
                  🏗️ Steel Rebar Invoice
                </button>
                <button 
                  onClick={() => handleSimulateCameraCapture("pipes")}
                  className="w-full text-left px-4 py-2.5 text-xs text-slate-300 hover:bg-slate-800 transition-colors border-b border-slate-850"
                >
                  🚰 PVC Piping Invoice
                </button>
                <button 
                  onClick={() => handleSimulateCameraCapture("paints")}
                  className="w-full text-left px-4 py-2.5 text-xs text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  🎨 Berger Paints Bill
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Ledger Content */}
      <main className="p-6 flex-1 flex flex-col space-y-6">
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-start space-x-2 text-xs">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Global Loading Overlay for OCR Analysis */}
        {uploading && (
          <div className="bg-gradient-to-tr from-slate-900 to-slate-950 border border-orange-500/30 p-8 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 shadow-2xl animate-pulse">
            <div className="p-4 bg-orange-500/10 rounded-full border border-orange-500/20">
              <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
            </div>
            <div>
              <h3 className="text-md font-bold text-orange-400 flex items-center justify-center space-x-1.5">
                <Sparkles className="h-4 w-4 text-orange-400" />
                <span>AI Document OCR Analysing...</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                AstroBuilds AI is reading text headers, extracting billing lines, parsing purchase date, vendor details and auto-indexing tags.
              </p>
            </div>
          </div>
        )}

        {/* Search Bar & Suggestion Chips */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search invoices by vendor name, date, items, or OCR tags (e.g. cement, Tata Tiscon, June 2026)..."
              className="w-full bg-slate-900 border border-slate-800 focus:border-orange-500/80 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none transition-all"
            />
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mr-1">OCR Filter Suggestions:</span>
            {tagChips.map((tag) => (
              <button
                key={tag}
                onClick={() => handleChipClick(tag)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  searchQuery.toLowerCase() === tag.toLowerCase()
                    ? "bg-orange-500/20 border-orange-500/40 text-orange-400 font-semibold"
                    : "bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400"
                }`}
              >
                #{tag}
              </button>
            ))}
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(""); fetchBills(); }}
                className="text-[10px] font-bold text-red-400 hover:text-red-300 uppercase tracking-widest ml-2"
              >
                Clear Search
              </button>
            )}
          </div>
        </div>

        {/* Ledger Grid */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 space-y-2">
            <RefreshCw className="h-6 w-6 text-orange-500 animate-spin" />
            <span className="text-slate-500 text-xs font-semibold">Updating Digital Ledger...</span>
          </div>
        ) : bills.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl text-center py-24">
            <Receipt className="h-12 w-16 text-slate-700 mb-3" />
            <h3 className="text-sm font-bold text-slate-300">No invoices match your query</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              Either upload a bill photo using the Contractor section, capture one using the simulator, or refine your search input.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bills.map((bill) => (
              <div 
                key={bill.id} 
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-orange-500/50 hover:shadow-xl hover:shadow-orange-500/5 transition-all duration-300 flex flex-col justify-between"
              >
                {/* Preview Image wrapper */}
                <div className="relative aspect-[16/10] bg-slate-950 border-b border-slate-850 flex items-center justify-center overflow-hidden">
                  <img 
                    src={bill.image_url} 
                    alt={bill.vendor_name || "Invoice receipt"}
                    className="object-cover w-full h-full opacity-60 hover:opacity-85 transition-opacity"
                  />
                  <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md border border-slate-850 text-[10px] font-bold px-2 py-0.5 rounded text-orange-400">
                    AI OCR Analysed ({(bill.ai_analysis?.ocr_confidence * 100).toFixed(0)}%)
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h4 className="text-sm font-extrabold text-slate-200 line-clamp-1">
                        {bill.vendor_name || "Unknown Supplier"}
                      </h4>
                      <span className="text-xs font-extrabold text-emerald-400 font-mono">
                        ₹{(bill.amount || 0).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                      <Calendar className="h-3 w-3 text-slate-500" />
                      <span>Invoice Date: {bill.bill_date ? new Date(bill.bill_date).toLocaleDateString() : "N/A"}</span>
                    </div>

                    {/* AI tags */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {bill.tags?.split(",").map((t: string) => (
                        <span 
                          key={t.trim()} 
                          className="bg-slate-950 border border-slate-850/80 text-slate-400 text-[9px] px-2 py-0.5 rounded font-medium"
                        >
                          #{t.trim()}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={() => setSelectedBill(bill)}
                    className="w-full flex items-center justify-center space-x-2 bg-slate-950 hover:bg-slate-850 text-xs font-bold py-2.5 rounded-xl border border-slate-850 text-slate-300 transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>View AI Analysis breakdown</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Side Detail Sheet / Modal */}
      {selectedBill && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 max-w-4xl w-full rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[85vh]">
            
            {/* Modal Left: Image preview */}
            <div className="md:w-1/2 bg-slate-950 flex items-center justify-center relative p-6 border-r border-slate-850">
              <img 
                src={selectedBill.image_url} 
                alt="Receipt image" 
                className="max-h-[50vh] object-contain rounded border border-slate-800"
              />
              <div className="absolute bottom-4 left-4 bg-slate-900/90 border border-slate-800 text-[9px] font-bold text-slate-400 px-3 py-1 rounded">
                Path: {selectedBill.image_url}
              </div>
            </div>

            {/* Modal Right: AI Extraction Details */}
            <div className="md:w-1/2 p-6 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-6">
                
                {/* Header */}
                <div className="flex justify-between items-start border-b border-slate-850 pb-4">
                  <div>
                    <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest block">AI Extraction Sheet</span>
                    <h3 className="text-lg font-extrabold text-slate-100 mt-1">
                      {selectedBill.vendor_name}
                    </h3>
                  </div>
                  <button 
                    onClick={() => setSelectedBill(null)}
                    className="p-1.5 bg-slate-950 border border-slate-800 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Summarized metrics */}
                <div className="grid grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-850">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Parsed Amount</span>
                    <span className="text-lg font-extrabold text-emerald-400">₹{(selectedBill.amount || 0).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Parsed Invoice Date</span>
                    <span className="text-sm font-bold text-slate-200">
                      {selectedBill.bill_date ? new Date(selectedBill.bill_date).toLocaleDateString() : "N/A"}
                    </span>
                  </div>
                </div>

                {/* Extractions Detail list */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center space-x-1.5">
                    <Info className="h-3.5 w-3.5 text-orange-500" />
                    <span>OCR Extracted Metadata Fields</span>
                  </h4>
                  <div className="text-xs space-y-2 bg-slate-950/40 p-4 rounded-xl border border-slate-850">
                    <div className="flex justify-between py-1 border-b border-slate-850/50">
                      <span className="text-slate-500 font-semibold">Invoice ID:</span>
                      <span className="text-slate-300 font-mono font-bold">{selectedBill.ai_analysis?.extracted_fields?.invoice_number || "N/A"}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-850/50">
                      <span className="text-slate-500 font-semibold">GSTIN ID:</span>
                      <span className="text-slate-300 font-mono font-bold">{selectedBill.ai_analysis?.extracted_fields?.gstin || "N/A"}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500 font-semibold">AI Confidence:</span>
                      <span className="text-orange-400 font-bold">{(selectedBill.ai_analysis?.ocr_confidence * 100).toFixed(0)}% Match</span>
                    </div>
                  </div>
                </div>

                {/* Parsed items */}
                {selectedBill.ai_analysis?.items && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Extracted Line Items</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {selectedBill.ai_analysis.items.map((item: any, idx: number) => (
                        <div key={`item-${idx}`} className="bg-slate-950 p-3 rounded-xl border border-slate-850/80 flex justify-between items-center text-xs">
                          <div>
                            <span className="font-bold text-slate-200">{item.item}</span>
                            <span className="text-[10px] text-slate-500 block mt-0.5">
                              Quantity: {item.quantity} {item.unit} @ ₹{item.unit_price}/unit
                            </span>
                          </div>
                          <span className="font-mono font-extrabold text-slate-300">
                            ₹{item.total.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-6 mt-6 border-t border-slate-850">
                <button
                  onClick={() => setSelectedBill(null)}
                  className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-orange-500/10 transition-all text-xs"
                >
                  Close Document View
                </button>
              </div>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}
