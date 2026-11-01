import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Alert, Button, TextField, apiErrorMessage, otpSchema, useI18n, validate } from '@dopamine/web-shared';
import { useSendOtpMutation, useVerifyOtpMutation } from '@/api/endpoints.js';
import { authActions } from '@/lib/session.js';
import { useAppDispatch, useAuth } from '@/lib/hooks.js';
import { useDocumentTitle } from '@/lib/useDocumentTitle.js';
import { safeRedirect } from '@/features/auth/oauthPayload.js';
import { AuthCard } from '@/components/AuthCard.jsx';

export function VerifyPhonePage() {
  const { t } = useI18n();
  useDocumentTitle(t('auth.verifyTitle'));
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const next = safeRedirect(location.state?.from);
  const [sendOtp, { isLoading: sending }] = useSendOtpMutation();
  const [verifyOtp, { isLoading: verifying }] = useVerifyOtpMutation();
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState('');
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ tone: null, text: '' });

  if (user?.phoneVerifiedAt) {
    return (
      <AuthCard title={t('auth.verifyTitle')}>
        <Alert tone="success">{t('auth.verified')}</Alert>
        <Link to={next} className="mt-4 inline-block font-semibold text-primary">{t('common.next')}</Link>
      </AuthCard>
    );
  }

  async function send() {
    setMessage({ tone: null, text: '' });
    try {
      await sendOtp({ phone: user.phone }).unwrap();
      setSent(true);
      setMessage({ tone: 'info', text: t('auth.codeSent') });
    } catch (err) {
      setMessage({ tone: 'danger', text: apiErrorMessage(err, t) });
    }
  }

  async function verify(e) {
    e.preventDefault();
    const result = validate(otpSchema, { code });
    setErrors(result.errors);
    if (!result.ok) return;
    try {
      await verifyOtp({ phone: user.phone, code: result.values.code }).unwrap();
      dispatch(authActions.userUpdated({ phoneVerifiedAt: new Date().toISOString() }));
      navigate(next, { replace: true });
    } catch (err) {
      setMessage({ tone: 'danger', text: apiErrorMessage(err, t) });
    }
  }

  return (
    <AuthCard title={t('auth.verifyTitle')} subtitle={t('auth.verifySubtitle', { phone: user?.phone ?? '' })} footer={<Link to={next} className="font-semibold text-primary">{t('auth.skip')}</Link>}>
      <div className="space-y-4">
        {message.text ? <Alert tone={message.tone}>{message.text}</Alert> : null}
        {!sent ? (
          <Button className="w-full" loading={sending} onClick={send}>{t('auth.sendCode')}</Button>
        ) : (
          <form onSubmit={verify} noValidate className="space-y-4">
            <TextField label={t('auth.code')} inputMode="numeric" autoComplete="one-time-code" maxLength={6} dir="ltr" value={code} error={errors.code && t(errors.code)} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} />
            <Button type="submit" className="w-full" loading={verifying}>{t('auth.verify')}</Button>
            <Button variant="ghost" className="w-full" loading={sending} onClick={send}>{t('auth.resendCode')}</Button>
          </form>
        )}
      </div>
    </AuthCard>
  );
}
