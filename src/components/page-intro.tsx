import type React from 'react';
import { cn } from '@/lib/cn';

export function PageIntro({
  eyebrow,
  title,
  lead,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'motion-reveal flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className="space-y-3">
        <div className="brand-eyebrow" />
        <div className="space-y-3">
          {eyebrow ? <p className="section-label">{eyebrow}</p> : null}
          <h1 className="page-title">{title}</h1>
          {lead ? <p className="page-lead">{lead}</p> : null}
        </div>
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}
