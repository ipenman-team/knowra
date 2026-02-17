'use client';

import {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { messagesByLocale } from './messages';
import { DEFAULT_LOCALE, type AppLocale, setLocaleCookie } from './locale';

type I18nContextValue = {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export const I18nProvider = memo(function I18nProvider({
  initialLocale,
  children,
}: {
  initialLocale?: AppLocale;
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState<AppLocale>(
    initialLocale ?? DEFAULT_LOCALE,
  );

  const setLocale = useCallback((nextLocale: AppLocale) => {
    setLocaleState(nextLocale);
    setLocaleCookie(nextLocale);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = nextLocale;
    }
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<I18nContextValue>(() => {
    const localeMessages = messagesByLocale[locale] ?? messagesByLocale[DEFAULT_LOCALE];
    const defaultMessages = messagesByLocale[DEFAULT_LOCALE];

    return {
      locale,
      setLocale,
      t: (key: string) => localeMessages[key] ?? defaultMessages[key] ?? key,
    };
  }, [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
});

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}
