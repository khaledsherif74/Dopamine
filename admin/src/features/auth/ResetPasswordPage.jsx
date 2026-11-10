import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useResetPasswordMutation } from "@/api/authApi";
import { validateNewPassword } from "./passwordRules";
import { AuthShell, fieldInputClass, fieldLabelClass, primaryButtonClass } from "./AuthShell";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token");
  const [reset, { isLoading }] = useResetPasswordMutation();
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState(null);

  if (!token) {
    return (
      <AuthShell title="Reset password" subtitle="This link is incomplete.">
        <p className="text-sm text-text-primary">Open the link from the email again, or request a new one.</p>
        <p className="mt-4 text-center text-sm">
          <Link to="/forgot-password" className="font-semibold text-primary">Request a new link</Link>
        </p>
      </AuthShell>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const problem = validateNewPassword(newPassword);
    if (problem) {
      setError(problem);
      return;
    }
    try {
      await reset({ token, newPassword }).unwrap();
      navigate("/login", { replace: true, state: { notice: "reset" } });
    } catch (err) {
      setError(err?.data?.message || "Couldn't reset the password. The link may have expired.");
    }
  };

  return (
    <AuthShell title="Choose a new password" subtitle="8–72 characters, with a letter and a number.">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label htmlFor="reset-password" className={fieldLabelClass}>New password</label>
          <input id="reset-password" type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={fieldInputClass} />
        </div>
        {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
        <button type="submit" disabled={isLoading} className={primaryButtonClass}>
          {isLoading ? "Saving…" : "Save new password"}
        </button>
      </form>
    </AuthShell>
  );
}
