import type { Activity } from '../types'

type ParticipantActivity = Pick<Activity, 'participants' | 'participantUids' | 'ownerUid' | 'organizer' | 'players'>

export function getParticipantNames(
  activity: ParticipantActivity,
  namesByUid: Readonly<Record<string, string>> = {},
) {
  const names = (activity.participants ?? []).filter(
    (name): name is string => typeof name === 'string' && Boolean(name.trim()),
  ).map(name => name.trim())
  const participantUids = activity.participantUids ?? []

  // A complete saved roster already includes each member, even when names repeat.
  if (names.length < participantUids.length) {
    const savedCounts = new Map<string, number>()
    names.forEach(name => {
      const key = name.toLocaleLowerCase()
      savedCounts.set(key, (savedCounts.get(key) ?? 0) + 1)
    })

    const resolvedCounts = new Map<string, number>()
    participantUids.forEach(uid => {
      const name = namesByUid[uid]?.trim()
        || (uid === activity.ownerUid ? activity.organizer?.trim() : '')
      if (!name) return

      const key = name.toLocaleLowerCase()
      const count = (resolvedCounts.get(key) ?? 0) + 1
      resolvedCounts.set(key, count)
      // Match saved occurrences, rather than treating a display name as an ID.
      if (count > (savedCounts.get(key) ?? 0)) names.push(name)
    })
  }

  return {
    names,
    unresolvedCount: Math.max(0, Math.max(activity.players, participantUids.length) - names.length),
  }
}
