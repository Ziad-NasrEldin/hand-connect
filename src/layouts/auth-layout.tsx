import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function AuthLayout() {
  const { t } = useTranslation();
  return (
    <section className="mx-auto grid min-h-[calc(100vh-14rem)] max-w-6xl gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
      <div className="motion-reveal brand-panel hidden p-8 lg:block">
        <div className="brand-eyebrow mb-6" />
        <p className="section-label">{t('app.name')}</p>
        <h1 className="mt-4 max-w-md text-4xl font-bold leading-tight tracking-tight text-foreground">
          {t('auth.layoutTitle')}
        </h1>
        <p className="mt-4 max-w-xl text-base leading-8 text-muted-foreground">
          {t('auth.layoutCopy')}
        </p>
      </div>
      <div className="motion-reveal mx-auto grid w-full max-w-xl place-items-center">
        <Outlet />
      </div>
    </section>
  );
}
