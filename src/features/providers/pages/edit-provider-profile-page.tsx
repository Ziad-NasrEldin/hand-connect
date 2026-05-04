import { FormEvent, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { getNeighborhoodName, neighborhoods } from '@/config/neighborhoods';
import { getProfessionName, professions } from '@/config/professions';
import { useAuth } from '@/hooks/use-auth';
import { useOwnedProvider } from '@/hooks/use-provider-profile';
import { updateProviderProfile } from '@/services/providers.service';

export function EditProviderProfilePage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const provider = useOwnedProvider(user?.uid);
  const queryClient = useQueryClient();
  const language = i18n.language === 'en' ? 'en' : 'ar';
  const [bio, setBio] = useState('');
  const [profession, setProfession] = useState('');
  const [area, setArea] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!provider.data) return;
    await updateProviderProfile(provider.data.id, {
      bio: bio || provider.data.bio,
      profession: profession || provider.data.profession,
      serviceAreas: [
        {
          neighborhood: area || provider.data.serviceAreaKeys[0],
          city: 'cairo',
        },
      ],
      serviceAreaKeys: [area || provider.data.serviceAreaKeys[0]],
    });
    void queryClient.invalidateQueries({ queryKey: ['provider'] });
  }

  return (
    <Card>
      <CardHeader>
        <div className="brand-eyebrow" />
        <p className="section-label">{t('provider.settingsEyebrow')}</p>
        <CardTitle>{t('provider.edit')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="motion-stagger grid gap-4"
          onSubmit={(event) => void submit(event)}
        >
          <div className="space-y-2">
            <Input defaultValue={provider.data?.displayName} disabled />
          </div>
          <div className="space-y-2">
            <Input
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              placeholder={provider.data?.bio ?? t('provider.bioPlaceholder')}
            />
          </div>
          <div className="space-y-2">
            <Select
              value={profession}
              onChange={(event) => setProfession(event.target.value)}
              placeholder={
                provider.data
                  ? getProfessionName(provider.data.profession, language)
                  : undefined
              }
              options={professions.map((item) => ({
                value: item.slug,
                label: language === 'ar' ? item.nameAr : item.nameEn,
              }))}
            />
          </div>
          <div className="space-y-2">
            <Select
              value={area}
              onChange={(event) => setArea(event.target.value)}
              placeholder={
                provider.data
                  ? getNeighborhoodName(
                      provider.data.serviceAreaKeys[0],
                      language,
                    )
                  : undefined
              }
              options={neighborhoods.map((item) => ({
                value: item.slug,
                label: language === 'ar' ? item.nameAr : item.nameEn,
              }))}
            />
          </div>
          <Button className="w-full sm:w-auto" type="submit">
            {t('common.save')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
