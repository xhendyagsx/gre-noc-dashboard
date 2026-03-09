import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { type TunnelMetric } from '@/lib/supabase'

const SITES = [
  { id: 'sby', name: 'Surabaya',  color: '#00d4ff' },
  { id: 'bdg', name: 'Bandung',   color: '#00ff88' },
  { id: 'mdn', name: 'Medan',     color: '#4488ff' },
  { id: 'mks', name: 'Makassar',  color: '#ff8800' },
  { id: 'smg', name: 'Semarang',  color: '#aa44ff' },
]

function toLabel(recorded_at: string): string {
  return new Date(recorded_at).toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta',
  })
}

function buildSeries(
  data: TunnelMetric[],
  metric: keyof Pick<TunnelMetric, 'rx_mbps' | 'tx_mbps' | 'rtt_avg_ms' | 'packet_loss_pct'>,
  siteId: string | null
): Record<string, string | number>[] {
  const filtered = siteId ? data.filter(d => d.site_id === siteId) : data
  const buckets = new Map<string, Record<string, string | number>>()

  filtered.forEach(row => {
    const label = toLabel(row.recorded_at)
    if (!buckets.has(label)) buckets.set(label, { time: label })
    buckets.get(label)![row.site_name] = Number(Number(row[metric]).toFixed(3))
  })

  return Array.from(buckets.values())
}

function ChartPanel({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #0a1628 0%, #071020 100%)',
      border: '1px solid #1a2e42', borderRadius: 10, padding: '16px 18px',
    }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, letterSpacing: 3, color: '#3a5a72', marginBottom: 2 }}>
          {title}
        </div>
        {sub && <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#253a4a' }}>{sub}</div>}
      </div>
      {children}
    </div>
  )
}

function NoData() {
  return (
    <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#253a4a' }}>
        NO DATA IN SELECTED TIME RANGE
      </span>
    </div>
  )
}

const tooltipStyle = {
  backgroundColor: '#0a1628',
  border: '1px solid #1a2e42',
  borderRadius: 6,
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 11,
  color: '#c8d8e8',
}

interface ChartsProps {
  trendData: TunnelMetric[]
  selectedSite: string | null
  trendHours: number
}

export function BandwidthChart({ trendData, selectedSite, trendHours }: ChartsProps) {
  const data = buildSeries(trendData, 'rx_mbps', selectedSite)
  const activeSites = selectedSite ? SITES.filter(s => s.id === selectedSite) : SITES

  return (
    <ChartPanel
      title="INBOUND BANDWIDTH (RX)"
      sub={`${selectedSite ? selectedSite.toUpperCase() : 'ALL SITES'} · ${trendHours}H`}
    >
      {data.length === 0 ? <NoData /> : (
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a2e42" />
            <XAxis dataKey="time" tick={{ fill: '#3a5a72', fontSize: 10 }} stroke="#1a2e42" interval="preserveStartEnd" />
            <YAxis tick={{ fill: '#3a5a72', fontSize: 10 }} stroke="#1a2e42" unit=" Mbps" width={65} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v.toFixed(1)} Mbps`]} />
            <Legend wrapperStyle={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#3a5a72' }} />
            {activeSites.map(s => (
              <Area key={s.id} type="monotone" dataKey={s.name}
                stroke={s.color} fill={s.color} fillOpacity={0.08}
                strokeWidth={1.5} dot={false} connectNulls />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      )}
    </ChartPanel>
  )
}

export function LatencyChart({ trendData, selectedSite, trendHours }: ChartsProps) {
  const data = buildSeries(trendData, 'rtt_avg_ms', selectedSite)
  const activeSites = selectedSite ? SITES.filter(s => s.id === selectedSite) : SITES

  return (
    <ChartPanel title="LATENCY (RTT AVG)" sub="ms · lower is better">
      {data.length === 0 ? <NoData /> : (
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a2e42" />
            <XAxis dataKey="time" tick={{ fill: '#3a5a72', fontSize: 10 }} stroke="#1a2e42" interval="preserveStartEnd" />
            <YAxis tick={{ fill: '#3a5a72', fontSize: 10 }} stroke="#1a2e42" unit=" ms" width={50} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v.toFixed(1)} ms`]} />
            <Legend wrapperStyle={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#3a5a72' }} />
            {activeSites.map(s => (
              <Line key={s.id} type="monotone" dataKey={s.name}
                stroke={s.color} strokeWidth={1.5} dot={false} connectNulls />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartPanel>
  )
}

export function PacketLossChart({ trendData, selectedSite, trendHours }: ChartsProps) {
  const data = buildSeries(trendData, 'packet_loss_pct', selectedSite)
  const activeSites = selectedSite ? SITES.filter(s => s.id === selectedSite) : SITES

  return (
    <ChartPanel title="PACKET LOSS %" sub="threshold: >1% = alert">
      {data.length === 0 ? <NoData /> : (
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a2e42" />
            <XAxis dataKey="time" tick={{ fill: '#3a5a72', fontSize: 10 }} stroke="#1a2e42" interval="preserveStartEnd" />
            <YAxis tick={{ fill: '#3a5a72', fontSize: 10 }} stroke="#1a2e42" unit="%" width={45} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v.toFixed(3)}%`]} />
            <Legend wrapperStyle={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#3a5a72' }} />
            {activeSites.map(s => (
              <Area key={s.id} type="monotone" dataKey={s.name}
                stroke={s.color} fill={s.color} fillOpacity={0.08}
                strokeWidth={1.5} dot={false} connectNulls />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      )}
    </ChartPanel>
  )
}
