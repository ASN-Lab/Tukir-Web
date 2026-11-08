'use client'

import { useEffect, useState } from 'react'
import { useAuthStore, BASE_URL } from '@/lib/store'
import { Device, User } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Badge from '@/components/ui/badge'
import { Plus, Edit2, Trash2, Link as LinkIcon, Unlink } from 'lucide-react'

export default function DevicesPage() {
  const { accessToken } = useAuthStore()
  const [devices, setDevices] = useState<Device[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewForm, setShowNewForm] = useState(false)
  const [formData, setFormData] = useState({ deviceCode: '', deviceName: '' })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const devRes = await fetch(`${BASE_URL}/devices`, { headers: { Authorization: `Bearer ${accessToken}` } })
        const userRes = await fetch(`${BASE_URL}/users`, { headers: { Authorization: `Bearer ${accessToken}` } }).catch(() => null)
        
        if (devRes.ok) setDevices(await devRes.json())
        if (userRes?.ok) setUsers(await userRes.json())
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [accessToken])

  const handleCreateDevice = async () => {
    if (!formData.deviceCode || !formData.deviceName) {
      setError('All fields required')
      return
    }
    if (!formData.deviceCode.startsWith('TUKIR-')) {
      setError('Device code must start with TUKIR-')
      return
    }
    try {
      const res = await fetch(`${BASE_URL}/devices`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to create device')
      }
      const newDevice = await res.json()
      setDevices([newDevice, ...devices])
      setFormData({ deviceCode: '', deviceName: '' })
      setShowNewForm(false)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating device')
    }
  }

  const handleDeleteDevice = async (id: string) => {
    if (!confirm('Delete this device?')) return
    try {
      const res = await fetch(`${BASE_URL}/devices/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!res.ok) throw new Error('Failed to delete')
      setDevices(devices.filter(d => d.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting device')
    }
  }

  const handleBindDevice = async (deviceId: string, userId: string) => {
    if (!userId) return
    try {
      const res = await fetch(`${BASE_URL}/devices/${deviceId}/bind`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerId: userId }),
      })
      if (!res.ok) throw new Error('Failed to bind')
      const boundUser = users.find(u => u.id === userId)
      setDevices(devices.map(d => d.id === deviceId ? { ...d, ownerId: userId, owner: boundUser || null } : d))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error binding device')
    }
  }

  const handleUnbindDevice = async (deviceId: string) => {
    try {
      const res = await fetch(`${BASE_URL}/devices/${deviceId}/unbind`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!res.ok) throw new Error('Failed to unbind')
      setDevices(devices.map(d => d.id === deviceId ? { ...d, ownerId: null } : d))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error unbinding device')
    }
  }

  if (loading) return <div className="text-center py-12">Loading...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Device Management</h2>
          <p className="text-muted-foreground">Register and manage IoT devices</p>
        </div>
        <Button onClick={() => setShowNewForm(!showNewForm)} size="lg">
          <Plus className="h-4 w-4 mr-2" />
          New Device
        </Button>
      </div>

      {error && <div className="bg-destructive/10 text-destructive p-4 rounded-md">{error}</div>}

      {showNewForm && (
        <Card>
          <CardHeader>
            <CardTitle>Register Device</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Device Code (e.g. TUKIR-GARAGE-01)"
              value={formData.deviceCode}
              onChange={e => setFormData({ ...formData, deviceCode: e.target.value })}
            />
            <Input
              placeholder="Device Name"
              value={formData.deviceName}
              onChange={e => setFormData({ ...formData, deviceName: e.target.value })}
            />
            <div className="flex gap-2">
              <Button onClick={handleCreateDevice} variant="default">Create</Button>
              <Button onClick={() => setShowNewForm(false)} variant="outline">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Devices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registered Devices ({devices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-3 px-4">Code</th>
                  <th className="text-left py-3 px-4">Name</th>
                  <th className="text-left py-3 px-4">Owner</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {devices.map(device => (
                  <tr key={device.id} className="border-b hover:bg-accent/50">
                    <td className="py-3 px-4 font-mono text-xs">{device.deviceCode}</td>
                    <td className="py-3 px-4">{device.deviceName}</td>
                    <td className="py-3 px-4">{device.owner?.name || <span className="text-muted-foreground">Unbound</span>}</td>
                    <td className="py-3 px-4">
                      <Badge variant={device.isOnline ? 'success' : 'destructive'}>
                        {device.isOnline ? 'Online' : 'Offline'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        {device.ownerId ? (
                          <Button size="sm" variant="outline" onClick={() => handleUnbindDevice(device.id)}>
                            <Unlink className="h-3 w-3" />
                          </Button>
                        ) : (
                          <select
                            onChange={e => e.target.value && handleBindDevice(device.id, e.target.value)}
                            className="text-xs px-2 py-1 border rounded bg-background"
                            defaultValue=""
                          >
                            <option value="">Bind to user...</option>
                            {users.filter(u => u.role === 'END_USER').map(u => (
                              <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                          </select>
                        )}
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteDevice(device.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
