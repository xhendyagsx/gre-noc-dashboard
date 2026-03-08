import { createClient } from '@supabase/supabase-js'

// These are injected by Lovable when you connect your Supabase project
// via the Lovable UI (Settings → Supabase Integration)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ── Types ────────────────────────────────────────────────────────────────────

export interface TunnelMetric {
  id: number
  prtg_timestamp: string
  recorded_at: string
  site_id: string
  site_name: string
  device_vendor: 'mikrotik' | 'cisco'
  device_model: string
  tunnel_status: 'up' | 'down'
  tunnel_src_ip: string
  tunnel_dst_ip: string
  tunnel_mtu: number
  rx_bps: number
  tx_bps: number
  rx_mbps: number
  tx_mbps: number
  rtt_avg_ms: number
  rtt_min_ms: number
  rtt_max_ms: number
  packet_loss_pct: number
  jitter_ms: number
  cpu_load_pct: number
  mem_used_pct: number
  uptime_seconds: number
  gre_keepalive_miss: number
  encap_errors: number
  decap_errors: number
  traffic_profile: 'peak' | 'normal' | 'offpeak'
  hour_of_day: number
}

export interface SiteLatest extends TunnelMetric {}

export interface HourlyAgg {
  site_id: string
  site_name: string
  device_vendor: string
  hour_bucket: string
  avg_rx_mbps: number
  avg_tx_mbps: number
  max_rx_mbps: number
  avg_rtt_ms: number
  max_rtt_ms: number
  avg_loss_pct: number
  avg_cpu_pct: number
  tunnel_down_count: number
  total_samples: number
}

export interface SiteAvailability {
  site_id: string
  site_name: string
  device_vendor: string
  availability_pct: number
  down_count: number
  total_count: number
  since: string
}

// ── Query helpers ────────────────────────────────────────────────────────────

/** Latest status for all 5 spoke sites */
export async function fetchLatestPerSite(): Promise<SiteLatest[]> {
  const { data, error } = await supabase
    .from('gre_latest_per_site')
    .select('*')
    .order('site_id')
  if (error) throw error
  return data ?? []
}

/** Hourly bandwidth + latency data for the past N hours */
export async function fetchHourlyTrend(
  hours = 24,
  siteId?: string
): Promise<HourlyAgg[]> {
  let query = supabase
    .from('gre_hourly_agg')
    .select('*')
    .gte('hour_bucket', new Date(Date.now() - hours * 3600_000).toISOString())
    .order('hour_bucket', { ascending: true })

  if (siteId) query = query.eq('site_id', siteId)

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

/** Tunnel availability % per site (full history) */
export async function fetchAvailability(): Promise<SiteAvailability[]> {
  const { data, error } = await supabase
    .from('gre_availability')
    .select('*')
    .order('availability_pct', { ascending: true })
  if (error) throw error
  return data ?? []
}

/** Recent raw records for the live feed table */
export async function fetchRecentRecords(limit = 30): Promise<TunnelMetric[]> {
  const { data, error } = await supabase
    .from('gre_tunnel_metrics')
    .select('*')
    .order('recorded_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
}

/** Active alerts: tunnel down OR packet loss > 1% OR RTT > 60ms */
export async function fetchAlerts(): Promise<TunnelMetric[]> {
  const oneHourAgo = new Date(Date.now() - 3600_000).toISOString()
  const { data, error } = await supabase
    .from('gre_tunnel_metrics')
    .select('*')
    .gte('recorded_at', oneHourAgo)
    .or('tunnel_status.eq.down,packet_loss_pct.gt.1,rtt_avg_ms.gt.60')
    .order('recorded_at', { ascending: false })
    .limit(20)
  if (error) throw error
  return data ?? []
}
