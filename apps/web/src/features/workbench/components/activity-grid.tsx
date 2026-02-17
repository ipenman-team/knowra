import { useMemo } from 'react';

import { cn } from '@/lib/utils';
import {
  ACTIVITY_LEVELS,
  getActivityLevel,
  getDateKey,
} from './activity-data';
import { useI18n } from '@/lib/i18n/provider';

type ActivityGridProps = {
  weeks: Date[][];
  selectedYear: number;
  selectedDayKey: string;
  activityMap: Map<string, number>;
  onSelectDate: (date: Date) => void;
};

export function ActivityGrid({
  weeks,
  selectedYear,
  selectedDayKey,
  activityMap,
  onSelectDate,
}: ActivityGridProps) {
  const { t, locale } = useI18n();
  const weekdayFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        weekday: 'narrow',
      }),
    [locale],
  );
  const monthFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        month: locale === 'zh-CN' ? 'numeric' : 'short',
      }),
    [locale],
  );
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        month: 'numeric',
        day: 'numeric',
      }),
    [locale],
  );

  const weekHintLabels = [
    weekdayFormatter.format(new Date(2024, 0, 1)),
    '',
    weekdayFormatter.format(new Date(2024, 0, 3)),
    '',
    weekdayFormatter.format(new Date(2024, 0, 5)),
    '',
    '',
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
        {t('workbench.inactive')}
        {ACTIVITY_LEVELS.map((level, index) => (
          <span
            key={level}
            className={cn(
              'h-2.5 w-2.5 rounded-[3px] border border-transparent sm:h-3 sm:w-3',
              level,
              index === ACTIVITY_LEVELS.length - 1 ? 'shadow-sm' : '',
            )}
          />
        ))}
        {t('workbench.active')}
      </div>

      <div className="flex gap-2 sm:gap-3">
        <div className="hidden w-4 flex-col gap-1 text-[10px] text-muted-foreground sm:flex">
          {weekHintLabels.map((label, index) => (
            <div key={`${label}-${index}`} className="h-2.5 sm:h-3">
              {label}
            </div>
          ))}
        </div>
        <div className="min-w-0 flex-1 space-y-2 overflow-x-auto overflow-y-hidden pb-1">
          <div className="flex w-max gap-1">
            {weeks.map((week, weekIndex) => (
              <div key={`week-${weekIndex}`} className="flex flex-col gap-1">
                {week.map((day) => {
                  const inYear = day.getFullYear() === selectedYear;
                  const dateKey = getDateKey(day);
                  const count = inYear ? activityMap.get(dateKey) ?? 0 : 0;
                  const level = getActivityLevel(count);
                  const isSelected = dateKey === selectedDayKey;
                  return (
                    <button
                      key={dateKey}
                      type="button"
                      title={`${dateFormatter.format(day)} · ${count} ${t('workbench.itemSuffix')}`}
                      className={cn(
                        'h-2.5 w-2.5 rounded-[3px] border border-transparent transition sm:h-3 sm:w-3',
                        ACTIVITY_LEVELS[level],
                        inYear ? 'hover:ring-1 hover:ring-primary/40' : 'opacity-30',
                        isSelected ? 'ring-2 ring-primary' : '',
                      )}
                      disabled={!inYear}
                      onClick={() => onSelectDate(day)}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          <div className="flex w-max gap-1 pt-1 text-[10px] leading-none text-muted-foreground whitespace-nowrap">
            {weeks.map((week, index) => {
              const monthLabel = week.find(
                (day) =>
                  day.getDate() === 1 && day.getFullYear() === selectedYear,
              );
              return (
                <div
                  key={`month-${index}`}
                  className="w-3 text-[10px] leading-none whitespace-nowrap"
                >
                  {monthLabel
                    ? monthFormatter.format(monthLabel) + (locale === 'zh-CN' ? '月' : '')
                    : ''}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
