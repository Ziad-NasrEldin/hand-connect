import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

export function LandingPage() {
  const { t } = useTranslation();
  return (
    <section className="motion-stagger grid gap-5 lg:min-h-[calc(100vh-15rem)] lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
      <div className="brand-panel overflow-hidden">
        <div className="grid h-full gap-8 p-6 sm:p-8 lg:p-10">
          <div className="motion-stagger space-y-6">
            <div className="brand-eyebrow" />
            <div className="space-y-3">
              <p className="section-label">{t('home.eyebrow')}</p>
              <h1 className="page-title max-w-3xl">{t('home.title')}</h1>
              <p className="page-lead">{t('home.subtitle')}</p>
            </div>
            <div className="motion-stagger flex flex-col gap-3 md:flex-row">
              <Button asChild size="lg">
                <Link to="/search">{t('home.cta')}</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/join-provider">{t('home.providerCta')}</Link>
              </Button>
              <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm leading-7 text-muted-foreground">
                {t('home.directContact')}
              </div>
            </div>
          </div>
          <div className="motion-stagger grid gap-3 md:grid-cols-2">
            <div className="soft-list-item rounded-[calc(var(--radius)-2px)] border border-border bg-card p-4">
              <p className="section-label">{t('home.verifiedTitle')}</p>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                {t('home.verifiedCopy')}
              </p>
            </div>
            <div className="soft-list-item rounded-[calc(var(--radius)-2px)] border border-border bg-[color:var(--hc-surface)] p-4">
              <p className="section-label">{t('home.mobileTitle')}</p>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                {t('home.mobileCopy')}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="motion-surface overflow-hidden rounded-[calc(var(--radius)+6px)] border border-border bg-card shadow-[0_24px_50px_rgba(73,55,38,0.08)]">
        <img
          className="h-[260px] w-full object-cover sm:h-[320px] lg:h-full"
          src="https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=1400&q=85"
          alt={t('home.imageAlt')}
        />
        <div className="grid gap-3 p-6 sm:p-7">
          <p className="section-label">{t('home.secondaryEyebrow')}</p>
          <p className="text-lg font-semibold leading-8 text-foreground">
            {t('home.secondaryTitle')}
          </p>
          <p className="text-sm leading-7 text-muted-foreground">
            {t('home.secondaryCopy')}
          </p>
        </div>
      </div>
    </section>
  );
}
