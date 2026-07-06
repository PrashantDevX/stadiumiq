/**
 * FIFA World Cup 2026 venue dataset.
 *
 * The tournament is co-hosted by the USA, Canada and Mexico across 16 stadiums.
 * Each venue carries verifiable metadata (name, host city, country, capacity,
 * coordinates, timezone) plus an operational profile used by StadiumIQ's
 * decision tools (gates, transport, accessibility, amenities, sustainability).
 *
 * NOTE ON DATA FIDELITY (documented as an assumption in the README):
 * Stadium *metadata* is real. The fine-grained *operational* details (gate
 * compass positions, shuttle names, crowd behaviour, etc.) are realistic but
 * illustrative — a production deployment would source these live from each
 * venue's operations API. To stay DRY, every venue inherits DEFAULT_OPERATIONS
 * and may override any field via `operations`.
 */

/**
 * Baseline operational profile shared by every World Cup venue.
 * Individual venues override only what differs.
 */
export const DEFAULT_OPERATIONS = Object.freeze({
  gates: [
    { id: 'A', compass: 'North', accessible: true, security: 'standard', bag: true },
    { id: 'B', compass: 'East', accessible: true, security: 'express', bag: false },
    { id: 'C', compass: 'South', accessible: true, security: 'standard', bag: true },
    { id: 'D', compass: 'West', accessible: true, security: 'standard', bag: true },
  ],
  accessibility: {
    step_free: true,
    accessible_seating: 'Wheelchair and companion seating in every tier; reachable from any gate via elevator.',
    services: [
      'Wheelchair escort from drop-off to seat',
      'Quiet / sensory room with sensory bags',
      'Assistive listening & induction hearing loops',
      'Accessible restrooms on every concourse',
      'Service-animal relief areas',
      'Step-free routes, ramps and elevators',
      'Braille and large-print wayfinding',
    ],
    guest_services: 'Text HELP to 69050 or visit any Guest Services booth for live assistance.',
  },
  amenities: {
    first_aid: 'Staffed medical stations on every concourse level.',
    water: 'Free water-refill stations beside every restroom block.',
    dietary: ['Halal', 'Kosher', 'Vegetarian', 'Vegan', 'Gluten-free'],
    family_room: true,
    prayer_room: true,
    nursing_room: true,
    lost_and_found: 'Main Concourse Guest Services desk.',
  },
  sustainability: {
    recycling: 'Three-stream recycle / compost / landfill bins beside every trash point.',
    reusable_cups: true,
    water_refill: true,
    transit_incentive: 'Your match ticket doubles as a free public-transit pass on match day.',
    tips: [
      'Take public transit or the official shuttle instead of driving.',
      'Bring an empty reusable bottle and refill it for free inside.',
      'Sort waste into the correct three-stream bins.',
      'Carpool to reduce parking congestion and emissions.',
    ],
  },
});

/**
 * The 16 host venues. `operations` is a partial override merged over
 * DEFAULT_OPERATIONS by the venue service.
 */
export const VENUES = Object.freeze([
  {
    id: 'metlife',
    name: 'MetLife Stadium',
    city: 'New York / New Jersey',
    country: 'USA',
    capacity: 82500,
    coordinates: { lat: 40.8135, lng: -74.0745 },
    timezone: 'America/New_York',
    transport: {
      rail: 'NJ Transit Meadowlands Rail line runs match-day trains from Secaucus Junction directly to the stadium.',
      rideshare: 'Official rideshare drop-off/pick-up at Lot G, east side.',
      parking: 'Pre-paid parking only in Lots A–G; expect heavy egress delays.',
      shuttle: 'Coach USA fan shuttles from Port Authority, Manhattan.',
      recommended: 'rail',
    },
    operations: {
      gates: [
        { id: 'A', compass: 'South-West', accessible: true, security: 'standard', bag: true },
        { id: 'B', compass: 'North-West', accessible: true, security: 'express', bag: false },
        { id: 'C', compass: 'North-East', accessible: true, security: 'standard', bag: true },
        { id: 'D', compass: 'South-East', accessible: true, security: 'standard', bag: true },
      ],
    },
  },
  {
    id: 'sofi',
    name: 'SoFi Stadium',
    city: 'Los Angeles',
    country: 'USA',
    capacity: 70240,
    coordinates: { lat: 33.9535, lng: -118.3392 },
    timezone: 'America/Los_Angeles',
    transport: {
      rail: 'Metro K Line to Downtown Inglewood, then the free match-day shuttle.',
      rideshare: 'Rideshare hub on Prairie Ave, north lot.',
      parking: 'Reserved parking in Lots 1–6; sells out early.',
      shuttle: 'Free shuttle loops from Metro K Line and Intuit Dome lots.',
      recommended: 'rail',
    },
    operations: {
      accessibility: {
        step_free: true,
        accessible_seating: 'Fully step-free bowl; accessible seating on every level with companion seats.',
        services: [
          'Wheelchair escort from every drop-off point',
          'Sensory room near the 100-level with sensory bags on request',
          'Assistive listening devices at Guest Services',
          'Accessible restrooms and lowered concessions',
          'Service-animal relief areas at Entries 1 and 5',
          'Elevators and ramps to all seating tiers',
        ],
        guest_services: 'Text HELP to 69050 or ask any staff member in a bright yellow vest.',
      },
    },
  },
  {
    id: 'azteca',
    name: 'Estadio Azteca',
    city: 'Mexico City',
    country: 'Mexico',
    capacity: 87000,
    coordinates: { lat: 19.3029, lng: -99.1505 },
    timezone: 'America/Mexico_City',
    transport: {
      rail: 'Tren Ligero (light rail) to Estadio Azteca station, steps from the ground.',
      rideshare: 'Rideshare drop-off on Calzada de Tlalpan, west side.',
      parking: 'Limited on-site parking; arrive 3+ hours early if driving.',
      shuttle: 'Metro Line 2 to Tasqueña, then Tren Ligero.',
      recommended: 'rail',
    },
    operations: {
      amenities: {
        first_aid: 'Cruz Roja medical posts (puestos de socorro) on every level.',
        water: 'Free water-refill stations beside every restroom block.',
        dietary: ['Halal', 'Vegetariano', 'Vegano', 'Sin gluten'],
        family_room: true,
        prayer_room: true,
        nursing_room: true,
        lost_and_found: 'Módulo de Servicios al Aficionado, planta baja.',
      },
    },
  },
  {
    id: 'att',
    name: 'AT&T Stadium',
    city: 'Dallas',
    country: 'USA',
    capacity: 80000,
    coordinates: { lat: 32.7473, lng: -97.0945 },
    timezone: 'America/Chicago',
    transport: {
      rail: 'Trinity Railway Express to CentrePort, then the fan shuttle.',
      rideshare: 'Rideshare zone on Randol Mill Rd.',
      parking: 'Extensive on-site lots; pre-purchase recommended.',
      shuttle: 'Arlington on-demand rideshare and stadium shuttles.',
      recommended: 'shuttle',
    },
  },
  {
    id: 'nrg',
    name: 'NRG Stadium',
    city: 'Houston',
    country: 'USA',
    capacity: 72220,
    coordinates: { lat: 29.6847, lng: -95.4107 },
    timezone: 'America/Chicago',
    transport: {
      rail: 'METRORail Red Line to Stadium Park/Astrodome station, adjacent to NRG.',
      rideshare: 'Rideshare pick-up at Kirby Dr lot.',
      parking: 'On-site paid lots surround the stadium.',
      shuttle: 'Park-and-ride from Downtown Houston transit centers.',
      recommended: 'rail',
    },
  },
  {
    id: 'arrowhead',
    name: 'Arrowhead Stadium',
    city: 'Kansas City',
    country: 'USA',
    capacity: 76416,
    coordinates: { lat: 39.0489, lng: -94.4839 },
    timezone: 'America/Chicago',
    transport: {
      rail: 'No direct rail; use the official park-and-ride shuttle network.',
      rideshare: 'Rideshare drop-off at Lot M.',
      parking: 'Large tailgate-friendly lots; gates open early.',
      shuttle: 'RideKC match-day shuttles from Downtown and the Truman Sports Complex.',
      recommended: 'shuttle',
    },
  },
  {
    id: 'gillette',
    name: 'Gillette Stadium',
    city: 'Boston',
    country: 'USA',
    capacity: 65878,
    coordinates: { lat: 42.0909, lng: -71.2643 },
    timezone: 'America/New_York',
    transport: {
      rail: 'MBTA Foxboro commuter-rail special service from South Station.',
      rideshare: 'Rideshare hub at Patriot Place.',
      parking: 'On-site lots at Patriot Place; pre-paid advised.',
      shuttle: 'Coach services from Boston and Providence.',
      recommended: 'rail',
    },
  },
  {
    id: 'hardrock',
    name: 'Hard Rock Stadium',
    city: 'Miami',
    country: 'USA',
    capacity: 65326,
    coordinates: { lat: 25.958, lng: -80.2389 },
    timezone: 'America/New_York',
    transport: {
      rail: 'Tri-Rail + shuttle, or Brightline to Aventura then rideshare.',
      rideshare: 'Rideshare zone on the north side, Lot 3.',
      parking: 'On-site paid parking; heavy demand.',
      shuttle: 'Miami-Dade park-and-ride express buses.',
      recommended: 'shuttle',
    },
  },
  {
    id: 'lincoln',
    name: 'Lincoln Financial Field',
    city: 'Philadelphia',
    country: 'USA',
    capacity: 69596,
    coordinates: { lat: 39.9008, lng: -75.1675 },
    timezone: 'America/New_York',
    transport: {
      rail: 'SEPTA Broad Street Line to NRG station, a short walk away.',
      rideshare: 'Rideshare pick-up on Darien St.',
      parking: 'Stadium-complex lots; pre-paid recommended.',
      shuttle: 'Sports Complex Special SEPTA service.',
      recommended: 'rail',
    },
  },
  {
    id: 'levis',
    name: "Levi's Stadium",
    city: 'San Francisco Bay Area',
    country: 'USA',
    capacity: 68500,
    coordinates: { lat: 37.403, lng: -121.9698 },
    timezone: 'America/Los_Angeles',
    transport: {
      rail: 'VTA light rail to Great America station, next to the stadium.',
      rideshare: 'Rideshare lot on Tasman Dr.',
      parking: 'Pre-paid lots; limited game-day availability.',
      shuttle: 'Caltrain to Mountain View, then VTA light rail.',
      recommended: 'rail',
    },
  },
  {
    id: 'lumen',
    name: 'Lumen Field',
    city: 'Seattle',
    country: 'USA',
    capacity: 68740,
    coordinates: { lat: 47.5952, lng: -122.3316 },
    timezone: 'America/Los_Angeles',
    transport: {
      rail: 'Link light rail to Stadium station, one block away.',
      rideshare: 'Rideshare zone on Occidental Ave S.',
      parking: 'Limited nearby garages; transit strongly advised.',
      shuttle: 'Sounder commuter rail on match days.',
      recommended: 'rail',
    },
  },
  {
    id: 'mercedes',
    name: 'Mercedes-Benz Stadium',
    city: 'Atlanta',
    country: 'USA',
    capacity: 71000,
    coordinates: { lat: 33.7554, lng: -84.4008 },
    timezone: 'America/New_York',
    transport: {
      rail: 'MARTA rail to GWCC / CNN Center or Vine City station, both a short walk away.',
      rideshare: 'Rideshare pick-up on Northside Dr.',
      parking: 'Limited on-site decks; transit strongly advised.',
      shuttle: 'MARTA connects from Downtown and the airport.',
      recommended: 'rail',
    },
  },
  {
    id: 'bmo',
    name: 'BMO Field',
    city: 'Toronto',
    country: 'Canada',
    capacity: 45000,
    coordinates: { lat: 43.6332, lng: -79.4185 },
    timezone: 'America/Toronto',
    transport: {
      rail: 'GO Transit / UP Express to Exhibition station, beside the ground.',
      rideshare: 'Rideshare drop-off at the Princes’ Gate.',
      parking: 'Very limited; use transit.',
      shuttle: 'TTC streetcar route 509/511 to Exhibition Loop.',
      recommended: 'rail',
    },
  },
  {
    id: 'bcplace',
    name: 'BC Place',
    city: 'Vancouver',
    country: 'Canada',
    capacity: 54500,
    coordinates: { lat: 49.2768, lng: -123.1119 },
    timezone: 'America/Vancouver',
    transport: {
      rail: 'SkyTrain to Stadium–Chinatown station, a two-minute walk.',
      rideshare: 'Rideshare pick-up on Terry Fox Way.',
      parking: 'Downtown garages; transit strongly preferred.',
      shuttle: 'SeaBus + SkyTrain from the North Shore.',
      recommended: 'rail',
    },
  },
  {
    id: 'akron',
    name: 'Estadio Akron',
    city: 'Guadalajara',
    country: 'Mexico',
    capacity: 49850,
    coordinates: { lat: 20.6819, lng: -103.4626 },
    timezone: 'America/Mexico_City',
    transport: {
      rail: 'Mi Macro Periférico bus rapid transit to the Estadio Akron corridor.',
      rideshare: 'Rideshare drop-off on Av. Vallarta.',
      parking: 'On-site lots; arrive early.',
      shuttle: 'Match-day express buses from central Guadalajara.',
      recommended: 'shuttle',
    },
  },
  {
    id: 'bbva',
    name: 'Estadio BBVA',
    city: 'Monterrey',
    country: 'Mexico',
    capacity: 53500,
    coordinates: { lat: 25.669, lng: -100.2445 },
    timezone: 'America/Monterrey',
    transport: {
      rail: 'Metro Line 2 to the Guadalupe corridor, then a local shuttle.',
      rideshare: 'Rideshare zone at the north esplanade.',
      parking: 'On-site paid parking with mountain-view lots.',
      shuttle: 'Transmetro feeder buses from Metro stations.',
      recommended: 'shuttle',
    },
  },
]);

/** Fast lookup index by venue id. */
export const VENUES_BY_ID = Object.freeze(
  Object.fromEntries(VENUES.map((v) => [v.id, v])),
);
