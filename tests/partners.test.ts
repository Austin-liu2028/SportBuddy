import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getActivityHosts } from '../src/utils/partners.ts'
import type { Activity } from '../src/types.ts'

const now = Date.now()
function game(id: string, ownerUid: string, sport: Activity['sport'], name: string): Activity {
  return { id, ownerUid, sport, organizer: name, title: 'Test activity', location: 'Test court',
    players: 1, capacity: 4, participants: [name], date: '', time: '', skill: 'All levels', distance: '', description: '',
    contact: { method: 'Email', value: 'private@example.test' },
    startAt: { toDate: () => new Date(now + 3600000) } as Activity['startAt'],
    endAt: { toDate: () => new Date(now + 7200000) } as Activity['endAt'],
  }
}
test('groups real organizers by UID, preserves same-name people, and excludes self', () => {
  const hosts = getActivityHosts([game('a', 'host', 'Tennis', 'Alex'), game('b', 'host', 'Running', 'Alex'), game('c', 'other', 'Soccer', 'Alex'), game('d', 'self', 'Tennis', 'Me')], 'self', now)
  assert.equal(hosts.length, 2)
  const host = hosts.find(person => person.id === 'host')!
  assert.deepEqual(host.sports, ['Tennis', 'Running'])
  assert.equal(host.openGames, 2)
  assert.equal('email' in host, false)
})
test('does not invent organizers for legacy or unnamed activities', () => {
  assert.deepEqual(getActivityHosts([{ ...game('a', 'host', 'Tennis', 'Alex'), ownerUid: undefined }, game('b', 'other', 'Tennis', '')], null, now), [])
})
test('full and past games do not imply that an organizer has available spots', () => {
  const full = { ...game('a', 'host', 'Tennis', 'Alex'), players: 4 }
  const past = { ...game('b', 'other', 'Tennis', 'Sam'), startAt: { toDate: () => new Date(now - 7200000) } as Activity['startAt'], endAt: { toDate: () => new Date(now - 3600000) } as Activity['endAt'] }
  assert.deepEqual(getActivityHosts([full, past], null, now).map(host => host.openGames), [0, 0])
})
