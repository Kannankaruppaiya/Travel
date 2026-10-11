# Wanderlog: planning limitations (India / Thanjavur test)

Sources: the Android APK in this repo (`base.apk`: React Native, Hermes bundle, all 4,133
English UI strings in `res/raw/i18n_locales_en_translation.json`) and Wanderlog's public
Thanjavur pages (`wanderlog.com/explore/738/thanjavur`, `/list/geoMap/738/thanjavur-map`,
`/list/geoCategory/1586765/attractions`, `/list/geoCategory/1644388`).

The app itself was **not** run end-to-end. This container has no Android emulator, and its
network policy blocks `wanderlog.com` and `booking.com`. Everything below comes from the
app's code and strings plus the public web pages. Items marked *(verify on device)* still
need a hands-on check.

---

## 1. Adding a Booking.com stay

### How the app ingests stays

| Path | What it actually does | Booking.com? |
|---|---|---|
| **Import from link** | Pulls *places* out of "social media, blog, etc.": Instagram, TikTok, YouTube/Shorts, blogs, Google Maps lists. It does not create reservations. | ❌ Wrong tool. A Booking.com hotel/share URL is not a guide or post. It most likely ends in "Sorry, we couldn't find any information on this page." Booking.com pages are also JS-rendered and bot-protected. |
| **Hotel search / "Book hotel"** | Searched and booked via **Kayak and Expedia** (`getKayakHotelBookingPageUrl`, `expediaBookingAPI`, `useFindOrCreateLodgingPropertyFromKayak`). Stays are capped at 28 nights and must fall within the next year. | ❌ Booking.com isn't a provider at all. |
| **Add already-booked hotel** | Manual form: hotel name from a lodging search, check-in/out, confirmation #, notes, attachments. | ✅ Works, but you type it in by hand. Small homestays or guesthouses missing from Kayak's property DB may not show up *(verify on device)*. |
| **Forward confirmation email** | Each trip has a forwarding address, and the server parses the email. | ✅ Probably works. Known failure strings: "We couldn't parse this lodging email since the address was missing", "…incomplete address", "This email contains a message from the lodging manager/host". Booking.com sends several emails per booking (confirmation, host messages, reminders), so forward the **original confirmation** one. |
| **Gmail auto-scan** | Scans the inbox for flight/hotel confirmations. | ✅ But it's a **Pro** feature ("Auto Gmail scanning"), Gmail only (no Outlook/Yahoo), and the connection expires and needs re-auth. |
| **Airbnb** | Has its own handling (`airbnb.com/rooms/` pattern, Airbnb review tips). | Airbnb gets special treatment; Booking.com doesn't. |

### Workaround today
1. Forward the Booking.com **confirmation** email to the trip's forwarding address.
2. If parsing fails (usually a missing address), use **Add already-booked hotel**. Pick the property, then paste the confirmation # and the Booking.com link into notes, and attach the PDF.
3. If the property isn't in the lodging search, add it as a regular **place** (Google-backed search) and put the dates and confirmation # in its note.

---

## 2. Local details: what you get for Thanjavur

### Present (from Google Places + blog aggregation)
- Attractions: 39-item list (Brihadeeswara Temple, Palace, Saraswathi Mahal Library, Sangeetha Mahal, Rajali Bird Park…), with Google ratings, review snippets, address, plus code and **phone/website where Google has them**.
- Restaurants: "best dinner" (28), "cheap eats" (14), top places to eat (Sree Ariya Bhavan, Krishna Bhavan, Sathars…).
- 1-day and 2-day sample itineraries, plus road-trip pages (Thanjavur → Madurai, Rameswaram, Pondicherry…).
- Map page with a short "Transportation in Thanjavur" blurb: bus stands, railway junction, Trichy airport ("taxis and autos available but may overcharge").

### Missing / weak
- **Local cab / taxi operators: no.** The app has no "getting around" or "local services" list. A travel agency shows up only by accident as a map pin (e.g. "temple travel & tour | travels in thanjavur"). The add-place search is Google-backed, so typing "taxi Thanjavur" may surface Google-listed operators with phone numbers *(verify on device)*, but nothing is curated, vetted or priced.
- **No Indian transport providers anywhere in the app**: zero mentions of Ola, Uber-auto, Rapido, Namma Yatri, Fast Track/Call Taxi, IRCTC, redBus, TNSTC/SETC, or auto-rickshaw fares. Transport tips are US-centric: "compare Uber, Lyft", "AAA/Costco rental-car discounts", "Citymapper", "24-hour flight refund in US/EU".
- No India strings at all: no ₹/INR guidance, no temple practicalities (dress code, footwear, camera fees, pooja/darshan timings, closures), no festival calendar.
- Data-quality issue: the "33 best **neighborhoods** in Thanjavur" page is just the attractions list again.
- Hours and entry fees are only as good as Google's listing. Neither is shown consistently on list pages.
- No local SIM/eSIM, ATM, pharmacy or hospital layer (Meenakshi Hospital appears only incidentally as a map pin).

---

## 3. Other limitations found in the code

- **AI assistant** has a monthly query cap on free accounts ("reached your monthly limit of {{maxQueryForUser}}").
- **Offline access, unlimited attachments, Gmail auto-import and dark mode** are Pro-only. Free accounts have an attachment file-size limit.
- Link import rejects Google Drive links and Reddit comment links.
- "We currently don't support parsing these types of reservations: {{types}}". Some reservation types can't be imported from email at all.
- Route optimisation only works within a min/max number of places, and routing fails across water.
- Expense splitting exists, but there's no INR-specific handling beyond generic currency selection.

---

## 4. How to address these

**Using Wanderlog as-is:** use the workarounds in §1. For local transport, keep a **"Getting around" note/checklist** in the trip with operators collected from Google Maps, plus Rapido/Ola availability (Thanjavur has limited app-cab coverage, so local call-taxi numbers matter).

**If building our own planner** (these are the gaps to beat):
1. **Reservation import that accepts Booking.com / Agoda / MakeMyTrip / Goibibo**: paste-a-URL or share-sheet, parse the confirmation PDF/email, with an LLM-based fallback parser when the address is missing.
2. **A "Getting around" module per city**: railway and bus stands, local call-taxi operators (name, phone, WhatsApp, typical fares), auto-rickshaw fare norms, app availability (Ola/Uber/Rapido/Namma Yatri), and IRCTC/redBus deep links.
3. **India-specific place metadata**: temple timings and closures, dress code, camera and entry fees, festival dates.
4. **Curated, verified local contacts** (guides, drivers, homestays), with user-reported freshness dates, since Google's listings for small operators go stale.
