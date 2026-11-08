'use client'

import { useEffect, useState } from 'react'
import { useAuthStore, BASE_URL } from '@/lib/store'
import { Device, Telemetry } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Badge from '@/components/ui/badge'
import { Wifi, AlertCircle } from 'lucide-react'
import { io, Socket } from 'socket.io-client'

export default function DashboardPage() {
  const { accessToken } = useAuthStore()
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!accessToken) {
      setLoading(false)
      return
    }

    let socket: Socket;

    const fetchDevices = async () => {
      try {
        const res = await fetch(`${BASE_URL}/devices`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`)
        const data = await res.json()
        const initialDevices = Array.isArray(data) ? data : []
        setDevices(initialDevices)

        // Initialize Socket.io
        const socketUrl = BASE_URL.replace('/api', '')
        socket = io(socketUrl, {
          auth: { token: accessToken }
        })

        initialDevices.forEach((d: Device) => {
          socket.emit('subscribe:device', d.deviceCode)
        })

        socket.on('telemetry', (payload: { deviceCode: string; data: Telemetry }) => {
          setDevices(prev => prev.map(d => 
            d.deviceCode === payload.deviceCode 
              ? { 
                  ...d, 
                  garageStatus: payload.data.garage_status,
                  systemMode: payload.data.system_mode,
                  wifiRssi: payload.data.wifi_rssi,
                  lastSeen: new Date().toISOString()
                } 
              : d
          ))
        })

        socket.on('status', (payload: { deviceCode: string; data: { status: string } }) => {
          setDevices(prev => prev.map(d => 
            d.deviceCode === payload.deviceCode 
              ? { ...d, isOnline: payload.data.status === 'ONLINE' } 
              : d
          ))
        })

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchDevices()

    return () => {
      if (socket) socket.disconnect()
    }
  }, [accessToken])

  if (!accessToken) return <div className="text-center py-12 text-muted-foreground">Loading authentication...</div>
  if (loading) return <div className="text-center py-12">Loading devices...</div>
  if (error) return <div className="text-center py-12 text-destructive">Error: {error}</div>

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Dashboard Overview</h2>
        <p className="text-muted-foreground">Live telemetry and device status</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Devices" value={devices.length} />
        <StatCard label="Online" value={devices.filter(d => d.isOnline).length} highlight="success" />
        <StatCard label="Offline" value={devices.filter(d => !d.isOnline).length} highlight="danger" />
      </div>

      {/* Device Grid */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Connected Devices</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map(device => (
            <DeviceCard key={device.id} device={device} />
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, highlight }: { label: string; value: number; highlight?: 'success' | 'danger' }) {
  const colors = {
    success: 'text-emerald-500',
    danger: 'text-rose-500',
  }
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold ${highlight ? colors[highlight] : ''}`}>{value}</div>
      </CardContent>
    </Card>
  )
}

function DeviceCard({ device }: { device: Device }) {
  return (
    <Card className="hover:shadow-lg transition">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{device.deviceName}</CardTitle>
            <p className="text-xs text-muted-foreground">{device.deviceCode}</p>
          </div>
          <Badge variant={device.isOnline ? 'success' : 'destructive'}>
            {device.isOnline ? 'Online' : 'Offline'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm">
          <p className="text-muted-foreground">Status: <span className="text-foreground font-semibold">{device.garageStatus}</span></p>
          <p className="text-muted-foreground">Mode: <span className="text-foreground font-semibold">{device.systemMode}</span></p>
        </div>

        {/* Signal Strength */}
        <div className="flex items-center gap-2">
          <Wifi className="h-4 w-4 text-muted-foreground" />
          <div className="flex-1 bg-muted rounded h-1">
            <div
              className="bg-emerald-500 h-1 rounded"
              style={{ width: `${Math.max(0, Math.min(100, (device.wifiRssi + 100) * 2))}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{device.wifiRssi} dBm</span>
        </div>

        {/* Last Seen */}
        <div className="text-xs text-muted-foreground">
          Last seen: {new Date(device.lastSeen).toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  )
}
