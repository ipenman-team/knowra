'use client';

import { memo } from 'react';
import type { AppLocale } from '@/lib/i18n/locale';
import { useI18n } from '@/lib/i18n/provider';
import {
  DropdownMenuCheckboxItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';

const localeOptions: AppLocale[] = ['zh-CN', 'en-US'];

export const LocaleMenuItem = memo(function LocaleMenuItem() {
  const { locale, setLocale, t } = useI18n();

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>{t('account.language')}</DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        {localeOptions.map((item) => (
          <DropdownMenuCheckboxItem
            key={item}
            checked={locale === item}
            onSelect={() => setLocale(item)}
          >
            {t(`locale.${item}`)}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
});
