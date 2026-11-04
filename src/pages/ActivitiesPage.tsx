import { useMemo, useState } from 'react'
import ActivityCard from '../components/ActivityCard'
import CreateActivityModal from '../components/CreateActivityModal'
import SearchBar from '../components/SearchBar'
import SportFilters from '../components/SportFilters'
import type { Activity, Sport } from '../types'
import {
  getActivityStartAt,
  getActivityStatus,
  getActivityTimestampRange,
  type ActivityStatus,
} from '../utils/activityStatus'

type SkillFilter = 'Any Level' | 'All Levels' | 'Beginner' | 'Intermediate' | 'Advanced'

function getLocalDateStart(value: string): Date | null {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null

  const [, yearText, monthText, dayText] = match
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)
  const date = new Date(year, month - 1, day)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }
  return date
}

type ActivitiesPageProps = {
  activities: Activity[]
  joinedIds: string[]
  now: number
  query: string
  setQuery: (query: string) => void
  organizerName: string
  profileReady: boolean
  onOpenActivity: (activity: Activity) => void
  onCreate: (activity: Activity) => void
}

export default function ActivitiesPage({
  activities,
  joinedIds,
  now,
  query,
  setQuery,
  organizerName,
  profileReady,
  onOpenActivity,
  onCreate,
}: ActivitiesPageProps) {
  const [tab, setTab] = useState<'join' | 'yours'>('join')
  const [sport, setSport] = useState<'All' | Sport>('All')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [skill, setSkill] = useState<SkillFilter>('Any Level')
  const [status, setStatus] = useState<'All Statuses' | Exclude<ActivityStatus, 'unavailable'>>('All Statuses')
  const [availableSpotsOnly, setAvailableSpotsOnly] = useState(false)
  const [creating, setCreating] = useState(false)
  const selectedStartDate = startDate ? getLocalDateStart(startDate) : null
  const selectedEndDate = endDate ? getLocalDateStart(endDate) : null
  const selectedStartTime = selectedStartDate?.getTime() ?? null
  const selectedEndExclusive = selectedEndDate
    ? new Date(selectedEndDate.getFullYear(), selectedEndDate.getMonth(), selectedEndDate.getDate() + 1).getTime()
    : null
  const invalidDateRange = Boolean(
    (startDate && !selectedStartDate) ||
    (endDate && !selectedEndDate) ||
    (selectedStartDate && selectedEndDate && selectedEndDate < selectedStartDate)
  )

  const filtered = useMemo(() => {
    if (invalidDateRange) return []

    const search = query.trim().toLowerCase()

    return activities
      .filter((activity) => {
        if (tab === 'yours' && !joinedIds.includes(activity.id)) return false
        if (sport !== 'All' && activity.sport !== sport) return false

        const activityStatus = getActivityStatus(activity, now)
        if (status !== 'All Statuses' && activityStatus !== status.toLowerCase()) return false

        if (skill !== 'Any Level') {
          const activitySkill = typeof activity.skill === 'string'
            ? activity.skill.trim().toLowerCase()
            : ''
          if (skill === 'All Levels') {
            if (activitySkill !== 'all levels') return false
          } else if (activitySkill !== 'all levels' && activitySkill !== skill.toLowerCase()) {
            if (!(skill === 'Beginner' && activitySkill === 'beginner friendly')) return false
          }
        }

        if (selectedStartTime !== null || selectedEndExclusive !== null) {
          const activityStartAt = getActivityStartAt(activity)
          if (!activityStartAt) return false
          const activityStartTime = activityStartAt.getTime()
          if (selectedStartTime !== null && activityStartTime < selectedStartTime) {
            return false
          }
          if (selectedEndExclusive !== null && activityStartTime >= selectedEndExclusive) {
            return false
          }
        }

        if (availableSpotsOnly) {
          if (!(activity.players < activity.capacity)) return false
          if (joinedIds.includes(activity.id)) return false
          if (activityStatus !== 'upcoming' && activityStatus !== 'ongoing') return false
        }

        const searchText = `${activity.title} ${activity.sport} ${activity.location}`.toLowerCase()
        return searchText.includes(search)
      })
      .sort((first, second) => {
        const firstStatus = getActivityStatus(first, now)
        const secondStatus = getActivityStatus(second, now)
        const rank: Record<ActivityStatus, number> = {
          upcoming: 0,
          ongoing: 1,
          ended: 2,
          unavailable: 3,
        }
        const statusDifference = rank[firstStatus] - rank[secondStatus]
        if (statusDifference !== 0) return statusDifference

        const firstRange = getActivityTimestampRange(first)
        const secondRange = getActivityTimestampRange(second)
        if (!firstRange || !secondRange) {
          if (firstRange) return -1
          if (secondRange) return 1
          return 0
        }
        if (firstStatus === 'ongoing') return firstRange[1].getTime() - secondRange[1].getTime()
        if (firstStatus === 'ended') return secondRange[1].getTime() - firstRange[1].getTime()
        return firstRange[0].getTime() - secondRange[0].getTime()
      })
  }, [activities, availableSpotsOnly, invalidDateRange, joinedIds, now, query, selectedEndExclusive, selectedStartTime, skill, sport, status, tab])

  function resetFilters() {
    setSport('All')
    setStartDate('')
    setEndDate('')
    setSkill('Any Level')
    setStatus('All Statuses')
    setAvailableSpotsOnly(false)
    setQuery('')
  }

  function createActivity(activity: Activity) {
    onCreate(activity)
    setCreating(false)
    setTab('yours')
  }

  return (
    <section className="inner-page activities-page">
      <div className="activities-page-heading">
        <div className="page-heading">
          <span className="section-eyebrow">FIND YOUR NEXT GAME</span>
          <h1>Explore Activities</h1>
          <p>Discover games and get moving with your campus community.</p>
        </div>
        <button className="create-activity-button" onClick={() => setCreating(true)} disabled={!profileReady}>＋ Create Activity</button>
      </div>

      <SearchBar value={query} onChange={setQuery} placeholder="Search activities or locations..." />

      <div className="activity-tabs" role="tablist" aria-label="Activity list">
        <button role="tab" aria-selected={tab === 'join'} className={tab === 'join' ? 'activity-tab tab-selected' : 'activity-tab'} onClick={() => setTab('join')}>Join Activities</button>
        <button role="tab" aria-selected={tab === 'yours'} className={tab === 'yours' ? 'activity-tab tab-selected' : 'activity-tab'} onClick={() => setTab('yours')}>Your Activities <span>{joinedIds.length}</span></button>
      </div>

      <SportFilters selected={sport} onSelect={setSport} />
      <div className="activity-filter-panel" role="group" aria-label="Filter activities">
        <label>Skill Level
          <select value={skill} onChange={(event) => setSkill(event.target.value as SkillFilter)}>
            <option>Any Level</option><option>All Levels</option><option>Beginner</option><option>Intermediate</option><option>Advanced</option>
          </select>
        </label>
        <label>Activity Status
          <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
            <option>All Statuses</option><option value="upcoming">Upcoming</option><option value="ongoing">Ongoing</option><option value="ended">Ended</option>
          </select>
        </label>
        <label>Start Date
          <input
            type="date"
            value={startDate}
            aria-invalid={invalidDateRange}
            aria-describedby={invalidDateRange ? 'activity-date-range-error' : undefined}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </label>
        <label>End Date
          <input
            type="date"
            value={endDate}
            aria-invalid={invalidDateRange}
            aria-describedby={invalidDateRange ? 'activity-date-range-error' : undefined}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </label>
        <label className="available-spots-filter">
          <input type="checkbox" checked={availableSpotsOnly} onChange={(event) => setAvailableSpotsOnly(event.target.checked)} />
          <span>Available spots only</span>
        </label>
        <button className="reset-activity-filters" type="button" onClick={resetFilters}>Reset Filters</button>
      </div>
      {invalidDateRange && (
        <p id="activity-date-range-error" className="date-range-error" role="alert">
          End Date must be the same as or later than Start Date.
        </p>
      )}

      <p className="activity-results-count" role="status" aria-live="polite">
        {filtered.length} {filtered.length === 1 ? 'activity' : 'activities'} found
      </p>
      {filtered.length ? (
        <div className="activity-grid">
          {filtered.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              joined={joinedIds.includes(activity.id)}
              now={now}
              onOpen={onOpenActivity}
            />
          ))}
        </div>
      ) : (
        <div className="empty-activities">
          <span aria-hidden="true">✦</span>
          <h3>{tab === 'yours' && joinedIds.length === 0 ? 'No activities yet' : 'No activities match your filters'}</h3>
          <p>{tab === 'yours' && joinedIds.length === 0 ? 'Join a game or create a new activity to see it here.' : 'Try changing or resetting your filters to see more activities.'}</p>
          {tab === 'yours' && <button onClick={() => setTab('join')}>Browse activities</button>}
          <button onClick={resetFilters}>Reset Filters</button>
        </div>
      )}

      {creating && <CreateActivityModal organizerName={organizerName} onClose={() => setCreating(false)} onCreate={createActivity} />}
    </section>
  )
}
