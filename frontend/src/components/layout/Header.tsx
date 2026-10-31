import { Bell, ChevronDown, Search, Sparkles } from 'lucide-react'
import { Button } from '../ui/button'
import { MobileNavButton } from './Sidebar'

type HeaderProps = { onMenuClick: () => void }

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-slate-200/80 bg-white/90 px-5 backdrop-blur-xl sm:px-8 xl:px-10">
      <div className="flex min-w-0 items-center gap-3">
        <MobileNavButton onClick={onMenuClick} />
        <div className="hidden h-10 w-[min(360px,32vw)] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-slate-400 sm:flex">
          <Search size={16} />
          <input className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400" placeholder="Search anything..." aria-label="Search" />
          <kbd className="hidden rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400 md:block">⌘ K</kbd>
        </div>
        <span className="hidden items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 md:inline-flex"><Sparkles size={12} />Workspace</span>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <Button variant="ghost" size="icon" className="relative size-10 text-slate-500" aria-label="Notifications"><Bell size={18} /><span className="absolute right-[9px] top-[8px] size-1.5 rounded-full bg-rose-500 ring-2 ring-white" /></Button>
        <div className="mx-1 hidden h-8 w-px bg-slate-200 sm:block" />
        <button className="flex items-center gap-2 rounded-xl py-1 pl-1 pr-1.5 text-left hover:bg-slate-50">
          <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white">JD</span>
          <span className="hidden sm:block"><span className="block text-xs font-semibold text-slate-800">Jordan Davis</span><span className="mt-0.5 block text-[11px] text-slate-500">Administrator</span></span>
          <ChevronDown size={14} className="hidden text-slate-400 sm:block" />
        </button>
      </div>
    </header>
  )
}
