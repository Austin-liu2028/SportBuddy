import { useEffect, useRef, useState } from 'react'
import type { Route } from '../types'
import Icon from './Icon'

const navItems: Array<{ label: string; path: Route }> = [
  { label: 'Home', path: '/' }, { label: 'Find Partners', path: '/partners' },
  { label: 'Activities', path: '/activities' }, { label: 'Profile', path: '/profile' },
]
type NavbarProps = {
  route: Route; navigate: (path: Route) => void; authReady: boolean; signedIn: boolean
  isAnonymous: boolean; authBusy: boolean; authPopupPending: boolean
  authPopupCancellationPending: boolean; historyLoading: boolean
  onLinkGoogleAccount: () => void; onSignInWithGoogle: () => void; onSignOut: () => void
  onCreateActivity: () => void; canCreate: boolean
}

export default function Navbar(props: NavbarProps) {
  const { route, navigate, authReady, signedIn, isAnonymous, authBusy, authPopupPending,
    authPopupCancellationPending, historyLoading, onLinkGoogleAccount, onSignInWithGoogle, onSignOut,
    onCreateActivity, canCreate } = props
  const [open, setOpen] = useState(false)
  const header = useRef<HTMLElement>(null)
  const toggle = useRef<HTMLButtonElement>(null)
  const account = useRef<HTMLDetailsElement>(null)
  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (!header.current?.contains(event.target as Node)) setOpen(false)
      if (!account.current?.contains(event.target as Node) && account.current) account.current.open = false
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (account.current?.open) {
        account.current.open = false
        account.current.querySelector('summary')?.focus()
      } else if (open) { setOpen(false); toggle.current?.focus() }
    }
    const focusOutside = (event: FocusEvent) => {
      if (!header.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    document.addEventListener('focusin', focusOutside)
    return () => {
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('keydown', escape)
      document.removeEventListener('focusin', focusOutside)
    }
  }, [open])
  function run(action: () => void) { setOpen(false); if (account.current) account.current.open = false; action() }
  return <header className="topbar" ref={header}>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <a className="brand" href="/" onClick={event => { event.preventDefault(); run(() => navigate('/')) }} aria-label="SportBuddy home">
      <span className="brand-mark"><Icon name="users" /></span><span>Sport<span className="brand-accent">Buddy</span></span>
    </a>
    <button ref={toggle} className="menu-toggle icon-button" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} aria-controls="site-navigation" onClick={() => setOpen(!open)}><Icon name={open ? 'close' : 'menu'} /></button>
    <div className={`header-navigation${open ? ' navigation-open' : ''}`} id="site-navigation">
      <nav className="main-nav" aria-label="Main navigation">{navItems.map(item => <a href={item.path} className={`nav-link${route === item.path ? ' nav-active' : ''}`} key={item.path} aria-current={route === item.path ? 'page' : undefined} onClick={event => { event.preventDefault(); run(() => navigate(item.path)) }}>{item.label}</a>)}</nav>
      <div className="header-actions">
        <button className="create-activity-button" disabled={!canCreate} onClick={() => run(onCreateActivity)}><Icon name="plus" />Create Activity</button>
        <details className="account-menu" ref={account}>
          <summary className="account-menu-toggle">{isAnonymous ? 'Guest' : signedIn ? 'Account' : 'Sign in'}<Icon name="chevron" /></summary>
          <div className="account-dropdown">
            <p>{isAnonymous ? 'Playing as a guest' : 'Your SportBuddy account'}</p>
            <button className="auth-button" onClick={() => run(() => navigate('/profile'))}>View your profile</button>
            {isAnonymous ? <>
              <button className="auth-button" onClick={() => run(onLinkGoogleAccount)} disabled={!authReady || authBusy}>Link Google Account</button>
              <small>Keep your guest profile and activities.</small>
              <button className="auth-button" onClick={() => run(onSignInWithGoogle)} disabled={!authReady || authBusy || historyLoading}>Sign in with Google</button>
            </> : !signedIn ? <button className="auth-button" onClick={() => run(onSignInWithGoogle)} disabled={!authReady || authBusy}>Sign in with Google</button>
              : <button className="auth-button" onClick={() => run(onSignOut)} disabled={!authReady || authBusy}>{authBusy ? 'Signing out…' : 'Sign out'}</button>}
          </div>
        </details>
      </div>
    </div>
    {authPopupPending && <span className="auth-popup-status" role="status">{authPopupCancellationPending ? 'Finishing cancellation…' : 'Google sign-in is in progress. Close the popup to cancel.'}</span>}
  </header>
}
