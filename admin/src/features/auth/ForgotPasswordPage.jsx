import { useState } from "react";
import { Link } from "react-router-dom";
import { useForgotPasswordMutation } from "@/api/authApi";
import { validateEmail } from "./passwordRules";
import { AuthShell, fieldInputClass, fieldLabelClass, primaryButtonClass } from "./AuthShell";

export function ForgotPasswordPage() {
  const [forgot, { isLoading }] = useForgotPasswordMutation();
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const problem = validateEmail(email);
    if (problem) {
      setError(problem);
      return;
    }
    try {
      await forgot({ email: email.trim().toLowerCase() }).unwrap();
      setSent(true);
    } catch (err) {
      setError(err?.data?.message || "Couldn't send the link. Try again.");
    }
  };

  return (
    <AuthShell title="Reset password" subtitle="We'll email you a link to choose a new password.">
      {sent ? (
        <p role="status" className="text-sm text-text-primary">
          If an admin account exists for that email, a reset link is on its way.
        </p>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label htmlFor="forgot-email" className={fieldLabelClass}>Email</label>
            <input id="forgot-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={fieldInputClass} />
          </div>
          {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
          <button type="submit" disabled={isLoading} className={primaryButtonClass}>
            {isLoading ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
      <p className="mt-4 text-center text-sm">
        <Link to="/login" className="font-semibold text-primary">Back to sign in</Link>
      </p>
    </AuthShell>
  );
}
