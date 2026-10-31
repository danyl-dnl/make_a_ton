import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { DashboardPage } from './pages/DashboardPage'
import { PlaceholderPage } from './pages/PlaceholderPage'
import { ForgotPasswordPage, LoginPage, RegisterPage, ResetPasswordPage } from './pages/auth/AuthPages'

const pageDefinitions = [
  { path: 'products', title: 'Products', description: 'Organize the products and services you offer.', actionLabel: 'Add product' },
  { path: 'plans', title: 'Plans', description: 'Set up recurring and one-time pricing for your products.', actionLabel: 'Create plan' },
  { path: 'customers', title: 'Customers', description: 'Keep customer profiles and account details organized.', actionLabel: 'Add customer' },
  { path: 'quotations', title: 'Quotations', description: 'Prepare and manage customer quotations.', actionLabel: 'Create quotation' },
  { path: 'subscriptions', title: 'Subscriptions', description: 'Review and manage customer subscription relationships.', actionLabel: 'Create subscription' },
  { path: 'invoices', title: 'Invoices', description: 'Keep billing documents and invoice records in one place.', actionLabel: 'Create invoice' },
  { path: 'discounts', title: 'Discounts', description: 'Configure the promotions available to your customers.', actionLabel: 'Create discount' },
  { path: 'payments', title: 'Payments', description: 'Review payment records and their associated transactions.' },
  { path: 'staff', title: 'Staff', description: 'Manage the people who have access to your workspace.', actionLabel: 'Invite staff' },
  { path: 'customer-portal', title: 'Customer Portal', description: 'Prepare the self-service experience for your customers.' },
]

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        {pageDefinitions.map((page) => <Route key={page.path} path={page.path} element={<PlaceholderPage {...page} />} />)}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
