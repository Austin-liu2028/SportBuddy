import type { MemberProfile, UserProfile } from '../types'

export function googleProfilePhoto(value: unknown): string {
  if (typeof value !== 'string' || value.length > 2048 || /\s/.test(value)) return ''
  return /^https:\/\/lh[3-6]\.googleusercontent\.com\/.+/.test(value) ? value : ''
}

// Explicitly select public fields. Never spread a private user document here.
export function publicMemberProfile(profile: UserProfile, photoURL: string | null): MemberProfile {
  return {
    uid: profile.uid,
    displayName: profile.displayName.trim().slice(0, 60) || 'Player',
    photoURL: googleProfilePhoto(photoURL),
    sports: profile.sports.trim().slice(0, 500),
    skills: profile.skills.trim().slice(0, 500),
    availability: profile.availability.trim().slice(0, 500),
  }
}

export function memberInitials(name: string): string {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(part => Array.from(part)[0]).join('').toLocaleUpperCase() || 'M'
}

export function memberDisplayName(sharedName: string | undefined, savedName: string): string {
  const name = sharedName?.trim()
  return name && !/^(player|new member)$/i.test(name) ? name : savedName.trim() || name || 'Member'
}
