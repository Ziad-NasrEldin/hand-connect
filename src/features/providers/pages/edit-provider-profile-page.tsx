import { FormEvent, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
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
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [whatsappVisible, setWhatsappVisible] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!provider.data) return;
    await updateProviderProfile(provider.data.id, {
      bio: bio || provider.data.bio,
      profession: profession || provider.data.profession,
      whatsappNumber: whatsappNumber || provider.data.whatsappNumber,
      whatsappVisible:
        whatsappVisible === ''
          ? provider.data.whatsappVisible
          : whatsappVisible === 'true',
      serviceAreas: [
        {
          neighborhood: area || provider.data.serviceAreaKeys[0],
          city: 'cairo',
        },
      ],
      serviceAreaKeys: [area || provider.data.serviceAreaKeys[0]],
      profilePhotoFile: photoFile,
    });
    setPhotoFile(null);
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
            <Label htmlFor="provider-display-name">{t('auth.name')}</Label>
            <Input
              id="provider-display-name"
              defaultValue={provider.data?.displayName}
              disabled
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="provider-bio">{t('provider.bioPlaceholder')}</Label>
            <Textarea
              id="provider-bio"
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              placeholder={provider.data?.bio ?? t('provider.bioPlaceholder')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="provider-profession">{t('auth.profession')}</Label>
            <Select
              id="provider-profession"
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
            <Label htmlFor="provider-area">{t('auth.area')}</Label>
            <Select
              id="provider-area"
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
          <div className="space-y-2">
            <Label htmlFor="provider-whatsapp">{t('auth.whatsapp')}</Label>
            <Input
              id="provider-whatsapp"
              value={whatsappNumber}
              onChange={(event) => setWhatsappNumber(event.target.value)}
              placeholder={provider.data?.whatsappNumber}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="provider-whatsapp-visible">
              {t('provider.whatsappVisibility')}
            </Label>
            <Select
              id="provider-whatsapp-visible"
              value={whatsappVisible}
              onChange={(event) => setWhatsappVisible(event.target.value)}
              placeholder={
                provider.data?.whatsappVisible
                  ? t('common.active')
                  : t('common.inactive')
              }
              options={[
                { value: 'true', label: t('common.active') },
                { value: 'false', label: t('common.inactive') },
              ]}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="provider-photo">{t('provider.photo')}</Label>
            <Input
              id="provider-photo"
              type="file"
              accept="image/*"
              onChange={(event) => setPhotoFile(event.target.files?.[0] ?? null)}
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
