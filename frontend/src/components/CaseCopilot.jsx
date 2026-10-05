import { useState, useEffect } from "react";
import {
  Bot,
  FileText,
  MessageSquare,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Sparkles,
  Copy,
  Download,
  Check,
  Shield,
  Send,
  RefreshCw,
} from "lucide-react";

// ── Animated Risk Gauge ────────────────────────────────────────────────────
function RiskGauge({ score, severity }) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    let start = 0;
    const target = Math.max(0, Math.min(100, Number(score) || 0));
    const step = Math.max(1, Math.ceil(target / 30));
    const interval = setInterval(() => {
      start = Math.min(start + step, target);
      setDisplayScore(start);
      if (start >= target) clearInterval(interval);
    }, 25);
    return () => clearInterval(interval);
  }, [score]);

  const r = 60;
  const circ = Math.PI * r;
  const offset = circ - (displayScore / 100) * circ;

  const color =
    displayScore >= 80
      ? "#ef4444"
      : displayScore >= 60
      ? "#f97316"
      : displayScore >= 40
      ? "#f59e0b"
      : "#10b981";

  const resolvedSeverity =
    severity ||
    (displayScore >= 80
      ? "CRITICAL"
      : displayScore >= 60
      ? "HIGH"
      : displayScore >= 40
      ? "MEDIUM"
      : "LOW");

  return (
    <div className="flex flex-col items-center py-2">
      <svg width="180" height="96" viewBox="0 0 180 96">
        <path
          d="M 15 90 A 75 75 0 0 1 165 90"
          fill="none"
          stroke="#1e2029"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d="M 15 90 A 75 75 0 0 1 165 90"
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${circ}`}
          strokeDashoffset={`${offset}`}
          style={{ transition: "stroke-dashoffset 0.05s linear, stroke 0.3s" }}
        />
        <text
          x="90"
          y="76"
          textAnchor="middle"
          fill={color}
          fontSize="30"
          fontWeight="bold"
          fontFamily="monospace"
        >
          {displayScore}
        </text>
        <text
          x="90"
          y="92"
          textAnchor="middle"
          fill="#71717a"
          fontSize="10"
          fontFamily="monospace"
        >
          / 100
        </text>
      </svg>
      <span
        className="mt-2 text-[10px] font-mono font-bold tracking-widest px-3 py-1 rounded-full border transition-colors uppercase"
        style={{ color, borderColor: `${color}40`, background: `${color}15` }}
      >
        {resolvedSeverity} RISK
      </span>
    </div>
  );
}

// ── Copy-to-clipboard button ───────────────────────────────────────────────
function CopyButton({ text, label = "Copy" }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border font-mono transition-all ${
        copied
          ? "text-emerald-400 border-emerald-500/40 bg-emerald-500/10"
          : "text-zinc-400 border-white/10 hover:border-amber-500/40 hover:text-amber-300 bg-white/[0.02]"
      }`}
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? "Copied" : label}
    </button>
  );
}

// ── Download text button ───────────────────────────────────────────────────
function DownloadButton({ text, filename }) {
  const handleDownload = () => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <button
      onClick={handleDownload}
      className="flex items-center gap-1.5 text-xs text-zinc-400 border border-white/10 hover:border-amber-500/40 hover:text-amber-300 px-2.5 py-1 rounded-lg bg-white/[0.02] font-mono transition-all"
    >
      <Download size={11} /> .txt
    </button>
  );
}

// ── Text output card with copy + download ─────────────────────────────────
function OutputCard({ title, color, icon: Icon, text, filename }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0b0b10] p-4 transition-all">
      <div className="flex items-center justify-between mb-3">
        <p
          className="text-xs uppercase tracking-wider font-mono font-semibold flex items-center gap-2"
          style={{ color }}
        >
          <Icon size={13} /> {title}
        </p>
        <div className="flex gap-2">
          <CopyButton text={text} label="Copy" />
          <DownloadButton text={text} filename={filename} />
        </div>
      </div>
      <div className="rounded-lg p-3.5 text-zinc-300 font-mono text-xs leading-relaxed whitespace-pre-wrap border border-white/[0.06] bg-[#07070a] max-h-56 overflow-y-auto selection:bg-amber-400 selection:text-black">
        {text}
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function CaseCopilot({
  alert: incomingAlert,
  onExecuteAction,
  activeScenario = "ATO_HEIST",
  onSelectScenario,
  alerts = [],
  onSelectAlert,
}) {
  // Normalize alert data or fall back to rich default
  const alert = incomingAlert || {
    alertId: "ALT-2026-001",
    userId: "USR-1002",
    userName: "Eleanor Vance",
    sourceAccount: "ACC-100288",
    targetTransactionId: "TX-1002-99",
    targetAmount: 24500,
    destAccount: "ACC-MULE-44",
    destAccountName: "Apex Trading Ltd (Mule Aggregator)",
    compositeRiskScore: 96,
    severity: "CRITICAL",
    recommendedAction: "HOLD",
    status: "HELD",
    detectedAt: new Date().toISOString(),
    attackChain: {
      sequenceDetected: true,
      timeWindowMinutes: 9,
      events: [
        { eventType: "LOGIN", label: "Tor Exit-Node Login", device: "iPhone 14 / Tor Browser", runningScore: 25 },
        { eventType: "PASSWORD_CHANGE", label: "Credential Reset", device: "iPhone 14 / Tor Browser", runningScore: 50 },
        { eventType: "BENEFICIARY_ADDED", label: "Mule Payee Added", device: "iPhone 14 / Tor Browser", runningScore: 75 },
        { eventType: "TRANSFER_ATTEMPT", label: "Outbound Transfer ($24,500)", device: "iPhone 14 / Tor Browser", runningScore: 96 },
      ],
    },
    graphSignals: {
      pattern: "FAN_IN",
      inDegree: 4,
      outDegree: 1,
      rapidPassThroughDetected: true,
      details: "Destination account ACC-MULE-44 received funds from 4 distinct accounts in 48h.",
    },
    baselineDeviation: {
      amountRatio: 38,
      typicalAmount: 645,
    },
    explanations: [
      "Session authenticated from known Tor exit-node (185.220.101.5) with unverified fingerprint.",
      "Password reset was executed 4m 22s after suspicious session initialization.",
      "Outbound payee ACC-MULE-44 was added 2m 14s after credential modification.",
      "Outbound transfer of $24,500 represents a 38× surge over 30-day baseline average ($645).",
      "Network graph confirms receiving account exhibits Fan-In mule aggregation pattern.",
    ],
    analystNotes: [],
  };

  const [summary, setSummary] = useState("");
  const [sar, setSar] = useState("");
  const [customerMsg, setCustomerMsg] = useState("");
  const [generating, setGenerating] = useState("");
  const [analystNote, setAnalystNote] = useState("");
  const [actionFeedback, setActionFeedback] = useState("");
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Initialize audit trail from alert data or local timestamps
  const [auditLog, setAuditLog] = useState([
    {
      time: "20:31:04",
      event: `Alert ${alert.alertId} created by Detection Engine`,
      type: "system",
    },
    {
      time: "20:31:18",
      event: `Case file opened for ${alert.userName || alert.sourceAccount}`,
      type: "system",
    },
  ]);

  // Sync existing backend analyst notes into audit log if provided
  useEffect(() => {
    if (alert?.analystNotes && alert.analystNotes.length > 0) {
      const backendEntries = alert.analystNotes.map((note) => ({
        time: note.timestamp
          ? new Date(note.timestamp).toLocaleTimeString()
          : "Earlier",
        event: `${note.action}: ${note.note} (${note.author || "Analyst"})`,
        type: "action",
      }));
      setAuditLog((prev) => {
        const existingEvents = new Set(prev.map((e) => e.event));
        const newEntries = backendEntries.filter((b) => !existingEvents.has(b.event));
        return [...prev, ...newEntries];
      });
    }
  }, [alert?.alertId, alert?.analystNotes]);

  // Reset generated text when alertId changes
  useEffect(() => {
    setSummary("");
    setSar("");
    setCustomerMsg("");
    setActionFeedback("");
  }, [alert.alertId]);

  const nowTime = () =>
    new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  const addAuditEntry = (event, type = "analyst") => {
    setAuditLog((prev) => [...prev, { time: nowTime(), event, type }]);
  };

  // ── Dynamic Text Generation Engines ───────────────────────────────────────
  const handleGenerateSummary = () => {
    setGenerating("summary");
    setTimeout(() => {
      const chainSteps =
        alert.attackChain?.events?.map((e) => e.eventType || e.label) || [
          "LOGIN",
          "PASSWORD_CHANGE",
          "BENEFICIARY_ADDED",
          "TRANSFER_ATTEMPT",
        ];
      const amountStr = alert.targetAmount
        ? `$${Number(alert.targetAmount).toLocaleString()}`
        : "$24,500";
      const ratioStr = alert.baselineDeviation?.amountRatio
        ? `${alert.baselineDeviation.amountRatio}×`
        : "38×";
      const windowStr = alert.attackChain?.timeWindowMinutes || 9;

      const text = `CASE SUMMARY — INCIDENT #${alert.alertId}
Subject: ${alert.userName} (${alert.sourceAccount})
Composite Risk: ${alert.compositeRiskScore}/100 [${alert.severity}]

EXECUTIVE OVERVIEW:
Account ${alert.sourceAccount} exhibits a confirmed ${alert.severity}-severity anomaly pattern with composite risk score of ${alert.compositeRiskScore}/100.

ATTACK TIMELINE & STAGES:
The attack chain progressed through:
${chainSteps.join("  →  ")}
Total elapsed duration: ${windowStr} minutes.

PRIMARY ANOMALIES & SIGNALS:
${(alert.explanations || []).map((exp, i) => `${i + 1}. ${exp}`).join("\n")}

NETWORK GRAPH CONTEXT:
Target Beneficiary: ${alert.destAccount} (${alert.destAccountName || "External Counterparty"})
Transaction Volume: ${amountStr} (${ratioStr} historical baseline)
Pattern Classification: ${alert.graphSignals?.pattern || "RAPID DISSIPATION / FAN-IN"}
${alert.graphSignals?.details ? `Details: ${alert.graphSignals.details}` : ""}

RECOMMENDED POLICY ACTION:
Current engine recommendation is ${alert.recommendedAction || "HOLD"}. Retain transaction freeze pending positive customer callback or step-up biometric verification.`;

      setSummary(text);
      setGenerating("");
      addAuditEntry(`AI Copilot — Generated Case Summary for ${alert.alertId}`);
    }, 900);
  };

  const handleGenerateSAR = () => {
    setGenerating("sar");
    setTimeout(() => {
      const amountStr = alert.targetAmount
        ? `$${Number(alert.targetAmount).toLocaleString()}`
        : "$24,500";
      const ratioStr = alert.baselineDeviation?.amountRatio
        ? `${alert.baselineDeviation.amountRatio}×`
        : "38×";

      const text = `SUSPICIOUS ACTIVITY REPORT (SAR) — REGULATORY DRAFT
FINANCIAL INTELLIGENCE UNIT / COMPLIANCE AUDIT DISCLOSURE

FILING REFERENCE:
  Tracking ID: ${alert.alertId}
  Filing Institution: ChainSight Secured Banking Platform
  Date of Discovery: ${alert.detectedAt ? new Date(alert.detectedAt).toUTCString() : new Date().toUTCString()}
  Filing Category: Account Takeover (ATO) / Unauthorized Fund Transfer

PART I — SUBJECT IDENTIFICATION:
  Full Name: ${alert.userName}
  Customer Internal ID: ${alert.userId}
  Primary Source Account: ${alert.sourceAccount}
  Baseline Average Transfer: $${alert.baselineDeviation?.typicalAmount || "645.00"}

PART II — SUSPICIOUS TRANSACTION DETAILS:
  Transaction Ref: ${alert.targetTransactionId || "TX-PENDING-HOLD"}
  Attempted Amount: ${amountStr}
  Baseline Multiplier: ${ratioStr}
  Receiving Account: ${alert.destAccount}
  Beneficiary Entity: ${alert.destAccountName || "Unknown / Under Investigation"}
  Network Topology: ${alert.graphSignals?.pattern || "FAN_IN"} Mule Account

PART III — CHRONOLOGICAL NARRATIVE:
On the date indicated, automated security monitoring detected coordinated malicious progression:
${(alert.explanations || []).map((exp, i) => `  [Stage ${i + 1}] ${exp}`).join("\n")}

PART IV — INSTITUTIONAL ACTION TAKEN:
  Initial Disposition: ${alert.status || "HOLD"}
  Engine Recommendation: ${alert.recommendedAction || "HOLD"}
  Analyst Execution: Funds quarantined under automated AML/fraud control protocol.

Prepared by: ChainSight AI Case Copilot
Status: Drafted from verified telemetry only. Requires Lead Investigator sign-off.`;

      setSar(text);
      setGenerating("");
      addAuditEntry(`AI Copilot — Drafted Regulatory SAR for ${alert.alertId}`);
    }, 1100);
  };

  const handleGenerateCustomerMsg = () => {
    setGenerating("customer");
    setTimeout(() => {
      const amountStr = alert.targetAmount
        ? `$${Number(alert.targetAmount).toLocaleString()}`
        : "$24,500";
      const destName = alert.destAccountName || "an external account";

      const text = `SECURITY ALERT — URGENT VERIFICATION NEEDED

Dear ${alert.userName || "Customer"},

ChainSight Fraud Monitoring has temporarily paused an outbound payment of ${amountStr} to ${destName} from your account (${alert.sourceAccount}).

WHY WAS THIS PAUSED?
Our automated security engine detected a rapid sequence of events (including recent credential and payee updates) that deviate from your normal banking habits.

WHAT YOU NEED TO DO:
1. If you AUTHORIZED this transfer:
   Open your ChainSight Mobile App, go to 'Security Center' and approve the push verification request.

2. If you DID NOT authorize this activity:
   Please call our 24/7 Fraud Security Hotline immediately at 1-800-555-CHAIN (toll-free) so an analyst can freeze compromised credentials and secure your balance.

SECURITY REMINDER:
ChainSight will NEVER ask for your password, PIN, or SMS security codes over the phone or email.

ChainSight Fraud Prevention Unit
Case Reference: ${alert.alertId}`;

      setCustomerMsg(text);
      setGenerating("");
      addAuditEntry(`AI Copilot — Generated Customer Outreach Message for ${alert.userName}`);
    }, 800);
  };

  // ── Analyst Action Handler ────────────────────────────────────────────────
  const handleAction = async (actionLabel) => {
    setIsSubmittingAction(true);
    setActionFeedback(`Submitting ${actionLabel}...`);

    try {
      const actionMap = {
        MONITOR: "MONITOR",
        VERIFY: "VERIFY",
        HOLD: "HOLD",
        "ALERT & BLOCK": "ALERT",
      };
      const canonicalAction = actionMap[actionLabel] || actionLabel;

      if (onExecuteAction && alert.alertId) {
        await onExecuteAction(alert.alertId, canonicalAction, analystNote);
      }

      setActionFeedback(`Action Recorded: ${actionLabel}`);
      addAuditEntry(
        `Analyst executed: ${actionLabel} ${analystNote ? `("${analystNote.slice(0, 45)}...")` : ""}`,
        "action"
      );
      setAnalystNote("");
    } catch (err) {
      console.error("Failed to execute action:", err);
      setActionFeedback(`Action queued locally: ${actionLabel}`);
      addAuditEntry(`Local action recorded: ${actionLabel}`, "action");
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleSaveNote = () => {
    if (analystNote.trim()) {
      addAuditEntry(`Analyst note: "${analystNote.trim()}"`, "note");
      setAnalystNote("");
    }
  };

  const statusColor =
    alert.compositeRiskScore >= 80
      ? "text-red-400 border-red-500/30 bg-red-500/10"
      : alert.compositeRiskScore >= 60
      ? "text-orange-400 border-orange-500/30 bg-orange-500/10"
      : alert.compositeRiskScore >= 40
      ? "text-amber-400 border-amber-500/30 bg-amber-500/10"
      : "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";

  return (
    <div className="min-h-screen bg-[#060608] text-zinc-100 p-4 sm:p-6 lg:p-8 font-mono selection:bg-amber-400 selection:text-black">
      {/* ── Case Context Switcher Bar ── */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Bot size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold uppercase tracking-wider text-white">
                  AI Case Copilot
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 font-semibold">
                  CASE #{alert.alertId}
                </span>
              </div>
              <p className="text-zinc-500 text-xs">
                Real-time investigative synthesis powered by deterministic graph & correlation telemetry
              </p>
            </div>
          </div>
        </div>

        {/* Quick Scenario / Case Selector */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest hidden sm:inline-block">
            Investigating:
          </span>
          <div className="flex flex-wrap gap-1 rounded-xl border border-white/10 bg-white/[0.02] p-1">
            {[
              { id: "ATO_HEIST", label: "Eleanor Vance (ATO)", score: 96, color: "text-red-400" },
              { id: "MULE_RING", label: "Marcus Sterling (Mule)", score: 84, color: "text-orange-400" },
              { id: "CIRCULAR_LOOP", label: "Satoshi Pulse (Cycle)", score: 72, color: "text-amber-400" },
              { id: "NORMAL_USER", label: "David Miller (Clean)", score: 12, color: "text-emerald-400" },
            ].map((sc) => (
              <button
                key={sc.id}
                onClick={() => onSelectScenario && onSelectScenario(sc.id)}
                className={`px-2.5 py-1 text-[11px] rounded-lg transition-all font-mono ${
                  activeScenario === sc.id
                    ? "bg-zinc-800 text-white border border-amber-500/50 shadow-sm"
                    : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                <span>{sc.label}</span>
                <span className={`ml-1.5 font-bold ${sc.color}`}>({sc.score})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main 3-Column Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ══════════════════════════════════════════════════════════
            COLUMN 1: TELEMETRY & ATTACK SEQUENCE
            ══════════════════════════════════════════════════════════ */}
        <div className="space-y-5">
          {/* Animated Risk Gauge */}
          <div className="rounded-2xl border border-white/10 bg-[#0c0c10] p-5 shadow-xl shadow-black/40">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400 flex items-center gap-1.5">
                <AlertTriangle size={13} className="text-amber-400" />
                Composite Risk Assessment
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded border uppercase font-mono font-semibold ${statusColor}`}>
                {alert.status || "UNDER REVIEW"}
              </span>
            </div>

            <RiskGauge
              score={alert.compositeRiskScore}
              severity={alert.severity}
            />

            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-white/[0.06] pt-3 text-[11px]">
              <div>
                <span className="text-zinc-500 block text-[10px]">Subject</span>
                <span className="font-semibold text-zinc-200 truncate block">
                  {alert.userName || "Unknown"}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px]">Source Account</span>
                <span className="font-mono text-zinc-200 block">
                  {alert.sourceAccount || "ACC-UNKNOWN"}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px]">Target Transfer</span>
                <span className="font-semibold text-amber-400 block">
                  {alert.targetAmount ? `$${Number(alert.targetAmount).toLocaleString()}` : "$24,500"}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px]">Baseline Surge</span>
                <span className="font-semibold text-red-400 block">
                  {alert.baselineDeviation?.amountRatio ? `${alert.baselineDeviation.amountRatio}×` : "38×"}
                </span>
              </div>
            </div>
          </div>

          {/* Chronological Evidence */}
          <div className="rounded-2xl border border-white/10 bg-[#0c0c10] p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400 flex items-center gap-1.5">
                <Shield size={13} className="text-amber-400" />
                Engine Evidence ({(alert.explanations || []).length || 4})
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">100% Deterministic</span>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {(alert.explanations && alert.explanations.length > 0
                ? alert.explanations
                : [
                    "Session initiated from unverified foreign IP / proxy exit-node.",
                    "Password reset occurred within 5m of untrusted device registration.",
                    "New external beneficiary added immediately following credential reset.",
                    "Outbound transfer attempted exceeding 30-day baseline average.",
                  ]
              ).map((explanation, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-xs"
                >
                  <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold font-mono">
                    {i + 1}
                  </span>
                  <p className="text-zinc-300 text-[11px] leading-relaxed">
                    {explanation}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Attack Chain Progression */}
          <div className="rounded-2xl border border-white/10 bg-[#0c0c10] p-5">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400 block mb-3">
              Attack Chain Sequence
            </span>
            <div className="space-y-1.5">
              {(alert.attackChain?.events || [
                { eventType: "LOGIN", label: "Initial Login", runningScore: 25 },
                { eventType: "PASSWORD_CHANGE", label: "Password Reset", runningScore: 50 },
                { eventType: "BENEFICIARY_ADDED", label: "Beneficiary Added", runningScore: 75 },
                { eventType: "TRANSFER_ATTEMPT", label: "Transfer Attempt", runningScore: 96 },
              ]).map((evt, idx, arr) => (
                <div key={idx} className="flex items-center gap-2">
                  <div
                    className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-mono flex items-center justify-between ${
                      (evt.runningScore || 25 * (idx + 1)) >= 80
                        ? "border-red-500/30 bg-red-500/10 text-red-300"
                        : (evt.runningScore || 25 * (idx + 1)) >= 50
                        ? "border-orange-500/30 bg-orange-500/10 text-orange-300"
                        : "border-amber-500/30 bg-amber-500/10 text-amber-300"
                    }`}
                  >
                    <span className="font-semibold text-[11px]">
                      {evt.eventType || evt.label}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      Score: {evt.runningScore || 25 * (idx + 1)}
                    </span>
                  </div>
                  {idx < arr.length - 1 && (
                    <ChevronRight size={12} className="text-zinc-600 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            COLUMN 2: AI COPILOT SYNTHESIS & REPORT DRAFTER
            ══════════════════════════════════════════════════════════ */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-amber-500/30 bg-[#0c0c10] p-5 relative overflow-hidden">
            <div className="flex items-center gap-2.5 mb-2">
              <Sparkles className="text-amber-400" size={17} />
              <h2 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                AI Synthesis Actions
              </h2>
            </div>
            <p className="text-zinc-500 text-xs mb-4">
              Grounds drafts strictly in engine data — zero hallucinated facts.
            </p>

            <div className="space-y-2.5">
              {[
                {
                  label: "Generate Case Summary",
                  desc: "Comprehensive executive triage brief",
                  key: "summary",
                  icon: Bot,
                  handler: handleGenerateSummary,
                },
                {
                  label: "Draft FinCEN / FIU SAR Report",
                  desc: "Regulatory Suspicious Activity Report",
                  key: "sar",
                  icon: FileText,
                  handler: handleGenerateSAR,
                },
                {
                  label: "Draft Customer Verification Alert",
                  desc: "Personalized SMS / Push outreach message",
                  key: "customer",
                  icon: MessageSquare,
                  handler: handleGenerateCustomerMsg,
                },
              ].map(({ label, desc, key, icon: Icon, handler }) => (
                <button
                  key={key}
                  onClick={handler}
                  disabled={generating === key}
                  className="w-full text-left rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] hover:border-amber-500/40 p-3 transition-all group disabled:opacity-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 group-hover:scale-105 transition-transform">
                        <Icon size={14} />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-zinc-200 group-hover:text-amber-300 transition-colors">
                          {label}
                        </div>
                        <div className="text-[10px] text-zinc-500">{desc}</div>
                      </div>
                    </div>
                    {generating === key ? (
                      <RefreshCw size={13} className="text-amber-400 animate-spin" />
                    ) : (
                      <ChevronRight size={13} className="text-zinc-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Generated Content Cards */}
          {(summary || sar || customerMsg) && (
            <div className="space-y-4">
              {summary && (
                <OutputCard
                  title="Case Executive Summary"
                  color="#f59e0b"
                  icon={Bot}
                  text={summary}
                  filename={`ChainSight-Summary-${alert.alertId}.txt`}
                />
              )}
              {sar && (
                <OutputCard
                  title="Regulatory SAR Draft"
                  color="#38bdf8"
                  icon={FileText}
                  text={sar}
                  filename={`ChainSight-SAR-${alert.alertId}.txt`}
                />
              )}
              {customerMsg && (
                <OutputCard
                  title="Customer Outreach Notice"
                  color="#34d399"
                  icon={MessageSquare}
                  text={customerMsg}
                  filename={`ChainSight-Notice-${alert.alertId}.txt`}
                />
              )}
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════
            COLUMN 3: ANALYST ACTIONS & LIVE AUDIT TRAIL
            ══════════════════════════════════════════════════════════ */}
        <div className="space-y-5">
          {/* Analyst Workspace */}
          <div className="rounded-2xl border border-white/10 bg-[#0c0c10] p-5">
            <div className="flex items-center gap-2 mb-3">
              <User size={15} className="text-amber-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Analyst Intervention
              </h2>
            </div>

            <div className="mb-4">
              <label className="text-[10px] text-zinc-500 uppercase tracking-widest block mb-1.5">
                Investigation Note
              </label>
              <textarea
                className="w-full rounded-xl border border-white/10 bg-[#07070a] p-3 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 transition-colors min-h-[75px] resize-none"
                placeholder="Enter rationale for quarantine or release..."
                value={analystNote}
                onChange={(e) => setAnalystNote(e.target.value)}
              />
              <button
                onClick={handleSaveNote}
                disabled={!analystNote.trim()}
                className="mt-2 text-[11px] font-mono font-medium text-amber-400 hover:text-amber-300 border border-amber-500/30 hover:border-amber-500/50 px-3 py-1 rounded-lg transition-all disabled:opacity-40"
              >
                Log Note to File
              </button>
            </div>

            <label className="text-[10px] text-zinc-500 uppercase tracking-widest block mb-2">
              Execute Backend Policy Action
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "MONITOR", border: "border-zinc-700 hover:border-zinc-500 text-zinc-300" },
                { label: "VERIFY", border: "border-sky-500/40 hover:border-sky-400 text-sky-300" },
                { label: "HOLD", border: "border-amber-500/40 hover:border-amber-400 text-amber-300" },
                { label: "ALERT & BLOCK", border: "border-red-500/40 hover:border-red-400 text-red-300" },
              ].map((btn) => (
                <button
                  key={btn.label}
                  disabled={isSubmittingAction}
                  onClick={() => handleAction(btn.label)}
                  className={`rounded-xl border px-3 py-2 text-xs font-mono font-bold transition-all bg-white/[0.02] hover:bg-white/[0.08] active:scale-95 disabled:opacity-50 ${btn.border}`}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            {actionFeedback && (
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
                <CheckCircle size={13} />
                <span>{actionFeedback}</span>
              </div>
            )}
          </div>

          {/* Chronological Audit Trail */}
          <div className="rounded-2xl border border-white/10 bg-[#0c0c10] p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock size={15} className="text-zinc-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Case Audit Trail
                </h2>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">
                {auditLog.length} events
              </span>
            </div>

            <div className="space-y-0 max-h-72 overflow-y-auto pr-1">
              {auditLog.map((entry, idx) => (
                <div key={idx} className="relative flex gap-3 pb-3.5">
                  {idx < auditLog.length - 1 && (
                    <div className="absolute left-[6px] top-3.5 bottom-0 w-px bg-white/10" />
                  )}
                  <div
                    className={`shrink-0 w-3 h-3 rounded-full mt-1 border-2 z-10 ${
                      entry.type === "action"
                        ? "border-red-500 bg-red-950"
                        : entry.type === "note"
                        ? "border-amber-400 bg-amber-950"
                        : entry.type === "system"
                        ? "border-zinc-500 bg-zinc-800"
                        : "border-sky-400 bg-sky-950"
                    }`}
                  />
                  <div className="flex-1 text-xs">
                    <span className="text-[10px] font-mono text-zinc-500 block">
                      {entry.time}
                    </span>
                    <p
                      className={`text-[11px] mt-0.5 leading-relaxed ${
                        entry.type === "action"
                          ? "text-red-300"
                          : entry.type === "note"
                          ? "text-amber-300"
                          : entry.type === "system"
                          ? "text-zinc-400"
                          : "text-sky-300"
                      }`}
                    >
                      {entry.event}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
