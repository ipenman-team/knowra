'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type SegmentedOption<T extends string> = {
  value: T;
  label: ReactNode;
  disabled?: boolean;
};

export function Segmented<T extends string>(props: {
  value: T;
  onValueChange: (value: T) => void;
  options: SegmentedOption<T>[];
  className?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label="segmented"
      className={cn(
        'inline-flex items-center rounded-2xl border border-border/70 bg-muted/40 p-1',
        props.className,
      )}
    >
      {props.options.map((option) => {
        const active = props.value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={option.disabled}
            className={cn(
              'rounded-xl px-3 py-1.5 text-sm transition-colors',
              active
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
              option.disabled && 'cursor-not-allowed opacity-50',
            )}
            onClick={() => {
              if (!option.disabled && option.value !== props.value) {
                props.onValueChange(option.value);
              }
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

