const s = {
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 },
  card: (good) => ({
    background: '#fff', borderRadius: 10, padding: '14px 16px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    borderLeft: `4px solid ${good === null ? '#ccc' : good ? '#2a9d8f' : '#e63946'}`,
  }),
  label: { fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  value: { fontSize: 22, fontWeight: 700, color: '#1a1a2e' },
  delta: (pos) => ({
    fontSize: 12, fontWeight: 600, marginTop: 2,
    color: pos ? '#2a9d8f' : '#e63946',
  }),
}

function fmt(val, decimals = 0) {
  if (val === undefined || val === null || isNaN(val)) return '—'
  return val.toLocaleString('da-DK', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function sign(val) { return val >= 0 ? '+' : '' }

export default function SummaryCards({ summary, weeks }) {
  if (!summary) return null

  const cards = [
    {
      label: 'Avg Service Level',
      value: `${fmt(summary.avgServiceLevel, 1)}%`,
      delta: `${sign(summary.serviceLevelDelta)}${fmt(summary.serviceLevelDelta, 1)} pp vs baseline`,
      good: summary.serviceLevelDelta >= 0,
    },
    {
      label: `Revenue Impact (${weeks}w)`,
      value: `${sign(summary.revenueDelta)}${fmt(summary.revenueDelta)} TDKK`,
      delta: `${sign(summary.revenuePct)}${fmt(summary.revenuePct, 1)}% vs baseline`,
      good: summary.revenueDelta >= 0,
    },
    {
      label: `Gross Profit Impact (${weeks}w)`,
      value: `${sign(summary.grossProfitDelta)}${fmt(summary.grossProfitDelta)} TDKK`,
      delta: `${sign(summary.grossProfitPct)}${fmt(summary.grossProfitPct, 1)}% vs baseline`,
      good: summary.grossProfitDelta >= 0,
    },
    {
      label: `Extra COGS (${weeks}w)`,
      value: `${sign(summary.cogsDelta)}${fmt(summary.cogsDelta)} TDKK`,
      delta: 'vs baseline',
      good: summary.cogsDelta <= 0,
    },
    {
      label: `Extra Logistics (${weeks}w)`,
      value: `${sign(summary.logisticsDelta)}${fmt(summary.logisticsDelta)} TDKK`,
      delta: 'vs baseline',
      good: summary.logisticsDelta <= 0,
    },
    {
      label: `Extra Waste (${weeks}w)`,
      value: `${sign(summary.wasteDelta)}${fmt(summary.wasteDelta)} TDKK`,
      delta: 'vs baseline',
      good: summary.wasteDelta <= 0,
    },
  ]

  return (
    <div style={s.grid}>
      {cards.map(c => (
        <div key={c.label} style={s.card(c.good)}>
          <div style={s.label}>{c.label}</div>
          <div style={s.value}>{c.value}</div>
          <div style={s.delta(c.good)}>{c.delta}</div>
        </div>
      ))}
    </div>
  )
}
