import { useState, useEffect } from "react";
import axios from "./api/axios";
import Navbar from "./components/Navbar.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import RuleBuilder from "./components/RuleBuilder.jsx";
import CaseCopilot from "./components/CaseCopilot.jsx";

const NOMINAL_ALERT = {
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
  analystNotes: [],
};

function App() {
  const [page, setPage] = useState("dashboard"); // "dashboard" | "rules" | "copilot"
  const [activeTab, setActiveTab] = useState("overview");
  const [alerts, setAlerts] = useState([]);
  const [selectedAlertId, setSelectedAlertId] = useState("ALT-2026-001");
  const [alertDetail, setAlertDetail] = useState(null);
  const [activeScenario, setActiveScenario] = useState("ATO_HEIST");
  const [isReseeding, setIsReseeding] = useState(false);

  // Load dashboard data from backend
  const loadDashboardData = async () => {
    try {
      const res = await axios.get("/fraud/dashboard-summary");
      if (res.data && res.data.success) {
        setAlerts(res.data.alerts || []);
        if (res.data.alerts?.length > 0 && !selectedAlertId) {
          const firstId = res.data.alerts[0].alertId;
          setSelectedAlertId(firstId);
          loadAlertDetail(firstId);
        }
      }
    } catch (err) {
      console.error("Failed to load dashboard summary in App:", err);
    }
  };

  const loadAlertDetail = async (alertId) => {
    if (!alertId || alertId === "NOMINAL-004") return;
    try {
      const res = await axios.get(`/fraud/alerts/${alertId}`);
      if (res.data && res.data.success) {
        setAlertDetail(res.data);
      }
    } catch (err) {
      console.error("Failed to load alert detail in App:", err);
    }
  };

  useEffect(() => {
    loadDashboardData();
    loadAlertDetail("ALT-2026-001");
  }, []);

  const handleSelectScenario = (scenarioId) => {
    setActiveScenario(scenarioId);
    let targetAlertId = null;

    if (scenarioId === "ATO_HEIST") targetAlertId = "ALT-2026-001";
    else if (scenarioId === "MULE_RING") targetAlertId = "ALT-2026-002";
    else if (scenarioId === "CIRCULAR_LOOP") targetAlertId = "ALT-2026-003";
    else if (scenarioId === "NORMAL_USER") {
      setSelectedAlertId("NOMINAL-004");
      setAlertDetail({
        alert: NOMINAL_ALERT,
        user: {
          name: "David Miller",
          userId: "USR-1001",
          accountNumber: "ACC-100123",
          baseline: { avgTransferAmount: 95, knownDevices: ["iPhone 14 (iOS 17.2)"] },
        },
        transaction: {
          txId: "TX-1001-11",
          amount: 115.5,
          destAccountName: "Denver Water & Utility",
          timestamp: new Date(),
        },
      });
      return;
    }

    if (targetAlertId) {
      setSelectedAlertId(targetAlertId);
      loadAlertDetail(targetAlertId);
    }
  };

  const handleExecuteAction = async (alertId, action, note) => {
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
      return res.data;
    } catch (err) {
      console.error("Failed to execute action from App:", err);
      throw err;
    }
  };

  const handleReseed = async () => {
    setIsReseeding(true);
    try {
      await axios.post("/fraud/reseed");
      await loadDashboardData();
      if (selectedAlertId && selectedAlertId !== "NOMINAL-004") {
        await loadAlertDetail(selectedAlertId);
      }
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
    setActiveTab(tabId);

    if (tabId === "overview") {
      setPage("dashboard");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (tabId === "chains") {
      setPage("dashboard");
      setTimeout(() => scrollTo("section-chains"), 80);
    } else if (tabId === "graph") {
      setPage("dashboard");
      setTimeout(() => scrollTo("section-graph"), 80);
    } else if (tabId === "rules") {
      setPage("rules");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (tabId === "copilot") {
      setPage("copilot");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (tabId === "monitor") {
      setPage("dashboard");
    }
  };

  const activeAlert =
    selectedAlertId === "NOMINAL-004"
      ? NOMINAL_ALERT
      : alertDetail?.alert || alerts.find((a) => a.alertId === selectedAlertId) || alerts[0];

  return (
    <div className="min-h-screen bg-[#060608] text-zinc-100 selection:bg-amber-400 selection:text-black">
      {/* Unified Global Navbar */}
      <Navbar
        activeTab={activeTab}
        onNavigate={handleNavigate}
        onReseed={handleReseed}
        isReseeding={isReseeding}
        onOpenDossier={() => handleNavigate("copilot")}
      />

      {/* Main Content Pages */}
      <div className="w-full">
        {page === "dashboard" && (
          <Dashboard
            hideNavbar={true}
            activeTab={activeTab}
            onNavigateTab={handleNavigate}
            activeScenario={activeScenario}
            onSelectScenario={handleSelectScenario}
            activeAlert={activeAlert}
            alertDetail={alertDetail}
            alerts={alerts}
            onExecuteAction={handleExecuteAction}
            onOpenCopilot={() => handleNavigate("copilot")}
          />
        )}

        {page === "rules" && <RuleBuilder />}

        {page === "copilot" && (
          <CaseCopilot
            alert={activeAlert}
            activeScenario={activeScenario}
            onSelectScenario={handleSelectScenario}
            alerts={alerts}
            onSelectAlert={(id) => {
              setSelectedAlertId(id);
              loadAlertDetail(id);
            }}
            onExecuteAction={handleExecuteAction}
          />
        )}
      </div>
    </div>
  );
}

export default App;
