import { useState } from 'react'
import type { UserProfile } from '../types'

const recentActivities = [
  { title: 'Tennis Doubles', detail: 'Today · Northwestern Tennis Courts', sport: 'Tennis', color: 'lilac' },
  { title: 'Morning Run', detail: 'Yesterday · Lakefill', sport: 'Running', color: 'mint' },
  { title: 'Pickup Basketball', detail: 'Monday · SPAC', sport: 'Basketball', color: 'peach' },
]

type ProfilePageProps = {
  profile: UserProfile
  onSave: (profile: UserProfile) => void
  onViewActivities: () => void
}

export default function ProfilePage({ profile, onSave, onViewActivities }: ProfilePageProps) {
  const [editing, setEditing] = useState(false)
  const [manageAvailability, setManageAvailability] = useState(false)
  const [draft, setDraft] = useState(profile)

  function openEditor(availabilityOnly = false) {
    setDraft(profile)
    setManageAvailability(availabilityOnly)
    setEditing(true)
  }

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSave(draft)
    setEditing(false)
  }

  return (
    <section className="inner-page profile-page">
      <div className="page-heading">
        <span className="section-eyebrow">YOUR SPORTBUDDY SPACE</span>
        <h1>Profile</h1>
        <p>A little about you and how you like to play.</p>
      </div>
      <section className="profile-hero-card">
        <div className="profile-identity">
          <div className="profile-avatar">AC</div>
          <div><h2>{profile.name}</h2><p>{profile.headline}</p><span className="profile-campus"><span /> Northwestern University</span></div>
        </div>
        <div className="profile-buttons">
          <button className="outline-button" onClick={() => openEditor()}>Edit Profile</button>
          <button className="join-button" onClick={() => openEditor(true)}>Manage Availability</button>
        </div>
      </section>

      <div className="profile-content-grid">
        <section className="profile-panel">
          <div className="panel-heading"><h2>About me</h2><span aria-hidden="true">✦</span></div>
          <div className="profile-field"><span>Sports</span><div className="profile-tags">{profile.sports.split(',').map((sport) => <span key={sport}>{sport.trim()}</span>)}</div></div>
          <div className="profile-field"><span>Skill levels</span><p>{profile.skills.split(';').map((skill) => <span className="skill-line" key={skill}>{skill.trim()}</span>)}</p></div>
          <div className="profile-field"><span>Availability</span><p>{profile.availability}</p></div>
          <div className="profile-field"><span>Preferred distance</span><p>{profile.distance}</p></div>
        </section>
        <section className="profile-panel stats-panel">
          <div className="panel-heading"><h2>Your stats</h2><span aria-hidden="true">↗</span></div>
          <div className="stat-row"><span className="stat-icon">◉</span><span>Games joined</span><strong>12</strong></div>
          <div className="stat-row"><span className="stat-icon stat-icon-green">♡</span><span>Partners met</span><strong>8</strong></div>
          <div className="stat-row"><span className="stat-icon stat-icon-peach">＋</span><span>Activities created</span><strong>3</strong></div>
        </section>
      </div>

      <section className="recent-activities">
        <div className="results-title"><div><span className="section-eyebrow">GOOD TIMES, RECENTLY</span><h2>Recent Activities</h2></div><button className="view-all-button" onClick={onViewActivities}>See all <span aria-hidden="true">→</span></button></div>
        <div className="recent-list">
          {recentActivities.map((activity) => (
            <article className="recent-item" key={activity.title}>
              <span className={`recent-icon avatar-${activity.color}`} aria-hidden="true">{activity.sport.slice(0, 1)}</span>
              <div><h3>{activity.title}</h3><p>{activity.detail}</p></div>
              <span className="recent-sport">{activity.sport}</span>
            </article>
          ))}
        </div>
      </section>

      {editing && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditing(false) }}>
          <section className="modal-card edit-profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-edit-title">
            <button className="modal-close" onClick={() => setEditing(false)} aria-label="Close edit profile">×</button>
            <span className="section-eyebrow">MAKE IT YOURS</span>
            <h2 id="profile-edit-title">{manageAvailability ? 'Manage Availability' : 'Edit Profile'}</h2>
            <form className="create-form" onSubmit={save}>
              {!manageAvailability && <>
                <label className="wide-field">Name<input required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
                <label className="wide-field">About<input value={draft.headline} onChange={(event) => setDraft({ ...draft, headline: event.target.value })} /></label>
                <label className="wide-field">Sports<input value={draft.sports} onChange={(event) => setDraft({ ...draft, sports: event.target.value })} /></label>
                <label className="wide-field">Skill levels<input value={draft.skills} onChange={(event) => setDraft({ ...draft, skills: event.target.value })} /></label>
              </>}
              <label className="wide-field">Availability<input value={draft.availability} onChange={(event) => setDraft({ ...draft, availability: event.target.value })} placeholder="e.g. Weekdays after 4 PM" /></label>
              <label className="wide-field">Preferred distance<select value={draft.distance} onChange={(event) => setDraft({ ...draft, distance: event.target.value })}><option>Within 0.5 miles</option><option>Within 1 mile</option><option>Within 2 miles</option><option>Any distance</option></select></label>
              <button className="find-button wide-field" type="submit">Save Changes</button>
            </form>
          </section>
        </div>
      )}
    </section>
  )
}
