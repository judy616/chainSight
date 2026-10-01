import React, { useState } from "react";
import { RotateCcw, ChevronRight, Laptop, KeyRound, UserPlus, ArrowUpRight } from "lucide-react";

export default function StepSimulator({ onStepChange }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const steps = [
    {
      step: 1,
      title: "Phase 1: Unrecognized Device Login",
      icon: Laptop,
      eventType: "LOGIN",
      device: "Unknown Linux / Tor Exit Node (185.220.101.5)",
      location: "St. Petersburg, Russia",
      timestamp: "14:02:10 UTC",
      riskDelta: 25,
      cumulativeScore: 25,
      severity: "LOW",
      policyResponse: "MONITOR (Flag session as untrusted)",
      explanation: "Login initiated from an unrecognized Tor exit node outside known Seattle home/office IP ranges.",
      color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
      progressWidth: "25%",
      barColor: "bg-emerald-400",
    },
    {
      step: 2,
      title: "Phase 2: Rapid Password Reset",
      icon: KeyRound,
      eventType: "PASSWORD_CHANGE",
      device: "Unknown Linux / Tor Exit Node",
      location: "St. Petersburg, Russia",
      timestamp: "14:06:45 UTC (+4m 35s)",
      riskDelta: 25,
      cumulativeScore: 50,
      severity: "MEDIUM",
      policyResponse: "VERIFY (Step-up MFA challenge required)",
      explanation: "Credential reset within 5 minutes of unrecognized device session. Velocity exceeds normal user baseline.",
      color: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10",
      progressWidth: "50%",
      barColor: "bg-yellow-400",
    },
    {
      step: 3,
      title: "Phase 3: Unverified Beneficiary Added",
      icon: UserPlus,
      eventType: "BENEFICIARY_ADDED",
      device: "Unknown Linux / Tor Exit Node",
      location: "St. Petersburg, Russia",
      timestamp: "14:12:30 UTC (+10m 20s)",
      riskDelta: 25,
      cumulativeScore: 75,
      severity: "HIGH",
      policyResponse: "HOLD (Engage 2-hour funds cooling window)",
      explanation: "New external payee 'Apex Global Holdings LLC (Mule ACC-MULE-902)' registered immediately following credential reset.",
      color: "text-amber-400 border-amber-500/30 bg-amber-500/10",
      progressWidth: "75%",
      barColor: "bg-amber-400",
    },
    {
      step: 4,
      title: "Phase 4: High-Value Wire to Rapid Mule",
      icon: ArrowUpRight,
      eventType: "TRANSFER_ATTEMPT",
      device: "Unknown Linux / Tor Exit Node",
      amount: "$24,500 Wire",
      timestamp: "14:24:15 UTC (+22m 05s)",
      riskDelta: 21,
      cumulativeScore: 96,
      severity: "CRITICAL",
      policyResponse: "ALERT & BLOCK (Immediate kill, revoke active session)",
      explanation: "$24,500 wire requested (70x user $350 avg). Target account identified in network graph as a rapid pass-through mule node.",
      color: "text-rose-400 border-rose-500/30 bg-rose-500/10",
      progressWidth: "96%",
      barColor: "bg-rose-500",
    },
  ];

  const current = steps[currentStepIndex];
  const Icon = current.icon;

  const nextStep = () => {
    const nextIdx = Math.min(steps.length - 1, currentStepIndex + 1);
    setCurrentStepIndex(nextIdx);
    if (onStepChange) onStepChange(steps[nextIdx]);
  };

  const resetSteps = () => {
    setCurrentStepIndex(0);
    if (onStepChange) onStepChange(steps[0]);
  };

  return (
    <div className="rounded-3xl border border-white/[0.08] bg-[#0c0c10] p-6 lg:p-8 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-amber-400">
              Live Event Simulation
            </span>
            <span className="h-1 w-1 rounded-full bg-zinc-600" />
            <span className="text-xs text-zinc-400">Step-by-Step Injection</span>
          </div>
          <h3 className="mt-1 text-xl font-bold text-white tracking-tight">
            Attack Sequence Progression
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetSteps}
            className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-1.5 text-xs font-medium text-zinc-300 hover:bg-white/[0.08] active:scale-95 transition-all"
          >
            <RotateCcw className="h-3.5 w-3.5 text-amber-400" />
            <span>Restart</span>
          </button>
          <button
            onClick={nextStep}
            disabled={currentStepIndex === steps.length - 1}
            className="flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-black hover:bg-zinc-200 active:scale-95 disabled:opacity-40 transition-all"
          >
            <span>Advance Phase</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Step Pills */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {steps.map((s, idx) => (
          <button
            key={s.step}
            onClick={() => {
              setCurrentStepIndex(idx);
              if (onStepChange) onStepChange(steps[idx]);
            }}
            className={`flex flex-col p-3.5 rounded-2xl border text-left transition-all ${
              idx === currentStepIndex
                ? "border-amber-500/40 bg-zinc-800 text-white shadow-sm"
                : idx < currentStepIndex
                ? "border-white/[0.08] bg-white/[0.02] text-zinc-300"
                : "border-white/[0.04] bg-transparent opacity-40 text-zinc-600"
            }`}
          >
            <span className="text-[10px] font-mono uppercase text-zinc-500">
              Phase 0{s.step}
            </span>
            <span className="mt-1 text-xs font-semibold truncate text-white">
              {s.eventType}
            </span>
            <span className="mt-1 text-[11px] font-mono text-amber-400">
              Score: {s.cumulativeScore}
            </span>
          </button>
        ))}
      </div>

      {/* Active Phase Card */}
      <div className="mt-6 rounded-2xl border border-white/[0.06] bg-[#070709] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2.5">
                <h4 className="text-base font-bold text-white">{current.title}</h4>
                <span className="font-mono text-[10px] px-2.5 py-0.5 rounded-full border border-white/[0.08] text-zinc-300 bg-white/[0.02]">
                  {current.severity}
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-400">
                Timestamp: <span className="font-mono text-zinc-300">{current.timestamp}</span> · Device: <span className="text-zinc-300">{current.device}</span>
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-zinc-500 block">Risk Contribution</span>
            <span className="text-2xl font-bold font-mono text-amber-400">+{current.riskDelta} pts</span>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-white/[0.04] bg-white/[0.015] p-4 text-xs">
          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 block mb-1">
            Engine Rationale
          </span>
          <p className="text-zinc-300">{current.explanation}</p>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.04] pt-4 text-xs">
          <span className="text-zinc-500">Triggered Policy Action:</span>
          <span className="font-mono font-semibold text-white uppercase">{current.policyResponse}</span>
        </div>

        {/* Progress Bar */}
        <div className="mt-5">
          <div className="flex justify-between text-xs font-mono mb-2">
            <span className="text-zinc-500">Cumulative Threat Score:</span>
            <span className="font-bold text-white">{current.cumulativeScore} / 100</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${current.barColor}`}
              style={{ width: current.progressWidth }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
