'use client'

import { useEffect, useState } from 'react'
import { useAuthStore, BASE_URL } from '@/lib/store'
import { User } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Badge from '@/components/ui/badge'
import { Plus, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'

export default function UsersPage() {
  const { accessToken } = useAuthStore()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'END_USER' })

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${BASE_URL}/users`, { headers: { Authorization: `Bearer ${accessToken}` } })
        if (!res.ok) throw new Error(`Failed: ${res.status}`)
        const data = await res.json()
        setUsers(Array.isArray(data) ? data : [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching users')
      } finally {
        setLoading(false)
      }
    }
    if (accessToken) fetchUsers()
  }, [accessToken])

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Delete this user?')) return
    try {
      const res = await fetch(`${BASE_URL}/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!res.ok) throw new Error('Failed to delete')
      setUsers(users.filter(u => u.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting user')
    }
  }

  if (loading) return <div className="text-center py-12">Loading...</div>

  const handleCreateUser = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      setError('Name, email and password are required')
      return
    }
    try {
      const res = await fetch(`${BASE_URL}/users`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) throw new Error('Failed to create user')
      const newUser = await res.json()
      setUsers([newUser, ...users])
      setFormData({ name: '', email: '', password: '', role: 'END_USER' })
      setShowNewForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating user')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">User Management</h2>
          <p className="text-muted-foreground">Manage admin and end-user accounts</p>
        </div>
        <Button size="lg" onClick={() => setShowNewForm(!showNewForm)}>
          <Plus className="h-4 w-4 mr-2" />
          New User
        </Button>
      </div>

      {error && <div className="bg-destructive/10 text-destructive p-4 rounded-md">{error}</div>}

      {showNewForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create User</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            <Input placeholder="Email" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
            <Input placeholder="Password" type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
            <select className="px-3 py-2 border rounded bg-background w-full" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
              <option value="END_USER">END_USER</option>
              <option value="TECHNICIAN">TECHNICIAN</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            </select>
            <div className="flex gap-2">
              <Button onClick={handleCreateUser} variant="default">Create</Button>
              <Button onClick={() => setShowNewForm(false)} variant="outline">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Registered Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-3 px-4">Name</th>
                  <th className="text-left py-3 px-4">Email</th>
                  <th className="text-left py-3 px-4">Role</th>
                  <th className="text-left py-3 px-4">Created</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-b hover:bg-accent/50">
                    <td className="py-3 px-4">{user.name}</td>
                    <td className="py-3 px-4">{user.email}</td>
                    <td className="py-3 px-4">
                      <Badge variant={user.role === 'SUPER_ADMIN' ? 'default' : user.role === 'TECHNICIAN' ? 'secondary' : 'outline'}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</td>
                    <td className="py-3 px-4">
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteUser(user.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
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
