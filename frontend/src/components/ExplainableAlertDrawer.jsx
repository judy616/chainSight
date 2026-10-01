import React, { useState } from "react";
import { X, CheckCircle, Clock, Smartphone, Lock, ChevronRight, FileText } from "lucide-react";

export default function ExplainableAlertDrawer({ alert, onExecuteAction, onClose }) {
  const [actionInProgress, setActionInProgress] = useState(null);
  const [analystNote, setAnalystNote] = useState("");

  if (!alert) return null;

  const score = alert.compositeRiskScore || 0;
  const severity = alert.severity || "LOW";
  const recommendedAction = alert.recommendedAction || "MONITOR";
  const status = alert.status || "NEW";

  const handleAction = async (actionType) => {
    setActionInProgress(actionType);
    try {
      await onExecuteAction(alert.alertId, actionType, analystNote);
      setAnalystNote("");
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto thin-scroll p-6 lg:p-8 bg-[#0a0a0d] text-zinc-200">
      {/* Drawer Header */}
      <div className="flex items-start justify-between border-b border-white/[0.06] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-amber-400">
              {alert.alertId}
            </span>
            <span className="h-1 w-1 rounded-full bg-zinc-600" />
            <span className="font-mono text-[11px] text-zinc-400 uppercase tracking-wider">
              {status}
            </span>
          </div>
          <h2 className="mt-1.5 text-lg font-bold text-white tracking-tight">
            Security Intelligence Dossier
          </h2>
          <p className="text-xs text-zinc-400">
            Account: <span className="font-mono text-zinc-200">{alert.sourceAccount}</span> ({alert.userName})
          </p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-zinc-400 hover:bg-white/[0.06] hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Risk Gauge Block */}
      <div className="mt-6 flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
        <div>
          <span className="text-xs font-medium text-zinc-400">Composite Risk Score</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold font-mono text-white tracking-tight">
              {score}
            </span>
            <span className="text-xs font-mono text-zinc-500">/ 100</span>
          </div>
          <p className="mt-2 text-xs font-medium text-amber-400">
            Policy Action: <span className="uppercase font-mono">{recommendedAction}</span>
          </p>
        </div>

        <div className="text-right">
          <span className={`inline-block rounded-full px-3 py-1 text-xs font-mono font-semibold border ${
            score >= 85
              ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
              : score >= 70
              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
              : score >= 40
              ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
          }`}>
            {severity} SEVERITY
          </span>
        </div>
      </div>

      {/* Explainable Rationale */}
      <div className="mt-6 rounded-2xl border border-white/[0.06] bg-white/[0.015] p-5 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
          <FileText className="h-3.5 w-3.5 text-amber-400" />
          Correlated Threat Factors (Explainability)
        </h3>

        <ul className="space-y-2.5 text-xs text-zinc-300">
          {alert.explanations?.length > 0 ? (
            alert.explanations.map((exp, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-amber-400 mt-0.5" />
                <span>{exp}</span>
              </li>
            ))
          ) : (
            <li className="text-zinc-500 italic">Nominal transaction. No threat patterns detected.</li>
          )}
        </ul>
      </div>

      {/* Transaction Details */}
      <div className="mt-6 rounded-2xl border border-white/[0.06] bg-white/[0.015] p-5 text-xs space-y-2">
        <span className="text-[11px] font-mono uppercase text-zinc-500 block mb-2">
          Transaction Overview
        </span>
        <div className="flex justify-between">
          <span className="text-zinc-400">Target Value:</span>
          <span className="font-mono font-bold text-white">${alert.targetAmount?.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-400">Target Beneficiary:</span>
          <span className="font-mono text-zinc-300">{alert.destAccount} ({alert.destAccountName})</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-400">Transaction ID:</span>
          <span className="font-mono text-zinc-400">{alert.targetTransactionId}</span>
        </div>
      </div>

      {/* Analyst Action Console */}
      <div className="mt-auto border-t border-white/[0.06] pt-6">
        <label className="text-xs font-semibold text-zinc-300 block mb-2">
          Analyst Policy Response
        </label>
        <textarea
          value={analystNote}
          onChange={(e) => setAnalystNote(e.target.value)}
          placeholder="Optional resolution note..."
          rows={2}
          className="w-full rounded-xl border border-white/[0.08] bg-[#070709] p-3 text-xs text-white placeholder-zinc-600 focus:border-amber-500/50 focus:outline-none"
        />

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <button
            onClick={() => handleAction("MONITOR")}
            disabled={actionInProgress}
            className="flex items-center justify-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] py-2.5 text-xs font-medium text-zinc-300 hover:bg-white/[0.07] hover:border-white/20 active:scale-95 transition-all"
          >
            <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
            <span>Monitor / Allow</span>
          </button>

          <button
            onClick={() => handleAction("VERIFY")}
            disabled={actionInProgress}
            className="flex items-center justify-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 py-2.5 text-xs font-medium text-amber-300 hover:bg-amber-500/20 active:scale-95 transition-all"
          >
            <Smartphone className="h-3.5 w-3.5 text-amber-400" />
            <span>Step-Up MFA</span>
          </button>

          <button
            onClick={() => handleAction("HOLD")}
            disabled={actionInProgress}
            className="flex items-center justify-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/20 py-2.5 text-xs font-semibold text-amber-200 hover:bg-amber-500/30 active:scale-95 transition-all"
          >
            <Clock className="h-3.5 w-3.5 text-amber-400" />
            <span>Hold Payout (2h)</span>
          </button>

          <button
            onClick={() => handleAction("BLOCK")}
            disabled={actionInProgress}
            className="flex items-center justify-center gap-2 rounded-full bg-rose-600 hover:bg-rose-500 py-2.5 text-xs font-bold text-white shadow-sm active:scale-95 transition-all"
          >
            <Lock className="h-3.5 w-3.5" />
            <span>Alert &amp; Revoke</span>
          </button>
        </div>
      </div>
    </div>
  );
}
