'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@/components/ui/navigation-menu';
import { Button } from '@/components/ui/button';
import { DEFAULT_CTA_HREF, getLandingContent } from '@/features/landing/content';
import type { LandingLocale } from '@/features/landing/locale';
import { withLandingLocale } from '@/features/landing/locale';
import { cn } from '@/lib/utils';

interface LandingHeaderProps {
  isLoggedIn: boolean;
  locale: LandingLocale;
}

function isActivePath(pathname: string, href: string): boolean {
  if (href === '/') {
    return pathname === '/';
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function LandingHeader({ isLoggedIn, locale }: LandingHeaderProps) {
  const pathname = usePathname();
  const content = getLandingContent(locale);
  const currentPath = pathname || '/';

  return (
    <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <Link href={withLandingLocale('/', locale)} className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-blue-500" aria-hidden="true" />
          <span className="text-3xl font-semibold tracking-tight">Contexta</span>
        </Link>

        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList className="gap-1.5">
            {content.navItems.map((item) => {
              const active = isActivePath(currentPath, item.href);

              return (
                <NavigationMenuItem key={item.href}>
                  <NavigationMenuLink asChild>
                    <Link
                      href={withLandingLocale(item.href, locale)}
                      className={cn(
                        'inline-flex h-11 items-center rounded-full px-5 text-base font-medium text-muted-foreground transition-colors hover:bg-blue-50 hover:text-blue-600',
                        active && 'bg-blue-50 text-blue-600'
                      )}
                    >
                      {item.label}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              );
            })}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center rounded-full bg-slate-100 p-1">
            <Link
              href={withLandingLocale(currentPath, 'zh')}
              className={cn(
                'rounded-full px-2 py-1 text-xs font-medium text-muted-foreground transition-colors',
                locale === 'zh' && 'bg-white text-foreground shadow-sm'
              )}
            >
              {content.header.localeZh}
            </Link>
            <Link
              href={withLandingLocale(currentPath, 'en')}
              className={cn(
                'rounded-full px-2 py-1 text-xs font-medium text-muted-foreground transition-colors',
                locale === 'en' && 'bg-white text-foreground shadow-sm'
              )}
            >
              {content.header.localeEn}
            </Link>
          </div>

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
      </div>
    </header>
  );
}
