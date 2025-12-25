# iOS native setup (Capacitor)

This repo includes an iOS wrapper under `ios/` using Capacitor.

## Prereqs

- Xcode installed
- An Apple ID added to Xcode (Xcode → Settings → Accounts)

## Build / run

1. Build the web assets

- `npm run build`

1. Sync Capacitor

- `npx cap sync ios`

1. Open the Xcode project

- Open `ios/App/App.xcodeproj`

1. Fix signing (required for device builds)

In Xcode:

- Select the `App` target
- Go to **Signing & Capabilities**
- Check **Automatically manage signing**
- Select a **Team** (your Personal Team or an org team)

If you see **“Signing for 'App' requires a development team”**, it means Xcode doesn’t have a Team selected for this project yet.

### Notes

- The bundle id is currently `com.yancmo.crumb`.
  - If you don’t control that identifier on your team, change it in **Signing & Capabilities**.

## Live Activities / Dynamic Island status

We *temporarily removed* the third-party `capacitor-live-activities` plugin.

Reason: it currently depends on Capacitor 7’s iOS SPM package (`capacitor-swift-pm` 7.x), while this app uses Capacitor 8 (`capacitor-swift-pm` 8.x). Mixing those breaks Swift Package resolution in Xcode and surfaces as:

- “Missing package product `CapApp-SPM`”

The JS helpers in `src/utils/liveActivities.ts` are currently a no-op so the iOS build is unblocked and native **local notifications** can work reliably.

### Next step (when we want the “cool”)

Implement Live Activities the “Apple way”:

- Add an **ActivityKit** widget extension target in Xcode
- Add required entitlements (Live Activities, App Groups if needed)
- Add a small native bridge (Capacitor plugin or direct native code) that can start/update/end the activity

