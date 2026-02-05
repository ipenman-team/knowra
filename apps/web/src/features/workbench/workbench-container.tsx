'use client';

import { useMemo, useState } from 'react';
import { addDays, endOfMonth } from 'date-fns';

import { ContainerLayout } from '@/components/layout';
import { HomeSidebar } from '@/components/sidebar';
import {
  buildLinePath,
  buildYearGrid,
  getActivityCount,
  getActivityItemsForDate,
  getDateKey,
  getGreeting,
} from './components/activity-data';
import { ActivityList } from './components/activity-list';
import { ActivityOverviewCard } from './components/activity-overview-card';
import { ProfileCard } from './components/profile-card';

export const WorkbenchContainer = () => {
  const today = new Date();
  const todayYear = today.getFullYear();
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [selectedYear, setSelectedYear] = useState<number>(todayYear);
  const [viewMode, setViewMode] = useState<'grid' | 'line'>('grid');
  const [rangeDays, setRangeDays] = useState<number>(90);

  const weeks = useMemo(() => buildYearGrid(selectedYear), [selectedYear]);
  const yearOptions = useMemo(
    () => [todayYear - 2, todayYear - 1, todayYear],
    [todayYear],
  );

  const activityMap = useMemo(() => {
    const map = new Map<string, number>();
    weeks.flat().forEach((day) => {
      if (day.getFullYear() !== selectedYear) return;
      map.set(getDateKey(day), getActivityCount(day));
    });
    return map;
  }, [weeks, selectedYear]);

  const selectedDayKey = getDateKey(selectedDate);
  const selectedDayItems = useMemo(
    () => getActivityItemsForDate(selectedDate),
    [selectedDate],
  );

  const lineData = useMemo(() => {
    const data: { date: Date; count: number }[] = [];
    const endDate = selectedDate;
    const startDate = addDays(endDate, -rangeDays + 1);
    for (let day = startDate; day <= endDate; day = addDays(day, 1)) {
      data.push({ date: day, count: getActivityCount(day) });
    }
    return data;
  }, [rangeDays, selectedDate]);
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
  const todayCount = getActivityCount(today);

  return (
    <ContainerLayout isRoot sidebar={<HomeSidebar />}>
      <div className="flex min-h-full flex-col gap-6 px-6 py-6 lg:px-11">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
          <ProfileCard
            name="霍世杰"
            greeting={greeting}
            todayCount={todayCount}
            updatedAt={today}
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
              lineProps={{
                lineData,
                rangeDays,
                onRangeChange: setRangeDays,
                chartSize,
                chartPaths,
                maxLineCount,
                today,
              }}
            />

            <ActivityList selectedDate={selectedDate} items={selectedDayItems} />
          </div>
        </div>
      </div>
    </ContainerLayout>
  );
};
