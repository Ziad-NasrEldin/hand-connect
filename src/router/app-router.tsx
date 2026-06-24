import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from '@/components/error-boundary';
import { AppLayout } from '@/layouts/app-layout';
import { AuthLayout } from '@/layouts/auth-layout';
import { ProviderLayout } from '@/layouts/provider-layout';
import { AdminLayout } from '@/layouts/admin-layout';
import { PublicOnlyRoute, ProtectedRoute } from './route-guards';
import { useAuthStore } from '@/store/auth.store';
import { useUiStore } from '@/store/ui.store';
import { LandingPage } from '@/features/landing/pages/landing-page';
import { LoginPage } from '@/features/auth/pages/login-page';
import { RegisterPage } from '@/features/auth/pages/register-page';
import { PendingProviderPage } from '@/features/auth/pages/pending-provider-page';
import { SearchPage } from '@/features/search/pages/search-page';
import { ProviderProfilePage } from '@/features/providers/pages/provider-profile-page';
import { ConversationsPage } from '@/features/messaging/pages/conversations-page';
import { ConversationPage } from '@/features/messaging/pages/conversation-page';
import { NewReviewPage } from '@/features/reviews/pages/new-review-page';
import { ProviderDashboardPage } from '@/features/dashboard/pages/provider-dashboard-page';
import { EditProviderProfilePage } from '@/features/providers/pages/edit-provider-profile-page';
import { VisibilityPage } from '@/features/dashboard/pages/visibility-page';
import { AdminDashboardPage } from '@/features/admin/pages/admin-dashboard-page';
import { ApplicationsPage } from '@/features/admin/pages/applications-page';
import { ProvidersPage } from '@/features/admin/pages/providers-page';
import { ProfessionsPage } from '@/features/admin/pages/professions-page';
import { VisibilityRequestsPage } from '@/features/admin/pages/visibility-requests-page';
import { ReportsPage } from '@/features/admin/pages/reports-page';
import { AuditLogPage } from '@/features/admin/pages/audit-log-page';
import { GraduationPresentationPage } from '@/features/presentation/pages/graduation-presentation-page';

export function AppRouter() {
  const initialize = useAuthStore((state) => state.initialize);
  const hydrateLanguage = useUiStore((state) => state.hydrateLanguage);

  useEffect(() => {
    hydrateLanguage();
    void initialize();
  }, [hydrateLanguage, initialize]);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="presentation" element={<GraduationPresentationPage />} />
          <Route element={<AppLayout />}>
            <Route index element={<LandingPage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="providers/:id" element={<ProviderProfilePage />} />
            <Route element={<PublicOnlyRoute />}>
              <Route element={<AuthLayout />}>
                <Route path="login" element={<LoginPage />} />
                <Route path="register" element={<RegisterPage />} />
                <Route path="join-provider" element={<RegisterPage />} />
              </Route>
            </Route>
            <Route path="pending" element={<PendingProviderPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="messages" element={<ConversationsPage />} />
              <Route path="messages/:id" element={<ConversationPage />} />
            </Route>
            <Route element={<ProtectedRoute role="customer" />}>
              <Route path="reviews/new/:providerId" element={<NewReviewPage />} />
            </Route>
            <Route element={<ProtectedRoute role="provider" />}>
              <Route element={<ProviderLayout />}>
                <Route path="dashboard" element={<ProviderDashboardPage />} />
                <Route path="profile/edit" element={<EditProviderProfilePage />} />
                <Route path="visibility" element={<VisibilityPage />} />
              </Route>
            </Route>
            <Route element={<ProtectedRoute role="admin" />}>
              <Route path="admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboardPage />} />
                <Route path="applications" element={<ApplicationsPage />} />
                <Route path="providers" element={<ProvidersPage />} />
                <Route path="professions" element={<ProfessionsPage />} />
                <Route path="visibility" element={<VisibilityRequestsPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="actions" element={<AuditLogPage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
