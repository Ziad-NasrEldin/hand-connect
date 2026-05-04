import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { getLocalizedMessage } from '@/lib/display';
import { getPostLoginRedirect } from '@/router/redirects';

export function LoginPage() {
  const { t } = useTranslation();
  const { login, user, providerStatus } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('customer@hand.test');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    try {
      await login(email, password);
      const state = await import('@/services/auth.service').then((module) =>
        module.getCurrentSession(),
      );
      navigate(
        getPostLoginRedirect(
          state.user ?? user,
          state.providerStatus ?? providerStatus,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? getLocalizedMessage(err.message, t)
          : t('auth.loginFailed'),
      );
    }
  }

  return (
    <Card className="motion-reveal w-full">
      <CardHeader>
        <div className="brand-eyebrow" />
        <p className="section-label">{t('auth.welcome')}</p>
        <CardTitle>{t('auth.login')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="motion-stagger grid gap-4"
          onSubmit={(event) => void submit(event)}
        >
          <div className="space-y-2">
            <Label htmlFor="email">{t('auth.email')}</Label>
            <Input
              id="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t('auth.password')}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          {error ? (
            <p className="motion-pop text-sm text-destructive">{error}</p>
          ) : null}
          <Button className="w-full" type="submit">
            {t('auth.login')}
          </Button>
          <Link
            className="text-center text-sm font-semibold text-primary"
            to="/register"
          >
            {t('nav.register')}
          </Link>
        </form>
      </CardContent>
    </Card>
  );
}
