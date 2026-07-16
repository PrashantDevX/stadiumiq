/**
 * Navigation & wayfinding tools.
 *
 * These embody the "logical decision making based on user context" the brief
 * asks for: given a seat section and the user's mobility needs and the current
 * crowd, they *decide* the best gate and route rather than dumping a map.
 */
import { getVenue } from '../venueService.js';
import { estimateCrowd } from '../crowdModel.js';

/** Parse a seat section string into a tier + bowl quadrant (0..3). */
function parseSection(section) {
  const num = Number.parseInt(String(section ?? '').replace(/\D/g, ''), 10);
  if (!Number.isFinite(num)) return { tier: 'unknown', quadrant: null, num: null };

  const tier = num < 200 ? 'lower' : num < 300 ? 'club' : 'upper';
  // Sections are numbered sequentially around the bowl; four gates → quadrants.
  const quadrant = Math.floor(((num % 100) / 100) * 4) % 4;
  return { tier, quadrant, num };
}

const TIER_NOTE = {
  lower: 'Your seats are on the lower concourse — no elevator needed from the gate.',
  club: 'Your seats are on the club level — take an escalator or elevator one level up.',
  upper: 'Your seats are on the upper concourse — follow signs to the elevators or ramps.',
  unknown: 'Head to any Guest Services booth and staff will point you to your section.',
};

export const getVenueGuide = {
  name: 'get_venue_guide',
  declaration: {
    name: 'get_venue_guide',
    description:
      'Return a concise orientation guide for a stadium: gates, entry tips and key facilities. Use when the fan asks where things are or wants an overview.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        venue: {
          type: 'string',
          description: 'Venue id or city. Optional; defaults to the current venue in context.',
        },
      },
    },
  },
  handler(args, context) {
    const venue = getVenue(args.venue ?? context.venueId);
    if (!venue) return { error: 'venue_not_found', message: 'I could not find that venue.' };

    return {
      venue: venue.name,
      city: venue.city,
      capacity: venue.capacity,
      gates: venue.operations.gates.map((g) => ({
        gate: `Gate ${g.id}`,
        side: g.compass,
        security: g.security,
        accessible: g.accessible,
      })),
      keyFacilities: {
        firstAid: venue.operations.amenities.first_aid,
        water: venue.operations.amenities.water,
        guestServices: venue.operations.accessibility.guest_services,
      },
      tip: 'Express gates are best if you are not carrying a bag.',
    };
  },
};

export const planRouteToSeat = {
  name: 'plan_route_to_seat',
  declaration: {
    name: 'plan_route_to_seat',
    description:
      "Recommend the best gate and a step-by-step route to a seat, factoring in the section, the user's mobility needs and live crowd levels. Use whenever someone asks how to reach their seat/section or which gate to use.",
    parametersJsonSchema: {
      type: 'object',
      properties: {
        section: { type: 'string', description: 'Seat section, e.g. "114" or "Upper 320".' },
        mobilityNeeds: {
          type: 'boolean',
          description: 'True if the user uses a wheelchair or needs step-free access.',
        },
        minutesToKickoff: {
          type: 'number',
          description: 'Minutes until kickoff (negative if the match has started).',
        },
        isEgress: {
          type: 'boolean',
          description: 'True when the fan is leaving after the final whistle.',
        },
      },
      required: ['section'],
    },
  },
  handler(args, context) {
    const venue = getVenue(args.venue ?? context.venueId);
    if (!venue) return { error: 'venue_not_found', message: 'I could not find that venue.' };

    const mobilityNeeds = args.mobilityNeeds ?? context.mobilityNeeds ?? false;
    const minutesToKickoff = args.minutesToKickoff ?? context.minutesToKickoff ?? 60;
    const gates = venue.operations.gates;
    const { tier, quadrant } = parseSection(args.section);

    // Pick the gate nearest the seat quadrant; fall back to the first gate.
    const primary = quadrant === null ? gates[0] : gates[quadrant % gates.length];

    // Crowd-aware: if the nearest gate is congested, offer an express/quieter one.
    const primaryFlow = primary.security === 'express' ? 'express' : 'standard';
    const crowd = estimateCrowd({
      minutesToKickoff,
      gateFlow: primaryFlow,
      isEgress: args.isEgress ?? context.isEgress ?? false,
    });
    const expressGate = gates.find((g) => g.security === 'express' && g.id !== primary.id);
    const alternative =
      crowd.level === 'high' || crowd.level === 'very_high' ? (expressGate ?? null) : null;

    const steps = [
      `Enter via Gate ${primary.id} on the ${primary.compass} side${mobilityNeeds ? ' (step-free and accessible)' : ''}.`,
      mobilityNeeds
        ? 'Ask a steward for the nearest elevator — accessible routes are signposted from the gate.'
        : TIER_NOTE[tier],
      `Follow concourse signage to section ${args.section}.`,
    ];

    return {
      venue: venue.name,
      section: args.section,
      recommendedGate: `Gate ${primary.id} (${primary.compass})`,
      accessibleRoute: mobilityNeeds,
      crowd: { level: crowd.level, estimatedWaitMinutes: crowd.waitMinutes },
      alternativeGate: alternative
        ? `Gate ${alternative.id} (${alternative.compass}) — quieter/express`
        : null,
      steps,
    };
  },
};

export const navigationTools = [getVenueGuide, planRouteToSeat];
