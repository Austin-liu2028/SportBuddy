import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { before, after, beforeEach, test } from 'node:test'
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing'
import { doc, setDoc, getDoc, updateDoc, Timestamp, setLogLevel, runTransaction } from 'firebase/firestore'

setLogLevel('silent')
const rules = readFileSync('firestore.rules', 'utf8')
const originalWhitelist = rules.replace(".hasOnly(['participantUids', 'players', 'participants'])", ".hasOnly(['participantUids', 'players'])")
assert.notEqual(originalWhitelist, rules, 'The regression test must restore the deployed two-field restriction.')
let env
let baseline
const emulator = process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080'
const [host, port] = emulator.split(':')
if (!['localhost', '127.0.0.1'].includes(host)) throw new Error('Rules tests must use a local emulator.')
const profile = (uid, displayName) => ({ uid, displayName, email: '', sports: '', skills: '', availability: '', distance: '', createdAt: Timestamp.now(), updatedAt: Timestamp.now() })
const game = (patch = {}) => ({
  id: 'game', ownerUid: 'owner', organizer: 'Owner', participantUids: ['owner'], participants: ['Owner'], players: 1, capacity: 2,
  title: 'Test game', sport: 'Tennis', date: 'Tomorrow', time: '12:00 PM–1:00 PM', location: 'Test court', skill: 'All levels', description: '',
  contact: { method: 'Email', value: '' }, createdAt: Timestamp.now(), startAt: Timestamp.fromMillis(Date.now() + 3600000), endAt: Timestamp.fromMillis(Date.now() + 7200000), ...patch,
})
async function seed(environment, activity = game()) {
  await environment.withSecurityRulesDisabled(async context => {
    const db = context.firestore()
    for (const [uid, name] of [['owner', 'Owner'], ['guest', 'Guest'], ['other', 'Other']]) await setDoc(doc(db, 'users', uid), profile(uid, name))
    await setDoc(doc(db, 'activities', 'game'), activity)
  })
}
const db = (uid, provider = 'google.com') => env.authenticatedContext(uid, { firebase: { sign_in_provider: provider } }).firestore()
const joinPayload = { participantUids: ['owner', 'guest'], participants: ['Owner', 'Guest'], players: 2 }
before(async () => {
  env = await initializeTestEnvironment({ projectId: 'demo-sportbuddy-rules', firestore: { host, port: Number(port), rules } })
  baseline = await initializeTestEnvironment({ projectId: 'demo-sportbuddy-before', firestore: { host, port: Number(port), rules: originalWhitelist } })
})
after(async () => { await Promise.all([env?.cleanup(), baseline?.cleanup()]) })
beforeEach(async () => { await env.clearFirestore(); await seed(env) })

test('reproduces the deployed field restriction for a Google account and an anonymous account', async () => {
  await baseline.clearFirestore()
  await seed(baseline)
  for (const provider of ['google.com', 'anonymous']) {
    const client = baseline.authenticatedContext('guest', { firebase: { sign_in_provider: provider } }).firestore()
    await assertFails(updateDoc(doc(client, 'activities', 'game'), joinPayload))
  }
})

test('permits a Google member to join with their saved profile name', async () => {
  const client = db('guest')
  await assertSucceeds(updateDoc(doc(client, 'activities', 'game'), joinPayload))
  assert.deepEqual((await getDoc(doc(client, 'activities', 'game'))).data().participants, ['Owner', 'Guest'])
})

test('permits an anonymous member to join under the same identity and capacity checks', async () => {
  await assertSucceeds(updateDoc(doc(db('guest', 'anonymous'), 'activities', 'game'), joinPayload))
})

test('rejects unauthenticated joins, fabricated names, and edits to existing names', async () => {
  await assertFails(updateDoc(doc(env.unauthenticatedContext().firestore(), 'activities', 'game'), joinPayload))
  for (const participants of [['Owner', 'Imposter'], ['Changed owner', 'Guest'], ['Guest', 'Owner']]) {
    await assertFails(updateDoc(doc(db('guest'), 'activities', 'game'), { ...joinPayload, participants }))
  }
})

test('rejects another member joining on the caller’s behalf, duplicate IDs, and capacity bypasses', async () => {
  for (const patch of [
    { participantUids: ['owner', 'other'] },
    { participantUids: ['owner', 'guest', 'guest'], players: 3 },
    { participantUids: ['owner', 'guest', 'other'], players: 3, participants: ['Owner', 'Guest', 'Other'] },
    { capacity: 3 }, { title: 'Changed title' }, { players: 1 },
  ]) await assertFails(updateDoc(doc(db('guest'), 'activities', 'game'), { ...joinPayload, ...patch }))
})

test('rejects joining ended or full games', async () => {
  await seed(env, game({ startAt: Timestamp.fromMillis(Date.now() - 7200000), endAt: Timestamp.fromMillis(Date.now() - 3600000) }))
  await assertFails(updateDoc(doc(db('guest'), 'activities', 'game'), joinPayload))
  await seed(env, game({ participantUids: ['owner', 'other'], participants: ['Owner', 'Other'], players: 2 }))
  await assertFails(updateDoc(doc(db('guest'), 'activities', 'game'), { participantUids: ['owner', 'other', 'guest'], participants: ['Owner', 'Other', 'Guest'], players: 3 }))
})

test('permits leaving while removing only the caller’s display-name occurrence', async () => {
  await assertSucceeds(updateDoc(doc(db('guest'), 'activities', 'game'), joinPayload))
  await assertSucceeds(updateDoc(doc(db('guest'), 'activities', 'game'), { participantUids: ['owner'], participants: ['Owner'], players: 1 }))
})

test('rejects leaving while removing or replacing another member’s name', async () => {
  await seed(env, game(joinPayload))
  for (const participants of [['Guest'], ['Imposter'], []]) {
    await assertFails(updateDoc(doc(db('guest'), 'activities', 'game'), { participantUids: ['owner'], participants, players: 1 }))
  }
  await assertFails(updateDoc(doc(db('owner'), 'activities', 'game'), { participantUids: ['guest'], participants: ['Guest'], players: 1 }))
})

test('preserves duplicate names when different users share a display name', async () => {
  await env.withSecurityRulesDisabled(context => updateDoc(doc(context.firestore(), 'users', 'guest'), { displayName: 'Owner' }))
  await assertSucceeds(updateDoc(doc(db('guest'), 'activities', 'game'), { ...joinPayload, participants: ['Owner', 'Owner'] }))
  await assertSucceeds(updateDoc(doc(db('guest'), 'activities', 'game'), { participantUids: ['owner'], participants: ['Owner'], players: 1 }))
})

test('keeps legacy two-field membership updates compatible', async () => {
  await assertSucceeds(updateDoc(doc(db('guest'), 'activities', 'game'), { participantUids: ['owner', 'guest'], players: 2 }))
  await assertSucceeds(updateDoc(doc(db('guest'), 'activities', 'game'), { participantUids: ['owner'], players: 1 }))
})

test('supports older activities that saved an organizer but no participant-name list', async () => {
  const legacy = game()
  delete legacy.participants
  await seed(env, legacy)
  await assertSucceeds(updateDoc(doc(db('guest'), 'activities', 'game'), joinPayload))
})

test('retains private user profiles', async () => {
  await assertSucceeds(getDoc(doc(db('guest'), 'users', 'guest')))
  await assertFails(getDoc(doc(db('guest'), 'users', 'owner')))
})

test('concurrent joins still admit exactly one member into the final slot', async () => {
  async function join(uid, name) {
    const client = db(uid)
    const ref = doc(client, 'activities', 'game')
    await runTransaction(client, async transaction => {
      const snapshot = await transaction.get(ref)
      const current = snapshot.data()
      if (current.players >= current.capacity) throw new Error('Full')
      transaction.update(ref, { participantUids: [...current.participantUids, uid], participants: [...current.participants, name], players: current.players + 1 })
    })
  }
  const results = await Promise.allSettled([join('guest', 'Guest'), join('other', 'Other')])
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1)
  const saved = (await getDoc(doc(db('owner'), 'activities', 'game'))).data()
  assert.equal(saved.players, 2)
  assert.equal(saved.participantUids.length, 2)
  assert.equal(saved.participants.length, 2)
})
