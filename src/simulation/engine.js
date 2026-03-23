/**
 * Coop Simulation Engine
 *
 * Model: Simple multiplicative/additive impact model.
 * Each event defines deltas applied to KPIs while the event is active.
 * Multiple events stack: multipliers compound, percentage-point deltas add.
 *
 * Baseline KPIs (weekly):
 *   serviceLevel      — on-shelf availability (%)
 *   revenue           — weekly revenue (DKK 000s)
 *   grossMargin       — gross margin (%)
 *   cogs              — cost of goods sold as % of revenue
 *   logisticsCost     — logistics cost as % of revenue
 *   waste             — waste/shrinkage as % of revenue
 *   inventoryDays     — days of supply in inventory
 */

export const DEFAULT_BASELINE = {
  serviceLevel: 97.5,   // %
  revenue: 50000,       // DKK 000s per week
  grossMargin: 22.0,    // %
  cogs: 68.0,           // % of revenue
  logisticsCost: 6.0,   // % of revenue
  waste: 2.5,           // % of revenue
  inventoryDays: 21,    // days
}

export const EVENT_TYPES = {
  strike: {
    label: 'Strike',
    color: '#e63946',
    icon: '⚡',
    defaultImpacts: {
      serviceLevelDelta: -12,
      revenueFactor: 0.82,
      grossMarginDelta: -2,
      cogsDelta: 2,
      logisticsCostDelta: 3,
      wasteDelta: 1.5,
      inventoryDaysDelta: -5,
    },
  },
  supplyDisruption: {
    label: 'Supply Disruption',
    color: '#f4a261',
    icon: '🚚',
    defaultImpacts: {
      serviceLevelDelta: -8,
      revenueFactor: 0.92,
      grossMarginDelta: -1,
      cogsDelta: 1.5,
      logisticsCostDelta: 2,
      wasteDelta: 0.5,
      inventoryDaysDelta: -6,
    },
  },
  demandShock: {
    label: 'Demand Shock',
    color: '#2a9d8f',
    icon: '📈',
    defaultImpacts: {
      serviceLevelDelta: -5,
      revenueFactor: 1.15,
      grossMarginDelta: 1,
      cogsDelta: -0.5,
      logisticsCostDelta: 0.5,
      wasteDelta: -0.3,
      inventoryDaysDelta: -4,
    },
  },
  operationalChange: {
    label: 'Operational Change',
    color: '#457b9d',
    icon: '⚙️',
    defaultImpacts: {
      serviceLevelDelta: -3,
      revenueFactor: 0.98,
      grossMarginDelta: 0,
      cogsDelta: 0,
      logisticsCostDelta: 1,
      wasteDelta: 0.2,
      inventoryDaysDelta: 2,
    },
  },
  costEvent: {
    label: 'Cost Event',
    color: '#9b2335',
    icon: '💰',
    defaultImpacts: {
      serviceLevelDelta: 0,
      revenueFactor: 1.0,
      grossMarginDelta: -3,
      cogsDelta: 2.5,
      logisticsCostDelta: 1.5,
      wasteDelta: 0,
      inventoryDaysDelta: 0,
    },
  },
}

/**
 * Run simulation: returns array of weekly data points.
 * @param {Object} baseline
 * @param {Array}  events    — list of event objects
 * @param {number} weeks     — simulation horizon
 */
export function runSimulation(baseline, events, weeks = 52) {
  const results = []

  for (let w = 0; w < weeks; w++) {
    // Collect all active events this week
    const active = events.filter(e => w >= e.startWeek && w < e.startWeek + e.duration)

    // Compound revenue factor (multiplicative)
    const revFactor = active.reduce((acc, e) => acc * (e.impacts.revenueFactor ?? 1), 1)

    // Additive deltas
    const slDelta      = active.reduce((acc, e) => acc + (e.impacts.serviceLevelDelta  ?? 0), 0)
    const gmDelta      = active.reduce((acc, e) => acc + (e.impacts.grossMarginDelta   ?? 0), 0)
    const cogsDelta    = active.reduce((acc, e) => acc + (e.impacts.cogsDelta          ?? 0), 0)
    const logDelta     = active.reduce((acc, e) => acc + (e.impacts.logisticsCostDelta ?? 0), 0)
    const wasteDelta   = active.reduce((acc, e) => acc + (e.impacts.wasteDelta         ?? 0), 0)
    const invDelta     = active.reduce((acc, e) => acc + (e.impacts.inventoryDaysDelta ?? 0), 0)

    const revenue      = Math.max(0, baseline.revenue * revFactor)
    const serviceLevel = Math.min(100, Math.max(0, baseline.serviceLevel + slDelta))
    const grossMargin  = Math.min(100, Math.max(0, baseline.grossMargin  + gmDelta))
    const cogs         = Math.max(0, baseline.cogs        + cogsDelta)
    const logisticsCost= Math.max(0, baseline.logisticsCost + logDelta)
    const waste        = Math.max(0, baseline.waste       + wasteDelta)
    const inventoryDays= Math.max(0, baseline.inventoryDays + invDelta)

    // Derived absolute values
    const cogsAbs      = revenue * cogs / 100
    const logisticsAbs = revenue * logisticsCost / 100
    const wasteAbs     = revenue * waste / 100
    const grossProfitAbs = revenue * grossMargin / 100

    results.push({
      week: w + 1,
      label: `W${w + 1}`,
      serviceLevel:  round(serviceLevel, 1),
      revenue:       round(revenue, 0),
      grossMargin:   round(grossMargin, 1),
      grossProfit:   round(grossProfitAbs, 0),
      cogs:          round(cogs, 1),
      cogsAbs:       round(cogsAbs, 0),
      logisticsCost: round(logisticsCost, 1),
      logisticsAbs:  round(logisticsAbs, 0),
      waste:         round(waste, 1),
      wasteAbs:      round(wasteAbs, 0),
      inventoryDays: round(inventoryDays, 1),
      activeEvents:  active.map(e => e.name),
    })
  }

  return results
}

/**
 * Compute summary statistics comparing scenario vs baseline over full horizon.
 */
export function computeSummary(baseline, scenarioData) {
  const weeks = scenarioData.length
  const baselineRevenue      = baseline.revenue * weeks
  const scenarioRevenue      = scenarioData.reduce((s, w) => s + w.revenue, 0)
  const baselineGrossProfit  = baselineRevenue * baseline.grossMargin / 100
  const scenarioGrossProfit  = scenarioData.reduce((s, w) => s + w.grossProfit, 0)
  const baselineCogsAbs      = baselineRevenue * baseline.cogs / 100
  const scenarioCogsAbs      = scenarioData.reduce((s, w) => s + w.cogsAbs, 0)
  const baselineLogisticsAbs = baselineRevenue * baseline.logisticsCost / 100
  const scenarioLogisticsAbs = scenarioData.reduce((s, w) => s + w.logisticsAbs, 0)
  const baselineWasteAbs     = baselineRevenue * baseline.waste / 100
  const scenarioWasteAbs     = scenarioData.reduce((s, w) => s + w.wasteAbs, 0)
  const avgServiceLevel      = scenarioData.reduce((s, w) => s + w.serviceLevel, 0) / weeks

  return {
    revenueDelta:      round(scenarioRevenue - baselineRevenue, 0),
    revenuePct:        round((scenarioRevenue / baselineRevenue - 1) * 100, 1),
    grossProfitDelta:  round(scenarioGrossProfit - baselineGrossProfit, 0),
    grossProfitPct:    round((scenarioGrossProfit / baselineGrossProfit - 1) * 100, 1),
    cogsDelta:         round(scenarioCogsAbs - baselineCogsAbs, 0),
    logisticsDelta:    round(scenarioLogisticsAbs - baselineLogisticsAbs, 0),
    wasteDelta:        round(scenarioWasteAbs - baselineWasteAbs, 0),
    avgServiceLevel:   round(avgServiceLevel, 1),
    serviceLevelDelta: round(avgServiceLevel - baseline.serviceLevel, 1),
  }
}

function round(val, decimals) {
  const factor = Math.pow(10, decimals)
  return Math.round(val * factor) / factor
}
