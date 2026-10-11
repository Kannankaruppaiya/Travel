# Wanderlog: limitations and how to address them

**Focus:** planning a trip in India, with Thanjavur (Tanjore) as the test case
**App checked:** Wanderlog Android 2.223 (the APK in this repo, built Sept 2026), plus Wanderlog's public site, help center and user reviews
**Date:** 11 Oct 2026

---

## TL;DR

1. **There is no "add from Booking.com" path in Wanderlog.** Its in-app hotel search pulls from exactly four sources, hard-coded in the app: **Airbnb, Expedia, Kayak, Google**. Booking.com prices show up only second-hand, inside Kayak's or Google's comparisons. A Booking.com stay you already booked can only get in three ways: forward the confirmation email, connect Gmail (Pro only), or type it in by hand. Each of these has its own failure point (section 2).
2. **Forwarded emails go through an AI parser that rejects a lot of real-world email.** It fails when the stay's address is missing or incomplete (common with Indian landmark-style addresses). It also refuses host messages, receipts and cancellations, and explicitly doesn't support **"taxi/shuttle/car service"** or **"activity/tour"** bookings.
3. **Sharing a Booking.com link to Wanderlog doesn't create a stay.** The link is treated as a generic web page, and Wanderlog tries to pull *places* out of it. You get no dates and no confirmation number.
4. **Local cab operators: no.** Wanderlog's Thanjavur guide has attractions, restaurants, hotels, weather, road trips and Wikivoyage's generic "Get around" text. It has no transport or cab section, no fares and no booking. The operators do exist on Google Maps (several rated 4.8★, one with 3,000+ reviews), but you only find them if you search for them yourself.
5. **Thanjavur data has quality problems.** "Top attractions" mixes in temples 35–95 km away without saying so. The Big Temple has at least 4 duplicate place pages with contradictory tips. Its hours show 6:30 AM–8:30 PM straight through, but the sanctum actually closes **12:30–4:00 PM**.
6. **Other gaps:** offline access, Gmail scanning, route optimisation and unlimited AI are Pro-only ($39.99/yr). There's no Tamil UI (Hindi, Bengali and Punjabi exist). There's no Ola, Rapido, IRCTC or redBus integration (Uber and Lyft deep links only). Trains and buses parse poorly by users' accounts.
7. **What we should build** (section 5): import stays from anywhere (email, PDF or screenshot, Booking.com link, or a pin on the map); a verified **"Getting around"** module for each town (cabs, autos, buses, fares); temple-aware schedules; free offline access; and Tamil UI.

---

## 1. How this was tested

| Method | What it gave us |
| --- | --- |
| Decompiled the Wanderlog APK in this repo (`base.apk`, v2.223, Expo/React Native, Hermes bytecode v98) | All 246,046 UI strings and API paths. A full disassembly of 61,309 functions using Hermes' own `hbcdump`, built from the matching compiler release. Steps are in [`tools/README.md`](tools/README.md); code excerpts are in [`evidence/`](evidence/). |
| Wanderlog's public Thanjavur pages (explore page, trip planner, top-attractions list, place pages, route pages) | What a traveller actually sees for Thanjavur |
| Wanderlog help center, FAQ, Pro pricing pages; App Store / Play Store / Trustpilot reviews; comparison articles | Confirmation of the flows, the paywall, and user-reported failures |
| Google Maps listings, operator sites, Wikivoyage, TN HR&CE temple data | What local data exists that Wanderlog doesn't show |

**Limitation of this test:** this research ran in a cloud sandbox where wanderlog.com is blocked by network policy, so I couldn't log in and click through the live app. The in-app behaviour below comes from the app's own code and Wanderlog's documentation. Section 6 has a 15-minute phone test that confirms the exact Booking.com failure you hit.

---

## 2. Why "add a stay from Booking.com" fails

Wanderlog has five ways a stay can get into a trip. Here is what each does with a Booking.com booking:

| # | Path | What Wanderlog does | Why it fails for Booking.com | Evidence |
| --- | --- | --- | --- | --- |
| A | **Share / paste the Booking.com link** ("Import from anywhere") | The app special-cases Instagram, TikTok, YouTube, Pinterest, Facebook, Google Maps, Google Docs/Sheets, Reddit, Tripadvisor, ChatGPT and X. **Everything else, including booking.com, is "web".** The server then extracts *places* from that page. | At best you get the hotel as a pin with no dates, guests or confirmation number. Booking.com pages often block automated readers, which gives *"Sorry, we couldn't find any information on this page."* (Booking.com is *not* on the blocked-host list; that list is Google Drive, RedNote/Xiaohongshu, Douyin, Lemon8 and Branch app links.) | [`evidence/import-from-link-sources.hasm.txt`](evidence/import-from-link-sources.hasm.txt) |
| B | **"Find hotels to book"** (in-app hotel search) | Sources are hard-coded: `LodgingBookingSource = {kayak, expedia, airbnb, google}`. Booking runs through a Kayak white-label (`kayak.wanderlog.com`) and Expedia's booking API. | Booking.com isn't a direct source. Its rates can appear inside Kayak/Google price comparisons, but booking them means leaving Wanderlog, and there's no account link to pull in reservations you already made on Booking.com. | [`evidence/lodging-booking-sources.hasm.txt`](evidence/lodging-booking-sources.hasm.txt), [`evidence/api-endpoints.txt`](evidence/api-endpoints.txt) |
| C | **Forward the confirmation email** to the trip's address (`trip+<id>@wanderlog.com`) | Free. A server-side LLM parses the email (its error codes include `llmRequestError` and `llmNoResponseError`). | Fails with: *"We couldn't parse this lodging email since the address was missing"* (internal code `airbnbMissingAddress`, so this was built for Airbnb but hits any stay without an address); *"…due to an incomplete address"* (likely for landmark-style Indian addresses like "Near Big Temple, Thanjavur"); *"This email contains a message from the lodging manager/host…"*; *"This email is not a booking confirmation or change"* (receipts, pre-arrival mails, cancellations and marketing are all rejected); and *"We couldn't parse this email"* (timeouts and LLM errors). | [`evidence/email-import-errors.hasm.txt`](evidence/email-import-errors.hasm.txt) |
| D | **Connect Gmail** (auto-scan) | Pro only (*"Thanks for subscribing! … you must first link your Gmail account"*). Gmail only, no Outlook/Yahoo/iCloud. Scans "flight and hotel confirmations" only, and the connection expires and must be renewed. | Not available on the free plan or for non-Gmail inboxes. | [`evidence/key-ui-strings.txt`](evidence/key-ui-strings.txt) |
| E | **"Add hotel or lodging" manually** | You must pick a result from Wanderlog's place search ("Search by name or address", Google-backed), then add dates. | Homestays, service apartments and new properties are often missing from Google Maps or listed under a different name. **Workaround:** search the street address or PIN code from the confirmation instead of the name. | [`evidence/key-ui-strings.txt`](evidence/key-ui-strings.txt) |

**Fix for your current trip (today):**
1. In the trip, tap *Reservations → Lodging → Forward email* and copy the address.
2. Forward the **original "Your booking is confirmed" email** from Booking.com. Not the app's share link, not "Your receipt", and not a message from the property.
3. If it still fails, use path E with the full street address. Paste the booking number, check-in time and host phone into the stay's notes, and attach the Booking.com PDF (free plan has a limit on attachments).

---

## 3. Local details: the Thanjavur test

### 3.1 What Wanderlog does show for Thanjavur

| Content | Source inside Wanderlog | Quality |
| --- | --- | --- |
| City description, top attractions, "Top 39 things to do" (updated 14 Sep 2026, built from 31 blogs and ranked by how often each place is mentioned) | Google place data plus web aggregation and AI summaries | Good coverage of the big sights |
| Restaurant lists ("50 best restaurants in Thanjavur District", dinner, cheap eats, etc.) | Same | Good. District-level lists include Kumbakonam places (40 km away) with no distance shown |
| Ratings, review counts, phone, website, opening hours | Google (plus Tripadvisor ratings) | Hours are a single range (see 3.3) |
| "Know before you go" tips on place pages | AI-generated from reviews | Sometimes contradictory (see 3.3) |
| 2-day and 5-day itineraries, 30 road trips, weather (NASA data) | Wanderlog | Road-trip pages give **driving only** (e.g. Madurai→Thanjavur 169 km, 2 h 14 m). No bus or train options. |
| Hotel search box | Airbnb / Expedia / Kayak / Google | Booking.com, Agoda, MakeMyTrip and OYO aren't direct sources |
| "Travel information from Wikivoyage" in the app | Wikivoyage | Thanjavur's "Get around" section is generic: autos are a ₹80–100 minimum and you must negotiate; tourist cabs have no fixed rates; town buses cost under ₹20. **No operators, numbers or fares.** |

### 3.2 Would it show me a local cab operator in Tanjore? **No.**

- **No "Getting around" or transport category** in Wanderlog's city guides or explore lists. Taxi only appears as an *expense category* ("Taxi or rideshare") and in a generic tip (*"Grab is big in Southeast Asia, and Bolt is big in the UK"*).
- **You can only find an operator by searching for one yourself.** If you type an operator's name, or "call taxi Thanjavur", into place search, you get the Google listing (rating and phone). No fares, no verification, no WhatsApp booking. Wanderlog *does* have taxi place pages for other Indian cities (Ahmedabad, Bhubaneswar, Kochi, Trivandrum, Amritsar, Nainital). So the data is in its database; it just isn't curated into guides.
- **Cab bookings can't be imported.** Forwarding a cab confirmation returns *"We currently don't support parsing these types of reservations: taxi/shuttle/car service"*.
- **Ride-hailing:** deep links exist for **Uber and Lyft** (plus Citymapper and Moovit for transit). There's nothing for **Ola, Rapido, Namma Yatri** or local call taxis. Uber does operate in Thanjavur, including Uber Intercity.

The data exists. Here's what a traveller actually needs, all publicly available (Google Maps listings and operator sites, Oct 2026, not verified by us):

| Operator | Google rating | Notes |
| --- | --- | --- |
| Thanjavur Friends Track Call Taxi | 4.8★ (3,286) | Medical College Rd, ftaxi.in |
| Matha Call Taxi | 4.8★ (542) | Near New Bus Stand; call/WhatsApp +91 73732 04040; 24/7 |
| Best Track Call Taxi | 4.8★ (222) | 3rd Gate Rd; local, outstation, airport |
| FastTrack Call Taxi (Thanjavur) | — | 04362 288899; app and web booking |

Published fares: sedan **₹13/km round trip** (minimum 250 km/day) or **₹14/km one-way** (minimum 130 km), plus ₹300 driver bata and tolls (SS Drop Taxi). One-way all-inclusive fares start at ₹13/km; **Thanjavur → Trichy (56 km) is about ₹784** (OneWayTaxi.ai).

### 3.3 Data-quality problems we saw

| Problem | Example (Wanderlog pages, 11 Oct 2026) |
| --- | --- |
| Far-away places listed as "top attractions in Thanjavur" with no distance shown | Gangaikonda Cholapuram (~70 km, Ariyalur district), Thirunallar Dharbaranyeswarar temple (~95 km, Karaikal/Puducherry), Alangudi Guru temple (~35 km) |
| Ranking by blog mentions, not importance | The Big Temple (UNESCO) is **#7**; Saraswathi Mahal Library is #1 |
| Duplicate places | "Thanjavur Palace" appears at #4 and #16. The Big Temple has **at least 4 place pages** (IDs 7157, 7486206, 10718710, 13428541), each with different AI text |
| Contradictory tips | One Big Temple page says *"no restrictions on photography"*; others say photography isn't allowed inside |
| Wrong descriptions | List item "#15 Water" (South Rampart) is described as *waterfalls 141 km away* |
| **Temple hours are wrong** | The Big Temple shows *6:30 AM–8:30 PM* straight through. Official (TN HR&CE): **6:00 AM–12:30 PM and 4:00–8:30 PM**, with the sanctum closed 12:30–4:00 PM, plus a ₹50 camera fee. A plan built in Wanderlog can schedule a 2 PM darshan. |

### 3.4 Local details that are missing entirely

- Temple-specific info: darshan windows and the afternoon closure, pooja times, dress code, camera and special-darshan fees, footwear counters, festival calendar (e.g. Sathaya Vizha, Thyagaraja Aradhana at Thiruvaiyaru), Navagraha temple circuit planning.
- Getting around: verified cab operators, auto fare norms, town and mofussil bus routes and timings (TNSTC/SETC), train timings at Thanjavur Jn, airport transfer prices from Trichy.
- Licensed local guides (TripAdvisor reviews name guides and phone numbers, but there's no guide section).
- Practical info: UPI acceptance, ATMs, clean toilets, parking (₹20 at the palace), accessibility, veg/non-veg labels.
- Homestays and pilgrim lodges near the temple (absent from the Airbnb/Expedia/Kayak/Google inventory).

---

## 4. Other limitations

| Area | Limitation | Evidence |
| --- | --- | --- |
| Paywall | Offline trips, Gmail auto-scan, route optimisation, Google Maps export, unlimited attachments, unlimited AI, deals and dark mode are **Pro: $39.99/yr** on the web; app-store prices vary by user cohort (about $31.99–59.99/yr). Paid offline access is one of the most common review complaints. | wanderlog.com/pro (via third-party pricing write-ups, Sept–Oct 2026); app string *"If you're a Pro user, you can save guides … offline"* |
| Reservation types | Emails supported: flight, lodging, rental car, train/bus ("transit"), ferry, cruise, restaurant. **Not supported: taxi/shuttle/car service, activity/tour** (tickets, darshan bookings, tours). Users report train and bus emails rarely parse, and "everything else it ignored". | [`evidence/email-import-errors.hasm.txt`](evidence/email-import-errors.hasm.txt); App Store reviews (Sept 2026) |
| India transport | No IRCTC/PNR, redBus or TNSTC integration. No Ola or Rapido. Transit directions depend on Google data, so "No transit route" in small towns. Route optimisation is capped at 15 places per day. | String/endpoint search ([`evidence/api-endpoints.txt`](evidence/api-endpoints.txt)); Wanderlog FAQ |
| Hotel inventory | Booking.com, Agoda, MakeMyTrip/Goibibo and OYO aren't direct sources (only Airbnb, Expedia, Kayak and Google are). These are where many Indian stays are booked. | Section 2-B |
| Language | UI exists in Hindi, Bengali and Punjabi, but **not Tamil, Telugu, Kannada or Malayalam** | [`evidence/key-ui-strings.txt`](evidence/key-ui-strings.txt) |
| Data quality | AI-written place summaries, duplicates, geo mix-ups (also reported on Trustpilot: "the 'About' was about a totally different place") | Section 3.3; Trustpilot |
| Money | Budget has no automatic currency conversion and no UPI settle-up for group splits. The onboarding question on who pays offers "Venmo" as an answer, which shows how US-centric it is. | User feedback quoted on wanderlog.com; app strings |
| UX / performance | Lags on big trips, frequent Pro pop-ups, sign-up required before use | Play Store / App Store reviews, 2026 |

---

## 5. How to address these (what our app should do)

### P0: must-haves for an India / Tamil Nadu launch

1. **Import a stay from anywhere, with no dead ends**
   - Email-in address with an LLM parser tuned and tested on **Booking.com, Agoda, MakeMyTrip, Goibibo, OYO, Airbnb, hotel-direct and TTDC** emails, in English and Indian languages.
   - **Indian address handling:** accept landmark-style addresses, geocode by name + landmark + PIN code, and if still unsure, **ask the user to drop a pin**. Never reject the booking for an incomplete address.
   - Share-sheet import of the **Booking.com PDF or screenshot** (OCR + LLM).
   - **Paste a Booking.com link**: resolve the property, ask for dates, and create a *stay* (not just a pin).
   - Manual stay with a **map pin**, so the property doesn't need to be on Google Maps.
   - Store booking ID, check-in/out times and host phone/WhatsApp. Show "call / WhatsApp host" on the day.
2. **A "Getting around" module for every town** (Wanderlog's biggest local gap)
   - Verified cab operators: call/WhatsApp, per-km and package fares, airport and railway pickup, languages spoken, last-verified date.
   - Auto fare norms, app availability (Uber / Ola / Rapido / Namma Yatri), town bus basics, prepaid counters.
   - **Accept cab bookings in import**; Wanderlog rejects them.
   - Data: seed from Google Places (types `taxi_stand`, `car_rental`, `travel_agency`, plus text search "call taxi <town>") and operator websites. Then **verify by phone/WhatsApp**, refresh quarterly, and add our users' ratings. Later this becomes a lead-gen / partner revenue line.
3. **Temple-aware planning**
   - Structured darshan windows including the afternoon closure, pooja times, dress code, camera fee and festival days.
   - **Warn when a plan puts a temple visit in a closed window** (e.g. the Big Temple at 2 PM).
   - Source: TN HR&CE temple pages (`hrce.tn.gov.in`, per-temple IDs; Wanderlog itself links to them), ASI, official temple sites.
4. **Free offline trip:** at least the itinerary, bookings, contacts and maps for the trip area. Patchy signal on highways and in temple towns makes this a reason to switch.

### P1

5. **Geo accuracy:** show "X km from Thanjavur", and group a "Day trips from Thanjavur" section (Gangaikonda Cholapuram, Kumbakonam, Thirunallar, Alangudi). Dedupe places, and have a human review the top-50 places per town.
6. **Trains and buses:** IRCTC PNR import (email/SMS), redBus/TNSTC ticket import, Thanjavur Jn timetable, bus-stand info (Old vs New Bus Stand).
7. **Tamil UI and Tamil place names** (search "பெரிய கோவில்" → Big Temple).

### P2

8. A licensed local-guides directory, UPI settle-up for group expenses, WhatsApp itinerary sharing, and homestay / pilgrim-lodge listings.

### Data sources for the local gaps

| Need | Source | Notes |
| --- | --- | --- |
| Cab operators, travel agents | Google Places API; operator websites; our verification | Good coverage, zero verification; we add the verification |
| Temple timings, poojas, fees | TN HR&CE temple pages; temple sites; ASI | Official; needs periodic re-checks |
| Get-around basics | Wikivoyage (CC BY-SA) + our local edits | Generic; enrich with fares |
| Bus / train | TNSTC/SETC, Indian Railways (NTES), redBus / IRCTC partners | Partnerships needed for live data |
| Stays outside OTAs | TTDC "Hotel Tamil Nadu", temple-trust guesthouses, homestays (direct onboarding) | Missing from Wanderlog's four sources |

---

## 6. 15-minute phone test to confirm the Booking.com failure

Run this on the phone where you tried it, then note which row matches:

| Step | Do this | If you see… | Cause |
| --- | --- | --- | --- |
| 1 | Trip → *Reservations → Lodging → Forward email* → copy the `trip+…@wanderlog.com` address | — | — |
| 2 | Forward the original Booking.com **"booking confirmed"** email to it; wait 1–2 min; open *Forwarded emails* | *"…address was missing"* / *"…incomplete address"* | Parser couldn't find or geocode the address (path C) |
| | | *"This email is not a booking confirmation or change"* / *"…message from the lodging manager/host…"* | Wrong email forwarded (receipt, pre-arrival or host message) |
| | | *"We couldn't parse this email"* | Parser error or timeout; retry, then use path E |
| | | Stay appears | Email import works; the earlier failure was a different path |
| 3 | In the Booking.com app, *Share* the booking link → choose Wanderlog | Hotel added as a pin (no dates) or *"Sorry, we couldn't find any information on this page."* | Link import is for places, not bookings (path A) |
| 4 | *Add hotel or lodging* → search the property **name**, then its **street address / PIN** | Name not found but address works | Property isn't on Google Maps under that name (path E) |

---

## Sources

**App code (this repo):** `base.apk` v2.223. Excerpts in [`evidence/`](evidence/); reproduction steps in [`tools/README.md`](tools/README.md).

**Wanderlog pages (fetched 11 Oct 2026):**
- Thanjavur explore page: https://wanderlog.com/explore/738/thanjavur
- Thanjavur trip planner: https://wanderlog.com/tp/738/thanjavur-trip-planner
- Top 39 things to do: https://wanderlog.com/list/geoCategory/1586765
- Restaurants: https://wanderlog.com/list/geoCategory/206704/where-to-eat-best-restaurants-in-thanjavur-district
- Big Temple place pages: https://wanderlog.com/place/details/7157/brihadeeswara-temple, https://wanderlog.com/place/details/7486206/brihadeeswara-temple, https://wanderlog.com/place/details/10718710/brihadeeswara-temple, https://wanderlog.com/place/details/13428541/brihadeeswara-temple
- Madurai→Thanjavur route: https://wanderlog.com/drive/between/615/738/madurai-to-thanjavur-drive
- Taxi place pages in other cities, e.g. https://wanderlog.com/place/details/12458291/kerala-taxi-hub
- Help center, forwarding emails: https://help.wanderlog.com/hc/en-us/articles/4625693334811-Add-flight-hotel-and-rental-car-details-by-forwarding-an-email
- FAQ: https://wanderlog.com/blog/faq/
- Hotel search: https://wanderlog.com/hotels

**Pricing and reviews:**
- https://travelvient.com/guides/wanderlog-pro-cost/
- https://getplotline.app/blog/wanderlog-pricing
- https://tripagent.ai/blog/wanderlog-review
- https://appsupports.co/1476732439/wanderlog-travel-planner/negative-reviews
- https://appslupa.com/app/wanderlog-travel-planner/id1476732439
- https://au.trustpilot.com/review/wanderlog.com
- https://travelaidaily.com/blog/tripit-vs-wanderlog-solo-travelers/

**Local data:**
- Wikivoyage Thanjavur: https://en.wikivoyage.org/wiki/Thanjavur
- Big Temple timings (citing the TN HR&CE page, tid 13968): https://temple-timings.com/temples/tamil-nadu/thanjavur/brihadeeswarar-temple/ and https://www.brihadeeswaratemple.com/visitor-info/
- Cab operators and fares: https://www.mathacalltaxi.com/, https://fasttrackcalltaxi.in/thanjavur, https://ssdroptaxi.com/thanjavur/book-call-taxi, https://onewaytaxi.ai/call-taxi-in-thanjavur
- Uber in Thanjavur: https://www.uber.com/global/en/r/cities/thanjavur-tamil-nadu-in/
