# Responsive UI validation

The redesign keeps the React/Vite application, pathname-based routing, Google and anonymous authentication, Firestore collections, and activity transaction schema. No runtime dependencies were added. The changes have not been deployed.

The shared CSS defines neutral surfaces, green accents, consistent controls, and responsive grids. The header uses normal navigation links with a hamburger dropdown on smaller screens and an account dropdown for authentication actions. Home prioritizes search, sport/date filters, and games. Activity cards show the sport, schedule, location, skill, occupancy, availability, and a clear action. Find Partners now derives organizers from actual activities rather than displaying the previous hardcoded people or simulated invitations.

Creation retains the required guest organizer name, contact controls, capacity limits, schedule validation, and existing atomic activity/profile save. Forms remain open after failed saves. Dialogs lock background scrolling, trap keyboard focus, close with Escape when idle, and return focus to the initiating control. Profile keeps its activity calendar and groups preferences, account controls, and real activity history.

## Main files

| Files | Change |
| --- | --- |
| `src/index.css`, `src/App.css`, `public/favicon.svg` | Shared design tokens, responsive layouts, controls, focus styles, and branding. |
| `src/components/Navbar.tsx` | Sticky responsive header, hamburger navigation, account menu, create action, and skip link. |
| `src/pages/HomePage.tsx`, `src/pages/ActivitiesPage.tsx` | Discovery hierarchy, immediate search, combined filters, sorting, and loading/empty states. |
| `src/components/ActivityCard.tsx`, `src/components/ActivityModal.tsx` | Compact game information, availability states, accessible detail dialogs, and participant-name privacy fix. |
| `src/components/CreateActivityModal.tsx`, `src/pages/ProfilePage.tsx` | Mobile forms, grouped information, account actions, and accessible profile/calendar dialogs. |
| `src/pages/FindPartnersPage.tsx`, `src/components/PartnerCard.tsx`, `src/utils/partners.ts` | Real organizers and their games, replacing simulated discovery/invitations. |
| `src/components/DateFilters.tsx`, `Icon.tsx`, `EmptyState.tsx`, `SearchBar.tsx` | Shared discovery controls, SVG icons, search reset, skeletons, and empty states. |
| `src/hooks/useDialog.ts`, `src/utils/activityDiscovery.ts`, `src/utils/firebaseErrors.ts`, `src/App.tsx` | Focus/scroll handling, date/search/sort helpers, Firebase diagnostics, inline failures, and current activity snapshots. |
| `tests/activityDiscovery.test.ts`, `tests/firebaseErrors.test.ts`, `tests/partners.test.ts` | Search/date/sorting, permission-message, and real-organizer regression coverage. |

## Checks

| Check | Result |
| --- | --- |
| `npm test` | 23 tests passed: search, date boundaries, chronological sorting, organizer aggregation, user-facing Firebase errors, participant names, and guest-name validation. |
| Firestore emulator regression | 13 tests passed for the separately prepared membership rule fix; see [membership permission fix](FIRESTORE_MEMBERSHIP_FIX.md). Production deployment is pending. |
| `npm run build` | TypeScript and Vite production build passed. Vite retains its existing large bundle advisory. |
| `npm run lint` | No errors. Two existing `set-state-in-effect` warnings remain in the profile/activity subscription effects in `App.tsx`. |
| Chromium: 320, 375, 430, 768, 1024, 1440px | Home, Activities, expanded filters, Find Partners, Profile, profile editor, calendar, creation, activity details, and organizer-game dialogs fit without document overflow. All form controls checked use at least 16px input text. No runtime errors. |
| Keyboard and navigation | Hamburger Escape/outside dismissal, focus restoration, dialog focus trapping including Tab wrapping, nested dialog transitions, and scroll locking passed. |
| Discovery interactions | Combined sport/date filters, search reset, unmatched search results, and empty own-game history passed. |
| Creation validation | Invalid end time and default “Player” name rejected. An isolated failing save retained the form, preserved the chosen organizer name, displayed an error, and enabled retry. |
| Live reads | Fresh anonymous sessions successfully fetched existing activities. No games were created, joined, left, or deleted during browser QA. Normal guest authentication and profile initialization ran. |

Browser scripts and screenshots were generated under `/private/tmp/sportbuddy-redesign-qa`. They use the already available local Playwright installation; Playwright was not added as a project dependency. Test fixtures used for a failing save were isolated from application data, and the temporary harness was removed.

## Firebase investigation

A read-only probe against the configured Firebase project confirmed that an anonymous session can list `activities` and get `users/{ownUid}`, while getting `users/{otherUid}` returns `permission-denied`. The previous activity dialog attempted the latter when saved participant names were incomplete. This is a confirmed source of permission errors, even with a valid authenticated guest session.

The activity dialog now uses names saved on the activity and the current account profile; it does not request other members’ private user documents. Legacy games with incomplete names show the number of additional participants and an honest availability note. Find Partners also uses only activity data. No production Firestore rules or permissions were changed. Other read/write failures preserve the original developer error and show recovery instructions in the interface, including inside open forms and dialogs.

A subsequent inspection of the deployed rules confirmed another failure: the membership field whitelist rejects the `participants` display-name snapshot that the client sends on join/leave. A local rule fix and emulator regression suite are ready, with production deployment pending. See [membership permission fix](FIRESTORE_MEMBERSHIP_FIX.md).

## Limits

- Partner discovery lists organizers found in posted games, not all accounts. Preferred sports, personal skill, and availability are not inferred from private profiles. Older saved organizer names can remain “Player.”
- Cancellation is not represented in the existing model, so no cancellation workflow or synthetic cancellation state was added.
- Google popup sign-in, live activity writes, concurrent joins, and physical iOS/Android devices were not retested. Browser checks used headless Chromium with real activity reads; the failing-save check used an isolated callback.
- Deployed Firestore rules have now been retrieved and used as the baseline for the pending local fix in `firestore.rules`. Production rules remain unchanged until deployment approval.
