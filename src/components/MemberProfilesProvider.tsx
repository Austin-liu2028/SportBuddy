import { useEffect, useState, type ReactNode } from 'react'
import type { User } from 'firebase/auth'
import { collection, doc, onSnapshot, runTransaction, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import type { Activity, MemberProfile, UserProfile } from '../types'
import { googleProfilePhoto, publicMemberProfile } from '../utils/memberProfiles'
import { MemberProfilesContext } from '../context/MemberProfilesContext'
import MemberProfileModal from './MemberProfileModal'

type Props = {
  user: User | null; profile: UserProfile | null; activities: Activity[]; joinedIds: string[]; now: number
  onOpenActivity: (activity: Activity) => void; onBeforeOpenProfile: () => void; children: ReactNode
}
type Directory = { key: string; profiles: Record<string, MemberProfile>; error: string }

export default function MemberProfilesProvider({ user, profile, activities, joinedIds, now, onOpenActivity, onBeforeOpenProfile, children }: Props) {
  const [attempt, setAttempt] = useState(0)
  const [directory, setDirectory] = useState<Directory | null>(null)
  const [syncResult, setSyncResult] = useState<{ key: string; error: string } | null>(null)
  const [selected, setSelected] = useState<{ viewerUid: string; uid: string; name: string } | null>(null)
  const uid = user?.uid
  const key = `${uid ?? ''}:${attempt}`
  const photoURL = googleProfilePhoto(user?.photoURL)
    || googleProfilePhoto(user?.providerData?.find(provider => provider.providerId === 'google.com')?.photoURL)
  const ownProfile = profile && profile.uid === uid ? publicMemberProfile(profile, photoURL) : null
  const ownProfileJSON = JSON.stringify(ownProfile)
  const syncKey = `${key}:${ownProfileJSON}`
  const currentDirectory = directory?.key === key ? directory : null
  const profiles = { ...currentDirectory?.profiles }
  if (ownProfile) profiles[ownProfile.uid] = ownProfile

  useEffect(() => {
    const close = () => setSelected(null)
    window.addEventListener('popstate', close)
    return () => window.removeEventListener('popstate', close)
  }, [])

  useEffect(() => {
    if (!uid) return
    return onSnapshot(collection(db, 'memberProfiles'), snapshot => {
      const loaded: Record<string, MemberProfile> = {}
      for (const item of snapshot.docs) {
        const data = item.data()
        // Read the same allowlist used for writes, even if an admin added fields.
        loaded[item.id] = publicMemberProfile({
          uid: item.id, displayName: typeof data.displayName === 'string' ? data.displayName : 'Player',
          sports: typeof data.sports === 'string' ? data.sports : '', skills: typeof data.skills === 'string' ? data.skills : '',
          availability: typeof data.availability === 'string' ? data.availability : '', email: '', distance: '',
        }, typeof data.photoURL === 'string' ? data.photoURL : null)
      }
      setDirectory({ key, profiles: loaded, error: '' })
    }, error => {
      console.error('Member profile directory failed:', { operation: 'listen', path: 'memberProfiles', code: error.code, uid, error })
      setDirectory({ key, profiles: {}, error: 'Profile details couldn’t be loaded. Their posted games are still available.' })
    })
  }, [uid, key])

  useEffect(() => {
    const publicProfile: MemberProfile | null = JSON.parse(ownProfileJSON)
    if (!uid || !publicProfile || publicProfile.uid !== uid) return
    let active = true
    const ref = doc(db, 'memberProfiles', uid)
    runTransaction(db, async transaction => {
      const saved = await transaction.get(ref)
      const data = saved.data()
      if (data && Object.entries(publicProfile).every(([field, value]) => data[field] === value)) return
      transaction.set(ref, { ...publicProfile, updatedAt: serverTimestamp() })
    }).then(() => { if (active) setSyncResult({ key: syncKey, error: '' }) }).catch(error => {
      console.error('Public member profile sync failed:', { operation: 'sync', path: `memberProfiles/${uid}`, code: error.code, error })
      if (active) setSyncResult({ key: syncKey, error: 'Your account is saved, but your public profile couldn’t be updated. Please try again.' })
    })
    return () => { active = false }
  }, [uid, ownProfileJSON, syncKey])

  const visibleSelection = selected?.viewerUid === uid ? selected : null
  return <MemberProfilesContext.Provider value={{
    profiles, loading: Boolean(uid && !currentDirectory), error: currentDirectory?.error ?? '',
    syncError: syncResult?.key === syncKey ? syncResult.error : '', retry: () => setAttempt(value => value + 1),
    openProfile: (memberUid, name) => {
      if (!uid || !memberUid) return
      onBeforeOpenProfile()
      setSelected({ viewerUid: uid, uid: memberUid, name })
    },
  }}>
    {children}
    {visibleSelection && <MemberProfileModal uid={visibleSelection.uid} fallbackName={visibleSelection.name} activities={activities} joinedIds={joinedIds} now={now} onClose={() => setSelected(null)} onOpenActivity={activity => { setSelected(null); onOpenActivity(activity) }} />}
  </MemberProfilesContext.Provider>
}
