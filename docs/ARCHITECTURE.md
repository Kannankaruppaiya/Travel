# Wanderlog Android: end-to-end architecture

This is a detailed map of the Wanderlog Android app in this repo, from the APK files down to the backend and third-party services, followed by the main user flows traced end to end.

There is no source code here, only the four APK files. Everything below is read from what ships inside them:

- **Native libraries** in `split_config.arm64_v8a.apk` (`lib/arm64-v8a/*.so`)
- **Components** declared in `AndroidManifest.xml` (activities, services, receivers, providers)
- **Class names** in `classes*.dex`
- **Strings** in the compiled Hermes bundle `assets/index.android.bundle` (API routes, hook and function names)
- **Config files** in `assets/` (`app.config`, `app.manifest`, `expo-root.pem`)

Every box in the diagrams matches something found in the APK, and each flow ends with the evidence it rests on. The order of steps inside a flow is inferred from those names and from how the libraries normally work, so treat the sequences as a well-supported reading, not a trace of the real code.

## Contents

1. [What ships in each APK](#1-what-ships-in-each-apk)
2. [Component map](#2-component-map)
3. [End-to-end flows](#3-end-to-end-flows)
   - [3.1 App launch and over-the-air updates](#31-app-launch-and-over-the-air-updates)
   - [3.2 Sign-in](#32-sign-in)
   - [3.3 Planning a trip with tripmates (live sync)](#33-planning-a-trip-with-tripmates-live-sync)
   - [3.4 Searching places and showing them on the map](#34-searching-places-and-showing-them-on-the-map)
   - [3.5 Importing a booking by sharing a file](#35-importing-a-booking-by-sharing-a-file)
   - [3.6 AI trip assistant](#36-ai-trip-assistant)
   - [3.7 Hotel search and booking](#37-hotel-search-and-booking)
   - [3.8 Pro subscription and offline access](#38-pro-subscription-and-offline-access)
   - [3.9 Trip tracking and travel journal](#39-trip-tracking-and-travel-journal)
   - [3.10 Push and local notifications](#310-push-and-local-notifications)
   - [3.11 Deep links, analytics and crash reporting](#311-deep-links-analytics-and-crash-reporting)
4. [Backend API surface](#4-backend-api-surface)

## 1. What ships in each APK

The app is published as an Android App Bundle, so a device installs a base APK plus the splits that match it. Install all four together with `adb install-multiple base.apk split_config.*.apk`.

| File | Size | What it holds |
| --- | --- | --- |
| `base.apk` | 130 MB | Manifest, 7 dex files (Java/Kotlin code), the 30 MB Hermes JS bundle, fonts (Source Sans Pro, KaTeX), ML Kit barcode models, Expo update config, resources |
| `split_config.arm64_v8a.apk` | 75 MB | 42 native `.so` libraries for 64-bit ARM: React Native, Hermes, Mapbox, Skia, Reanimated, background location, PDFium, barcode scanning, Bugsnag NDK |
| `split_config.en.apk` | 74 KB | English string resources |
| `split_config.xxhdpi.apk` | 176 KB | Images sized for xxhdpi screens |

App identity, from `assets/app.config`: package `com.wanderlog.android`, Expo SDK 57, runtime version `2.223`, and the same codebase also targets iOS and web.

## 2. Component map

Solid arrows are calls inside the device. Dotted arrows cross the network.

```mermaid
flowchart TD
    user(("Traveler"))
    otherApps["Other apps<br/>Gmail, Files, Photos"]

    subgraph shell["Native shell · base.apk"]
        app["MainApplication<br/>[com.wanderlog.android]"]
        activity["MainActivity<br/>deep links and share intents"]
        shareMod["ShareExtensionModule<br/>[InboundShareIntentStorage]"]
        startup["Startup providers<br/>[Firebase · Bugsnag · ML Kit · androidx.startup]"]
        updates["expo-updates<br/>[app.config · app.manifest · expo-root.pem]"]
    end

    subgraph runtime["React Native runtime · arm64 split"]
        hermes["Hermes VM<br/>[libhermesvm.so]"]
        rn["React Native core, New Architecture<br/>[libreactnative.so · libappmodules.so · libreact_codegen_*.so]"]
        bridges["JSI bridges<br/>[libjsi.so · libNitroModules.so · libexpo-modules-core.so]"]
    end

    subgraph js["JS app · assets/index.android.bundle"]
        nav["Screens and navigation<br/>[react-navigation · rnscreens]"]
        stores["MobX stores<br/>[mobx · immer]"]
        apiClient["REST client<br/>[/api/*]"]
        shareDbClient["ShareDB client<br/>[ReconnectingWebSocket · json0]"]
        chatClient["Assistant chat client<br/>[tripPlanAssistant/ws]"]
        offline[("Offline cache<br/>[AsyncStorage · offline API call cache]")]
        i18n["Localization<br/>[formatjs · moment]"]
    end

    subgraph nativeFeatures["Native feature modules"]
        maps["Maps<br/>[@rnmapbox · react-native-maps]"]
        ui["Graphics and gestures<br/>[Skia · Reanimated · SVG · gesture-handler]"]
        location["Background location<br/>[transistorsoft · expo-location]"]
        media["Media<br/>[image picker · cropper · expo-image · expo-video]"]
        docs["Documents<br/>[PDF viewer · PDFium · ML Kit barcode]"]
        richText["Rich text<br/>[enriched-markdown · RaTeX]"]
        notify["Notifications<br/>[Firebase Messaging · notifee · expo-notifications]"]
        billing["Play Billing<br/>[react-native-iap]"]
        authSdk["Sign-in SDKs<br/>[Google Sign-In · Facebook Login]"]
    end

    subgraph backend["Wanderlog backend"]
        rest["REST API<br/>[wanderlog.com/api]"]
        realtime["Realtime trip sync<br/>[ShareDB server]"]
        assistantSvc["AI trip assistant<br/>[/api/chat/tripPlanAssistant]"]
        otaServer["OTA update server<br/>[expo-open-ota.wanderlog.com]"]
    end

    subgraph thirdParty["Third-party services"]
        google{{"Google<br/>Sign-In · FCM · Analytics · Play"}}
        mapbox{{"Mapbox tiles"}}
        facebook{{"Facebook"}}
        partners{{"Booking partners<br/>Expedia · Kayak"}}
        telemetry{{"Branch · Amplitude · Tenjin<br/>Bugsnag · Smartlook"}}
    end

    user -->|"taps icon or link"| activity
    otherApps -->|"share sheet"| activity
    app -->|"runs first"| startup
    app -->|"loads native libs"| rn
    updates -->|"picks bundle"| hermes
    activity -->|"hosts React root"| rn
    rn --- hermes
    rn --- bridges
    hermes -->|"executes"| nav
    activity -->|"stores shared file"| shareMod
    shareMod -->|"exposes to JS"| nav
    nav --> stores
    stores --> apiClient
    stores --> shareDbClient
    stores --> chatClient
    stores --> offline
    nav --> i18n
    bridges --> maps
    bridges --> ui
    bridges --> location
    bridges --> media
    bridges --> docs
    bridges --> richText
    bridges --> notify
    bridges --> billing
    bridges --> authSdk
    apiClient -.->|"HTTPS"| rest
    shareDbClient -.->|"websocket"| realtime
    chatClient -.->|"websocket"| assistantSvc
    updates -.->|"checks for updates"| otaServer
    rest -.->|"hotel search and booking"| partners
    maps -.-> mapbox
    authSdk -.-> google
    authSdk -.-> facebook
    notify -.-> google
    billing -.-> google
    stores -.-> telemetry

    classDef personStyle fill:#dbeafe,stroke:#2563eb,color:#1e3a8a
    classDef shellStyle fill:#dbeafe,stroke:#2563eb,color:#1e3a8a
    classDef runtimeStyle fill:#e0f2fe,stroke:#0284c7,color:#0c4a6e
    classDef jsStyle fill:#fef3c7,stroke:#d97706,color:#78350f
    classDef nativeStyle fill:#ffe4e6,stroke:#e11d48,color:#881337
    classDef apiStyle fill:#e0e7ff,stroke:#4f46e5,color:#312e81
    classDef extStyle fill:#dcfce7,stroke:#16a34a,color:#14532d

    class user,otherApps personStyle
    class app,activity,shareMod,startup,updates shellStyle
    class hermes,rn,bridges runtimeStyle
    class nav,stores,apiClient,shareDbClient,chatClient,offline,i18n jsStyle
    class maps,ui,location,media,docs,richText,notify,billing,authSdk nativeStyle
    class rest,realtime,assistantSvc,otaServer apiStyle
    class google,mapbox,facebook,partners,telemetry extStyle
```

**How the layers split the work.** The native shell is deliberately thin: the only Wanderlog-specific classes in the dex files are `MainApplication`, `MainActivity`, `ShareExtensionModule` and `InboundShareIntentStorage`. All product logic lives in the JS bundle, which talks to native features through React Native's New Architecture (TurboModules, Fabric, JSI) and Expo modules. That is also why one codebase can serve iOS, Android and web, and why Wanderlog can ship most fixes over the air without a Play Store release.

## 3. End-to-end flows

### 3.1 App launch and over-the-air updates

```mermaid
sequenceDiagram
    actor U as Traveler
    participant OS as Android
    participant App as MainApplication
    participant Upd as expo-updates
    participant H as Hermes VM
    participant UI as JS app
    participant OTA as expo-open-ota.wanderlog.com

    U->>OS: Taps the app icon
    OS->>App: Starts the process
    Note over OS,App: Content providers run first (Firebase, Bugsnag, ML Kit, androidx.startup)
    App->>App: Loads native libraries (React Native, Hermes, app modules)
    App->>Upd: Which JS bundle should run?
    alt A downloaded update is ready
        Upd-->>App: Use the downloaded bundle
    else No update yet
        Upd-->>App: Use the embedded assets/index.android.bundle
    end
    App->>H: Load the bundle
    H->>UI: Run the app, render the first screen
    Upd->>OTA: GET /manifest (channel production, runtime 2.223)
    OTA-->>Upd: Latest update manifest
    opt A newer update exists
        Upd->>OTA: Download bundle and assets
        Upd->>Upd: Verify signature (expo-root.pem), store on disk
        Note over Upd: Applied on a later launch
    end
```

**Evidence:** `assets/app.config` (`updates.url`, `expo-channel-name: production`, `runtimeVersion 2.223`), `assets/app.manifest` (the embedded update, 487 assets), `assets/expo-root.pem`, manifest flag `expo.modules.updates.ENABLED`, providers `FirebaseInitProvider`, `BugsnagContentProvider`, `MlKitInitProvider`, `InitializationProvider`; bundle header is Hermes bytecode version 98.

### 3.2 Sign-in

```mermaid
sequenceDiagram
    actor U as Traveler
    participant UI as JS app
    participant SDK as Sign-in SDK
    participant P as Google / Facebook / Apple
    participant API as wanderlog.com/api/user
    participant FCM as Firebase Messaging

    U->>UI: Chooses a sign-in method
    alt Google
        UI->>SDK: Google Sign-In
        SDK->>P: Account picker (SignInHubActivity)
        P-->>SDK: Auth code / ID token
        SDK-->>UI: Token
        UI->>API: loginGoogleAuthCode or loginGoogleIdToken
    else Facebook
        UI->>SDK: Facebook Login (FacebookActivity)
        SDK->>P: Facebook auth
        P-->>UI: Access token
        UI->>API: loginFacebookAccessToken
    else Apple
        UI->>P: Sign in with Apple
        P-->>UI: Auth code
        UI->>API: loginAppleAuthCode
    else Email
        UI->>API: createPendingUser, then activate
    end
    API-->>UI: Signed-in session
    UI->>UI: Keep session for later API calls (Authorization header)
    UI->>FCM: getToken
    FCM-->>UI: Device push token
    UI->>API: fcmToken (register device for push)
```

**Evidence:** routes `/api/user/loginGoogleAuthCode`, `/api/user/loginGoogleIdToken`, `/api/user/loginFacebookAccessToken`, `/api/user/loginAppleAuthCode`, `/api/user/createPendingUser`, `/api/user/activate`, `/api/user/isValidPasswordResetToken`, `/api/user/fcmToken`; classes `com.reactnativegooglesignin`, `com.google.android.gms.auth.api.signin.internal.SignInHubActivity`, `com.facebook.login`, `com.facebook.FacebookActivity`; strings `Authorization`, `getToken`, `onTokenRefresh`.

### 3.3 Planning a trip with tripmates (live sync)

Trip plans are shared documents. Every edit is sent as a small JSON operation over a websocket, and the server relays it to everyone else who has the trip open.

```mermaid
sequenceDiagram
    actor A as Traveler
    participant UI as JS app (MobX stores)
    participant SDB as ShareDB client
    participant S as Wanderlog ShareDB server
    participant API as wanderlog.com/api/tripPlans
    participant B as Tripmate's app

    A->>UI: Opens a trip
    UI->>SDB: Open ShareDB connection (ReconnectingWebSocket)
    SDB->>S: Subscribe to this trip plan
    S-->>SDB: Current trip document
    SDB-->>UI: Render itinerary, places, budget, checklist
    B->>S: Subscribed to the same trip
    A->>UI: Adds a place to Day 2
    UI->>UI: Update the store immediately
    UI->>SDB: submitOp (json0 operation)
    SDB->>S: Send operation
    S-->>B: Relay operation
    B->>B: Apply operation, re-render
    S-->>SDB: Acknowledge
    opt Connection drops
        SDB->>SDB: Queue edits, reconnect, resend
    end
    UI->>API: Other trip actions over REST (copy, history, checklist, likesAndComments)
```

**Evidence:** strings `openShareDBConnection…`, `createErrorFromShareDBError`, `ReconnectingWebSocket`, `createSubscribeQuery`, `submitOp`, `json0`, `useTripPlanEventListener`, `useTripPlanKey`; routes `/api/tripPlans/copy`, `/api/tripPlans/history`, `/api/tripPlans/getIfEdited`, `/api/tripPlans/checklistSections`, `/api/tripPlans/likesAndComments`, `/api/tripPlans/feed`, `/api/events/subscribe/user`.

### 3.4 Searching places and showing them on the map

```mermaid
sequenceDiagram
    actor U as Traveler
    participant UI as JS app
    participant API as wanderlog.com/api
    participant Map as Map view (Mapbox)
    participant MB as Mapbox

    U->>UI: Types "ramen near Shinjuku"
    UI->>API: placesAPI/autocomplete
    API-->>UI: Suggestions
    U->>UI: Picks a place
    UI->>API: placesAPI/getPlaceDetailsAndCardData
    API-->>UI: Details, hours, rating, photos
    UI->>API: placePhotos/search
    API-->>UI: Photo URLs
    UI->>Map: Add marker, fit bounds
    Map->>MB: Fetch vector tiles
    MB-->>Map: Tiles
    U->>UI: Adds the place to the trip
    Note over UI: Saved through the trip's ShareDB document (flow 3.3)
    UI->>API: directions/distancesForMode, directions/optimize
    API-->>UI: Travel times between stops, suggested order
```

**Evidence:** routes `/api/placesAPI/autocomplete`, `/api/placesAPI/getPlaceDetails`, `/api/placesAPI/getPlaceDetailsAndCardData`, `/api/placePhotos/search`, `/api/geo/popularAndNearbyGeos`, `/api/geo/tripPlannerGeos`, `/api/directions/distancesForMode`, `/api/directions/optimize…`, `/api/recommendations`; native `libmapbox-maps.so`, `com.mapbox.maps`; Google Maps is also linked (`com.rnmaps.maps`, `com.google.android.gms.maps`).

### 3.5 Importing a booking by sharing a file

A traveler can share a confirmation email, PDF or screenshot to Wanderlog from another app, and it is turned into a reservation on their trip.

```mermaid
sequenceDiagram
    actor U as Traveler
    participant Src as Gmail / Files / Photos
    participant Act as MainActivity
    participant Store as InboundShareIntentStorage
    participant UI as JS app
    participant API as wanderlog.com/api/importFromMedia

    U->>Src: Share, then pick Wanderlog
    Src->>Act: SEND intent with the file
    Act->>Store: Keep the shared file
    UI->>Store: Read it via ShareExtensionModule
    UI->>U: Choose a trip
    UI->>API: Upload file (importFromMedia/file)
    API->>API: Extract flights, hotels, transit, restaurants
    API-->>UI: Parsed reservations
    UI->>UI: Add to the trip (flow 3.3)
    opt View the original later
        UI->>UI: Open PDF attachment (PDF viewer, PDFium)
    end
```

**Evidence:** classes `com.wanderlog.android.ShareExtensionModule`, `ShareExtensionPackage`, `InboundShareIntentStorage`; strings `useStartImportFromMediaFromFiles`, `importFromMedia/uploads`, `importFromMedia/thumbnails`, `importFromMedia/artifacts`, `importFromMediaInTripEntryPoint`, `createUploadTask`; route `/api/importFromMedia/file`; native `libpdfium.so`, classes `com.github.barteksc.pdfviewer`, `io.legere.pdfiumandroid`.

### 3.6 AI trip assistant

```mermaid
sequenceDiagram
    actor U as Traveler
    participant UI as JS app
    participant API as /api/chat/tripPlanAssistant
    participant WS as Assistant websocket
    participant MD as Markdown renderer

    U->>UI: Opens the assistant in a trip
    UI->>API: chats, history
    API-->>UI: Earlier conversations
    U->>UI: "Plan a food day in Osaka"
    opt With attachments
        UI->>API: Upload attachment
    end
    UI->>WS: Send message with trip context
    loop While the answer streams
        WS-->>UI: Next chunk
        UI->>MD: Render markdown, math, place mentions
    end
    U->>UI: Save suggested places to the trip
    Note over UI: Saved through the trip document (flow 3.3)
    U->>UI: Thumbs up or down
    UI->>API: rateEvent
```

**Evidence:** routes `/api/chat/tripPlanAssistant/ws`, `/chats`, `/history`, `/initialChatWithItems`, `/attachment`, `/rateEvent`; strings `useTripPlanAssistantChatsSelectorHandlers`, `useMobileAssistantAttachmentUploading`, `useSaveAllPlacesForAssistantMessage`, `convertPlaceAnnotationsAndCleanMarkdownOutput`; native `libreact_codegen_EnrichedMarkdownTextSpec.so`, `libratex_ffi.so`, classes `com.swmansion.enriched.markdown`, `io.ratex`, KaTeX fonts in `assets/fonts`.

### 3.7 Hotel search and booking

```mermaid
sequenceDiagram
    actor U as Traveler
    participant UI as JS app
    participant API as wanderlog.com/api/lodging
    participant P as Expedia / Kayak / Google rates

    U->>UI: Searches hotels for the trip dates
    UI->>API: searchLodgings (paginated)
    API->>P: Query availability and prices
    P-->>API: Offers
    API-->>UI: Hotels with prices
    UI->>API: getGooglePriceRates, property/kayak
    API-->>UI: Price comparison
    U->>UI: Chooses a room
    UI->>API: checkoutData
    API-->>UI: Final price, policies
    U->>UI: Enters payment details
    UI->>API: registerPaymentAndBook
    API->>P: Book
    P-->>API: Confirmation
    API-->>UI: Booking added to the trip
    opt Cancel later
        UI->>API: lodging/cancel
    end
```

**Evidence:** routes `/api/lodging/searchLodgings`, `/api/lodging/getGooglePriceRates`, `/api/lodging/property/kayak`, `/api/lodging/checkoutData`, `/api/lodging/registerPaymentAndBook`, `/api/lodging/cancel`; strings `expediaBookingAPITimeoutMs`, `useLodgingSearchWithPagination`, `Kayak`, `Expedia`.

### 3.8 Pro subscription and offline access

```mermaid
sequenceDiagram
    actor U as Traveler
    participant UI as JS app
    participant IAP as react-native-iap
    participant Play as Google Play Billing
    participant API as wanderlog.com/api/payments
    participant Cache as Offline cache

    UI->>API: subscriptionsInfo, discountInfo
    API-->>UI: Plans and offers
    UI->>IAP: getSubscriptions
    IAP->>Play: Query products
    Play-->>UI: Prices in local currency
    U->>UI: Upgrade to Pro
    UI->>IAP: requestSubscription
    IAP->>Play: Purchase sheet (ProxyBillingActivity)
    Play-->>IAP: purchaseUpdatedListener fires
    IAP-->>UI: Purchase receipt
    UI->>API: maybeStartMobileSubscription (receipt)
    API->>Play: Verify purchase
    API-->>UI: Pro enabled
    UI->>IAP: acknowledgePurchase
    Note over UI,Cache: Pro unlocks offline access
    UI->>Cache: Save trip data and place lists for offline use
    Note over UI,Cache: Without signal, screens read from the cache
```

**Evidence:** classes `com.dooboolab` (react-native-iap), `com.android.billingclient.api.ProxyBillingActivity`, permission `com.android.vending.BILLING`; strings `getSubscriptions`, `requestSubscription`, `purchaseUpdatedListener`, `acknowledgePurchase`, `setOfflineAPICallCache`, `togglePlacesListSavedOffline`, `clickGetOfflineAccessInTemporaryModal`, `weeksBeforeTripToShowOfflineSubscribeModal`; routes `/api/payments/maybeStartMobileSubscription`, `/api/payments/subscriptionsInfo`, `/api/payments/discountInfo`. Stripe routes (`newStripeSubscription`, `startStripeTrial`) also exist but no Stripe SDK ships in the APK, so those serve the web version of the same codebase.

### 3.9 Trip tracking and travel journal

While a trip is on, the app can record where the traveler went in the background and turn the stops into a journal.

```mermaid
sequenceDiagram
    actor U as Traveler
    participant UI as JS app
    participant BG as Background geolocation (transistorsoft)
    participant DB as Local location store
    participant API as wanderlog.com/api

    U->>UI: Turns on trip tracking
    UI->>BG: Start (with location permission)
    BG->>BG: TrackingService, activity recognition, geofences
    loop While moving
        BG->>DB: Save location points
        BG->>BG: Detect stops (stationary geofence)
    end
    Note over BG: Survives restarts (BootReceiver)
    BG-->>UI: Stops ready
    UI->>API: tripTracking/addGPSStops
    API-->>UI: Matched places
    UI->>API: tripTracking/getTripTrackingTripInfos
    U->>UI: Confirms stops, adds photos
    UI->>API: tripPlans/bulkJournalDrafts, journalStopPolylines
    API-->>UI: Journal with route lines on the map
```

**Evidence:** native `libtslocationmanager.so`; manifest `com.transistorsoft.locationmanager.service.TrackingService`, `ActivityRecognitionService`, `GeofencingService`, `StationaryGeofenceReceiver`, `BootReceiver`, `com.transistorsoft.tsbackgroundfetch.FetchJobService`, `expo.modules.location.services.LocationTaskService`; strings `BackgroundGeolocation`, `makeConfirmedJournalStopFromGPSStop`, `setTripTrackingState`; routes `/api/tripTracking/addGPSStops`, `/api/tripTracking/getTripTrackingTripInfos`, `/api/tripPlans/bulkJournalDrafts`, `/api/tripPlans/journalStopPolylines`.

### 3.10 Push and local notifications

```mermaid
sequenceDiagram
    participant API as Wanderlog backend
    participant FCM as Firebase Cloud Messaging
    participant Svc as ReactNativeFirebaseMessagingService
    participant JS as JS app
    participant N as notifee
    actor U as Traveler

    API->>FCM: Send to the device token (registered in flow 3.2)
    FCM->>Svc: Deliver message
    alt App in foreground
        Svc->>JS: onMessage
    else App in background or closed
        Svc->>JS: Headless task (setBackgroundMessageHandler)
    end
    JS->>N: displayNotification
    N->>U: Shows the notification
    U->>N: Taps it
    N->>JS: Open the app (NotificationReceiverActivity)
    JS->>JS: Navigate to the trip, comment or reminder
    Note over JS,N: Local reminders use notifee alarms, rescheduled after reboot
```

**Evidence:** manifest `io.invertase.firebase.messaging.ReactNativeFirebaseMessagingService`, `ReactNativeFirebaseMessagingHeadlessService`, `app.notifee.core.NotificationReceiverActivity`, `NotificationAlarmReceiver`, `RebootBroadcastReceiver`, `expo.modules.notifications.service.ExpoFirebaseMessagingService`; strings `onMessage`, `setBackgroundMessageHandler`, `displayNotification`, `cancelAllNotificationsWithIds`; route `/api/user/fcmToken`.

### 3.11 Deep links, analytics and crash reporting

```mermaid
flowchart LR
    link["Link tapped<br/>wanderlog.app.link · applink.wanderlog.com"] --> branch["Branch SDK<br/>[io.branch]"]
    branch --> activity["MainActivity"]
    activity --> nav["react-navigation<br/>opens the right screen"]

    subgraph app["JS app and native SDKs"]
        events["Event tracking"]
        crashes["Errors and crashes<br/>JS, Java, native, ANR"]
        replay["Session recording"]
    end

    events -.-> amplitude{{"Amplitude<br/>product analytics"}}
    events -.-> ga{{"Firebase / Google Analytics"}}
    events -.-> tenjin{{"Tenjin<br/>install attribution"}}
    crashes -.-> bugsnag{{"Bugsnag"}}
    replay -.-> smartlook{{"Smartlook"}}
    tenjin -.->|"installation ID"| api["wanderlog.com/api/analytics"]

    classDef ext fill:#dcfce7,stroke:#16a34a,color:#14532d
    classDef inApp fill:#fef3c7,stroke:#d97706,color:#78350f
    classDef shellNode fill:#dbeafe,stroke:#2563eb,color:#1e3a8a
    class amplitude,ga,tenjin,bugsnag,smartlook ext
    class events,crashes,replay,nav inApp
    class link,branch,activity,api shellNode
```

**Evidence:** classes `io.branch`, `com.amplitude`, `com.tenjin`, `com.bugsnag.android`, `com.smartlook`, `com.google.firebase.analytics`; native `libbugsnag-ndk.so`, `libbugsnag-plugin-android-anr.so`; manifest keys `io.branch.sdk.BranchKey`, `com.bugsnag.android.API_KEY`, `com.facebook.sdk.ApplicationId`; strings `wanderlog.app.link`, `applink.wanderlog.com`, `api2.amplitude.com`, `tenjinAnalyticsInstallationId`, `trackMobileSessionRecordingEvent`.

## 4. Backend API surface

Route groups found in the JS bundle, by how often they appear:

| Route group | Hits | Used for |
| --- | --- | --- |
| `/api/user` | 39 | Sign-in, sign-up, profile, following, push token, key-value settings |
| `/api/tripPlans` | 26 | Trips, feed, guides, copy, history, checklist, journal, likes and comments |
| `/api/geo` | 21 | Cities and regions, categories, popular and nearby places |
| `/api/payments` | 12 | Subscriptions, trials, discounts, lifetime Pro codes |
| `/api/placesAPI` | 8 | Place search, autocomplete, details |
| `/api/lodging` | 6 | Hotel search, checkout, booking, cancellation |
| `/api/chat` | 6 | AI trip assistant |
| `/api/misc` | 5 | Surveys, cookies, vulnerability reports, debug |
| `/api/places`, `/api/placePhotos`, `/api/placesList` | 11 | Place cards, photos, curated lists |
| `/api/flights` | 4 | Airline and airport search, flight stops |
| `/api/analytics` | 4 | Analytics IDs, test events |
| `/api/directions` | 3 | Travel times, route optimization |
| `/api/tripTracking` | 2 | GPS stops, tracked trip info |
| `/api/recommendations` | 2 | Suggestions, "not interested" feedback |
| Others | 1 each | `config`, `comments`, `events`, `emails`, `importFromMedia`, `mobileOnly`, `sessionStore`, `shareMap`, `wikivoyage` |
