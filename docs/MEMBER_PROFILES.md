# Clickable organizer photos and member profiles

Activity cards show an avatar beside the organizer's name. Clicking either opens a member profile with their shared sports, skill levels, availability, and posted games. The same profile is available from game details and Find Partners. Opening a profile does not join a game.

The app takes a signed-in user's Google profile photo from Firebase Authentication's `photoURL`. A small public member record is synchronized after their private profile loads or changes. Google photo URLs are restricted to HTTPS Google image hosts. Guests, missing photos, and failed image loads use initials. Default account names such as “Player” do not overwrite an existing organizer name on an activity.

## Data and access

`users/{uid}` remains private. `memberProfiles/{uid}` contains only:

- `uid`, `displayName`, `photoURL`
- `sports`, `skills`, `availability`
- `updatedAt`

Account email, phone, private distance preferences, provider tokens, and other account fields are not copied. Existing game contact information remains available through each game's details. Public member profiles are readable by signed-in members, including authenticated guests. Only the owner can publish or update their member profile. The rules reject extra fields and private email fields.

Profile synchronization is separate from private account saves. A failed public update shows a retry action on the owner's Profile page without undoing the account save. A failed directory read leaves the activity-backed organizer name and games available. Public previews bound names to 60 characters and each preferences field to 500 characters.

## Main files

- `src/components/MemberAvatar.tsx`: photo rendering and initials/error fallback.
- `src/components/MemberProfileModal.tsx`: accessible member profile and hosted games.
- `src/components/MemberProfilesProvider.tsx`, `src/context/MemberProfilesContext.ts`: directory subscription, owner synchronization, profile selection, and error/retry state.
- `src/utils/memberProfiles.ts`: public-field allowlist, photo validation, initials, and organizer-name fallback.
- `ActivityCard.tsx`, `ActivityModal.tsx`, `PartnerCard.tsx`, `FindPartnersPage.tsx`, `ProfilePage.tsx`, and `App.tsx`: feature integration.
- `firestore.rules`: public member schema and access rules; private user permissions are retained.
- `src/App.css`: compact clickable host rows, avatars, and responsive profile dialog.

## Validation

- `npm test`: 28 tests passed, including public/private field separation, safe photo URLs, initials, and preservation of existing organizer names.
- `npm run build`: TypeScript and production build passed.
- `npm run lint`: no errors; the two existing profile/activity effect warnings remain.
- Firestore emulator: all 20 rules tests passed, including seven new public-profile tests and the existing membership regression suite.
- Chromium with the real provider connected to a local Firestore emulator: cards and member dialogs fit at 320, 375, 430, 768, 1024, and 1440px. Verified photo loading, failed-image fallback, missing public profiles, keyboard focus wrapping/restoration, game/profile transitions, and no accidental joins.
- Emulator/browser integration verified own Google-photo synchronization, absence of private fields in the written document, profile updates, denied-save handling, and recovery with Retry. Photo responses were isolated browser fixtures; no live account/profile records were changed.

The browser report and screenshots are in `/private/tmp/sportbuddy-member-profile-qa`. The temporary browser harness was removed after the checks.

## Deployment

The frontend and the new `memberProfiles` rule must both be deployed to enable shared photos on the live site. This feature has not been deployed by this change. Existing members acquire a public profile when they next visit or sign in with the updated app; a profile photo cannot be recovered for a guest or fictional account that has no Google photo. Existing game documents need no migration.

A read-only comparison confirmed the deployed rules match the committed baseline. The pending rule change adds only the separate public-member collection; existing private-account and game-membership rules are retained.

With deployment approval:

```sh
npm run build
firebase deploy --only firestore:rules,hosting --project sportbuddy-e56c7
```
