/**
 * User personas ("verticals") supported by StadiumIQ.
 *
 * The same GenAI brain serves every persona; what changes is (a) the tone and
 * priorities injected into the system prompt and (b) which tools the persona is
 * authorized to call. Authorization is enforced server-side in the tool
 * dispatcher — never trusted to the model — which is both a security control
 * and the clearest expression of "logical decision making based on user
 * context".
 */

/** @typedef {'fan'|'staff'|'volunteer'|'organizer'} RoleId */

export const ROLES = Object.freeze({
  fan: {
    id: 'fan',
    label: 'Fan',
    /** Human-readable persona guidance for the system prompt. */
    persona:
      'a match-day fan who wants clear, friendly, stress-free help getting to their seat, staying comfortable, and enjoying the game',
    priorities: ['navigation', 'accessibility', 'transport', 'amenities', 'sustainability'],
    /** Tools this role may invoke. `operational` tools are staff-only. */
    allowedTools: [
      'get_venue_guide',
      'get_match_schedule',
      'plan_route_to_seat',
      'get_crowd_status',
      'plan_transport',
      'get_accessibility_services',
      'find_amenities',
      'get_sustainability_tips',
      'get_safety_guidance',
    ],
  },
  volunteer: {
    id: 'volunteer',
    label: 'Volunteer',
    persona:
      'a tournament volunteer helping fans on the ground who needs quick, accurate answers and the ability to escalate issues',
    priorities: ['navigation', 'accessibility', 'crowd', 'safety', 'operations'],
    allowedTools: [
      'get_venue_guide',
      'get_match_schedule',
      'plan_route_to_seat',
      'get_crowd_status',
      'plan_transport',
      'get_accessibility_services',
      'find_amenities',
      'get_sustainability_tips',
      'get_safety_guidance',
      'report_incident',
    ],
  },
  staff: {
    id: 'staff',
    label: 'Venue Staff',
    persona:
      'venue operations staff who need concise operational intelligence and real-time decision support to keep the stadium running safely',
    priorities: ['crowd', 'operations', 'safety', 'accessibility'],
    allowedTools: [
      'get_venue_guide',
      'get_match_schedule',
      'get_crowd_status',
      'get_accessibility_services',
      'find_amenities',
      'get_safety_guidance',
      'report_incident',
      'get_operations_brief',
    ],
  },
  organizer: {
    id: 'organizer',
    label: 'Organizer',
    persona:
      'a tournament organizer overseeing multiple venues who needs high-level operational intelligence and sustainability reporting',
    priorities: ['operations', 'crowd', 'sustainability', 'safety'],
    allowedTools: [
      'get_venue_guide',
      'get_match_schedule',
      'get_crowd_status',
      'plan_transport',
      'get_sustainability_tips',
      'get_safety_guidance',
      'report_incident',
      'get_operations_brief',
    ],
  },
});

export const DEFAULT_ROLE = 'fan';

/** @param {string} roleId */
export function isValidRole(roleId) {
  return Object.prototype.hasOwnProperty.call(ROLES, roleId);
}

/** Resolve a role object, falling back to the default persona. */
export function resolveRole(roleId) {
  return ROLES[roleId] ?? ROLES[DEFAULT_ROLE];
}
