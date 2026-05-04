import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const cardVariants = cva(
  'motion-surface rounded-[calc(var(--radius)+2px)] border border-border bg-card text-card-foreground shadow-[0_18px_45px_rgba(73,55,38,0.06)]',
  {
    variants: {
      variant: {
        default: '',
        subtle: 'bg-[color:var(--hc-surface)] shadow-none',
        highlight:
          'border-[color:var(--hc-orange-soft)] bg-[color:var(--hc-cream)] shadow-[0_22px_50px_rgba(73,55,38,0.08)]',
        ghost: 'border-transparent bg-transparent shadow-none',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface CardProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export function Card({ className, variant, ...props }: CardProps) {
  return (
    <div className={cn(cardVariants({ variant }), className)} {...props} />
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('space-y-2 p-5 sm:p-6', className)} {...props} />;
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        'text-xl font-bold tracking-tight text-foreground sm:text-2xl',
        className,
      )}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-5 pt-0 sm:p-6 sm:pt-0', className)} {...props} />
  );
}
