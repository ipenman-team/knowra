import { memo } from 'react';

export const HomeLayout = memo(function HomeLayout({
  sidebar,
  children,
}: {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh bg-background text-foreground">
      {sidebar}
      <main className="flex-1 overflow-auto" aria-live="polite">
        {children}
      </main>
    </div>
  );
});
