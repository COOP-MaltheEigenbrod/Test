import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine, ReferenceArea,
} from 'recharts'
import { EVENT_TYPES } from '../simulation/engine'

const CHARTS = [
  {
    title: 'Service Level (%)',
    keys: [{ key: 'serviceLevel', label: 'Service Level', color: '#2a9d8f' }],
    unit: '%',
    baseline: 'serviceLevel',
  },
  {
    title: 'Weekly Revenue (DKK 000s)',
    keys: [{ key: 'revenue', label: 'Revenue', color: '#457b9d' }],
    unit: 'TDKK',
    baseline: 'revenue',
  },
  {
    title: 'Gross Margin (%)',
    keys: [{ key: 'grossMargin', label: 'Gross Margin %', color: '#e9c46a' }],
    unit: '%',
    baseline: 'grossMargin',
  },
  {
    title: 'Cost Breakdown (% of revenue)',
    keys: [
      { key: 'cogs',          label: 'COGS',      color: '#e63946' },
      { key: 'logisticsCost', label: 'Logistics', color: '#f4a261' },
      { key: 'waste',         label: 'Waste',     color: '#9b2335' },
    ],
    unit: '%',
    baseline: null,
  },
  {
    title: 'Inventory Days',
    keys: [{ key: 'inventoryDays', label: 'Inventory Days', color: '#6a4c93' }],
    unit: 'days',
    baseline: 'inventoryDays',
  },
  {
    title: 'Gross Profit (DKK 000s)',
    keys: [{ key: 'grossProfit', label: 'Gross Profit', color: '#2a9d8f' }],
    unit: 'TDKK',
    baseline: null,
  },
]

function tickFmt(val) {
  if (Math.abs(val) >= 1000) return `${(val / 1000).toFixed(0)}k`
  return val
}

const s = {
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 16 },
  card: { background: '#fff', borderRadius: 10, padding: '16px 12px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  chartTitle: { fontSize: 13, fontWeight: 700, color: '#1a1a2e', marginBottom: 10 },
}

function buildEventBands(events) {
  return events.map(e => ({
    x1: e.startWeek,
    x2: e.startWeek + e.duration - 1,
    color: EVENT_TYPES[e.type]?.color ?? '#ccc',
    name: e.name,
  }))
}

export default function KPICharts({ data, baseline, events, weeks }) {
  if (!data || data.length === 0) return null

  const bands = buildEventBands(events)
  // Build baseline flat line data
  const baselineData = data.map(w => {
    const obj = { week: w.week, label: w.label }
    CHARTS.forEach(c => {
      if (c.baseline) obj[`${c.baseline}_base`] = baseline[c.baseline]
    })
    return obj
  })
  // Merge scenario + baseline
  const merged = data.map((w, i) => ({ ...w, ...baselineData[i] }))

  return (
    <div style={s.grid}>
      {CHARTS.map(chart => (
        <div key={chart.title} style={s.card}>
          <div style={s.chartTitle}>{chart.title}</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={merged} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10 }}
                interval={weeks > 26 ? 3 : 1}
              />
              <YAxis
                tick={{ fontSize: 10 }}
                tickFormatter={tickFmt}
                width={42}
              />
              <Tooltip
                formatter={(val, name) => [`${val.toLocaleString('da-DK')} ${chart.unit}`, name]}
                labelFormatter={l => `Week ${l?.replace('W', '')}`}
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />

              {/* Event bands */}
              {bands.map((band, i) => (
                <ReferenceArea
                  key={i}
                  x1={`W${band.x1}`}
                  x2={`W${band.x2}`}
                  fill={band.color}
                  fillOpacity={0.12}
                />
              ))}

              {/* Baseline dashed line */}
              {chart.baseline && (
                <Line
                  type="monotone"
                  dataKey={`${chart.baseline}_base`}
                  name="Baseline"
                  stroke="#ccc"
                  strokeDasharray="4 4"
                  dot={false}
                  strokeWidth={1.5}
                />
              )}

              {/* Scenario lines */}
              {chart.keys.map(k => (
                <Line
                  key={k.key}
                  type="monotone"
                  dataKey={k.key}
                  name={k.label}
                  stroke={k.color}
                  dot={false}
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ))}
    </div>
  )
}
