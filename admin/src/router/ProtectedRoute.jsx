import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

export function ProtectedRoute({ children }) {
  const status = useSelector((s) => s.auth.status);
  if (status === "loading") {
    return (
      <div
        className="min-h-screen flex items-center justify-center text-text-secondary"
        role="status"
        aria-live="polite"
      >
        Loading…
      </div>
    );
  }
  if (status !== "authenticated") return <Navigate to="/login" replace />;
  return children;
}
