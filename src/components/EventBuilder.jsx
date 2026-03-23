import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { EVENT_TYPES } from '../simulation/engine'

const IMPACT_FIELDS = [
  { key: 'serviceLevelDelta',  label: 'Service Level',     unit: 'pp',    min: -50, max: 50,  step: 0.5 },
  { key: 'revenueFactor',      label: 'Revenue Factor',    unit: '×',     min: 0.5, max: 2.0, step: 0.01, isMultiplier: true },
  { key: 'grossMarginDelta',   label: 'Gross Margin',      unit: 'pp',    min: -20, max: 20,  step: 0.5 },
  { key: 'cogsDelta',          label: 'COGS',              unit: 'pp',    min: -20, max: 20,  step: 0.5 },
  { key: 'logisticsCostDelta', label: 'Logistics Cost',    unit: 'pp',    min: -10, max: 20,  step: 0.5 },
  { key: 'wasteDelta',         label: 'Waste',             unit: 'pp',    min: -10, max: 20,  step: 0.5 },
  { key: 'inventoryDaysDelta', label: 'Inventory Days',    unit: 'days',  min: -30, max: 30,  step: 1 },
]

function buildDefaultEvent(type) {
  const def = EVENT_TYPES[type]
  return {
    id: uuidv4(),
    name: def.label,
    type,
    startWeek: 1,
    duration: 4,
    impacts: { ...def.defaultImpacts },
  }
}

const s = {
  panel: { background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  title: { fontSize: 14, fontWeight: 700, color: '#1a1a2e', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 },
  addRow: { display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  typeBtn: (color, active) => ({
    padding: '6px 12px', borderRadius: 20, border: `2px solid ${color}`,
    background: active ? color : '#fff', color: active ? '#fff' : color,
    cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all .15s',
  }),
  addBtn: {
    padding: '6px 16px', borderRadius: 20, background: '#1a1a2e', color: '#fff',
    border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
  },
  eventCard: (color) => ({
    border: `2px solid ${color}`, borderRadius: 10, padding: 14, marginBottom: 12,
    background: '#fafafa',
  }),
  eventHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, gap: 8 },
  nameInput: { flex: 1, padding: '4px 8px', borderRadius: 6, border: '1px solid #ddd', fontSize: 13, fontWeight: 600 },
  removeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#e63946', fontWeight: 700, fontSize: 16 },
  timing: { display: 'flex', gap: 12, marginBottom: 10, flexWrap: 'wrap' },
  timingField: { display: 'flex', flexDirection: 'column', gap: 3 },
  timingLabel: { fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 },
  timingInput: { width: 80, padding: '4px 8px', borderRadius: 6, border: '1px solid #ddd', fontSize: 13, textAlign: 'right' },
  impactGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px' },
  impactRow: { display: 'flex', alignItems: 'center', gap: 6 },
  impactLabel: { fontSize: 11, color: '#666', flex: 1, minWidth: 90 },
  impactInput: { width: 70, padding: '3px 6px', borderRadius: 5, border: '1px solid #ddd', fontSize: 12, textAlign: 'right' },
  impactUnit: { fontSize: 11, color: '#999', width: 30 },
  badge: (color) => ({
    display: 'inline-block', padding: '2px 8px', borderRadius: 12, background: color,
    color: '#fff', fontSize: 11, fontWeight: 700, marginRight: 6,
  }),
  toggleImpacts: { fontSize: 11, color: '#457b9d', cursor: 'pointer', marginBottom: 6, display: 'inline-block' },
}

function EventCard({ event, onUpdate, onRemove }) {
  const [showImpacts, setShowImpacts] = useState(false)
  const def = EVENT_TYPES[event.type]
  const color = def.color

  const update = (patch) => onUpdate({ ...event, ...patch })
  const updateImpact = (key, val) => onUpdate({ ...event, impacts: { ...event.impacts, [key]: val } })

  return (
    <div style={s.eventCard(color)}>
      <div style={s.eventHeader}>
        <span style={s.badge(color)}>{def.icon} {def.label}</span>
        <input
          style={s.nameInput}
          value={event.name}
          onChange={e => update({ name: e.target.value })}
          placeholder="Event name"
        />
        <button style={s.removeBtn} onClick={onRemove}>×</button>
      </div>

      <div style={s.timing}>
        <div style={s.timingField}>
          <span style={s.timingLabel}>Start Week</span>
          <input
            type="number" style={s.timingInput} min={1} max={52}
            value={event.startWeek}
            onChange={e => update({ startWeek: Math.max(1, parseInt(e.target.value) || 1) })}
          />
        </div>
        <div style={s.timingField}>
          <span style={s.timingLabel}>Duration (wks)</span>
          <input
            type="number" style={s.timingInput} min={1} max={52}
            value={event.duration}
            onChange={e => update({ duration: Math.max(1, parseInt(e.target.value) || 1) })}
          />
        </div>
        <div style={s.timingField}>
          <span style={s.timingLabel}>End Week</span>
          <span style={{ ...s.timingInput, background: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            {event.startWeek + event.duration - 1}
          </span>
        </div>
      </div>

      <span style={s.toggleImpacts} onClick={() => setShowImpacts(v => !v)}>
        {showImpacts ? '▲ Hide impacts' : '▼ Edit impacts'}
      </span>

      {showImpacts && (
        <div style={s.impactGrid}>
          {IMPACT_FIELDS.map(f => (
            <div key={f.key} style={s.impactRow}>
              <span style={s.impactLabel}>{f.label}</span>
              <input
                type="number"
                style={s.impactInput}
                min={f.min} max={f.max} step={f.step}
                value={event.impacts[f.key] ?? (f.isMultiplier ? 1 : 0)}
                onChange={e => updateImpact(f.key, parseFloat(e.target.value) || 0)}
              />
              <span style={s.impactUnit}>{f.unit}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function EventBuilder({ events, onChange }) {
  const [selectedType, setSelectedType] = useState('strike')

  const addEvent = () => {
    onChange([...events, buildDefaultEvent(selectedType)])
  }

  const updateEvent = (id, updated) => {
    onChange(events.map(e => e.id === id ? updated : e))
  }

  const removeEvent = (id) => {
    onChange(events.filter(e => e.id !== id))
  }

  return (
    <div style={s.panel}>
      <div style={s.title}>Events</div>

      <div style={s.addRow}>
        {Object.entries(EVENT_TYPES).map(([key, def]) => (
          <button
            key={key}
            style={s.typeBtn(def.color, selectedType === key)}
            onClick={() => setSelectedType(key)}
          >
            {def.icon} {def.label}
          </button>
        ))}
      </div>

      <button style={s.addBtn} onClick={addEvent}>+ Add Event</button>

      <div style={{ marginTop: 16 }}>
        {events.length === 0 && (
          <p style={{ color: '#aaa', fontSize: 13, textAlign: 'center', padding: 20 }}>
            No events yet. Select a type and click "Add Event".
          </p>
        )}
        {events.map(event => (
          <EventCard
            key={event.id}
            event={event}
            onUpdate={updated => updateEvent(event.id, updated)}
            onRemove={() => removeEvent(event.id)}
          />
        ))}
      </div>
    </div>
  )
}
