import assert from 'node:assert/strict'
import { test } from 'node:test'
import { googleProfilePhoto, memberDisplayName, memberInitials, publicMemberProfile } from '../src/utils/memberProfiles.ts'

const privateProfile = { uid: 'member', displayName: '  Alex Chen  ', email: 'private@example.test', sports: ' Tennis ', skills: ' Intermediate ', availability: ' Weekends ', distance: 'Within 1 mile' }

test('public profiles contain only the fields shown to other members', () => {
  assert.deepEqual(publicMemberProfile(privateProfile, 'https://lh3.googleusercontent.com/a/photo=s96-c'), {
    uid: 'member', displayName: 'Alex Chen', photoURL: 'https://lh3.googleusercontent.com/a/photo=s96-c', sports: 'Tennis', skills: 'Intermediate', availability: 'Weekends',
  })
  const publicProfile = publicMemberProfile({ ...privateProfile, email: 'secret@example.test', distance: 'private preference' }, null)
  assert.equal('email' in publicProfile, false)
  assert.equal('distance' in publicProfile, false)
})

test('accepts Google account photo URLs and rejects unsafe or unrelated image sources', () => {
  for (const value of ['https://lh3.googleusercontent.com/a/picture', 'https://lh6.googleusercontent.com/a-/picture=s96-c']) assert.equal(googleProfilePhoto(value), value)
  for (const value of [null, undefined, '', 'javascript:alert(1)', 'data:image/svg+xml,anything', 'http://lh3.googleusercontent.com/picture', 'https://lh3.googleusercontent.com.evil.test/picture', 'https://lh3.googleusercontent.com@evil.test/picture', 'https://tracker.example.test/picture', 'https://lh3.googleusercontent.com/picture\n']) assert.equal(googleProfilePhoto(value), '')
})

test('uses readable initials for guests and members without a usable image', () => {
  assert.equal(memberInitials(' Alex Chen '), 'AC')
  assert.equal(memberInitials('Riley'), 'R')
  assert.equal(memberInitials('Alex Morgan Chen'), 'AM')
  assert.equal(memberInitials(''), 'M')
})

test('bounds public profile previews to the public document limits', () => {
  const profile = publicMemberProfile({ ...privateProfile, displayName: 'n'.repeat(70), sports: 's'.repeat(600), skills: 's'.repeat(600), availability: 'a'.repeat(600) }, null)
  assert.equal(profile.displayName.length, 60)
  for (const field of ['sports', 'skills', 'availability'] as const) assert.equal(profile[field].length, 500)
})

test('keeps an existing organizer name when an account still has the default Player name', () => {
  assert.equal(memberDisplayName('Player', 'Sam Rivera'), 'Sam Rivera')
  assert.equal(memberDisplayName('New member', 'Riley Morgan'), 'Riley Morgan')
  assert.equal(memberDisplayName('Alex Chen', 'Old name'), 'Alex Chen')
  assert.equal(memberDisplayName(undefined, 'Jordan Lee'), 'Jordan Lee')
})
