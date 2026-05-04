import i18n from '@/i18n';

export function LoadingState({
  label = i18n.t('common.loading'),
}: {
  label?: string;
}) {
  return (
    <div className="motion-reveal motion-shimmer rounded-[calc(var(--radius)+2px)] border border-border bg-[color:var(--hc-surface)] p-6 text-center text-sm font-medium text-muted-foreground shadow-[0_12px_30px_rgba(73,55,38,0.04)]">
      {label}
    </div>
  );
}
