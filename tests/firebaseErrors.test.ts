import assert from 'node:assert/strict'
import { test } from 'node:test'
import { firebaseErrorMessage } from '../src/utils/firebaseErrors.ts'

test('denied activities offer recovery without assuming the user is signed out', () => {
  const message = firebaseErrorMessage({ code: 'permission-denied', message: 'Missing or insufficient permissions' }, 'activities')
  assert.match(message, /contact the site owner/)
  assert.doesNotMatch(message, /signing in|Google/)
  assert.doesNotMatch(message, /Missing or insufficient permissions/)
})
test('a rejected game change does not tell an already signed-in member to sign in with Google', () => {
  const message = firebaseErrorMessage({ code: 'permission-denied' }, 'activity')
  assert.match(message, /changes were not saved/)
  assert.doesNotMatch(message, /sign.*in|Google/)
})
test('distinguishes expired sessions and offline errors from denied access', () => {
  assert.match(firebaseErrorMessage({ code: 'unauthenticated' }, 'profile'), /session has expired/)
  assert.match(firebaseErrorMessage({ code: 'unavailable' }, 'activities'), /offline/)
})
