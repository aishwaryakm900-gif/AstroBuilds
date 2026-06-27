"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

export default function HomeownerDashboard() {
  const router = useRouter();
  
  useEffect(() => {
    router.push("/stages");
  }, [router]);

  return (
    <div className="pl-64 min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
      <div className="text-slate-400 flex items-center gap-2">
        <RefreshCw className="h-4 w-4 animate-spin" />
        Redirecting to Progress Tracker...
      </div>
    </div>
  );
}
