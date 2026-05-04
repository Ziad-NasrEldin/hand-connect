import { Navigate, Outlet, useLocation } from 'react-router-dom';
import i18n from '@/i18n';
import { LoadingState } from '@/components/loading-state';
import { useAuth } from '@/hooks/use-auth';
import type { UserRole } from '@/types/user';

export function ProtectedRoute({ role }: { role?: UserRole }) {
  const { user, isInitialized, providerStatus } = useAuth();
  const location = useLocation();
  if (!isInitialized)
    return <LoadingState label={i18n.t('common.sessionLoading')} />;
  if (!user)
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  if (role === 'provider' && providerStatus !== 'approved')
    return <Navigate to="/pending" replace />;
  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { user, isInitialized } = useAuth();
  if (!isInitialized)
    return <LoadingState label={i18n.t('common.sessionLoading')} />;
  if (user)
    return (
      <Navigate
        to={
          user.role === 'admin'
            ? '/admin'
            : user.role === 'provider'
              ? '/dashboard'
              : '/search'
        }
        replace
      />
    );
  return <Outlet />;
}
