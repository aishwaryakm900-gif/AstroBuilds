"use client";

import { useEffect, useState } from "react";
import { useRouter } from "react-router-dom"; // Note: next/navigation is used in Next.js app directory!
import { useRouter as useNextRouter } from "next/navigation";
import { 
  FolderPlus, 
  Building, 
  MapPin, 
  Calendar, 
  DollarSign, 
  User as UserIcon,
  Mail, 
  Phone, 
  ArrowRight, 
  RefreshCw,
  Plus,
  ShieldCheck,
  LayoutDashboard
} from "lucide-react";
import { getDemoProjects, isDemoSessionEnabled } from "@/utils/auth";

export default function ProjectSelectPage() {
  const router = useNextRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create Project Form State
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    building_type: "Residential",
    address: "",
    location: "",
    owner_name: "",
    owner_email: "",
    owner_phone: "",
    contractor_name: "",
    contractor_email: "",
    contractor_phone: "",
    site_engineer_name: "",
    site_engineer_email: "",
    site_engineer_phone: "",
    budget: "",
    start_date: "",
    expected_completion_date: ""
  });

  // Join Project Form State (Homeowners)
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [accessCode, setAccessCode] = useState("");
  const [joinError, setJoinError] = useState("");

  const fetchProjects = async () => {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/api/projects", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Failed to load projects");
      const data = await response.json();
      setProjects(data);
    } catch (err: any) {
      if (isDemoSessionEnabled()) {
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        setProjects(getDemoProjects(storedUser?.role || "Contractor"));
        setError("");
      } else {
        setError(err.message || "Failed to fetch projects. Please verify backend is running.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (!token || !storedUser) {
      router.push("/login");
      return;
    }
    setUser(JSON.parse(storedUser));
    fetchProjects();
  }, []);

  const handleSelectProject = (proj: any) => {
    localStorage.setItem("selected_project_id", proj.id.toString());
    localStorage.setItem("selected_project_name", proj.name);
    localStorage.setItem("selected_project_code", proj.code || "");

    const role = user?.role || "Contractor";
    router.push("/stages");
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch("http://localhost:8000/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          budget: parseFloat(formData.budget) || 0.0
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Error creating project");
      }

      setFormData({
        name: "",
        building_type: "Residential",
        address: "",
        location: "",
        owner_name: "",
        owner_email: "",
        owner_phone: "",
        contractor_name: "",
        contractor_email: "",
        contractor_phone: "",
        site_engineer_name: "",
        site_engineer_email: "",
        site_engineer_phone: "",
        budget: "",
        start_date: "",
        expected_completion_date: ""
      });
      setShowCreateForm(false);
      fetchProjects();
    } catch (err: any) {
      alert(err.message || "Failed to create project");
    }
  };

  const handleJoinProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError("");
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch("http://localhost:8000/api/homeowner/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ project_code: accessCode })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Invalid access code. Please verify.");
      }

      setAccessCode("");
      setShowJoinForm(false);
      fetchProjects();
    } catch (err: any) {
      setJoinError(err.message);
    }
  };

  const isHomeowner = user?.role === "Project Owner";

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="h-8 w-8 text-orange-500 animate-spin" />
        <span className="text-slate-400 text-sm font-semibold">Loading Workspaces...</span>
      </div>
    );
  }

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen py-16 px-6 relative overflow-hidden flex flex-col items-center">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-5xl w-full space-y-8 z-10">
        {/* Header */}
        <div className="flex justify-between items-end border-b border-slate-900 pb-6">
          <div>
            <span className="text-orange-500 text-xs font-bold uppercase tracking-wider">AstroBuilds Enterprise OS</span>
            <h1 className="text-3xl font-extrabold tracking-tight mt-1">
              {isHomeowner ? "My Properties" : "My Project Workspaces"}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {isHomeowner ? "Select a property dashboard to view real-time site updates" : "Select a dedicated project workspace to begin monitoring"}
            </p>
          </div>
          
          <div className="flex space-x-3">
            {!isHomeowner && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center space-x-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-xs font-semibold px-4 py-2.5 rounded-xl border border-orange-500/20 transition-all shadow-lg shadow-orange-500/10"
              >
                <FolderPlus className="h-4 w-4" />
                <span>Create New Project</span>
              </button>
            )}
            {isHomeowner && (
              <button
                onClick={() => setShowJoinForm(true)}
                className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-800 transition-all"
              >
                <ShieldCheck className="h-4 w-4 text-orange-400" />
                <span>Link Property</span>
              </button>
            )}
          </div>
        </div>

        {/* Errors */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs">
            {error}
          </div>
        )}

        {/* Modal: Create Project Form */}
        {showCreateForm && (
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl space-y-6 shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-200">Create New Project</h3>
              <button 
                onClick={() => setShowCreateForm(false)} 
                className="text-xs text-slate-500 hover:text-slate-300"
              >
                Cancel
              </button>
            </div>
            
            <form onSubmit={handleCreateProject} className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Project Name</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} type="text" placeholder="Green Valley Villa" className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Building Type</label>
                <select value={formData.building_type} onChange={e => setFormData({...formData, building_type: e.target.value})} className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-350 focus:outline-none focus:border-orange-500">
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Industrial">Industrial</option>
                  <option value="Infrastructure">Infrastructure</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Project Location</label>
                <input required value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} type="text" placeholder="Seattle, WA" className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Project Full Address</label>
                <input required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} type="text" placeholder="104 Pine St, Suite 400" className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500" />
              </div>

              {/* Owner Details */}
              <div className="border-t border-slate-850 pt-4 md:col-span-2">
                <h4 className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-3">Owner Information</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Owner Name</label>
                    <input required value={formData.owner_name} onChange={e => setFormData({...formData, owner_name: e.target.value})} type="text" placeholder="Emma Watson" className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Owner Email</label>
                    <input required value={formData.owner_email} onChange={e => setFormData({...formData, owner_email: e.target.value})} type="email" placeholder="emma@gmail.com" className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Owner Phone</label>
                    <input required value={formData.owner_phone} onChange={e => setFormData({...formData, owner_phone: e.target.value})} type="text" placeholder="+1 555-0199" className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500" />
                  </div>
                </div>
              </div>

              {/* Members */}
              <div className="border-t border-slate-850 pt-4 md:col-span-2">
                <h4 className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-3">Stakeholders</h4>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Contractor Sub-grid */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-800 pb-1">Contractor</span>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-1">Contractor Name</label>
                      <input required value={formData.contractor_name} onChange={e => setFormData({...formData, contractor_name: e.target.value})} type="text" placeholder="Bob Contractor" className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 mb-1">Email</label>
                        <input required value={formData.contractor_email} onChange={e => setFormData({...formData, contractor_email: e.target.value})} type="email" placeholder="contractor@astrobuilds.com" className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 mb-1">Phone</label>
                        <input required value={formData.contractor_phone} onChange={e => setFormData({...formData, contractor_phone: e.target.value})} type="text" placeholder="+1 555-0101" className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500" />
                      </div>
                    </div>
                  </div>

                  {/* Site Engineer Sub-grid */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-800 pb-1">Site Engineer</span>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-1">Site Engineer Name</label>
                      <input required value={formData.site_engineer_name} onChange={e => setFormData({...formData, site_engineer_name: e.target.value})} type="text" placeholder="Alice Engineer" className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 mb-1">Email</label>
                        <input required value={formData.site_engineer_email} onChange={e => setFormData({...formData, site_engineer_email: e.target.value})} type="email" placeholder="engineer@astrobuilds.com" className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 mb-1">Phone</label>
                        <input required value={formData.site_engineer_phone} onChange={e => setFormData({...formData, site_engineer_phone: e.target.value})} type="text" placeholder="+1 555-0102" className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Budget and Schedule */}
              <div className="border-t border-slate-850 pt-4 md:col-span-2">
                <h4 className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-3">Budget & Timeline</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Estimated Budget ($)</label>
                    <input required value={formData.budget} onChange={e => setFormData({...formData, budget: e.target.value})} type="number" placeholder="250000" className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Start Date</label>
                    <input required value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} type="date" className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-orange-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Completion Date</label>
                    <input required value={formData.expected_completion_date} onChange={e => setFormData({...formData, expected_completion_date: e.target.value})} type="date" className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-orange-500" />
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 flex justify-end space-x-3 pt-4 border-t border-slate-850">
                <button type="button" onClick={() => setShowCreateForm(false)} className="bg-slate-950 hover:bg-slate-850 border border-slate-850 text-slate-400 px-5 py-2.5 rounded-xl text-xs font-semibold">Cancel</button>
                <button type="submit" className="bg-gradient-to-r from-orange-600 to-amber-600 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-orange-500/10">Launch Workspace</button>
              </div>
            </form>
          </div>
        )}

        {/* Modal: Join Project Form */}
        {showJoinForm && (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-md mx-auto space-y-4 shadow-2xl">
            <h3 className="text-md font-bold text-slate-200">Link Property / Project</h3>
            <p className="text-xs text-slate-500">Enter the unique Project ID access code (e.g. PRJ-2026-0001) provided by your Contractor.</p>
            {joinError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs">
                {joinError}
              </div>
            )}
            <form onSubmit={handleJoinProject} className="space-y-3">
              <input required value={accessCode} onChange={e => setAccessCode(e.target.value)} type="text" placeholder="PRJ-2026-0001" className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500" />
              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setShowJoinForm(false)} className="bg-slate-950 hover:bg-slate-850 border border-slate-850 text-slate-400 px-4 py-2 rounded-xl text-xs font-semibold">Cancel</button>
                <button type="submit" className="bg-orange-600 text-white px-5 py-2 rounded-xl text-xs font-bold">Link Property</button>
              </div>
            </form>
          </div>
        )}

        {/* Projects Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {projects.map((proj) => (
            <div 
              key={proj.id} 
              onClick={() => handleSelectProject(proj)}
              className="bg-slate-900/60 border border-slate-900 hover:border-orange-500/30 p-6 rounded-2xl shadow-xl flex flex-col justify-between cursor-pointer transition-all duration-200 group"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="bg-slate-950 border border-slate-850 text-[10px] text-orange-400 font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    {proj.code}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-950/40 border border-slate-900 px-2 py-0.5 rounded">
                    {proj.building_type || "Commercial"}
                  </span>
                </div>
                <h3 className="text-xl font-bold group-hover:text-orange-400 transition-colors text-slate-100">{proj.name}</h3>
                
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 pt-2">
                  <div className="flex items-center space-x-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-500" />
                    <span className="truncate">{proj.location}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <DollarSign className="h-3.5 w-3.5 text-slate-500" />
                    <span>${proj.budget?.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-950/80 pt-4 mt-6 flex justify-between items-center text-xs">
                <span className="text-slate-500">Progress: {proj.progress}%</span>
                <div className="flex items-center space-x-1 font-bold text-orange-400/90 group-hover:text-orange-400">
                  <span>Enter Workspace</span>
                  <ArrowRight className="h-3.5 w-3.5 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}

          {/* Empty state */}
          {projects.length === 0 && !showCreateForm && (
            <div className="col-span-2 bg-slate-900/20 border border-dashed border-slate-850 p-16 rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
              <Building className="h-12 w-12 text-slate-600" />
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-300">No projects created yet.</h3>
                <p className="text-xs text-slate-500 max-w-sm">Start your enterprise construction system by setting up your first project workspace context.</p>
              </div>
              {!isHomeowner ? (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-xs font-bold px-6 py-3 rounded-xl border border-orange-500/20 transition-all shadow-lg"
                >
                  Create Your First Project
                </button>
              ) : (
                <button
                  onClick={() => setShowJoinForm(true)}
                  className="bg-slate-900 hover:bg-slate-800 text-xs font-bold px-6 py-3 rounded-xl border border-slate-800 transition-all"
                >
                  Link Your First Property
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
