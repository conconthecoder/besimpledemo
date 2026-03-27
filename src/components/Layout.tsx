import { NavLink, Outlet } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Queues' },
  { to: '/judges', label: 'Judges' },
  { to: '/results', label: 'Results' },
]

export function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-8">
          <span className="font-semibold text-gray-900 text-lg">AI Judge</span>
          <div className="flex gap-6">
            {navItems.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  isActive
                    ? 'text-blue-600 font-medium text-sm'
                    : 'text-gray-500 hover:text-gray-900 text-sm'
                }
              >
                {label}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}
