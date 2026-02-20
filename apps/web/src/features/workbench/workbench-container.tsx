'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { addDays, endOfDay, endOfMonth, format, startOfDay } from 'date-fns';
import type { ActivityItem, DailyCount } from '@knowra/shared';

import { ContainerLayout } from '@/components/layout';
import { HomeSidebar } from '@/components/sidebar';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';
import {
  buildLinePath,
  buildDailyCountMap,
  buildDailySeries,
  buildYearGrid,
  getDateKey,
  getGreetingKey,
} from './components/activity-data';
import { ProfileCard } from './components/profile-card';
import { WorkbenchHomePanel } from './components/workbench-home-panel';
import { WorkbenchDashboardPanel } from './components/workbench-dashboard-panel';
import { workbenchApi } from '@/lib/api';
import { useMeStore } from '@/stores';
import { useI18n } from '@/lib/i18n/provider';

export const WorkbenchContainer = () => {
  const { t } = useI18n();
  const today = useMemo(() => new Date(), []);
  const todayYear = today.getFullYear();
  const ensureMeLoaded = useMeStore((s) => s.ensureLoaded);
  const profile = useMeStore((s) => s.profile);
  const user = useMeStore((s) => s.user);
  const meLoaded = useMeStore((s) => s.loaded);
  const [activeTab, setActiveTab] = useState<'home' | 'dashboard'>('home');
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [selectedYear, setSelectedYear] = useState<number>(todayYear);
  const [viewMode, setViewMode] = useState<'grid' | 'line'>('grid');
  const [rangeDays, setRangeDays] = useState<number>(90);
  const [gridStats, setGridStats] = useState<DailyCount[]>([]);
  const [gridLoading, setGridLoading] = useState(false);
  const [gridError, setGridError] = useState<string | null>(null);
  const gridRequestKeyRef = useRef<string | null>(null);
  const gridFetchedKeyRef = useRef<string | null>(null);
  const [lineStats, setLineStats] = useState<DailyCount[]>([]);
  const [lineLoading, setLineLoading] = useState(false);
  const [lineError, setLineError] = useState<string | null>(null);
  const lineRequestKeyRef = useRef<string | null>(null);
  const lineFetchedKeyRef = useRef<string | null>(null);
  const [todayCount, setTodayCount] = useState(0);
  const [todayLoading, setTodayLoading] = useState(false);
  const [todayError, setTodayError] = useState<string | null>(null);
  const [dailyItems, setDailyItems] = useState<ActivityItem[]>([]);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [dailyError, setDailyError] = useState<string | null>(null);

  const weeks = useMemo(() => buildYearGrid(selectedYear), [selectedYear]);
  const yearOptions = useMemo(
    () => [todayYear - 2, todayYear - 1, todayYear],
    [todayYear],
  );

  const selectedDayKey = getDateKey(selectedDate);
  const activityMap = useMemo(() => buildDailyCountMap(gridStats), [gridStats]);

  const lineRange = useMemo(() => {
    const endDate = selectedDate;
    const startDate = addDays(endDate, -rangeDays + 1);
    return { startDate, endDate };
  }, [rangeDays, selectedDate]);
  const lineData = useMemo(
    () => buildDailySeries(lineRange.startDate, lineRange.endDate, lineStats),
    [lineRange, lineStats],
  );
  const maxLineCount = useMemo(
    () => Math.max(1, ...lineData.map((d) => d.count)),
    [lineData],
  );

  const chartSize = { width: 1000, height: 220, padding: 28 };
  const chartPaths = useMemo(
    () =>
      buildLinePath(
        lineData,
        chartSize.width,
        chartSize.height,
        chartSize.padding,
      ),
    [lineData, chartSize.width, chartSize.height, chartSize.padding],
  );

  const handleYearChange = (value: string) => {
    const nextYear = Number(value);
    if (Number.isNaN(nextYear)) return;
    setSelectedYear(nextYear);
    setSelectedDate((prev) => {
      const base = new Date(nextYear, prev.getMonth(), 1);
      const lastDay = endOfMonth(base).getDate();
      const safeDay = Math.min(prev.getDate(), lastDay);
      return new Date(nextYear, prev.getMonth(), safeDay);
    });
  };

  const greeting = t(getGreetingKey(today));
  const displayName = profile?.nickname?.trim() || t('workbench.unnamedUser');
  const avatarUrl = profile?.avatarUrl ?? undefined;
  const actorUserId = user?.id;
  const loadFailedText = t('workbench.loadFailed');

  useEffect(() => {
    void ensureMeLoaded();
  }, [ensureMeLoaded]);

  useEffect(() => {
    if (!meLoaded || !actorUserId) return;
    if (activeTab !== 'dashboard' || viewMode !== 'grid') return;
    const requestKey = `${selectedYear}:${actorUserId}`;
    if (gridFetchedKeyRef.current === requestKey) return;
    if (gridRequestKeyRef.current === requestKey) return;
    let cancelled = false;
    setGridLoading(true);
    setGridError(null);
    setGridStats([]);
    gridRequestKeyRef.current = requestKey;

    (async () => {
      try {
        const from = `${selectedYear}-01-01`;
        const to = `${selectedYear}-12-31`;
        const res = await workbenchApi.getDailyStats({
          from,
          to,
          actorUserId,
        });
        if (cancelled) return;
        setGridStats(res.items ?? []);
        gridFetchedKeyRef.current = requestKey;
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : loadFailedText;
        setGridError(message);
        if (gridRequestKeyRef.current === requestKey) {
          gridRequestKeyRef.current = null;
        }
      } finally {
        if (cancelled) return;
        if (gridRequestKeyRef.current === requestKey) {
          gridRequestKeyRef.current = null;
        }
        setGridLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (gridRequestKeyRef.current === requestKey) {
        gridRequestKeyRef.current = null;
        setGridLoading(false);
      }
    };
  }, [
    activeTab,
    actorUserId,
    loadFailedText,
    meLoaded,
    selectedYear,
    viewMode,
  ]);

  useEffect(() => {
    if (!meLoaded || !actorUserId) return;
    if (activeTab !== 'dashboard' || viewMode !== 'line') return;
    const requestKey = `${format(lineRange.startDate, 'yyyy-MM-dd')}:${format(
      lineRange.endDate,
      'yyyy-MM-dd',
    )}:${actorUserId}`;
    if (lineFetchedKeyRef.current === requestKey) return;
    if (lineRequestKeyRef.current === requestKey) return;
    let cancelled = false;
    setLineLoading(true);
    setLineError(null);
    setLineStats([]);
    lineRequestKeyRef.current = requestKey;

    (async () => {
      try {
        const from = format(lineRange.startDate, 'yyyy-MM-dd');
        const to = format(lineRange.endDate, 'yyyy-MM-dd');
        const res = await workbenchApi.getDailyStats({
          from,
          to,
          actorUserId,
        });
        if (cancelled) return;
        setLineStats(res.items ?? []);
        lineFetchedKeyRef.current = requestKey;
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : loadFailedText;
        setLineError(message);
        if (lineRequestKeyRef.current === requestKey) {
          lineRequestKeyRef.current = null;
        }
      } finally {
        if (cancelled) return;
        if (lineRequestKeyRef.current === requestKey) {
          lineRequestKeyRef.current = null;
        }
        setLineLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (lineRequestKeyRef.current === requestKey) {
        lineRequestKeyRef.current = null;
        setLineLoading(false);
      }
    };
  }, [
    activeTab,
    actorUserId,
    lineRange.endDate,
    lineRange.startDate,
    loadFailedText,
    meLoaded,
    viewMode,
  ]);

  useEffect(() => {
    if (!meLoaded || !actorUserId) return;
    let cancelled = false;
    setTodayLoading(true);
    setTodayError(null);

    (async () => {
      try {
        const day = format(today, 'yyyy-MM-dd');
        const res = await workbenchApi.getDailyStats({
          from: day,
          to: day,
          actorUserId,
        });
        if (cancelled) return;
        setTodayCount(res.items?.[0]?.count ?? 0);
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : loadFailedText;
        setTodayError(message);
      } finally {
        if (cancelled) return;
        setTodayLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [actorUserId, loadFailedText, meLoaded, today]);

  useEffect(() => {
    if (!meLoaded || !actorUserId || activeTab !== 'dashboard') return;
    let cancelled = false;
    setDailyLoading(true);
    setDailyError(null);
    setDailyItems([]);

    (async () => {
      try {
        const from = startOfDay(selectedDate).toISOString();
        const to = endOfDay(selectedDate).toISOString();
        const res = await workbenchApi.listActivities({
          from,
          to,
          actorUserId,
          limit: 200,
        });
        if (cancelled) return;
        setDailyItems(res.items ?? []);
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : loadFailedText;
        setDailyError(message);
      } finally {
        if (cancelled) return;
        setDailyLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeTab, actorUserId, loadFailedText, meLoaded, selectedDate]);

  return (
    <ContainerLayout
      isRoot
      sidebar={<HomeSidebar />}
      insetClassName="min-h-0 overflow-auto lg:overflow-hidden"
    >
      <div className="flex min-h-full flex-col gap-6 px-4 py-4 sm:px-6 sm:py-6 lg:h-full lg:min-h-0 lg:px-11">
        <div className="grid min-h-0 grid-cols-1 gap-6 lg:flex-1 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
          <ProfileCard
            name={displayName}
            greeting={greeting}
            todayCount={todayCount}
            updatedAt={today}
            avatarUrl={avatarUrl}
            loading={todayLoading}
            error={todayError}
          />

          <div className="flex min-h-0 flex-col gap-5 lg:h-full">
            <NavigationMenu className="w-full max-w-full !flex-none justify-start">
              <NavigationMenuList className="flex-nowrap justify-start gap-1 overflow-x-auto py-0">
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <button
                      type="button"
                      className={cn(
                        'h-8 rounded-md px-3 text-sm font-medium transition-colors',
                        activeTab === 'home'
                          ? 'bg-accent text-accent-foreground'
                          : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                      )}
                      onClick={() => setActiveTab('home')}
                    >
                      {t('workbench.tab.home')}
                    </button>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <button
                      type="button"
                      className={cn(
                        'h-8 rounded-md px-3 text-sm font-medium transition-colors',
                        activeTab === 'dashboard'
                          ? 'bg-accent text-accent-foreground'
                          : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                      )}
                      onClick={() => setActiveTab('dashboard')}
                    >
                      {t('workbench.tab.dashboard')}
                    </button>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            <div className="min-h-0 lg:flex-1">
              {activeTab === 'home' ? (
                <WorkbenchHomePanel actorUserId={actorUserId} />
              ) : (
                <WorkbenchDashboardPanel
                  selectedDate={selectedDate}
                  selectedYear={selectedYear}
                  yearOptions={yearOptions}
                  viewMode={viewMode}
                  rangeDays={rangeDays}
                  weeks={weeks}
                  selectedDayKey={selectedDayKey}
                  activityMap={activityMap}
                  lineData={lineData}
                  chartSize={chartSize}
                  chartPaths={chartPaths}
                  maxLineCount={maxLineCount}
                  today={today}
                  dailyItems={dailyItems}
                  dailyLoading={dailyLoading}
                  dailyError={dailyError}
                  statusText={
                    viewMode === 'grid'
                      ? gridLoading
                        ? t('common.loading')
                        : gridError
                          ? t('workbench.loadFailed')
                          : null
                      : lineLoading
                        ? t('common.loading')
                        : lineError
                          ? t('workbench.loadFailed')
                          : null
                  }
                  onViewModeChange={setViewMode}
                  onYearChange={handleYearChange}
                  onSelectDate={setSelectedDate}
                  onRangeChange={setRangeDays}
                  onJumpToToday={() => {
                    setSelectedDate(today);
                    setSelectedYear(today.getFullYear());
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </ContainerLayout>
  );
};
