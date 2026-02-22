'use client';

import Link from 'next/link';
import { Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { DEFAULT_CTA_HREF, getLandingContent, type MarketingNavItem } from '@/features/landing/content';
import type { LandingLocale } from '@/features/landing/locale';
import { cn } from '@/lib/utils';

interface LandingHeaderProps {
  isLoggedIn: boolean;
  locale: LandingLocale;
}

function isActivePath(pathname: string, item: MarketingNavItem): boolean {
  if (item.kind === 'anchor') {
    return pathname === '/';
  }

  if (item.href === '/') {
    return pathname === '/';
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function LandingHeader({ isLoggedIn, locale }: LandingHeaderProps) {
  const pathname = usePathname() || '/';
  const content = getLandingContent(locale);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-blue-500" aria-hidden="true" />
          <span className="text-3xl font-semibold tracking-tight text-slate-950">Knowra</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {content.navItems.map((item) => {
            const active = isActivePath(pathname, item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-blue-50 hover:text-blue-700',
                  active && 'bg-blue-50 text-blue-700',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {isLoggedIn ? (
            <Button asChild size="lg">
              <Link href="/workbench">{content.header.workbenchCta}</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="lg">
                <Link href={DEFAULT_CTA_HREF}>{content.header.loginCta}</Link>
              </Button>
              <Button asChild size="lg">
                <Link href={DEFAULT_CTA_HREF}>{content.header.startCta}</Link>
              </Button>
            </>
          )}
        </div>

        <div className="lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label={content.header.mobileMenuTitle}>
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[84vw] border-l border-slate-200 bg-white sm:max-w-xs">
              <SheetHeader>
                <SheetTitle>{content.header.mobileMenuTitle}</SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-2">
                {content.navItems.map((item) => {
                  const active = isActivePath(pathname, item);
                  return (
                    <SheetClose asChild key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          'block rounded-lg border border-transparent px-3 py-2 text-sm font-medium text-slate-600 hover:border-slate-200 hover:bg-slate-50',
                          active && 'border-blue-100 bg-blue-50 text-blue-700',
                        )}
                      >
                        {item.label}
                      </Link>
                    </SheetClose>
                  );
                })}
              </div>

              <div className="mt-6 space-y-2">
                {isLoggedIn ? (
                  <SheetClose asChild>
                    <Button asChild className="w-full">
                      <Link href="/workbench">{content.header.workbenchCta}</Link>
                    </Button>
                  </SheetClose>
                ) : (
                  <>
                    <SheetClose asChild>
                      <Button asChild variant="outline" className="w-full">
                        <Link href={DEFAULT_CTA_HREF}>{content.header.loginCta}</Link>
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button asChild className="w-full">
                        <Link href={DEFAULT_CTA_HREF}>{content.header.startCta}</Link>
                      </Button>
                    </SheetClose>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
