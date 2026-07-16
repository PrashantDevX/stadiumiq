/**
 * Match-day operational decision planner.
 *
 * Turns the two signals a venue team has during the demo — crowd conditions
 * and incidents reported from the ground — into a short, ranked action plan.
 * Keeping this logic deterministic makes every recommendation explainable to
 * staff while Gemini focuses on asking for the right information and phrasing
 * it for the selected role.
 */

const SEVERITY_RANK = Object.freeze({ low: 1, medium: 2, high: 3, critical: 4 });

function incidentLabel(incident) {
  return `${incident.type.replace('_', ' ')} at ${incident.zone}`;
}

function incidentAction(incident) {
  const label = incidentLabel(incident);
  return `Dispatch ${incident.routedTo} to ${label}; keep a clear response route and confirm handoff.`;
}

/**
 * Prioritise staff actions from current crowd conditions and open incidents.
 * @param {object} input
 * @param {{level: string, waitMinutes: number}} input.crowd
 * @param {{bySeverity: Record<string, number>}} input.incidents
 * @param {Array<{type:string, zone:string, severity:string, routedTo:string, status:string}>} [input.activeIncidents]
 * @returns {{status: 'normal'|'elevated'|'urgent'|'critical', summary: string, actions: string[], requiresEscalation: boolean}}
 */
export function buildOperationalPlan({ crowd, incidents, activeIncidents = [] }) {
  const openIncidents = activeIncidents
    .filter((incident) => incident.status === 'open')
    .slice()
    .sort((a, b) => (SEVERITY_RANK[b.severity] ?? 0) - (SEVERITY_RANK[a.severity] ?? 0));
  const criticalIncident = openIncidents.find((incident) => incident.severity === 'critical');
  const highIncident = openIncidents.find((incident) => incident.severity === 'high');
  const accessibilityBlocker = openIncidents.find((incident) => incident.type === 'accessibility');
  const actions = [];

  if (criticalIncident) {
    actions.push(`Activate incident command: ${incidentAction(criticalIncident)}`);
  } else if (highIncident) {
    actions.push(`Prioritise response: ${incidentAction(highIncident)}`);
  }

  if (crowd.level === 'very_high') {
    actions.push(
      'Open express entry capacity, stage stewards at the busiest gates, and pause non-urgent concourse work.',
    );
  } else if (crowd.level === 'high') {
    actions.push(
      'Move queue stewards to the busiest gate and direct arriving fans to quieter or express entry points.',
    );
  }

  if (
    accessibilityBlocker &&
    accessibilityBlocker !== criticalIncident &&
    accessibilityBlocker !== highIncident
  ) {
    actions.push(`Protect step-free access: ${incidentAction(accessibilityBlocker)}`);
  }

  if (!actions.length) {
    actions.push(
      'Maintain standard staffing, monitor gate flow, and keep accessible routes clear.',
    );
  }

  const status = criticalIncident
    ? 'critical'
    : highIncident || crowd.level === 'very_high'
      ? 'urgent'
      : crowd.level === 'high' || incidents.bySeverity.medium > 0 || accessibilityBlocker
        ? 'elevated'
        : 'normal';
  const openCount = openIncidents.length;
  const summary =
    status === 'critical'
      ? `Critical response required: ${incidentLabel(criticalIncident)}.`
      : status === 'urgent'
        ? `Immediate attention needed: ${openCount} open incident${openCount === 1 ? '' : 's'} and ${crowd.level.replace('_', ' ')} crowd conditions.`
        : status === 'elevated'
          ? `Heightened monitoring: ${openCount} open incident${openCount === 1 ? '' : 's'} and ${crowd.level.replace('_', ' ')} crowd conditions.`
          : `Normal operations: ${crowd.level} crowd conditions and no priority incidents.`;

  return {
    status,
    summary,
    actions: actions.slice(0, 3),
    requiresEscalation: status === 'critical' || status === 'urgent',
  };
}
