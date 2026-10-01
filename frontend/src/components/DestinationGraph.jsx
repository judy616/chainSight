import React, { useState } from "react";
import { GitFork, ArrowRight, ShieldAlert, Layers } from "lucide-react";

export default function DestinationGraph({ graphSignals, destAccountName, destAccountNumber }) {
  const [selectedNode, setSelectedNode] = useState(null);

  const pattern = graphSignals?.pattern || "NONE";
  const inDegree = graphSignals?.inDegree || 0;
  const outDegree = graphSignals?.outDegree || 0;
  const destRisk = graphSignals?.destRiskScore || 0;

  const width = 640;
  const height = 300;
  const centerX = width / 2;
  const centerY = height / 2;

  let nodes = [];
  let edges = [];

  if (pattern.includes("CIRCULAR")) {
    nodes = [
      { id: "ACC-CYC-1", label: "Smurf Shell Alpha", x: centerX - 130, y: centerY - 50, role: "ORIGIN / SINK", isTarget: true, color: "#f59e0b" },
      { id: "ACC-CYC-2", label: "Smurf Shell Beta", x: centerX + 130, y: centerY - 50, role: "INTERMEDIARY", isTarget: false, color: "#a1a1aa" },
      { id: "ACC-CYC-3", label: "Smurf Shell Gamma", x: centerX, y: centerY + 80, role: "INTERMEDIARY", isTarget: false, color: "#71717a" },
    ];
    edges = [
      { from: nodes[0], to: nodes[1], amount: "$8,900" },
      { from: nodes[1], to: nodes[2], amount: "$8,750" },
      { from: nodes[2], to: nodes[0], amount: "$8,600", isCycle: true },
    ];
  } else if (pattern.includes("RAPID_PASS_THROUGH")) {
    nodes = [
      { id: "ACC-VICTIM-1", label: "Victim Inflow (Alice)", x: centerX - 210, y: centerY - 65, role: "SOURCE", color: "#71717a" },
      { id: "ACC-VICTIM-2", label: "Eleanor Vance (Current ATO)", x: centerX - 210, y: centerY + 65, role: "SOURCE", color: "#f59e0b" },
      { id: destAccountNumber || "ACC-MULE-902", label: destAccountName || "Apex Global (Mule Hub)", x: centerX, y: centerY, role: "MULE_PASS_THROUGH", isTarget: true, color: "#f59e0b" },
      { id: "ACC-OFFSHORE-99", label: "Offshore Crypto Exch", x: centerX + 210, y: centerY, role: "CASH_OUT", color: "#e11d48" },
    ];
    edges = [
      { from: nodes[0], to: nodes[2], amount: "$14,200" },
      { from: nodes[1], to: nodes[2], amount: "$24,500", isPending: true },
      { from: nodes[2], to: nodes[3], amount: "$31,000", isSweep: true },
    ];
  } else if (pattern.includes("FAN_IN")) {
    nodes = [
      { id: "ACC-REG-101", label: "Compromised Acct 101", x: centerX - 200, y: centerY - 80, role: "SOURCE", color: "#71717a" },
      { id: "ACC-REG-102", label: "Compromised Acct 102", x: centerX - 200, y: centerY - 25, role: "SOURCE", color: "#71717a" },
      { id: "ACC-REG-103", label: "Compromised Acct 103", x: centerX - 200, y: centerY + 35, role: "SOURCE", color: "#71717a" },
      { id: "ACC-309211", label: "Marcus Sterling (Current)", x: centerX - 200, y: centerY + 90, role: "SOURCE", color: "#f59e0b" },
      { id: destAccountNumber || "ACC-MULE-441", label: destAccountName || "Digital Settlement Corp", x: centerX + 120, y: centerY, role: "MULE_AGGREGATOR", isTarget: true, color: "#f59e0b" },
    ];
    edges = [
      { from: nodes[0], to: nodes[4], amount: "$4,950" },
      { from: nodes[1], to: nodes[4], amount: "$4,800" },
      { from: nodes[2], to: nodes[4], amount: "$4,990" },
      { from: nodes[3], to: nodes[4], amount: "$19,800", isPending: true },
    ];
  } else {
    nodes = [
      { id: "ACC-100123", label: "David Miller", x: centerX - 140, y: centerY, role: "AUTHENTICATED_USER", color: "#10b981" },
      { id: destAccountNumber || "ACC-METER-88", label: destAccountName || "Denver Utility", x: centerX + 140, y: centerY, role: "VERIFIED_MERCHANT", isTarget: true, color: "#10b981" },
    ];
    edges = [
      { from: nodes[0], to: nodes[1], amount: "$115.50" },
    ];
  }

  return (
    <div className="rounded-3xl border border-white/[0.08] bg-[#0c0c10] p-6 lg:p-8 backdrop-blur-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-amber-400">
              Transaction Graph Analysis
            </span>
            <span className="h-1 w-1 rounded-full bg-zinc-600" />
            <span className="text-xs text-zinc-400">Topology Signature</span>
          </div>
          <h3 className="mt-1 text-xl font-bold text-white tracking-tight">
            Destination Money-Flow Network
          </h3>
        </div>

        {/* Pattern Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {pattern.includes("RAPID_PASS_THROUGH") && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-medium text-rose-300">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-subtle-pulse" />
              Rapid Pass-Through (&lt;15m)
            </span>
          )}
          {pattern.includes("FAN_IN") && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              Fan-In (Mule Aggregator)
            </span>
          )}
          {pattern.includes("CIRCULAR") && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              Circular Layering (Smurfing Loop)
            </span>
          )}
          {pattern === "NONE" && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
              Clean Peer-to-Peer Topology
            </span>
          )}
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="mt-6 rounded-2xl border border-white/[0.04] bg-[#070709] p-4 relative overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none" style={{ minHeight: "240px" }}>
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#52525b" />
            </marker>
            <marker id="arrow-gold" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#f59e0b" />
            </marker>
            <marker id="arrow-danger" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#e11d48" />
            </marker>
          </defs>

          {/* Background Grid */}
          <g stroke="rgba(255,255,255,0.02)" strokeWidth="1">
            {Array.from({ length: 11 }).map((_, i) => (
              <line key={`gx-${i}`} x1={i * 64} y1="0" x2={i * 64} y2={height} />
            ))}
            {Array.from({ length: 6 }).map((_, i) => (
              <line key={`gy-${i}`} x1="0" y1={i * 60} x2={width} y2={i * 60} />
            ))}
          </g>

          {/* Directed Flow Edges */}
          {edges.map((e, idx) => {
            const isGold = e.isPending || e.isCycle;
            const isDanger = e.isSweep;
            const strokeColor = isDanger ? "#e11d48" : isGold ? "#f59e0b" : "#3f3f46";
            const markerEnd = isDanger ? "url(#arrow-danger)" : isGold ? "url(#arrow-gold)" : "url(#arrow)";

            return (
              <g key={`edge-${idx}`}>
                <line
                  x1={e.from.x}
                  y1={e.from.y}
                  x2={e.to.x}
                  y2={e.to.y}
                  stroke={strokeColor}
                  strokeWidth={isDanger || isGold ? "2" : "1.2"}
                  strokeDasharray={isDanger ? "4 3" : "none"}
                  markerEnd={markerEnd}
                />
                <rect
                  x={(e.from.x + e.to.x) / 2 - 26}
                  y={(e.from.y + e.to.y) / 2 - 8}
                  width="52"
                  height="16"
                  rx="4"
                  fill="#0e0e12"
                  stroke={strokeColor}
                  strokeWidth="0.8"
                />
                <text
                  x={(e.from.x + e.to.x) / 2}
                  y={(e.from.y + e.to.y) / 2 + 4}
                  textAnchor="middle"
                  fill={isDanger ? "#fda4af" : isGold ? "#fde68a" : "#a1a1aa"}
                  fontSize="9.5"
                  fontFamily="monospace"
                  fontWeight="600"
                >
                  {e.amount}
                </text>
              </g>
            );
          })}

          {/* Account Nodes */}
          {nodes.map((node) => {
            return (
              <g
                key={node.id}
                className="cursor-pointer group"
                onClick={() => setSelectedNode(node)}
              >
                {node.isTarget && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="24"
                    fill="none"
                    stroke={node.color}
                    strokeWidth="1.5"
                    strokeOpacity="0.25"
                  />
                )}

                <circle
                  cx={node.x}
                  cy={node.y}
                  r="16"
                  fill="#0f0f14"
                  stroke={node.color}
                  strokeWidth="1.5"
                />

                <circle
                  cx={node.x}
                  cy={node.y}
                  r="5"
                  fill={node.color}
                />

                <text
                  x={node.x}
                  y={node.y + 28}
                  textAnchor="middle"
                  fill="#f4f4f6"
                  fontSize="11"
                  fontWeight="500"
                >
                  {node.label}
                </text>
                <text
                  x={node.x}
                  y={node.y + 40}
                  textAnchor="middle"
                  fill="#71717a"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {node.id}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Telemetry Bar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.04] pt-4 px-2 text-xs">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-zinc-500">In-Degree:</span>{" "}
              <span className="font-mono font-semibold text-white">{inDegree} sources</span>
            </div>
            <div>
              <span className="text-zinc-500">Out-Degree:</span>{" "}
              <span className="font-mono font-semibold text-white">{outDegree} routes</span>
            </div>
            <div>
              <span className="text-zinc-500">Network Threat Weight:</span>{" "}
              <span className="font-mono font-semibold text-amber-400">+{destRisk} pts</span>
            </div>
          </div>
          <div className="text-[11px] text-zinc-400 italic">
            {graphSignals?.details}
          </div>
        </div>
      </div>
    </div>
  );
}
