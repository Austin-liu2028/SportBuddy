import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getParticipantNames } from '../src/utils/participantNames.ts'

const activity = {
  participants: ['Player'], participantUids: ['host', 'guest'],
  ownerUid: 'host', organizer: 'Player', players: 2,
}

test('counts distinct UIDs with the same name as separate participants', () => {
  assert.deepEqual(getParticipantNames(activity, { guest: 'Player' }), {
    names: ['Player', 'Player'], unresolvedCount: 0,
  })
})

test('preserves every occurrence when three participants share a name', () => {
  assert.deepEqual(getParticipantNames({
    ...activity, participantUids: ['host', 'guest', 'other'], players: 3,
  }, { guest: 'Player', other: 'Player' }), {
    names: ['Player', 'Player', 'Player'], unresolvedCount: 0,
  })
})

test('uses the loaded account name to complete an older saved roster', () => {
  assert.deepEqual(getParticipantNames(activity, { guest: 'Alex' }), {
    names: ['Player', 'Alex'], unresolvedCount: 0,
  })
})

test('keeps a complete saved roster without needing profile lookups', () => {
  assert.deepEqual(getParticipantNames({ ...activity, participants: ['Player', 'Player'] }), {
    names: ['Player', 'Player'], unresolvedCount: 0,
  })
})

test('resolves blank saved entries using the organizer and participant profiles', () => {
  assert.deepEqual(getParticipantNames({ ...activity, participants: [' ', ''] }, { guest: ' Alex ' }), {
    names: ['Player', 'Alex'], unresolvedCount: 0,
  })
})

test('matches existing saved occurrences without adding them again', () => {
  assert.deepEqual(getParticipantNames({
    ...activity, participants: ['Player', 'Alex'], participantUids: ['host', 'guest', 'other'], players: 3,
  }, { guest: 'Alex', other: 'Alex' }), {
    names: ['Player', 'Alex', 'Alex'], unresolvedCount: 0,
  })
})

test('reports genuinely missing names without inventing a participant name', () => {
  assert.deepEqual(getParticipantNames(activity), {
    names: ['Player'], unresolvedCount: 1,
  })
})

test('preserves saved names on legacy activities without participant UIDs', () => {
  assert.deepEqual(getParticipantNames({ ...activity, participantUids: undefined, participants: ['Player', 'Alex'] }), {
    names: ['Player', 'Alex'], unresolvedCount: 0,
  })
})
