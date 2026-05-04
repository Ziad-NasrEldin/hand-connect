import * as React from 'react';
import { cn } from '@/lib/cn';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, placeholder, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'motion-field min-h-[48px] w-full rounded-xl border border-border bg-card px-4 text-[15px] font-medium text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] outline-none focus:border-[color:var(--hc-orange-soft)] focus:ring-4 focus:ring-[color:var(--hc-orange-ring)] disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      {...props}
    >
      {placeholder ? <option value="">{placeholder}</option> : null}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
);
Select.displayName = 'Select';
