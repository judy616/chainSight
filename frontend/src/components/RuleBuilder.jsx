import { useState, useEffect, useRef } from "react";
import {
  Wand2, TestTube2, CheckCircle, Play, RotateCcw, AlertTriangle,
  Shield, History, BarChart3, ChevronRight, TrendingUp, Clock, RefreshCcw
} from "lucide-react";

// ── Rule templates ──────────────────────────────────────────────────────────
const RULE_TEMPLATES = [
  {
    keywords: ["new beneficiar", "50000", "3 transfer", "10 min"],
    rule: {
      name: "Rapid High-Value New-Beneficiary Transfers",
      conditions: [
        { field: "Transaction Count", operator: ">", value: "3", window: "10 min" },
        { field: "Amount", operator: ">", value: "₹50,000" },
        { field: "Beneficiary Status", operator: "=", value: "NEW" },
      ],
      riskScore: 30,
      category: "AML / Mule Detection",
      mitre: "T1531 – Account Access Removal",
    },
  },
  {
    keywords: ["login", "password", "new device", "5 min"],
    rule: {
      name: "Account Takeover Sequence",
      conditions: [
        { field: "Login from New Device", operator: "=", value: "TRUE" },
        { field: "Password Changed", operator: "within", value: "5 min" },
        { field: "Beneficiary Added", operator: "within", value: "10 min" },
      ],
      riskScore: 40,
      category: "Account Takeover",
      mitre: "T1078 – Valid Accounts",
    },
  },
  {
    keywords: ["49000", "split", "cumulative", "24 hour"],
    rule: {
      name: "Structuring / Smurfing Detection",
      conditions: [
        { field: "Per-Transaction Amount", operator: "<", value: "₹50,000" },
        { field: "Cumulative Amount (24h)", operator: ">", value: "₹1,50,000" },
        { field: "Distinct Destinations", operator: ">", value: "3" },
      ],
      riskScore: 35,
      category: "Structuring",
      mitre: "T1036 – Masquerading",
    },
  },
];

const BACKTEST_RESULTS = [
  { txnId: "TXN-1024", amount: "₹75,000", beneficiary: "NEW", account: "ACC-1023", triggered: true },
  { txnId: "TXN-1054", amount: "₹88,500", beneficiary: "NEW", account: "ACC-2087", triggered: true },
  { txnId: "TXN-1088", amount: "₹1,02,000", beneficiary: "NEW", account: "ACC-3041", triggered: true },
  { txnId: "TXN-1132", amount: "₹65,000", beneficiary: "NEW", account: "ACC-1099", triggered: true },
  { txnId: "TXN-1145", amount: "₹12,000", beneficiary: "EXISTING", account: "ACC-5521", triggered: false },
  { txnId: "TXN-1190", amount: "₹8,500", beneficiary: "EXISTING", account: "ACC-2233", triggered: false },
  { txnId: "TXN-1201", amount: "₹92,000", beneficiary: "NEW", account: "ACC-7710", triggered: true },
];

const INITIAL_ACTIVE_RULES = [
  { id: 1, name: "Velocity Rule — 5 txn/hr", status: "ACTIVE", triggered: 48, confirmed: 12, risk: 20 },
  { id: 2, name: "High-Value Transfer > ₹1L", status: "ACTIVE", triggered: 35, confirmed: 19, risk: 25 },
  { id: 3, name: "Mule Fan-In Detection", status: "ACTIVE", triggered: 21, confirmed: 15, risk: 35 },
];

// ── Rule version history (simulated) ────────────────────────────────────────
const RULE_VERSION_HISTORY = {
  "High-Value Transfer > ₹1L": [
    { version: "v1", date: "2024-01-10", changes: ["Amount > ₹1,00,000"], status: "archived" },
    { version: "v2", date: "2024-02-14", changes: ["Amount > ₹75,000", "+ New beneficiary flag"], status: "archived" },
    { version: "v3", date: "2024-03-01", changes: ["Amount > ₹50,000", "+ New beneficiary", "+ 10-min window"], status: "current" },
  ],
  "Velocity Rule — 5 txn/hr": [
    { version: "v1", date: "2024-01-05", changes: ["Count > 10 / hr"], status: "archived" },
    { version: "v2", date: "2024-02-20", changes: ["Count > 5 / hr", "+ Geo check"], status: "current" },
  ],
  "Mule Fan-In Detection": [
    { version: "v1", date: "2024-01-20", changes: ["Fan-in > 3 accounts"], status: "archived" },
    { version: "v2", date: "2024-03-10", changes: ["Fan-in > 4 accounts", "+ Pass-through > 90%"], status: "current" },
  ],
};

function parseRule(text) {
  const lower = text.toLowerCase();
  for (const t of RULE_TEMPLATES) {
    if (t.keywords.filter((kw) => lower.includes(kw)).length >= 2) return t.rule;
  }
  return {
    name: "Custom Fraud Rule",
    conditions: [{ field: "Custom Condition", operator: "=", value: "Detected" }],
    riskScore: 20,
    category: "Custom",
    mitre: "T1078 – Valid Accounts",
  };
}

// ── Animated bar for performance chart ─────────────────────────────────────
function AnimatedBar({ value, max, color }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth((value / max) * 100), 100);
    return () => clearTimeout(t);
  }, [value, max]);
  return (
    <div className="h-2 bg-gray-700 rounded-full overflow-hidden w-full">
      <div
        className={`h-full rounded-full transition-all duration-700 ${color}`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

// ── TABS ────────────────────────────────────────────────────────────────────
const TABS = ["Rule Builder", "Performance", "Version History"];

export default function RuleBuilder() {
  const [activeTab, setActiveTab] = useState("Rule Builder");
  const [inputText, setInputText] = useState("");
  const [phase, setPhase] = useState("input");
  const [generatedRule, setGeneratedRule] = useState(null);
  const [activeRules, setActiveRules] = useState(INITIAL_ACTIVE_RULES);
  const [activationMsg, setActivationMsg] = useState("");
  const [selectedHistoryRule, setSelectedHistoryRule] = useState("High-Value Transfer > ₹1L");

  const EXAMPLE_PROMPTS = [
    "Flag when an account sends more than 3 transfers above ₹50,000 to new beneficiaries within 10 minutes.",
    "Alert if login occurs from a new device, password is changed within 5 minutes, and a new beneficiary is added.",
    "Detect structuring: multiple transfers just below ₹49,000 with a cumulative amount exceeding ₹1.5L in 24 hours.",
  ];

  const handleGenerate = () => {
    if (!inputText.trim()) return;
    setPhase("preview");
    setGeneratedRule(parseRule(inputText));
    setActivationMsg("");
  };

  const handleTest = () => {
    setPhase("testing");
    setTimeout(() => setPhase("tested"), 1800);
  };

  const handleActivate = () => {
    const newRule = {
      id: activeRules.length + 1,
      name: generatedRule.name,
      status: "ACTIVE",
      triggered: 0,
      confirmed: 0,
      risk: generatedRule.riskScore,
    };
    setActiveRules([...activeRules, newRule]);
    setActivationMsg(`✓ Rule "${generatedRule.name}" activated successfully.`);
    setPhase("activated");
  };

  const handleReset = () => {
    setInputText("");
    setPhase("input");
    setGeneratedRule(null);
    setActivationMsg("");
  };

  const triggeredCount = BACKTEST_RESULTS.filter((r) => r.triggered).length;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 font-mono">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="text-cyan-400" size={26} />
          <h1 className="text-xl font-bold text-cyan-400 tracking-widest uppercase">
            Natural-Language Rule Builder
          </h1>
        </div>
        {/* Tab switcher */}
        <div className="flex gap-1 bg-gray-800 border border-gray-700 rounded-xl p-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab
                  ? "bg-cyan-700 text-white"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              {tab === "Rule Builder" && <Wand2 size={12} className="inline mr-1" />}
              {tab === "Performance" && <BarChart3 size={12} className="inline mr-1" />}
              {tab === "Version History" && <History size={12} className="inline mr-1" />}
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* TAB 1 — RULE BUILDER                                      */}
      {/* ══════════════════════════════════════════════════════════ */}
      {activeTab === "Rule Builder" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT */}
          <div className="space-y-5">
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Wand2 className="text-cyan-400" size={16} />
                <h2 className="text-cyan-300 font-semibold text-sm uppercase tracking-widest">Describe Your Fraud Rule</h2>
              </div>
              <textarea
                className="w-full bg-gray-800 border border-gray-600 rounded-lg p-4 text-gray-100 text-sm resize-none focus:outline-none focus:border-cyan-500 transition-colors min-h-[130px] placeholder-gray-500"
                placeholder={`e.g. "Flag when an account sends more than 3 transfers above ₹50,000 to new beneficiaries within 10 minutes."`}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <div className="mt-3">
                <p className="text-gray-500 text-xs mb-2">Try an example:</p>
                <div className="space-y-2">
                  {EXAMPLE_PROMPTS.map((p, i) => (
                    <button
                      key={i}
                      className="text-left w-full text-xs text-cyan-600 hover:text-cyan-300 border border-gray-700 hover:border-cyan-700 rounded-lg px-3 py-2 transition-all bg-gray-800/50"
                      onClick={() => { setInputText(p); setPhase("input"); setGeneratedRule(null); }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleGenerate}
                  disabled={!inputText.trim()}
                  className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700 disabled:text-gray-500 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-all"
                >
                  <Wand2 size={14} /> Generate Rule
                </button>
                {phase !== "input" && (
                  <button onClick={handleReset} className="flex items-center gap-2 text-gray-400 hover:text-gray-200 px-4 py-2 rounded-lg border border-gray-700 hover:border-gray-500 text-sm transition-all">
                    <RotateCcw size={14} /> Reset
                  </button>
                )}
              </div>
            </div>

            {/* Active Rules */}
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="text-green-400" size={14} />
                <h2 className="text-green-300 font-semibold text-sm uppercase tracking-widest">Active Rules</h2>
                <span className="ml-auto bg-green-900/50 text-green-400 text-xs px-2 py-0.5 rounded-full border border-green-700">
                  {activeRules.length} LIVE
                </span>
              </div>
              <div className="space-y-2">
                {activeRules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3 border border-gray-700">
                    <div>
                      <p className="text-sm text-gray-200">{rule.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Triggered {rule.triggered}× this week</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-orange-400">+{rule.risk} pts</span>
                      <span className="text-xs bg-green-900/60 text-green-400 px-2 py-0.5 rounded-full border border-green-800">ACTIVE</span>
                    </div>
                  </div>
                ))}
              </div>
              {activationMsg && (
                <div className="mt-3 flex items-center gap-2 bg-green-900/30 border border-green-700 rounded-lg px-4 py-3 text-green-400 text-sm">
                  <CheckCircle size={14} /> {activationMsg}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-5">
            {phase === "input" && (
              <div className="bg-gray-900/50 border border-dashed border-gray-700 rounded-xl p-10 flex flex-col items-center justify-center text-center min-h-[300px]">
                <Wand2 className="text-gray-600 mb-4" size={40} />
                <p className="text-gray-500 text-sm">Describe a fraud rule and click <span className="text-cyan-400">Generate Rule</span></p>
              </div>
            )}

            {phase !== "input" && generatedRule && (
              <div className="bg-gray-900 border border-cyan-800/50 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="text-cyan-400" size={16} />
                  <h2 className="text-cyan-300 font-semibold text-sm uppercase tracking-widest">Generated Rule</h2>
                  <span className="ml-auto text-xs bg-cyan-900/40 text-cyan-400 border border-cyan-800 px-2 py-0.5 rounded-full">JSON CONFIG</span>
                </div>
                <div className="bg-gray-800 rounded-lg p-4 mb-4 border border-gray-700">
                  <p className="text-white font-semibold text-base mb-2">{generatedRule.name}</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs bg-blue-900/50 text-blue-300 border border-blue-800 px-2 py-0.5 rounded-full">{generatedRule.category}</span>
                    <span className="text-xs bg-purple-900/50 text-purple-300 border border-purple-800 px-2 py-0.5 rounded-full">{generatedRule.mitre}</span>
                  </div>
                </div>
                <p className="text-gray-400 text-xs uppercase tracking-widest mb-2">Conditions</p>
                <div className="space-y-2 mb-4">
                  {generatedRule.conditions.map((c, i) => (
                    <div key={i} className="flex items-center gap-3 bg-gray-800 rounded-lg px-4 py-3 border border-gray-700">
                      <span className="text-gray-400 text-xs w-4">{i + 1}.</span>
                      <span className="text-cyan-300 text-sm flex-1">{c.field}</span>
                      <span className="text-gray-500 text-xs">{c.operator}</span>
                      <span className="text-yellow-300 text-sm font-semibold">{c.value}</span>
                      {c.window && <span className="text-xs text-gray-500 bg-gray-700 px-2 py-0.5 rounded-full">{c.window}</span>}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3 border border-orange-800/50 mb-4">
                  <span className="text-gray-400 text-sm">Risk Score Contribution</span>
                  <span className="text-orange-400 font-bold text-lg">+{generatedRule.riskScore} pts</span>
                </div>
                <div className="flex gap-3">
                  {phase !== "activated" && (
                    <>
                      <button onClick={handleTest} disabled={phase === "testing"} className="flex items-center gap-2 bg-purple-700 hover:bg-purple-600 disabled:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all">
                        <TestTube2 size={14} /> {phase === "testing" ? "Testing..." : "Test Rule"}
                      </button>
                      <button onClick={handleActivate} className="flex items-center gap-2 bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all">
                        <Play size={14} /> Activate Rule
                      </button>
                    </>
                  )}
                  {phase === "activated" && (
                    <div className="flex items-center gap-2 text-green-400 text-sm font-semibold">
                      <CheckCircle size={16} /> Rule is now LIVE — visible in Active Rules
                    </div>
                  )}
                </div>
              </div>
            )}

            {phase === "testing" && (
              <div className="bg-gray-900 border border-purple-700/50 rounded-xl p-10 flex flex-col items-center justify-center text-center">
                <div className="animate-spin text-purple-400 mb-4"><TestTube2 size={36} /></div>
                <p className="text-purple-300 text-sm">Running backtest against 1,250 transactions...</p>
              </div>
            )}

            {(phase === "tested" || phase === "activated") && (
              <div className="bg-gray-900 border border-purple-800/50 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TestTube2 className="text-purple-400" size={16} />
                  <h2 className="text-purple-300 font-semibold text-sm uppercase tracking-widest">Backtest Results — Last 30 Days</h2>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="bg-gray-800 rounded-lg p-3 text-center border border-gray-700">
                    <p className="text-2xl font-bold text-white">1,250</p>
                    <p className="text-xs text-gray-400 mt-1">Analysed</p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3 text-center border border-red-900/50">
                    <p className="text-2xl font-bold text-red-400">{triggeredCount}</p>
                    <p className="text-xs text-gray-400 mt-1">Triggered</p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3 text-center border border-green-900/50">
                    <p className="text-2xl font-bold text-green-400">{1250 - triggeredCount}</p>
                    <p className="text-xs text-gray-400 mt-1">Not Triggered</p>
                  </div>
                </div>
                <div className="mb-5">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Detection Rate</span>
                    <span className="text-red-400 font-bold">{((triggeredCount / 1250) * 100).toFixed(2)}%</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-red-600 to-orange-500 rounded-full transition-all duration-1000" style={{ width: `${(triggeredCount / 1250) * 100}%` }} />
                  </div>
                </div>
                <p className="text-gray-400 text-xs uppercase tracking-widest mb-3">Matching Transactions</p>
                <div className="space-y-2">
                  {BACKTEST_RESULTS.filter((r) => r.triggered).map((r, i) => (
                    <div key={i} className="flex items-center gap-3 bg-gray-800 rounded-lg px-4 py-3 border border-gray-700">
                      <AlertTriangle className="text-red-400 shrink-0" size={14} />
                      <span className="text-cyan-400 text-sm font-mono">{r.txnId}</span>
                      <span className="text-yellow-300 text-sm">{r.amount}</span>
                      <span className="text-xs text-red-300 bg-red-900/30 border border-red-800 px-2 py-0.5 rounded-full ml-auto">{r.beneficiary}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* TAB 2 — PERFORMANCE DASHBOARD                             */}
      {/* ══════════════════════════════════════════════════════════ */}
      {activeTab === "Performance" && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total Rules Active", value: activeRules.length, color: "text-cyan-400", border: "border-cyan-900/50" },
              { label: "Alerts This Week", value: activeRules.reduce((s, r) => s + r.triggered, 0), color: "text-red-400", border: "border-red-900/50" },
              { label: "Confirmed Fraud", value: activeRules.reduce((s, r) => s + r.confirmed, 0), color: "text-orange-400", border: "border-orange-900/50" },
            ].map((stat, i) => (
              <div key={i} className={`bg-gray-900 border ${stat.border} rounded-xl p-5 text-center`}>
                <p className={`text-4xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-gray-400 text-xs mt-2">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="text-cyan-400" size={18} />
              <h2 className="text-cyan-300 font-semibold text-sm uppercase tracking-widest">Rule Performance Dashboard</h2>
            </div>
            <div className="space-y-6">
              {activeRules.map((rule) => {
                const maxTrig = Math.max(...activeRules.map((r) => r.triggered));
                const fpRate = rule.triggered > 0 ? (((rule.triggered - rule.confirmed) / rule.triggered) * 100).toFixed(0) : 0;
                return (
                  <div key={rule.id} className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-gray-100 font-semibold text-sm">{rule.name}</p>
                        <div className="flex gap-3 mt-1">
                          <span className="text-xs text-green-400 bg-green-900/30 border border-green-800 px-2 py-0.5 rounded-full">ACTIVE</span>
                          <span className="text-xs text-orange-400">+{rule.risk} pts risk</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-red-400 text-2xl font-bold">{rule.triggered}</p>
                        <p className="text-gray-500 text-xs">alerts</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center bg-gray-700/50 rounded-lg p-3">
                        <p className="text-lg font-bold text-red-400">{rule.triggered}</p>
                        <p className="text-xs text-gray-400">Triggered</p>
                      </div>
                      <div className="text-center bg-gray-700/50 rounded-lg p-3">
                        <p className="text-lg font-bold text-green-400">{rule.confirmed}</p>
                        <p className="text-xs text-gray-400">Confirmed Fraud</p>
                      </div>
                      <div className="text-center bg-gray-700/50 rounded-lg p-3">
                        <p className="text-lg font-bold text-yellow-400">{fpRate}%</p>
                        <p className="text-xs text-gray-400">False Positive Rate</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                          <span>Trigger volume</span>
                          <span>{rule.triggered} alerts</span>
                        </div>
                        <AnimatedBar value={rule.triggered} max={maxTrig} color="bg-gradient-to-r from-red-700 to-red-500" />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                          <span>Confirmed fraud</span>
                          <span>{rule.confirmed} cases</span>
                        </div>
                        <AnimatedBar value={rule.confirmed} max={maxTrig} color="bg-gradient-to-r from-green-700 to-green-500" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* TAB 3 — VERSION HISTORY                                   */}
      {/* ══════════════════════════════════════════════════════════ */}
      {activeTab === "Version History" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Rule selector */}
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <History className="text-cyan-400" size={16} />
              <h2 className="text-cyan-300 font-semibold text-sm uppercase tracking-widest">Select Rule</h2>
            </div>
            <div className="space-y-2">
              {Object.keys(RULE_VERSION_HISTORY).map((ruleName) => (
                <button
                  key={ruleName}
                  onClick={() => setSelectedHistoryRule(ruleName)}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm border transition-all ${
                    selectedHistoryRule === ruleName
                      ? "bg-cyan-900/40 border-cyan-700 text-cyan-300"
                      : "bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500"
                  }`}
                >
                  <p className="font-semibold text-xs">{ruleName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {RULE_VERSION_HISTORY[ruleName].length} versions
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Version timeline */}
          <div className="lg:col-span-2 bg-gray-900 border border-gray-700 rounded-xl p-5">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Clock className="text-gray-400" size={16} />
                <h2 className="text-gray-300 font-semibold text-sm uppercase tracking-widest">
                  {selectedHistoryRule} — Version History
                </h2>
              </div>
              <span className="text-xs text-gray-500">
                {RULE_VERSION_HISTORY[selectedHistoryRule].length} versions
              </span>
            </div>

            <div className="space-y-0">
              {[...RULE_VERSION_HISTORY[selectedHistoryRule]].reverse().map((v, i, arr) => (
                <div key={i} className="relative flex gap-5">
                  {/* Timeline */}
                  {i < arr.length - 1 && (
                    <div className="absolute left-[11px] top-5 bottom-0 w-0.5 bg-gray-700" />
                  )}
                  <div className={`shrink-0 w-6 h-6 rounded-full border-2 mt-1 flex items-center justify-center z-10 ${
                    v.status === "current"
                      ? "border-green-500 bg-green-900"
                      : "border-gray-600 bg-gray-800"
                  }`}>
                    {v.status === "current" && <div className="w-2 h-2 rounded-full bg-green-400" />}
                  </div>
                  <div className="pb-7 flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`text-sm font-bold ${v.status === "current" ? "text-green-400" : "text-gray-400"}`}>
                        {v.version}
                      </span>
                      <span className="text-xs text-gray-500">{v.date}</span>
                      {v.status === "current" && (
                        <span className="text-xs bg-green-900/60 text-green-400 border border-green-800 px-2 py-0.5 rounded-full">CURRENT</span>
                      )}
                      {v.status === "archived" && (
                        <span className="text-xs bg-gray-800 text-gray-500 border border-gray-700 px-2 py-0.5 rounded-full">ARCHIVED</span>
                      )}
                    </div>
                    <div className={`bg-gray-800 border rounded-lg p-4 ${v.status === "current" ? "border-green-800/50" : "border-gray-700"}`}>
                      <p className="text-gray-400 text-xs uppercase tracking-widest mb-2">Rule Conditions</p>
                      <div className="space-y-1.5">
                        {v.changes.map((change, ci) => (
                          <div key={ci} className="flex items-center gap-2">
                            <ChevronRight size={12} className={v.status === "current" ? "text-green-400" : "text-gray-600"} />
                            <span className={`text-xs ${v.status === "current" ? "text-gray-200" : "text-gray-500"}`}>{change}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {v.status === "archived" && (
                      <button className="mt-2 flex items-center gap-1.5 text-xs text-gray-500 hover:text-cyan-400 border border-gray-700 hover:border-cyan-700 px-3 py-1.5 rounded-lg transition-all">
                        <RefreshCcw size={11} /> Rollback to {v.version}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}