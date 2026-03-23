import { useState } from 'react'

const s = {
  panel: { background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  title: { fontSize: 14, fontWeight: 700, color: '#1a1a2e', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 },
  row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 8 },
  label: { fontSize: 13, color: '#555', flex: 1 },
  input: {
    width: 90, padding: '4px 8px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13,
    textAlign: 'right', background: '#fafafa',
  },
  unit: { fontSize: 12, color: '#888', width: 36 },
}

const FIELDS = [
  { key: 'serviceLevel',   label: 'Service Level',     unit: '%',         min: 0,   max: 100,  step: 0.1 },
  { key: 'revenue',        label: 'Weekly Revenue',    unit: 'DKK 000s',  min: 0,   max: 1e9,  step: 1000 },
  { key: 'grossMargin',    label: 'Gross Margin',      unit: '%',         min: 0,   max: 100,  step: 0.1 },
  { key: 'cogs',           label: 'COGS',              unit: '% rev',     min: 0,   max: 100,  step: 0.1 },
  { key: 'logisticsCost',  label: 'Logistics Cost',    unit: '% rev',     min: 0,   max: 30,   step: 0.1 },
  { key: 'waste',          label: 'Waste / Shrinkage', unit: '% rev',     min: 0,   max: 20,   step: 0.1 },
  { key: 'inventoryDays',  label: 'Inventory Days',    unit: 'days',      min: 0,   max: 365,  step: 1 },
]

export default function BaselineConfig({ baseline, onChange }) {
  const [open, setOpen] = useState(true)

  return (
    <div style={s.panel}>
      <div
        style={{ ...s.title, cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
        onClick={() => setOpen(o => !o)}
      >
        <span>Baseline KPIs</span>
        <span style={{ fontWeight: 400, fontSize: 13 }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && FIELDS.map(f => (
        <div key={f.key} style={s.row}>
          <span style={s.label}>{f.label}</span>
          <input
            type="number"
            style={s.input}
            value={baseline[f.key]}
            min={f.min}
            max={f.max}
            step={f.step}
            onChange={e => onChange({ ...baseline, [f.key]: parseFloat(e.target.value) || 0 })}
          />
          <span style={s.unit}>{f.unit}</span>
        </div>
      ))}
    </div>
  )
}
