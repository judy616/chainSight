import React, { useState, useEffect, useRef } from "react";
import { Laptop, KeyRound, UserPlus, ArrowUpRight, Play, RotateCcw, ShieldAlert, CheckCircle2 } from "lucide-react";

export default function HeroCenterpiece({ alert, scenario, onExploreDossier }) {
  // 4 Core Stages in the ATO sequence
  const defaultStages = [
    {
      id: "stage-1",
      stepNumber: 1,
      label: "LOGIN",
      sublabel: "New Device · Tor Exit Node",
      time: "00:00",
      ip: "185.220.101.5 (St. Petersburg)",
      riskDelta: 25,
      cumulativeScore: 25,
      policy: "MONITOR",
      policyColor: "text-zinc-400 border-zinc-700",
      detail: "Session initiated from unrecognized Linux / Tor Browser outside habitual US location.",
      icon: Laptop,
    },
    {
      id: "stage-2",
      stepNumber: 2,
      label: "PASSWORD CHANGE",
      sublabel: "Credential Reset · +4m",
      time: "+04m",
      ip: "185.220.101.5",
      riskDelta: 25,
      cumulativeScore: 50,
      policy: "VERIFY (Step-Up MFA)",
      policyColor: "text-yellow-400 border-yellow-500/30",
      detail: "Password modified within 4 minutes of untrusted session initiation. Velocity threshold violated.",
      icon: KeyRound,
    },
    {
      id: "stage-3",
      stepNumber: 3,
      label: "BENEFICIARY ADDED",
      sublabel: "Apex Global LLC · +10m",
      time: "+10m",
      ip: "185.220.101.5",
      riskDelta: 25,
      cumulativeScore: 75,
      policy: "HOLD (2h Quarantine)",
      policyColor: "text-amber-400 border-amber-500/30",
      detail: "Unverified external destination registered immediately post-password reset.",
      icon: UserPlus,
    },
    {
      id: "stage-4",
      stepNumber: 4,
      label: "TRANSFER ATTEMPT",
      sublabel: "$24,500 Wire · +22m",
      time: "+22m",
      ip: "185.220.101.5",
      riskDelta: 21,
      cumulativeScore: 96,
      policy: "ALERT & BLOCK",
      policyColor: "text-rose-400 border-rose-500/30",
      detail: "Outbound wire attempted to flagged mule account. Immediate session kill & transfer frozen.",
      icon: ArrowUpRight,
    },
  ];

  // Adjust stages if scenario is Legitimate Transfer
  const isNormal = scenario === "NORMAL_USER";
  const stages = isNormal
    ? [
        {
          id: "norm-1",
          stepNumber: 1,
          label: "LOGIN",
          sublabel: "Known iPhone 14",
          time: "00:00",
          ip: "192.0.2.100 (Denver, US)",
          riskDelta: 5,
          cumulativeScore: 5,
          policy: "MONITOR",
          detail: "Routine mobile banking login from verified biometric device at customer home IP.",
          icon: Laptop,
        },
        {
          id: "norm-2",
          stepNumber: 2,
          label: "HABITUAL CHECK",
          sublabel: "Nominal Session · +2m",
          time: "+02m",
          ip: "192.0.2.100",
          riskDelta: 0,
          cumulativeScore: 5,
          policy: "MONITOR",
          detail: "No credential changes or unauthorized profile tampering detected.",
          icon: KeyRound,
        },
        {
          id: "norm-3",
          stepNumber: 3,
          label: "SAVED PAYEE",
          sublabel: "Denver Utility (Whitelisted)",
          time: "+04m",
          ip: "192.0.2.100",
          riskDelta: 0,
          cumulativeScore: 5,
          policy: "MONITOR",
          detail: "Recipient is an established recurring payee on the customer's trusted list.",
          icon: UserPlus,
        },
        {
          id: "norm-4",
          stepNumber: 4,
          label: "PAYMENT CLEARED",
          sublabel: "$115.50 Utility Bill · +07m",
          time: "+07m",
          ip: "192.0.2.100",
          riskDelta: 7,
          cumulativeScore: 12,
          policy: "MONITOR",
          detail: "Amount aligns with historical monthly bills. Approved without friction.",
          icon: ArrowUpRight,
        },
      ]
    : defaultStages;

  // Active progression stage: 0 to 3
  const [activeStageIndex, setActiveStageIndex] = useState(3);
  const [lineProgress, setLineProgress] = useState(100); // 0% to 100%
  const [isAnimating, setIsAnimating] = useState(false);
  const [inspectedStage, setInspectedStage] = useState(null);

  // Function to run the traveling sequence animation
  const runSequenceAnimation = () => {
    setIsAnimating(true);
    setActiveStageIndex(-1);
    setLineProgress(0);

    // Step 0: Travel to Node 1
    const t0 = setTimeout(() => {
      setLineProgress(0);
      setActiveStageIndex(0);
    }, 400);

    // Step 1: Travel to Node 2
    const t1 = setTimeout(() => {
      setLineProgress(33.3);
      setActiveStageIndex(1);
    }, 1600);

    // Step 2: Travel to Node 3
    const t2 = setTimeout(() => {
      setLineProgress(66.6);
      setActiveStageIndex(2);
    }, 2800);

    // Step 3: Travel to Node 4
    const t3 = setTimeout(() => {
      setLineProgress(100);
      setActiveStageIndex(3);
      setIsAnimating(false);
    }, 4000);

    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  };

  // Re-run animation when scenario changes
  useEffect(() => {
    const cleanup = runSequenceAnimation();
    return cleanup;
  }, [scenario]);

  const currentStageData = activeStageIndex >= 0 ? stages[activeStageIndex] : stages[0];
  const displayedScore = activeStageIndex >= 0 ? stages[activeStageIndex].cumulativeScore : 0;
  const displayedPolicy = activeStageIndex >= 0 ? stages[activeStageIndex].policy : "MONITOR";
  const hoveredOrCurrent = inspectedStage !== null ? stages[inspectedStage] : currentStageData;

  return (
    <div className="relative mx-auto w-full max-w-5xl">
      {/* Warm Ambient Spotlight / Glow radiating behind center stage */}
      <div className="pointer-events-none absolute inset-0 -top-12 -bottom-12 flex items-center justify-center">
        <div className="h-[360px] w-[580px] rounded-full bg-gradient-to-b from-amber-500/10 via-amber-600/5 to-transparent blur-[120px] transition-all duration-700" />
      </div>

      {/* Main Visual Centerpiece Card */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0a0a0e]/90 p-6 sm:p-8 lg:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9)] backdrop-blur-2xl">
        {/* Top Control Bar of Centerpiece */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-semibold tracking-widest text-amber-400 uppercase">
              ATTACK CHAIN CORRELATION
            </span>
            <span className="h-1 w-1 rounded-full bg-zinc-600" />
            <span className="text-xs text-zinc-400">
              Account: <strong className="text-zinc-200">{alert?.userName || "Eleanor Vance"}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Score Display */}
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1">
              <span className="text-[11px] font-mono text-zinc-400">THREAT SCORE:</span>
              <span className={`font-mono text-xs font-bold transition-all duration-300 ${
                displayedScore >= 85
                  ? "text-rose-400"
                  : displayedScore >= 70
                  ? "text-amber-400"
                  : displayedScore >= 40
                  ? "text-yellow-400"
                  : "text-emerald-400"
              }`}>
                {displayedScore} / 100
              </span>
            </div>

            {/* Replay Sequence Button */}
            <button
              onClick={runSequenceAnimation}
              disabled={isAnimating}
              title="Replay sequence animation"
              className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-mono font-medium text-amber-300 hover:bg-amber-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              <RotateCcw className={`h-3 w-3 ${isAnimating ? "animate-spin" : ""}`} />
              <span>{isAnimating ? "RUNNING..." : "REPLAY"}</span>
            </button>
          </div>
        </div>

        {/* ========================================================
            NODE PROGRESSION VISUALIZER WITH TRAVELING LINE
            ======================================================== */}
        <div className="relative mt-12 mb-8 px-4 sm:px-8 select-none">
          {/* Track Line Container (Spanning from Node 1 center to Node 4 center) */}
          <div className="absolute left-10 sm:left-14 right-10 sm:right-14 top-7 sm:top-8 h-[2px] -translate-y-1/2 z-0">
            {/* Base Inactive Track */}
            <div className="h-full w-full bg-zinc-800/80 rounded-full" />

            {/* Smooth Traveling Illuminated Progress Line */}
            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 rounded-full transition-all duration-1000 ease-out shadow-[0_0_14px_rgba(245,158,11,0.65)]"
              style={{ width: `${lineProgress}%` }}
            >
              {/* Illuminated traveling spark point at the leading edge */}
              {isAnimating && (
                <span className="absolute right-0 top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-amber-200 shadow-[0_0_12px_#fde68a] animate-pulse" />
              )}
            </div>
          </div>

          {/* Four Nodes */}
          <div className="relative z-20 flex items-start justify-between">
            {stages.map((stage, idx) => {
              const isActive = idx <= activeStageIndex;
              const isCurrent = idx === activeStageIndex;
              const Icon = stage.icon;

              return (
                <div
                  key={stage.id}
                  onClick={() => {
                    setActiveStageIndex(idx);
                    setLineProgress(idx === 0 ? 0 : idx === 1 ? 33.3 : idx === 2 ? 66.6 : 100);
                  }}
                  onMouseEnter={() => setInspectedStage(idx)}
                  onMouseLeave={() => setInspectedStage(null)}
                  className="group flex flex-col items-center cursor-pointer max-w-[130px] sm:max-w-[170px] text-center"
                >
                  {/* The Circular Node */}
                  <div
                    className={`relative grid h-14 w-14 sm:h-16 sm:w-16 place-items-center rounded-2xl transition-all duration-500 ${
                      isActive
                        ? "border border-amber-400/80 bg-gradient-to-b from-[#1e1a12] to-[#0d0b07] text-amber-300 shadow-[0_0_24px_rgba(245,158,11,0.35)] scale-100 ring-1 ring-amber-400/30"
                        : "border border-white/10 bg-[#09090c] text-zinc-600 scale-95 opacity-60 group-hover:opacity-80 group-hover:border-white/20"
                    }`}
                  >
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6 transition-transform group-hover:scale-105" />

                    {/* Step badge on node corner */}
                    <span
                      className={`absolute -top-1.5 -right-1.5 font-mono text-[9px] px-1.5 py-0.2 rounded-full border transition-colors ${
                        isActive
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                          : "bg-zinc-900 text-zinc-500 border-zinc-700"
                      }`}
                    >
                      0{stage.stepNumber}
                    </span>
                  </div>

                  {/* Stage Label & Metadata */}
                  <div className="mt-3.5">
                    <h4
                      className={`font-mono text-xs sm:text-xs font-bold tracking-wider uppercase transition-colors ${
                        isActive ? "text-white" : "text-zinc-500"
                      }`}
                    >
                      {stage.label}
                    </h4>

                    <p className="mt-1 text-[11px] text-zinc-400 line-clamp-1">
                      {stage.sublabel}
                    </p>

                    <div className="mt-1.5 flex items-center justify-center gap-1.5">
                      <span className={`font-mono text-[10px] font-semibold ${
                        isActive ? "text-amber-400" : "text-zinc-600"
                      }`}>
                        +{stage.riskDelta} pts
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">
                        ({stage.time})
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Stage Rationale & Policy Enforcement Callout */}
        <div className="mt-8 rounded-2xl border border-white/[0.06] bg-white/[0.015] p-5 transition-all">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-subtle-pulse" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-amber-300">
                  {hoveredOrCurrent.label} · Phase 0{hoveredOrCurrent.stepNumber}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl leading-relaxed">
                {hoveredOrCurrent.detail}
              </p>
            </div>

            <div className="text-right">
              <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest block">
                Triggered Policy
              </span>
              <span className="mt-0.5 inline-block font-mono text-xs font-bold uppercase text-white bg-zinc-800/80 border border-white/10 px-2.5 py-1 rounded-full">
                {hoveredOrCurrent.policy}
              </span>
            </div>
          </div>
        </div>

        {/* Centerpiece Bottom Bar */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-500 pt-2 border-t border-white/[0.04]">
          <span className="font-mono text-[11px]">
            Engine: Real-time temporal correlation window (60m)
          </span>

          {onExploreDossier && (
            <button
              onClick={onExploreDossier}
              className="font-mono text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1.5"
            >
              <span>Explore full evidence dossier</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
