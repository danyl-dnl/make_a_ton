import { useState, type ReactNode } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

type AppLayoutProps = { children?: ReactNode }

export function AppLayout({ children }: AppLayoutProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  return (
    <div className="min-h-screen bg-[#f7f8fa] text-slate-900 lg:flex">
      <Sidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="min-w-0 flex-1">
        <Header onMenuClick={() => setMobileNavOpen(true)} />
        <main>{children ?? <Outlet />}</main>
      </div>
    </div>
  )
}
