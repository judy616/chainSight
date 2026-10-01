import React from "react";

export default function ScenarioBar({ activeScenario, onSelectScenario }) {
  const scenarios = [
    {
      id: "ATO_HEIST",
      name: "Classic ATO Heist",
      desc: "Tor Login → Password Reset → Mule Wire",
      score: "96",
      severity: "Critical",
      badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    },
    {
      id: "MULE_RING",
      name: "Mule Aggregator Ring",
      desc: "Multi-Account Fan-In Collection",
      score: "84",
      severity: "High",
      badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    },
    {
      id: "CIRCULAR_LOOP",
      name: "Circular Smurfing",
      desc: "Cyclic Flow: A → B → C → A",
      score: "78",
      severity: "High",
      badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    },
    {
      id: "NORMAL_USER",
      name: "Legitimate Transfer",
      desc: "Known iPhone · Routine Utility Bill",
      score: "12",
      severity: "Nominal",
      badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-[#0e0e12]/80 px-4 py-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-zinc-400">Demo Scenario:</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {scenarios.map((sc) => {
          const isSelected = activeScenario === sc.id;
          return (
            <button
              key={sc.id}
              onClick={() => onSelectScenario(sc.id)}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-medium transition-all ${
                isSelected
                  ? "bg-zinc-800 text-white border border-amber-500/40 shadow-sm"
                  : "bg-white/[0.02] text-zinc-400 border border-white/[0.04] hover:text-zinc-200 hover:border-white/10"
              }`}
            >
              <span>{sc.name}</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-mono border ${sc.badgeColor}`}>
                {sc.score}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
