import { readFileSync } from 'node:fs'
import { before, after, beforeEach, test } from 'node:test'
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing'
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, serverTimestamp, setLogLevel } from 'firebase/firestore'
setLogLevel('silent')
let env
const [host, port] = (process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080').split(':')
if (!['localhost', '127.0.0.1'].includes(host)) throw new Error('Rules tests must use a local emulator.')
before(async () => {
  env = await initializeTestEnvironment({ projectId: 'demo-sportbuddy-member-profiles', firestore: { host, port: Number(port), rules: readFileSync('firestore.rules', 'utf8') } })
})
after(async () => { await env?.cleanup() })
beforeEach(async () => { await env.clearFirestore() })
const db = uid => env.authenticatedContext(uid).firestore()
const fields = () => ({ uid: 'owner', displayName: 'Alex', photoURL: 'https://lh3.googleusercontent.com/a/photo=s96-c', sports: 'Tennis', skills: 'Intermediate', availability: 'Weekends', updatedAt: serverTimestamp() })

test('owners can publish and update their public member details', async () => {
  await assertSucceeds(setDoc(doc(db('owner'), 'memberProfiles', 'owner'), fields()))
  await assertSucceeds(updateDoc(doc(db('owner'), 'memberProfiles', 'owner'), { availability: 'Evenings', updatedAt: serverTimestamp() }))
})
test('signed-in members, including guests, can discover public member profiles', async () => {
  await setDoc(doc(db('owner'), 'memberProfiles', 'owner'), fields())
  await assertSucceeds(getDoc(doc(db('guest'), 'memberProfiles', 'owner')))
  await assertSucceeds(getDocs(collection(db('guest'), 'memberProfiles')))
  const anonymous = env.unauthenticatedContext().firestore()
  await assertFails(getDoc(doc(anonymous, 'memberProfiles', 'owner')))
  await assertFails(getDocs(collection(anonymous, 'memberProfiles')))
})
test('another member cannot create, replace, or delete someone else’s public profile', async () => {
  await assertFails(setDoc(doc(db('other'), 'memberProfiles', 'owner'), fields()))
  await setDoc(doc(db('owner'), 'memberProfiles', 'owner'), fields())
  await assertFails(updateDoc(doc(db('other'), 'memberProfiles', 'owner'), { displayName: 'Imposter', updatedAt: serverTimestamp() }))
  await assertFails(deleteDoc(doc(db('other'), 'memberProfiles', 'owner')))
})
test('public documents reject private emails, extra fields, and identity spoofing', async () => {
  for (const extra of [{ email: 'private@example.test' }, { phone: '123' }, { distance: 'Within 1 mile' }, { uid: 'other' }]) {
    await assertFails(setDoc(doc(db('owner'), 'memberProfiles', 'owner'), { ...fields(), ...extra }))
  }
})
test('public documents accept empty photo fallbacks but reject unsafe image sources', async () => {
  await assertSucceeds(setDoc(doc(db('owner'), 'memberProfiles', 'owner'), { ...fields(), photoURL: '' }))
  for (const photoURL of ['javascript:alert(1)', 'data:image/png;base64,test', 'http://lh3.googleusercontent.com/image', 'https://evil.test/image', 'https://lh3.googleusercontent.com.evil.test/image']) {
    await assertFails(setDoc(doc(db('owner'), 'memberProfiles', 'owner'), { ...fields(), photoURL }))
  }
})
test('enforces field types, bounds, and server update times', async () => {
  for (const extra of [{ displayName: '' }, { displayName: 'x'.repeat(61) }, { sports: 'x'.repeat(501) }, { availability: 123 }, { skills: ['Tennis'] }, { updatedAt: 'yesterday' }]) {
    await assertFails(setDoc(doc(db('owner'), 'memberProfiles', 'owner'), { ...fields(), ...extra }))
  }
})
test('private account documents remain inaccessible to other members', async () => {
  await env.withSecurityRulesDisabled(context => setDoc(doc(context.firestore(), 'users', 'owner'), { email: 'private@example.test' }))
  await assertSucceeds(getDoc(doc(db('owner'), 'users', 'owner')))
  await assertFails(getDoc(doc(db('other'), 'users', 'owner')))
  await assertFails(getDocs(collection(db('other'), 'users')))
})
