import type { Activity } from '../types'
import { getActivityStatus } from './activityStatus.ts'
import { compareActivityDates } from './activityDiscovery.ts'

export type ActivityHost = { id: string; name: string; sports: string[]; activities: Activity[]; openGames: number }

// Discover organizers through already-readable activities, never through private user profiles.
export function getActivityHosts(activities: Activity[], currentUid: string | null, now: number): ActivityHost[] {
  const hosts = new Map<string, ActivityHost>()
  for (const activity of [...activities].sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0))) {
    if (!activity.ownerUid || activity.ownerUid === currentUid || !activity.organizer?.trim()) continue
    let host = hosts.get(activity.ownerUid)
    if (!host) {
      host = { id: activity.ownerUid, name: activity.organizer.trim(), sports: [], activities: [], openGames: 0 }
      hosts.set(host.id, host)
    }
    if (!host.sports.includes(activity.sport)) host.sports.push(activity.sport)
    host.activities.push(activity)
    const status = getActivityStatus(activity, now)
    if ((status === 'upcoming' || status === 'ongoing') && activity.players < activity.capacity) host.openGames++
  }
  return [...hosts.values()].map(host => ({ ...host, activities: host.activities.sort((a, b) => compareActivityDates(a, b, now)) }))
    .sort((a, b) => b.openGames - a.openGames || a.name.localeCompare(b.name))
}
