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
  activitiesForCalendar: Activity[]
  onOpenActivity: (activity: Activity) => void
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
  activitiesForCalendar,
  onOpenActivity,
  isAnonymous,
  isGoogleLinked,
  onSave,
  onViewActivities,
}: ProfilePageProps) {
  const [editing, setEditing] = useState(false)
  const [manageAvailability, setManageAvailability] = useState(false)
  const [draft, setDraft] = useState(profile)
  const [saveError, setSaveError] = useState('')
  const [calendarOpen, setCalendarOpen] = useState(false)
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
          <section className="modal-card activity-calendar-modal" role="dialog" aria-modal="true" aria-labelledby="activity-calendar-title">
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

function getDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getActivityDate(activity: Activity) {
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
