import React, { useEffect, useState, useRef } from "react";
import axios from "../api/axios";
import Navbar from "../components/Navbar";
import ScenarioBar from "../components/ScenarioBar";
import HeroCenterpiece from "../components/HeroCenterpiece";
import AttackChainTimeline from "../components/AttackChainTimeline";
import DestinationGraph from "../components/DestinationGraph";
import BaselineComparison from "../components/BaselineComparison";
import ExplainableAlertDrawer from "../components/ExplainableAlertDrawer";
import StepSimulator from "../components/StepSimulator";
import {
  ArrowDown,
  ArrowRight,
  Shield,
  Activity,
  GitFork,
  DollarSign,
  Clock,
  Lock,
  Smartphone,
  CheckCircle,
  FileText,
  ChevronRight,
  X,
  Bot,
} from "lucide-react";

export default function Dashboard({
  hideNavbar = false,
  activeScenario: controlledScenario,
  onSelectScenario: controlledSelectScenario,
  activeAlert: controlledActiveAlert,
  alertDetail: controlledAlertDetail,
  alerts: controlledAlerts,
  onExecuteAction: controlledExecuteAction,
  onOpenCopilot,
  onNavigateTab,
  activeTab: controlledActiveTab,
}) {
  const [internalActiveTab, setInternalActiveTab] = useState("overview");
  const activeTab = controlledActiveTab || internalActiveTab;

  const [kpis, setKpis] = useState({
    totalMonitoredAccounts: 4,
    activeAtoIncidents: 3,
    criticalThreats: 3,
    preventedFraudVolume: 53500,
    flaggedMuleAccounts: 3,
  });

  const [internalAlerts, setInternalAlerts] = useState([]);
  const alerts = controlledAlerts && controlledAlerts.length > 0 ? controlledAlerts : internalAlerts;

  const [selectedAlertId, setSelectedAlertId] = useState(null);
  const [internalAlertDetail, setInternalAlertDetail] = useState(null);
  const alertDetail = controlledAlertDetail || internalAlertDetail;

  const [internalScenario, setInternalScenario] = useState("ATO_HEIST");
  const activeScenario = controlledScenario || internalScenario;

  const [isReseeding, setIsReseeding] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showLiveMonitorModal, setShowLiveMonitorModal] = useState(false);

  // Load dashboard data from backend
  const loadDashboardData = async () => {
    try {
      const res = await axios.get("/fraud/dashboard-summary");
      if (res.data && res.data.success) {
        setKpis(res.data.kpis);
        setInternalAlerts(res.data.alerts);
        if (res.data.alerts.length > 0 && !selectedAlertId) {
          const firstId = res.data.alerts[0].alertId;
          setSelectedAlertId(firstId);
          loadAlertDetail(firstId);
        }
      }
    } catch (err) {
      console.error("Failed to load dashboard summary:", err);
    }
  };

  const loadAlertDetail = async (alertId) => {
    try {
      const res = await axios.get(`/fraud/alerts/${alertId}`);
      if (res.data && res.data.success) {
        setInternalAlertDetail(res.data);
      }
    } catch (err) {
      console.error("Failed to load alert detail:", err);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleSelectScenario = (scenarioId) => {
    setInternalScenario(scenarioId);
    if (controlledSelectScenario) {
      controlledSelectScenario(scenarioId);
      return;
    }

    let targetAlertId = null;
    if (scenarioId === "ATO_HEIST") targetAlertId = "ALT-2026-001";
    else if (scenarioId === "MULE_RING") targetAlertId = "ALT-2026-002";
    else if (scenarioId === "CIRCULAR_LOOP") targetAlertId = "ALT-2026-003";
    else if (scenarioId === "NORMAL_USER") {
      setInternalAlertDetail({
        alert: {
          alertId: "NOMINAL-004",
          userId: "USR-1001",
          userName: "David Miller",
          sourceAccount: "ACC-100123",
          targetTransactionId: "TX-1001-11",
          targetAmount: 115.5,
          destAccount: "ACC-METER-88",
          destAccountName: "Denver Water & Utility",
          compositeRiskScore: 12,
          severity: "LOW",
          recommendedAction: "MONITOR",
          status: "RESOLVED_BENIGN",
          attackChain: {
            sequenceDetected: false,
            timeWindowMinutes: 12,
            events: [
              {
                eventId: "EV-1001-01",
                eventType: "LOGIN",
                label: "Authorized Mobile Login",
                device: "iPhone 14 (iOS 17.2)",
                location: "Denver, CO, US",
                ip: "192.0.2.100",
                deltaMinutes: 0,
                riskDelta: 0,
                runningScore: 5,
                status: "NORMAL",
              },
              {
                eventId: "EV-1001-TX",
                eventType: "TRANSFER_ATTEMPT",
                label: "Utility Bill Payment ($115.50)",
                device: "iPhone 14 (iOS 17.2)",
                location: "Denver, CO, US",
                ip: "192.0.2.100",
                deltaMinutes: 7,
                riskDelta: 7,
                runningScore: 12,
                status: "NORMAL",
              },
            ],
          },
          graphSignals: {
            pattern: "NONE",
            inDegree: 1,
            outDegree: 0,
            rapidPassThroughDetected: false,
            cycleDetected: false,
            destRiskScore: 0,
            details: "Verified utility merchant. Clean peer-to-merchant history.",
          },
          baselineDeviation: {
            amountRatio: 1.2,
            isUnusualHour: false,
            isNewDevice: false,
            isNewBeneficiary: false,
            typicalAmount: 95,
          },
          explanations: [
            "Session initiated from customer's known iPhone 14 at habitual home coordinates.",
            "Transfer amount ($115.50) is closely aligned with 30-day baseline average ($95.00).",
            "Target beneficiary is an established, registered utility merchant.",
          ],
        },
        user: {
          name: "David Miller",
          userId: "USR-1001",
          accountNumber: "ACC-100123",
          baseline: {
            avgTransferAmount: 95,
            knownDevices: ["iPhone 14 (iOS 17.2 / Mobile Banking)"],
          },
        },
        transaction: {
          txId: "TX-1001-11",
          amount: 115.5,
          destAccountName: "Denver Water & Utility",
          timestamp: new Date(),
        },
      });
      setSelectedAlertId("NOMINAL-004");
      return;
    }

    if (targetAlertId) {
      setSelectedAlertId(targetAlertId);
      loadAlertDetail(targetAlertId);
    }
  };

  const handleExecuteAction = async (alertId, action, note) => {
    if (controlledExecuteAction) {
      return controlledExecuteAction(alertId, action, note);
    }
    try {
      const res = await axios.post(`/fraud/alerts/${alertId}/action`, {
        action,
        note,
        author: "Lead Fraud Investigator",
      });
      if (res.data && res.data.success) {
        await loadDashboardData();
        await loadAlertDetail(alertId);
      }
    } catch (err) {
      console.error("Failed to execute analyst action:", err);
    }
  };

  const handleReseed = async () => {
    setIsReseeding(true);
    try {
      await axios.post("/fraud/reseed");
      await loadDashboardData();
      if (selectedAlertId) await loadAlertDetail(selectedAlertId);
    } catch (err) {
      console.error("Reseed failed:", err);
    } finally {
      setIsReseeding(false);
    }
  };

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleNavigate = (tabId) => {
    if (onNavigateTab) {
      onNavigateTab(tabId);
      return;
    }
    setInternalActiveTab(tabId);
    if (tabId === "overview") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (tabId === "chains") {
      scrollTo("section-chains");
    } else if (tabId === "graph") {
      scrollTo("section-graph");
    } else if (tabId === "monitor") {
      setShowLiveMonitorModal(true);
    } else if (tabId === "investigate") {
      scrollTo("section-investigate");
    } else if (tabId === "copilot" && onOpenCopilot) {
      onOpenCopilot();
    }
  };

  const activeAlert =
    controlledActiveAlert ||
    alertDetail?.alert ||
    alerts.find((a) => a.alertId === selectedAlertId) ||
    alerts[0];

  return (
    <div className="min-h-screen bg-[#060608] text-zinc-100 selection:bg-amber-400 selection:text-black">
      {/* Top Navbar (only rendered if not controlled by parent App shell) */}
      {!hideNavbar && (
        <Navbar
          activeTab={activeTab}
          onNavigate={handleNavigate}
          onReseed={handleReseed}
          isReseeding={isReseeding}
          onOpenDossier={() => (onOpenCopilot ? onOpenCopilot() : scrollTo("section-investigate"))}
        />
      )}

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-10 space-y-24">
        {/* ========================================================
            HERO SECTION (ABOVE THE FOLD)
            ======================================================== */}
        <section className="space-y-10 pt-2 lg:pt-6">
          {/* Scenario Selector Bar */}
          <div className="flex justify-center">
            <ScenarioBar
              activeScenario={activeScenario}
              onSelectScenario={handleSelectScenario}
            />
          </div>

          {/* Hero Typography with Editorial Contrast */}
          <div className="text-center max-w-4xl mx-auto space-y-5">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-light tracking-tight text-white leading-[1.08]">
              See the attack <span className="font-editorial italic font-normal text-amber-200">before</span> the transaction.
            </h1>
            <p className="text-base sm:text-lg text-zinc-400 font-normal leading-relaxed max-w-2xl mx-auto">
              Real-time correlation across behavioral deviations, temporal attack chains, and destination mule topologies.
            </p>

            {/* Kenesis-inspired hero action buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
              <button
                onClick={() => (onOpenCopilot ? onOpenCopilot() : scrollTo("section-investigate"))}
                className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[#fbb034] via-[#f59e0b] to-[#d97706] px-6 py-3 text-xs font-bold uppercase tracking-wider text-black shadow-[0_0_25px_rgba(245,158,11,0.25)] hover:shadow-[0_0_35px_rgba(245,158,11,0.4)] hover:brightness-105 active:scale-95 transition-all"
              >
                <Bot className="h-4 w-4" />
                <span>OPEN AI COPILOT DOSSIER</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                onClick={() => setShowLiveMonitorModal(true)}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-6 py-3 text-xs font-mono font-medium text-zinc-300 hover:bg-white/[0.08] hover:text-white active:scale-95 transition-all backdrop-blur-sm"
              >
                <span>LIVE ATTACK SIMULATOR</span>
                <Activity className="h-3.5 w-3.5 text-amber-400" />
              </button>
            </div>
          </div>

          {/* Core Visual: Animated 4-Stage Attack Progression */}
          <div className="pt-4">
            <HeroCenterpiece
              alert={activeAlert}
              scenario={activeScenario}
              onExploreDossier={() => (onOpenCopilot ? onOpenCopilot() : scrollTo("section-investigate"))}
            />
          </div>
        </section>

        {/* Section 1: Detailed Sliding-Window Attack Chain Timeline */}
        <section id="section-chains" className="space-y-6 pt-12 border-t border-white/[0.05]">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1">
              <span className="font-mono text-xs uppercase tracking-widest text-amber-400">
                01 / Correlation Engine
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-white">
                Sliding 60-Minute Attack Chain
              </h2>
              <p className="text-sm text-zinc-400">
                Temporal sequence analysis correlating low-risk authentication signals into high-confidence attack events.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-zinc-500">
                Window: <span className="text-zinc-200">60 mins</span>
              </span>
              <span className="h-1 w-1 rounded-full bg-zinc-600" />
              <span className="font-mono text-xs text-zinc-500">
                Status: <span className="text-amber-400 font-semibold">{activeAlert?.attackChain?.sequenceDetected ? "CHAIN DETECTED" : "NORMAL"}</span>
              </span>
            </div>
          </div>

          <AttackChainTimeline
            attackChain={activeAlert?.attackChain}
            compositeRiskScore={activeAlert?.compositeRiskScore}
            severity={activeAlert?.severity}
            onOpenDrawer={() => setDrawerOpen(true)}
          />
        </section>

        {/* Section 2: Destination Mule Network Graph */}
        <section id="section-graph" className="space-y-6 pt-12 border-t border-white/[0.05]">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1">
              <span className="font-mono text-xs uppercase tracking-widest text-amber-400">
                02 / Network Intelligence
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-white">
                Destination Mule Topology
              </h2>
              <p className="text-sm text-zinc-400">
                Graph traversal uncovering Fan-In accumulation, fast dissipation, and circular flow rings.
              </p>
            </div>
            <span className="font-mono text-xs text-zinc-400 bg-white/[0.03] border border-white/10 px-3 py-1 rounded-full self-start sm:self-auto">
              Pattern: <span className="text-amber-400 font-bold">{activeAlert?.graphSignals?.pattern || "NONE"}</span>
            </span>
          </div>

          <DestinationGraph
            graphSignals={activeAlert?.graphSignals}
            graphData={alertDetail?.graphData}
            destAccountName={activeAlert?.destAccountName}
            destAccountNumber={activeAlert?.destAccount}
          />
        </section>

        {/* Section 3: User Baseline Comparison */}
        <section id="section-baseline" className="space-y-6 pt-12 border-t border-white/[0.05]">
          <div className="space-y-1">
            <span className="font-mono text-xs uppercase tracking-widest text-amber-400">
              03 / Behavioral Norms
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Customer Baseline Comparison
            </h2>
            <p className="text-sm text-zinc-400">
              Benchmarking current transfer amount, execution hour, and device fingerprint against 30-day profile.
            </p>
          </div>

          <BaselineComparison
            user={alertDetail?.user}
            transaction={alertDetail?.transaction}
            baselineDeviation={activeAlert?.baselineDeviation}
          />
        </section>

        {/* Section 4: Explainable Risk Evidence & Analyst Actions */}
        <section id="section-investigate" className="space-y-6 pt-12 border-t border-white/[0.05]">
          <div className="space-y-1">
            <span className="font-mono text-xs uppercase tracking-widest text-amber-400">
              04 / Security Dossier &amp; Actions
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Explainable Evidence &amp; Policy Response
            </h2>
            <p className="text-sm text-zinc-400">
              Rule-by-rule rationale, MITRE ATT&CK taxonomy classification, and real-time mitigation actions.
            </p>
          </div>

          <div className="rounded-3xl border border-white/[0.08] bg-[#0c0c10] overflow-hidden">
            <ExplainableAlertDrawer
              alert={activeAlert}
              onExecuteAction={handleExecuteAction}
            />
          </div>
        </section>
      </main>

      {/* Live Monitor Interactive Injection Modal */}
      {showLiveMonitorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeup">
          <div className="w-full max-w-4xl bg-[#0c0c10] border border-white/[0.08] rounded-3xl p-6 lg:p-8 relative shadow-2xl">
            <button
              onClick={() => setShowLiveMonitorModal(false)}
              className="absolute top-6 right-6 grid h-8 w-8 place-items-center rounded-full text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
            <StepSimulator />
          </div>
        </div>
      )}

      {/* Slide-over Investigation Drawer (accessible anywhere) */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm transition-all">
          <div className="w-full max-w-lg bg-[#0a0a0d] border-l border-white/[0.08] shadow-2xl h-full animate-fadeup">
            <ExplainableAlertDrawer
              alert={activeAlert}
              onExecuteAction={handleExecuteAction}
              onClose={() => setDrawerOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
