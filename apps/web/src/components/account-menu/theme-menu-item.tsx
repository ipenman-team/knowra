'use client';

import { memo } from 'react';
import { useTheme } from 'next-themes';
import {
  DropdownMenuCheckboxItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { useI18n } from '@/lib/i18n/provider';

type ThemeMode = 'light' | 'dark' | 'system';

const themeOptions: Array<{
  value: ThemeMode;
  labelKey: string;
}> = [
  { value: 'light', labelKey: 'theme.light' },
  { value: 'dark', labelKey: 'theme.dark' },
  { value: 'system', labelKey: 'theme.system' },
];

export const ThemeMenuItem = memo(function ThemeMenuItem() {
  const { theme, setTheme } = useTheme();
  const { t } = useI18n();
  const selectedTheme: ThemeMode =
    theme === 'dark' || theme === 'system' ? theme : 'light';

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>{t('account.theme')}</DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        {themeOptions.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={selectedTheme === option.value}
            onSelect={() => setTheme(option.value)}
          >
            {t(option.labelKey)}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
});
