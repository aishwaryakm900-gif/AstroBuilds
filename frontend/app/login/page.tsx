"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BrainCircuit, Loader2, AlertCircle } from "lucide-react";
import { getDemoUser, persistDemoSession } from "@/utils/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const fallbackUser = getDemoUser(email);

    try {
      const response = await fetch("http://localhost:8000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || "Authentication failed");
      }

      const data = await response.json();
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("demo_mode", "false");

      localStorage.removeItem("selected_project_id");

      if (data.user.profile?.first_time_login) {
        router.push("/profile-setup");
      } else {
        router.push("/project-select");
      }
    } catch (err: any) {
      if (fallbackUser && password) {
        persistDemoSession(fallbackUser);
        if (fallbackUser.profile?.first_time_login) {
          router.push("/profile-setup");
        } else {
          router.push("/project-select");
        }
        return;
      }
      setError(err.message || "Something went wrong. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  // Shortcut login helper for evaluation
  const handleShortcutLogin = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword("password123");
  };

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center py-12 px-6 relative overflow-hidden">
      {/* Background radial glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-600/5 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="max-w-md w-full space-y-8 z-10">
        {/* Title logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex bg-gradient-to-tr from-orange-500 to-amber-600 p-3 rounded-2xl text-white shadow-xl shadow-orange-500/10">
            <BrainCircuit className="h-8 w-8" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">Welcome Back</h2>
          <p className="text-sm text-slate-400">
            Access the central AstroBuilds dashboard.
          </p>
        </div>

        {/* Login card */}
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-start space-x-2 text-sm">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contractor@astrobuilds.com"
                className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500/80 rounded-xl px-4 py-3 text-sm focus:outline-none transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500/80 rounded-xl px-4 py-3 text-sm focus:outline-none transition-all duration-200"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-orange-500/10 transition-all duration-200 border border-orange-500/20"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In to Brain</span>
              )}
            </button>
          </form>

          {/* Quick Shortcuts */}
          <div className="border-t border-slate-800/80 pt-6">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center mb-3">
              Developer Demo Shortcuts
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => handleShortcutLogin("contractor@astrobuilds.com")}
                className="bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 py-2.5 px-3 rounded-lg text-slate-300 font-semibold transition-all duration-200 text-left truncate"
              >
                👷 Contractor
              </button>
              <button
                onClick={() => handleShortcutLogin("engineer@astrobuilds.com")}
                className="bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 py-2.5 px-3 rounded-lg text-slate-300 font-semibold transition-all duration-200 text-left truncate"
              >
                🔬 Site Engineer
              </button>
              <button
                onClick={() => handleShortcutLogin("owner@astrobuilds.com")}
                className="bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 py-2.5 px-3 rounded-lg text-slate-300 font-semibold transition-all duration-200 text-center col-span-2"
              >
                📈 Project Owner
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 text-center">
              All demo accounts share the password: <span className="font-mono text-slate-400">password123</span>
            </p>
          </div>
        </div>

        {/* Footer redirection */}
        <p className="text-center text-sm text-slate-400">
          Don't have an account?{" "}
          <Link href="/signup" className="text-orange-400 font-semibold hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
