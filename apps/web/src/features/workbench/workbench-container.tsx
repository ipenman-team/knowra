'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { addDays, endOfDay, endOfMonth, format, startOfDay } from 'date-fns';
import type { ActivityItem, DailyCount } from '@contexta/shared';

import { ContainerLayout } from '@/components/layout';
import { HomeSidebar } from '@/components/sidebar';
import {
  buildLinePath,
  buildDailyCountMap,
  buildDailySeries,
  buildYearGrid,
  getDateKey,
  getGreeting,
} from './components/activity-data';
import { ActivityList } from './components/activity-list';
import { ActivityOverviewCard } from './components/activity-overview-card';
import { ProfileCard } from './components/profile-card';
import { workbenchApi } from '@/lib/api';
import { useMeStore } from '@/stores';

export const WorkbenchContainer = () => {
  const today = useMemo(() => new Date(), []);
  const todayYear = today.getFullYear();
  const ensureMeLoaded = useMeStore((s) => s.ensureLoaded);
  const profile = useMeStore((s) => s.profile);
  const user = useMeStore((s) => s.user);
  const meLoaded = useMeStore((s) => s.loaded);
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

  const greeting = getGreeting(today);
  const displayName = profile?.nickname?.trim() || '未命名用户';
  const avatarUrl = profile?.avatarUrl ?? undefined;
  const actorUserId = user?.id;

  useEffect(() => {
    void ensureMeLoaded();
  }, [ensureMeLoaded]);

  useEffect(() => {
    if (!meLoaded || !actorUserId || viewMode !== 'grid') return;
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
        const message = error instanceof Error ? error.message : '加载失败';
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
  }, [actorUserId, meLoaded, selectedYear, viewMode]);

  useEffect(() => {
    if (!meLoaded || !actorUserId || viewMode !== 'line') return;
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
        const message = error instanceof Error ? error.message : '加载失败';
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
  }, [actorUserId, lineRange.endDate, lineRange.startDate, meLoaded, viewMode]);

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
        const message = error instanceof Error ? error.message : '加载失败';
        setTodayError(message);
      } finally {
        if (cancelled) return;
        setTodayLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [actorUserId, meLoaded, today]);

  useEffect(() => {
    if (!meLoaded || !actorUserId) return;
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
        const message = error instanceof Error ? error.message : '加载失败';
        setDailyError(message);
      } finally {
        if (cancelled) return;
        setDailyLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [actorUserId, meLoaded, selectedDate]);

  return (
    <ContainerLayout isRoot sidebar={<HomeSidebar />}>
      <div className="flex min-h-full flex-col gap-6 px-6 py-6 lg:px-11">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
          <ProfileCard
            name={displayName}
            greeting={greeting}
            todayCount={todayCount}
            updatedAt={today}
            avatarUrl={avatarUrl}
            loading={todayLoading}
            error={todayError}
          />

          <div className="flex flex-1 flex-col gap-6">
            <ActivityOverviewCard
              today={today}
              selectedYear={selectedYear}
              yearOptions={yearOptions}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onYearChange={handleYearChange}
              gridProps={{
                weeks,
                selectedYear,
                selectedDayKey,
                activityMap,
                onSelectDate: setSelectedDate,
              }}
              onJumpToToday={() => {
                setSelectedDate(today);
                setSelectedYear(today.getFullYear());
              }}
              lineProps={{
                lineData,
                rangeDays,
                onRangeChange: setRangeDays,
                chartSize,
                chartPaths,
                maxLineCount,
                today,
              }}
              statusText={
                viewMode === 'grid'
                  ? gridLoading
                    ? '加载中…'
                    : gridError
                      ? '加载失败'
                      : null
                  : lineLoading
                    ? '加载中…'
                    : lineError
                      ? '加载失败'
                      : null
              }
            />

            <ActivityList
              selectedDate={selectedDate}
              items={dailyItems}
              loading={dailyLoading}
              error={dailyError}
            />
          </div>
        </div>
      </div>
    </ContainerLayout>
  );
};
