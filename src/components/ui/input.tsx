import * as React from 'react';
import { cn } from '@/lib/cn';

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'min-h-[48px] w-full rounded-xl border border-border bg-card px-4 text-[15px] font-medium text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] outline-none transition placeholder:text-muted-foreground focus:border-[color:var(--hc-orange-soft)] focus:ring-4 focus:ring-[color:var(--hc-orange-ring)] disabled:cursor-not-allowed disabled:opacity-60',
      className,
    )}
    {...props}
  />
));
Input.displayName = 'Input';
