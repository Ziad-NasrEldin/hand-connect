import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { getLocalizedMessage } from '@/lib/display';
import { getPostLoginRedirect } from '@/router/redirects';

export function LoginPage() {
  const { t } = useTranslation();
  const { login, loginWithGoogle, user, providerStatus } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('customer@hand.test');
  const [password, setPassword] = useState('pass1234');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    try {
      const state = await login(identifier, password);
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

  async function submitGoogle() {
    setError('');
    try {
      const state = await loginWithGoogle();
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
        <CardTitle as="h1">{t('auth.login')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="motion-stagger grid gap-4"
          onSubmit={(event) => void submit(event)}
        >
          <div className="space-y-2">
            <Label htmlFor="login-identifier">{t('auth.emailOrPhone')}</Label>
            <Input
              id="login-identifier"
              required
              autoComplete="username"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t('auth.password')}</Label>
            <div className="relative">
              <Input
                id="password"
                className="pe-12"
                required
                autoComplete="current-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                aria-label={t(
                  showPassword ? 'auth.hidePassword' : 'auth.showPassword',
                )}
                className="password-reveal-button absolute end-2 top-1/2 inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-[color:var(--hc-surface)] hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--hc-orange-ring)]"
                type="button"
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
          {error ? (
            <p className="motion-pop text-sm text-destructive">{error}</p>
          ) : null}
          <Button className="w-full" type="submit">
            {t('auth.login')}
          </Button>
          <Button
            className="w-full"
            type="button"
            variant="outline"
            onClick={() => void submitGoogle()}
          >
            {t('auth.googleLogin')}
          </Button>
          <Link
            className="motion-press flex min-h-[44px] items-center justify-center text-center text-sm font-semibold text-primary"
            to="/register"
          >
            {t('nav.register')}
          </Link>
        </form>
      </CardContent>
    </Card>
  );
}
