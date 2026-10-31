import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { PlaceholderPage } from './pages/PlaceholderPage'
import { ForgotPasswordPage, LoginPage, RegisterPage, ResetPasswordPage } from './pages/auth/AuthPages'
import { ProductsPage } from './pages/catalog/ProductsPage'
import { PlansPage } from './pages/catalog/PlansPage'
import { QuotationTemplatesPage } from './pages/commerce/QuotationTemplatesPage'
import { QuotationsPage } from './pages/commerce/QuotationsPage'
import { QuotationDetailPage } from './pages/commerce/QuotationDetailPage'
import { SubscriptionsPage } from './pages/commerce/SubscriptionsPage'
import { SubscriptionDetailPage } from './pages/commerce/SubscriptionDetailPage'
import { InvoicesPage } from './pages/billing/InvoicesPage'
import { InvoiceDetailPage } from './pages/billing/InvoiceDetailPage'
import { DiscountsPage } from './pages/billing/DiscountsPage'
import { PaymentsPage } from './pages/billing/PaymentsPage'
import { StatePanel } from './components/ui/StatePanel'
import { CustomerPortalPage } from './pages/CustomerPortalPage'

const DashboardPage = lazy(() => import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage })))

const pageDefinitions = [
  { path: 'customers', title: 'Customers', description: 'Keep customer profiles and account details organized.' },
  { path: 'staff', title: 'Staff', description: 'Manage the people who have access to your workspace.' },
]

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route element={<AppLayout />}>
        <Route index element={<Suspense fallback={<div className="mx-auto max-w-5xl px-5 py-16"><StatePanel kind="loading" title="Preparing finance dashboard" /></div>}><DashboardPage /></Suspense>} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="plans" element={<PlansPage />} />
        <Route path="quotation-templates" element={<QuotationTemplatesPage />} />
        <Route path="quotations" element={<QuotationsPage />} />
        <Route path="quotations/:quotationId" element={<QuotationDetailPage />} />
        <Route path="subscriptions" element={<SubscriptionsPage />} />
        <Route path="subscriptions/:subscriptionId" element={<SubscriptionDetailPage />} />
        <Route path="invoices" element={<InvoicesPage />} />
        <Route path="invoices/:invoiceId" element={<InvoiceDetailPage />} />
        <Route path="discounts" element={<DiscountsPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="customer-portal" element={<CustomerPortalPage />} />
        {pageDefinitions.map((page) => <Route key={page.path} path={page.path} element={<PlaceholderPage {...page} />} />)}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
