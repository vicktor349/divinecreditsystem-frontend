import { apiClient } from '@/lib/api-client';

export interface AdminUser {
  id: number;
  name: string | null;
  email: string;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface AdminStats {
  users: { total: number; active: number; inactive: number };
  customers: { total: number; owing: number; defaulted: number };
  loans: {
    active: number;
    repaid: number;
    defaulted: number;
    byStatus: { status: string; count: number; outstanding: number }[];
  };
  financial: {
    totalPrincipalDisbursed: number;
    totalRepayments: number;
    totalOutstanding: number;
    totalDepositsHeld: number;
    profitFromRepaid: number;
    estimatedActivePrincipalRecovered: number;
  };
  charts: {
    monthlyRepayments: { month: string; amount: number }[];
    monthlyNewCustomers: { month: string; count: number }[];
  };
}

export interface AuditLog {
  id: number;
  userId: number | null;
  userEmail: string | null;
  userName: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  details: string | null;
  createdAt: string;
}

export interface AuditLogsResponse {
  data: AuditLog[];
  total: number;
  page: number;
  limit: number;
}

export interface ProjectedLoan {
  id: number;
  accountNumber: string;
  nextPaymentDate: string;
  nextPaymentAmount: number;
  outstandingBalance: number;
  customer: { id: number; name: string; phone: string };
}

export interface ProjectedCollections {
  overdue: { count: number; totalExpected: number; loans: ProjectedLoan[] };
  next30Days: { count: number; totalExpected: number; loans: ProjectedLoan[] };
  next60Days: { count: number; totalExpected: number; loans: ProjectedLoan[] };
  next90Days: { count: number; totalExpected: number; loans: ProjectedLoan[] };
}

export interface DashboardAlerts {
  overdueLoans: { count: number; items: any[] };
  pendingApprovals: { count: number; items: any[] };
  nearMaturity: { count: number; items: any[] };
  recentLateCharges: { count: number; items: any[] };
}

export const adminService = {
  listUsers: () => apiClient.get<AdminUser[]>('/admin/users'),

  createUser: (dto: { name: string; email: string; password: string; role: string }) =>
    apiClient.post('/admin/users', dto),

  updateUser: (id: number, dto: { name?: string; role?: string }) =>
    apiClient.patch(`/admin/users/${id}`, dto),

  deactivateUser: (id: number) => apiClient.patch(`/admin/users/${id}/deactivate`, {}),

  activateUser: (id: number) => apiClient.patch(`/admin/users/${id}/activate`, {}),

  resetPassword: (id: number, newPassword: string) =>
    apiClient.patch(`/admin/users/${id}/reset-password`, { newPassword }),

  kickUser: (id: number) => apiClient.patch(`/admin/users/${id}/kick`, {}),

  getStats: () => apiClient.get<AdminStats>('/admin/stats'),

  getAuditLogs: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
  }) => apiClient.get<AuditLogsResponse>('/admin/audit', { params }),

  getProjectedCollections: () =>
    apiClient.get<ProjectedCollections>('/admin/projected-collections'),

  getDashboardAlerts: () =>
    apiClient.get<DashboardAlerts>('/admin/alerts'),
};
