import React from "react";
import { RefreshCw } from "lucide-react";

export default function Navbar({ activeTab, onNavigate, onReseed, isReseeding }) {
  const navItems = [
    { id: "overview", label: "Overview" },
    { id: "chains", label: "Attack Chains" },
    { id: "graph", label: "Network Graph" },
    { id: "monitor", label: "Live Monitor" },
    { id: "investigate", label: "Investigate" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.05] bg-[#060608]/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Brand: ChainSight in ROSTEX-style extended typography */}
        <button
          onClick={() => onNavigate("overview")}
          className="flex items-center text-left focus:outline-none group"
        >
          <span className="font-brand text-sm sm:text-base font-bold uppercase tracking-[0.24em] text-white transition-opacity group-hover:opacity-90">
            CHAINSIGHT
          </span>
        </button>

        {/* Center Minimal Floating Island Navbar */}
        <nav className="hidden md:flex items-center gap-1 rounded-full border border-white/[0.08] bg-[#111115]/90 px-2 py-1 shadow-lg shadow-black/40 backdrop-blur-md">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                  isActive
                    ? "bg-white text-black font-semibold shadow-sm"
                    : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right Status & Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.02] px-3.5 py-1.5 text-[11px] text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-subtle-pulse" />
            <span className="font-mono text-[10px] tracking-wide">SYSTEM READY</span>
          </div>

          <button
            onClick={onReseed}
            disabled={isReseeding}
            className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-1.5 text-xs font-medium text-zinc-300 transition-all hover:bg-white/[0.08] hover:border-white/20 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 text-amber-400 ${isReseeding ? "animate-spin" : ""}`} />
            <span>Reset Demo</span>
          </button>
        </div>
      </div>
    </header>
  );
}
