import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageToggle } from '@/components/app/language-toggle';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';

export function AppLayout() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navItems = [
    { href: '/search', label: t('nav.search'), show: true },
    { href: '/messages', label: t('nav.messages'), show: Boolean(user) },
    {
      href: '/dashboard',
      label: t('nav.dashboard'),
      show: user?.role === 'provider',
    },
    { href: '/admin', label: t('nav.admin'), show: user?.role === 'admin' },
  ];

  return (
    <div className="min-h-screen pb-10">
      <header className="motion-header sticky top-0 z-20 border-b border-border/70 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center justify-between gap-3">
              <Link to="/" className="brand-title text-[1.45rem] sm:text-3xl">
                {t('app.name')}
              </Link>
              <LanguageToggle />
            </div>
            <div className="flex w-full items-center gap-3 md:w-auto md:self-auto">
              {user ? (
                <Button
                  className="w-full md:w-auto"
                  variant="outline"
                  size="sm"
                  onClick={() => void logout()}
                >
                  {t('nav.logout')}
                </Button>
              ) : (
                <>
                  <Button
                    asChild
                    className="w-full md:w-auto"
                    size="sm"
                    variant="outline"
                  >
                    <Link to="/join-provider">{t('nav.joinProvider')}</Link>
                  </Button>
                  <Button asChild className="w-full md:w-auto" size="sm">
                    <Link to="/login">{t('nav.login')}</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
          <nav className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {navItems
              .filter((item) => item.show)
              .map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={({ isActive }) =>
                    `top-nav-link whitespace-nowrap ${isActive ? 'bg-[color:var(--hc-cream)] text-foreground shadow-[inset_0_0_0_1px_rgba(233,179,137,0.9)]' : ''}`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div key={location.pathname} className="route-motion">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
