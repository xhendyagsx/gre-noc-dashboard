import { type SiteLatest } from '@/lib/supabase'

const VENDOR_COLOR: Record<string, string> = {
  mikrotik: '#e05c00',
  cisco:    '#0070c0',
}

function UptimeBar({ pct }: { pct: number }) {
  const color = pct >= 99.5 ? '#00e87a' : pct >= 98 ? '#f5a623' : '#ff3b5c'
  return (
    <div style={{ height: 3, background: '#1a2a3a', borderRadius: 2, marginTop: 6 }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width 0.6s ease' }} />
    </div>
  )
}

interface SiteCardProps {
  site: SiteLatest
  selected: boolean
  onClick: () => void
}

export function SiteCard({ site, selected, onClick }: SiteCardProps) {
  const isUp = site.tunnel_status === 'up'
  const vendorColor = VENDOR_COLOR[site.device_vendor] ?? '#888'
  const lossWarn = site.packet_loss_pct > 1
  const rttWarn  = site.rtt_avg_ms > 50

  return (
    <button
      onClick={onClick}
      style={{
        background: selected
          ? 'linear-gradient(135deg, #00243a 0%, #001c2e 100%)'
          : 'linear-gradient(135deg, #0a1628 0%, #071020 100%)',
        border: `1px solid ${selected ? '#00d4ff' : isUp ? '#0f3a1f' : '#4a0a0a'}`,
        borderRadius: 10,
        padding: '14px 16px',
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
        transition: 'all 0.2s',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Pulse ring when down */}
      {!isUp && (
        <span style={{
          position: 'absolute', top: 10, right: 10,
          width: 10, height: 10, borderRadius: '50%',
          background: '#ff3b5c',
          boxShadow: '0 0 0 0 #ff3b5c66',
          animation: 'pulse 1.4s infinite',
        }} />
      )}

      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: vendorColor, letterSpacing: 2, marginBottom: 3 }}>
            {site.device_vendor.toUpperCase()}
          </div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 700, color: '#e8f4ff', letterSpacing: 1 }}>
            {site.site_name.toUpperCase()}
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#3a5a72', marginTop: 2 }}>
            {site.device_model}
          </div>
        </div>
        <div style={{
          padding: '3px 9px', borderRadius: 4, fontSize: 11,
          fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, letterSpacing: 1,
          background: isUp ? '#00331500' : '#33000000',
          border: `1px solid ${isUp ? '#00e87a' : '#ff3b5c'}`,
          color: isUp ? '#00e87a' : '#ff3b5c',
        }}>
          {isUp ? '▲ UP' : '▼ DOWN'}
        </div>
      </div>

      {/* Metrics grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px' }}>
        <Metric label="RX" value={`${site.rx_mbps?.toFixed(1)}`} unit="Mbps" color="#00d4ff" />
        <Metric label="TX" value={`${site.tx_mbps?.toFixed(1)}`} unit="Mbps" color="#4a9fd4" />
        <Metric label="RTT" value={`${site.rtt_avg_ms}`} unit="ms" color={rttWarn ? '#f5a623' : '#00cc88'} warn={rttWarn} />
        <Metric label="LOSS" value={`${site.packet_loss_pct}`} unit="%" color={lossWarn ? '#ff3b5c' : '#00cc88'} warn={lossWarn} />
      </div>

      {/* CPU / MEM bar */}
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <MiniBar label="CPU" value={site.cpu_load_pct} />
        <MiniBar label="MEM" value={site.mem_used_pct} />
      </div>

      <UptimeBar pct={isUp ? 99.8 : 0} />

      {/* Timestamp */}
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#253a4a', marginTop: 6 }}>
        {site.prtg_timestamp}
      </div>
    </button>
  )
}

function Metric({ label, value, unit, color, warn }: { label: string; value: string; unit: string; color: string; warn?: boolean }) {
  return (
    <div style={{ background: '#05101a', borderRadius: 6, padding: '5px 8px', border: warn ? '1px solid #ff3b5c33' : 'none' }}>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#3a5a72', letterSpacing: 1 }}>{label}</div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 700, color }}>
        {value}<span style={{ fontSize: 9, color: '#3a5a72', marginLeft: 2 }}>{unit}</span>
      </div>
    </div>
  )
}

function MiniBar({ label, value }: { label: string; value: number }) {
  const color = value > 80 ? '#ff3b5c' : value > 60 ? '#f5a623' : '#00cc88'
  return (
    <div style={{ flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#3a5a72' }}>{label}</span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color }}>{value?.toFixed(0)}%</span>
      </div>
      <div style={{ height: 3, background: '#1a2a3a', borderRadius: 2 }}>
        <div style={{ height: '100%', width: `${value}%`, background: color, borderRadius: 2, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  )
}

interface SiteCardsGridProps {
  sites: SiteLatest[]
  selectedSite: string | null
  onSelect: (id: string) => void
}

export function SiteCardsGrid({ sites, selectedSite, onSelect }: SiteCardsGridProps) {
  const downCount = sites.filter(s => s.tunnel_status === 'down').length

  return (
    <div>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, letterSpacing: 3, color: '#3a5a72' }}>
          SPOKE SITES — {sites.length} NODES
        </div>
        {downCount > 0 && (
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#ff3b5c', animation: 'blink 1s step-end infinite' }}>
            ⚠ {downCount} SITE{downCount > 1 ? 'S' : ''} DOWN
          </div>
        )}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: 10,
      }}>
        {sites.map(site => (
          <SiteCard
            key={site.site_id}
            site={site}
            selected={selectedSite === site.site_id}
            onClick={() => onSelect(site.site_id)}
          />
        ))}
      </div>
    </div>
  )
}
