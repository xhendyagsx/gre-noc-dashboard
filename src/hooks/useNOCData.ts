import { useState, useEffect, useCallback, useRef } from 'react'
import {
  fetchLatestPerSite,
  fetchHourlyTrend,
  fetchAvailability,
  fetchAlerts,
  supabase,
  type SiteLatest,
  type HourlyAgg,
  type SiteAvailability,
  type TunnelMetric,
} from '@/lib/supabase'

const POLL_INTERVAL_MS = 60_000   // refresh every 60s (aligns with cron)

export interface NOCData {
  sites: SiteLatest[]
  hourly: HourlyAgg[]
  availability: SiteAvailability[]
  alerts: TunnelMetric[]
  lastUpdated: Date | null
  isLoading: boolean
  error: string | null
  refresh: () => void
}

export function useNOCData(trendHours = 24): NOCData {
  const [sites, setSites] = useState<SiteLatest[]>([])
  const [hourly, setHourly] = useState<HourlyAgg[]>([])
  const [availability, setAvailability] = useState<SiteAvailability[]>([])
  const [alerts, setAlerts] = useState<TunnelMetric[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = useCallback(async () => {
    try {
      setError(null)
      const [s, h, a, al] = await Promise.all([
        fetchLatestPerSite(),
        fetchHourlyTrend(trendHours),
        fetchAvailability(),
        fetchAlerts(),
      ])
      setSites(s)
      setHourly(h)
      setAvailability(a)
      setAlerts(al)
      setLastUpdated(new Date())
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch data')
    } finally {
      setIsLoading(false)
    }
  }, [trendHours])

  useEffect(() => {
    load()
    timerRef.current = setInterval(load, POLL_INTERVAL_MS)

    // Realtime subscription: instant update when new row inserted
    const channel = supabase
      .channel('gre_metrics_insert')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'gre_tunnel_metrics' },
        () => { load() }
      )
      .subscribe()

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      supabase.removeChannel(channel)
    }
  }, [load])

  return { sites, hourly, availability, alerts, lastUpdated, isLoading, error, refresh: load }
}
