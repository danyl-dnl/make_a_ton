import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  BarChart3, Blocks, ChevronDown, CircleDollarSign, CreditCard, FileText, Gauge,
  Layers3, LifeBuoy, Menu, Percent, ReceiptText, Settings2, ShieldCheck, Users, X,
} from 'lucide-react'
import { cn } from '../../lib/utils'

const navGroups = [
  {
    label: 'Workspace',
    items: [
      { label: 'Dashboard', path: '/', icon: Gauge },
      { label: 'Products', path: '/products', icon: Blocks },
      { label: 'Plans', path: '/plans', icon: Layers3 },
      { label: 'Customers', path: '/customers', icon: Users },
      { label: 'Quotations', path: '/quotations', icon: FileText },
      { label: 'Subscriptions', path: '/subscriptions', icon: CircleDollarSign },
      { label: 'Invoices', path: '/invoices', icon: ReceiptText },
      { label: 'Discounts', path: '/discounts', icon: Percent },
      { label: 'Payments', path: '/payments', icon: CreditCard },
    ],
  },
  {
    label: 'Manage',
    items: [
      { label: 'Staff', path: '/staff', icon: ShieldCheck },
      { label: 'Customer Portal', path: '/customer-portal', icon: BarChart3 },
    ],
  },
]

type SidebarProps = { mobileOpen?: boolean; onClose?: () => void }

export function Sidebar({ mobileOpen = false, onClose }: SidebarProps) {
  const [workspaceOpen, setWorkspaceOpen] = useState(true)
  return (
    <>
      {mobileOpen ? <button aria-label="Close navigation overlay" className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden" onClick={onClose} /> : null}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col bg-[#111b32] text-slate-300 transition-transform duration-200 lg:sticky lg:top-0 lg:z-20 lg:h-screen lg:translate-x-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
      )}>
        <div className="flex h-[76px] items-center justify-between border-b border-white/[0.08] px-5">
          <a className="flex items-center gap-3" href="/" aria-label="Brightloop home">
            <span className="grid size-9 place-items-center rounded-xl bg-blue-500 text-white shadow-lg shadow-blue-950/30">
              <span className="text-lg font-black leading-none">b</span>
            </span>
            <span className="text-[17px] font-semibold tracking-tight text-white">brightloop</span>
          </a>
          <button className="grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-white/10 lg:hidden" onClick={onClose} aria-label="Close sidebar"><X size={18} /></button>
        </div>
        <button onClick={() => setWorkspaceOpen(!workspaceOpen)} className="mx-3 mt-5 flex items-center gap-3 rounded-xl border border-white/[0.09] bg-white/[0.04] p-3 text-left hover:bg-white/[0.07]">
          <span className="grid size-9 place-items-center rounded-lg bg-indigo-400/15 text-xs font-bold text-indigo-200">BL</span>
          <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-white">Brightloop Inc.</span><span className="mt-0.5 block text-xs text-slate-400">Workspace</span></span>
          <ChevronDown size={15} className={cn('text-slate-500 transition-transform', workspaceOpen && 'rotate-180')} />
        </button>
        <nav className="flex-1 overflow-y-auto px-3 pb-5 pt-6" aria-label="Main navigation">
          {navGroups.map((group) => (
            <div className="mb-6" key={group.label}>
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.17em] text-slate-500">{group.label}</p>
              <div className="space-y-1">
                {group.items.map(({ label, path, icon: Icon }) => (
                  <NavLink key={path} to={path} end={path === '/'} onClick={onClose} className={({ isActive }) => cn(
                    'group flex items-center gap-3 rounded-xl px-3 py-[10px] text-[13px] font-medium transition-colors',
                    isActive ? 'bg-blue-500 text-white shadow-md shadow-blue-950/25' : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-100',
                  )}>
                    <Icon size={17} strokeWidth={1.8} className="shrink-0" />{label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t border-white/[0.08] p-3">
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-slate-400 hover:bg-white/[0.06] hover:text-white"><Settings2 size={17} />Settings</button>
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-slate-400 hover:bg-white/[0.06] hover:text-white"><LifeBuoy size={17} />Help & support</button>
        </div>
      </aside>
    </>
  )
}

export function MobileNavButton({ onClick }: { onClick: () => void }) {
  return <button onClick={onClick} aria-label="Open navigation" className="grid size-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm lg:hidden"><Menu size={18} /></button>
}
