import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function ProviderLayout() {
  const { t } = useTranslation();
  const links = [
    ['/dashboard', t('dashboard.title')],
    ['/profile/edit', t('provider.edit')],
    ['/visibility', t('visibility.title')],
  ];
  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start">
      <aside className="motion-reveal min-w-0 overflow-hidden rounded-[calc(var(--radius)+2px)] border border-border bg-card p-3 shadow-[0_18px_40px_rgba(73,55,38,0.05)]">
        <div className="brand-eyebrow mb-4" />
        <nav className="motion-stagger flex max-w-full gap-2 overflow-x-auto lg:grid lg:gap-1">
          {links.map(([href, label]) => (
            <NavLink
              key={href}
              to={href}
              className={({ isActive }) =>
                `sidebar-link whitespace-nowrap ${isActive ? 'bg-[color:var(--hc-cream)] text-foreground shadow-[inset_0_0_0_1px_rgba(233,179,137,0.9)]' : ''}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="motion-reveal min-w-0">
        <Outlet />
      </div>
    </div>
  );
}
