import { Route, Routes } from 'react-router-dom';
import { Layout } from '@/components/Layout.jsx';
import { ProtectedRoute } from '@/components/ProtectedRoute.jsx';
import { LoginPage } from '@/pages/LoginPage.jsx';
import { RegisterPage } from '@/pages/RegisterPage.jsx';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage.jsx';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage.jsx';
import { OrdersPage } from '@/pages/OrdersPage.jsx';
import { OrderPage } from '@/pages/OrderPage.jsx';
import { ProductsPage } from '@/pages/ProductsPage.jsx';
import { EarningsPage } from '@/pages/EarningsPage.jsx';
import { ShopPage } from '@/pages/ShopPage.jsx';
import { TicketsPage } from '@/pages/TicketsPage.jsx';
import { NewTicketPage } from '@/pages/NewTicketPage.jsx';
import { TicketPage } from '@/pages/TicketPage.jsx';
import { NotificationsPage } from '@/pages/NotificationsPage.jsx';
import { NotFoundPage } from '@/pages/NotFoundPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<OrdersPage />} />
        <Route path="orders/:orderId" element={<OrderPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="earnings" element={<EarningsPage />} />
        <Route path="shop" element={<ShopPage />} />
        <Route path="support" element={<TicketsPage />} />
        <Route path="support/new" element={<NewTicketPage />} />
        <Route path="support/:id" element={<TicketPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
