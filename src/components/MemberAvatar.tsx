import { useState } from 'react'
import { googleProfilePhoto, memberInitials } from '../utils/memberProfiles'

export default function MemberAvatar({ name, photoURL, className = '' }: { name: string; photoURL?: string; className?: string }) {
  const photo = googleProfilePhoto(photoURL)
  const [failedPhoto, setFailedPhoto] = useState('')
  return <span className={`member-avatar ${className}`} aria-hidden="true">
    {photo && failedPhoto !== photo ? <img src={photo} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setFailedPhoto(photo)} /> : memberInitials(name)}
  </span>
}
