import type { Route } from '../types'

const navItems: Array<{ label: string; path: Route }> = [
  { label: 'Home', path: '/' },
  { label: 'Find Partners', path: '/partners' },
  { label: 'Activities', path: '/activities' },
  { label: 'Profile', path: '/profile' },
]

type NavbarProps = {
  route: Route
  navigate: (path: Route) => void
}

export default function Navbar({ route, navigate }: NavbarProps) {
  return (
    <header className="topbar">
      <button className="brand" onClick={() => navigate('/')} aria-label="SportBuddy home">
        <span className="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 40 40" fill="none">
            <rect width="40" height="40" rx="13" fill="currentColor" />
            <circle cx="15" cy="15" r="4" stroke="white" strokeWidth="1.8" />
            <circle cx="26" cy="16" r="3.3" stroke="white" strokeWidth="1.8" />
            <path d="M7.5 31c.6-5 3.2-7.5 7.5-7.5s6.9 2.5 7.5 7.5M22 25c1-1.2 2.4-1.8 4.2-1.8 3.8 0 5.9 2.4 6.3 7" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </span>
        <span>SportBuddy</span>
      </button>
      <nav className="main-nav" aria-label="Main navigation">
        {navItems.map((item) => (
          <button
            className={route === item.path ? 'nav-link nav-active' : 'nav-link'}
            key={item.path}
            onClick={() => navigate(item.path)}
            aria-current={route === item.path ? 'page' : undefined}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </header>
  )
}
