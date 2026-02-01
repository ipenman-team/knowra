import { memo } from 'react';

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

export const HomeLayout = memo(function HomeLayout({
  sidebar,
  children,
}: {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider className="h-dvh overflow-hidden bg-background text-foreground">
      {sidebar}
      <SidebarInset className="min-h-0 overflow-auto" aria-live="polite">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
});
