import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Check } from 'lucide-react'

type AuthLayoutProps = { eyebrow: string; title: string; description: string; children: ReactNode; footer: ReactNode }

export function AuthLayout({ eyebrow, title, description, children, footer }: AuthLayoutProps) {
  return (
    <main className="min-h-screen bg-white lg:grid lg:grid-cols-[minmax(400px,0.92fr)_1.08fr]">
      <section className="relative flex min-h-screen flex-col px-6 py-7 sm:px-10 lg:px-14 xl:px-20">
        <Link to="/" className="inline-flex w-fit items-center gap-2.5" aria-label="Brightloop home">
          <span className="grid size-9 place-items-center rounded-xl bg-blue-600 text-lg font-black text-white">b</span>
          <span className="text-base font-semibold tracking-tight text-slate-900">brightloop</span>
        </Link>
        <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-12">
          <div className="mb-7"><p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">{eyebrow}</p><h1 className="text-[28px] font-semibold tracking-tight text-slate-950 sm:text-[32px]">{title}</h1><p className="mt-2 text-sm leading-6 text-slate-500">{description}</p></div>
          {children}
          <div className="mt-7 text-center text-sm text-slate-500">{footer}</div>
        </div>
        <p className="text-xs text-slate-400">© {new Date().getFullYear()} Brightloop Software</p>
      </section>
      <aside className="relative hidden min-h-screen overflow-hidden bg-[#111b32] px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between xl:px-16">
        <div className="absolute -right-40 -top-32 size-[560px] rounded-full border border-white/[0.07]" /><div className="absolute -right-16 -top-8 size-[330px] rounded-full border border-white/[0.07]" /><div className="absolute bottom-[-230px] left-[-160px] size-[520px] rounded-full bg-blue-500/10 blur-3xl" />
        <span className="relative inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-blue-100"><span className="size-1.5 rounded-full bg-emerald-400" />Subscription operations, in focus</span>
        <div className="relative max-w-xl pb-8">
          <div className="mb-8 grid size-14 place-items-center rounded-2xl bg-blue-500 shadow-xl shadow-blue-950/30"><ArrowUpRight size={27} /></div>
          <h2 className="text-4xl font-semibold leading-[1.15] tracking-tight xl:text-[48px]">Make every customer relationship count.</h2>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">Bring your products, plans, subscriptions, and billing work into one clear workspace.</p>
          <ul className="mt-8 space-y-3 text-sm text-slate-300">{['A focused view of your subscription workflows', 'One place for the people and records that matter', 'Tools that grow with your business'].map((item) => <li key={item} className="flex items-center gap-2.5"><span className="grid size-5 place-items-center rounded-full bg-emerald-400/15 text-emerald-300"><Check size={12} /></span>{item}</li>)}</ul>
        </div>
        <p className="relative text-xs text-slate-500">Thoughtfully built for recurring business.</p>
      </aside>
    </main>
  )
}
