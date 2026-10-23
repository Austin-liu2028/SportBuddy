import { useMemo, useState } from 'react'
import PartnerCard from '../components/PartnerCard'
import { mockPartners } from '../data/partners'
import { sportOptions } from '../data/activities'
import type { Partner, Sport } from '../types'

type FindPartnersPageProps = {
  onInvite: (partner: Partner) => void
  onViewProfile: (partner: Partner) => void
}

export default function FindPartnersPage({ onInvite, onViewProfile }: FindPartnersPageProps) {
  const [sport, setSport] = useState<'All sports' | Sport>('All sports')
  const [skill, setSkill] = useState('Any level')
  const [availability, setAvailability] = useState('Any time')
  const [distance, setDistance] = useState('Any distance')
  const [searched, setSearched] = useState(false)
  const [activePartner, setActivePartner] = useState<Partner | null>(null)
  const [dialogType, setDialogType] = useState<'invite' | 'profile' | null>(null)
  const [invitedIds, setInvitedIds] = useState<string[]>([])

  const results = useMemo(() => mockPartners.filter((partner) => {
    const matchSport = sport === 'All sports' || partner.sport === sport
    const matchSkill = skill === 'Any level' || partner.skill === skill
    const maxDistance = distance === 'Under 0.5 mi' ? 0.5 : distance === 'Under 1 mi' ? 1 : distance === 'Under 2 mi' ? 2 : Infinity
    const matchDistance = partner.distance <= maxDistance
    const text = partner.availability.toLowerCase()
    const matchAvailability = availability === 'Any time' ||
      (availability === 'Today' && text.includes('today')) ||
      (availability === 'Tomorrow' && text.includes('tomorrow')) ||
      (availability === 'This Weekend' && text.includes('weekend')) ||
      availability === 'Custom'
    return matchSport && matchSkill && matchDistance && matchAvailability
  }), [sport, skill, distance, availability])

  return (
    <section className="inner-page">
      <div className="page-heading">
        <span className="section-eyebrow">YOUR NEXT GAME STARTS HERE</span>
        <h1>Find Your Sports Partner</h1>
        <p>Match with people who play like you do.</p>
      </div>
      <div className="filter-panel partner-search-panel">
        <label>Sport<select value={sport} onChange={(event) => setSport(event.target.value as 'All sports' | Sport)}><option>All sports</option>{sportOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Skill level<select value={skill} onChange={(event) => setSkill(event.target.value)}><option>Any level</option><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label>
        <label>Availability<select value={availability} onChange={(event) => setAvailability(event.target.value)}><option>Any time</option><option>Today</option><option>Tomorrow</option><option>This Weekend</option><option>Custom</option></select></label>
        <label>Distance<select value={distance} onChange={(event) => setDistance(event.target.value)}><option>Any distance</option><option>Under 0.5 mi</option><option>Under 1 mi</option><option>Under 2 mi</option></select></label>
        <button className="find-button" onClick={() => setSearched(true)}>Find Partners</button>
      </div>
      {searched && (
        <section className="results-section" aria-live="polite">
          <div className="results-title">
            <div><span className="section-eyebrow">PEOPLE NEAR YOU</span><h2>{results.length ? 'Ready when you are' : 'No partners found'}</h2></div>
            <span className="result-count">{results.length} {results.length === 1 ? 'partner' : 'partners'}</span>
          </div>
          {results.length ? (
            <div className="partner-grid">
              {results.map((partner) => <PartnerCard key={partner.id} partner={partner} onView={(person) => { setActivePartner(person); setDialogType('profile') }} onInvite={(person) => { setActivePartner(person); setDialogType('invite') }} />)}
            </div>
          ) : <p className="empty-message">Try widening your distance or adjusting the filters.</p>}
        </section>
      )}
      {activePartner && dialogType && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setDialogType(null)
        }}>
          <section className="modal-card small-modal" role="dialog" aria-modal="true" aria-labelledby="partner-dialog-title">
            <button className="modal-close" onClick={() => setDialogType(null)} aria-label="Close dialog">×</button>
            <div className={`avatar avatar-${activePartner.color}`}>{activePartner.initials}</div>
            <h2 id="partner-dialog-title">{activePartner.name}</h2>
            <p className="modal-organizer">{activePartner.sport} · {activePartner.skill} · {activePartner.distance.toFixed(1)} mi away</p>
            <p className="partner-availability">{activePartner.availability}</p>
            {dialogType === 'invite' ? (
              invitedIds.includes(activePartner.id) ? (
                <div className="invite-success" role="status">Invite sent to {activePartner.name}!</div>
              ) : (
                <>
                  <p className="modal-organizer">Send a game invite to {activePartner.name}?</p>
                  <button className="find-button" onClick={() => {
                    setInvitedIds((current) => [...current, activePartner.id])
                    onInvite(activePartner)
                  }}>Send Invite</button>
                </>
              )
            ) : (
              <button className="outline-button modal-full-button" onClick={() => {
                setDialogType('invite')
                onViewProfile(activePartner)
              }}>Invite to play</button>
            )}
          </section>
        </div>
      )}
    </section>
  )
}
