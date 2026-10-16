import { useEffect, useState } from 'react'
import ActivityModal from './components/ActivityModal'
import CreateActivityModal from './components/CreateActivityModal'
import Navbar from './components/Navbar'
import SearchBar from './components/SearchBar'
import { initialActivities } from './data/activities'
import { initialUserProfile } from './data/profile'
import ActivitiesPage from './pages/ActivitiesPage'
import FindPartnersPage from './pages/FindPartnersPage'
import HomePage from './pages/HomePage'
import ProfilePage from './pages/ProfilePage'
import type { Activity, Partner, Route, Sport, UserProfile } from './types'
import './App.css'

function getRoute(pathname: string): Route {
  if (pathname === '/partners' || pathname === '/activities' || pathname === '/profile') {
    return pathname
  }
  return '/'
}

function App() {
  const [route, setRoute] = useState<Route>(() => getRoute(window.location.pathname))
  const [activities, setActivities] = useState(initialActivities)
  const [joinedIds, setJoinedIds] = useState<string[]>([])
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [createActivityOpen, setCreateActivityOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [homeSport, setHomeSport] = useState<'All' | Sport>('All')
  const [notice, setNotice] = useState('')
  const [profile, setProfile] = useState<UserProfile>(initialUserProfile)

  useEffect(() => {
    function handlePopState() {
      setRoute(getRoute(window.location.pathname))
      setNotice('')
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  function navigate(path: Route) {
    if (window.location.pathname !== path) window.history.pushState({}, '', path)
    setRoute(path)
    setNotice('')
    setSelectedActivity(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function joinActivity(activity: Activity) {
    const current = activities.find((item) => item.id === activity.id) ?? activity
    if (joinedIds.includes(current.id) || current.players >= current.capacity) return
    const updated: Activity = {
      ...current,
      players: current.players + 1,
      participants: [...current.participants, 'Alex'],
    }
    setActivities((items) => items.map((item) => item.id === updated.id ? updated : item))
    setJoinedIds((items) => [...items, updated.id])
    setSelectedActivity(updated)
  }

  function createActivity(activity: Activity) {
    setActivities((items) => [activity, ...items])
    setJoinedIds((items) => [...items, activity.id])
    setHomeSport('All')
    setSearchQuery('')
    setCreateActivityOpen(false)
  }

  function invitePartner(partner: Partner) {
    setNotice(`Invite sent to ${partner.name}!`)
  }

  function viewPartnerProfile(partner: Partner) {
    setNotice(`Viewing ${partner.name}'s profile.`)
  }

  return (
    <main className="app-shell">
      <Navbar route={route} navigate={navigate} />
      {route === '/' && (
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
        />
      )}

      {notice && (
        <div className="notice" role="status">
          <span>{notice}</span>
          <button onClick={() => setNotice('')} aria-label="Dismiss message">×</button>
        </div>
      )}

      {route === '/' && (
        <HomePage
          activities={activities}
          joinedIds={joinedIds}
          query={searchQuery}
          setQuery={setSearchQuery}
          sport={homeSport}
          setSport={setHomeSport}
          onOpenActivity={setSelectedActivity}
          onCreateActivity={() => setCreateActivityOpen(true)}
          navigate={navigate}
        />
      )}
      {route === '/partners' && (
        <FindPartnersPage onInvite={invitePartner} onViewProfile={viewPartnerProfile} />
      )}
      {route === '/activities' && (
        <ActivitiesPage
          activities={activities}
          joinedIds={joinedIds}
          onOpenActivity={setSelectedActivity}
          onCreate={createActivity}
        />
      )}
      {route === '/profile' && (
        <ProfilePage
          profile={profile}
          onSave={setProfile}
          onViewActivities={() => navigate('/activities')}
        />
      )}

      <footer className="page-footer">
        <button className="footer-brand" onClick={() => navigate('/')}>SportBuddy</button>
        <span>Good games start with good company.</span>
        <span>Made for campus life <span className="footer-heart">♥</span></span>
      </footer>

      {selectedActivity && (
        <ActivityModal
          activity={selectedActivity}
          joined={joinedIds.includes(selectedActivity.id)}
          onClose={() => setSelectedActivity(null)}
          onJoin={() => joinActivity(selectedActivity)}
        />
      )}
      {createActivityOpen && (
        <CreateActivityModal
          onClose={() => setCreateActivityOpen(false)}
          onCreate={createActivity}
        />
      )}
    </main>
  )
}

export default App
