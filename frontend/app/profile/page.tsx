"use client";

import { useEffect, useState } from "react";
import { UserCircle2, Briefcase, Mail, ShieldCheck } from "lucide-react";

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    const project = localStorage.getItem("selected_project_name");
    if (stored) {
      const parsed = JSON.parse(stored);
      setProfile({ ...parsed, project });
    }
  }, []);

  return (
    <div className="pl-64 min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="mx-auto max-w-4xl rounded-2xl border border-slate-800 bg-slate-900 p-8">
        <div className="flex items-center gap-4">
          <div className="rounded-full border border-orange-500/20 bg-orange-500/10 p-4 text-orange-400">
            <UserCircle2 className="h-8 w-8" />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-orange-400">User profile</p>
            <h1 className="text-2xl font-semibold">{profile?.name ?? "Your account"}</h1>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
            <div className="flex items-center gap-2 text-slate-400"><Briefcase className="h-4 w-4" /> Role</div>
            <p className="mt-2 font-medium">{profile?.role ?? "Team member"}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
            <div className="flex items-center gap-2 text-slate-400"><Mail className="h-4 w-4" /> Email</div>
            <p className="mt-2 font-medium">{profile?.email ?? "—"}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 md:col-span-2">
            <div className="flex items-center gap-2 text-slate-400"><ShieldCheck className="h-4 w-4" /> Active workspace</div>
            <p className="mt-2 font-medium">{profile?.project ?? "No project selected"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
