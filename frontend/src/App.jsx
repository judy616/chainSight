import { useState } from "react";
import Dashboard from "./pages/Dashboard.jsx";
import RuleBuilder from "./components/RuleBuilder.jsx";
import CaseCopilot from "./components/CaseCopilot.jsx";

function App() {
  const [page, setPage] = useState("dashboard");

  return (
    <div className="min-h-screen bg-gray-950">

      {/* Navigation */}
      <div className="flex gap-3 p-4 bg-gray-950 border-b border-gray-800">

        <button
          onClick={() => setPage("dashboard")}
          className="px-4 py-2 rounded-lg bg-gray-800 text-gray-200 hover:bg-gray-700"
        >
          Dashboard
        </button>

        <button
          onClick={() => setPage("rules")}
          className="px-4 py-2 rounded-lg bg-cyan-700 text-white hover:bg-cyan-600"
        >
          Rule Builder
        </button>

        <button
          onClick={() => setPage("copilot")}
          className="px-4 py-2 rounded-lg bg-purple-700 text-white hover:bg-purple-600"
        >
          AI Case Copilot
        </button>

      </div>

      {/* Pages */}
      {page === "dashboard" && <Dashboard />}
      {page === "rules" && <RuleBuilder />}
      {page === "copilot" && <CaseCopilot />}

    </div>
  );
}

export default App;