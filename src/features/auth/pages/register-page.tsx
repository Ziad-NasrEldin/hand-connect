import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { neighborhoods } from '@/config/neighborhoods';
import { professions } from '@/config/professions';
import * as authService from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';

export function RegisterPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const [role, setRole] = useState<'customer' | 'provider'>('customer');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [profession, setProfession] = useState('plumbing');
  const [serviceArea, setServiceArea] = useState('new-cairo');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    try {
      const session =
        role === 'customer'
          ? await authService.registerCustomer({
              displayName,
              email,
              password: 'password',
              phone,
            })
          : await authService.registerProvider({
              displayName,
              email,
              password: 'password',
              phone,
              profession,
              serviceArea,
              whatsappNumber,
            });
      setSession(session.user, session.providerStatus);
      navigate(role === 'provider' ? '/pending' : '/search');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('auth.registrationFailed'),
      );
    }
  }

  const language = i18n.language === 'en' ? 'en' : 'ar';

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="brand-eyebrow" />
        <p className="section-label">{t('auth.join')}</p>
        <CardTitle>{t('nav.register')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={(event) => void submit(event)}>
          <div className="grid gap-2 md:grid-cols-2">
            <Button
              className="w-full"
              type="button"
              variant={role === 'customer' ? 'default' : 'outline'}
              onClick={() => setRole('customer')}
            >
              {t('auth.registerCustomer')}
            </Button>
            <Button
              className="w-full"
              type="button"
              variant={role === 'provider' ? 'default' : 'outline'}
              onClick={() => setRole('provider')}
            >
              {t('auth.registerProvider')}
            </Button>
          </div>
          <div className="space-y-2">
            <Label>{t('auth.name')}</Label>
            <Input
              required
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('auth.email')}</Label>
            <Input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('auth.phone')}</Label>
            <Input
              required
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </div>
          {role === 'provider' ? (
            <>
              <div className="space-y-2">
                <Label>{t('auth.profession')}</Label>
                <Select
                  value={profession}
                  onChange={(event) => setProfession(event.target.value)}
                  options={professions.map((item) => ({
                    value: item.slug,
                    label: language === 'ar' ? item.nameAr : item.nameEn,
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('auth.area')}</Label>
                <Select
                  value={serviceArea}
                  onChange={(event) => setServiceArea(event.target.value)}
                  options={neighborhoods.map((item) => ({
                    value: item.slug,
                    label: language === 'ar' ? item.nameAr : item.nameEn,
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('auth.whatsapp')}</Label>
                <Input
                  required
                  value={whatsappNumber}
                  onChange={(event) => setWhatsappNumber(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('auth.nationalId')}</Label>
                <Input aria-label={t('auth.nationalIdAria')} type="file" />
              </div>
            </>
          ) : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button className="w-full" type="submit">
            {t('nav.register')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
