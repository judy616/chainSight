import React, { useState } from "react";
import { ArrowRight, Laptop, KeyRound, UserPlus, ArrowUpRight, ShieldAlert, CheckCircle2 } from "lucide-react";

export default function HeroCenterpiece({ alert, scenario, onExploreDossier }) {
  const [selectedStage, setSelectedStage] = useState(null);

  // Fallback stages if alert.attackChain.events is loading
  const defaultEvents = [
    {
      eventType: "LOGIN",
      label: "NEW DEVICE",
      sublabel: "Tor Exit Node · 185.220.101.5",
      time: "00:00",
      delta: "+25",
      score: 25,
      detail: "First access from an unrecognized Linux fingerprint located in St. Petersburg.",
    },
    {
      eventType: "PASSWORD_CHANGE",
      label: "PASSWORD CHANGE",
      sublabel: "Reset via bypass · +4m",
      time: "+04m",
      delta: "+25",
      score: 50,
      detail: "Credential modification executed within 4 minutes of new device session.",
    },
    {
      eventType: "BENEFICIARY_ADDED",
      label: "BENEFICIARY ADDED",
      sublabel: "Apex Global LLC · +10m",
      time: "+10m",
      delta: "+25",
      score: 75,
      detail: "Fresh unverified external beneficiary registered immediately post-reset.",
    },
    {
      eventType: "TRANSFER_ATTEMPT",
      label: "TRANSFER ATTEMPT",
      sublabel: "$24,500 Wire · +22m",
      time: "+22m",
      delta: "+21",
      score: 96,
      detail: "$24,500 wire targeted to rapid pass-through mule account. Automatic hold triggered.",
    },
  ];

  // Map alert events to stages
  const stages = alert?.attackChain?.events?.length
    ? alert.attackChain.events.map((ev, i) => {
        let label = "EVENT";
        if (ev.eventType === "LOGIN") label = "NEW DEVICE";
        else if (ev.eventType === "PASSWORD_CHANGE") label = "PASSWORD CHANGE";
        else if (ev.eventType === "BENEFICIARY_ADDED") label = "BENEFICIARY ADDED";
        else if (ev.eventType === "TRANSFER_ATTEMPT") label = "TRANSFER ATTEMPT";

        return {
          eventType: ev.eventType,
          label,
          sublabel: ev.device || ev.label,
          time: `+${ev.deltaMinutes}m`,
          delta: `+${ev.riskDelta}`,
          score: ev.runningScore,
          detail: ev.label,
        };
      })
    : defaultEvents;

  const currentScore = alert?.compositeRiskScore || 96;
  const isNormal = scenario === "NORMAL_USER" || currentScore < 30;

  return (
    <div className="relative mx-auto w-full max-w-5xl">
      {/* Subtle warm amber radial aura behind the centerpiece (like reference image) */}
      <div className="pointer-events-none absolute inset-0 -top-8 -bottom-8 flex items-center justify-center">
        <div className={`h-[280px] w-[500px] rounded-full blur-[100px] transition-all duration-700 ${
          isNormal ? "bg-emerald-500/[0.04]" : "bg-amber-500/[0.08]"
        }`} />
      </div>

      {/* Main Elevated Centerpiece Card */}
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0c0c10]/90 p-6 sm:p-8 lg:p-10 shadow-2xl shadow-black/80 backdrop-blur-2xl">
        {/* Top Header of Centerpiece */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.05] pb-5">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs font-semibold text-amber-400 uppercase tracking-widest">
              Live Attack Chain
            </span>
            <span className="h-1 w-1 rounded-full bg-zinc-600" />
            <span className="font-mono text-xs text-zinc-400">
              Target: <strong className="text-white">{alert?.userName || "Eleanor Vance"}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-xs font-semibold border ${
              currentScore >= 85
                ? "bg-rose-500/10 text-rose-400 border-rose-500/25"
                : currentScore >= 70
                ? "bg-amber-500/10 text-amber-400 border-amber-500/25"
                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${
                currentScore >= 85 ? "bg-rose-400 animate-subtle-pulse" : "bg-amber-400"
              }`} />
              Score {currentScore} / 100 · {alert?.severity || "Critical"}
            </span>

            {onExploreDossier && (
              <button
                onClick={onExploreDossier}
                className="hidden sm:inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors"
              >
                <span>View Full Dossier</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* The 4-Stage Connected Chain */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4 relative">
          {stages.map((stage, idx) => {
            const isHovered = selectedStage === idx;
            const isFinal = idx === stages.length - 1;

            return (
              <div
                key={idx}
                onMouseEnter={() => setSelectedStage(idx)}
                onMouseLeave={() => setSelectedStage(null)}
                className={`group relative flex flex-col justify-between rounded-2xl border p-5 transition-all duration-200 cursor-pointer ${
                  isFinal && !isNormal
                    ? "border-amber-500/30 bg-amber-500/[0.03] ring-1 ring-amber-500/20"
                    : isHovered
                    ? "border-white/20 bg-white/[0.04]"
                    : "border-white/[0.06] bg-white/[0.015] hover:border-white/15"
                }`}
              >
                {/* Arrow Connector on desktop */}
                {idx < stages.length - 1 && (
                  <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 grid h-6 w-6 place-items-center rounded-full bg-[#141419] border border-white/[0.08] text-zinc-500">
                    <ArrowRight className="h-3 w-3" />
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
                      Phase 0{idx + 1}
                    </span>
                    <span className="font-mono text-[11px] font-semibold text-amber-400">
                      {stage.delta} pts
                    </span>
                  </div>

                  <h3 className="font-brand text-xs sm:text-sm font-bold tracking-wider text-white uppercase">
                    {stage.label}
                  </h3>
                  <p className="mt-1 text-xs text-zinc-400 truncate">
                    {stage.sublabel}
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-white/[0.04] pt-3 text-xs">
                  <span className="font-mono text-zinc-500 text-[11px]">{stage.time}</span>
                  <span className="font-mono font-semibold text-white text-[11px]">
                    Score: {stage.score}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Interactive Detail Box on Hover / Stage Callout */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.04] bg-white/[0.01] px-5 py-3.5 text-xs text-zinc-400">
          <div className="flex items-center gap-2.5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            <span className="text-zinc-300">
              {selectedStage !== null
                ? stages[selectedStage]?.detail
                : "Hover any phase to inspect the behavioral correlation rule and threat indicators."}
            </span>
          </div>

          <div className="font-mono text-[11px] text-zinc-500">
            Automated Policy: <span className="uppercase text-white font-semibold">{alert?.recommendedAction || "HOLD"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
