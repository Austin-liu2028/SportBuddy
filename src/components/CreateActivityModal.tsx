import { useState } from 'react'
import { sportOptions } from '../data/activities'
import type { Activity, Sport } from '../types'

type CreateActivityModalProps = {
  onClose: () => void
  onCreate: (activity: Activity) => void
}

export default function CreateActivityModal({ onClose, onCreate }: CreateActivityModalProps) {
  const [name, setName] = useState('')
  const [sport, setSport] = useState<Sport | ''>('')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [location, setLocation] = useState('')
  const [skill, setSkill] = useState('All levels')
  const [capacity, setCapacity] = useState(4)
  const [description, setDescription] = useState('')
  const [contactMethod, setContactMethod] = useState<'Phone' | 'Email'>('Phone')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!sport || !startTime || !endTime) return
    if (endTime <= startTime) {
      const endTimeInput = event.currentTarget.querySelector<HTMLInputElement>('[name="endTime"]')
      endTimeInput?.setCustomValidity('End time must be later than start time.')
      endTimeInput?.reportValidity()
      return
    }
    const parsedDate = date ? new Date(`${date}T12:00:00`) : null
    const dateLabel = parsedDate
      ? parsedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
      : 'Date TBD'
    const formatTime = (value: string) => {
      const [hours = 0, minutes = 0] = value.split(':').map(Number)
      return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`
    }
    const activity: Activity = {
      id: `activity-${Date.now()}`,
      sport,
      contact: {
        method: contactMethod,
        value: contactMethod === 'Phone' ? phone.trim() : email.trim(),
      },
      title: name.trim(),
      date: dateLabel,
      time: `${formatTime(startTime)}–${formatTime(endTime)}`,
      location: location.trim(),
      skill,
      players: 1,
      capacity,
      distance: 'Nearby',
      organizer: 'Alex Chen',
      participants: ['Alex'],
      description: description.trim() || 'A new campus activity. Join us for a game!',
    }
    onCreate(activity)
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section className="modal-card create-modal" role="dialog" aria-modal="true" aria-labelledby="create-modal-title">
        <button className="modal-close" onClick={onClose} aria-label="Close create activity form">×</button>
        <span className="section-eyebrow">BRING PEOPLE TOGETHER</span>
        <h2 id="create-modal-title">Create an activity</h2>
        <p className="modal-organizer">Set up a game and invite the campus community.</p>
        <form className="create-form" onSubmit={submit}>
          <label className="wide-field">Activity name<input required maxLength={60} value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Sunday soccer" /></label>
          <label>Sport<select required value={sport} onChange={(event) => setSport(event.target.value as Sport | '')}><option value="" disabled>Select a sport</option>{sportOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          <label>Date<input required type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
          <label>Start time<input required type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} /></label>
          <label>End time<input required type="time" name="endTime" min={startTime || undefined} value={endTime} onChange={(event) => { event.currentTarget.setCustomValidity(''); setEndTime(event.target.value) }} /></label>
          <label>Maximum players<input required type="number" min="2" max="50" value={capacity} onChange={(event) => setCapacity(Number(event.target.value))} /></label>
          <label className="wide-field">Location<input required maxLength={80} value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Where are you meeting?" /></label>
          <label>Skill level<select value={skill} onChange={(event) => setSkill(event.target.value)}><option>All levels</option><option>Beginner friendly</option><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label>
          <label>Contact method<select required value={contactMethod} onChange={(event) => setContactMethod(event.target.value as 'Phone' | 'Email')}><option>Phone</option><option>Email</option></select></label>
          {contactMethod === 'Phone' ? (
            <label className="wide-field">Phone number<input required type="tel" autoComplete="tel" maxLength={25} value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="(555) 555-0123" /></label>
          ) : (
            <label className="wide-field">Email<input required type="email" autoComplete="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@northwestern.edu" /></label>
          )}
          <label className="wide-field">Description<textarea rows={3} maxLength={250} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Share a few details about your activity..." /></label>
          <button className="find-button wide-field" type="submit">Create Activity</button>
        </form>
      </section>
    </div>
  )
}
