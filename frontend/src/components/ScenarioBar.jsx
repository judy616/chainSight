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
    <div className="flex flex-wrap items-center justify-center gap-2 rounded-full border border-white/[0.08] bg-[#0d0d12]/90 p-1.5 shadow-xl backdrop-blur-xl">
      <span className="hidden sm:inline-block font-mono text-[10px] uppercase tracking-wider text-zinc-500 pl-3 pr-2">
        Scenario:
      </span>

      <div className="flex flex-wrap items-center gap-1.5">
        {scenarios.map((sc) => {
          const isSelected = activeScenario === sc.id;
          return (
            <button
              key={sc.id}
              onClick={() => onSelectScenario(sc.id)}
              className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                isSelected
                  ? "bg-zinc-800/95 text-white border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/20"
                  : "bg-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]"
              }`}
            >
              <span>{sc.name}</span>
              <span className={`rounded-full px-2 py-0.2 font-mono text-[10px] border ${sc.badgeColor}`}>
                {sc.score}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
