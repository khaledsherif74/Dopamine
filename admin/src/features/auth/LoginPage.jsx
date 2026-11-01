import * as Sentry from "@sentry/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useLoginMutation } from "@/api/authApi";
import { credentialsReceived } from "./authSlice";

export function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [login, { isLoading }] = useLoginMutation();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const result = await login({
        identifier,
        password,
        role: "ADMIN",
      }).unwrap();
      dispatch(
        credentialsReceived({
          user: result.account,
          accessToken: result.accessToken,
        }),
      );
      Sentry.setUser({
        id: result.account.id,
        email: result.account.email,
        role: result.account.role,
      });
      navigate("/", { replace: true });
    } catch (err) {
      setError(err?.data?.message || "Couldn't log in. Try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-alt px-4">
      <div className="w-full max-w-sm bg-surface rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-text-primary mb-1">Admin</h1>
        <p className="text-sm text-text-secondary mb-6">
          Sign in to manage the platform.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
              Email or phone
            </label>
            <input
              type="text"
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-surface-alt px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
              Password
            </label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-surface-alt px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {error ? <p className="text-sm text-danger">{error}</p> : null}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-primary text-white font-semibold py-3 hover:bg-primary-dark disabled:opacity-60 transition-colors"
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
