"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FolderKanban,
  Package,
  Truck,
  Users,
  LineChart,
  Bell,
  MessageSquare,
  LogOut,
  BrainCircuit,
  Clock,
  Milestone,
  Receipt,
  FileText,
  UserCircle2
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: string; email: string } | null>(null);
  const [selectedProjectName, setSelectedProjectName] = useState<string | null>(null);
  const [selectedProjectCode, setSelectedProjectCode] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (!token || !storedUser) {
      if (pathname !== "/" && pathname !== "/login" && pathname !== "/signup" && pathname !== "/project-select" && pathname !== "/profile-setup") {
        router.push("/login");
      }
    } else {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);

      const isSetupPage = pathname === "/profile-setup";
      if (parsedUser.profile?.first_time_login && !isSetupPage) {
        router.push("/profile-setup");
        return;
      }

      const selectedProj = localStorage.getItem("selected_project_id");
      const isWorkspacePage = !["/", "/login", "/signup", "/project-select", "/profile-setup"].includes(pathname);
      if (isWorkspacePage && !selectedProj) {
        router.push("/project-select");
        return;
      }

      const isOwner = parsedUser.role === "Project Owner";
      const isSiteEngineer = parsedUser.role === "Site Engineer";
      const allowedOwnerPages = ["/owner-dashboard", "/notifications", "/timeline", "/project-select", "/profile-setup", "/login", "/signup", "/", "/procurement", "/profile", "/bills", "/stages"];
      const allowedSiteEngineerPages = ["/stages", "/materials", "/assistant", "/notifications", "/vendors", "/profile", "/project-select", "/login", "/signup", "/", "/profile-setup", "/bills"];

      if (isOwner && !allowedOwnerPages.includes(pathname)) {
        router.push("/stages");
        return;
      }
      if (isSiteEngineer && !allowedSiteEngineerPages.includes(pathname)) {
        router.push("/stages");
        return;
      }
      if (!isOwner && pathname === "/owner-dashboard") {
        router.push("/stages");
        return;
      }

      setSelectedProjectName(localStorage.getItem("selected_project_name"));
      setSelectedProjectCode(localStorage.getItem("selected_project_code"));
    }
  }, [pathname, router]);

  const noSidebarPages = ["/", "/login", "/signup", "/project-select", "/profile-setup"];
  if (noSidebarPages.includes(pathname)) {
    return null;
  }

  const isOwner = user?.role === "Project Owner";
  const isSiteEngineer = user?.role === "Site Engineer";

  const menuItems = isOwner
    ? [
        { name: "Procurement", href: "/procurement", icon: FileText },
        { name: "Progress Tracker", href: "/stages", icon: Milestone },
        { name: "Billing", href: "/bills", icon: Receipt },
        { name: "Notifications", href: "/notifications", icon: Bell },
        { name: "Profile", href: "/profile", icon: UserCircle2 },
      ]
    : isSiteEngineer
      ? [
          { name: "Progress Tracker", href: "/stages", icon: Milestone },
          { name: "Materials", href: "/materials", icon: Package },
          { name: "AI Copilot", href: "/assistant", icon: MessageSquare },
          { name: "Billing", href: "/bills", icon: Receipt },
          { name: "Notifications", href: "/notifications", icon: Bell },
          { name: "Vendors", href: "/vendors", icon: Users },
          { name: "Profile", href: "/profile", icon: UserCircle2 },
        ]
      : [
          { name: "Projects", href: "/projects", icon: FolderKanban },
          { name: "Procurement", href: "/procurement", icon: FileText },
          { name: "Progress Tracker", href: "/stages", icon: Milestone },
          { name: "Materials", href: "/materials", icon: Package },
          { name: "Purchase Requests", href: "/purchase-requests", icon: Receipt },
          { name: "Purchase Orders", href: "/purchase-orders", icon: Truck },
          { name: "Billing", href: "/bills", icon: Receipt },
          { name: "Vendors", href: "/vendors", icon: Users },
          { name: "Budget Analysis", href: "/budget", icon: LineChart },
          { name: "Notifications", href: "/notifications", icon: Bell },
          { name: "AI Copilot", href: "/assistant", icon: MessageSquare },
          { name: "Profile", href: "/profile", icon: UserCircle2 },
        ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/");
  };

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-100 flex flex-col h-screen fixed left-0 top-0 z-30 select-none">
      <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
        <div className="bg-gradient-to-tr from-amber-500 to-orange-600 p-2 rounded-lg text-white shadow-md shadow-orange-500/20">
          <BrainCircuit className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">
            AstroBuilds AI
          </h1>
          <p className="text-[10px] text-slate-500 font-medium tracking-widest uppercase">
            PROCUREMENT SYSTEM
          </p>
        </div>
      </div>

      {user && (
        <div className="p-4 border-b border-slate-800/50 bg-slate-950/30 flex items-center space-x-3">
          <div className="bg-slate-800 border border-slate-700 h-10 w-10 rounded-full flex items-center justify-center text-orange-400 font-semibold uppercase">
            {user.name.substring(0, 2)}
          </div>
          <div className="overflow-hidden">
            <h4 className="text-sm font-semibold truncate text-slate-200">{user.name}</h4>
            <span className="inline-block text-[10px] px-2 py-0.5 mt-0.5 rounded-full font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20 uppercase tracking-wider">
              {user.role}
            </span>
          </div>
        </div>
      )}

      {selectedProjectName && (
        <div className="px-4 py-3 mx-4 mt-4 bg-slate-950/60 border border-slate-800 rounded-xl flex flex-col space-y-1.5 text-xs">
          <div className="truncate">
            <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block">Workspace</span>
            <span className="font-bold text-slate-300 truncate block">{selectedProjectName}</span>
          </div>
          {selectedProjectCode && (
            <div className="flex items-center justify-between bg-slate-900 border border-slate-850 px-2 py-1 rounded text-[10px]">
              <span className="font-mono text-orange-400 font-bold select-all">{selectedProjectCode}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedProjectCode);
                  alert("Project code copied to clipboard!");
                }}
                className="text-[9px] text-slate-400 hover:text-orange-400 font-bold uppercase transition-colors"
              >
                Copy
              </button>
            </div>
          )}
          <button
            onClick={() => router.push("/project-select")}
            className="w-full text-center text-[10px] font-bold text-orange-400 hover:text-orange-300 bg-slate-900/40 hover:bg-slate-900 border border-slate-850 py-1 rounded transition-colors"
          >
            Switch Workspace
          </button>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1 scrollbar-thin">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? "bg-gradient-to-r from-orange-600/90 to-amber-600/90 text-white shadow-md shadow-orange-500/10"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <Icon className={`h-5 w-5 transition-transform duration-200 ${isActive ? "text-white" : "text-slate-400 group-hover:scale-110"}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-200"
        >
          <LogOut className="h-5 w-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
