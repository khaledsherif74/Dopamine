import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Alert, Button, Checkbox, LoadingView, PasswordField, TextField, apiErrorMessage, registerSchema, useI18n, validate } from '@dopamine/web-shared';
import { config } from '@/config.js';
import { useOauthLoginMutation, useRegisterMutation } from '@/api/endpoints.js';
import { authActions } from '@/lib/session.js';
import { useAppDispatch, useAuth } from '@/lib/hooks.js';
import { useDocumentTitle } from '@/lib/useDocumentTitle.js';
import { interpolateNodes } from '@/lib/interpolateNodes.js';
import { safeRedirect } from '@/features/auth/oauthPayload.js';
import { AuthCard } from '@/components/AuthCard.jsx';
import { SocialButtons } from '@/components/SocialButtons.jsx';

const empty = { name: '', email: '', phone: '', password: '', acceptTerms: false };

function PolicyLink({ href, children }) {
  return href ? <a href={href} target="_blank" rel="noreferrer" className="font-semibold text-primary underline">{children}</a> : <span className="font-semibold">{children}</span>;
}

export function RegisterPage() {
  const { t } = useI18n();
  useDocumentTitle(t('nav.register'));
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { status } = useAuth();
  const [register, { isLoading }] = useRegisterMutation();
  const [oauthLogin, { isLoading: oauthLoading }] = useOauthLoginMutation();
  const [values, setValues] = useState(empty);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const target = safeRedirect(location.state?.from);
  const set = key => e => setValues(v => ({ ...v, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  if (status === 'loading') return <LoadingView label={t('common.loading')} />;
  if (status === 'authenticated') return <Navigate to={target} replace />;

  async function onSubmit(e) {
    e.preventDefault();
    setServerError('');
    const result = validate(registerSchema, values);
    setErrors(result.errors);
    if (!result.ok) return;
    const { acceptTerms: _terms, ...body } = result.values; // the server records the acceptance itself
    try {
      const data = await register(body).unwrap();
      dispatch(authActions.credentialsReceived({ user: data.account, accessToken: data.accessToken }));
      navigate('/verify-phone', { replace: true, state: { from: target } });
    } catch (err) {
      setServerError(apiErrorMessage(err, t));
    }
  }

  async function onSocial(payload) {
    setServerError('');
    try {
      const data = await oauthLogin(payload).unwrap();
      dispatch(authActions.credentialsReceived({ user: data.account, accessToken: data.accessToken }));
      navigate(target, { replace: true });
    } catch (err) {
      setServerError(apiErrorMessage(err, t));
    }
  }

  const termsLabel = interpolateNodes(t('auth.acceptTerms', { terms: '{{terms}}', privacy: '{{privacy}}' }), {
    terms: <PolicyLink key="terms" href={config.termsUrl}>{t('footer.terms')}</PolicyLink>,
    privacy: <PolicyLink key="privacy" href={config.privacyUrl}>{t('footer.privacy')}</PolicyLink>,
  });

  return (
    <AuthCard
      title={t('auth.registerTitle')}
      subtitle={t('auth.registerSubtitle')}
      footer={<>{t('auth.haveAccount')} <Link to="/login" state={location.state} className="font-semibold text-primary">{t('nav.login')}</Link></>}
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {serverError ? <Alert tone="danger">{serverError}</Alert> : null}
        <TextField label={t('auth.name')} autoComplete="name" value={values.name} error={errors.name && t(errors.name)} onChange={set('name')} />
        <TextField label={t('auth.email')} type="email" autoComplete="email" value={values.email} error={errors.email && t(errors.email)} onChange={set('email')} />
        <TextField label={t('auth.phone')} type="tel" autoComplete="tel" dir="ltr" hint={t('auth.phoneHint')} value={values.phone} error={errors.phone && t(errors.phone)} onChange={set('phone')} />
        <PasswordField label={t('auth.password')} autoComplete="new-password" showLabel={t('auth.show')} hideLabel={t('auth.hide')} hint={t('auth.passwordHint')} value={values.password} error={errors.password && t(errors.password)} onChange={set('password')} />
        <Checkbox label={termsLabel} checked={values.acceptTerms} error={errors.acceptTerms && t(errors.acceptTerms)} onChange={set('acceptTerms')} />
        <Button type="submit" className="w-full" loading={isLoading}>{t('auth.createAccount')}</Button>
      </form>
      <div className="mt-5">
        <SocialButtons onPayload={onSocial} onError={() => setServerError(t('auth.socialFailed'))} disabled={oauthLoading} />
      </div>
    </AuthCard>
  );
}
