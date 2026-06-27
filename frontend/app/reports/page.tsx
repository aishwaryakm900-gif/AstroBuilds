"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  FileSpreadsheet, 
  Camera, 
  CheckCircle, 
  ShieldAlert, 
  PlusCircle,
  RefreshCw,
  Eye,
  AlertCircle
} from "lucide-react";

export default function ReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<any[]>([]);
  const [siteImages, setSiteImages] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Get active project ID
  const selectedProjectId = typeof window !== "undefined" ? localStorage.getItem("selected_project_id") : null;

  // Daily Report form state
  const [showAddReport, setShowAddReport] = useState(false);
  const [dailySummary, setDailySummary] = useState("");
  const [weeklySummary, setWeeklySummary] = useState("");
  const [riskField, setRiskField] = useState("");
  const [insights, setInsights] = useState("");

  // CV Image form state
  const [showAddImage, setShowAddImage] = useState(false);
  const [imgDesc, setImgDesc] = useState("");
  const [fileInput, setFileInput] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [projectStatus, setProjectStatus] = useState("");

  const fetchData = async () => {
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
      
      // Fetch project status
      const projRes = await fetch(`http://localhost:8000/api/projects/${selectedProjectId}`, { headers });
      if (projRes.ok) {
        const projData = await projRes.json();
        setProjectStatus(projData.status);
      }
      
      // Load reports
      const rptRes = await fetch(`http://localhost:8000/api/projects/${selectedProjectId}/reports`, { headers });
      if (!rptRes.ok) throw new Error("Failed to load daily reports");
      const rptData = await rptRes.json();
      setReports(rptData);

      // Load CV site images
      const imgRes = await fetch(`http://localhost:8000/api/projects/${selectedProjectId}/images`, { headers });
      if (!imgRes.ok) throw new Error("Failed to load computer vision inspections");
      const imgData = await imgRes.json();
      setSiteImages(imgData);
      
    } catch (err: any) {
      setError(err.message || "Failed to load real-world reports. Please verify backend connection.");
      setReports([]);
      setSiteImages([]);
    } finally {
      setLoading(false);
    }
  };

  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    fetchData();
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUserRole(parsedUser.role || "");
    }
  }, [selectedProjectId]);

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token || !selectedProjectId) return;

    try {
      const response = await fetch(`http://localhost:8000/api/projects/${selectedProjectId}/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          daily_summary: dailySummary,
          weekly_summary: weeklySummary,
          risks_detected: riskField ? riskField.split(",").map(r => r.trim()) : [],
          insights: insights
        })
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.detail || "Failed to post daily report");
      }

      setDailySummary("");
      setWeeklySummary("");
      setRiskField("");
      setInsights("");
      setShowAddReport(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || "Error adding report. Please try again.");
    }
  };

  const handleImageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileInput || !selectedProjectId) return;
    setUploading(true);

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const formData = new FormData();
      formData.append("file", fileInput);
      formData.append("description", imgDesc);

      const response = await fetch(`http://localhost:8000/api/projects/${selectedProjectId}/images?description=` + encodeURIComponent(imgDesc), {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.detail || "Failed to upload image");
      }

      setImgDesc("");
      setFileInput(null);
      setShowAddImage(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || "Error uploading image. Please verify file format and size.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="pl-64 min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="border-b border-slate-900 bg-slate-950/40 p-6 flex justify-between items-center backdrop-blur-md">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">
            Reports & Visual Inspections
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Log site engineers updates and scan photos for safety compliance
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {projectStatus !== "Completed" && userRole !== "Project Owner" && (
            <>
              <button
                onClick={() => setShowAddReport(!showAddReport)}
                className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-xs font-semibold px-4 py-2.5 border border-slate-800 rounded-xl transition-colors"
              >
                <FileSpreadsheet className="h-4 w-4 text-orange-400" />
                <span>Write Report</span>
              </button>
              <button
                onClick={() => setShowAddImage(!showAddImage)}
                className="flex items-center space-x-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-xs font-semibold px-4 py-2.5 rounded-xl border border-orange-500/20 transition-all shadow-lg"
              >
                <Camera className="h-4 w-4" />
                <span>Upload Photo</span>
              </button>
            </>
          )}
        </div>
      </header>


      {error && (
        <div className="mx-6 mt-6 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs">
          {error}
        </div>
      )}

      <main className="p-6 flex-grow space-y-6">

        {/* Forms rows */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Daily Report form */}
          {showAddReport && (
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
              <h3 className="text-md font-bold text-slate-200">Daily Updates Log</h3>
              <form onSubmit={handleCreateReport} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Daily Summary</label>
                  <textarea required value={dailySummary} onChange={e => setDailySummary(e.target.value)} rows={3} placeholder="Slab pouring finalized..." className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Weekly Summary (Optional)</label>
                  <textarea value={weeklySummary} onChange={e => setWeeklySummary(e.target.value)} rows={2} placeholder="Foundation checks finalized this week..." className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Risks Detected (Comma Separated)</label>
                  <input value={riskField} onChange={e => setRiskField(e.target.value)} type="text" placeholder="Heavy rain alert, steel truck delayed" className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Insights / Mitigation Actions</label>
                  <textarea value={insights} onChange={e => setInsights(e.target.value)} rows={2} placeholder="Cover fresh concrete with tarps..." className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500" />
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <button type="button" onClick={() => setShowAddReport(false)} className="bg-slate-950 text-slate-400 px-4 py-2 rounded-xl text-xs">Cancel</button>
                  <button type="submit" className="bg-orange-600 text-white px-5 py-2 rounded-xl text-xs font-bold">Post Update</button>
                </div>
              </form>
            </div>
          )}

          {/* Photo CV form */}
          {showAddImage && (
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
              <h3 className="text-md font-bold text-slate-200 font-sans">Visual CV verification upload</h3>
              <form onSubmit={handleImageSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Description</label>
                  <input required value={imgDesc} onChange={e => setImgDesc(e.target.value)} type="text" placeholder="Level 1 columns framing overview" className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500" />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Select Image File or Capture Photo</label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center justify-center space-x-2 bg-slate-950 hover:bg-slate-900 border border-slate-850 px-4 py-2.5 rounded-xl text-xs text-slate-400 cursor-pointer focus:outline-none">
                      <Upload className="h-4 w-4 text-orange-400" />
                      <span>{fileInput ? fileInput.name.substring(0, 15) + "..." : "Choose File"}</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={e => setFileInput(e.target.files?.[0] || null)} 
                        className="hidden" 
                      />
                    </label>
                    <label className="flex items-center justify-center space-x-2 bg-slate-950 hover:bg-slate-900 border border-slate-850 px-4 py-2.5 rounded-xl text-xs text-slate-400 cursor-pointer focus:outline-none">
                      <Camera className="h-4 w-4 text-orange-400" />
                      <span>Take Photo</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        capture="environment" 
                        onChange={e => setFileInput(e.target.files?.[0] || null)} 
                        className="hidden" 
                      />
                    </label>
                  </div>
                  {fileInput && (
                    <p className="text-[10px] text-green-400 mt-1">✓ Ready: {fileInput.name}</p>
                  )}
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <button type="button" onClick={() => setShowAddImage(false)} className="bg-slate-950 text-slate-400 px-4 py-2 rounded-xl text-xs">Cancel</button>
                  <button type="submit" disabled={uploading} className="bg-gradient-to-r from-orange-600 to-amber-600 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1">
                    {uploading ? <span>Uploading...</span> : <span>Trigger YOLOv8 Scan</span>}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Visual CV Image Scanning results */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">YOLOv8 Computer Vision Inspections</h3>
          {siteImages.length === 0 ? (
            <div className="bg-slate-900/20 border border-dashed border-slate-850 p-12 rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-full">
                <Camera className="h-8 w-8 text-orange-500/80 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-md font-bold text-slate-300">No visual updates scanned.</h3>
                <p className="text-xs text-slate-500 max-w-sm">Upload a site photo above to run real-time YOLOv8 computer vision checks for materials count and safety gear compliance.</p>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {siteImages.map((img) => (
                <div key={img.id} className="bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-lg">
                  <div className="md:w-48 h-48 bg-slate-950 relative shrink-0">
                    <img 
                      src={img.image_url.startsWith("/") ? `http://localhost:8000${img.image_url}` : img.image_url} 
                      alt={img.description}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback image if local upload not running
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=400";
                      }}
                    />
                  </div>

                  {/* CV Scans Details */}
                  <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <h4 className="font-extrabold text-xs text-slate-100 uppercase tracking-wide truncate pr-2">{img.description}</h4>
                        <span className="text-[9px] bg-slate-950 border border-slate-850 px-2 py-0.5 rounded text-slate-500 font-mono">
                          YOLOv8 Match: {img.analysis_results.progress_match}%
                        </span>
                      </div>

                      <div className="space-y-1.5 text-[10px] text-slate-400">
                        <div>
                          <strong className="text-slate-200">Materials Counted:</strong>{" "}
                          {Object.entries(img.analysis_results.materials_counted || {}).map(([k, v]) => `${v} ${k.replace("_", " ")}`).join(", ") || "None"}
                        </div>
                        <div>
                          <strong className="text-slate-200">Machinery:</strong>{" "}
                          {(img.analysis_results.equipment_detected || []).map((eq: any) => `${eq.count} ${eq.type} (${eq.status})`).join(", ") || "None"}
                        </div>
                      </div>
                    </div>

                    {/* Safety compliance checks */}
                    <div className="bg-slate-950/80 border border-slate-850 p-2.5 rounded-xl text-[10px] flex items-start space-x-2">
                      {img.analysis_results.safety_violations?.some((v: string) => !v.toLowerCase().includes("no safety")) ? (
                        <>
                          <ShieldAlert className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                          <span className="text-red-400/90 font-medium">
                            <strong>Violations:</strong> {img.analysis_results.safety_violations.join(", ")}
                          </span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                          <span className="text-green-400/90 font-medium">Safety compliance approved. No gear violations detected.</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Written Reports lists */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Daily Activity Logs</h3>
          {reports.length === 0 ? (
            <div className="bg-slate-900/20 border border-dashed border-slate-850 p-12 rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-full">
                <FileSpreadsheet className="h-8 w-8 text-orange-500/80 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-md font-bold text-slate-300">No reports generated.</h3>
                <p className="text-xs text-slate-500 max-w-sm">No activity reports have been logged for this workspace. Click "Write Report" above to log today's activities.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((rpt) => (
                <div key={rpt.id} className="bg-slate-900 border border-slate-800/80 p-6 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-850 pb-3">
                    <span className="text-xs font-mono text-slate-500">
                      Log Date: {new Date(rpt.date).toLocaleDateString()}
                    </span>
                    <span className="text-xs bg-orange-500/10 text-orange-400 font-bold px-2.5 py-0.5 rounded border border-orange-500/10 uppercase tracking-wider">
                      Site Engineering Report
                    </span>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 text-xs leading-relaxed text-slate-350">
                    <div className="space-y-2">
                      <div>
                        <h4 className="font-bold text-slate-200">Daily Summarization</h4>
                        <p>{rpt.daily_summary}</p>
                      </div>
                      {rpt.weekly_summary && (
                        <div>
                          <h4 className="font-bold text-slate-200">Weekly Rollup</h4>
                          <p>{rpt.weekly_summary}</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      {rpt.risks_detected?.length > 0 && (
                        <div className="bg-slate-950 border border-slate-850 p-3 rounded-xl space-y-1">
                          <h5 className="font-bold text-red-400 flex items-center">
                            <ShieldAlert className="h-4 w-4 mr-1 shrink-0" />
                            <span>Risks Flagged</span>
                          </h5>
                          <ul className="list-disc list-inside space-y-0.5">
                            {rpt.risks_detected.map((r: string, idx: number) => (
                              <li key={idx} className="text-slate-400">{r}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {rpt.insights && (
                        <div className="bg-orange-500/5 border border-orange-500/10 p-3 rounded-xl space-y-1">
                          <h5 className="font-bold text-orange-400 flex items-center">
                            <Eye className="h-4 w-4 mr-1 shrink-0" />
                            <span>AI Mitigation Insight</span>
                          </h5>
                          <p className="text-slate-400 leading-normal">{rpt.insights}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
