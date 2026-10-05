import { useState, useEffect } from "react";
import {
  Wand2,
  TestTube2,
  CheckCircle,
  Play,
  RotateCcw,
  AlertTriangle,
  Shield,
  History,
  BarChart3,
  ChevronRight,
  TrendingUp,
  Clock,
  RefreshCcw,
  Sliders,
  Check,
} from "lucide-react";

// ── Rule templates ──────────────────────────────────────────────────────────
const RULE_TEMPLATES = [
  {
    keywords: ["new beneficiar", "50000", "3 transfer", "10 min", "beneficiary"],
    rule: {
      name: "Rapid High-Value New-Beneficiary Transfers",
      conditions: [
        { field: "Transaction Count", operator: ">", value: "3", window: "10 min" },
        { field: "Amount", operator: ">", value: "$50,000" },
        { field: "Beneficiary Status", operator: "=", value: "NEW" },
      ],
      riskScore: 30,
      category: "AML / Mule Detection",
      mitre: "T1531 – Account Access Removal",
    },
  },
  {
    keywords: ["login", "password", "new device", "5 min", "tor"],
    rule: {
      name: "Account Takeover Sequence",
      conditions: [
        { field: "Login from New Device / Tor", operator: "=", value: "TRUE" },
        { field: "Password Changed", operator: "within", value: "5 min" },
        { field: "Beneficiary Added", operator: "within", value: "10 min" },
      ],
      riskScore: 40,
      category: "Account Takeover (ATO)",
      mitre: "T1078 – Valid Accounts",
    },
  },
  {
    keywords: ["49000", "split", "cumulative", "24 hour", "structuring", "smurfing"],
    rule: {
      name: "Structuring / Smurfing Detection",
      conditions: [
        { field: "Per-Transaction Amount", operator: "<", value: "$50,000" },
        { field: "Cumulative Amount (24h)", operator: ">", value: "$150,000" },
        { field: "Distinct Destinations", operator: ">", value: "3" },
      ],
      riskScore: 35,
      category: "Structuring & Smurfing",
      mitre: "T1036 – Masquerading",
    },
  },
];

const BACKTEST_RESULTS = [
  { txnId: "TXN-1024", amount: "$75,000", beneficiary: "NEW", account: "ACC-1023", triggered: true },
  { txnId: "TXN-1054", amount: "$88,500", beneficiary: "NEW", account: "ACC-2087", triggered: true },
  { txnId: "TXN-1088", amount: "$102,000", beneficiary: "NEW", account: "ACC-3041", triggered: true },
  { txnId: "TXN-1132", amount: "$65,000", beneficiary: "NEW", account: "ACC-1099", triggered: true },
  { txnId: "TXN-1145", amount: "$12,000", beneficiary: "EXISTING", account: "ACC-5521", triggered: false },
  { txnId: "TXN-1190", amount: "$8,500", beneficiary: "EXISTING", account: "ACC-2233", triggered: false },
  { txnId: "TXN-1201", amount: "$92,000", beneficiary: "NEW", account: "ACC-7710", triggered: true },
];

const INITIAL_ACTIVE_RULES = [
  { id: 1, name: "Velocity Rule — 5 txn/hr", status: "ACTIVE", triggered: 48, confirmed: 12, risk: 20 },
  { id: 2, name: "High-Value Outbound > $100K", status: "ACTIVE", triggered: 35, confirmed: 19, risk: 25 },
  { id: 3, name: "Mule Fan-In Aggregation", status: "ACTIVE", triggered: 21, confirmed: 15, risk: 35 },
];

const INITIAL_RULE_VERSION_HISTORY = {
  "High-Value Outbound > $100K": [
    { version: "v1", date: "2024-01-10", changes: ["Amount > $100,000"], status: "archived" },
    { version: "v2", date: "2024-02-14", changes: ["Amount > $75,000", "+ New beneficiary flag"], status: "archived" },
    { version: "v3", date: "2024-03-01", changes: ["Amount > $50,000", "+ New beneficiary", "+ 10-min window"], status: "current" },
  ],
  "Velocity Rule — 5 txn/hr": [
    { version: "v1", date: "2024-01-05", changes: ["Count > 10 / hr"], status: "archived" },
    { version: "v2", date: "2024-02-20", changes: ["Count > 5 / hr", "+ Geo check"], status: "current" },
  ],
  "Mule Fan-In Aggregation": [
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
    name: "Custom Heuristic Anomaly Rule",
    conditions: [
      { field: "Custom Risk Signal", operator: "=", value: "Detected" },
      { field: "Time Window", operator: "within", value: "15 min" },
    ],
    riskScore: 25,
    category: "Custom Intelligence",
    mitre: "T1078 – Valid Accounts",
  };
}

function AnimatedBar({ value, max, color }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(Math.min(100, (value / (max || 1)) * 100)), 100);
    return () => clearTimeout(t);
  }, [value, max]);
  return (
    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden w-full">
      <div
        className={`h-full rounded-full transition-all duration-700 ${color}`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

const TABS = ["Rule Builder", "Performance", "Version History"];

export default function RuleBuilder() {
  const [activeTab, setActiveTab] = useState("Rule Builder");
  const [inputText, setInputText] = useState("");
  const [phase, setPhase] = useState("input");
  const [generatedRule, setGeneratedRule] = useState(null);
  const [activeRules, setActiveRules] = useState(INITIAL_ACTIVE_RULES);
  const [activationMsg, setActivationMsg] = useState("");
  const [versionHistory, setVersionHistory] = useState(INITIAL_RULE_VERSION_HISTORY);
  const [selectedHistoryRule, setSelectedHistoryRule] = useState("High-Value Outbound > $100K");
  const [rollbackToast, setRollbackToast] = useState("");

  const EXAMPLE_PROMPTS = [
    "Flag when an account sends more than 3 transfers above $50,000 to new beneficiaries within 10 minutes.",
    "Alert if login occurs from a new device, password is changed within 5 minutes, and a new beneficiary is added.",
    "Detect structuring: multiple transfers just below $49,000 with a cumulative amount exceeding $150K in 24 hours.",
  ];

  const handleGenerate = () => {
    if (!inputText.trim()) return;
    setPhase("preview");
    setGeneratedRule(parseRule(inputText));
    setActivationMsg("");
  };

  const handleTest = () => {
    setPhase("testing");
    setTimeout(() => setPhase("tested"), 1400);
  };

  const handleActivate = () => {
    if (!generatedRule) return;
    const newRule = {
      id: activeRules.length + 1,
      name: generatedRule.name,
      status: "ACTIVE",
      triggered: 5,
      confirmed: 5,
      risk: generatedRule.riskScore,
    };
    setActiveRules([newRule, ...activeRules]);
    setActivationMsg(`✓ Rule "${generatedRule.name}" has been published to live engine.`);
    setPhase("activated");
  };

  const handleReset = () => {
    setInputText("");
    setPhase("input");
    setGeneratedRule(null);
    setActivationMsg("");
  };

  const handleRollback = (ruleName, targetVersion) => {
    setVersionHistory((prev) => {
      const versions = prev[ruleName] || [];
      const updated = versions.map((v) => ({
        ...v,
        status: v.version === targetVersion ? "current" : "archived",
      }));
      return { ...prev, [ruleName]: updated };
    });
    setRollbackToast(`✓ Successfully rolled back ${ruleName} to ${targetVersion}`);
    setTimeout(() => setRollbackToast(""), 3500);
  };

  const triggeredCount = BACKTEST_RESULTS.filter((r) => r.triggered).length;

  return (
    <div className="min-h-screen bg-[#060608] text-zinc-100 p-4 sm:p-6 lg:p-8 font-mono selection:bg-amber-400 selection:text-black">
      {/* ── Top Header & Tab Navigation ── */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Shield size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold uppercase tracking-wider text-white">
                Natural-Language Rule Builder
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 font-semibold">
                POLICY STUDIO
              </span>
            </div>
            <p className="text-zinc-500 text-xs">
              Translate plain-English compliance rules into enforceable AST graph predicates & scoring weights
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.02] p-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab
                  ? "bg-zinc-800 text-white border border-amber-500/50 shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              {tab === "Rule Builder" && <Wand2 size={13} className="inline mr-1.5 text-amber-400" />}
              {tab === "Performance" && <BarChart3 size={13} className="inline mr-1.5 text-amber-400" />}
              {tab === "Version History" && <History size={13} className="inline mr-1.5 text-amber-400" />}
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          TAB 1: RULE BUILDER & TESTING
          ══════════════════════════════════════════════════════════ */}
      {activeTab === "Rule Builder" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT: Input & Active Rules */}
          <div className="space-y-5">
            <div className="rounded-2xl border border-white/10 bg-[#0c0c10] p-5 shadow-xl shadow-black/40">
              <div className="flex items-center gap-2 mb-3">
                <Wand2 className="text-amber-400" size={16} />
                <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Describe Policy or Threat Pattern
                </h2>
              </div>
              <textarea
                className="w-full rounded-xl border border-white/10 bg-[#07070a] p-3 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 transition-colors min-h-[110px] resize-none"
                placeholder={`e.g. "Flag when an account sends more than 3 transfers above $50,000 to new beneficiaries within 10 minutes."`}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />

              <div className="mt-3">
                <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-2">Or select a pre-calibrated scenario:</p>
                <div className="space-y-1.5">
                  {EXAMPLE_PROMPTS.map((p, i) => (
                    <button
                      key={i}
                      className="text-left w-full text-xs text-zinc-400 hover:text-amber-300 border border-white/[0.06] hover:border-amber-500/30 rounded-lg p-2.5 transition-all bg-white/[0.01] hover:bg-white/[0.04]"
                      onClick={() => {
                        setInputText(p);
                        setPhase("input");
                        setGeneratedRule(null);
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2.5 mt-4">
                <button
                  onClick={handleGenerate}
                  disabled={!inputText.trim()}
                  className="flex items-center gap-2 bg-gradient-to-r from-[#fbb034] via-[#f59e0b] to-[#d97706] text-black px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40 hover:brightness-110 active:scale-95 shadow-[0_0_15px_rgba(245,158,11,0.25)]"
                >
                  <Wand2 size={13} /> Generate Rule
                </button>
                {phase !== "input" && (
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-2 text-zinc-400 hover:text-white px-3 py-2 rounded-xl border border-white/10 hover:border-white/20 text-xs transition-all bg-white/[0.02]"
                  >
                    <RotateCcw size={13} /> Reset
                  </button>
                )}
              </div>
            </div>

            {/* Active Rules List */}
            <div className="rounded-2xl border border-white/10 bg-[#0c0c10] p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Shield className="text-emerald-400" size={15} />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                    Live Active Rules
                  </h2>
                </div>
                <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                  {activeRules.length} DEPLOYED
                </span>
              </div>

              <div className="space-y-2">
                {activeRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-xs"
                  >
                    <div>
                      <p className="font-semibold text-zinc-200 text-xs">{rule.name}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5 font-mono">
                        Triggered {rule.triggered}× this week • {rule.confirmed} confirmed fraud
                      </p>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-[11px] font-bold text-amber-400 font-mono">
                        +{rule.risk} pts
                      </span>
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 font-semibold font-mono">
                        ACTIVE
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {activationMsg && (
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                  <CheckCircle size={14} />
                  <span>{activationMsg}</span>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Generated Rule Preview & Backtest */}
          <div className="space-y-5">
            {phase === "input" && (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.01] p-10 flex flex-col items-center justify-center text-center min-h-[340px]">
                <Wand2 className="text-zinc-600 mb-3" size={36} />
                <p className="text-zinc-400 text-xs">
                  Enter a fraud rule description and click{" "}
                  <span className="text-amber-400 font-semibold">Generate Rule</span>
                </p>
                <p className="text-zinc-600 text-[10px] mt-1">
                  The engine will synthesize JSON predicates, MITRE classification, and risk weight.
                </p>
              </div>
            )}

            {phase !== "input" && generatedRule && (
              <div className="rounded-2xl border border-amber-500/30 bg-[#0c0c10] p-5 shadow-xl shadow-black/40">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="text-amber-400" size={15} />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                      Rule Specification Preview
                    </h2>
                  </div>
                  <span className="text-[9px] font-mono bg-white/[0.04] text-zinc-400 border border-white/10 px-2 py-0.5 rounded-full">
                    SYNTHESIZED PREDICATE
                  </span>
                </div>

                <div className="rounded-xl border border-white/10 bg-[#07070a] p-3.5 mb-4">
                  <p className="text-sm font-bold text-white mb-2">{generatedRule.name}</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono">
                      {generatedRule.category}
                    </span>
                    <span className="text-[10px] bg-sky-500/10 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded-full font-mono">
                      {generatedRule.mitre}
                    </span>
                  </div>
                </div>

                <p className="text-zinc-400 text-[10px] uppercase tracking-wider mb-2 font-mono">
                  Engine Evaluation Conditions
                </p>
                <div className="space-y-1.5 mb-4">
                  {generatedRule.conditions.map((c, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs"
                    >
                      <span className="text-zinc-500 text-[10px] w-4 font-mono">{i + 1}.</span>
                      <span className="text-zinc-200 text-xs flex-1">{c.field}</span>
                      <span className="text-zinc-500 text-[11px] font-mono">{c.operator}</span>
                      <span className="text-amber-300 text-xs font-semibold font-mono">{c.value}</span>
                      {c.window && (
                        <span className="text-[10px] text-zinc-400 bg-white/[0.05] px-2 py-0.5 rounded-full font-mono">
                          {c.window}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 mb-4">
                  <span className="text-xs text-zinc-400 font-mono">Risk Contribution</span>
                  <span className="text-base font-bold text-amber-400 font-mono">
                    +{generatedRule.riskScore} pts
                  </span>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {phase !== "activated" && (
                    <>
                      <button
                        onClick={handleTest}
                        disabled={phase === "testing"}
                        className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white px-3.5 py-2 text-xs font-semibold transition-all disabled:opacity-50"
                      >
                        <TestTube2 size={13} className="text-amber-400" />
                        {phase === "testing" ? "Backtesting..." : "Backtest Against 1,250 Txs"}
                      </button>
                      <button
                        onClick={handleActivate}
                        className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#fbb034] via-[#f59e0b] to-[#d97706] text-black px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all hover:brightness-110 active:scale-95 shadow-[0_0_15px_rgba(245,158,11,0.25)]"
                      >
                        <Play size={13} /> Activate Rule
                      </button>
                    </>
                  )}
                  {phase === "activated" && (
                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold font-mono">
                      <CheckCircle size={15} /> Rule is now LIVE in the detection engine
                    </div>
                  )}
                </div>
              </div>
            )}

            {phase === "testing" && (
              <div className="rounded-2xl border border-amber-500/30 bg-[#0c0c10] p-10 flex flex-col items-center justify-center text-center">
                <div className="animate-spin text-amber-400 mb-3">
                  <TestTube2 size={32} />
                </div>
                <p className="text-zinc-200 text-xs font-mono">Running backtest against 1,250 historical transactions...</p>
                <p className="text-zinc-500 text-[10px] mt-1 font-mono">Evaluating precision, recall, and false-positive footprint</p>
              </div>
            )}

            {(phase === "tested" || phase === "activated") && (
              <div className="rounded-2xl border border-white/10 bg-[#0c0c10] p-5 shadow-xl shadow-black/40">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <TestTube2 className="text-amber-400" size={15} />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                      Backtest Telemetry — 30-Day Window
                    </h2>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono font-semibold">
                    100% PRECISION
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2.5 mb-4">
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-center">
                    <p className="text-xl font-bold text-white font-mono">1,250</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Transactions</p>
                  </div>
                  <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-center">
                    <p className="text-xl font-bold text-red-400 font-mono">{triggeredCount}</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Triggered</p>
                  </div>
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-center">
                    <p className="text-xl font-bold text-emerald-400 font-mono">{1250 - triggeredCount}</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Clean / Passed</p>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-[11px] text-zinc-400 mb-1 font-mono">
                    <span>Detection Hit Rate</span>
                    <span className="text-amber-400 font-bold">
                      {((triggeredCount / 1250) * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full transition-all duration-1000"
                      style={{ width: `${(triggeredCount / 1250) * 100}%` }}
                    />
                  </div>
                </div>

                <p className="text-zinc-400 text-[10px] uppercase tracking-wider mb-2 font-mono">
                  Matched Threat Incidents ({triggeredCount})
                </p>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {BACKTEST_RESULTS.filter((r) => r.triggered).map((r, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5 text-xs"
                    >
                      <AlertTriangle className="text-red-400 shrink-0" size={13} />
                      <span className="text-zinc-200 font-mono text-xs">{r.txnId}</span>
                      <span className="text-amber-400 font-mono font-semibold">{r.amount}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">{r.account}</span>
                      <span className="text-[9px] text-red-300 bg-red-500/10 border border-red-500/30 px-2 py-0.5 rounded-full ml-auto font-mono">
                        {r.beneficiary} PAYEE
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB 2: PERFORMANCE METRICS DASHBOARD
          ══════════════════════════════════════════════════════════ */}
      {activeTab === "Performance" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Active Production Rules", value: activeRules.length, sub: "0 syntax conflicts", color: "text-amber-400" },
              { label: "Incidents Intercepted", value: activeRules.reduce((s, r) => s + r.triggered, 0), sub: "Last 7 days", color: "text-red-400" },
              { label: "Confirmed Fraud Saved", value: `$${(activeRules.reduce((s, r) => s + r.confirmed, 0) * 4250).toLocaleString()}`, sub: "46 confirmed cases", color: "text-emerald-400" },
            ].map((stat, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-[#0c0c10] p-5 text-center shadow-xl shadow-black/40">
                <p className={`text-3xl font-bold font-mono ${stat.color}`}>{stat.value}</p>
                <p className="text-zinc-300 text-xs mt-1.5 font-semibold">{stat.label}</p>
                <p className="text-zinc-500 text-[10px] mt-0.5 font-mono">{stat.sub}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0c0c10] p-6 shadow-xl shadow-black/40">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="text-amber-400" size={17} />
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Enforcement Volume & Precision Distribution
              </h2>
            </div>

            <div className="space-y-4">
              {activeRules.map((rule) => {
                const maxTrig = Math.max(...activeRules.map((r) => r.triggered), 1);
                const fpRate =
                  rule.triggered > 0
                    ? (((rule.triggered - rule.confirmed) / rule.triggered) * 100).toFixed(0)
                    : 0;

                return (
                  <div key={rule.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-zinc-100 font-semibold text-xs">{rule.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                            ACTIVE
                          </span>
                          <span className="text-[10px] text-amber-400 font-mono">
                            +{rule.risk} pts severity weight
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-red-400 font-mono">{rule.triggered}</p>
                        <p className="text-zinc-500 text-[10px] font-mono">alerts fired</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5 mb-3 text-center">
                      <div className="rounded-lg bg-black/30 p-2 border border-white/[0.04]">
                        <p className="text-sm font-bold text-red-400 font-mono">{rule.triggered}</p>
                        <p className="text-[10px] text-zinc-500">Triggered</p>
                      </div>
                      <div className="rounded-lg bg-black/30 p-2 border border-white/[0.04]">
                        <p className="text-sm font-bold text-emerald-400 font-mono">{rule.confirmed}</p>
                        <p className="text-[10px] text-zinc-500">Confirmed Fraud</p>
                      </div>
                      <div className="rounded-lg bg-black/30 p-2 border border-white/[0.04]">
                        <p className="text-sm font-bold text-zinc-300 font-mono">{fpRate}%</p>
                        <p className="text-[10px] text-zinc-500">False Positive</p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div>
                        <div className="flex justify-between text-[10px] text-zinc-400 mb-1 font-mono">
                          <span>Weekly alert volume</span>
                          <span>{rule.triggered} events</span>
                        </div>
                        <AnimatedBar
                          value={rule.triggered}
                          max={maxTrig}
                          color="bg-gradient-to-r from-red-600 to-amber-500"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB 3: VERSION HISTORY & ROLLBACK
          ══════════════════════════════════════════════════════════ */}
      {activeTab === "Version History" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Rule selector */}
          <div className="rounded-2xl border border-white/10 bg-[#0c0c10] p-5 shadow-xl shadow-black/40">
            <div className="flex items-center gap-2 mb-4">
              <History className="text-amber-400" size={16} />
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Managed Rules
              </h2>
            </div>

            <div className="space-y-2">
              {Object.keys(versionHistory).map((ruleName) => (
                <button
                  key={ruleName}
                  onClick={() => setSelectedHistoryRule(ruleName)}
                  className={`w-full text-left p-3 rounded-xl border text-xs transition-all ${
                    selectedHistoryRule === ruleName
                      ? "bg-amber-500/10 border-amber-500/40 text-amber-300 shadow-sm"
                      : "bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  <p className="font-semibold text-xs truncate">{ruleName}</p>
                  <p className="text-[10px] text-zinc-500 mt-1 font-mono">
                    {versionHistory[ruleName].length} recorded versions
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Version timeline */}
          <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-[#0c0c10] p-5 shadow-xl shadow-black/40">
            <div className="flex items-center justify-between mb-4 border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <Clock className="text-zinc-400" size={15} />
                <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                  {selectedHistoryRule}
                </h2>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">
                {versionHistory[selectedHistoryRule]?.length || 0} iterations
              </span>
            </div>

            {rollbackToast && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                <Check size={14} />
                <span>{rollbackToast}</span>
              </div>
            )}

            <div className="space-y-0">
              {[...(versionHistory[selectedHistoryRule] || [])].reverse().map((v, i, arr) => (
                <div key={i} className="relative flex gap-4 pb-6">
                  {i < arr.length - 1 && (
                    <div className="absolute left-[9px] top-4 bottom-0 w-px bg-white/10" />
                  )}
                  <div
                    className={`shrink-0 w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center z-10 ${
                      v.status === "current"
                        ? "border-emerald-500 bg-emerald-950"
                        : "border-zinc-600 bg-zinc-800"
                    }`}
                  >
                    {v.status === "current" && (
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    )}
                  </div>
                  <div className="flex-1 text-xs">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`text-xs font-bold font-mono ${
                          v.status === "current" ? "text-emerald-400" : "text-zinc-400"
                        }`}
                      >
                        {v.version}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">{v.date}</span>
                      {v.status === "current" ? (
                        <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono font-semibold">
                          CURRENT PRODUCTION
                        </span>
                      ) : (
                        <span className="text-[9px] bg-white/[0.04] text-zinc-500 border border-white/10 px-2 py-0.5 rounded-full font-mono">
                          ARCHIVED
                        </span>
                      )}
                    </div>

                    <div
                      className={`rounded-xl border p-3.5 ${
                        v.status === "current"
                          ? "border-emerald-500/30 bg-emerald-500/5"
                          : "border-white/[0.06] bg-white/[0.02]"
                      }`}
                    >
                      <p className="text-zinc-400 text-[10px] uppercase tracking-wider mb-2 font-mono">
                        Rule Modifications
                      </p>
                      <div className="space-y-1">
                        {v.changes.map((change, ci) => (
                          <div key={ci} className="flex items-center gap-2 text-xs">
                            <ChevronRight
                              size={12}
                              className={
                                v.status === "current" ? "text-emerald-400" : "text-zinc-600"
                              }
                            />
                            <span
                              className={`text-xs ${
                                v.status === "current" ? "text-zinc-200" : "text-zinc-500"
                              }`}
                            >
                              {change}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {v.status === "archived" && (
                      <button
                        onClick={() => handleRollback(selectedHistoryRule, v.version)}
                        className="mt-2.5 flex items-center gap-1.5 text-xs text-zinc-400 hover:text-amber-400 border border-white/10 hover:border-amber-500/40 px-3 py-1.5 rounded-lg transition-all bg-white/[0.02] font-mono"
                      >
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
