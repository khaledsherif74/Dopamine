import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from '@/components/Layout.jsx';
import { ProtectedRoute } from '@/components/ProtectedRoute.jsx';
import { LoginPage } from '@/pages/LoginPage.jsx';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage.jsx';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage.jsx';
import { ChangePasswordPage } from '@/pages/ChangePasswordPage.jsx';
import { DashboardPage } from '@/pages/DashboardPage.jsx';
import { QueuePage } from '@/pages/QueuePage.jsx';
import { TicketPage } from '@/pages/TicketPage.jsx';
import { OrdersPage } from '@/pages/OrdersPage.jsx';
import { OrderPage } from '@/pages/OrderPage.jsx';
import { RefundsPage } from '@/pages/RefundsPage.jsx';
import { NotificationsPage } from '@/pages/NotificationsPage.jsx';
import { SettingsPage } from '@/pages/SettingsPage.jsx';
import { NotFoundPage } from '@/pages/NotFoundPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/change-password" element={<ProtectedRoute allowForcedChange><ChangePasswordPage /></ProtectedRoute>} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="tickets" element={<QueuePage />} />
        <Route path="tickets/:ticketId" element={<TicketPage />} />
        <Route path="refunds" element={<RefundsPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="orders/:orderId" element={<OrderPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="home" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
