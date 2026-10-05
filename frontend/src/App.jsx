import { useState } from "react";
import Dashboard from "./pages/Dashboard.jsx";
import RuleBuilder from "./components/RuleBuilder.jsx";
import CaseCopilot from "./components/CaseCopilot.jsx";

function App() {
  const [page, setPage] = useState("dashboard");

  return (
    <div className="min-h-screen bg-[#060608] text-zinc-100">
      {/* Top Application Navigation Switcher */}
      <div className="sticky top-0 z-[60] flex items-center justify-between border-b border-white/[0.06] bg-[#09090d]/90 px-6 py-2 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <span className="font-brand text-xs font-bold uppercase tracking-[0.24em] text-white">
            CHAINSIGHT
          </span>
          <span className="h-1 w-1 rounded-full bg-zinc-600 hidden sm:block" />
          <span className="hidden sm:inline-block font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
            Intelligence Suite
          </span>
        </div>

        <div className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.02] p-1">
          <button
            onClick={() => setPage("dashboard")}
            className={`rounded-full px-3.5 py-1 text-xs font-mono font-medium transition-all ${
              page === "dashboard"
                ? "bg-zinc-800 text-white border border-amber-500/40 shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Dashboard
          </button>

          <button
            onClick={() => setPage("rules")}
            className={`rounded-full px-3.5 py-1 text-xs font-mono font-medium transition-all ${
              page === "rules"
                ? "bg-zinc-800 text-white border border-amber-500/40 shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Rule Builder
          </button>

          <button
            onClick={() => setPage("copilot")}
            className={`rounded-full px-3.5 py-1 text-xs font-mono font-medium transition-all ${
              page === "copilot"
                ? "bg-zinc-800 text-white border border-amber-500/40 shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            AI Case Copilot
          </button>
        </div>
      </div>

      {/* Pages */}
      <div className="w-full">
        {page === "dashboard" && <Dashboard />}
        {page === "rules" && <RuleBuilder />}
        {page === "copilot" && <CaseCopilot />}
      </div>
    </div>
  );
}

export default App;