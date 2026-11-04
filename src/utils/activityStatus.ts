import type { Activity } from '../types'

export type ActivityStatus = 'upcoming' | 'ongoing' | 'ended' | 'unavailable'

export const activityStatusLabels: Record<ActivityStatus, string> = {
  upcoming: 'Upcoming',
  ongoing: 'Ongoing',
  ended: 'Ended',
  unavailable: 'Status unavailable',
}

function toTimestampDate(value: unknown): Date | null {
  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof value.toDate === 'function'
  ) {
    try {
      const parsed = value.toDate()
      return parsed instanceof Date && !Number.isNaN(parsed.getTime()) ? parsed : null
    } catch {
      return null
    }
  }

  return null
}

function parseLegacyDate(value: string): [number, number, number] | null {
  const isoDate = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoDate) {
    const [, yearText, monthText, dayText] = isoDate
    const year = Number(yearText)
    const month = Number(monthText)
    const day = Number(dayText)
    const parsed = new Date(Date.UTC(year, month - 1, day))
    if (
      parsed.getUTCFullYear() === year &&
      parsed.getUTCMonth() === month - 1 &&
      parsed.getUTCDate() === day
    ) {
      return [year, month, day]
    }
    return null
  }

  const namedDate = value.match(
    /^(?:(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday),\s*)?([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})$/i
  )
  if (!namedDate) return null

  const monthNames = [
    ['january', 'jan'], ['february', 'feb'], ['march', 'mar'], ['april', 'apr'],
    ['may'], ['june', 'jun'], ['july', 'jul'], ['august', 'aug'],
    ['september', 'sep', 'sept'], ['october', 'oct'], ['november', 'nov'], ['december', 'dec'],
  ]
  const month = monthNames.findIndex((names) => names.includes(namedDate[2].toLowerCase())) + 1
  const day = Number(namedDate[3])
  const year = Number(namedDate[4])
  if (month === 0 || year < 1000) return null

  const parsed = new Date(Date.UTC(year, month - 1, day))
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null
  }
  if (
    namedDate[1] &&
    parsed.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' }).toLowerCase() !== namedDate[1].toLowerCase()
  ) {
    return null
  }
  return [year, month, day]
}

function parseLegacyTime(value: string) {
  const range = value.match(
    /^\s*(\d{1,2}):(\d{2})\s*(AM|PM)?\s*(Z|[+-]\d{2}:?\d{2})\s+(?:–|—|-|to)\s+(\d{1,2}):(\d{2})\s*(AM|PM)?\s*(Z|[+-]\d{2}:?\d{2})\s*$/i
  )
  if (!range) return null

  const [, startHourText, startMinuteText, startMeridiem, startOffset, endHourText, endMinuteText, endMeridiem, endOffset] = range
  function parseTime(hourText: string, minuteText: string, meridiem: string | undefined, offset: string) {
    let hour = Number(hourText)
    const minute = Number(minuteText)
    if (minute > 59) return null

    if (meridiem) {
      if (hour < 1 || hour > 12) return null
      hour = (hour % 12) + (meridiem.toUpperCase() === 'PM' ? 12 : 0)
    } else if (hour > 23) {
      return null
    }

    const offsetMatch = offset.match(/^(Z|([+-])(\d{2}):?(\d{2}))$/i)
    if (!offsetMatch) return null
    const offsetHours = Number(offsetMatch[3] ?? 0)
    const offsetMinutes = Number(offsetMatch[4] ?? 0)
    if (offsetHours > 14 || offsetMinutes > 59 || (offsetHours === 14 && offsetMinutes !== 0)) {
      return null
    }
    const offsetSign = offsetMatch[2] === '+' ? 1 : -1
    const offsetTotalMinutes = offsetMatch[1].toUpperCase() === 'Z'
      ? 0
      : offsetSign * (offsetHours * 60 + offsetMinutes)

    return { localMinutes: hour * 60 + minute, offsetMinutes: offsetTotalMinutes }
  }

  const start = parseTime(startHourText, startMinuteText, startMeridiem, startOffset)
  const end = parseTime(endHourText, endMinuteText, endMeridiem, endOffset)
  return start !== null && end !== null ? { start, end } : null
}

function getLegacyActivityWindow(activity: Activity): [Date, Date] | null {
  if (typeof activity.date !== 'string' || typeof activity.time !== 'string') return null

  const dateParts = parseLegacyDate(activity.date)
  const timeRange = parseLegacyTime(activity.time)
  if (!dateParts || !timeRange) return null

  const [year, month, day] = dateParts
  if (timeRange.end.localMinutes <= timeRange.start.localMinutes) return null

  const activityDate = Date.UTC(year, month - 1, day)
  const startAt = new Date(
    activityDate +
    timeRange.start.localMinutes * 60_000 -
    timeRange.start.offsetMinutes * 60_000
  )
  const endAt = new Date(
    activityDate +
    timeRange.end.localMinutes * 60_000 -
    timeRange.end.offsetMinutes * 60_000
  )
  return endAt > startAt ? [startAt, endAt] : null
}

export function getActivityStartAt(activity: Activity): Date | null {
  return toTimestampDate(activity.startAt)
}

export function getActivityTimestampRange(activity: Activity): [Date, Date] | null {
  const startAt = getActivityStartAt(activity)
  const endAt = toTimestampDate(activity.endAt)
  if (startAt && endAt && endAt > startAt) return [startAt, endAt]
  return null
}

function getActivityWindow(activity: Activity): [Date, Date] | null {
  const timestampRange = getActivityTimestampRange(activity)
  if (timestampRange) return timestampRange
  return getLegacyActivityWindow(activity)
}

export function getActivityStatus(activity: Activity, now = Date.now()): ActivityStatus {
  if (!Number.isFinite(now)) return 'unavailable'
  const window = getActivityWindow(activity)
  if (!window) return 'unavailable'

  const [startAt, endAt] = window
  if (now < startAt.getTime()) return 'upcoming'
  if (now < endAt.getTime()) return 'ongoing'
  return 'ended'
}
