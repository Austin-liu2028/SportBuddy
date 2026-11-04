import { useEffect, useRef } from 'react'

export function useDialog(open: boolean, onClose: () => void, busy = false) {
  const ref = useRef<HTMLElement>(null)
  const actions = useRef({ onClose, busy })
  useEffect(() => { actions.current = { onClose, busy } }, [onClose, busy])
  useEffect(() => {
    const dialog = ref.current
    if (!open || !dialog) return
    const previousFocus = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog.tabIndex = -1
    dialog.focus()
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !actions.current.busy) {
        event.preventDefault()
        event.stopPropagation()
        actions.current.onClose()
      }
      if (event.key !== 'Tab') return
      const items = Array.from(dialog.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]'))
        .filter(item => item.getClientRects().length > 0)
      const first = items[0]
      const last = items.at(-1)
      if (!first) { event.preventDefault(); return }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
        event.preventDefault(); last?.focus()
      } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog)) {
        event.preventDefault(); first.focus()
      }
    }
    dialog.addEventListener('keydown', handleKey)
    return () => {
      dialog.removeEventListener('keydown', handleKey)
      document.body.style.overflow = previousOverflow
      if (previousFocus?.isConnected && previousFocus.getClientRects().length) previousFocus.focus({ preventScroll: true })
      else {
        const menuToggle = document.querySelector<HTMLElement>('.menu-toggle')
        const fallback = menuToggle?.getClientRects().length ? menuToggle : document.querySelector<HTMLElement>('.brand')
        fallback?.focus({ preventScroll: true })
      }
    }
  }, [open])
  return ref
}
