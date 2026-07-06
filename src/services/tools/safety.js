/**
 * Safety guidance tool — calm, actionable steps for common situations.
 *
 * This is deliberately conservative: for anything serious it directs the user
 * to the nearest steward / emergency services rather than improvising advice.
 */
import { getVenue } from '../venueService.js';

const GUIDANCE = {
  evacuation: [
    'Stay calm and listen for stadium announcements and steward instructions.',
    'Walk — do not run — to the nearest marked exit, which may not be the one you entered.',
    'Leave belongings if asked to; keep moving and help those around you.',
  ],
  medical: [
    'Alert the nearest steward immediately or text the Guest Services line.',
    'If it is life-threatening, call the local emergency number (911 in the USA/Canada, 911 in Mexico).',
    'First-aid stations are on every concourse level — staff can escort you.',
  ],
  lost_child: [
    'Take the child (or report a missing one) to the nearest steward or Guest Services booth.',
    'Reunification is coordinated by Guest Services and security — stay where you are once reported.',
    'Have a recent photo and a description of clothing ready if possible.',
  ],
  security: [
    'If you see something concerning, do not intervene — tell the nearest steward or security.',
    'Move away from the area and follow any instructions given.',
    'Use the Guest Services text line for discreet reporting.',
  ],
  weather: [
    'Follow announcements — matches may pause for lightning or extreme heat.',
    'Move to sheltered concourse areas if directed; stay hydrated at refill stations.',
    'Do not return to open seating until the all-clear is given.',
  ],
};

export const getSafetyGuidance = {
  name: 'get_safety_guidance',
  declaration: {
    name: 'get_safety_guidance',
    description:
      'Provide calm, step-by-step safety guidance for evacuation, medical, lost child, security or severe-weather situations, and direct the user to stewards / emergency services. Use for any safety or emergency question.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        situation: {
          type: 'string',
          enum: ['evacuation', 'medical', 'lost_child', 'security', 'weather'],
          description: 'The type of situation.',
        },
      },
      required: ['situation'],
    },
  },
  handler(args, context) {
    const venue = getVenue(args.venue ?? context.venueId);
    const situation = GUIDANCE[args.situation] ? args.situation : 'security';

    return {
      venue: venue?.name ?? 'the venue',
      situation,
      steps: GUIDANCE[situation],
      reminder:
        'For any immediate danger, contact the nearest steward or call local emergency services right away.',
    };
  },
};

export const safetyTools = [getSafetyGuidance];
