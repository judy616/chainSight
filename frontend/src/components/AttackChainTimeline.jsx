import React from "react";
import { Laptop, KeyRound, UserPlus, ArrowUpRight, Clock, ShieldAlert } from "lucide-react";

export default function AttackChainTimeline({ events = [], isFullSequence = false, onInvestigate }) {
  const getStepIcon = (type) => {
    switch (type) {
      case "LOGIN":
        return Laptop;
      case "PASSWORD_CHANGE":
        return KeyRound;
      case "BENEFICIARY_ADDED":
        return UserPlus;
      case "TRANSFER_ATTEMPT":
      default:
        return ArrowUpRight;
    }
  };

  return (
    <div className="rounded-3xl border border-white/[0.08] bg-[#0c0c10] p-6 lg:p-8 backdrop-blur-xl">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-amber-400">
              Identity Attack-Chain Correlation
            </span>
            <span className="h-1 w-1 rounded-full bg-zinc-600" />
            <span className="text-xs text-zinc-400">60-minute Sliding Window</span>
          </div>
          <h3 className="mt-1 text-xl font-bold text-white tracking-tight">
            Correlated Event Progression
          </h3>
        </div>

        <div className="flex items-center gap-3">
          {isFullSequence ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-subtle-pulse" />
              Full ATO Sequence Verified
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800/60 px-3 py-1 text-xs font-medium text-zinc-300">
              Isolated Activity
            </span>
          )}

          {onInvestigate && (
            <button
              onClick={onInvestigate}
              className="rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-black transition-all hover:bg-zinc-200 active:scale-95"
            >
              Open Dossier
            </button>
          )}
        </div>
      </div>

      {/* Spacious 4-Stage Horizontal Progression */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4 relative">
        {events.map((ev, idx) => {
          const Icon = getStepIcon(ev.eventType);
          const isHigh = ev.runningScore >= 70;
          const isFinal = idx === events.length - 1;

          return (
            <div
              key={ev.eventId || idx}
              className={`group relative flex flex-col justify-between rounded-2xl border p-5 transition-all ${
                isFinal
                  ? "bg-zinc-900/60 border-amber-500/30 ring-1 ring-amber-500/20"
                  : "bg-white/[0.015] border-white/[0.06] hover:border-white/15 hover:bg-white/[0.03]"
              }`}
            >
              <div>
                {/* Step Index & Risk Delta */}
                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="font-mono text-zinc-500">0{idx + 1}</span>
                  <span className={`font-mono font-semibold ${isHigh ? "text-amber-400" : "text-zinc-400"}`}>
                    +{ev.riskDelta} pts
                  </span>
                </div>

                {/* Event Icon & Label */}
                <div className="flex items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/[0.04] border border-white/[0.08] text-zinc-300 group-hover:text-white transition-colors">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <h4 className="text-sm font-semibold text-white leading-snug">{ev.label}</h4>
                    <p className="mt-1 text-xs text-zinc-400 font-mono flex items-center gap-1">
                      <Clock className="h-3 w-3 text-zinc-500" />
                      +{ev.deltaMinutes}m elapsed
                    </p>
                  </div>
                </div>

                {/* Device & Location metadata */}
                <div className="mt-4 rounded-xl bg-black/40 border border-white/[0.04] p-2.5 text-xs text-zinc-400 space-y-1">
                  <p className="truncate font-mono text-[11px] text-zinc-300">
                    {ev.device || "Verified Device"}
                  </p>
                  {ev.location && (
                    <p className="truncate text-[11px] text-zinc-500">
                      {ev.location}
                    </p>
                  )}
                </div>
              </div>

              {/* Cumulative Risk Meter */}
              <div className="mt-5 border-t border-white/[0.04] pt-3">
                <div className="flex justify-between text-[11px] mb-1.5">
                  <span className="text-zinc-500 font-medium">Risk Score</span>
                  <span className="font-mono font-bold text-white">{ev.runningScore}/100</span>
                </div>
                <div className="h-1 w-full rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      ev.runningScore >= 85
                        ? "bg-rose-500"
                        : ev.runningScore >= 70
                        ? "bg-amber-400"
                        : ev.runningScore >= 40
                        ? "bg-yellow-500"
                        : "bg-emerald-400"
                    }`}
                    style={{ width: `${Math.min(100, ev.runningScore)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rationale Footnote */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/[0.02] border border-white/[0.04] px-4 py-3 text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          <span>
            Events that look normal individually become high-confidence indicators when sequenced together in a tight time window.
          </span>
        </div>
        <span className="font-mono text-zinc-500 text-[11px]">Rule Set: ATO-SEQ-V2</span>
      </div>
    </div>
  );
}
