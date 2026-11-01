import * as Sentry from "@sentry/react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useLogoutMutation } from "@/api/authApi";
import { loggedOut } from "@/features/auth/authSlice";

const NAV = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/suppliers", label: "Suppliers" },
  { to: "/drivers", label: "Drivers" },
  { to: "/orders", label: "Orders" },
  { to: "/users", label: "Users" },
  { to: "/support-staff", label: "Support staff" },
  { to: "/promos", label: "Promo codes" },
  { to: "/settings", label: "Settings" },
];

export function Layout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const [logout] = useLogoutMutation();

  const handleLogout = async () => {
    await logout()
      .unwrap()
      .catch(() => {});
    dispatch(loggedOut());
    Sentry.setUser(null);
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen flex bg-surface-alt">
      <aside className="w-60 bg-surface border-r border-border flex flex-col">
        <div className="px-5 py-5 border-b border-border">
          <h1 className="font-bold text-text-primary text-lg">Dessert Admin</h1>
          <p className="text-xs text-text-secondary truncate">
            {user?.email ?? "—"}
          </p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary-tint text-primary-dark"
                    : "text-text-secondary hover:bg-surface-alt"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-border">
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-danger hover:bg-surface-alt"
          >
            Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
