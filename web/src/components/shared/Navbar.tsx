import { Link, useNavigate } from '@tanstack/react-router'
import { LayoutDashboard, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function DashboardNavbar() {
  const navigate = useNavigate()

  const handleLogout = () => {
    // 1. Clear the session cookie (or trigger backend logout)
    // For now, we will handle a simple client-side wipe & redirect
    document.cookie = 'auth_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'

    // 2. Kick the user back to the public landing page
    navigate({ to: '/' })
  }

  return (
    <header className="border-b border-zinc-800 bg-[#030303]/50 backdrop-blur-md sticky top-0 z-50">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo - Links back to dashboard home */}
        <Link
          to="/dashboard"
          className="flex items-center gap-2 font-semibold tracking-tight text-xl text-zinc-100 hover:opacity-90"
        >
          <LayoutDashboard className="h-5 w-5 text-blue-500" />
          <span>Survicate</span>
        </Link>

        {/* User Actions */}
        <div className="flex items-center gap-4">
          <Button
            onClick={handleLogout}
            variant="ghost"
            size="sm"
            className="text-zinc-400 hover:text-white hover:bg-zinc-900 gap-2 rounded-full"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  )
}
