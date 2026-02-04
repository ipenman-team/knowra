'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';
import { Sidebar } from '@/components/ui/sidebar';

export type SidebarContainerProps = React.ComponentProps<typeof Sidebar> & {
  className?: string;
};

export const SidebarContainer = React.forwardRef<
  HTMLDivElement,
  SidebarContainerProps
>(function SidebarContainer(
  {
    resizable = true,
    collapsible = 'icon',
    variant = 'sidebar',
    side = 'left',
    className,
    ...props
  },
  ref,
) {
  return (
    <Sidebar
      ref={ref}
      resizable={resizable}
      collapsible={collapsible}
      variant={variant}
      side={side}
      className={cn(className)}
      {...props}
    />
  );
});
