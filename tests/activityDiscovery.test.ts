import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Activity } from '../src/types.ts'
import { matchesActivityDate, matchesActivitySearch, compareActivityDates } from '../src/utils/activityDiscovery.ts'

function activity(start: Date): Activity {
  return {
    id: 'game', title: 'Friendly doubles', sport: 'Tennis', location: 'Campus North Court',
    startAt: { toDate: () => start } as Activity['startAt'],
    endAt: { toDate: () => new Date(start.getTime() + 3600000) } as Activity['endAt'],
    contact: { method: 'Email', value: '' }, organizer: 'Host', participants: ['Host'],
    players: 1, capacity: 4, date: '', time: '', skill: 'All levels', distance: '', description: '',
  }
}
const now = new Date(2026, 10, 4, 12).getTime()

test('search matches title, sport, and location, ignoring case and surrounding whitespace', () => {
  const game = activity(new Date(now))
  for (const query of [' DOUBLES ', 'tennis', 'NORTH court', '']) assert.equal(matchesActivitySearch(game, query), true)
  assert.equal(matchesActivitySearch(game, 'basketball'), false)
})

test('quick dates use local calendar boundaries, including midnight', () => {
  assert.equal(matchesActivityDate(activity(new Date(2026, 10, 4, 23, 59)), 'Today', now), true)
  assert.equal(matchesActivityDate(activity(new Date(2026, 10, 5)), 'Today', now), false)
  assert.equal(matchesActivityDate(activity(new Date(2026, 10, 5)), 'Tomorrow', now), true)
  assert.equal(matchesActivityDate(activity(new Date(2026, 10, 6)), 'Tomorrow', now), false)
})

test('this week ends after Sunday and excludes next Monday', () => {
  assert.equal(matchesActivityDate(activity(new Date(2026, 10, 8, 23, 59)), 'This Week', now), true)
  assert.equal(matchesActivityDate(activity(new Date(2026, 10, 9)), 'This Week', now), false)
  assert.equal(matchesActivityDate(activity(new Date(2026, 10, 3)), 'This Week', now), false)
})

test('date filtering handles month and year boundaries', () => {
  const yearEnd = new Date(2026, 11, 31, 23).getTime()
  assert.equal(matchesActivityDate(activity(new Date(2027, 0, 1, 12)), 'Tomorrow', yearEnd), true)
})

test('all includes legacy schedules while date-specific filters require a real timestamp', () => {
  const legacy = { ...activity(new Date(now)), startAt: undefined, endAt: undefined }
  assert.equal(matchesActivityDate(legacy, 'All', now), true)
  assert.equal(matchesActivityDate(legacy, 'Today', now), false)
})

test('sorts happening now first, then upcoming chronologically, then past games', () => {
  const games = [activity(new Date(now + 86400000)), activity(new Date(now - 86400000)), activity(new Date(now - 1800000)), activity(new Date(now + 7200000))]
  assert.deepEqual([...games].sort((a, b) => compareActivityDates(a, b, now)), [games[2], games[3], games[0], games[1]])
})
