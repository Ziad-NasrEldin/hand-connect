import { useTranslation } from 'react-i18next';
import { useUiStore } from '@/store/ui.store';
import { Button } from '../ui/button';

export function LanguageToggle() {
  const { t } = useTranslation();
  const language = useUiStore((state) => state.language);
  const setLanguage = useUiStore((state) => state.setLanguage);
  const next = language === 'ar' ? 'en' : 'ar';

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setLanguage(next)}
      aria-label={t('ui.toggleLanguage')}
    >
      {language === 'ar' ? 'EN' : 'عربي'}
    </Button>
  );
}
