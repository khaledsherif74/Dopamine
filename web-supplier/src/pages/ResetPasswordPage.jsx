import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, Button, PasswordField, apiErrorMessage, resetPasswordSchema, useI18n, validate } from '@dopamine/web-shared';
import { useResetPasswordMutation } from '@/api/endpoints.js';
import { useDocumentTitle } from '@/lib/useDocumentTitle.js';
import { AuthCard } from '@/components/AuthCard.jsx';

export function ResetPasswordPage() {
  const { t } = useI18n();
  useDocumentTitle(t('auth.resetTitle'));
  const [params] = useSearchParams();
  const token = params.get('token');
  const navigate = useNavigate();
  const [reset, { isLoading }] = useResetPasswordMutation();
  const [newPassword, setNewPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  if (!token) {
    return (
      <AuthCard title={t('auth.resetTitle')} footer={<Link to="/forgot-password" className="font-semibold text-primary">{t('auth.forgotTitle')}</Link>}>
        <Alert tone="danger">{t('auth.resetMissing')}</Alert>
      </AuthCard>
    );
  }

  async function onSubmit(e) {
    e.preventDefault();
    const result = validate(resetPasswordSchema, { newPassword });
    setErrors(result.errors);
    if (!result.ok) return;
    try {
      await reset({ token, newPassword: result.values.newPassword }).unwrap();
      navigate('/login', { replace: true, state: { notice: 'reset' } });
    } catch (err) {
      setServerError(apiErrorMessage(err, t));
    }
  }

  return (
    <AuthCard title={t('auth.resetTitle')}>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {serverError ? <Alert tone="danger">{serverError}</Alert> : null}
        <PasswordField label={t('auth.newPassword')} autoComplete="new-password" showLabel={t('auth.show')} hideLabel={t('auth.hide')} hint={t('auth.passwordHint')} value={newPassword} error={errors.newPassword && t(errors.newPassword)} onChange={e => setNewPassword(e.target.value)} />
        <Button type="submit" className="w-full" loading={isLoading}>{t('auth.resetPassword')}</Button>
      </form>
    </AuthCard>
  );
}
