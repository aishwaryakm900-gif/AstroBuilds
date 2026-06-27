"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Milestone,
  CheckCircle2,
  RefreshCw,
  Circle,
  Calendar,
  Camera,
  X,
  TrendingUp,
  Save,
  Sparkles
} from "lucide-react";
import { getSharedProjectState, saveSharedProjectState, syncSharedStageUpdate } from "@/utils/projectSync";

export default function ConstructionStages() {
  const router = useRouter();
  const [stages, setStages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userRole, setUserRole] = useState("");
  const [selectedStage, setSelectedStage] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editStage, setEditStage] = useState<any>(null);
  const [statusVal, setStatusVal] = useState("Not Started");
  const [evidenceUrlInput, setEvidenceUrlInput] = useState("");
  const [updateLoading, setUpdateLoading] = useState(false);
  const [projectStatus, setProjectStatus] = useState("");
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [manualProgress, setManualProgress] = useState("0");
  const [projectData, setProjectData] = useState<any>(null);

  const selectedProjectId = typeof window !== "undefined" ? localStorage.getItem("selected_project_id") : null;

  const fetchStagesData = async () => {
    if (!selectedProjectId) return;
    setLoading(true);
    setError("");
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (!token || !storedUser) {
      router.push("/login");
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    setUserRole(parsedUser.role);

    const sharedState = getSharedProjectState(selectedProjectId);
    if (sharedState.stages.length > 0) {
      setStages(sharedState.stages);
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const projRes = await fetch(`http://localhost:8000/api/projects/${selectedProjectId}`, { headers });
      if (projRes.ok) {
        const projData = await projRes.json();
        setProjectData(projData);
        setProjectStatus(projData.status);
        setManualProgress(projData.progress ? projData.progress.toString() : "0");
        saveSharedProjectState(selectedProjectId, { projectStatus: projData.status, lastUpdated: new Date().toISOString() });
      }

      const res = await fetch(`http://localhost:8000/api/projects/${selectedProjectId}/stages`, { headers });
      if (!res.ok) throw new Error("Failed to load project stages");
      const data = await res.json();
      setStages(data);
      saveSharedProjectState(selectedProjectId, { stages: data, lastUpdated: new Date().toISOString() });
    } catch (err: any) {
      if (sharedState.stages.length > 0) {
        setStages(sharedState.stages);
      } else {
        setError(err.message || "Failed to load construction stages from backend.");
        setStages([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStage || !selectedProjectId) return;
    setUpdateLoading(true);
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    const parsedUser = storedUser ? JSON.parse(storedUser) : null;
    const actorRole = parsedUser?.role || "Contractor";

    const nextEvidence = evidenceUrlInput.trim()
      ? [...(editStage.evidence_urls || []), evidenceUrlInput.trim()]
      : editStage.evidence_urls || [];

    const updatedStage = {
      ...editStage,
      status: statusVal,
      completion_date: statusVal === "Completed" ? new Date().toISOString() : editStage.completion_date,
      evidence_urls: nextEvidence,
      updated_by: actorRole,
      updated_at: new Date().toISOString()
    };

    const updatedStages = stages.map((stage) => (stage.id === editStage.id ? updatedStage : stage));
    setStages(updatedStages);
    syncSharedStageUpdate(selectedProjectId, updatedStage, actorRole);

    try {
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      };

      const body: any = {
        status: statusVal
      };
      if (statusVal === "Completed") {
        body.completion_date = updatedStage.completion_date;
      }
      if (evidenceUrlInput.trim()) {
        body.evidence_url = evidenceUrlInput.trim();
      }

      const res = await fetch(`http://localhost:8000/api/projects/${selectedProjectId}/stages/${editStage.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.detail || "Failed to update stage status");
      }

      setShowEditModal(false);
      setEvidenceUrlInput("");
      fetchStagesData();
    } catch (err: any) {
      setError(err.message || "Error updating stage. Please try again.");
      setShowEditModal(false);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleUpdateProjectProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) return;
    setUpdateLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:8000/api/projects/${selectedProjectId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          progress: parseFloat(manualProgress)
        })
      });
      if (!res.ok) {
        throw new Error("Failed to update progress");
      }
      setShowProgressModal(false);
      fetchStagesData(); // reload project details too
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdateLoading(false);
    }
  };

  useEffect(() => {
    fetchStagesData();
  }, [selectedProjectId]);

  if (loading) {
    return (
      <div className="pl-64 min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="h-8 w-8 text-orange-500 animate-spin" />
        <span className="text-slate-400 text-sm font-semibold">Syncing progress tracker...</span>
      </div>
    );
  }

  const completedCount = stages.filter((s) => s.status === "Completed").length;
  const inProgressCount = stages.filter((s) => s.status === "In Progress").length;

  return (
    <div className="pl-64 min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="border-b border-slate-900 bg-slate-950/40 p-6 flex justify-between items-center backdrop-blur-md">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">Construction Progress Tracker</h2>
          <p className="text-xs text-slate-500 mt-1">A GitHub-style execution timeline for project delivery and procurement milestones</p>
        </div>
        <div className="flex space-x-3">
          {projectStatus !== "Completed" && (
            <button
              onClick={() => setShowProgressModal(true)}
              className="flex items-center space-x-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md"
            >
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Update Overall Progress</span>
            </button>
          )}
          <button
            onClick={fetchStagesData}
            className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-800 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
            <span>Sync Progress</span>
          </button>
        </div>
      </header>

      <main className="p-6 flex-1 space-y-6 max-w-5xl mx-auto w-full">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-xs text-red-400 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
              <span>{error}</span>
            </div>
          </div>
        )}

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl grid md:grid-cols-3 gap-6 text-center">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Completed Phases</span>
            <p className="text-2xl font-extrabold text-green-400 mt-1">{completedCount} / 17</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Active Construction</span>
            <p className="text-2xl font-extrabold text-orange-400 mt-1">{inProgressCount}</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Pending Stages</span>
            <p className="text-2xl font-extrabold text-slate-400 mt-1">{17 - completedCount - inProgressCount}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800/60 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-orange-500" />
              <span>Execution Timeline</span>
            </h3>
            <span className="text-[10px] text-slate-500">Owner and site teams see the same live progress state</span>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stages.map((stage, idx) => {
              const isCompleted = stage.status === "Completed";
              const isInProgress = stage.status === "In Progress";
              return (
                <div
                  key={stage.id}
                  className={`bg-slate-950 border p-5 rounded-2xl flex flex-col justify-between space-y-4 hover:border-slate-700/80 transition-all duration-200 relative ${
                    isCompleted ? "border-green-500/10 shadow-md shadow-green-500/5" : isInProgress ? "border-orange-500/20 shadow-md shadow-orange-500/5" : "border-slate-800 opacity-70"
                  }`}
                >
                  <span className="absolute top-3 right-3 text-[9px] font-mono text-slate-600 font-bold">STAGE {idx + 1}</span>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      {isCompleted ? <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" /> : isInProgress ? <RefreshCw className="h-5 w-5 text-orange-400 shrink-0 animate-spin" /> : <Circle className="h-5 w-5 text-slate-600 shrink-0" />}
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${isCompleted ? "bg-green-500/10 text-green-400 border-green-500/15" : isInProgress ? "bg-orange-500/10 text-orange-400 border-orange-500/15" : "bg-slate-900 text-slate-500 border-slate-800"}`}>
                        {stage.status}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-slate-100 text-sm tracking-tight pt-1">{stage.stage_name}</h3>
                    {isCompleted && stage.completion_date && (
                      <p className="text-[10px] text-slate-500 flex items-center">
                        <Calendar className="h-3 w-3 mr-1 text-green-400" />
                        <span>Finished {new Date(stage.completion_date).toLocaleDateString()}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-850 text-xs">
                    {stage.evidence_urls && stage.evidence_urls.length > 0 ? (
                      <button onClick={() => setSelectedStage(stage)} className="text-orange-400 hover:text-orange-300 font-bold flex items-center space-x-1.5">
                        <Camera className="h-3.5 w-3.5" />
                        <span>{stage.evidence_urls.length} verified photos</span>
                      </button>
                    ) : (
                      <span className="text-slate-600 flex items-center space-x-1.5">
                        <Camera className="h-3.5 w-3.5" />
                        <span>No evidence yet</span>
                      </span>
                    )}
                    {true && (
                      <button
                        onClick={() => {
                          setEditStage(stage);
                          setStatusVal(stage.status);
                          setEvidenceUrlInput("");
                          setShowEditModal(true);
                        }}
                        className="bg-slate-900 hover:bg-slate-800 text-[10px] font-bold py-1 px-2.5 rounded border border-slate-800 transition-colors uppercase tracking-wider text-slate-300"
                      >
                        Update
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {selectedStage && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl relative">
              <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
                <h4 className="font-extrabold text-slate-100 flex items-center space-x-2">
                  <Camera className="h-5 w-5 text-orange-400" />
                  <span>{selectedStage.stage_name} verification log</span>
                </h4>
                <button onClick={() => setSelectedStage(null)} className="text-slate-400 hover:text-slate-200">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  {selectedStage.evidence_urls.map((url: string, idx: number) => (
                    <div key={idx} className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 flex flex-col justify-center">
                      <img src={url} alt={`${selectedStage.stage_name} verification`} className="object-cover w-full h-full" />
                      <div className="p-2 text-center text-[10px] bg-slate-950 text-slate-400 font-bold border-t border-slate-850">Attachment #{idx + 1}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {showEditModal && editStage && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl">
              <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
                <h4 className="font-extrabold text-slate-100 flex items-center space-x-2">
                  <Sparkles className="h-5 w-5 text-orange-400" />
                  <span>Update {editStage.stage_name}</span>
                </h4>
                <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-200">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleUpdateStage} className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-2">Stage Status</label>
                  <select value={statusVal} onChange={(e) => setStatusVal(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-orange-500">
                    <option>Not Started</option>
                    <option>In Progress</option>
                    <option>Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-2">Evidence link</label>
                  <input value={evidenceUrlInput} onChange={(e) => setEvidenceUrlInput(e.target.value)} placeholder="https://..." className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-orange-500" />
                </div>
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-700 text-slate-300">Cancel</button>
                  <button type="submit" disabled={updateLoading} className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-amber-600 px-4 py-2 rounded-xl text-sm font-semibold text-white">
                    <Save className="h-4 w-4" />
                    {updateLoading ? "Saving..." : "Save Update"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
