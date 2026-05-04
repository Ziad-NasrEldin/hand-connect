import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const buttonVariants = cva(
  'motion-press inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold tracking-[0.01em] shadow-[0_8px_20px_rgba(73,55,38,0.05)] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--hc-orange-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-background',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground hover:opacity-95',
        secondary:
          'bg-[color:var(--hc-surface)] text-foreground hover:bg-[color:var(--hc-cream)]',
        outline:
          'bg-card text-foreground hover:border-[color:var(--hc-orange-soft)] hover:bg-[color:var(--hc-cream)]',
        ghost:
          'border-transparent bg-transparent shadow-none hover:bg-[color:var(--hc-surface)]',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground hover:opacity-95',
      },
      size: {
        sm: 'min-h-[40px] rounded-lg px-3.5 text-sm',
        md: 'min-h-[46px] px-5',
        lg: 'min-h-[52px] px-6 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';
