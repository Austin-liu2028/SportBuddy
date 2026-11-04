import { useState } from 'react'
import type { Activity, UserProfile } from '../types'
import { useDialog } from '../hooks/useDialog'
import Icon from '../components/Icon'
import { getActivityStartAt } from '../utils/activityStatus'
import { DISPLAY_NAME_MAX_LENGTH } from '../utils/organizerName'
import { useMemberProfiles } from '../context/MemberProfilesContext'
import MemberAvatar from '../components/MemberAvatar'

type ProfilePageProps = {
  profile: UserProfile
  profileLoading: boolean
  activitiesLoading: boolean
  profileError: string
  saving: boolean
  gamesJoined: number
  activitiesCreated: number
  recentActivities: Activity[]
  activitiesForCalendar: Activity[]
  onOpenActivity: (activity: Activity) => void
  isAnonymous: boolean
  isGoogleLinked: boolean
  onSave: (profile: UserProfile) => Promise<boolean>
  onViewActivities: () => void
  onLinkGoogleAccount: () => void
  onSignInWithGoogle: () => void
  onSignOut: () => void
  authBusy: boolean
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
  activitiesForCalendar,
  onOpenActivity,
  isAnonymous,
  isGoogleLinked,
  onSave,
  onViewActivities,
  onLinkGoogleAccount,
  onSignInWithGoogle,
  onSignOut,
  authBusy,
}: ProfilePageProps) {
  const { profiles, syncError, retry } = useMemberProfiles()
  const [editing, setEditing] = useState(false)
  const [manageAvailability, setManageAvailability] = useState(false)
  const [draft, setDraft] = useState(profile)
  const [saveError, setSaveError] = useState('')
  const [calendarOpen, setCalendarOpen] = useState(false)
  const editor = useDialog(editing, () => setEditing(false), saving)
  const calendar = useDialog(calendarOpen, () => setCalendarOpen(false))
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(() => getDateKey(new Date()))

  const calendarActivities = activitiesForCalendar.flatMap((activity) => {
    const date = getActivityDate(activity)
    return date ? [{ activity, dateKey: getDateKey(date) }] : []
  })
  const calendarDays = Array.from(
    { length: new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate() },
    (_, index) => index + 1
  )
  const firstWeekday = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1).getDay()
  const selectedDayActivities = calendarActivities.filter(({ dateKey }) => dateKey === selectedCalendarDay)
  const calendarMonthLabel = calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  function openEditor(availabilityOnly = false) {
    setDraft(profile)
    setManageAvailability(availabilityOnly)
    setEditing(true)
  }

  function changeCalendarMonth(offset: number) {
    setCalendarMonth((month) => new Date(month.getFullYear(), month.getMonth() + offset, 1))
    setSelectedCalendarDay('')
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

  return (
    <section className="inner-page profile-page" id="main-content" tabIndex={-1}>
      <div className="page-heading">
        <span className="section-eyebrow">YOUR SPORTBUDDY SPACE</span>
        <h1>Your place on the team.</h1>
        <p>Your sports, your schedule, and the games that bring you back.</p>
      </div>
      <section className="profile-hero-card">
        <div className="profile-identity">
          <MemberAvatar name={profile.displayName} photoURL={profiles[profile.uid]?.photoURL} className="member-avatar-large" />
          <div>
            <h2>{profile.displayName}</h2>
            <p>
              {isGoogleLinked
                ? 'Google-connected profile'
                : isAnonymous
                  ? 'Temporary anonymous profile'
                  : 'Signed-in profile'}
            </p>
            <span className="profile-campus">Campus sports community</span>
          </div>
        </div>
        <div className="profile-buttons">
          <button className="outline-button" onClick={() => openEditor()} disabled={profileLoading}>Edit Profile</button>
          <button className="join-button" onClick={() => openEditor(true)} disabled={profileLoading}>Manage Availability</button>
        </div>
      </section>

      {profileLoading && <div className="notice" role="status">Loading your profile…</div>}
      {(profileError || saveError) && <div className="notice" role="alert">{profileError || saveError}</div>}
      {syncError && <div className="notice" role="alert"><span>{syncError}</span><button className="retry-button" onClick={retry}>Retry</button></div>}
      <p className="profile-visibility-note">Your name, Google profile photo, sports, skill levels, and availability are visible to signed-in SportBuddy members. Your account email stays private.</p>

      <div className="profile-content-grid">
        <section className="profile-panel">
          <div className="panel-heading"><h2>How you like to play</h2><Icon name="users" /></div>
          <div className="profile-field"><span>Sports</span><div className="profile-tags">{profile.sports.split(',').map((sport) => sport.trim()).filter(Boolean).map((sport) => <span key={sport}>{sport}</span>)}{!profile.sports.trim() && <p>Not set</p>}</div></div>
          <div className="profile-field"><span>Skill levels</span><p>{profile.skills.split(';').map((skill) => skill.trim()).filter(Boolean).map((skill) => <span className="skill-line" key={skill}>{skill}</span>)}{!profile.skills.trim() && 'Not set'}</p></div>
          <div className="profile-field"><span>Availability</span><p>{profile.availability || 'Not set'}</p></div>
          <div className="profile-field"><span>Preferred distance</span><p>{profile.distance || 'Not set'}</p></div>
        </section>
        <section className="profile-panel stats-panel">
          <div className="panel-heading"><h2>Your game history</h2><Icon name="calendar" /></div>
          <div className="stat-row"><span className="stat-icon"><Icon name="users" /></span><span>Games joined, including hosted</span><strong>{activitiesLoading ? '—' : gamesJoined}</strong></div>
          <div className="stat-row"><span className="stat-icon"><Icon name="plus" /></span><span>Games organized</span><strong>{activitiesLoading ? '—' : activitiesCreated}</strong></div>
        </section>
      </div>

      <section className="profile-panel account-panel"><div className="panel-heading"><h2>Account &amp; sign-in</h2></div><p>{isAnonymous ? 'You’re playing as a guest. Link Google to keep this profile and its activity history across devices. Signing in to an existing Google account switches profiles.' : 'Your profile and activity history are connected to your account.'}</p><div className="account-actions">{isAnonymous ? <><button className="find-button" disabled={authBusy || activitiesLoading} onClick={onLinkGoogleAccount}>Link Google Account</button><button className="outline-button" disabled={authBusy || activitiesLoading} onClick={onSignInWithGoogle}>Sign in with Google</button></> : <button className="outline-button" disabled={authBusy} onClick={onSignOut}>Sign out</button>}</div></section>

      <section className="recent-activities">
        <div className="results-title"><div><span className="section-eyebrow">GOOD TIMES, RECENTLY</span><h2>Recent Activities</h2></div><div className="recent-activity-actions"><button className="view-all-button" onClick={() => setCalendarOpen(true)}>See in Calendar</button><button className="view-all-button" onClick={onViewActivities}>See all <span aria-hidden="true">→</span></button></div></div>
        {profileLoading || activitiesLoading ? (
          <div className="notice" role="status">Loading recent activities…</div>
        ) : recentActivities.length > 0 ? (
          <div className="recent-list">
            {recentActivities.map((activity) => (
            <button className="recent-item" key={activity.id} type="button" onClick={() => onOpenActivity(activity)}>
                <span className="recent-icon avatar-lilac" aria-hidden="true">{activity.sport.slice(0, 1)}</span>
                <div><h3>{activity.title}</h3><p>{activity.date} · {activity.location}</p></div>
                <span className="recent-sport">{activity.sport}</span>
            </button>
            ))}
          </div>
        ) : (
          <div className="notice" role="status">You have not created or joined any activities yet.</div>
        )}
      </section>

      {calendarOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setCalendarOpen(false) }}>
          <section ref={calendar} className="modal-card activity-calendar-modal" role="dialog" aria-modal="true" aria-labelledby="activity-calendar-title">
            <button className="modal-close" onClick={() => setCalendarOpen(false)} aria-label="Close activity calendar">×</button>
            <span className="section-eyebrow">YOUR ACTIVITY HISTORY</span>
            <h2 id="activity-calendar-title">Activity Calendar</h2>
            <div className="calendar-month-heading">
              <button className="calendar-month-button" onClick={() => changeCalendarMonth(-1)} aria-label="Previous month">‹</button>
              <h3>{calendarMonthLabel}</h3>
              <button className="calendar-month-button" onClick={() => changeCalendarMonth(1)} aria-label="Next month">›</button>
            </div>
            <div className="activity-calendar-grid" role="group" aria-label={`${calendarMonthLabel} calendar`}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <span className="calendar-weekday" key={day}>{day}</span>
              ))}
              {Array.from({ length: firstWeekday }, (_, index) => (
                <span className="calendar-empty-day" key={`empty-${index}`} />
              ))}
              {calendarDays.map((day) => {
                const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day)
                const dateKey = getDateKey(date)
                const count = calendarActivities.filter((item) => item.dateKey === dateKey).length
                return (
                  <button
                    className={`calendar-day${count ? ' calendar-day-has-activities' : ''}${selectedCalendarDay === dateKey ? ' calendar-day-selected' : ''}`}
                    type="button"
                    aria-label={`${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}${count ? `, ${count} ${count === 1 ? 'activity' : 'activities'}` : ''}`}
                    aria-pressed={selectedCalendarDay === dateKey}
                    key={dateKey}
                    onClick={() => setSelectedCalendarDay(dateKey)}
                  >
                    {day}
                    {count > 0 && <span className="calendar-activity-dot" aria-hidden="true" />}
                  </button>
                )
              })}
            </div>
            <div className="calendar-day-activities" aria-live="polite">
              <h3>{selectedCalendarDay ? new Date(`${selectedCalendarDay}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : 'Select a day'}</h3>
              {selectedDayActivities.length ? (
                <ul>
                  {selectedDayActivities.map(({ activity }) => <li key={activity.id}>{activity.title}<span>{activity.time} · {activity.location}</span></li>)}
                </ul>
              ) : (
                <p>{selectedCalendarDay ? 'No activities on this day.' : 'Choose a day to see its activities.'}</p>
              )}
            </div>
          </section>
        </div>
      )}

      {editing && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (!saving && event.target === event.currentTarget) setEditing(false) }}>
          <section ref={editor} className="modal-card edit-profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-edit-title">
            <button className="modal-close" onClick={() => setEditing(false)} disabled={saving} aria-label="Close edit profile">×</button>
            <span className="section-eyebrow">MAKE IT YOURS</span>
            <h2 id="profile-edit-title">{manageAvailability ? 'Manage Availability' : 'Edit Profile'}</h2>
            <form className="create-form" onSubmit={save}>
              {!manageAvailability && <>
                <label className="wide-field">Name<input required maxLength={DISPLAY_NAME_MAX_LENGTH} value={draft.displayName} onChange={(event) => setDraft({ ...draft, displayName: event.target.value })} /></label>
                <label className="wide-field">Sports<input value={draft.sports} onChange={(event) => setDraft({ ...draft, sports: event.target.value })} /></label>
                <label className="wide-field">Skill levels<input value={draft.skills} onChange={(event) => setDraft({ ...draft, skills: event.target.value })} /></label>
              </>}
              <label className="wide-field">Availability<input value={draft.availability} onChange={(event) => setDraft({ ...draft, availability: event.target.value })} placeholder="e.g. Weekdays after 4 PM" /></label>
              <label className="wide-field">Preferred distance<select value={draft.distance} onChange={(event) => setDraft({ ...draft, distance: event.target.value })}><option value="" disabled>Choose a distance</option><option>Within 0.5 miles</option><option>Within 1 mile</option><option>Within 2 miles</option><option>Any distance</option></select></label>
              {(profileError || saveError) && <p className="form-error wide-field" role="alert">{profileError || saveError}</p>}
              <div className="form-actions wide-field"><button className="outline-button" type="button" onClick={() => setEditing(false)} disabled={saving}>Cancel</button><button className="find-button" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button></div>
            </form>
          </section>
        </div>
      )}
    </section>
  )
}

function getDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getActivityDate(activity: Activity) {
  const start = getActivityStartAt(activity)
  if (start) return start
  if (activity.dateISO && /^\d{4}-\d{2}-\d{2}$/.test(activity.dateISO)) {
    const [year, month, day] = activity.dateISO.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    if (getDateKey(date) === activity.dateISO) return date
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const label = activity.date.trim()
  if (label === 'Today') return today
  if (label === 'Tomorrow') {
    today.setDate(today.getDate() + 1)
    return today
  }

  const weekdayIndex = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(label)
  if (weekdayIndex >= 0) {
    const daysAhead = (weekdayIndex - today.getDay() + 7) % 7
    today.setDate(today.getDate() + daysAhead)
    return today
  }

  const dayMonth = label.match(/(?:\w+,\s*)?([A-Za-z]{3,})\s+(\d{1,2})/)
  if (dayMonth) {
    const parsedDate = new Date(`${dayMonth[1]} ${dayMonth[2]}, ${today.getFullYear()} 12:00:00`)
    const parsedMonth = new Date(`${dayMonth[1]} 1, ${today.getFullYear()} 12:00:00`)
    if (
      !Number.isNaN(parsedDate.getTime()) &&
      parsedDate.getMonth() === parsedMonth.getMonth() &&
      parsedDate.getDate() === Number(dayMonth[2])
    ) {
      return parsedDate
    }
  }

  return null
}
