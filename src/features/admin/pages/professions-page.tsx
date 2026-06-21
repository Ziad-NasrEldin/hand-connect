import { FormEvent, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { getProfessionActivityLabel } from '@/lib/display';
import {
  listProfessions,
  saveProfession,
  setProfessionActive,
} from '@/services/admin.service';
import type { Profession } from '@/types/provider';

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function ProfessionsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['admin', 'professions'], queryFn: listProfessions });
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [slug, setSlug] = useState('');
  const [icon, setIcon] = useState('Wrench');

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!user) return;
    const normalizedSlug = slugify(slug || nameEn);
    const nextProfession: Profession = {
      id: normalizedSlug,
      slug: normalizedSlug,
      nameAr,
      nameEn,
      icon,
      active: true,
      sortOrder: (query.data?.length ?? 0) + 1,
    };
    await saveProfession(user.uid, nextProfession);
    setNameAr('');
    setNameEn('');
    setSlug('');
    setIcon('Wrench');
    void queryClient.invalidateQueries({ queryKey: ['admin'] });
    void queryClient.invalidateQueries({ queryKey: ['professions'] });
  }

  async function toggle(profession: Profession) {
    if (!user) return;
    await setProfessionActive(user.uid, profession.id, !profession.active);
    void queryClient.invalidateQueries({ queryKey: ['admin'] });
    void queryClient.invalidateQueries({ queryKey: ['professions'] });
  }

  return (
    <div className="motion-stagger space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.professions')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="motion-stagger grid gap-3 md:grid-cols-2" onSubmit={(event) => void submit(event)}>
            <div className="space-y-2">
              <Label htmlFor="profession-name-ar">{t('admin.professionNameAr')}</Label>
              <Input id="profession-name-ar" required value={nameAr} onChange={(event) => setNameAr(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profession-name-en">{t('admin.professionNameEn')}</Label>
              <Input id="profession-name-en" required value={nameEn} onChange={(event) => setNameEn(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profession-slug">{t('admin.professionSlug')}</Label>
              <Input id="profession-slug" value={slug} onChange={(event) => setSlug(event.target.value)} placeholder={slugify(nameEn)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profession-icon">{t('admin.professionIcon')}</Label>
              <Input id="profession-icon" required value={icon} onChange={(event) => setIcon(event.target.value)} />
            </div>
            <Button className="w-full md:w-auto" type="submit">
              {t('admin.saveProfession')}
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="motion-stagger space-y-3 p-5">
          {query.data?.map((profession) => (
            <div key={profession.id} className="soft-list-item flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div>
                <p className="font-semibold text-foreground">
                  {profession.nameAr} / {profession.nameEn}
                </p>
                <p className="text-sm text-muted-foreground">
                  {profession.slug} - {getProfessionActivityLabel(profession.active, t)}
                </p>
              </div>
              <Button variant="outline" onClick={() => void toggle(profession)}>
                {profession.active ? t('common.inactive') : t('common.active')}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
