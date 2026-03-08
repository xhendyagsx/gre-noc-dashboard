import { useState, useEffect } from 'react'

interface HeaderProps {
  lastUpdated: Date | null
  isLoading: boolean
  error: string | null
  onRefresh: () => void
  sitesUp: number
  sitesTotal: number
  alertCount: number
}

export function NOCHeader({
  lastUpdated, isLoading, error, onRefresh,
  sitesUp, sitesTotal, alertCount,
}: HeaderProps) {
  const [clock, setClock] = useState('')

  useEffect(() => {
    const tick = () => {
      setClock(new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        timeZone: 'Asia/Jakarta',
      }))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const allUp = sitesUp === sitesTotal
  const lastStr = lastUpdated
    ? lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Jakarta' })
    : '—'

  return (
    <header style={{
      background: 'linear-gradient(90deg, #00d4ff08 0%, #050d1a 40%, #050d1a 60%, #00d4ff08 100%)',
      borderBottom: '1px solid #1a2e42',
      padding: '10px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 10,
    }}>
      {/* Left: Branding */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Animated radar icon */}
        <div style={{ position: 'relative', width: 28, height: 28 }}>
          <div style={{
            position: 'absolute', inset: 0,
            border: '1.5px solid #00d4ff44', borderRadius: '50%',
            animation: 'spin 4s linear infinite',
          }} />
          <div style={{
            position: 'absolute', inset: 4,
            border: '1px solid #00d4ff22', borderRadius: '50%',
          }} />
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            width: 3, height: 3, borderRadius: '50%',
            background: '#00d4ff', transform: 'translate(-50%, -50%)',
          }} />
        </div>
        <div>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 20, fontWeight: 700, letterSpacing: 3,
            color: '#e8f4ff',
          }}>
            GRE TUNNEL NOC
          </div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9, letterSpacing: 2, color: '#3a5a72',
          }}>
            HUB-AND-SPOKE · JAKARTA PUSAT · WIB (UTC+7)
          </div>
        </div>
      </div>

      {/* Center: Status pills */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <StatusPill
          label="SITES"
          value={`${sitesUp}/${sitesTotal}`}
          color={allUp ? '#00e87a' : '#ff3b5c'}
        />
        <StatusPill
          label="ALERTS"
          value={String(alertCount)}
          color={alertCount === 0 ? '#00e87a' : '#f5a623'}
          blink={alertCount > 0}
        />
        <StatusPill
          label="SYNC"
          value={isLoading ? 'SYNCING' : error ? 'ERR' : 'LIVE'}
          color={error ? '#ff3b5c' : isLoading ? '#f5a623' : '#00e87a'}
        />
      </div>

      {/* Right: Clock + refresh */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 22, fontWeight: 700, color: '#00d4ff', letterSpacing: 2,
            lineHeight: 1,
          }}>
            {clock}
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#3a5a72', marginTop: 2 }}>
            LAST SYNC: {lastStr} WIB
          </div>
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          style={{
            background: 'transparent', border: '1px solid #1a2e42',
            borderRadius: 6, padding: '6px 10px', cursor: 'pointer',
            color: '#3a5a72', fontSize: 14,
            transition: 'all 0.2s',
          }}
          title="Force refresh"
        >
          ↺
        </button>
      </div>
    </header>
  )
}

function StatusPill({ label, value, color, blink }: {
  label: string; value: string; color: string; blink?: boolean
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', borderRadius: 20,
      background: `${color}11`, border: `1px solid ${color}33`,
    }}>
      <div style={{
        width: 5, height: 5, borderRadius: '50%', background: color,
        animation: blink ? 'pulse 1s infinite' : 'none',
      }} />
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#3a5a72', letterSpacing: 1 }}>
        {label}
      </span>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color }}>
        {value}
      </span>
    </div>
  )
}
