import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Alert, Button, Checkbox, LoadingView, PasswordField, TextField, apiErrorMessage, useI18n } from '@dopamine/web-shared';
import { useRegisterMutation } from '@/api/endpoints.js';
import { authActions } from '@/lib/session.js';
import { useAppDispatch, useAuth } from '@/lib/hooks.js';
import { useDocumentTitle } from '@/lib/useDocumentTitle.js';
import { validateSupplierRegistration } from '@/features/auth/registerForm.js';
import { AuthCard } from '@/components/AuthCard.jsx';

const empty = { shopName: '', email: '', phone: '', password: '', address: '', acceptTerms: false };

export function RegisterPage() {
  const { t } = useI18n();
  useDocumentTitle(t('auth.register'));
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { status } = useAuth();
  const [register, { isLoading }] = useRegisterMutation();
  const [values, setValues] = useState(empty);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  if (status === 'loading') return <LoadingView label={t('common.loading')} />;
  if (status === 'authenticated') return <Navigate to="/" replace />;

  const set = key => e => setValues(v => ({ ...v, [key]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    setServerError('');
    const result = validateSupplierRegistration(values);
    setErrors(result.errors);
    if (!result.ok) return;
    try {
      const data = await register(result.body).unwrap();
      dispatch(authActions.credentialsReceived({ user: data.account, accessToken: data.accessToken }));
      navigate('/', { replace: true });
    } catch (err) {
      setServerError(apiErrorMessage(err, t));
    }
  }

  return (
    <AuthCard title={t('auth.registerTitle')} subtitle={t('auth.registerSubtitle')} footer={<>{t('auth.haveAccount')} <Link to="/login" className="font-semibold text-primary">{t('auth.signIn')}</Link></>}>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {serverError ? <Alert tone="danger">{serverError}</Alert> : null}
        <TextField label={t('shop.name')} value={values.shopName} error={errors.shopName && t(errors.shopName)} onChange={set('shopName')} />
        <TextField label={t('auth.email')} type="email" autoComplete="email" value={values.email} error={errors.email && t(errors.email)} onChange={set('email')} />
        <TextField label={t('shop.phone')} type="tel" autoComplete="tel" dir="ltr" hint={t('shop.phoneHint')} value={values.phone} error={errors.phone && t(errors.phone)} onChange={set('phone')} />
        <TextField label={t('shop.addressOptional')} autoComplete="street-address" value={values.address} error={errors.address && t(errors.address)} onChange={set('address')} />
        <PasswordField label={t('auth.password')} autoComplete="new-password" showLabel={t('auth.show')} hideLabel={t('auth.hide')} hint={t('auth.passwordHint')} value={values.password} error={errors.password && t(errors.password)} onChange={set('password')} />
        <Checkbox label={t('auth.acceptTerms')} checked={values.acceptTerms} error={errors.acceptTerms && t(errors.acceptTerms)} onChange={e => setValues(v => ({ ...v, acceptTerms: e.target.checked }))} />
        <Alert tone="info">{t('auth.approvalNote')}</Alert>
        <Button type="submit" className="w-full" loading={isLoading}>{t('auth.register')}</Button>
      </form>
    </AuthCard>
  );
}
