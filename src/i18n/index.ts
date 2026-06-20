import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ar from './locales/ar.json';
import en from './locales/en.json';

export type AppLanguage = 'ar' | 'en';
export const defaultLanguage: AppLanguage = 'ar';

void i18n.use(initReactI18next).init({
  resources: { ar: { translation: ar }, en: { translation: en } },
  lng: (localStorage.getItem('herafy-language') as AppLanguage | null) ?? defaultLanguage,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
