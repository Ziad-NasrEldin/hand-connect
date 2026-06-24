import { FormEvent, useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { neighborhoods } from '@/config/neighborhoods';
import { professions } from '@/config/professions';
import { getLocalizedMessage } from '@/lib/display';
import * as authService from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';
import type { ProviderIdentityDocument } from '@/types/provider';

const maxIdentityDocumentSize = 3 * 1024 * 1024;

export function RegisterPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const setSession = useAuthStore((state) => state.setSession);
  const [role, setRole] = useState<'customer' | 'provider'>(() =>
    isProviderJoinPath(location.pathname, searchParams)
      ? 'provider'
      : 'customer',
  );
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [profession, setProfession] = useState('plumbing');
  const [serviceArea, setServiceArea] = useState('new-cairo');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [identityFile, setIdentityFile] = useState<File | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isProviderJoinPath(location.pathname, searchParams)) {
      setRole('provider');
    }
  }, [location.pathname, searchParams]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    try {
      let identityDocument: Omit<
        ProviderIdentityDocument,
        'providerId'
      > | null = null;
      if (role === 'provider') {
        if (!identityFile) {
          setError(t('auth.identityRequired'));
          return;
        }
        identityDocument = await fileToIdentityDocument(identityFile);
      }
      if (password.length < 8) {
        setError(t('auth.passwordTooShort'));
        return;
      }
      if (password !== confirmPassword) {
        setError(t('auth.passwordMismatch'));
        return;
      }
      const session =
        role === 'customer'
          ? await authService.registerCustomer({
              displayName,
              email,
              password,
              phone,
            })
          : await authService.registerProvider({
              displayName,
              email,
              password,
              phone,
              profession,
              serviceArea,
              whatsappNumber,
              identityDocument: identityDocument!,
            });
      setSession(session.user, session.providerStatus);
      navigate(role === 'provider' ? '/pending' : '/search');
    } catch (err) {
      setError(
        err instanceof Error
          ? getLocalizedMessage(err.message, t)
          : t('auth.registrationFailed'),
      );
    }
  }

  const language = i18n.language === 'en' ? 'en' : 'ar';

  return (
    <Card className="motion-reveal w-full">
      <CardHeader>
        <div className="brand-eyebrow" />
        <p className="section-label">{t('auth.join')}</p>
        <CardTitle as="h1">{t('nav.register')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="motion-stagger grid gap-4"
          onSubmit={(event) => void submit(event)}
        >
          <div className="motion-stagger grid gap-2 md:grid-cols-2">
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
            <Label htmlFor="register-name">{t('auth.name')}</Label>
            <Input
              id="register-name"
              required
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="register-email">{t('auth.email')}</Label>
            <Input
              id="register-email"
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="register-password">{t('auth.password')}</Label>
            <Input
              id="register-password"
              required
              minLength={8}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="register-confirm-password">
              {t('auth.confirmPassword')}
            </Label>
            <Input
              id="register-confirm-password"
              required
              minLength={8}
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="register-phone">{t('auth.phone')}</Label>
            <Input
              id="register-phone"
              required
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </div>
          {role === 'provider' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="register-profession">
                  {t('auth.profession')}
                </Label>
                <Select
                  id="register-profession"
                  value={profession}
                  onChange={(event) => setProfession(event.target.value)}
                  options={professions.map((item) => ({
                    value: item.slug,
                    label: language === 'ar' ? item.nameAr : item.nameEn,
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-area">{t('auth.area')}</Label>
                <Select
                  id="register-area"
                  value={serviceArea}
                  onChange={(event) => setServiceArea(event.target.value)}
                  options={neighborhoods.map((item) => ({
                    value: item.slug,
                    label: language === 'ar' ? item.nameAr : item.nameEn,
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-whatsapp">{t('auth.whatsapp')}</Label>
                <Input
                  id="register-whatsapp"
                  required
                  value={whatsappNumber}
                  onChange={(event) => setWhatsappNumber(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="identity-document">
                  {t('auth.nationalId')}
                </Label>
                <Input
                  id="identity-document"
                  aria-label={t('auth.nationalIdAria')}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml,application/pdf"
                  required
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    if (file && file.size > maxIdentityDocumentSize) {
                      setIdentityFile(null);
                      setError(t('auth.identityTooLarge'));
                      event.currentTarget.value = '';
                      return;
                    }
                    setError('');
                    setIdentityFile(file);
                  }}
                />
                <p className="motion-reveal text-xs leading-6 text-muted-foreground">
                  {t('auth.identityHelp')}
                </p>
              </div>
            </>
          ) : null}
          {error ? (
            <p className="motion-pop text-sm text-destructive">{error}</p>
          ) : null}
          <Button className="w-full" type="submit">
            {t('nav.register')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function isProviderJoinPath(pathname: string, searchParams: URLSearchParams) {
  return (
    pathname === '/join-provider' || searchParams.get('role') === 'provider'
  );
}

function fileToIdentityDocument(
  file: File,
): Promise<Omit<ProviderIdentityDocument, 'providerId'>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('error.auth.identityReadFailed'));
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('error.auth.identityReadFailed'));
        return;
      }
      resolve({
        fileName: file.name,
        fileType: file.type || 'application/octet-stream',
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
        previewDataUrl: reader.result,
      });
    };
    reader.readAsDataURL(file);
  });
}
