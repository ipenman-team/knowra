import { Children, memo } from 'react';

import { cn } from '@/lib/utils';
import { SidebarInset as Main, SidebarProvider } from '@/components/ui/sidebar';
import { MobileTopNav } from './mobile-top-nav';
import { MobileSidebarBridge } from './mobile-sidebar-bridge';

export const ContainerLayout = memo(function ContainerLayout({
  isRoot = false,
  stateId,
  defaultWidthRem,
  sidebar,
  children,
  className,
  insetClassName,
  insetProps,
  mobileTriggerLabel,
  showMobileTrigger,
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
  mobileTriggerLabel?: string;
  showMobileTrigger?: boolean;
}) {
  const fallbackStateId = isRoot ? 'root' : stateId;

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

  const hasSidebar = Children.count(sidebar) > 0;
  const shouldShowMobileTopNav = (showMobileTrigger ?? true) && isRoot;
  const defaultMobileLabelByStateId: Record<string, string> = {
    root: '打开模块导航',
    space: '打开空间导航',
    favorites: '打开收藏筛选',
    'contexta-ai': '打开会话列表',
  };
  const resolvedMobileTriggerLabel =
    mobileTriggerLabel ??
    (fallbackStateId
      ? defaultMobileLabelByStateId[fallbackStateId]
      : undefined) ??
    (isRoot ? '打开模块导航' : '打开侧边导航');

  return (
    <SidebarProvider
      cookieName={cookieName}
      defaultOpen
      resizable={resizable}
      className={cn('overflow-hidden bg-background text-foreground', className)}
    >
      {sidebar}
      <Main
        className={cn(
          'min-h-0 overflow-auto',
          shouldShowMobileTopNav &&
            'pt-[calc(env(safe-area-inset-top)+3rem)] md:pt-0',
          insetClassName,
        )}
        {...insetProps}
      >
        {fallbackStateId && hasSidebar ? (
          <MobileSidebarBridge
            id={fallbackStateId}
            label={resolvedMobileTriggerLabel}
          />
        ) : null}
        {shouldShowMobileTopNav ? <MobileTopNav /> : null}
        {children}
      </Main>
    </SidebarProvider>
  );
});
