import { BarChart } from '@tremor/react'
import { type SiteAvailability, type TunnelMetric } from '@/lib/supabase'

// ── Availability BarChart ────────────────────────────────────────────────────

export function AvailabilityChart({ data }: { data: SiteAvailability[] }) {
  const chartData = data.map(d => ({
    site: d.site_name,
    'Availability %': Number(d.availability_pct?.toFixed(2) ?? 0),
    vendor: d.device_vendor,
  }))

  const valueFormatter = (v: number) => `${v.toFixed(2)}%`

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0a1628 0%, #071020 100%)',
      border: '1px solid #1a2e42',
      borderRadius: 10,
      padding: '16px 18px',
    }}>
      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, letterSpacing: 3, color: '#3a5a72', marginBottom: 4 }}>
        TUNNEL AVAILABILITY
      </div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#253a4a', marginBottom: 12 }}>
        % UPTIME · SINCE FIRST RECORD
      </div>

      <BarChart
        data={chartData}
        index="site"
        categories={['Availability %']}
        colors={['cyan']}
        valueFormatter={valueFormatter}
        showGridLines={false}
        layout="vertical"
        className="h-44"
      />

      {/* SLA reference line label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
        <div style={{ width: 16, height: 1, background: '#ff3b5c', borderTop: '1px dashed #ff3b5c' }} />
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#ff3b5c' }}>
          SLA TARGET: 99.5%
        </span>
      </div>
    </div>
  )
}

// ── Alert Panel ───────────────────────────────────────────────────────────────

const ALERT_RULES = [
  { key: 'tunnel_status', label: 'TUNNEL DOWN', check: (r: TunnelMetric) => r.tunnel_status === 'down', severity: 'critical' as const },
  { key: 'packet_loss', label: 'PACKET LOSS >1%', check: (r: TunnelMetric) => r.packet_loss_pct > 1, severity: 'warning' as const },
  { key: 'rtt_high', label: 'HIGH LATENCY >60ms', check: (r: TunnelMetric) => r.rtt_avg_ms > 60, severity: 'warning' as const },
  { key: 'cpu_high', label: 'CPU >85%', check: (r: TunnelMetric) => r.cpu_load_pct > 85, severity: 'info' as const },
]

const SEVERITY_STYLE = {
  critical: { border: '#ff3b5c', bg: '#2a050a', color: '#ff3b5c', dot: '#ff3b5c' },
  warning:  { border: '#f5a623', bg: '#1f1200', color: '#f5a623', dot: '#f5a623' },
  info:     { border: '#4a9fd4', bg: '#001a2a', color: '#4a9fd4', dot: '#4a9fd4' },
}

interface AlertRowProps {
  record: TunnelMetric
  rule: typeof ALERT_RULES[0]
}

function AlertRow({ record, rule }: AlertRowProps) {
  const s = SEVERITY_STYLE[rule.severity]
  const ts = new Date(record.recorded_at).toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta',
  })

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '7px 10px', borderRadius: 6, marginBottom: 4,
      background: s.bg, border: `1px solid ${s.border}22`,
    }}>
      <div style={{
        width: 6, height: 6, borderRadius: '50%', background: s.dot, flexShrink: 0,
        animation: rule.severity === 'critical' ? 'pulse 1s infinite' : 'none',
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: s.color, letterSpacing: 1 }}>
            {rule.label}
          </span>
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, color: '#7ec8e3', fontWeight: 600 }}>
            {record.site_name.toUpperCase()}
          </span>
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#3a5a72', marginTop: 1 }}>
          {ts} WIB · {record.device_vendor} · {record.device_model}
          {rule.key === 'packet_loss' && ` · loss=${record.packet_loss_pct}%`}
          {rule.key === 'rtt_high' && ` · rtt=${record.rtt_avg_ms}ms`}
          {rule.key === 'cpu_high' && ` · cpu=${record.cpu_load_pct}%`}
        </div>
      </div>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: s.color,
        padding: '2px 6px', borderRadius: 3, border: `1px solid ${s.border}44`,
        textTransform: 'uppercase', flexShrink: 0,
      }}>
        {rule.severity}
      </div>
    </div>
  )
}

export function AlertPanel({ alerts }: { alerts: TunnelMetric[] }) {
  // Deduplicate: match each alert record against rules
  const rows: { record: TunnelMetric; rule: typeof ALERT_RULES[0] }[] = []
  alerts.forEach(record => {
    ALERT_RULES.forEach(rule => {
      if (rule.check(record)) rows.push({ record, rule })
    })
  })

  const criticalCount = rows.filter(r => r.rule.severity === 'critical').length

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0a1628 0%, #071020 100%)',
      border: `1px solid ${criticalCount > 0 ? '#ff3b5c44' : '#1a2e42'}`,
      borderRadius: 10,
      padding: '16px 18px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, letterSpacing: 3, color: '#3a5a72' }}>
            ACTIVE ALERTS
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#253a4a' }}>
            LAST 60 MINUTES
          </div>
        </div>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 700,
          color: criticalCount > 0 ? '#ff3b5c' : '#00e87a',
        }}>
          {rows.length}
        </div>
      </div>

      {rows.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: 24 }}>✓</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#00e87a', marginTop: 4 }}>
            ALL SYSTEMS NOMINAL
          </div>
        </div>
      ) : (
        <div style={{ maxHeight: 220, overflowY: 'auto' }}>
          {rows.map((r, i) => (
            <AlertRow key={i} record={r.record} rule={r.rule} />
          ))}
        </div>
      )}
    </div>
  )
}
