import { useQuery } from '@tanstack/react-query';
import { getAdminOverview, listAdminActions, listAllProviders, listProviderApplications, listReports, listVisibilityRequests } from '@/services/admin.service';

export function useAdminOverview() {
  return useQuery({ queryKey: ['admin', 'overview'], queryFn: getAdminOverview });
}

export function useProviderApplications() {
  return useQuery({ queryKey: ['admin', 'applications'], queryFn: listProviderApplications });
}

export function useAllProviders() {
  return useQuery({ queryKey: ['admin', 'providers'], queryFn: listAllProviders });
}

export function useVisibilityRequests() {
  return useQuery({ queryKey: ['admin', 'visibility'], queryFn: listVisibilityRequests });
}

export function useReports() {
  return useQuery({ queryKey: ['admin', 'reports'], queryFn: listReports });
}

export function useAuditLog() {
  return useQuery({ queryKey: ['admin', 'actions'], queryFn: listAdminActions });
}
