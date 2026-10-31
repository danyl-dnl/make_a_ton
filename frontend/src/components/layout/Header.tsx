import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { MobileNavButton } from './Sidebar'

type HeaderProps = { onMenuClick: () => void; mobileNavOpen: boolean }
const destinations = [
  { label: 'Dashboard', path: '/', keywords: 'finance revenue' },
  { label: 'Products', path: '/products', keywords: 'catalog items' },
  { label: 'Plans', path: '/plans', keywords: 'pricing billing' },
  { label: 'Customers', path: '/customers', keywords: 'people accounts' },
  { label: 'Quotations', path: '/quotations', keywords: 'quotes proposals' },
  { label: 'Quotation templates', path: '/quotation-templates', keywords: 'quotes proposals templates' },
  { label: 'Subscriptions', path: '/subscriptions', keywords: 'recurring' },
  { label: 'Invoices', path: '/invoices', keywords: 'billing receivables' },
  { label: 'Discounts', path: '/discounts', keywords: 'coupons promotions' },
  { label: 'Payments', path: '/payments', keywords: 'transactions' },
  { label: 'Staff', path: '/staff', keywords: 'team users' },
  { label: 'Customer Portal', path: '/customer-portal', keywords: 'self service customers' },
]

export function Header({ onMenuClick, mobileNavOpen }: HeaderProps) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const results = destinations.filter((item) => `${item.label} ${item.keywords}`.toLowerCase().includes(query.trim().toLowerCase()))

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault(); setSearchOpen(true); requestAnimationFrame(() => inputRef.current?.focus())
      }
      if (event.key === 'Escape') setSearchOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  function go(path: string) { navigate(path); setQuery(''); setSearchOpen(false); inputRef.current?.blur() }
  function onSearchKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' && results[0]) { event.preventDefault(); go(results[0].path) }
    if (event.key === 'ArrowDown' && results.length) { event.preventDefault(); document.getElementById('global-search-result-0')?.focus() }
  }

  return (
    <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-slate-200/80 bg-white/90 px-5 backdrop-blur-xl sm:px-8 xl:px-10">
      <div className="flex min-w-0 items-center gap-3">
        <MobileNavButton onClick={onMenuClick} expanded={mobileNavOpen} />
        <div className="relative w-[min(360px,52vw)]">
          <div className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-slate-400 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
            <Search size={16} aria-hidden="true" />
            <input ref={inputRef} value={query} onFocus={() => setSearchOpen(true)} onChange={(event) => { setQuery(event.target.value); setSearchOpen(true) }} onKeyDown={onSearchKeyDown} className="min-w-0 w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400" placeholder="Search pages..." aria-label="Search pages" aria-expanded={searchOpen && query.trim().length > 0} aria-controls="global-search-results" role="searchbox" />
            {query ? <button type="button" onClick={() => { setQuery(''); inputRef.current?.focus() }} aria-label="Clear search" className="grid size-6 shrink-0 place-items-center rounded-md hover:bg-slate-200"><X size={14} /></button> : <kbd className="hidden shrink-0 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400 md:block">⌘ K</kbd>}
          </div>
          {searchOpen && query.trim() ? <div id="global-search-results" aria-label="Page results" className="absolute left-0 right-0 top-12 z-50 max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
            {results.length ? results.map((item, index) => <button key={item.path} id={`global-search-result-${index}`} type="button" onClick={() => go(item.path)} onKeyDown={(event) => { if (event.key === 'ArrowDown') { event.preventDefault(); document.getElementById(`global-search-result-${(index + 1) % results.length}`)?.focus() } if (event.key === 'ArrowUp') { event.preventDefault(); if (index === 0) inputRef.current?.focus(); else document.getElementById(`global-search-result-${index - 1}`)?.focus() } }} className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none">{item.label}<span className="text-xs text-slate-400">Open</span></button>) : <p className="px-3 py-3 text-sm text-slate-500">No matching pages.</p>}
          </div> : null}
        </div>
      </div>
      <div className="ml-3 flex shrink-0 items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700" aria-label="Brightloop workspace">
        <span className="grid size-6 place-items-center rounded-lg bg-blue-600 text-[10px] font-bold text-white">B</span><span className="hidden sm:inline">Workspace</span>
      </div>
    </header>
  )
}
