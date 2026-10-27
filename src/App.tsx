
import { useEffect, useRef, useState } from 'react'
import {
  GoogleAuthProvider,
  linkWithPopup,
  onAuthStateChanged,
  signInAnonymously,
  signInWithCredential,
  signInWithPopup,
  signOut,
  type OAuthCredential,
  type User as FirebaseUser,
} from 'firebase/auth'
import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  runTransaction,
  Timestamp,
} from 'firebase/firestore'

import { auth, db } from './firebase'
import ActivityModal from './components/ActivityModal'
import CreateActivityModal from './components/CreateActivityModal'
import Navbar from './components/Navbar'
import SearchBar from './components/SearchBar'
import { initialUserProfile } from './data/profile'
import ActivitiesPage from './pages/ActivitiesPage'
import FindPartnersPage from './pages/FindPartnersPage'
import HomePage from './pages/HomePage'
import ProfilePage from './pages/ProfilePage'
import type {
  Activity,
  Partner,
  Route,
  Sport,
  UserProfile,
} from './types'
import './App.css'

function getRoute(pathname: string): Route {
  if (
    pathname === '/partners' ||
    pathname === '/activities' ||
    pathname === '/profile'
  ) {
    return pathname
  }
  return '/'
}

function App() {
  const [route, setRoute] = useState<Route>(
    () => getRoute(window.location.pathname)
  )

  // Activities now come from Firestore
  const [activities, setActivities] = useState<Activity[]>([])
  

  const [selectedActivity, setSelectedActivity] =
    useState<Activity | null>(null)

  const [createActivityOpen, setCreateActivityOpen] =
    useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [homeSport, setHomeSport] =
    useState<'All' | Sport>('All')

  const [notice, setNotice] = useState('')
  const [profile, setProfile] =
    useState<UserProfile>(initialUserProfile)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileError, setProfileError] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [accountRecoveryOpen, setAccountRecoveryOpen] = useState(false)
  const [recoveryNeedsRetry, setRecoveryNeedsRetry] = useState(false)
  const [signInWarningOpen, setSignInWarningOpen] = useState(false)

  
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const userId = firebaseUser?.uid ?? null
  const isAnonymous = firebaseUser?.isAnonymous ?? false
  const isGoogleLinked =
    firebaseUser?.providerData.some((provider) => provider.providerId === 'google.com') ?? false

  const [joining, setJoining] = useState(false)
  const activityActionInProgress = useRef(false)
  const anonymousSignInAttempted = useRef(false)
  const anonymousSignInInProgress = useRef(false)
  const profileCreationAttempts = useRef(new Set<string>())
  const profileMigrationAttempts = useRef(new Set<string>())
  const [authBusy, setAuthBusy] = useState(false)
  const [authPopupPending, setAuthPopupPending] = useState(false)
  const [authPopupCancellationPending, setAuthPopupCancellationPending] = useState(false)
  const authBusyRef = useRef(false)
  const pendingGoogleCredential = useRef<OAuthCredential | null>(null)

  async function runGooglePopup<T>(openPopup: () => Promise<T>): Promise<T> {
    let windowBlurred = false
    const handleWindowBlur = () => {
      windowBlurred = true
    }
    const handleWindowFocus = () => {
      if (windowBlurred) setAuthPopupCancellationPending(true)
    }

    setAuthPopupCancellationPending(false)
    setAuthPopupPending(true)
    window.addEventListener('blur', handleWindowBlur)
    window.addEventListener('focus', handleWindowFocus)
    try {
      return await openPopup()
    } finally {
      window.removeEventListener('blur', handleWindowBlur)
      window.removeEventListener('focus', handleWindowFocus)
      setAuthPopupPending(false)
      setAuthPopupCancellationPending(false)
    }
  }

  const joinedIds = activities
  .filter((activity) =>
    userId !== null &&
    activity.participantUids?.includes(userId)
  )
  .map((activity) => activity.id)

  const [authReady, setAuthReady] = useState(false)
  const [activitiesLoading, setActivitiesLoading] = useState(true)
  const [dataError, setDataError] = useState('')

  const gamesJoined = activities.filter(
    (activity) => userId !== null && activity.participantUids?.includes(userId)
  )
  const activitiesCreated = activities.filter(
    (activity) => userId !== null && activity.ownerUid === userId
  )
  const currentUserActivityHistory = activities.filter(
    (activity) =>
      userId !== null &&
      (activity.ownerUid === userId || activity.participantUids?.includes(userId))
  )
  const recentActivities = activities
    .filter((activity) =>
      userId !== null &&
      (activity.ownerUid === userId || activity.participantUids?.includes(userId))
    )
    .sort(
      (first, second) =>
        (typeof second.createdAt?.toMillis === 'function' ? second.createdAt.toMillis() : 0) -
        (typeof first.createdAt?.toMillis === 'function' ? first.createdAt.toMillis() : 0)
    )
    .slice(0, 5)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        console.log('[SportBuddy Auth]', {
          uid: user?.uid ?? null,
          isAnonymous: user?.isAnonymous ?? false,
          displayName: user?.displayName ?? null,
          email: user?.email ?? null,
        })

        if (user) {
          anonymousSignInAttempted.current = false
          anonymousSignInInProgress.current = false
          setFirebaseUser(user)
          setAuthReady(true)
          setDataError('')
        } else {
          if (authBusyRef.current) return

          setFirebaseUser(null)

          if (
            !anonymousSignInAttempted.current &&
            !anonymousSignInInProgress.current
          ) {
            anonymousSignInAttempted.current = true
            anonymousSignInInProgress.current = true
            setAuthReady(false)

            signInAnonymously(auth).catch((error) => {
              console.error('Anonymous sign-in failed:', error)
              setDataError('Unable to start an anonymous session. Please refresh and try again.')
              setAuthReady(true)
              setActivitiesLoading(false)
            }).finally(() => {
              anonymousSignInInProgress.current = false
            })
          } else {
            setAuthReady(true)
          }
        }
      },
      (error) => {
        console.error('Authentication error:', error)
        setDataError('Firebase authentication failed.')
        setAuthReady(true)
        setProfileLoading(false)
        setActivitiesLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!userId) return

    setProfileLoading(true)
    setProfileError('')
    const profileRef = doc(db, 'users', userId)

    const unsubscribe = onSnapshot(
      profileRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          if (profileCreationAttempts.current.has(userId)) return
          profileCreationAttempts.current.add(userId)

          const user = auth.currentUser
          if (!user || user.uid !== userId) return

          runTransaction(db, async (transaction) => {
            const currentProfile = await transaction.get(profileRef)
            if (currentProfile.exists()) return

            transaction.set(profileRef, {
              uid: userId,
              displayName: user.displayName?.trim() || 'Player',
              email: user.email ?? '',
              sports: initialUserProfile.sports,
              skills: initialUserProfile.skills,
              availability: initialUserProfile.availability,
              distance: initialUserProfile.distance,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            })
          }).catch((error) => {
            console.error('Profile creation failed:', error)
            setProfileError('Unable to create your profile. Check your connection and Firestore permissions.')
            setProfileLoading(false)
          })
          return
        }

        const data = snapshot.data()
        const user = auth.currentUser
        const displayName =
          typeof data.displayName === 'string' && data.displayName.trim()
            ? data.displayName
            : user?.displayName?.trim() || 'Player'
        const email = typeof data.email === 'string' ? data.email : user?.email ?? ''
        const sports = typeof data.sports === 'string' ? data.sports : ''
        const skills = typeof data.skills === 'string' ? data.skills : ''
        const availability = typeof data.availability === 'string' ? data.availability : ''
        const distance = typeof data.distance === 'string' ? data.distance : ''

        setProfile({
          uid: userId,
          displayName,
          email,
          sports,
          skills,
          availability,
          distance,
        })
        setProfileLoading(false)

        const hasValidCreatedAt = data.createdAt instanceof Timestamp
        const corrections: Record<string, unknown> = { uid: userId }
        if (typeof data.displayName !== 'string' || !data.displayName.trim()) {
          corrections.displayName = displayName
        }
        if (typeof data.email !== 'string') corrections.email = email
        if (typeof data.sports !== 'string') corrections.sports = ''
        if (typeof data.skills !== 'string') corrections.skills = ''
        if (typeof data.availability !== 'string') corrections.availability = ''
        if (typeof data.distance !== 'string') corrections.distance = ''

        const requiresCorrection =
          Object.keys(corrections).some(
            (field) => corrections[field] !== data[field]
          ) || !(data.updatedAt instanceof Timestamp)

        if (requiresCorrection && !profileMigrationAttempts.current.has(userId)) {
          profileMigrationAttempts.current.add(userId)

          if (!hasValidCreatedAt) {
            setProfileError(
              'Your profile has an invalid or missing createdAt timestamp. It cannot be safely repaired with the current rule requiring createdAt to remain unchanged on updates.'
            )
            return
          }

          let attemptedMigrationFields: string[] = []
          runTransaction(db, async (transaction) => {
            const currentProfile = await transaction.get(profileRef)
            if (!currentProfile.exists()) return

            const currentData = currentProfile.data()
            if (!(currentData.createdAt instanceof Timestamp)) {
              throw new Error('Profile createdAt must be repaired by an administrator.')
            }

            const updates: Record<string, unknown> = {
              updatedAt: serverTimestamp(),
            }
            if (currentData.uid !== userId) updates.uid = userId
            if (
              typeof currentData.displayName !== 'string' ||
              !currentData.displayName.trim()
            ) {
              updates.displayName = displayName
            }
            if (typeof currentData.email !== 'string') updates.email = email
            if (typeof currentData.sports !== 'string') updates.sports = ''
            if (typeof currentData.skills !== 'string') updates.skills = ''
            if (typeof currentData.availability !== 'string') updates.availability = ''
            if (typeof currentData.distance !== 'string') updates.distance = ''

            if (
              Object.keys(updates).length > 1 ||
              !(currentData.updatedAt instanceof Timestamp)
            ) {
              attemptedMigrationFields = Object.keys(updates)
              transaction.update(profileRef, updates)
            }
          }).catch((error) => {
            console.error(
              `Profile migration transaction failed for users/${userId}; fields attempted: ${attemptedMigrationFields.join(', ')}`,
              error
            )
            setProfileError(
              'Your profile needs migration, but Firestore rejected the update. Verify the users/{uid} rules allow this user to update valid profile fields while keeping createdAt unchanged.'
            )
          })
        }
      },
      (error) => {
        console.error('Profile read failed:', error)
        setProfileError('Unable to load your profile from Firestore.')
        setProfileLoading(false)
      }
    )

    return () => unsubscribe()
  }, [userId])

  useEffect(() => {
    if (!userId) return

    setActivitiesLoading(true)

    const unsubscribe = onSnapshot(
      collection(db, 'activities'),
      (snapshot) => {
        const loadedActivities = snapshot.docs.map(
          (document) => ({ ...document.data(), id: document.id }) as Activity
        )

        setActivities(loadedActivities)
        setActivitiesLoading(false)
        setDataError('')
      },
      (error) => {
        console.error('Firestore read failed:', error)
        setDataError('Unable to load activities from Firestore.')
        setActivitiesLoading(false)
      }
    )

    return () => unsubscribe()
  }, [userId])

  async function linkGoogleAccount() {
    if (authBusyRef.current) return

    authBusyRef.current = true
    setAuthBusy(true)

    try {
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({ prompt: 'select_account' })
      const currentUser = auth.currentUser

      if (currentUser?.isAnonymous) {
        const credential = await runGooglePopup(() => linkWithPopup(currentUser, provider))
        const linkedUser = credential.user
        if (linkedUser.uid !== currentUser.uid) {
          throw new Error('Google linking returned a different UID; the current account was not switched.')
        }

        setFirebaseUser(linkedUser)
        setProfile((currentProfile) => ({
          ...currentProfile,
          uid: linkedUser.uid,
          displayName:
            currentProfile.displayName.trim() && currentProfile.displayName !== 'Player'
              ? currentProfile.displayName
              : linkedUser.displayName?.trim() || currentProfile.displayName,
          email: linkedUser.email ?? currentProfile.email,
        }))

        const googleProviderLinked = linkedUser.providerData.some(
          (providerData) => providerData.providerId === 'google.com'
        )
        if (!googleProviderLinked) {
          setNotice('Your account was updated, but Firebase did not report Google as a linked provider. Please check your account settings.')
          return
        }

        try {
          await synchronizeLinkedProfile(linkedUser)
          setNotice('Your Google account is linked. Your SportBuddy activity history is preserved.')
        } catch (error) {
          console.error('Linked profile update failed:', error)
          setNotice('Your Google account is linked, but its profile details could not be synchronized. Your activity history is preserved.')
        }
      } else if (!currentUser) {
        setNotice('No active account is available to link. Please try again.')
      } else {
        setNotice('This account is already signed in.')
      }
    } catch (error) {
      const code =
        typeof error === 'object' && error !== null && 'code' in error
          ? String(error.code)
          : ''

      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        console.info('Google sign-in popup was closed before authentication completed.')
      } else {
        console.error('Google authentication failed:', error)
      }

      if (
        code === 'auth/credential-already-in-use' ||
        code === 'auth/account-exists-with-different-credential'
      ) {
        const credential = GoogleAuthProvider.credentialFromError(error as Error & { code: string })
        pendingGoogleCredential.current = credential
        setRecoveryNeedsRetry(credential === null)
        setAccountRecoveryOpen(true)
      } else if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setNotice('Google sign-in was cancelled.')
      } else {
        setNotice(
          error instanceof Error
            ? `Google sign-in failed: ${error.message}`
            : 'Google sign-in failed. Please try again.'
        )
      }
    } finally {
      authBusyRef.current = false
      setAuthBusy(false)
    }
  }

  function requestGoogleSignIn() {
    if (authBusyRef.current) return
    if (isAnonymous && activitiesLoading) {
      setNotice('Please wait until your activity history has loaded before signing in.')
      return
    }
    if (isAnonymous && currentUserActivityHistory.length > 0) {
      setSignInWarningOpen(true)
      return
    }
    void signInWithGoogle()
  }

  async function signInWithGoogle() {
    if (authBusyRef.current) return

    authBusyRef.current = true
    setAuthBusy(true)
    setSignInWarningOpen(false)

    try {
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({ prompt: 'select_account' })
      const credential = await runGooglePopup(() => signInWithPopup(auth, provider))
      const googleProviderLinked = credential.user.providerData.some(
        (providerData) => providerData.providerId === 'google.com'
      )
      if (!googleProviderLinked) {
        throw new Error('Google sign-in completed without a Google provider on the returned account.')
      }

      setFirebaseUser(credential.user)
      setProfileLoading(true)
      setProfileError('')
      setProfile({
        ...initialUserProfile,
        uid: credential.user.uid,
        displayName: credential.user.displayName?.trim() || 'Player',
        email: credential.user.email ?? '',
      })
      setSignInWarningOpen(false)
      setAccountRecoveryOpen(false)
      setNotice('You are signed in with Google. Any activities from your previous anonymous account remain attached to that original account and were not transferred.')
    } catch (error) {
      const code =
        typeof error === 'object' && error !== null && 'code' in error
          ? String(error.code)
          : ''

      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        console.info('Google sign-in popup was closed before authentication completed.')
        setNotice('Google sign-in was cancelled. Your current account remains active.')
      } else {
        console.error('Google sign-in failed:', error)
        setNotice(
          error instanceof Error
            ? `Google sign-in failed: ${error.message}`
            : 'Google sign-in failed. Please try again.'
        )
      }
    } finally {
      authBusyRef.current = false
      setAuthBusy(false)
    }
  }

  function dismissAccountRecovery() {
    pendingGoogleCredential.current = null
    setRecoveryNeedsRetry(false)
    setAccountRecoveryOpen(false)
  }

  async function recoverExistingGoogleAccount() {
    if (authBusyRef.current) return

    const pendingCredential = pendingGoogleCredential.current
    if (!pendingCredential) {
      setRecoveryNeedsRetry(true)
      return
    }

    authBusyRef.current = true
    setAuthBusy(true)

    try {
      const credential = await signInWithCredential(auth, pendingCredential)
      const googleProviderLinked = credential.user.providerData.some(
        (providerData) => providerData.providerId === 'google.com'
      )
      if (!googleProviderLinked) {
        throw new Error('Google sign-in completed without a Google provider on the returned account.')
      }

      pendingGoogleCredential.current = null
      setRecoveryNeedsRetry(false)
      setFirebaseUser(credential.user)
      setProfileLoading(true)
      setProfileError('')
      setProfile({
        ...initialUserProfile,
        uid: credential.user.uid,
        displayName: credential.user.displayName?.trim() || 'Player',
        email: credential.user.email ?? '',
      })
      setAccountRecoveryOpen(false)
      setNotice('You are signed in to the existing Google account. Anonymous activities remain attached to their original account and were not transferred.')
    } catch (error) {
      const code =
        typeof error === 'object' && error !== null && 'code' in error
          ? String(error.code)
          : ''

      if (
        code === 'auth/invalid-credential' ||
        code === 'auth/credential-already-in-use' ||
        code === 'auth/invalid-user-token'
      ) {
        pendingGoogleCredential.current = null
        setRecoveryNeedsRetry(true)
      }

      console.error('Existing-account credential sign-in failed:', error)
      setNotice(
        code === 'auth/invalid-credential' ||
          code === 'auth/credential-already-in-use' ||
          code === 'auth/invalid-user-token'
          ? 'Google requires fresh authentication to continue. Your anonymous account remains active and unchanged; use the retry option in the recovery dialog.'
          : error instanceof Error
            ? `Unable to sign in to the existing Google account: ${error.message}`
            : 'Unable to sign in to the existing Google account. Please try again.'
      )
    } finally {
      authBusyRef.current = false
      setAuthBusy(false)
    }
  }

  async function retryExistingGoogleAccount() {
    if (authBusyRef.current) return

    authBusyRef.current = true
    setAuthBusy(true)

    try {
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({ prompt: 'select_account' })
      const credential = await runGooglePopup(() => signInWithPopup(auth, provider))
      const googleProviderLinked = credential.user.providerData.some(
        (providerData) => providerData.providerId === 'google.com'
      )
      if (!googleProviderLinked) {
        throw new Error('Google sign-in completed without a Google provider on the returned account.')
      }

      pendingGoogleCredential.current = null
      setRecoveryNeedsRetry(false)
      setFirebaseUser(credential.user)
      setProfileLoading(true)
      setProfileError('')
      setProfile({
        ...initialUserProfile,
        uid: credential.user.uid,
        displayName: credential.user.displayName?.trim() || 'Player',
        email: credential.user.email ?? '',
      })
      setAccountRecoveryOpen(false)
      setNotice('You are signed in to the existing Google account. Anonymous activities remain attached to their original account and were not transferred.')
    } catch (error) {
      const code =
        typeof error === 'object' && error !== null && 'code' in error
          ? String(error.code)
          : ''
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        console.info('Existing-account retry popup was cancelled.')
        setNotice('Google sign-in was cancelled. Your anonymous account remains active.')
      } else {
        console.error('Existing-account retry failed:', error)
        setNotice(
          error instanceof Error
            ? `Unable to sign in to the existing Google account: ${error.message}`
            : 'Unable to sign in to the existing Google account. Please try again.'
        )
      }
    } finally {
      authBusyRef.current = false
      setAuthBusy(false)
    }
  }

  async function synchronizeLinkedProfile(user: FirebaseUser) {
    const profileRef = doc(db, 'users', user.uid)

    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(profileRef)

      if (!snapshot.exists()) return

      const data = snapshot.data()
      if (
        !(data.createdAt instanceof Timestamp) ||
        typeof data.sports !== 'string' ||
        typeof data.skills !== 'string' ||
        typeof data.availability !== 'string' ||
        typeof data.distance !== 'string'
      ) {
        throw new Error('The existing profile does not match the required schema and cannot be safely updated.')
      }

      const updates: Record<string, unknown> = {
        uid: user.uid,
        email: user.email ?? '',
        updatedAt: serverTimestamp(),
      }

      if (
        typeof data.displayName !== 'string' ||
        !data.displayName.trim() ||
        data.displayName === 'Player'
      ) {
        updates.displayName = user.displayName?.trim() || 'Player'
      }

      transaction.update(profileRef, updates)
    })
  }

  async function signOutGoogle() {
    if (authBusyRef.current) return

    authBusyRef.current = true
    setAuthBusy(true)
    try {
      await signOut(auth)
      await signInAnonymously(auth)
      setNotice('You have signed out. SportBuddy will continue with a temporary anonymous profile.')
    } catch (error) {
      console.error('Sign-out failed:', error)
      if (!auth.currentUser) {
        setFirebaseUser(null)
        setAuthReady(true)
        setActivitiesLoading(false)
      }
      setNotice(
        error instanceof Error
          ? `Sign-out failed: ${error.message}`
          : 'Sign-out failed. Please try again.'
      )
    } finally {
      authBusyRef.current = false
      setAuthBusy(false)
    }
  }

  async function saveProfile(updatedProfile: UserProfile): Promise<boolean> {
    const user = auth.currentUser
    if (!user) {
      setProfileError('Please wait for authentication before saving your profile.')
      return false
    }

    if (!updatedProfile.displayName.trim()) {
      setProfileError('Your display name cannot be empty.')
      return false
    }

    setProfileSaving(true)
    setProfileError('')
    const profileRef = doc(db, 'users', user.uid)
    const fields = {
      uid: user.uid,
      displayName: updatedProfile.displayName.trim(),
      email: user.email ?? '',
      sports: updatedProfile.sports.trim(),
      skills: updatedProfile.skills.trim(),
      availability: updatedProfile.availability.trim(),
      distance: updatedProfile.distance,
    }

    try {
      await runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(profileRef)
        const updatedFields = {
          ...fields,
          updatedAt: serverTimestamp(),
        }

        if (snapshot.exists()) {
          if (!(snapshot.data().createdAt instanceof Timestamp)) {
            throw new Error('Profile createdAt is missing or invalid. It cannot be changed by an update under the current Firestore rules.')
          }
          transaction.set(profileRef, updatedFields, { merge: true })
        } else {
          transaction.set(profileRef, {
            ...updatedFields,
            createdAt: serverTimestamp(),
          })
        }
      })

      setNotice('Profile saved successfully.')
      return true
    } catch (error) {
      console.error('Profile save failed:', error)
      setProfileError(
        error instanceof Error
          ? `Unable to save your profile: ${error.message}`
          : 'Unable to save your profile. Please try again.'
      )
      return false
    } finally {
      setProfileSaving(false)
    }
  }

  // Browser navigation
  useEffect(() => {
    function handlePopState() {
      setRoute(getRoute(window.location.pathname))
      setNotice('')
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  function navigate(path: Route) {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path)
    }

    setRoute(path)
    setNotice('')
    setSelectedActivity(null)

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

async function joinActivity(activity: Activity) {
  const user = auth.currentUser

  if (!user) {
    setNotice('Please sign in before joining.')
    return
  }

  if (activityActionInProgress.current) return

  activityActionInProgress.current = true
  setJoining(true)

  try {
    const activityRef = doc(db, 'activities', activity.id)

    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(activityRef)

      if (!snapshot.exists()) {
        throw new Error('Activity not found.')
      }

      const data = snapshot.data()
      const participantUids = data.participantUids

      if (!Array.isArray(participantUids)) {
        throw new Error('This activity needs data migration.')
      }

      if (participantUids.includes(user.uid)) {
        throw new Error('You have already joined this activity.')
      }

      if (data.players >= data.capacity) {
        throw new Error('This activity is full.')
      }

      transaction.update(activityRef, {
        participantUids: [...participantUids, user.uid],
        players: data.players + 1,
      })
    })

    setNotice('You have successfully joined this activity!')
    setSelectedActivity(null)
  } catch (error) {
    console.error('Join failed:', error)

    setNotice(
      error instanceof Error
        ? error.message
        : 'Failed to join activity.'
    )
  } finally {
    activityActionInProgress.current = false
    setJoining(false)
  }
}

async function leaveActivity(activity: Activity) {
  const user = auth.currentUser

  if (!user) {
    setNotice('Please sign in before leaving.')
    return
  }

  if (activityActionInProgress.current) return

  activityActionInProgress.current = true
  setJoining(true)

  try {
    const activityRef = doc(db, 'activities', activity.id)

    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(activityRef)

      if (!snapshot.exists()) {
        throw new Error('Activity not found.')
      }

      const data = snapshot.data()

      if (data.ownerUid === user.uid) {
        throw new Error('Organizers cannot leave their own activity.')
      }

      const participantUids = data.participantUids

      if (!Array.isArray(participantUids) || !participantUids.includes(user.uid)) {
        throw new Error('You have not joined this activity.')
      }

      transaction.update(activityRef, {
        participantUids: participantUids.filter(
          (participantUid: string) => participantUid !== user.uid
        ),
        players: data.players - 1,
      })
    })

    setNotice('You have successfully left this activity.')
    setSelectedActivity(null)
  } catch (error) {
    console.error('Leave failed:', error)

    setNotice(
      error instanceof Error
        ? error.message
        : 'Failed to leave activity.'
    )
  } finally {
    activityActionInProgress.current = false
    setJoining(false)
  }
}


  // Save newly created activities to Firestore
  async function createActivity(activity: Activity) {
    if (!auth.currentUser) {
      setNotice('Please wait for Firebase authentication.')
      return
    }

    if (profileLoading || profileError) {
      setNotice('Your profile is not ready yet. Please try again shortly.')
      return
    }

    try {
      const activityRef = doc(collection(db, 'activities'))

      await setDoc(activityRef, {
        ...activity,
        id: activityRef.id,
        organizer: profile.displayName || 'Player',
        participants: [profile.displayName || 'Player'],
        ownerUid: auth.currentUser.uid,
        participantUids: [auth.currentUser.uid],
        players: 1,
        createdAt: serverTimestamp(),
      })

      setHomeSport('All')
      setSearchQuery('')
      setCreateActivityOpen(false)

      setNotice('Activity created successfully!')
    } catch (error) {
      console.error('Failed to create activity:', error)
      setNotice('Failed to save activity. Please try again.')
    }
  }

  function invitePartner(partner: Partner) {
    setNotice(`Invite sent to ${partner.name}!`)
  }

  function viewPartnerProfile(partner: Partner) {
    setNotice(`Viewing ${partner.name}'s profile.`)
  }

  return (
    <main className="app-shell">
      <Navbar
        route={route}
        navigate={navigate}
        authReady={authReady}
        signedIn={userId !== null}
        isAnonymous={isAnonymous}
        authBusy={authBusy}
        authPopupPending={authPopupPending}
        authPopupCancellationPending={authPopupCancellationPending}
        historyLoading={activitiesLoading}
        onLinkGoogleAccount={linkGoogleAccount}
        onSignInWithGoogle={requestGoogleSignIn}
        onSignOut={signOutGoogle}
      />

      {route === '/' && (
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
        />
      )}

      {!authReady && (
        <div className="notice" role="status">
          Connecting to Firebase...
        </div>
      )}

      {authReady && userId && activitiesLoading && (
        <div className="notice" role="status">
          Loading activities...
        </div>
      )}

      {dataError && (
        <div className="notice" role="alert">
          {dataError}
        </div>
      )}

      {notice && (
        <div className="notice" role="status">
          <span>{notice}</span>
          <button
            onClick={() => setNotice('')}
            aria-label="Dismiss message"
          >
            ×
          </button>
        </div>
      )}

      {route === '/' && (
        <HomePage
          activities={activities}
          joinedIds={joinedIds}
          query={searchQuery}
          setQuery={setSearchQuery}
          sport={homeSport}
          setSport={setHomeSport}
          onOpenActivity={setSelectedActivity}
          onCreateActivity={() => {
            if (!userId || activitiesLoading || dataError || profileLoading || profileError) {
              setNotice('Activities are not ready yet.')
              return
            }
            setCreateActivityOpen(true)
          }}
          navigate={navigate}
        />
      )}

      {route === '/partners' && (
        <FindPartnersPage
          onInvite={invitePartner}
          onViewProfile={viewPartnerProfile}
        />
      )}

      {route === '/activities' && (
        <ActivitiesPage
          activities={activities}
          joinedIds={joinedIds}
          organizerName={profile.displayName || 'Player'}
          profileReady={!profileLoading && !profileError}
          onOpenActivity={setSelectedActivity}
          onCreate={createActivity}
        />
      )}

      {route === '/profile' && (
        <ProfilePage
          key={userId ?? 'signed-out'}
          profile={profile}
          profileLoading={profileLoading}
          activitiesLoading={activitiesLoading}
          profileError={profileError}
          saving={profileSaving}
          gamesJoined={gamesJoined.length}
          activitiesCreated={activitiesCreated.length}
          recentActivities={recentActivities}
          activitiesForCalendar={currentUserActivityHistory}
          isAnonymous={isAnonymous}
          isGoogleLinked={isGoogleLinked}
          onSave={saveProfile}
          onViewActivities={() => navigate('/activities')}
        />
      )}

      <footer className="page-footer">
        <button
          className="footer-brand"
          onClick={() => navigate('/')}
        >
          SportBuddy
        </button>
        <span>Good games start with good company.</span>
        <span>
          Made for campus life
          <span className="footer-heart">♥</span>
        </span>
      </footer>

      {selectedActivity && (
        <ActivityModal
          activity={selectedActivity}
          joined={joinedIds.includes(selectedActivity.id)}
          organizer={selectedActivity.ownerUid === userId}
          submitting={joining}
          onClose={() => setSelectedActivity(null)}
          onJoin={() => joinActivity(selectedActivity)}
          onLeave={() => leaveActivity(selectedActivity)}
        />
      )}

      {createActivityOpen && (
        <CreateActivityModal
          organizerName={profile.displayName || 'Player'}
          onClose={() => setCreateActivityOpen(false)}
          onCreate={createActivity}
        />
      )}

      {accountRecoveryOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !authBusy) dismissAccountRecovery()
          }}
        >
          <section
            className="modal-card account-recovery-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="account-recovery-title"
          >
            <button
              className="modal-close"
              onClick={dismissAccountRecovery}
              aria-label="Close account recovery"
              disabled={authBusy}
            >
              ×
            </button>
            <span className="section-eyebrow">ACCOUNT RECOVERY</span>
            <h2 id="account-recovery-title">This Google account is already in use</h2>
            <p>
              Your anonymous account and its activities have not been changed.
              {recoveryNeedsRetry || !pendingGoogleCredential.current
                ? ' Firebase did not provide a usable Google credential, or it has expired. You must authenticate with Google again to continue.'
                : ' Google provided a credential for the account you selected. You can explicitly use it to sign in without selecting the account again.'}
              {' '}Signing in will not transfer or merge activities; they will remain attached to their original user IDs.
            </p>
            <div className="recovery-actions">
              <button
                className="outline-button"
                onClick={dismissAccountRecovery}
                disabled={authBusy}
              >
                Stay in this account
              </button>
              <button
                className="find-button"
                onClick={
                  recoveryNeedsRetry || !pendingGoogleCredential.current
                    ? retryExistingGoogleAccount
                    : recoverExistingGoogleAccount
                }
                disabled={authBusy}
              >
                {authBusy
                  ? 'Connecting…'
                  : recoveryNeedsRetry || !pendingGoogleCredential.current
                    ? 'Retry Google authentication'
                    : 'Sign in to existing account'}
              </button>
            </div>
          </section>
        </div>
      )}

      {signInWarningOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSignInWarningOpen(false)
          }}
        >
          <section
            className="modal-card account-recovery-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="google-signin-warning-title"
          >
            <button
              className="modal-close"
              onClick={() => setSignInWarningOpen(false)}
              aria-label="Cancel Google sign-in"
              disabled={authBusy}
            >
              ×
            </button>
            <span className="section-eyebrow">BEFORE YOU SIGN IN</span>
            <h2 id="google-signin-warning-title">Your anonymous activity stays here</h2>
            <p>
              This anonymous account has {currentUserActivityHistory.length}{' '}
              {currentUserActivityHistory.length === 1 ? 'activity' : 'activities'} you created or joined.
              Signing in to an existing Google account switches to that account;
              it will not transfer, merge, overwrite, or delete these activities
              or your anonymous profile. They will remain attached to this original UID.
            </p>
            <div className="recovery-actions">
              <button
                className="outline-button"
                onClick={() => setSignInWarningOpen(false)}
                disabled={authBusy}
              >
                Stay in this account
              </button>
              <button
                className="find-button"
                onClick={() => void signInWithGoogle()}
                disabled={authBusy}
              >
                {authBusy ? 'Connecting…' : 'Continue to Google sign-in'}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}

export default App
