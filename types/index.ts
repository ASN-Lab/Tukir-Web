export type Role = 'SUPER_ADMIN' | 'TECHNICIAN' | 'END_USER'
export type GarageStatus = 'CLOSED' | 'OPEN'
export type SystemMode = 'STANDBY' | 'PARKING_IN' | 'EXITING'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  createdAt?: string
}

export interface Device {
  id: string
  deviceCode: string
  deviceName: string
  ownerId: string | null
  owner?: User | null
  isOnline: boolean
  garageStatus: GarageStatus
  systemMode: SystemMode
  wifiRssi: number
  lastSeen: string
  createdAt: string
}

export interface Telemetry {
  deviceCode: string
  garage_status: GarageStatus
  system_mode: SystemMode
  wifi_rssi: number
  rear_dist_cm?: number
  side_dist_cm?: number
}

export interface ActivityLog {
  id: string
  deviceId: string
  action: string
  payload: unknown
  createdAt: string
  device?: { deviceCode: string; deviceName: string } | null
}

export interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
}
