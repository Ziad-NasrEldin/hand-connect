import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getAdminOverview,
  hideReview,
  listAdminActions,
  listAllProviders,
  listProviderApplications,
  listReports,
  listVisibilityRequests,
  resolveReport,
} from '@/services/admin.service';

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

export function useResolveReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ adminId, reportId, reason }: { adminId: string; reportId: string; reason: string }) =>
      resolveReport(adminId, reportId, reason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'actions'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
    },
  });
}

export function useHideReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      adminId,
      reviewId,
      reason,
      reportId,
    }: {
      adminId: string;
      reviewId: string;
      reason: string;
      reportId?: string;
    }) => hideReview(adminId, reviewId, reason, reportId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'actions'] });
      void queryClient.invalidateQueries({ queryKey: ['reviews'] });
      void queryClient.invalidateQueries({ queryKey: ['provider'] });
    },
  });
}

export function useAuditLog() {
  return useQuery({ queryKey: ['admin', 'actions'], queryFn: listAdminActions });
}
