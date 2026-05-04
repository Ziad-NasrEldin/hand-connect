import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const adminLinks = [
  ['/admin', 'admin.title'],
  ['/admin/applications', 'admin.applications'],
  ['/admin/providers', 'admin.providers'],
  ['/admin/professions', 'admin.professions'],
  ['/admin/visibility', 'admin.visibility'],
  ['/admin/reports', 'admin.reports'],
  ['/admin/actions', 'admin.actions'],
] as const;

export function AdminLayout() {
  const { t } = useTranslation();
  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr] lg:items-start">
      <aside className="motion-reveal rounded-[calc(var(--radius)+2px)] border border-border bg-card p-3 shadow-[0_18px_40px_rgba(73,55,38,0.05)]">
        <div className="brand-eyebrow mb-4" />
        <nav className="motion-stagger flex gap-2 overflow-x-auto lg:grid lg:gap-1">
          {adminLinks.map(([href, key]) => (
            <NavLink
              key={href}
              end={href === '/admin'}
              to={href}
              className={({ isActive }) =>
                `sidebar-link whitespace-nowrap ${isActive ? 'bg-[color:var(--hc-cream)] text-foreground shadow-[inset_0_0_0_1px_rgba(233,179,137,0.9)]' : ''}`
              }
            >
              {t(key)}
            </NavLink>
          ))}
        </nav>
      </aside>
      <Outlet />
    </div>
  );
}
