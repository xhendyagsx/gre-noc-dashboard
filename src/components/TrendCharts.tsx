import { AreaChart, LineChart, Title, Text } from '@tremor/react'
import { type HourlyAgg } from '@/lib/supabase'

// ── Color mapping per site ────────────────────────────────────────────────────
const SITE_COLORS: Record<string, string> = {
  sby: 'cyan',
  bdg: 'emerald',
  mdn: 'blue',
  mks: 'orange',
  smg: 'violet',
}

// ── Transform hourly agg data into Tremor-compatible format ──────────────────

/** Bandwidth chart: one data point per hour_bucket, columns per site */
function buildBandwidthSeries(hourly: HourlyAgg[], metric: 'avg_rx_mbps' | 'avg_tx_mbps') {
  const buckets = new Map<string, Record<string, number>>()

  hourly.forEach(row => {
    const label = new Date(row.hour_bucket).toLocaleTimeString('id-ID', {
      hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta',
    })
    if (!buckets.has(label)) buckets.set(label, { time: label } as Record<string, number>)
    buckets.get(label)![row.site_name] = Number(row[metric])
  })

  return Array.from(buckets.values())
}

function buildLatencySeries(hourly: HourlyAgg[]) {
  const buckets = new Map<string, Record<string, number>>()

  hourly.forEach(row => {
    const label = new Date(row.hour_bucket).toLocaleTimeString('id-ID', {
      hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta',
    })
    if (!buckets.has(label)) buckets.set(label, { time: label } as Record<string, number>)
    buckets.get(label)![`${row.site_name} RTT`] = Number(row.avg_rtt_ms)
    buckets.get(label)![`${row.site_name} Loss`] = Number(row.avg_loss_pct) * 10 // scale for readability
  })

  return Array.from(buckets.values())
}

function buildLossSeries(hourly: HourlyAgg[]) {
  const buckets = new Map<string, Record<string, number>>()

  hourly.forEach(row => {
    const label = new Date(row.hour_bucket).toLocaleTimeString('id-ID', {
      hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta',
    })
    if (!buckets.has(label)) buckets.set(label, { time: label } as Record<string, number>)
    buckets.get(label)![row.site_name] = Number(row.avg_loss_pct)
  })

  return Array.from(buckets.values())
}

// ── Chart panel wrapper ───────────────────────────────────────────────────────
function ChartPanel({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #0a1628 0%, #071020 100%)',
      border: '1px solid #1a2e42',
      borderRadius: 10,
      padding: '16px 18px',
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

// ── Individual chart components ───────────────────────────────────────────────

interface ChartsProps {
  hourly: HourlyAgg[]
  selectedSite: string | null
}

export function BandwidthChart({ hourly, selectedSite }: ChartsProps) {
  const filtered = selectedSite ? hourly.filter(h => h.site_id === selectedSite) : hourly
  const data = buildBandwidthSeries(filtered, 'avg_rx_mbps')
  const sites = [...new Set(filtered.map(h => h.site_name))]
  const colors = sites.map(s => {
    const id = filtered.find(h => h.site_name === s)?.site_id ?? ''
    return SITE_COLORS[id] ?? 'slate'
  })

  return (
    <ChartPanel
      title="INBOUND BANDWIDTH (RX)"
      sub={selectedSite ? `SITE: ${selectedSite.toUpperCase()}` : 'ALL SITES · 24H'}
    >
      <AreaChart
        data={data}
        index="time"
        categories={sites}
        colors={colors}
        valueFormatter={v => `${v.toFixed(1)} Mbps`}
        showLegend={!selectedSite}
        showGridLines={false}
        curveType="monotone"
        className="h-40"
        style={{ '--tremor-background-default': 'transparent' } as React.CSSProperties}
      />
    </ChartPanel>
  )
}

export function LatencyChart({ hourly, selectedSite }: ChartsProps) {
  const filtered = selectedSite ? hourly.filter(h => h.site_id === selectedSite) : hourly
  const buckets = new Map<string, Record<string, number>>()

  filtered.forEach(row => {
    const label = new Date(row.hour_bucket).toLocaleTimeString('id-ID', {
      hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta',
    })
    if (!buckets.has(label)) buckets.set(label, { time: label } as Record<string, number>)
    buckets.get(label)![row.site_name] = Number(row.avg_rtt_ms)
  })

  const data = Array.from(buckets.values())
  const sites = [...new Set(filtered.map(h => h.site_name))]
  const colors = sites.map(s => {
    const id = filtered.find(h => h.site_name === s)?.site_id ?? ''
    return SITE_COLORS[id] ?? 'slate'
  })

  return (
    <ChartPanel title="LATENCY (RTT AVG)" sub="ms · lower is better">
      <LineChart
        data={data}
        index="time"
        categories={sites}
        colors={colors}
        valueFormatter={v => `${v.toFixed(1)} ms`}
        showLegend={!selectedSite}
        showGridLines={false}
        curveType="monotone"
        className="h-40"
      />
    </ChartPanel>
  )
}

export function PacketLossChart({ hourly, selectedSite }: ChartsProps) {
  const filtered = selectedSite ? hourly.filter(h => h.site_id === selectedSite) : hourly
  const data = buildLossSeries(filtered)
  const sites = [...new Set(filtered.map(h => h.site_name))]
  const colors = sites.map(s => {
    const id = filtered.find(h => h.site_name === s)?.site_id ?? ''
    return SITE_COLORS[id] ?? 'slate'
  })

  return (
    <ChartPanel title="PACKET LOSS %" sub="threshold: >1% = alert">
      <AreaChart
        data={data}
        index="time"
        categories={sites}
        colors={colors}
        valueFormatter={v => `${v.toFixed(3)}%`}
        showLegend={!selectedSite}
        showGridLines={false}
        curveType="monotone"
        className="h-36"
      />
    </ChartPanel>
  )
}
