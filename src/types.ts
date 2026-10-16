export type Sport =
  | 'Tennis'
  | 'Basketball'
  | 'Badminton'
  | 'Soccer'
  | 'Running'
  | 'Volleyball'
  | 'Pickleball'
  | 'Table Tennis'
  | 'Swimming'
  | 'Gym'
  | 'Gym / Workout'
  | 'Cycling'
  | 'Ultimate Frisbee'
  | 'Flag Football'
  | 'Baseball'
  | 'Softball'
  | 'Golf'
  | 'Racquetball'
  | 'Squash'
  | 'Yoga'
  | 'Climbing'

export type Activity = {
  id: string
  sport: Sport
  contact: {
    method: 'Phone' | 'Email'
    value: string
  }
  title: string
  date: string
  time: string
  location: string
  skill: string
  players: number
  capacity: number
  distance: string
  organizer: string
  participants: string[]
  description: string
}

export type Partner = {
  id: string
  name: string
  sport: Sport
  skill: string
  distance: number
  availability: string
  initials: string
  color: string
}

export type Route =
  | '/'
  | '/partners'
  | '/activities'
  | '/profile'

export type UserProfile = {
  name: string
  headline: string
  sports: string
  skills: string
  availability: string
  distance: string
}
