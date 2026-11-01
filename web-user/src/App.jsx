import { Route, Routes } from 'react-router-dom';
import { Layout } from '@/components/Layout.jsx';
import { ProtectedRoute } from '@/components/ProtectedRoute.jsx';
import { HomePage } from '@/pages/HomePage.jsx';
import { ProductsPage } from '@/pages/ProductsPage.jsx';
import { ProductPage } from '@/pages/ProductPage.jsx';
import { SuppliersPage } from '@/pages/SuppliersPage.jsx';
import { SupplierPage } from '@/pages/SupplierPage.jsx';
import { CartPage } from '@/pages/CartPage.jsx';
import { LoginPage } from '@/pages/LoginPage.jsx';
import { RegisterPage } from '@/pages/RegisterPage.jsx';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage.jsx';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage.jsx';
import { VerifyPhonePage } from '@/pages/VerifyPhonePage.jsx';
import { CheckoutPage } from '@/pages/CheckoutPage.jsx';
import { PaymentResultPage } from '@/pages/PaymentResultPage.jsx';
import { OrdersPage } from '@/pages/OrdersPage.jsx';
import { OrderPage } from '@/pages/OrderPage.jsx';
import { ProfilePage } from '@/pages/ProfilePage.jsx';
import { NotificationsPage } from '@/pages/NotificationsPage.jsx';
import { HelpPage } from '@/pages/HelpPage.jsx';
import { TicketsPage } from '@/pages/TicketsPage.jsx';
import { NewTicketPage } from '@/pages/NewTicketPage.jsx';
import { TicketPage } from '@/pages/TicketPage.jsx';
import { SettingsPage } from '@/pages/SettingsPage.jsx';
import { NotFoundPage } from '@/pages/NotFoundPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/:id" element={<ProductPage />} />
        <Route path="suppliers" element={<SuppliersPage />} />
        <Route path="suppliers/:id" element={<SupplierPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
        <Route path="payment-result" element={<ProtectedRoute><PaymentResultPage /></ProtectedRoute>} />
        <Route path="orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
        <Route path="orders/:id" element={<ProtectedRoute><OrderPage /></ProtectedRoute>} />
        <Route path="profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        <Route path="help" element={<HelpPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="support" element={<ProtectedRoute><TicketsPage /></ProtectedRoute>} />
        <Route path="support/new" element={<ProtectedRoute><NewTicketPage /></ProtectedRoute>} />
        <Route path="support/:id" element={<ProtectedRoute><TicketPage /></ProtectedRoute>} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />
        <Route path="verify-phone" element={<ProtectedRoute><VerifyPhonePage /></ProtectedRoute>} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
