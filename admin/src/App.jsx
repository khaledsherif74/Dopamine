import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/router/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { LoginPage } from "@/features/auth/LoginPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { SuppliersPage } from "@/pages/SuppliersPage";
import { DriversPage } from "@/pages/DriversPage";
import { OrdersPage } from "@/pages/OrdersPage";
import { UsersPage } from "@/pages/UsersPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { SupportStaffPage } from "@/pages/SupportStaffPage";
import { PromosPage } from "@/pages/PromosPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="suppliers" element={<SuppliersPage />} />
          <Route path="drivers" element={<DriversPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="support-staff" element={<SupportStaffPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="promos" element={<PromosPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
