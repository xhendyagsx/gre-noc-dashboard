import { useState } from 'react'
import { useNOCData } from '@/hooks/useNOCData'
import { NOCHeader } from '@/components/NOCHeader'
import { SiteCardsGrid } from '@/components/SiteCards'
import { BandwidthChart, LatencyChart, PacketLossChart } from '@/components/TrendCharts'
import { AvailabilityChart, AlertPanel } from '@/components/AvailabilityAndAlerts'

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700&family=JetBrains+Mono:wght@400;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #050d1a; color: #c8d8e8; min-height: 100vh; -webkit-font-smoothing: antialiased; }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: #0a1628; }
  ::-webkit-scrollbar-thumb { background: #1a2e42; border-radius: 2px; }
  @keyframes pulse { 0% { box-shadow: 0 0 0 0 currentColor; opacity:1; } 70% { box-shadow: 0 0 0 6px transparent; opacity:0.6; } 100% { box-shadow: 0 0 0 0 transparent; opacity:1; } }
  @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
  @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
  @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
  @keyframes shimmer { 0% { background-position:-200% 0; } 100% { background-position:200% 0; } }
  @media (max-width: 768px) { .noc-main-grid { grid-template-columns: 1fr !important; } }
`

function Skeleton({ h = 120 }: { h?: number }) {
  return <div style={{ height: h, background: '#0a1628', borderRadius: 10, opacity: 0.5 }} />
}

const TIME_RANGES = [
  { label: '6H', hours: 6 },
  { label: '12H', hours: 12 },
  { label: '24H', hours: 24 },
  { label: '48H', hours: 48 },
]

export default function NOCDashboard() {
  const [trendHours, setTrendHours] = useState(24)
  const [selectedSite, setSelectedSite] = useState<string | null>(null)

  const { sites, trendData, availability, alerts, lastUpdated, isLoading, error, refresh } = useNOCData(trendHours)

  const sitesUp = sites.filter(s => s.tunnel_status === 'up').length
  const sitesTotal = sites.length

  const handleSiteSelect = (id: string) => setSelectedSite(prev => prev === id ? null : id)

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ minHeight: '100vh', background: '#050d1a', display: 'flex', flexDirection: 'column' }}>

        <NOCHeader
          lastUpdated={lastUpdated} isLoading={isLoading} error={error} onRefresh={refresh}
          sitesUp={sitesUp} sitesTotal={sitesTotal} alertCount={alerts.length}
        />

        {error && (
          <div style={{ background: '#2a050a', borderBottom: '1px solid #ff3b5c44', padding: '8px 20px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#ff3b5c' }}>
            ⚠ SUPABASE ERROR: {error}
          </div>
        )}

        <main style={{ flex: 1, padding: '14px 16px', overflowY: 'auto' }}>

          {/* Time range + site filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#3a5a72', letterSpacing: 2 }}>TIME RANGE:</span>
            {TIME_RANGES.map(r => (
              <button key={r.hours} onClick={() => setTrendHours(r.hours)} style={{
                padding: '3px 12px', borderRadius: 4, fontSize: 11,
                fontFamily: "'JetBrains Mono', monospace", cursor: 'pointer',
                background: trendHours === r.hours ? '#00d4ff22' : 'transparent',
                color: trendHours === r.hours ? '#00d4ff' : '#3a5a72',
                border: `1px solid ${trendHours === r.hours ? '#00d4ff44' : '#1a2e42'}`,
              }}>{r.label}</button>
            ))}
            {selectedSite && (
              <button onClick={() => setSelectedSite(null)} style={{
                marginLeft: 'auto', padding: '3px 12px', borderRadius: 4, fontSize: 11,
                fontFamily: "'JetBrains Mono', monospace", cursor: 'pointer',
                background: '#f5a62311', color: '#f5a623', border: '1px solid #f5a62333',
              }}>✕ CLEAR: {selectedSite.toUpperCase()}</button>
            )}
          </div>

          {/* Main grid */}
          <div className="noc-main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 14, animation: 'fadeIn 0.4s ease' }}>

            {/* LEFT: Charts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {isLoading && sites.length === 0 ? <Skeleton h={160} /> : (
                <SiteCardsGrid sites={sites} selectedSite={selectedSite} onSelect={handleSiteSelect} />
              )}
              {isLoading && trendData.length === 0 ? <Skeleton h={180} /> : (
                <BandwidthChart trendData={trendData} selectedSite={selectedSite} trendHours={trendHours} />
              )}
              {isLoading && trendData.length === 0 ? <Skeleton h={160} /> : (
                <LatencyChart trendData={trendData} selectedSite={selectedSite} trendHours={trendHours} />
              )}
              {isLoading && trendData.length === 0 ? <Skeleton h={140} /> : (
                <PacketLossChart trendData={trendData} selectedSite={selectedSite} trendHours={trendHours} />
              )}
            </div>

            {/* RIGHT: Availability + Alerts + Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {isLoading && availability.length === 0 ? <Skeleton h={240} /> : (
                <AvailabilityChart data={availability} />
              )}
              <AlertPanel alerts={alerts} />
              <div style={{ background: 'linear-gradient(135deg, #0a1628 0%, #071020 100%)', border: '1px solid #1a2e42', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, letterSpacing: 3, color: '#3a5a72', marginBottom: 10 }}>NETWORK INFO</div>
                {[
                  ['TOPOLOGY',    'HUB-AND-SPOKE'],
                  ['HUB',         'Jakarta (Cisco ASR1001-X)'],
                  ['TUNNEL TYPE', 'GRE over Fiber'],
                  ['TUNNEL MTU',  '1476 bytes'],
                  ['SPOKE COUNT', '5 sites'],
                  ['VENDORS',     'Mikrotik + Cisco'],
                  ['STREAM',      'GitHub Actions · cron/1h'],
                  ['BACKEND',     'Supabase PostgreSQL'],
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

        <footer style={{ borderTop: '1px solid #1a2e42', padding: '6px 20px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#1a2e42', letterSpacing: 1 }}>GRE TUNNEL NOC DASHBOARD · AUTO-REFRESH 60s</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#1a2e42' }}>SUPABASE · TREMOR · BOLT.NEW</span>
        </footer>
      </div>
    </>
  )
}
