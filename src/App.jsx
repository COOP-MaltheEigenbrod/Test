import { useState, useMemo } from 'react'
import BaselineConfig from './components/BaselineConfig'
import EventBuilder from './components/EventBuilder'
import SummaryCards from './components/SummaryCards'
import KPICharts from './components/KPICharts'
import EventTimeline from './components/EventTimeline'
import { DEFAULT_BASELINE, runSimulation, computeSummary } from './simulation/engine'

const WEEK_OPTIONS = [13, 26, 52]

const s = {
  app: { minHeight: '100vh', background: '#f0f2f5' },
  header: {
    background: '#1a1a2e', color: '#fff', padding: '16px 32px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 20, fontWeight: 800, letterSpacing: 0.5 },
  headerSub: { fontSize: 12, color: '#aab' },
  weekToggle: { display: 'flex', gap: 6 },
  weekBtn: (active) => ({
    padding: '5px 12px', borderRadius: 16, border: '2px solid #fff',
    background: active ? '#fff' : 'transparent', color: active ? '#1a1a2e' : '#fff',
    cursor: 'pointer', fontSize: 12, fontWeight: 700,
  }),
  body: { display: 'flex', gap: 20, padding: 24, maxWidth: 1600, margin: '0 auto' },
  sidebar: { width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 },
  main: { flex: 1, display: 'flex', flexDirection: 'column', gap: 16 },
  sectionTitle: { fontSize: 13, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
}

export default function App() {
  const [baseline, setBaseline] = useState(DEFAULT_BASELINE)
  const [events, setEvents] = useState([])
  const [weeks, setWeeks] = useState(26)

  const simData = useMemo(
    () => runSimulation(baseline, events, weeks),
    [baseline, events, weeks]
  )

  const summary = useMemo(
    () => computeSummary(baseline, simData),
    [baseline, simData]
  )

  return (
    <div style={s.app}>
      <header style={s.header}>
        <div>
          <div style={s.headerTitle}>Coop Simulation Tool</div>
          <div style={s.headerSub}>Model how events impact Service Level, Revenue, Margin & Cost</div>
        </div>
        <div style={s.weekToggle}>
          {WEEK_OPTIONS.map(w => (
            <button key={w} style={s.weekBtn(weeks === w)} onClick={() => setWeeks(w)}>
              {w}W
            </button>
          ))}
        </div>
      </header>

      <div style={s.body}>
        {/* Sidebar: config + events */}
        <aside style={s.sidebar}>
          <BaselineConfig baseline={baseline} onChange={setBaseline} />
          <EventBuilder events={events} onChange={setEvents} />
        </aside>

        {/* Main: summary + timeline + charts */}
        <main style={s.main}>
          <div>
            <div style={s.sectionTitle}>Scenario Impact Summary</div>
            <SummaryCards summary={summary} weeks={weeks} />
          </div>

          <EventTimeline events={events} weeks={weeks} />

          <div>
            <div style={s.sectionTitle}>KPI Charts — Scenario vs Baseline</div>
            <KPICharts data={simData} baseline={baseline} events={events} weeks={weeks} />
          </div>
        </main>
      </div>
    </div>
  )
}
