import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, LoaderCircle } from 'lucide-react'
import { AuthLayout } from '../../components/auth/AuthLayout'
import { Button } from '../../components/ui/button'
import { FormField } from '../../components/ui/FormField'
import { StatePanel } from '../../components/ui/StatePanel'
import { authApi } from '../../lib/api'
import { getPasswordErrors, isValidEmail, passwordRules } from '../../lib/validation'

function PasswordField({ label = 'Password', value, onChange, error, autoComplete = 'new-password' }: { label?: string; value: string; onChange: (value: string) => void; error?: string; autoComplete?: string }) {
  const [visible, setVisible] = useState(false)
  return <div className="relative"><FormField label={label} aria-label={label || 'Password'} type={visible ? 'text' : 'password'} value={value} onChange={(event) => onChange(event.target.value)} error={error} autoComplete={autoComplete} placeholder="Enter your password" inputClassName="pr-11" /><button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? 'Hide password' : 'Show password'} className="absolute right-3 top-[34px] grid size-8 place-items-center text-slate-400 hover:text-slate-700">{visible ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>
}

function ApiFeedback({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return <div className="mt-4"><StatePanel kind="error" title="We couldn’t complete that request" description={message} compact action={<button onClick={onDismiss} className="text-xs font-semibold text-slate-600 underline underline-offset-4">Dismiss</button>} /></div>
}

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [apiError, setApiError] = useState('')
  const [pending, setPending] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = { ...(!isValidEmail(email) ? { email: 'Enter a valid email address.' } : {}), ...(!password ? { password: 'Enter your password.' } : {}) }
    setErrors(nextErrors); setApiError('')
    if (Object.keys(nextErrors).length) return
    setPending(true)
    try { await authApi.login({ email: email.trim(), password }); setSubmitted(true) }
    catch (error) { setApiError(error instanceof Error ? error.message : 'Please try again.') }
    finally { setPending(false) }
  }
  return <AuthLayout eyebrow="Welcome back" title={submitted ? 'Sign-in request sent' : 'Sign in to Brightloop'} description={submitted ? 'The authentication endpoint responded. Session establishment is pending backend integration.' : 'Enter your details to access your workspace.'} footer={<>New to Brightloop? <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-700">Create an account</Link></>}>
    {submitted ? <StatePanel kind="success" title="Authentication response received" description="This frontend does not establish or store a session yet. Session handling must follow the agreed backend contract." /> : <>
      <form onSubmit={submit} noValidate className="space-y-5">
        <FormField label="Work email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} error={errors.email} autoComplete="email" placeholder="you@company.com" />
        <div><div className="mb-1.5 flex items-center justify-between"><span className="text-sm font-medium text-slate-700">Password</span><Link to="/forgot-password" className="text-xs font-semibold text-blue-600 hover:text-blue-700">Forgot password?</Link></div><PasswordField label="" value={password} onChange={setPassword} error={errors.password} autoComplete="current-password" /></div>
        <Button type="submit" disabled={pending} className="h-11 w-full">{pending ? <><LoaderCircle size={16} className="animate-spin" />Signing in…</> : 'Sign in'}</Button>
      </form>
      {apiError ? <ApiFeedback message={apiError} onDismiss={() => setApiError('')} /> : null}
    </>}
  </AuthLayout>
}

export function RegisterPage() {
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({}); const [apiError, setApiError] = useState(''); const [pending, setPending] = useState(false); const [submitted, setSubmitted] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next: Record<string, string> = {}
    if (name.trim().length < 2) next.name = 'Enter your name.'
    if (!isValidEmail(email)) next.email = 'Enter a valid email address.'
    const passwordErrors = getPasswordErrors(password)
    if (passwordErrors.length) next.password = 'Your password does not meet all the requirements.'
    if (confirm !== password) next.confirm = 'Passwords do not match.'
    setErrors(next); setApiError(''); if (Object.keys(next).length) return
    setPending(true)
    try { await authApi.register({ name: name.trim(), email: email.trim(), password }); setSubmitted(true) }
    catch (error) { setApiError(error instanceof Error ? error.message : 'Please try again.') }
    finally { setPending(false) }
  }
  return <AuthLayout eyebrow="Create your account" title={submitted ? 'Registration received' : 'Start with Brightloop'} description={submitted ? 'Your registration request was sent to the authentication service.' : 'Set up an account to organize your subscription business.'} footer={<>Already have an account? <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700">Sign in</Link></>}>
    {submitted ? <StatePanel kind="success" title="Request completed" description="The app is ready to connect the agreed registration and verification flow." /> : <>
      <form onSubmit={submit} noValidate className="space-y-4">
        <FormField label="Full name" value={name} onChange={(event) => setName(event.target.value)} error={errors.name} autoComplete="name" placeholder="Jordan Davis" />
        <FormField label="Work email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} error={errors.email} autoComplete="email" placeholder="you@company.com" />
        <PasswordField value={password} onChange={setPassword} error={errors.password} />
        <ul className="grid gap-x-3 gap-y-1.5 rounded-xl bg-slate-50 p-3 sm:grid-cols-2">{passwordRules.map((rule) => <li key={rule.id} className={`flex items-center gap-2 text-[11px] ${rule.test(password) ? 'text-emerald-700' : 'text-slate-500'}`}><span className={`size-1.5 rounded-full ${rule.test(password) ? 'bg-emerald-500' : 'bg-slate-300'}`} />{rule.label}</li>)}</ul>
        <PasswordField label="Confirm password" value={confirm} onChange={setConfirm} error={errors.confirm} autoComplete="new-password" />
        <p className="text-xs leading-5 text-slate-500">By creating an account, you agree to our <a href="#terms" className="font-medium text-slate-700 underline underline-offset-2">Terms</a> and <a href="#privacy" className="font-medium text-slate-700 underline underline-offset-2">Privacy Policy</a>.</p>
        <Button type="submit" disabled={pending} className="h-11 w-full">{pending ? <><LoaderCircle size={16} className="animate-spin" />Creating account…</> : 'Create account'}</Button>
      </form>
      {apiError ? <ApiFeedback message={apiError} onDismiss={() => setApiError('')} /> : null}
    </>}
  </AuthLayout>
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState(''); const [error, setError] = useState(''); const [apiError, setApiError] = useState(''); const [pending, setPending] = useState(false); const [submitted, setSubmitted] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!isValidEmail(email)) { setError('Enter a valid email address.'); return } setError(''); setApiError(''); setPending(true); try { await authApi.forgotPassword(email.trim()); setSubmitted(true) } catch (cause) { setApiError(cause instanceof Error ? cause.message : 'Please try again.') } finally { setPending(false) } }
  return <AuthLayout eyebrow="Account recovery" title={submitted ? 'Check your inbox' : 'Forgot your password?'} description={submitted ? 'If an account matches that email, recovery instructions will be sent.' : 'Enter the email address associated with your account and we’ll send recovery instructions.'} footer={<><Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700">Back to sign in</Link></>}>
    {submitted ? <StatePanel kind="success" title="Recovery request sent" description="For security, the response does not reveal whether an account exists. Check your inbox for next steps." /> : <>
      <form onSubmit={submit} noValidate className="space-y-5"><FormField label="Work email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} error={error} autoComplete="email" placeholder="you@company.com" /><Button type="submit" disabled={pending} className="h-11 w-full">{pending ? <><LoaderCircle size={16} className="animate-spin" />Sending…</> : 'Send recovery link'}</Button></form>
      {apiError ? <ApiFeedback message={apiError} onDismiss={() => setApiError('')} /> : null}
    </>}
  </AuthLayout>
}

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams(); const token = searchParams.get('token') ?? ''
  const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState(''); const [errors, setErrors] = useState<Record<string, string>>({}); const [apiError, setApiError] = useState(''); const [pending, setPending] = useState(false); const [submitted, setSubmitted] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const next: Record<string, string> = {}; if (!token) next.token = 'This reset link is missing its token. Request a new link.'; if (getPasswordErrors(password).length) next.password = 'Your password does not meet all the requirements.'; if (confirm !== password) next.confirm = 'Passwords do not match.'; setErrors(next); setApiError(''); if (Object.keys(next).length) return; setPending(true); try { await authApi.resetPassword(token, password); setSubmitted(true) } catch (cause) { setApiError(cause instanceof Error ? cause.message : 'Please try again.') } finally { setPending(false) } }
  return <AuthLayout eyebrow="Account recovery" title={submitted ? 'Password updated' : 'Choose a new password'} description={submitted ? 'Your password reset request has been completed.' : 'Create a new password to secure your account.'} footer={<><Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700">Back to sign in</Link></>}>
    {submitted ? <StatePanel kind="success" title="Reset request completed" description="Continue to sign in once the agreed backend session flow is connected." action={<Link to="/login" className="inline-flex h-10 items-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white">Go to sign in</Link>} /> : <>
      {!token ? <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{errors.token ?? 'This page needs a valid recovery link. Request a new link to continue.'}</div> : null}
      <form onSubmit={submit} noValidate className="space-y-4"><PasswordField label="New password" value={password} onChange={setPassword} error={errors.password} /><ul className="grid gap-x-3 gap-y-1.5 rounded-xl bg-slate-50 p-3 sm:grid-cols-2">{passwordRules.map((rule) => <li key={rule.id} className={`flex items-center gap-2 text-[11px] ${rule.test(password) ? 'text-emerald-700' : 'text-slate-500'}`}><span className={`size-1.5 rounded-full ${rule.test(password) ? 'bg-emerald-500' : 'bg-slate-300'}`} />{rule.label}</li>)}</ul><PasswordField label="Confirm new password" value={confirm} onChange={setConfirm} error={errors.confirm} /><Button type="submit" disabled={pending || !token} className="h-11 w-full">{pending ? <><LoaderCircle size={16} className="animate-spin" />Updating…</> : 'Reset password'}</Button></form>
      {apiError ? <ApiFeedback message={apiError} onDismiss={() => setApiError('')} /> : null}
    </>}
  </AuthLayout>
}
