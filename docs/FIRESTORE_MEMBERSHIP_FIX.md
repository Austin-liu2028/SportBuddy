# Membership permission fix

Status: the fix is present in production. A read-only check on November 4, 2026 confirmed the deployed policy includes the tested membership rules.

The deployed `activities/{activityId}` update rule allows changes only to `participantUids` and `players`. The app's join/leave transaction also changes `participants`, which stores display-name snapshots. That extra changed field causes `permission-denied` even when the caller is authenticated with Google. The rule checks authentication, not whether the provider is Google.

The deployed source was retrieved read-only on November 4, 2026. The original remains at `/private/tmp/sportbuddy-deployed-firestore.rules`. The local `firestore.rules` retains that source and adds narrowly validated participant-name updates:

- Joining may append only the caller's name from their own saved user profile. Existing names must remain unchanged.
- Leaving may remove only one occurrence of the caller's current saved display name. Other names must remain unchanged.
- Older clients that update only UID membership and count remain supported.
- The original UID, capacity, timing, organizer, duplicate-membership, and private-profile checks remain in place.

The frontend no longer interprets a generic permission denial as a need to sign in with Google. Profile/organizer name inputs now respect the deployed profile rule's 60-character limit; the previous 80-character UI limit could also cause an atomic profile/activity save to be rejected.

`firebase.json` references the local rules file. The deployed policy includes the membership fix; no game records are changed by deploying these rules.

Validation:

- `npm test`: 23 tests passed.
- `npm run build`: TypeScript/Vite build passed.
- `npm run lint`: no errors; two pre-existing effect warnings remain.
- Firestore emulator: 13 tests passed. The suite reproduces the original denial for Google and anonymous identities, then verifies valid joins/leaves, same-name members, legacy clients, rejected spoofing/name tampering, capacity, ended games, owner retention, private profiles, and concurrent last-slot joins.

Reproduce the rules checks with the Firebase CLI installed:

```sh
firebase emulators:exec --project demo-sportbuddy-rules --only firestore "npm run test:rules"
```

To redeploy only the rules after approval:

```sh
firebase deploy --only firestore:rules --project sportbuddy-e56c7
```

This does not publish the pending UI redesign. Old games with incomplete saved names cannot recover other members' private profiles, and a missing legacy name snapshot is not repaired by the rules deployment.
