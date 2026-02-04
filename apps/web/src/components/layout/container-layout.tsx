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
  if (isRoot) {
    stateId = 'home';
    className = 'h-dvh overflow-hidden bg-background text-foreground';
    insetProps = { 'aria-live': 'polite' };
  }
  if (!stateId) {
    throw new Error('ContainerLayout requires a stateId prop.');
  }
  return (
    <SidebarProvider
      stateId={stateId}
      defaultWidthRem={defaultWidthRem}
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
