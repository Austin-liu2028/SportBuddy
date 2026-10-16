import type { Partner } from '../types'

type PartnerCardProps = {
  partner: Partner
  onView: (partner: Partner) => void
  onInvite: (partner: Partner) => void
}

export default function PartnerCard({ partner, onView, onInvite }: PartnerCardProps) {
  return (
    <article className="partner-card">
      <div className={`avatar avatar-${partner.color}`}>{partner.initials}</div>
      <div className="partner-info">
        <h3>{partner.name}</h3>
        <p>{partner.sport} · {partner.skill}</p>
        <p>{partner.availability} · {partner.distance.toFixed(1)} mi</p>
      </div>
      <div className="partner-actions">
        <button className="outline-button compact-button" onClick={() => onView(partner)}>View Profile</button>
        <button className="join-button compact-button" onClick={() => onInvite(partner)}>Invite</button>
      </div>
    </article>
  )
}
