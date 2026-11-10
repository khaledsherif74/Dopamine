import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  Alert,
  Button,
  LoadingView,
  PasswordField,
  apiErrorMessage,
  useI18n,
} from "@dopamine/web-shared";
import { useChangePasswordMutation } from "@/api/endpoints.js";
import { authActions } from "@/lib/session.js";
import { useAppDispatch, useAuth } from "@/lib/hooks.js";
import { useDocumentTitle } from "@/lib/useDocumentTitle.js";
import { validatePasswordChange } from "@/features/auth/passwordForm.js";
import { AuthCard } from "@/components/AuthCard.jsx";

export function ChangePasswordPage() {
  const { t } = useI18n();
  useDocumentTitle(t("password.title"));
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { status, user } = useAuth();
  const [change, { isLoading }] = useChangePasswordMutation();
  const [values, setValues] = useState({
    currentPassword: "",
    newPassword: "",
    confirm: "",
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");

  if (status === "loading") return <LoadingView label={t("common.loading")} />;
  if (status !== "authenticated") return <Navigate to="/login" replace />;
  const forced = user?.mustChangePassword === true;

  async function onSubmit(e) {
    e.preventDefault();
    setServerError("");
    const result = validatePasswordChange(values);
    setErrors(result.errors);
    if (!result.ok) return;
    try {
      await change(result.values).unwrap();
      dispatch(authActions.loggedOut());
      navigate("/login", {
        replace: true,
        state: { notice: "passwordChanged" },
      });
    } catch (err) {
      setServerError(apiErrorMessage(err, t));
    }
  }

  const set = (key) => (e) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));
  const pw = { showLabel: t("auth.show"), hideLabel: t("auth.hide") };
  return (
    <AuthCard
      title={t("password.title")}
      subtitle={forced ? t("password.forced") : t("password.subtitle")}
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {serverError ? <Alert tone="danger">{serverError}</Alert> : null}
        <PasswordField
          {...pw}
          label={t("password.current")}
          autoComplete="current-password"
          value={values.currentPassword}
          error={errors.currentPassword && t(errors.currentPassword)}
          onChange={set("currentPassword")}
        />
        <PasswordField
          {...pw}
          label={t("password.new")}
          autoComplete="new-password"
          hint={t("password.hint")}
          value={values.newPassword}
          error={errors.newPassword && t(errors.newPassword)}
          onChange={set("newPassword")}
        />
        <PasswordField
          {...pw}
          label={t("password.confirm")}
          autoComplete="new-password"
          value={values.confirm}
          error={errors.confirm && t(errors.confirm)}
          onChange={set("confirm")}
        />
        <Button type="submit" className="w-full" loading={isLoading}>
          {t("password.submit")}
        </Button>
      </form>
    </AuthCard>
  );
}
