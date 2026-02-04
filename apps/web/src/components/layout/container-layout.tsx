import { memo } from 'react';

import { cn } from '@/lib/utils';
import { SidebarInset as Main, SidebarProvider } from '@/components/ui/sidebar';

export const ContainerLayout = memo(function ContainerLayout({
  isRoot = false,
  stateId,
  defaultWidthRem,
  sidebar,
  children,
  className,
  insetClassName,
  insetProps,
}: {
  isRoot?: boolean;
  stateId?: string;
  defaultWidthRem?: number;
  sidebar: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  insetClassName?: string;
  insetProps?: Omit<
    React.ComponentProps<typeof Main>,
    'className' | 'children'
  >;
}) {
  const fallbackStateId = isRoot ? 'home' : stateId;

  if (isRoot) {
    className = 'h-dvh overflow-hidden bg-background text-foreground';
    insetProps = { 'aria-live': 'polite' };
  }

  const cookieName = fallbackStateId
    ? `sidebar_state_${fallbackStateId}`
    : undefined;

  const remToPx = (rem: number) => Math.round(rem * 16);

  const resizable = isRoot
    ? {
        unit: 'px' as const,
        defaultSize: 260,
        minSize: 200,
        maxSize: 320,
        collapsedSize: 56,
      }
    : typeof defaultWidthRem === 'number'
      ? {
          unit: 'px' as const,
          defaultSize: remToPx(defaultWidthRem),
          minSize: 200,
          maxSize: 520,
          collapsedSize: 56,
        }
      : true;

  return (
    <SidebarProvider
      cookieName={cookieName}
      defaultOpen
      resizable={resizable}
      className={cn('overflow-hidden bg-background text-foreground', className)}
    >
      {sidebar}
      <Main
        className={cn('min-h-0 overflow-auto', insetClassName)}
        {...insetProps}
      >
        {children}
      </Main>
    </SidebarProvider>
  );
});
