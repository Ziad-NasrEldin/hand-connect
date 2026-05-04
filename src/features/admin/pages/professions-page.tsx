import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { professions } from '@/config/professions';
import { getProfessionActivityLabel } from '@/lib/display';

export function ProfessionsPage() {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('admin.professions')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {professions.map((profession) => (
          <div key={profession.id} className="soft-list-item p-4 sm:p-5">
            <p className="font-semibold text-foreground">
              {profession.nameAr} / {profession.nameEn}
            </p>
            <p className="text-sm text-muted-foreground">
              {getProfessionActivityLabel(profession.active, t)}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
