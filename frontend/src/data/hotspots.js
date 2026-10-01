// Dummy thermal-anomaly data for the IgniSense dashboard.
// Coordinates are [longitude, latitude]. All numbers are fabricated for the demo.

export const SEVERITY = {
  high: { label: "High", color: "#ef4444", ring: "#ef4444" },
  moderate: { label: "Moderate", color: "#f97316", ring: "#f97316" },
  low: { label: "Low", color: "#f59e0b", ring: "#f59e0b" },
  normal: { label: "Normal", color: "#16a34a", ring: "#16a34a" },
};

const RAW_HOTSPOTS = [
  {
    id: "vizag-refinery",
    name: "Visakhapatnam Refinery",
    region: "Visakhapatnam, Andhra Pradesh",
    coords: [83.22, 17.7],
    industry: "Oil Refinery",
    severity: "high",
    currentBrightness: 392,
    baseline: 338,
    anomalyScore: 87,
    confidence: 94,
    status: "Unusual Thermal Activity",
    detectedOn: "27 Aug 2026, 02:15 AM",
  },
  {
    id: "jamnagar-refinery",
    name: "Jamnagar Refinery Complex",
    region: "Jamnagar, Gujarat",
    coords: [70.06, 22.47],
    industry: "Oil Refinery",
    severity: "high",
    currentBrightness: 411,
    baseline: 351,
    anomalyScore: 91,
    confidence: 96,
    status: "Sustained Flare Spike",
    detectedOn: "27 Aug 2026, 11:48 PM",
  },
  {
    id: "bhilai-steel",
    name: "Bhilai Steel Plant",
    region: "Bhilai, Chhattisgarh",
    coords: [81.38, 21.19],
    industry: "Integrated Steel",
    severity: "high",
    currentBrightness: 405,
    baseline: 356,
    anomalyScore: 83,
    confidence: 90,
    status: "Blast Furnace Overheat",
    detectedOn: "28 Aug 2026, 04:02 AM",
  },
  {
    id: "mathura-refinery",
    name: "Mathura Refinery",
    region: "Mathura, Uttar Pradesh",
    coords: [77.67, 27.49],
    industry: "Oil Refinery",
    severity: "moderate",
    currentBrightness: 362,
    baseline: 334,
    anomalyScore: 58,
    confidence: 81,
    status: "Elevated Flare Output",
    detectedOn: "28 Aug 2026, 01:20 AM",
  },
  {
    id: "paradip-refinery",
    name: "Paradip Refinery",
    region: "Paradip, Odisha",
    coords: [86.61, 20.26],
    industry: "Oil Refinery",
    severity: "moderate",
    currentBrightness: 357,
    baseline: 331,
    anomalyScore: 54,
    confidence: 78,
    status: "Elevated Flare Output",
    detectedOn: "27 Aug 2026, 09:33 PM",
  },
  {
    id: "korba-power",
    name: "Korba Super Thermal Power",
    region: "Korba, Chhattisgarh",
    coords: [82.74, 22.35],
    industry: "Coal Power Plant",
    severity: "moderate",
    currentBrightness: 349,
    baseline: 327,
    anomalyScore: 49,
    confidence: 74,
    status: "Above-Baseline Output",
    detectedOn: "28 Aug 2026, 03:11 AM",
  },
  {
    id: "manali-refinery",
    name: "Chennai Petroleum (Manali)",
    region: "Manali, Tamil Nadu",
    coords: [80.26, 13.16],
    industry: "Oil Refinery",
    severity: "moderate",
    currentBrightness: 353,
    baseline: 330,
    anomalyScore: 52,
    confidence: 76,
    status: "Elevated Flare Output",
    detectedOn: "27 Aug 2026, 07:55 PM",
  },
  {
    id: "panipat-refinery",
    name: "Panipat Refinery",
    region: "Panipat, Haryana",
    coords: [76.97, 29.39],
    industry: "Oil Refinery",
    severity: "low",
    currentBrightness: 339,
    baseline: 328,
    anomalyScore: 27,
    confidence: 69,
    status: "Within Expected Range",
    detectedOn: "28 Aug 2026, 12:04 AM",
  },
  {
    id: "kochi-refinery",
    name: "Kochi Refinery",
    region: "Kochi, Kerala",
    coords: [76.27, 10.0],
    industry: "Oil Refinery",
    severity: "low",
    currentBrightness: 335,
    baseline: 326,
    anomalyScore: 22,
    confidence: 66,
    status: "Within Expected Range",
    detectedOn: "27 Aug 2026, 10:41 PM",
  },
  {
    id: "mumbai-trombay",
    name: "Trombay Industrial Zone",
    region: "Mumbai, Maharashtra",
    coords: [72.87, 19.02],
    industry: "Refinery / Petrochem",
    severity: "low",
    currentBrightness: 341,
    baseline: 330,
    anomalyScore: 31,
    confidence: 71,
    status: "Within Expected Range",
    detectedOn: "28 Aug 2026, 02:47 AM",
  },
  {
    id: "digboi-refinery",
    name: "Digboi Refinery",
    region: "Digboi, Assam",
    coords: [95.62, 27.39],
    industry: "Oil Refinery",
    severity: "normal",
    currentBrightness: 322,
    baseline: 321,
    anomalyScore: 8,
    confidence: 62,
    status: "Nominal",
    detectedOn: "27 Aug 2026, 08:12 PM",
  },
  {
    id: "vizag-steel",
    name: "Visakhapatnam Steel Plant",
    region: "Visakhapatnam, Andhra Pradesh",
    coords: [82.95, 17.15],
    industry: "Integrated Steel",
    severity: "normal",
    currentBrightness: 330,
    baseline: 329,
    anomalyScore: 12,
    confidence: 64,
    status: "Nominal",
    detectedOn: "28 Aug 2026, 05:19 AM",
  },
];

// ---- synthetic 30-day thermal history -----------------------------
// Deterministic per site: quiet wander near the baseline, then a sharp
// spike over the final days (flat for "normal" sites).
function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SPIKE_DAYS = { high: 4, moderate: 5, low: 3, normal: 0 };

function buildHistory(spot) {
  const N = 30;
  const rnd = mulberry32(hashStr(spot.id));
  const k = SPIKE_DAYS[spot.severity];
  const spikeStart = k ? N - k : N;
  const points = [];

  for (let i = 0; i < N; i++) {
    const drift = Math.sin(i / 4 + rnd() * 6) * 2.4;
    const noise = (rnd() - 0.5) * 6;
    let v = spot.baseline + drift + noise;

    if (i >= spikeStart) {
      const t = (i - spikeStart) / Math.max(1, k - 1);
      const ease = t * t * (3 - 2 * t);
      v = spot.baseline + drift * 0.4 + (spot.currentBrightness - spot.baseline) * ease;
    }
    points.push(Math.round(v));
  }
  points[N - 1] = spot.currentBrightness;

  return {
    points,
    spikeStart,
    min: Math.min(...points, spot.baseline - 8),
    max: Math.max(...points, spot.baseline + 8),
    band: [spot.baseline - 6, spot.baseline + 6],
  };
}

export const HOTSPOTS = RAW_HOTSPOTS.map((h) => ({ ...h, history: buildHistory(h) }));

// Simplified India outline, [lng, lat] pairs, clockwise from the north-west.
// Denser than a rough triangle so the coastline reads clearly once smoothed.
export const INDIA_OUTLINE = [
  [74.0, 34.4], [75.7, 35.4], [77.8, 35.4], [78.9, 34.6], [79.5, 34.0],
  [78.7, 33.0], [79.2, 32.5], [78.4, 31.9], [80.2, 30.7], [81.0, 30.2],
  [82.7, 29.6], [84.6, 28.7], [86.2, 28.0], [88.1, 27.9], [88.7, 27.3],
  [89.6, 26.9], [91.7, 26.8], [92.0, 27.7], [94.1, 27.0], [95.4, 27.0],
  [96.6, 27.7], [97.0, 28.2], [96.2, 26.6], [95.1, 26.4], [94.5, 24.9],
  [94.2, 24.0], [93.2, 23.2], [93.1, 22.2], [92.5, 22.0], [91.6, 23.0],
  [91.3, 24.0], [92.3, 24.9], [90.4, 25.2], [89.8, 25.9], [88.5, 26.4],
  [88.1, 25.2], [88.0, 24.2], [88.7, 22.3], [87.2, 21.7], [86.9, 20.3],
  [85.9, 19.5], [84.3, 18.6], [83.3, 17.7], [82.2, 16.9], [81.2, 16.3],
  [80.6, 15.5], [80.1, 13.8], [80.3, 13.1], [79.9, 11.9], [79.4, 10.3],
  [78.9, 9.4], [79.1, 9.2], [78.2, 8.9], [77.5, 8.1], [76.5, 9.0],
  [76.2, 9.9], [75.4, 11.8], [74.7, 13.5], [74.0, 15.4], [73.8, 15.7],
  [73.0, 17.7], [72.8, 19.1], [72.9, 20.4], [72.7, 20.9], [71.3, 20.8],
  [70.4, 20.9], [69.2, 22.0], [68.9, 22.5], [69.9, 22.7], [70.4, 22.6],
  [68.6, 23.5], [68.3, 23.9], [69.1, 24.3], [71.0, 24.3], [70.8, 25.7],
  [70.6, 27.0], [71.9, 27.9], [73.0, 29.0], [73.9, 29.9], [74.6, 31.0],
  [74.6, 32.0], [75.3, 32.3], [74.6, 32.8], [74.3, 33.6],
];

export const SRI_LANKA_OUTLINE = [
  [79.9, 9.8], [81.2, 9.1], [81.8, 7.6], [80.9, 6.6], [79.9, 7.8],
];
