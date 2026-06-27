import Link from "next/link";
import { BrainCircuit, ShieldCheck, Cpu, HardHat, TrendingUp, CloudRain, ClipboardCheck, FileText, PackageCheck, BadgeCheck } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen flex flex-col selection:bg-orange-500 selection:text-white">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-tr from-orange-500 to-amber-600 p-2 rounded-lg text-white">
              <BrainCircuit className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-extrabold text-xl bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">
                AstroBuilds AI
              </h1>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                AI PROCUREMENT COPILOT
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/login" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors duration-200">
              Sign In
            </Link>
            <Link
              href="/signup"
              className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-lg shadow-orange-500/10 border border-orange-500/20 transition-all duration-200"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      <section className="flex-grow flex items-center relative overflow-hidden py-24 md:py-32">
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-600/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center relative z-10">
          <div className="space-y-6">
            <span className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-pulse"></span>
              <span>24/7 procurement intelligence for construction teams</span>
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              AI Procurement Copilot for{" "}
              <span className="bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">
                Construction
              </span>
            </h2>
            <p className="text-slate-400 text-lg md:text-xl leading-relaxed">
              Automate procurement, analyze contracts, compare vendors, verify invoices, predict risks, and make better purchasing decisions using AI.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Link
                href="/login"
                className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-center px-8 py-4 rounded-xl shadow-xl shadow-orange-500/20 border border-orange-500/30 transition-all duration-300 transform hover:-translate-y-0.5"
              >
                Launch Procurement Workspace
              </Link>
              <Link
                href="#features"
                className="bg-slate-900/60 hover:bg-slate-800 text-slate-200 hover:text-white font-semibold text-center px-8 py-4 rounded-xl border border-slate-800 transition-all duration-300"
              >
                Explore Procurement Modules
              </Link>
            </div>

            <div className="pt-6 grid grid-cols-3 gap-6 border-t border-slate-900/80">
              <div>
                <h4 className="text-2xl font-black text-slate-100">94%</h4>
                <p className="text-xs text-slate-500 uppercase tracking-wider mt-1">Approval Speed</p>
              </div>
              <div>
                <h4 className="text-2xl font-black text-slate-100">18%</h4>
                <p className="text-xs text-slate-500 uppercase tracking-wider mt-1">Savings Captured</p>
              </div>
              <div>
                <h4 className="text-2xl font-black text-slate-100">24/7</h4>
                <p className="text-xs text-slate-500 uppercase tracking-wider mt-1">AI Decision Support</p>
              </div>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl blur-xl opacity-30 group-hover:opacity-40 transition-opacity duration-300"></div>
            <div className="relative bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl flex flex-col space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-red-500"></span>
                  <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                  <span className="w-3 h-3 rounded-full bg-green-500"></span>
                </div>
                <div className="text-xs text-slate-500 bg-slate-950 px-3 py-1 rounded-md font-mono border border-slate-800/80">
                  procurement-command-center
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950/80 border border-slate-800/60 p-4 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Pending Approvals</span>
                    <ClipboardCheck className="h-4 w-4 text-orange-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-200">8</h3>
                  <div className="text-[9px] text-amber-400 font-medium">AI flagged 3 for review</div>
                </div>

                <div className="bg-slate-950/80 border border-slate-800/60 p-4 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Vendor Score</span>
                    <BadgeCheck className="h-4 w-4 text-cyan-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-200">92/100</h3>
                  <div className="text-[9px] text-green-400 font-medium">Top supplier recommended</div>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl space-y-2 text-xs font-mono">
                <div className="text-slate-500">&gt; Recommend the best supplier for steel</div>
                <div className="text-slate-300">
                  <span className="text-orange-400">AI:</span> Vendor B is recommended because delivery reliability outweighs the price premium by ₹18k.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-24 border-t border-slate-900 bg-slate-950">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h3 className="text-xs font-bold uppercase text-orange-500 tracking-widest">Core Procurement Modules</h3>
            <h2 className="text-3xl md:text-4xl font-extrabold">Enterprise AI Procurement Operations</h2>
            <p className="text-slate-400">
              From requisition intake through invoice verification and payment approval, AstroBuilds AI becomes an always-on procurement analyst.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl hover:border-slate-800 transition-colors duration-200 space-y-4">
              <div className="bg-orange-500/10 text-orange-400 p-3 rounded-xl w-fit">
                <Cpu className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold">AI Decision Engine</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Recommends vendors, flags risks, and explains timing decisions with reason, confidence, and projected savings.
              </p>
            </div>

            <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl hover:border-slate-800 transition-colors duration-200 space-y-4">
              <div className="bg-amber-500/10 text-amber-400 p-3 rounded-xl w-fit">
                <BrainCircuit className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold">Document Intelligence</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Upload contracts, quotations, purchase orders, and invoices to extract critical procurement details automatically.
              </p>
            </div>

            <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl hover:border-slate-800 transition-colors duration-200 space-y-4">
              <div className="bg-cyan-500/10 text-cyan-400 p-3 rounded-xl w-fit">
                <CloudRain className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold">Weather-Based Buying</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Delay or accelerate purchasing decisions based on transport risks, weather disruption, and site readiness conditions.
              </p>
            </div>

            <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl hover:border-slate-800 transition-colors duration-200 space-y-4">
              <div className="bg-green-500/10 text-green-400 p-3 rounded-xl w-fit">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold">Spend Visibility</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Monitor procurement spend, vendor performance, invoice verification, and risk scores from a single command center.
              </p>
            </div>

            <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl hover:border-slate-800 transition-colors duration-200 space-y-4">
              <div className="bg-red-500/10 text-red-400 p-3 rounded-xl w-fit">
                <HardHat className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold">Progress Sync</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Procurement updates instantly notify owners and project teams whenever a purchase order, delivery, or invoice changes.
              </p>
            </div>

            <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl hover:border-slate-800 transition-colors duration-200 space-y-4">
              <div className="bg-blue-500/10 text-blue-400 p-3 rounded-xl w-fit">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold">Secure Workflow</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Role-aware approvals, validation checks, and document history keep every procure-to-pay action trustworthy.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-900 py-8 bg-slate-950 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-2 text-slate-400">
            <BrainCircuit className="h-5 w-5 text-orange-500" />
            <span className="font-bold">AstroBuilds AI © 2026</span>
          </div>
          <div className="flex space-x-6">
            <a href="#" className="hover:text-slate-300">Privacy Policy</a>
            <a href="#" className="hover:text-slate-300">Terms of Use</a>
            <a href="#" className="hover:text-slate-300">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
