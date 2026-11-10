import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Alert, Button, LoadingView, PasswordField, TextField, apiErrorMessage, loginSchema, useI18n, validate } from '@dopamine/web-shared';
import { useLoginMutation } from '@/api/endpoints.js';
import { authActions } from '@/lib/session.js';
import { useAppDispatch, useAuth } from '@/lib/hooks.js';
import { useDocumentTitle } from '@/lib/useDocumentTitle.js';
import { safeRedirect } from '@/lib/safeRedirect.js';
import { AuthCard } from '@/components/AuthCard.jsx';

export function LoginPage() {
  const { t } = useI18n();
  useDocumentTitle(t('auth.signIn'));
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { status } = useAuth();
  const target = safeRedirect(location.state?.from);
  const [login, { isLoading }] = useLoginMutation();
  const [values, setValues] = useState({ identifier: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  if (status === 'loading') return <LoadingView label={t('common.loading')} />;
  if (status === 'authenticated') return <Navigate to={target} replace />;

  async function onSubmit(e) {
    e.preventDefault();
    setServerError('');
    const result = validate(loginSchema, values);
    setErrors(result.errors);
    if (!result.ok) return;
    try {
      const data = await login(result.values).unwrap();
      dispatch(authActions.credentialsReceived({ user: data.account, accessToken: data.accessToken }));
      navigate(target, { replace: true });
    } catch (err) {
      setServerError(apiErrorMessage(err, t));
    }
  }

  return (
    <AuthCard title={t('auth.title')} subtitle={t('auth.subtitle')} footer={<>{t('auth.noAccount')} <Link to="/register" className="font-semibold text-primary">{t('auth.register')}</Link></>}>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {location.state?.notice === 'reset' ? <Alert tone="success">{t('auth.resetDone')}</Alert> : null}
        {serverError ? <Alert tone="danger">{serverError}</Alert> : null}
        <TextField label={t('auth.identifier')} autoComplete="username" value={values.identifier} error={errors.identifier && t(errors.identifier)} onChange={e => setValues(v => ({ ...v, identifier: e.target.value }))} />
        <PasswordField label={t('auth.password')} autoComplete="current-password" showLabel={t('auth.show')} hideLabel={t('auth.hide')} value={values.password} error={errors.password && t(errors.password)} onChange={e => setValues(v => ({ ...v, password: e.target.value }))} />
        <Button type="submit" className="w-full" loading={isLoading}>{t('auth.signIn')}</Button>
        <p className="text-center text-sm"><Link to="/forgot-password" className="font-semibold text-primary">{t('auth.forgot')}</Link></p>
      </form>
    </AuthCard>
  );
}
