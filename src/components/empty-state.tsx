import type React from 'react';
import { Card, CardContent } from './ui/card';

export function EmptyState({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <Card variant="subtle">
      <CardContent className="p-8 text-center sm:p-10">
        <div className="mx-auto mb-4 h-11 w-11 rounded-full bg-[color:var(--hc-cream)]" />
        <p className="text-xl font-bold tracking-tight text-foreground">
          {title}
        </p>
        {children ? (
          <div className="mx-auto mt-3 max-w-[34rem] text-sm leading-7 text-muted-foreground">
            {children}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
