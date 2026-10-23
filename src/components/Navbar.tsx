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
  authReady: boolean
  signedIn: boolean
  isAnonymous: boolean
  authBusy: boolean
  authPopupPending: boolean
  authPopupCancellationPending: boolean
  historyLoading: boolean
  onLinkGoogleAccount: () => void
  onSignInWithGoogle: () => void
  onSignOut: () => void
}

export default function Navbar({
  route,
  navigate,
  authReady,
  signedIn,
  isAnonymous,
  authBusy,
  authPopupPending,
  authPopupCancellationPending,
  historyLoading,
  onLinkGoogleAccount,
  onSignInWithGoogle,
  onSignOut,
}: NavbarProps) {
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
      <div className="auth-controls">
        {isAnonymous ? (
          <>
            <button
              className="auth-button"
              onClick={onLinkGoogleAccount}
              disabled={!authReady || authBusy}
            >
              Link Google Account
            </button>
            <button
              className="auth-button auth-button-secondary"
              onClick={onSignInWithGoogle}
              disabled={!authReady || authBusy || historyLoading}
              title={historyLoading ? 'Loading your activity history…' : undefined}
            >
              Sign in with Google
            </button>
          </>
        ) : !signedIn ? (
          <button
            className="auth-button"
            onClick={onSignInWithGoogle}
            disabled={!authReady || authBusy}
          >
            Sign in with Google
          </button>
        ) : (
          <button
            className="auth-button"
            onClick={onSignOut}
            disabled={!authReady || authBusy}
          >
            {authBusy ? 'Signing out…' : 'Sign out'}
          </button>
        )}
        {authPopupPending && (
          <span className="auth-popup-status" role="status">
            {authPopupCancellationPending
              ? 'Finishing cancellation...'
              : 'Google sign-in is in progress. Close the popup to cancel.'}
          </span>
        )}
      </div>
    </header>
  )
}
