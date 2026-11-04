
# SportBuddy

SportBuddy is a web application that helps students find sports partners, discover activities, and connect with people who share similar interests.

## Features

- Discover and join sports activities
- Create and manage activities
- Filter activities by sport, skill level, date, and availability
- Google and anonymous authentication
- User profiles and activity history
- Responsive web interface

## Tech Stack

- React
- TypeScript
- Vite
- Firebase Authentication
- Cloud Firestore
- Firebase Hosting

## Getting Started

### Install dependencies

```bash
npm install
```

### Start the development server

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

## Build

```bash
npm run build
```

Run `npm test` for the unit tests and `npm run lint` for lint checks. See [responsive UI validation](docs/UI_REDESIGN.md) for browser coverage, Firebase findings, and remaining limits.

The [membership permission fix](docs/FIRESTORE_MEMBERSHIP_FIX.md) documents the join/leave rules mismatch and how to run its local emulator tests. Its production rules deployment is pending.

See [member profiles](docs/MEMBER_PROFILES.md) for clickable organizer photos, public profile fields, privacy rules, and deployment requirements.

## Deployment

```bash
firebase deploy --only hosting
```

## Live Website

https://sportbuddy-e56c7.web.app/
