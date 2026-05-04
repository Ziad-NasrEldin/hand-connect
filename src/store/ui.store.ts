import i18n from '@/i18n';
import type { AppLanguage } from '@/types/user';
import { create } from 'zustand';

interface UiState {
  language: AppLanguage;
  direction: 'rtl' | 'ltr';
  setLanguage: (language: AppLanguage) => void;
  hydrateLanguage: () => void;
}

const storageKey = 'hand-connect-language';

function applyLanguage(language: AppLanguage) {
  document.documentElement.lang = language;
  document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  localStorage.setItem(storageKey, language);
  void i18n.changeLanguage(language);
}

export const useUiStore = create<UiState>((set) => ({
  language: 'ar',
  direction: 'rtl',
  setLanguage: (language) => {
    applyLanguage(language);
    set({ language, direction: language === 'ar' ? 'rtl' : 'ltr' });
  },
  hydrateLanguage: () => {
    const language = (localStorage.getItem(storageKey) as AppLanguage | null) ?? 'ar';
    applyLanguage(language);
    set({ language, direction: language === 'ar' ? 'rtl' : 'ltr' });
  },
}));
