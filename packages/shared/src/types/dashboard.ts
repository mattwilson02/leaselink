export interface DashboardLeaseExpiration {
  id: string
  propertyAddress: string
  tenantName: string
  endDate: string
  daysUntilExpiry: number
}

export interface DashboardRecentActivity {
  id: string
  type: 'MAINTENANCE_REQUEST' | 'PAYMENT' | 'LEASE_ACTIVATION' | 'DOCUMENT_UPLOAD'
  title: string
  timestamp: string
}

export interface DashboardSummary {
  properties: {
    total: number
    vacant: number
    listed: number
    occupied: number
    maintenance: number
  }
  tenants: {
    total: number
    active: number
    invited: number
  }
  leases: {
    active: number
    pending: number
    expiringWithin30Days: number
    expiringWithin60Days: number
  }
  maintenance: {
    open: number
    inProgress: number
    resolved: number
    emergencyOpen: number
  }
  payments: {
    expectedThisMonth: number
    collectedThisMonth: number
    overdueTotal: number
    overdueCount: number
    pendingCount: number
  }
  upcomingLeaseExpirations: DashboardLeaseExpiration[]
  recentActivity: DashboardRecentActivity[]
}
