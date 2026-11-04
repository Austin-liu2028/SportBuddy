import { createContext, useContext } from 'react'
import type { MemberProfile } from '../types'

export type MemberProfilesContextValue = {
  profiles: Readonly<Record<string, MemberProfile>>
  loading: boolean
  error: string
  syncError: string
  openProfile: (uid: string, fallbackName: string) => void
  retry: () => void
}
export const MemberProfilesContext = createContext<MemberProfilesContextValue>({
  profiles: {}, loading: false, error: '', syncError: '', openProfile: () => {}, retry: () => {},
})
export const useMemberProfiles = () => useContext(MemberProfilesContext)
