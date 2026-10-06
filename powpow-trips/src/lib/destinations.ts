export type Destination = {
  name: string;
  region: string;
  tags: string[];
  blurb: string;
  bestTime: string;
  idealDays: string;
  color: string;
};

/** Hand-written inspiration list for the Explore tab. */
export const DESTINATIONS: Destination[] = [
  { name: 'Goa', region: 'India', tags: ['Beach', 'Nightlife'], blurb: 'Golden beaches, Portuguese-era churches, seafood shacks and lively night markets.', bestTime: 'Nov – Feb', idealDays: '4–5 days', color: '#F26B1D' },
  { name: 'Munnar', region: 'Kerala, India', tags: ['Hills', 'Nature'], blurb: 'Rolling tea estates, misty viewpoints, waterfalls and cool mountain air.', bestTime: 'Sep – Mar', idealDays: '2–3 days', color: '#1E9E5A' },
  { name: 'Ooty', region: 'Tamil Nadu, India', tags: ['Hills', 'Family'], blurb: 'The Nilgiri toy train, botanical gardens, lakes and eucalyptus forests.', bestTime: 'Oct – Jun', idealDays: '2–3 days', color: '#0AA5D8' },
  { name: 'Madurai', region: 'Tamil Nadu, India', tags: ['Temples', 'Culture'], blurb: 'Meenakshi Amman Temple, Thirumalai Nayakkar Mahal and legendary street food.', bestTime: 'Oct – Mar', idealDays: '2 days', color: '#E8452C' },
  { name: 'Pondicherry', region: 'Puducherry, India', tags: ['Beach', 'Heritage'], blurb: 'French Quarter cafés, colourful streets, Auroville and calm promenade sunsets.', bestTime: 'Oct – Mar', idealDays: '2–3 days', color: '#FDB813' },
  { name: 'Kodaikanal', region: 'Tamil Nadu, India', tags: ['Hills', 'Lakes'], blurb: 'Star-shaped lake, pine forests, Coaker’s Walk and homemade chocolates.', bestTime: 'Apr – Jun, Sep – Oct', idealDays: '2–3 days', color: '#13235B' },
  { name: 'Alleppey', region: 'Kerala, India', tags: ['Backwaters', 'Relax'], blurb: 'Houseboat stays on palm-fringed backwaters and village canal cruises.', bestTime: 'Nov – Feb', idealDays: '2 days', color: '#0AA5D8' },
  { name: 'Jaipur', region: 'Rajasthan, India', tags: ['Forts', 'Culture'], blurb: 'Amber Fort, Hawa Mahal, bustling bazaars and royal Rajasthani cuisine.', bestTime: 'Oct – Mar', idealDays: '3 days', color: '#E8452C' },
  { name: 'Manali', region: 'Himachal Pradesh, India', tags: ['Mountains', 'Adventure'], blurb: 'Snow peaks, Solang Valley adventure sports and the road to Rohtang Pass.', bestTime: 'Oct – Jun', idealDays: '4–5 days', color: '#7B4FD6' },
  { name: 'Andaman Islands', region: 'India', tags: ['Islands', 'Diving'], blurb: 'Turquoise water at Radhanagar Beach, coral reefs and island hopping.', bestTime: 'Nov – Apr', idealDays: '5–6 days', color: '#0AA5D8' },
  { name: 'Bali', region: 'Indonesia', tags: ['Islands', 'Culture'], blurb: 'Rice terraces, cliff temples, surf beaches and wellness retreats.', bestTime: 'Apr – Oct', idealDays: '6–8 days', color: '#1E9E5A' },
  { name: 'Singapore', region: 'Singapore', tags: ['City', 'Family'], blurb: 'Gardens by the Bay, Sentosa, hawker centres and spotless city walks.', bestTime: 'Feb – Apr', idealDays: '3–4 days', color: '#E8452C' },
  { name: 'Dubai', region: 'UAE', tags: ['City', 'Shopping'], blurb: 'Skyscrapers, desert safaris, old souks and giant malls.', bestTime: 'Nov – Mar', idealDays: '4–5 days', color: '#FDB813' },
  { name: 'Bangkok', region: 'Thailand', tags: ['City', 'Food'], blurb: 'Grand Palace, floating markets, rooftop bars and incredible street food.', bestTime: 'Nov – Feb', idealDays: '3–4 days', color: '#F26B1D' },
  { name: 'Sri Lanka', region: 'Sri Lanka', tags: ['Beach', 'Hills'], blurb: 'Sigiriya rock, Kandy, the Ella train ride and southern beaches.', bestTime: 'Dec – Apr', idealDays: '7–10 days', color: '#13235B' },
  { name: 'Maldives', region: 'Maldives', tags: ['Islands', 'Honeymoon'], blurb: 'Overwater villas, lagoons and some of the clearest water on earth.', bestTime: 'Nov – Apr', idealDays: '4–5 days', color: '#0AA5D8' },
  { name: 'Paris', region: 'France', tags: ['City', 'Romance'], blurb: 'Eiffel Tower, the Louvre, café terraces and walks along the Seine.', bestTime: 'Apr – Jun, Sep – Oct', idealDays: '4–5 days', color: '#7B4FD6' },
  { name: 'Switzerland', region: 'Switzerland', tags: ['Mountains', 'Scenic'], blurb: 'Alpine villages, scenic trains, lakes and snow-capped peaks.', bestTime: 'Jun – Sep, Dec – Mar', idealDays: '7–9 days', color: '#E8452C' },
];
