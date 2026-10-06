# PowPow Trips

A travel planner app for Android, iOS and web, built with Expo (React Native + TypeScript).

## Features

- **Trips**: create trips with destination, dates, budget, currency and travellers; upcoming, ongoing and past lists; edit, duplicate, delete and share as text.
- **Places**: search real places (OpenStreetMap) or add custom ones; categories, notes, time and a "visited" tick; open any place in Google Maps.
- **Itinerary**: day-by-day plan; move places between days and reorder them; approximate distance per day; open the day's route in Google Maps.
- **Map**: every place on a map, filtered by day, with the day's route drawn (Android and iOS).
- **Budget**: log expenses by category; budget progress bar; split costs between travellers and see who owes whom.
- **Checklist**: packing and to-do list with a starter set of items.
- **Explore**: destination ideas with best season and ideal length; one tap to start planning.
- **Profile**: your name, default currency, backup export and import, and delete all data.

All data is stored on the device (AsyncStorage). Use **Profile → Export backup** to keep a copy.

## Run it

```bash
cd powpow-trips
npm install
npx expo start          # press w for web
```

The map uses `react-native-maps`, so on a phone you need a development build instead of Expo Go:

```bash
npx expo run:android
```

## Build an APK

```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview      # gives a downloadable .apk
eas build -p android --profile production   # .aab for the Play Store
```

For map tiles on Android, create a Google Maps SDK for Android key and set it as an EAS
environment variable named `GOOGLE_MAPS_API_KEY` (read by `app.config.ts`).

## Project layout

```
src/app/            screens (Expo Router: every file is a route)
  (tabs)/           Trips, Explore and Profile tabs
  trip/             new trip, trip detail, edit trip
  place/            add place (search), place detail
  expense/          add/edit expense
src/features/trip/  trip detail tabs: overview, itinerary, map, budget, checklist
src/components/     shared UI (buttons, fields, chips, cards, date field)
src/store/          app state (reducer) and on-device persistence
src/lib/            dates, money/split logic, place search, sharing
assets/images/      PowPow Trips logo, app icon and splash screen
```

## Checks

```bash
npx tsc --noEmit
npx expo lint
```
