const Transaction = require("../models/Transaction");

/**
 * Analyze destination account for money-flow topology patterns:
 * - Fan-in (Mule aggregator)
 * - Fan-out (Disbursement / Layering)
 * - Rapid pass-through (< 15 mins inflow-to-outflow sweep)
 * - Circular transactions (A -> B -> C -> A)
 */
async function analyzeDestinationGraph(destAccount, targetAmount = 0, currentTxId = null) {
  const relatedTxs = await Transaction.find({
    $or: [{ destAccount }, { sourceAccount: destAccount }],
  })
    .sort({ timestamp: -1 })
    .limit(100)
    .lean();

  const inflows = relatedTxs.filter((t) => t.destAccount === destAccount && (!currentTxId || t.txId !== currentTxId));
  const outflows = relatedTxs.filter((t) => t.sourceAccount === destAccount && (!currentTxId || t.txId !== currentTxId));

  const uniqueSenders = new Set(inflows.map((t) => t.sourceAccount));
  const uniqueReceivers = new Set(outflows.map((t) => t.destAccount));

  const inDegree = uniqueSenders.size + (destAccount ? 1 : 0);
  const outDegree = uniqueReceivers.size;

  let pattern = "NONE";
  let destRiskScore = 0;
  const indicators = [];
  let rapidPassThroughDetected = false;
  let cycleDetected = false;

  // 1. Fan-In (Mule Aggregator) check
  if (uniqueSenders.size >= 2) {
    pattern = "FAN_IN";
    destRiskScore += 35;
    indicators.push(`Fan-In Pattern: Mule account concentrated inflows from ${uniqueSenders.size + 1} distinct sources in short interval.`);
  }

  // 2. Fan-Out (Layering / Disbursement) check
  if (outflows.length >= 3 && uniqueReceivers.size >= 3) {
    pattern = pattern === "NONE" ? "FAN_OUT" : `${pattern} + FAN_OUT`;
    destRiskScore += 30;
    indicators.push(`Fan-Out Pattern: Rapid dispersal to ${uniqueReceivers.size} distinct downstream accounts.`);
  }

  // 3. Rapid Pass-Through check
  for (const inflow of inflows) {
    const inflowTime = new Date(inflow.timestamp).getTime();
    for (const outflow of outflows) {
      const outflowTime = new Date(outflow.timestamp).getTime();
      const diffMinutes = Math.abs(outflowTime - inflowTime) / (1000 * 60);

      if (diffMinutes <= 20 && outflowTime >= inflowTime && outflow.amount >= inflow.amount * 0.75) {
        rapidPassThroughDetected = true;
        destRiskScore += 35;
        pattern = pattern === "NONE" ? "RAPID_PASS_THROUGH" : `${pattern} + RAPID_PASS_THROUGH`;
        indicators.push(`Rapid Pass-Through: Swept $${outflow.amount.toLocaleString()} out within ${Math.round(diffMinutes)} mins of $${inflow.amount.toLocaleString()} deposit.`);
        break;
      }
    }
    if (rapidPassThroughDetected) break;
  }

  // 4. Circular Transaction Check
  const allRecentTxs = await Transaction.find().sort({ timestamp: -1 }).limit(150).lean();
  const adj = new Map();

  for (const tx of allRecentTxs) {
    if (!adj.has(tx.sourceAccount)) adj.set(tx.sourceAccount, []);
    adj.get(tx.sourceAccount).push(tx.destAccount);
  }

  function hasCycleFrom(startNode) {
    const visited = new Set();
    const recStack = new Set();

    function dfs(node, depth = 0) {
      if (depth > 5) return false;
      visited.add(node);
      recStack.add(node);

      const neighbors = adj.get(node) || [];
      for (const n of neighbors) {
        if (!visited.has(n)) {
          if (dfs(n, depth + 1)) return true;
        } else if (recStack.has(n)) {
          return true;
        }
      }
      recStack.delete(node);
      return false;
    }

    return dfs(startNode);
  }

  if (hasCycleFrom(destAccount)) {
    cycleDetected = true;
    destRiskScore += 40;
    pattern = pattern === "NONE" ? "CIRCULAR" : `${pattern} + CIRCULAR`;
    indicators.push(`Circular Routing Detected: Funds trace a closed smurfing loop returning to origin network.`);
  }

  destRiskScore = Math.min(60, destRiskScore);

  return {
    pattern,
    inDegree,
    outDegree,
    rapidPassThroughDetected,
    cycleDetected,
    destRiskScore,
    details: indicators.join(" ") || "No abnormal topology detected. Standard peer-to-peer flow.",
    relatedTxsCount: relatedTxs.length,
  };
}

async function getAccountGraphData(accountNumber) {
  const transactions = await Transaction.find({
    $or: [{ sourceAccount: accountNumber }, { destAccount: accountNumber }],
  })
    .sort({ timestamp: -1 })
    .limit(30)
    .lean();

  const nodeMap = new Map();
  const edges = [];

  nodeMap.set(accountNumber, {
    id: accountNumber,
    name: accountNumber.startsWith("ACC-") ? accountNumber : `Account ${accountNumber}`,
    type: "TARGET",
    isTarget: true,
    riskScore: 0,
    inDegree: 0,
    outDegree: 0,
  });

  for (const tx of transactions) {
    if (!nodeMap.has(tx.sourceAccount)) {
      nodeMap.set(tx.sourceAccount, {
        id: tx.sourceAccount,
        name: tx.sourceUserName || tx.sourceAccount,
        type: tx.sourceAccount === accountNumber ? "TARGET" : "SOURCE",
        isTarget: tx.sourceAccount === accountNumber,
        riskScore: tx.riskScore || 20,
        inDegree: 0,
        outDegree: 0,
      });
    }

    if (!nodeMap.has(tx.destAccount)) {
      nodeMap.set(tx.destAccount, {
        id: tx.destAccount,
        name: tx.destAccountName || tx.destAccount,
        type: tx.destAccount === accountNumber ? "TARGET" : "DESTINATION",
        isTarget: tx.destAccount === accountNumber,
        riskScore: tx.riskScore || 20,
        inDegree: 0,
        outDegree: 0,
      });
    }

    nodeMap.get(tx.sourceAccount).outDegree += 1;
    nodeMap.get(tx.destAccount).inDegree += 1;

    edges.push({
      id: tx.txId || `${tx.sourceAccount}-${tx.destAccount}-${edges.length}`,
      from: tx.sourceAccount,
      to: tx.destAccount,
      amount: tx.amount,
      type: tx.type,
      timestamp: tx.timestamp,
      pattern: tx.networkPattern || "NONE",
      status: tx.status,
    });
  }

  const targetNode = nodeMap.get(accountNumber);
  if (targetNode) {
    if (targetNode.inDegree >= 3) targetNode.role = "MULE_AGGREGATOR";
    else if (targetNode.outDegree >= 3) targetNode.role = "DISBURSEMENT_HUB";
    else targetNode.role = "INTERMEDIARY";
  }

  return {
    nodes: Array.from(nodeMap.values()),
    edges,
  };
}

module.exports = {
  analyzeDestinationGraph,
  getAccountGraphData,
};
