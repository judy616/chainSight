import { useState, useEffect, useRef } from "react";
import {
  Bot, FileText, MessageSquare, ChevronRight, AlertTriangle,
  CheckCircle, Clock, User, Sparkles, Copy, Download, Check
} from "lucide-react";

// ── Evidence data ─────────────────────────────────────────────────────────
const CASE_EVIDENCE = {
  caseId: "ATO-2048",
  accountId: "ACC-100123",
  riskScore: 96,
  riskLevel: "CRITICAL",
  timestamp: "2024-03-15 20:31:04",
  triggeredRules: ["Velocity Rule", "New Device Alert", "New Beneficiary", "High-Value Transfer"],
  evidence: [
    { icon: "🖥️", label: "New Device Detected", detail: "iPhone 14, IP: 192.168.33.41 — first seen today" },
    { icon: "🔑", label: "Password Reset", detail: "Changed 4 min 22 sec after login" },
    { icon: "👤", label: "New Beneficiary Added", detail: "ACC-9981 — never transacted before" },
    { icon: "💸", label: "High-Value Transfer Attempted", detail: "₹24,500 — 38× this account's typical amount" },
    { icon: "🕸️", label: "Mule Fan-In Detected", detail: "Destination account received funds from 4 other accounts" },
    { icon: "📍", label: "Geo Anomaly", detail: "Transaction origin: 1,200 km from registered address" },
  ],
  attackChain: ["LOGIN", "PASSWORD_CHANGE", "BENEFICIARY_ADDED", "TRANSFER_ATTEMPT"],
  baselineDeviation: "38×",
};

// ── Template generators ────────────────────────────────────────────────────
function generateCaseSummary(e) {
  return `Account ${e.accountId} exhibits a high-confidence Account Takeover (ATO) pattern with a composite risk score of ${e.riskScore}/100 (${e.riskLevel}).

The attack chain progressed through ${e.attackChain.join(" → ")} within a compressed 9-minute window.

Key indicators: A login was recorded from a previously unseen device (${e.evidence[0].detail}). Within minutes, the account password was changed (${e.evidence[1].detail}) and a new beneficiary was added (${e.evidence[2].detail}). A transfer of ₹24,500 was initiated — ${e.baselineDeviation} this account's 30-day baseline amount.

Network analysis confirms the destination account (ACC-9981) has received funds from 4 distinct source accounts in the past 48 hours, consistent with a mule aggregation pattern.

Recommended action: HOLD and escalate for manual review. Step-up verification should be triggered before releasing any funds.`;
}

function generateSAR(e) {
  return `SUSPICIOUS ACTIVITY REPORT — DRAFT

Reference: CASE #${e.caseId}
Date: ${e.timestamp}
Account: ${e.accountId}

NATURE OF SUSPICIOUS ACTIVITY:
Potential account takeover followed by attempted fraudulent transfer to a suspected mule account.

DESCRIPTION:
On ${e.timestamp}, the above account exhibited behaviour consistent with an account takeover attack. A login was recorded from an unrecognised device, followed by a password change, addition of a new beneficiary, and an attempted transfer of ₹24,500. The transaction amount is ${e.baselineDeviation} the account's established 30-day behavioural baseline. The receiving account (ACC-9981) has been identified as a potential money mule based on fan-in analysis.

RULES TRIGGERED: ${e.triggeredRules.join(", ")}.

RISK SCORE: ${e.riskScore}/100 — ${e.riskLevel}

ACTION TAKEN:
Transaction placed on HOLD pending manual review and customer verification.

This report has been auto-drafted by the ChainSight AI Case Copilot based on system-generated evidence only. All facts must be verified before submission.`;
}

function generateCustomerMessage(e) {
  return `Subject: Urgent — Unusual Activity Detected on Your Account

Dear Customer (Account: ${e.accountId}),

We have detected unusual activity on your account and have temporarily placed a hold on a recent transaction as a precautionary measure.

For your security, we require you to verify your identity before we can process this transaction.

Please contact us immediately at our 24/7 fraud helpline or visit your nearest branch with a valid photo ID.

DO NOT share your OTP, PIN, or password with anyone — including individuals claiming to be from our bank.

If you initiated this transaction, please call us to confirm. If you did NOT initiate this activity, please call immediately so we can secure your account.

Fraud Prevention Team
ChainSight Banking Security`;
}

const INITIAL_AUDIT = [
  { time: "20:31:04", event: "Alert created by detection engine", type: "system" },
  { time: "20:31:18", event: "Case #ATO-2048 opened", type: "system" },
];

// ── Animated Risk Gauge ────────────────────────────────────────────────────
function RiskGauge({ score }) {
  const [displayScore, setDisplayScore] = useState(0);
  const [arcPercent, setArcPercent] = useState(0);

  useEffect(() => {
    // Animate score count-up
    let start = 0;
    const step = Math.ceil(score / 40);
    const interval = setInterval(() => {
      start = Math.min(start + step, score);
      setDisplayScore(start);
      setArcPercent((start / 100) * 100);
      if (start >= score) clearInterval(interval);
    }, 30);
    return () => clearInterval(interval);
  }, [score]);

  // SVG arc
  const r = 60;
  const circ = Math.PI * r; // half circle
  const offset = circ - (arcPercent / 100) * circ;
  const color = displayScore >= 80 ? "#ef4444" : displayScore >= 50 ? "#f97316" : "#eab308";

  return (
    <div className="flex flex-col items-center py-4">
      <svg width="180" height="100" viewBox="0 0 180 100">
        {/* Background arc */}
        <path
          d="M 15 95 A 75 75 0 0 1 165 95"
          fill="none"
          stroke="#374151"
          strokeWidth="14"
          strokeLinecap="round"
        />
        {/* Animated foreground arc */}
        <path
          d="M 15 95 A 75 75 0 0 1 165 95"
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${circ}`}
          strokeDashoffset={`${circ - (arcPercent / 100) * circ}`}
          style={{ transition: "stroke-dashoffset 0.05s linear, stroke 0.3s" }}
        />
        {/* Score text */}
        <text x="90" y="80" textAnchor="middle" fill={color} fontSize="30" fontWeight="bold" fontFamily="monospace">
          {displayScore}
        </text>
        <text x="90" y="95" textAnchor="middle" fill="#6b7280" fontSize="11" fontFamily="monospace">
          / 100
        </text>
      </svg>
      <span
        className="mt-1 text-xs font-bold tracking-widest px-3 py-1 rounded-full border"
        style={{ color, borderColor: color, background: `${color}18` }}
      >
        {CASE_EVIDENCE.riskLevel}
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
      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${
        copied
          ? "text-green-400 border-green-700 bg-green-900/20"
          : "text-gray-400 border-gray-600 hover:border-gray-400 hover:text-gray-200"
      }`}
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? "Copied!" : label}
    </button>
  );
}

// ── Download text button ───────────────────────────────────────────────────
function DownloadButton({ text, filename }) {
  const handleDownload = () => {
    const blob = new Blob([text], { type: "text/plain" });
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
      className="flex items-center gap-1.5 text-xs text-gray-400 border border-gray-600 hover:border-gray-400 hover:text-gray-200 px-3 py-1.5 rounded-lg transition-all"
    >
      <Download size={11} /> Download
    </button>
  );
}

// ── Text output card with copy + download ─────────────────────────────────
function OutputCard({ title, color, icon: Icon, text, filename }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className={`text-xs uppercase tracking-widest flex items-center gap-2`} style={{ color }}>
          <Icon size={12} /> {title}
        </p>
        <div className="flex gap-2">
          <CopyButton text={text} label="Copy" />
          <DownloadButton text={text} filename={filename} />
        </div>
      </div>
      <div
        className="rounded-lg p-4 text-gray-300 text-xs leading-relaxed whitespace-pre-wrap border max-h-52 overflow-y-auto"
        style={{ background: "#1f2937", borderColor: "#374151" }}
      >
        {text}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function CaseCopilot() {
  const [summary, setSummary] = useState("");
  const [sar, setSar] = useState("");
  const [customerMsg, setCustomerMsg] = useState("");
  const [generating, setGenerating] = useState("");
  const [caseStatus, setCaseStatus] = useState("INVESTIGATING");
  const [analystNote, setAnalystNote] = useState("");
  const [auditLog, setAuditLog] = useState(INITIAL_AUDIT);
  const [actionTaken, setActionTaken] = useState("");

  const now = () =>
    new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const addAuditEntry = (event, type = "analyst") =>
    setAuditLog((prev) => [...prev, { time: now(), event, type }]);

  const handleGenerateSummary = () => {
    setGenerating("summary");
    setTimeout(() => {
      setSummary(generateCaseSummary(CASE_EVIDENCE));
      setGenerating("");
      addAuditEntry("AI Copilot — Case summary generated");
    }, 1500);
  };

  const handleGenerateSAR = () => {
    setGenerating("sar");
    setTimeout(() => {
      setSar(generateSAR(CASE_EVIDENCE));
      setGenerating("");
      addAuditEntry("AI Copilot — SAR draft generated");
    }, 1500);
  };

  const handleGenerateCustomerMsg = () => {
    setGenerating("customer");
    setTimeout(() => {
      setCustomerMsg(generateCustomerMessage(CASE_EVIDENCE));
      setGenerating("");
      addAuditEntry("AI Copilot — Customer verification message drafted");
    }, 1500);
  };

  const handleAction = (action) => {
    setActionTaken(action);
    setCaseStatus(
      action === "HOLD" ? "ON HOLD" :
      action === "ALERT & BLOCK" ? "ESCALATED" :
      action === "VERIFY" ? "PENDING VERIFICATION" : "MONITORING"
    );
    addAuditEntry(`Analyst action: ${action}`, "action");
  };

  const handleSaveNote = () => {
    if (analystNote.trim()) {
      addAuditEntry(`Analyst note: "${analystNote.slice(0, 60)}..."`, "note");
      setAnalystNote("");
    }
  };

  const statusStyle = {
    "INVESTIGATING":        "text-yellow-400 border-yellow-700 bg-yellow-900/20",
    "ON HOLD":              "text-orange-400 border-orange-700 bg-orange-900/20",
    "ESCALATED":            "text-red-400 border-red-700 bg-red-900/20",
    "PENDING VERIFICATION": "text-blue-400 border-blue-700 bg-blue-900/20",
    "MONITORING":           "text-gray-400 border-gray-700 bg-gray-900/20",
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 font-mono">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Bot className="text-purple-400" size={26} />
            <h1 className="text-xl font-bold text-purple-400 tracking-widest uppercase">AI Case Copilot</h1>
            <span className="text-xs bg-purple-900/50 border border-purple-700 text-purple-300 px-2 py-0.5 rounded-full ml-2">
              CASE #{CASE_EVIDENCE.caseId}
            </span>
          </div>
          <p className="text-gray-400 text-sm ml-9">
            AI-assisted investigation using engine-generated evidence only — no facts are invented
          </p>
        </div>
        <div className={`border rounded-lg px-4 py-2 text-sm font-bold ${statusStyle[caseStatus]}`}>
          {caseStatus}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── LEFT: Evidence ── */}
        <div className="space-y-5">
          {/* Animated Risk Gauge */}
          <div className="bg-gray-900 border border-red-800/60 rounded-xl p-5">
            <p className="text-gray-400 text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
              <AlertTriangle size={12} className="text-red-400" /> Composite Risk
            </p>
            <RiskGauge score={CASE_EVIDENCE.riskScore} />
          </div>

          {/* Evidence */}
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
            <p className="text-gray-400 text-xs uppercase tracking-widest mb-4">
              Evidence ({CASE_EVIDENCE.evidence.length})
            </p>
            <div className="space-y-3">
              {CASE_EVIDENCE.evidence.map((e, i) => (
                <div key={i} className="flex items-start gap-3 bg-gray-800 rounded-lg px-3 py-3 border border-gray-700">
                  <span className="text-lg shrink-0">{e.icon}</span>
                  <div>
                    <p className="text-gray-200 text-xs font-semibold">{e.label}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{e.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Attack Chain */}
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
            <p className="text-gray-400 text-xs uppercase tracking-widest mb-4">Attack Chain</p>
            <div className="flex flex-wrap gap-2 items-center">
              {CASE_EVIDENCE.attackChain.map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs bg-red-900/40 text-red-300 border border-red-800 px-2 py-1 rounded-lg">{step}</span>
                  {i < CASE_EVIDENCE.attackChain.length - 1 && <ChevronRight size={12} className="text-gray-600" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── MIDDLE: AI Copilot ── */}
        <div className="space-y-5">
          <div className="bg-gray-900 border border-purple-800/50 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="text-purple-400" size={16} />
              <h2 className="text-purple-300 font-semibold text-sm uppercase tracking-widest">AI Copilot Actions</h2>
            </div>
            <p className="text-gray-500 text-xs mb-4">
              Generates from detection-engine evidence only — no external data used.
            </p>
            <div className="space-y-3">
              {[
                { label: "Generate Case Summary", key: "summary", icon: Bot, color: "purple", handler: handleGenerateSummary },
                { label: "Draft Suspicious Activity Report", key: "sar", icon: FileText, color: "blue", handler: handleGenerateSAR },
                { label: "Draft Customer Verification Message", key: "customer", icon: MessageSquare, color: "teal", handler: handleGenerateCustomerMsg },
              ].map(({ label, key, icon: Icon, color, handler }) => (
                <button
                  key={key}
                  onClick={handler}
                  disabled={generating === key}
                  className={`w-full flex items-center gap-3 bg-${color}-900/40 hover:bg-${color}-800/50 border border-${color}-800 rounded-lg px-4 py-3 text-${color}-200 text-sm font-semibold transition-all disabled:opacity-50`}
                >
                  <Icon size={16} className={`text-${color}-400`} />
                  {generating === key ? "Generating..." : label}
                </button>
              ))}
            </div>
          </div>

          {/* Outputs with Copy + Download */}
          {(summary || sar || customerMsg) && (
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 space-y-5">
              {summary && (
                <OutputCard
                  title="Case Summary"
                  color="#a855f7"
                  icon={Bot}
                  text={summary}
                  filename={`case-summary-${CASE_EVIDENCE.caseId}.txt`}
                />
              )}
              {sar && (
                <OutputCard
                  title="SAR Draft"
                  color="#60a5fa"
                  icon={FileText}
                  text={sar}
                  filename={`SAR-${CASE_EVIDENCE.caseId}.txt`}
                />
              )}
              {customerMsg && (
                <OutputCard
                  title="Customer Message"
                  color="#2dd4bf"
                  icon={MessageSquare}
                  text={customerMsg}
                  filename={`customer-message-${CASE_EVIDENCE.caseId}.txt`}
                />
              )}
            </div>
          )}
        </div>

        {/* ── RIGHT: Analyst + Audit ── */}
        <div className="space-y-5">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <User className="text-gray-400" size={16} />
              <h2 className="text-gray-300 font-semibold text-sm uppercase tracking-widest">Analyst Workspace</h2>
            </div>
            <div className="mb-4">
              <p className="text-gray-500 text-xs mb-2">Analyst Note</p>
              <textarea
                className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-gray-200 text-xs resize-none focus:outline-none focus:border-purple-500 transition-colors min-h-[80px] placeholder-gray-600"
                placeholder="Add investigation note..."
                value={analystNote}
                onChange={(e) => setAnalystNote(e.target.value)}
              />
              <button
                onClick={handleSaveNote}
                className="mt-2 text-xs text-purple-400 hover:text-purple-300 border border-purple-800 hover:border-purple-600 px-3 py-1.5 rounded-lg transition-all"
              >
                Save Note
              </button>
            </div>
            <p className="text-gray-500 text-xs mb-3">Take Action</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "MONITOR",       color: "border-gray-600 hover:border-gray-400 text-gray-300" },
                { label: "VERIFY",        color: "border-blue-700 hover:border-blue-500 text-blue-300" },
                { label: "HOLD",          color: "border-orange-700 hover:border-orange-500 text-orange-300" },
                { label: "ALERT & BLOCK", color: "border-red-700 hover:border-red-500 text-red-300" },
              ].map((action) => (
                <button
                  key={action.label}
                  onClick={() => handleAction(action.label)}
                  className={`border rounded-lg px-3 py-2.5 text-xs font-bold transition-all ${action.color} ${actionTaken === action.label ? "bg-gray-700" : ""}`}
                >
                  {actionTaken === action.label && <CheckCircle size={10} className="inline mr-1" />}
                  {action.label}
                </button>
              ))}
            </div>
            {actionTaken && (
              <div className="mt-3 text-xs text-green-400 flex items-center gap-2 bg-green-900/20 border border-green-800 rounded-lg px-3 py-2">
                <CheckCircle size={12} /> Action recorded: {actionTaken}
              </div>
            )}
          </div>

          {/* Audit Trail */}
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="text-gray-400" size={16} />
              <h2 className="text-gray-300 font-semibold text-sm uppercase tracking-widest">Investigation Audit Trail</h2>
            </div>
            <div className="space-y-0">
              {auditLog.map((entry, i) => (
                <div key={i} className="relative flex gap-3">
                  {i < auditLog.length - 1 && (
                    <div className="absolute left-[7px] top-4 bottom-0 w-px bg-gray-700" />
                  )}
                  <div className={`shrink-0 w-3.5 h-3.5 rounded-full mt-1 border-2 z-10 ${
                    entry.type === "system" ? "border-gray-500 bg-gray-700" :
                    entry.type === "action" ? "border-red-500 bg-red-900" :
                    entry.type === "note"   ? "border-purple-500 bg-purple-900" :
                    "border-cyan-500 bg-cyan-900"
                  }`} />
                  <div className="pb-4">
                    <p className="text-gray-500 text-xs">{entry.time}</p>
                    <p className={`text-xs mt-0.5 ${
                      entry.type === "action" ? "text-red-300" :
                      entry.type === "note"   ? "text-purple-300" :
                      entry.type === "system" ? "text-gray-400" :
                      "text-cyan-300"
                    }`}>{entry.event}</p>
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