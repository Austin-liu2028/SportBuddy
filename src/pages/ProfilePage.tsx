import { useState } from 'react'
import type { Activity, UserProfile } from '../types'

type ProfilePageProps = {
  profile: UserProfile
  profileLoading: boolean
  activitiesLoading: boolean
  profileError: string
  saving: boolean
  gamesJoined: number
  activitiesCreated: number
  recentActivities: Activity[]
  isAnonymous: boolean
  isGoogleLinked: boolean
  onSave: (profile: UserProfile) => Promise<boolean>
  onViewActivities: () => void
}

export default function ProfilePage({
  profile,
  profileLoading,
  activitiesLoading,
  profileError,
  saving,
  gamesJoined,
  activitiesCreated,
  recentActivities,
  isAnonymous,
  isGoogleLinked,
  onSave,
  onViewActivities,
}: ProfilePageProps) {
  const [editing, setEditing] = useState(false)
  const [manageAvailability, setManageAvailability] = useState(false)
  const [draft, setDraft] = useState(profile)
  const [saveError, setSaveError] = useState('')

  function openEditor(availabilityOnly = false) {
    setDraft(profile)
    setManageAvailability(availabilityOnly)
    setEditing(true)
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaveError('')
    try {
      if (await onSave(draft)) setEditing(false)
    } catch (error) {
      console.error('Profile save failed:', error)
      setSaveError('Unable to save your profile. Please try again.')
    }
  }

  const initials = profile.displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'P'

  return (
    <section className="inner-page profile-page">
      <div className="page-heading">
        <span className="section-eyebrow">YOUR SPORTBUDDY SPACE</span>
        <h1>Profile</h1>
        <p>A little about you and how you like to play.</p>
      </div>
      <section className="profile-hero-card">
        <div className="profile-identity">
          <div className="profile-avatar">{initials}</div>
          <div>
            <h2>{profile.displayName}</h2>
            <p>
              {isGoogleLinked
                ? 'Google-connected profile'
                : isAnonymous
                  ? 'Temporary anonymous profile'
                  : 'Signed-in profile'}
            </p>
            <span className="profile-campus"><span /> Northwestern University</span>
          </div>
        </div>
        <div className="profile-buttons">
          <button className="outline-button" onClick={() => openEditor()} disabled={profileLoading}>Edit Profile</button>
          <button className="join-button" onClick={() => openEditor(true)} disabled={profileLoading}>Manage Availability</button>
        </div>
      </section>

      {profileLoading && <div className="notice" role="status">Loading your profile…</div>}
      {(profileError || saveError) && <div className="notice" role="alert">{profileError || saveError}</div>}

      <div className="profile-content-grid">
        <section className="profile-panel">
          <div className="panel-heading"><h2>About me</h2><span aria-hidden="true">✦</span></div>
          <div className="profile-field"><span>Sports</span><div className="profile-tags">{profile.sports.split(',').map((sport) => sport.trim()).filter(Boolean).map((sport) => <span key={sport}>{sport}</span>)}{!profile.sports.trim() && <p>Not set</p>}</div></div>
          <div className="profile-field"><span>Skill levels</span><p>{profile.skills.split(';').map((skill) => skill.trim()).filter(Boolean).map((skill) => <span className="skill-line" key={skill}>{skill}</span>)}{!profile.skills.trim() && 'Not set'}</p></div>
          <div className="profile-field"><span>Availability</span><p>{profile.availability || 'Not set'}</p></div>
          <div className="profile-field"><span>Preferred distance</span><p>{profile.distance || 'Not set'}</p></div>
        </section>
        <section className="profile-panel stats-panel">
          <div className="panel-heading"><h2>Your stats</h2><span aria-hidden="true">↗</span></div>
          <div className="stat-row"><span className="stat-icon">◉</span><span>Games joined</span><strong>{activitiesLoading ? '—' : gamesJoined}</strong></div>
          <div className="stat-row"><span className="stat-icon stat-icon-peach">＋</span><span>Activities created</span><strong>{activitiesLoading ? '—' : activitiesCreated}</strong></div>
        </section>
      </div>

      <section className="recent-activities">
        <div className="results-title"><div><span className="section-eyebrow">GOOD TIMES, RECENTLY</span><h2>Recent Activities</h2></div><button className="view-all-button" onClick={onViewActivities}>See all <span aria-hidden="true">→</span></button></div>
        {profileLoading || activitiesLoading ? (
          <div className="notice" role="status">Loading recent activities…</div>
        ) : recentActivities.length > 0 ? (
          <div className="recent-list">
            {recentActivities.map((activity) => (
              <article className="recent-item" key={activity.id}>
                <span className="recent-icon avatar-lilac" aria-hidden="true">{activity.sport.slice(0, 1)}</span>
                <div><h3>{activity.title}</h3><p>{activity.date} · {activity.location}</p></div>
                <span className="recent-sport">{activity.sport}</span>
              </article>
            ))}
          </div>
        ) : (
          <div className="notice" role="status">You have not created or joined any activities yet.</div>
        )}
      </section>

      {editing && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditing(false) }}>
          <section className="modal-card edit-profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-edit-title">
            <button className="modal-close" onClick={() => setEditing(false)} aria-label="Close edit profile">×</button>
            <span className="section-eyebrow">MAKE IT YOURS</span>
            <h2 id="profile-edit-title">{manageAvailability ? 'Manage Availability' : 'Edit Profile'}</h2>
            <form className="create-form" onSubmit={save}>
              {!manageAvailability && <>
                <label className="wide-field">Name<input required maxLength={80} value={draft.displayName} onChange={(event) => setDraft({ ...draft, displayName: event.target.value })} /></label>
                <label className="wide-field">Sports<input value={draft.sports} onChange={(event) => setDraft({ ...draft, sports: event.target.value })} /></label>
                <label className="wide-field">Skill levels<input value={draft.skills} onChange={(event) => setDraft({ ...draft, skills: event.target.value })} /></label>
              </>}
              <label className="wide-field">Availability<input value={draft.availability} onChange={(event) => setDraft({ ...draft, availability: event.target.value })} placeholder="e.g. Weekdays after 4 PM" /></label>
              <label className="wide-field">Preferred distance<select value={draft.distance} onChange={(event) => setDraft({ ...draft, distance: event.target.value })}><option value="" disabled>Choose a distance</option><option>Within 0.5 miles</option><option>Within 1 mile</option><option>Within 2 miles</option><option>Any distance</option></select></label>
              <button className="find-button wide-field" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
            </form>
          </section>
        </div>
      )}
    </section>
  )
}
