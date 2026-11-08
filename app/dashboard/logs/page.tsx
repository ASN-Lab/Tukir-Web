'use client'

import { useEffect, useState } from 'react'
import { useAuthStore, BASE_URL } from '@/lib/store'
import { ActivityLog } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Calendar, Search, Filter } from 'lucide-react'

export default function LogsPage() {
  const { accessToken } = useAuthStore()
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<{ deviceId: string; action: string }>({ deviceId: '', action: '' })

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const params = new URLSearchParams()
        if (filter.deviceId) params.append('deviceId', filter.deviceId)
        if (filter.action) params.append('action', filter.action)
        params.append('page', '1')
        params.append('limit', '50')

        const res = await fetch(`${BASE_URL}/activity-logs?${params.toString()}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (!res.ok) throw new Error('Failed to fetch logs')
        const data = await res.json()
        setLogs(Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching logs')
      } finally {
        setLoading(false)
      }
    }
    fetchLogs()
  }, [accessToken, filter])

  const filteredLogs = logs.filter(log =>
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    log.device?.deviceCode.toLowerCase().includes(search.toLowerCase()) ||
    log.device?.deviceName.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="text-center py-12">Loading...</div>

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Activity Logs</h2>
        <p className="text-muted-foreground">Historical garage operations and events</p>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Input
          placeholder="Filter by device code"
          value={filter.deviceId}
          onChange={e => setFilter({ ...filter, deviceId: e.target.value })}
        />
        <Input
          placeholder="Filter by action"
          value={filter.action}
          onChange={e => setFilter({ ...filter, action: e.target.value })}
        />
      </div>

      {error && <div className="bg-destructive/10 text-destructive p-4 rounded-md">{error}</div>}

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity ({filteredLogs.length} entries)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-3 px-4">Time</th>
                  <th className="text-left py-3 px-4">Device</th>
                  <th className="text-left py-3 px-4">Action</th>
                  <th className="text-left py-3 px-4">Payload</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground">
                      No logs found
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map(log => (
                    <tr key={log.id} className="border-b hover:bg-accent/50">
                      <td className="py-3 px-4">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <div>
                          <span className="font-mono text-xs">{log.device?.deviceCode || 'Unknown'}</span>
                          <div className="text-xs text-muted-foreground">{log.device?.deviceName}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium">{log.action}</td>
                      <td className="py-3 px-4 font-mono text-xs text-muted-foreground truncate max-w-xs">
                        {JSON.stringify(log.payload || {}).slice(0, 60)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
