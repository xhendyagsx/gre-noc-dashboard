import { useState, useEffect, useCallback, useRef } from 'react'
import {
  fetchLatestPerSite,
  fetchTrendData,
  fetchAvailability,
  fetchAlerts,
  supabase,
  type SiteLatest,
  type TunnelMetric,
  type SiteAvailability,
} from '@/lib/supabase'

const POLL_INTERVAL_MS = 60_000

export interface NOCData {
  sites: SiteLatest[]
  trendData: TunnelMetric[]
  availability: SiteAvailability[]
  alerts: TunnelMetric[]
  lastUpdated: Date | null
  isLoading: boolean
  error: string | null
  refresh: () => void
}

export function useNOCData(trendHours = 24): NOCData {
  const [sites, setSites] = useState<SiteLatest[]>([])
  const [trendData, setTrendData] = useState<TunnelMetric[]>([])
  const [availability, setAvailability] = useState<SiteAvailability[]>([])
  const [alerts, setAlerts] = useState<TunnelMetric[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = useCallback(async () => {
    try {
      setError(null)
      const [s, t, a, al] = await Promise.all([
        fetchLatestPerSite(),
        fetchTrendData(trendHours),
        fetchAvailability(),
        fetchAlerts(),
      ])
      setSites(s)
      setTrendData(t)
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
    const channel = supabase
      .channel('gre_metrics_insert')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'gre_tunnel_metrics' },
        () => { load() }
      )
      .subscribe()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      supabase.removeChannel(channel)
    }
  }, [load])

  return { sites, trendData, availability, alerts, lastUpdated, isLoading, error, refresh: load }
}
