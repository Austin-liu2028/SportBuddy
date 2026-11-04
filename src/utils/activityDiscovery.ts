import type { Activity } from '../types'
import { getActivityStartAt, getActivityStatus } from './activityStatus.ts'

export type DateFilter = 'All' | 'Today' | 'Tomorrow' | 'This Week'
export const dateFilters: DateFilter[] = ['All', 'Today', 'Tomorrow', 'This Week']

export function matchesActivitySearch(activity: Activity, query: string) {
  return `${activity.title} ${activity.sport} ${activity.location}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())
}

export function matchesActivityDate(activity: Activity, filter: DateFilter, now: number) {
  if (filter === 'All') return true
  const start = getActivityStartAt(activity)
  if (!start) return false
  const from = new Date(now)
  from.setHours(0, 0, 0, 0)
  const to = new Date(from)
  if (filter === 'Tomorrow') from.setDate(from.getDate() + 1)
  // This Week means the remainder of the current calendar week, ending Sunday.
  to.setDate(to.getDate() + (filter === 'This Week' ? 7 - ((to.getDay() + 6) % 7) : filter === 'Tomorrow' ? 2 : 1))
  return start >= from && start < to
}

export function compareActivityDates(first: Activity, second: Activity, now: number) {
  const rank = { ongoing: 0, upcoming: 1, ended: 2, unavailable: 3 }
  const statusA = getActivityStatus(first, now)
  const statusB = getActivityStatus(second, now)
  const difference = rank[statusA] - rank[statusB]
  if (difference) return difference
  const timeA = getActivityStartAt(first)?.getTime() ?? Number.POSITIVE_INFINITY
  const timeB = getActivityStartAt(second)?.getTime() ?? Number.POSITIVE_INFINITY
  return statusA === 'ended' ? timeB - timeA : timeA - timeB
}
