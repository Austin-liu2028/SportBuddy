import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getOrganizerName } from '../src/utils/organizerName.ts'

test('requires an organizer name instead of the default anonymous name', () => {
  for (const value of ['', '   ', 'Player', ' player ', 'PLAYER']) {
    assert.throws(() => getOrganizerName(value), /Enter your name/)
  }
})

test('trims a chosen name and accepts nicknames without an account', () => {
  assert.equal(getOrganizerName('  Alex  '), 'Alex')
  assert.equal(getOrganizerName('Player One'), 'Player One')
})

test('keeps organizer names within the profile name length limit', () => {
  assert.equal(getOrganizerName('a'.repeat(60)).length, 60)
  assert.throws(() => getOrganizerName('a'.repeat(61)), /60 characters/)
})
