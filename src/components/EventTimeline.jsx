import { EVENT_TYPES } from '../simulation/engine'

const s = {
  panel: { background: '#fff', borderRadius: 10, padding: '16px 12px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  title: { fontSize: 13, fontWeight: 700, color: '#1a1a2e', marginBottom: 12 },
  row: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 },
  label: { fontSize: 12, color: '#555', width: 120, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  track: { flex: 1, height: 18, background: '#f0f2f5', borderRadius: 4, position: 'relative' },
  bar: (left, width, color) => ({
    position: 'absolute', left: `${left}%`, width: `${Math.max(width, 1)}%`,
    height: '100%', background: color, borderRadius: 4, opacity: 0.85,
  }),
  empty: { color: '#aaa', fontSize: 12, textAlign: 'center', padding: 12 },
  weekLabels: { display: 'flex', marginLeft: 128, marginBottom: 4 },
  weekLabel: (pct) => ({ position: 'absolute', left: `${pct}%`, fontSize: 10, color: '#aaa', transform: 'translateX(-50%)' }),
  weekLabelsOuter: { flex: 1, position: 'relative', height: 16 },
}

export default function EventTimeline({ events, weeks }) {
  if (events.length === 0) {
    return (
      <div style={s.panel}>
        <div style={s.title}>Event Timeline</div>
        <div style={s.empty}>Add events to see the timeline</div>
      </div>
    )
  }

  const ticks = [1, Math.round(weeks * 0.25), Math.round(weeks * 0.5), Math.round(weeks * 0.75), weeks]

  return (
    <div style={s.panel}>
      <div style={s.title}>Event Timeline — {weeks} weeks</div>

      {/* Week tick labels */}
      <div style={s.row}>
        <div style={{ width: 120, flexShrink: 0 }} />
        <div style={s.weekLabelsOuter}>
          {ticks.map(t => (
            <span key={t} style={s.weekLabel(((t - 1) / (weeks - 1)) * 100)}>W{t}</span>
          ))}
        </div>
      </div>

      {events.map(event => {
        const def = EVENT_TYPES[event.type]
        const left = ((event.startWeek - 1) / weeks) * 100
        const width = (event.duration / weeks) * 100
        return (
          <div key={event.id} style={s.row}>
            <div style={s.label} title={event.name}>{def.icon} {event.name}</div>
            <div style={s.track}>
              <div style={s.bar(left, width, def.color)} title={`W${event.startWeek}–W${event.startWeek + event.duration - 1}`} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
