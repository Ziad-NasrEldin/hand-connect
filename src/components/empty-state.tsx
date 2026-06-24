import type React from 'react';
import { Card, CardContent } from './ui/card';

export function EmptyState({
  title,
  children,
  asPageTitle = false,
}: {
  title: string;
  children?: React.ReactNode;
  asPageTitle?: boolean;
}) {
  const Title = asPageTitle ? 'h1' : 'p';
  return (
    <Card className="motion-reveal" variant="subtle">
      <CardContent className="p-8 text-center sm:p-10">
        <div className="motion-pulse mx-auto mb-4 h-11 w-11 rounded-full bg-[color:var(--hc-cream)]" />
        <Title className="text-xl font-bold tracking-tight text-foreground">
          {title}
        </Title>
        {children ? (
          <div className="mx-auto mt-3 max-w-[34rem] text-sm leading-7 text-muted-foreground">
            {children}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
