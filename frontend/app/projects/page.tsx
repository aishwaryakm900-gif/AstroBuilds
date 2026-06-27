"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  FolderPlus, 
  Calendar, 
  DollarSign, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  RefreshCw,
  PlusCircle,
  TrendingUp
} from "lucide-react";

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // New Project Form state
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProjName, setNewProjName] = useState("");
  const [newProjLoc, setNewProjLoc] = useState("");
  const [newProjBudget, setNewProjBudget] = useState("");
  const [newProjStart, setNewProjStart] = useState("");
  const [newProjEnd, setNewProjEnd] = useState("");

  // New Task Form state
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskDue, setNewTaskDue] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError(false);
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const headers = { "Authorization": `Bearer ${token}` };
      const projRes = await fetch("http://localhost:8000/api/projects", { headers });
      if (!projRes.ok) throw new Error();
      const projData = await projRes.json();
      setProjects(projData);

      if (projData.length > 0) {
        // Fetch tasks for the selected project
        const activeId = selectedProjectId || projData[0].id;
        const taskRes = await fetch(`http://localhost:8000/api/projects/${activeId}/tasks`, { headers });
        const taskData = await taskRes.ok ? await taskRes.json() : [];
        setTasks(taskData);
      }
    } catch (err) {
      console.warn("Backend offline. Setting up mock project schedules.");
      setError(true);
      
      const mockProjects = [
        { id: 1, name: "Astro Tower Residential", location: "Seattle, WA", budget: 4500000.0, start_date: "2026-01-01T00:00:00", expected_completion_date: "2026-12-31T00:00:00", status: "Active", progress: 42.8 },
        { id: 2, name: "Downtown Commercial Center", location: "Austin, TX", budget: 8200000.0, start_date: "2026-05-15T00:00:00", expected_completion_date: "2027-02-15T00:00:00", status: "Active", progress: 15.0 }
      ];
      setProjects(mockProjects);
      
      const mockTasks = selectedProjectId === 1 ? [
        { id: 1, title: "Excavation and Site Preparation", description: "Clear terrain and excavate structural foundation pits.", status: "Completed", due_date: "2026-04-30T00:00:00" },
        { id: 2, title: "Substructure Foundation Pouring", description: "Pour reinforced industrial concrete slab for foundation.", status: "Completed", due_date: "2026-05-30T00:00:00" },
        { id: 3, title: "Superstructure Steel Framing", description: "Assemble core load-bearing columns and metal framing beams.", status: "In Progress", due_date: "2026-07-30T00:00:00" },
        { id: 4, title: "Concrete Slab Level 2 & 3", description: "Pour floor slabs on steel decks for upper levels.", status: "To Do", due_date: "2026-08-30T00:00:00" },
        { id: 5, title: "Exterior Brick Cladding", description: "Apply structural masonry finishes on outer shell.", status: "To Do", due_date: "2026-09-30T00:00:00" }
      ] : [
        { id: 6, title: "Site Clearing & Boundary Fencing", description: "Erect security fencing and grade lot.", status: "Completed", due_date: "2026-06-15T00:00:00" },
        { id: 7, title: "Foundation Pier Drilling", description: "Drill deep concrete piers for seismic load protection.", status: "In Progress", due_date: "2026-07-15T00:00:00" },
        { id: 8, title: "Main Utility Hookups", description: "Connect municipal water and electricity lines.", status: "To Do", due_date: "2026-08-15T00:00:00" }
      ];
      setTasks(mockTasks);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedProjectId]);

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
          name: newProjName,
          location: newProjLoc,
          budget: parseFloat(newProjBudget),
          start_date: newProjStart,
          expected_completion_date: newProjEnd,
          status: "Planning",
          progress: 0.0
        })
      });

      if (response.ok) {
        setNewProjName("");
        setNewProjLoc("");
        setNewProjBudget("");
        setNewProjStart("");
        setNewProjEnd("");
        setShowAddProject(false);
        fetchData();
      }
    } catch (err) {
      alert("Error adding project. Using mock insert.");
      const mockNewProj = {
        id: projects.length + 1,
        name: newProjName,
        location: newProjLoc,
        budget: parseFloat(newProjBudget) || 1000000.0,
        start_date: newProjStart || new Date().toISOString(),
        expected_completion_date: newProjEnd || new Date().toISOString(),
        status: "Planning",
        progress: 0.0
      };
      setProjects([...projects, mockNewProj]);
      setShowAddProject(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:8000/api/projects/${selectedProjectId}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newTaskTitle,
          description: newTaskDesc,
          status: "To Do",
          due_date: newTaskDue
        })
      });

      if (response.ok) {
        setNewTaskTitle("");
        setNewTaskDesc("");
        setNewTaskDue("");
        setShowAddTask(false);
        fetchData();
      }
    } catch (err) {
      alert("Error adding task. Using mock insert.");
      const mockNewTask = {
        id: tasks.length + 1,
        title: newTaskTitle,
        description: newTaskDesc,
        status: "To Do",
        due_date: newTaskDue || new Date().toISOString()
      };
      setTasks([...tasks, mockNewTask]);
      setShowAddTask(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId: number, newStatus: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:8000/api/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        fetchData();
      }
    } catch (err) {
      // Mock update local state
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    }
  };

  const activeProject = projects.find(p => p.id === selectedProjectId) || projects[0];

  return (
    <div className="pl-64 min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="border-b border-slate-900 bg-slate-950/40 p-6 flex justify-between items-center backdrop-blur-md">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">
            Project Scheduling
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Gantt scheduling timeline and milestone managers
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAddProject(!showAddProject)}
            className="flex items-center space-x-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-xs font-semibold px-4 py-2.5 rounded-xl border border-orange-500/20 transition-all shadow-lg shadow-orange-500/10"
          >
            <FolderPlus className="h-4 w-4" />
            <span>New Project</span>
          </button>
        </div>
      </header>

      <main className="p-6 flex-grow space-y-6">


        {/* Project Selector Menu */}
        <div className="flex flex-wrap gap-3">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedProjectId(p.id)}
              className={`px-4 py-3 rounded-xl border text-sm font-semibold transition-all duration-200 ${
                selectedProjectId === p.id
                  ? "bg-slate-900 border-orange-500/80 text-orange-400 shadow-md shadow-orange-500/5"
                  : "bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              🏢 {p.name}
            </button>
          ))}
        </div>

        {/* Add Project Form Drawer Modal */}
        {showAddProject && (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h3 className="text-md font-bold text-slate-200">Create New Project</h3>
            <form onSubmit={handleCreateProject} className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Project Name</label>
                <input required value={newProjName} onChange={e => setNewProjName(e.target.value)} type="text" placeholder="Metro Center" className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Location</label>
                <input required value={newProjLoc} onChange={e => setNewProjLoc(e.target.value)} type="text" placeholder="Austin, TX" className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Budget ($)</label>
                <input required value={newProjBudget} onChange={e => setNewProjBudget(e.target.value)} type="number" placeholder="5000000" className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Start Date</label>
                  <input required value={newProjStart} onChange={e => setNewProjStart(e.target.value)} type="date" className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-orange-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">End Date</label>
                  <input required value={newProjEnd} onChange={e => setNewProjEnd(e.target.value)} type="date" className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-orange-500" />
                </div>
              </div>
              <div className="md:col-span-2 flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setShowAddProject(false)} className="bg-slate-950 hover:bg-slate-850 border border-slate-850 text-slate-400 px-4 py-2 rounded-xl text-xs font-semibold">Cancel</button>
                <button type="submit" className="bg-gradient-to-r from-orange-600 to-amber-600 text-white px-5 py-2 rounded-xl text-xs font-bold">Add Project</button>
              </div>
            </form>
          </div>
        )}

        {/* Selected Project Specs */}
        {activeProject && (
          <div className="grid md:grid-cols-3 gap-6">
            {/* Details Panel */}
            <div className="bg-slate-900 border border-slate-800/80 p-6 rounded-2xl md:col-span-1 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Project Details</h3>
              <div className="space-y-4 text-xs">
                <div className="flex justify-between border-b border-slate-800 pb-2.5">
                  <span className="text-slate-500">Location</span>
                  <span className="font-semibold text-slate-200 flex items-center"><MapPin className="h-3.5 w-3.5 text-orange-500 mr-1" />{activeProject.location}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2.5">
                  <span className="text-slate-500">Allocated Budget</span>
                  <span className="font-semibold text-slate-200 flex items-center"><DollarSign className="h-3.5 w-3.5 text-green-500 mr-0.5" />{activeProject.budget?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2.5">
                  <span className="text-slate-500">Start Date</span>
                  <span className="font-semibold text-slate-200 flex items-center"><Calendar className="h-3.5 w-3.5 text-slate-500 mr-1.5" />{new Date(activeProject.start_date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2.5">
                  <span className="text-slate-500">Expected End</span>
                  <span className="font-semibold text-slate-200 flex items-center"><Calendar className="h-3.5 w-3.5 text-slate-500 mr-1.5" />{new Date(activeProject.expected_completion_date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status</span>
                  <span className="font-extrabold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/10 uppercase tracking-wider">{activeProject.status}</span>
                </div>
              </div>
            </div>

            {/* Gantt Timeline Simulator */}
            <div className="bg-slate-900 border border-slate-800/80 p-6 rounded-2xl md:col-span-2 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Milestone Timeline (Gantt)</h3>
              <div className="space-y-4">
                {tasks.map((t) => (
                  <div key={t.id} className="grid grid-cols-12 items-center gap-3 text-xs">
                    <div className="col-span-4 font-semibold text-slate-200 truncate">{t.title}</div>
                    
                    {/* Visual Gantt Bar */}
                    <div className="col-span-6 relative">
                      <div className="h-3 bg-slate-950 border border-slate-850 rounded-full w-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            t.status === "Completed" ? "bg-green-500" : t.status === "In Progress" ? "bg-orange-500 animate-pulse" : "bg-slate-800"
                          }`}
                          style={{
                            width: t.status === "Completed" ? "100%" : t.status === "In Progress" ? "65%" : "0%",
                            marginLeft: t.id % 2 === 0 ? "10%" : "0%"
                          }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="col-span-2 flex justify-end">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                        t.status === "Completed"
                          ? "bg-green-500/10 text-green-400 border-green-500/10"
                          : t.status === "In Progress"
                          ? "bg-orange-500/10 text-orange-400 border-orange-500/10"
                          : "bg-slate-950 text-slate-500 border-slate-800"
                      }`}>
                        {t.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Task Assignment workflow boards */}
        <div className="bg-slate-900 border border-slate-800/80 p-6 rounded-2xl space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Milestone Tasks</h3>
            {activeProject?.status !== "Completed" && (
              <button
                onClick={() => setShowAddTask(!showAddTask)}
                className="text-xs text-orange-400 font-semibold flex items-center space-x-1 hover:text-orange-300"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Add Task</span>
              </button>
            )}
          </div>

          {showAddTask && (
            <form onSubmit={handleCreateTask} className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-3 max-w-lg">
              <h4 className="text-xs font-bold text-slate-300 uppercase">Create Task</h4>
              <div>
                <input required value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} type="text" placeholder="Drywalling Ground Floor" className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500" />
              </div>
              <div>
                <textarea value={newTaskDesc} onChange={e => setNewTaskDesc(e.target.value)} placeholder="Install sheetrock boards and tape corners." rows={2} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500" />
              </div>
              <div>
                <input required value={newTaskDue} onChange={e => setNewTaskDue(e.target.value)} type="date" className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-orange-500" />
              </div>
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setShowAddTask(false)} className="bg-slate-950 hover:bg-slate-900 text-slate-400 px-3 py-1.5 rounded-lg text-xs">Cancel</button>
                <button type="submit" className="bg-orange-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold">Add Task</button>
              </div>
            </form>
          )}

          {/* Kanban / Tasks List */}
          <div className="grid md:grid-cols-3 gap-4">
            {["To Do", "In Progress", "Completed"].map((statusCol) => {
              const colTasks = tasks.filter(t => t.status === statusCol);
              return (
                <div key={statusCol} className="bg-slate-950/80 border border-slate-850 p-4 rounded-xl space-y-3">
                  <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-900 pb-2">
                    <span>{statusCol}</span>
                    <span className="bg-slate-900 px-2 py-0.5 rounded text-[10px] text-slate-500">{colTasks.length}</span>
                  </div>

                  <div className="space-y-2.5 min-h-[120px]">
                    {colTasks.map((t) => (
                      <div key={t.id} className="bg-slate-900 border border-slate-800 p-3 rounded-lg space-y-2 hover:border-slate-700 transition-colors">
                        <h4 className="text-xs font-bold text-slate-200">{t.title}</h4>
                        <p className="text-[10px] text-slate-500 leading-normal">{t.description}</p>
                        <div className="flex justify-between items-center pt-2 border-t border-slate-950/80 text-[9px]">
                          <span className="text-slate-500">Due {new Date(t.due_date).toLocaleDateString()}</span>
                          
                          {/* Quick transition dropdown */}
                          <select
                            value={t.status}
                            disabled={activeProject?.status === "Completed"}
                            onChange={(e) => handleUpdateTaskStatus(t.id, e.target.value)}
                            className="bg-slate-950 border border-slate-800 text-slate-400 rounded px-1.5 py-0.5 text-[9px] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <option value="To Do">To Do</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                          </select>
                        </div>
                      </div>
                    ))}
                    {colTasks.length === 0 && (
                      <div className="text-[10px] text-slate-600 text-center py-6">No tasks in this lane</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
