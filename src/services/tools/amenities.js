/**
 * Amenities finder — food (with dietary options), restrooms, water, first aid,
 * family / prayer / nursing rooms and lost & found.
 */
import { getVenue } from '../venueService.js';

const AMENITY_RESPONDERS = {
  food: (am) => ({ label: 'Food & drink', detail: `Concessions on every concourse. Dietary options: ${am.dietary.join(', ')}.` }),
  dietary: (am) => ({ label: 'Dietary options', detail: `Available across concessions: ${am.dietary.join(', ')}. Look for the labelled kiosks.` }),
  restroom: () => ({ label: 'Restrooms', detail: 'Restrooms (including accessible and all-gender) are on every concourse near each gate.' }),
  water: (am) => ({ label: 'Drinking water', detail: am.water }),
  first_aid: (am) => ({ label: 'First aid', detail: am.first_aid }),
  family: (am) => ({ label: 'Family room', detail: am.family_room ? 'A family room with changing facilities is on the main concourse.' : 'No dedicated family room.' }),
  prayer: (am) => ({ label: 'Prayer / reflection room', detail: am.prayer_room ? 'A multi-faith prayer & reflection room is available — ask Guest Services for the nearest one.' : 'No dedicated prayer room.' }),
  nursing: (am) => ({ label: 'Nursing room', detail: am.nursing_room ? 'A private nursing room is available on the main concourse.' : 'No dedicated nursing room.' }),
  lost_and_found: (am) => ({ label: 'Lost & found', detail: am.lost_and_found }),
};

export const findAmenities = {
  name: 'find_amenities',
  declaration: {
    name: 'find_amenities',
    description:
      'Locate venue amenities: food and dietary options (halal, kosher, vegan, gluten-free), restrooms, water refill, first aid, family / prayer / nursing rooms and lost & found. Use for "where can I find…" questions.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['food', 'dietary', 'restroom', 'water', 'first_aid', 'family', 'prayer', 'nursing', 'lost_and_found', 'all'],
          description: 'Which amenity to locate. Use "all" for a full list.',
        },
      },
    },
  },
  handler(args, context) {
    const venue = getVenue(args.venue ?? context.venueId);
    if (!venue) return { error: 'venue_not_found', message: 'I could not find that venue.' };

    const am = venue.operations.amenities;
    const type = args.type ?? 'all';

    if (type !== 'all' && AMENITY_RESPONDERS[type]) {
      return { venue: venue.name, results: [AMENITY_RESPONDERS[type](am)] };
    }
    return {
      venue: venue.name,
      results: Object.values(AMENITY_RESPONDERS).map((fn) => fn(am)),
    };
  },
};

export const amenityTools = [findAmenities];
