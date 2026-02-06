import { format } from 'date-fns';

import { cn } from '@/lib/utils';
import {
  ACTIVITY_LEVELS,
  getActivityLevel,
  getDateKey,
} from './activity-data';

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
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
        不活跃
        {ACTIVITY_LEVELS.map((level, index) => (
          <span
            key={level}
            className={cn(
              'h-3 w-3 rounded-[3px] border border-transparent',
              level,
              index === ACTIVITY_LEVELS.length - 1 ? 'shadow-sm' : '',
            )}
          />
        ))}
        活跃
      </div>

      <div className="flex gap-3">
        <div className="flex w-4 flex-col gap-1 text-[10px] text-muted-foreground">
          {['一', '', '三', '', '五', '', ''].map((label, index) => (
            <div key={`${label}-${index}`} className="h-3">
              {label}
            </div>
          ))}
        </div>
        <div className="space-y-2 overflow-x-auto overflow-y-hidden">
          <div className="flex gap-1">
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
                      title={`${format(day, 'M月d日')} · ${count} 条动态`}
                      className={cn(
                        'h-3 w-3 rounded-[3px] border border-transparent transition',
                        ACTIVITY_LEVELS[level],
                        inYear
                          ? 'hover:ring-1 hover:ring-primary/40'
                          : 'opacity-30',
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

          <div className="flex gap-1 pt-1 text-[10px] leading-none text-muted-foreground whitespace-nowrap">
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
                  {monthLabel ? format(monthLabel, 'M月') : ''}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
