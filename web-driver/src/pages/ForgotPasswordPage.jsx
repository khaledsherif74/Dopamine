import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Alert,
  Button,
  TextField,
  apiErrorMessage,
  forgotPasswordSchema,
  useI18n,
  validate,
} from "@dopamine/web-shared";
import { useForgotPasswordMutation } from "@/api/endpoints.js";
import { useDocumentTitle } from "@/lib/useDocumentTitle.js";
import { AuthCard } from "@/components/AuthCard.jsx";

export function ForgotPasswordPage() {
  const { t } = useI18n();
  useDocumentTitle(t("auth.forgotTitle"));
  const [forgot, { isLoading }] = useForgotPasswordMutation();
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({});
  const [state, setState] = useState({ sent: false, error: "" });

  async function onSubmit(e) {
    e.preventDefault();
    const result = validate(forgotPasswordSchema, { email });
    setErrors(result.errors);
    if (!result.ok) return;
    try {
      await forgot(result.values).unwrap();
      setState({ sent: true, error: "" });
    } catch (err) {
      setState({ sent: false, error: apiErrorMessage(err, t) });
    }
  }

  return (
    <AuthCard
      title={t("auth.forgotTitle")}
      subtitle={t("auth.forgotSubtitle")}
      footer={
        <Link to="/login" className="font-semibold text-primary">
          {t("auth.backToLogin")}
        </Link>
      }
    >
      {state.sent ? (
        <Alert tone="success">{t("auth.forgotSent")}</Alert>
      ) : (
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          {state.error ? <Alert tone="danger">{state.error}</Alert> : null}
          <TextField
            label={t("auth.email")}
            type="email"
            autoComplete="email"
            value={email}
            error={errors.email && t(errors.email)}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button type="submit" className="w-full" loading={isLoading}>
            {t("auth.sendLink")}
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
