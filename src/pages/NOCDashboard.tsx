import { useState } from 'react'
import { useNOCData } from '@/hooks/useNOCData'
import { NOCHeader } from '@/components/NOCHeader'
import { SiteCardsGrid } from '@/components/SiteCards'
import { BandwidthChart, LatencyChart, PacketLossChart } from '@/components/TrendCharts'
import { AvailabilityChart, AlertPanel } from '@/components/AvailabilityAndAlerts'

// ── Global styles injected once ───────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700&family=JetBrains+Mono:wght@400;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: #050d1a;
    color: #c8d8e8;
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
  }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: #0a1628; }
  ::-webkit-scrollbar-thumb { background: #1a2e42; border-radius: 2px; }

  @keyframes pulse {
    0%   { box-shadow: 0 0 0 0 currentColor; opacity: 1; }
    70%  { box-shadow: 0 0 0 6px transparent; opacity: 0.6; }
    100% { box-shadow: 0 0 0 0 transparent; opacity: 1; }
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.3; }
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* Tremor dark overrides */
  .tremor-AreaChart-root,
  .tremor-LineChart-root,
  .tremor-BarChart-root {
    --tremor-background-default: transparent !important;
  }

  /* Responsive breakpoints */
  @media (max-width: 768px) {
    .noc-main-grid { grid-template-columns: 1fr !important; }
    .noc-charts-col { display: contents !important; }
  }
`

// ── Loading skeleton ──────────────────────────────────────────────────────────
function Skeleton({ h = 120 }: { h?: number }) {
  return (
    <div style={{
      height: h, background: 'linear-gradient(90deg, #0a1628 25%, #0f1e30 50%, #0a1628 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
      borderRadius: 10,
    }} />
  )
}

// ── Time range selector ────────────────────────────────────────────────────────
const TIME_RANGES = [
  { label: '6H',  hours: 6 },
  { label: '12H', hours: 12 },
  { label: '24H', hours: 24 },
  { label: '48H', hours: 48 },
]

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function NOCDashboard() {
  const [trendHours, setTrendHours] = useState(24)
  const [selectedSite, setSelectedSite] = useState<string | null>(null)

  const { sites, hourly, availability, alerts, lastUpdated, isLoading, error, refresh } = useNOCData(trendHours)

  const sitesUp    = sites.filter(s => s.tunnel_status === 'up').length
  const sitesTotal = sites.length

  const handleSiteSelect = (id: string) => {
    setSelectedSite(prev => prev === id ? null : id)
  }

  return (
    <>
      <style>{GLOBAL_CSS}</style>

      <div style={{ minHeight: '100vh', background: '#050d1a', display: 'flex', flexDirection: 'column' }}>

        {/* ── Header ── */}
        <NOCHeader
          lastUpdated={lastUpdated}
          isLoading={isLoading}
          error={error}
          onRefresh={refresh}
          sitesUp={sitesUp}
          sitesTotal={sitesTotal}
          alertCount={alerts.length}
        />

        {/* ── Error banner ── */}
        {error && (
          <div style={{
            background: '#2a050a', borderBottom: '1px solid #ff3b5c44',
            padding: '8px 20px',
            fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#ff3b5c',
          }}>
            ⚠ SUPABASE ERROR: {error} — check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env
          </div>
        )}

        {/* ── Body ── */}
        <main style={{ flex: 1, padding: '14px 16px', overflowY: 'auto' }}>

          {/* ── Time range selector ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#3a5a72', letterSpacing: 2 }}>
              TIME RANGE:
            </span>
            {TIME_RANGES.map(r => (
              <button
                key={r.hours}
                onClick={() => setTrendHours(r.hours)}
                style={{
                  padding: '3px 12px', borderRadius: 4, fontSize: 11,
                  fontFamily: "'JetBrains Mono', monospace", cursor: 'pointer',
                  background: trendHours === r.hours ? '#00d4ff22' : 'transparent',
                  color: trendHours === r.hours ? '#00d4ff' : '#3a5a72',
                  border: `1px solid ${trendHours === r.hours ? '#00d4ff44' : '#1a2e42'}`,
                  transition: 'all 0.15s',
                }}
              >
                {r.label}
              </button>
            ))}

            {selectedSite && (
              <button
                onClick={() => setSelectedSite(null)}
                style={{
                  marginLeft: 'auto', padding: '3px 12px', borderRadius: 4, fontSize: 11,
                  fontFamily: "'JetBrains Mono', monospace", cursor: 'pointer',
                  background: '#f5a62311', color: '#f5a623',
                  border: '1px solid #f5a62333',
                }}
              >
                ✕ CLEAR FILTER: {selectedSite.toUpperCase()}
              </button>
            )}
          </div>

          {/* ── Main grid: 2-column on desktop, stacked on mobile ── */}
          <div
            className="noc-main-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 340px',
              gap: 14,
              animation: 'fadeIn 0.4s ease',
            }}
          >
            {/* LEFT COLUMN: Charts */}
            <div className="noc-charts-col" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* KPI site cards */}
              {isLoading && sites.length === 0 ? (
                <Skeleton h={160} />
              ) : (
                <SiteCardsGrid
                  sites={sites}
                  selectedSite={selectedSite}
                  onSelect={handleSiteSelect}
                />
              )}

              {/* Bandwidth chart */}
              {isLoading && hourly.length === 0 ? (
                <Skeleton h={180} />
              ) : (
                <BandwidthChart hourly={hourly} selectedSite={selectedSite} />
              )}

              {/* Latency chart */}
              {isLoading && hourly.length === 0 ? (
                <Skeleton h={160} />
              ) : (
                <LatencyChart hourly={hourly} selectedSite={selectedSite} />
              )}

              {/* Packet loss chart */}
              {isLoading && hourly.length === 0 ? (
                <Skeleton h={140} />
              ) : (
                <PacketLossChart hourly={hourly} selectedSite={selectedSite} />
              )}
            </div>

            {/* RIGHT COLUMN: Availability + Alerts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* Availability */}
              {isLoading && availability.length === 0 ? (
                <Skeleton h={240} />
              ) : (
                <AvailabilityChart data={availability} />
              )}

              {/* Alert panel */}
              {isLoading && alerts.length === 0 ? (
                <Skeleton h={200} />
              ) : (
                <AlertPanel alerts={alerts} />
              )}

              {/* System info card */}
              <div style={{
                background: 'linear-gradient(135deg, #0a1628 0%, #071020 100%)',
                border: '1px solid #1a2e42',
                borderRadius: 10,
                padding: '14px 16px',
              }}>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, letterSpacing: 3, color: '#3a5a72', marginBottom: 10 }}>
                  NETWORK INFO
                </div>
                {[
                  ['TOPOLOGY',   'HUB-AND-SPOKE'],
                  ['HUB',        'Jakarta (Cisco ASR1001-X)'],
                  ['TUNNEL TYPE','GRE over Fiber'],
                  ['TUNNEL MTU', '1476 bytes'],
                  ['SPOKE COUNT','5 sites'],
                  ['VENDORS',    'Mikrotik + Cisco'],
                  ['STREAM',     'GitHub Actions · cron/1h'],
                  ['BACKEND',    'Supabase PostgreSQL'],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#3a5a72', letterSpacing: 1 }}>{k}</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#7ec8e3' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>

        {/* ── Footer ── */}
        <footer style={{
          borderTop: '1px solid #1a2e42',
          padding: '6px 20px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 4,
        }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#1a2e42', letterSpacing: 1 }}>
            GRE TUNNEL NOC DASHBOARD · AUTO-REFRESH 60s
          </span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#1a2e42' }}>
            SUPABASE · TREMOR · LOVABLE
          </span>
        </footer>
      </div>
    </>
  )
}
