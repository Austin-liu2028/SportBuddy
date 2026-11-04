import type { ReactNode } from 'react'
import Icon from './Icon'

export default function EmptyState({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return <div className="empty-activities"><span className="empty-icon"><Icon name="search" /></span><h3>{title}</h3><p>{children}</p>{action}</div>
}

export function ActivitySkeletons() {
  return <div className="activity-grid skeleton-grid" role="status" aria-label="Loading activities"><span className="sr-only">Loading activities…</span>{[0, 1, 2].map(id => <div className="activity-skeleton" key={id} aria-hidden="true"><span /><span /><span /><span /></div>)}</div>
}
