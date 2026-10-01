import React from "react";
import { UserCheck, Smartphone, Clock, ArrowUpRight } from "lucide-react";

export default function BaselineComparison({ user, transaction, baselineDeviation }) {
  const avgAmount = baselineDeviation?.typicalAmount || user?.baseline?.avgTransferAmount || 250;
  const currentAmount = transaction?.amount || 0;
  const ratio = baselineDeviation?.amountRatio || (currentAmount / avgAmount).toFixed(1);
  const isAnomalousAmount = ratio >= 3;
  const isUnusualHour = baselineDeviation?.isUnusualHour;
  const isNewDevice = baselineDeviation?.isNewDevice;
  const isNewBeneficiary = baselineDeviation?.isNewBeneficiary;

  return (
    <div className="rounded-3xl border border-white/[0.08] bg-[#0c0c10] p-6 lg:p-8 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-amber-400">
              Behavioral Baseline Comparison
            </span>
            <span className="h-1 w-1 rounded-full bg-zinc-600" />
            <span className="text-xs text-zinc-400">30-day Customer Norms</span>
          </div>
          <h3 className="mt-1 text-xl font-bold text-white tracking-tight">
            Account Deviations: {user?.name || "Customer"}
          </h3>
        </div>

        <span className="font-mono text-xs text-zinc-400">
          Account: {user?.accountNumber || "ACC-UNKNOWN"}
        </span>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Amount Spike */}
        <div className={`rounded-2xl border p-5 transition-all ${
          isAnomalousAmount
            ? "border-amber-500/30 bg-amber-500/[0.03]"
            : "border-white/[0.06] bg-white/[0.015]"
        }`}>
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Transfer Amount</span>
            {isAnomalousAmount && (
              <span className="font-mono text-[11px] font-semibold text-amber-400">
                {ratio}x anomaly
              </span>
            )}
          </div>
          <p className="mt-2 text-2xl font-bold font-mono text-white">
            ${currentAmount.toLocaleString()}
          </p>
          <div className="mt-3 flex items-center justify-between border-t border-white/[0.04] pt-2.5 text-xs">
            <span className="text-zinc-500">Historical Avg:</span>
            <span className="font-mono text-zinc-300">${avgAmount.toLocaleString()}</span>
          </div>
        </div>

        {/* Metric 2: Execution Hour */}
        <div className={`rounded-2xl border p-5 transition-all ${
          isUnusualHour
            ? "border-amber-500/30 bg-amber-500/[0.03]"
            : "border-white/[0.06] bg-white/[0.015]"
        }`}>
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Execution Time</span>
            <Clock className="h-3.5 w-3.5 text-zinc-400" />
          </div>
          <p className="mt-2 text-2xl font-bold font-mono text-white">
            {new Date(transaction?.timestamp || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
          <div className="mt-3 flex items-center justify-between border-t border-white/[0.04] pt-2.5 text-xs">
            <span className="text-zinc-500">Active Window:</span>
            <span className="font-mono text-zinc-300">09:00 - 18:00</span>
          </div>
        </div>

        {/* Metric 3: Device Integrity */}
        <div className={`rounded-2xl border p-5 transition-all ${
          isNewDevice
            ? "border-amber-500/30 bg-amber-500/[0.03]"
            : "border-white/[0.06] bg-white/[0.015]"
        }`}>
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Device Signature</span>
            <Smartphone className="h-3.5 w-3.5 text-zinc-400" />
          </div>
          <p className={`mt-2 text-sm font-semibold truncate ${isNewDevice ? "text-amber-400" : "text-white"}`}>
            {isNewDevice ? "Unregistered Device" : "Known Device"}
          </p>
          <div className="mt-3 flex items-center justify-between border-t border-white/[0.04] pt-2.5 text-xs">
            <span className="text-zinc-500">Registered:</span>
            <span className="truncate max-w-[120px] text-zinc-300 text-[11px]">
              {user?.baseline?.knownDevices?.[0] || "Authorized Device"}
            </span>
          </div>
        </div>

        {/* Metric 4: Payee Relationship */}
        <div className={`rounded-2xl border p-5 transition-all ${
          isNewBeneficiary
            ? "border-amber-500/30 bg-amber-500/[0.03]"
            : "border-white/[0.06] bg-white/[0.015]"
        }`}>
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Payee Relationship</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-zinc-400" />
          </div>
          <p className={`mt-2 text-sm font-semibold truncate ${isNewBeneficiary ? "text-amber-400" : "text-white"}`}>
            {isNewBeneficiary ? "Fresh External Payee" : "Whitelisted Payee"}
          </p>
          <div className="mt-3 flex items-center justify-between border-t border-white/[0.04] pt-2.5 text-xs">
            <span className="text-zinc-500">Introduced:</span>
            <span className="font-mono text-zinc-300 text-[11px]">&lt; 15m ago</span>
          </div>
        </div>
      </div>
    </div>
  );
}
