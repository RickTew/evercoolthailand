'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import en from '@/messages/en.json'
import th from '@/messages/th.json'

type Locale = 'th' | 'en'
type Messages = typeof en

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

const messages: Record<Locale, Messages> = { en, th }

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split('.')
  let current: unknown = obj
  for (const key of keys) {
    if (current == null || typeof current !== 'object') return path
    current = (current as Record<string, unknown>)[key]
  }
  return typeof current === 'string' ? current : path
}

const I18nContext = createContext<I18nContextType>({
  locale: 'th',
  setLocale: () => {},
  t: (key) => key,
})

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('th')

  useEffect(() => {
    const stored = localStorage.getItem('eq-locale') as Locale | null
    if (stored === 'en' || stored === 'th') {
      setLocaleState(stored)
    }
  }, [])

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem('eq-locale', newLocale)
  }

  const t = (key: string, params?: Record<string, string | number>): string => {
    const raw = getNestedValue(messages[locale] as unknown as Record<string, unknown>, key)
    if (!params) return raw
    return raw.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`))
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}
