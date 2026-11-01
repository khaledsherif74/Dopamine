import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Alert, Button, LoadingView, PasswordField, TextField, apiErrorMessage, loginSchema, useI18n, validate } from '@dopamine/web-shared';
import { useLoginMutation, useOauthLoginMutation } from '@/api/endpoints.js';
import { authActions } from '@/lib/session.js';
import { useAppDispatch, useAuth } from '@/lib/hooks.js';
import { useDocumentTitle } from '@/lib/useDocumentTitle.js';
import { safeRedirect } from '@/features/auth/oauthPayload.js';
import { AuthCard } from '@/components/AuthCard.jsx';
import { SocialButtons } from '@/components/SocialButtons.jsx';

export function LoginPage() {
  const { t } = useI18n();
  useDocumentTitle(t('nav.login'));
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { status } = useAuth();
  const target = safeRedirect(location.state?.from);
  const [login, { isLoading }] = useLoginMutation();
  const [oauthLogin, { isLoading: oauthLoading }] = useOauthLoginMutation();
  const [values, setValues] = useState({ identifier: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  if (status === 'loading') return <LoadingView label={t('common.loading')} />;
  if (status === 'authenticated') return <Navigate to={target} replace />;

  const finish = data => {
    dispatch(authActions.credentialsReceived({ user: data.account, accessToken: data.accessToken }));
    navigate(target, { replace: true });
  };

  async function onSubmit(e) {
    e.preventDefault();
    setServerError('');
    const result = validate(loginSchema, values);
    setErrors(result.errors);
    if (!result.ok) return;
    try {
      finish(await login(result.values).unwrap());
    } catch (err) {
      setServerError(apiErrorMessage(err, t));
    }
  }

  async function onSocial(payload) {
    setServerError('');
    try {
      finish(await oauthLogin(payload).unwrap());
    } catch (err) {
      setServerError(apiErrorMessage(err, t));
    }
  }

  return (
    <AuthCard
      title={t('auth.loginTitle')}
      subtitle={t('auth.loginSubtitle')}
      footer={<>{t('auth.noAccount')} <Link to="/register" state={location.state} className="font-semibold text-primary">{t('nav.register')}</Link></>}
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {location.state?.notice === 'reset' ? <Alert tone="success">{t('auth.resetDone')}</Alert> : null}
        {serverError ? <Alert tone="danger">{serverError}</Alert> : null}
        <TextField label={t('auth.identifier')} autoComplete="username" value={values.identifier} error={errors.identifier && t(errors.identifier)} onChange={e => setValues(v => ({ ...v, identifier: e.target.value }))} />
        <PasswordField label={t('auth.password')} autoComplete="current-password" showLabel={t('auth.show')} hideLabel={t('auth.hide')} value={values.password} error={errors.password && t(errors.password)} onChange={e => setValues(v => ({ ...v, password: e.target.value }))} />
        <div className="text-end"><Link to="/forgot-password" className="text-sm font-medium text-primary">{t('auth.forgot')}</Link></div>
        <Button type="submit" className="w-full" loading={isLoading}>{t('auth.signIn')}</Button>
      </form>
      <div className="mt-5">
        <SocialButtons onPayload={onSocial} onError={() => setServerError(t('auth.socialFailed'))} disabled={oauthLoading} />
      </div>
    </AuthCard>
  );
}
