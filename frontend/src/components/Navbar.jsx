import React from "react";
import { RefreshCw, ArrowRight, Bot, Shield } from "lucide-react";

export default function Navbar({
  activeTab,
  onNavigate,
  onReseed,
  isReseeding,
  onOpenDossier,
}) {
  const navItems = [
    { id: "overview", label: "OVERVIEW" },
    { id: "chains", label: "ATTACK CHAINS" },
    { id: "graph", label: "NETWORK GRAPH" },
    { id: "rules", label: "RULE BUILDER" },
    { id: "copilot", label: "CASE COPILOT" },
    { id: "monitor", label: "LIVE MONITOR" },
  ];

  return (
    <header className="sticky top-3 z-50 mx-auto max-w-6xl px-4 sm:px-6">
      <div className="flex items-center justify-between rounded-full border border-white/10 bg-[#0d0d12]/90 px-5 sm:px-6 py-2.5 shadow-2xl shadow-black/80 backdrop-blur-xl transition-all">
        {/* Brand: ChainSight */}
        <button
          onClick={() => onNavigate("overview")}
          className="flex items-center text-left focus:outline-none group"
        >
          <span className="font-brand text-xs sm:text-sm font-bold uppercase tracking-[0.26em] text-white transition-opacity group-hover:opacity-90">
            CHAINSIGHT
          </span>
        </button>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-5 lg:gap-6">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`relative font-mono text-[11px] tracking-wider transition-colors py-1 ${
                  isActive
                    ? "text-white font-semibold"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <span>{item.label}</span>
                {isActive && (
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Actions: Reset & Golden AI Copilot Pill */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onReseed}
            disabled={isReseeding}
            title="Reset to fresh demo data"
            className="hidden sm:flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-mono text-zinc-300 hover:bg-white/[0.08] active:scale-95 transition-all disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3 w-3 text-amber-400 ${
                isReseeding ? "animate-spin" : ""
              }`}
            />
            <span>RESET</span>
          </button>

          <button
            onClick={onOpenDossier}
            className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#fbb034] via-[#f59e0b] to-[#d97706] px-3.5 sm:px-4 py-1.5 text-[11px] font-bold tracking-wider uppercase text-black shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_28px_rgba(245,158,11,0.4)] hover:brightness-105 active:scale-95 transition-all"
          >
            <Bot className="h-3 w-3" />
            <span className="hidden xs:inline">AI COPILOT</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </header>
  );
}
