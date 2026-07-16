/**
 * Offline reasoning engine.
 *
 * When no Gemini API key is present (or a live call fails), StadiumIQ still
 * works: a lightweight rule-based intent classifier chooses the same tools the
 * model would and formats their structured output into a friendly reply. This
 * guarantees the project is runnable and testable with zero setup, and gives
 * the live assistant a safe fallback.
 *
 * It is intentionally simpler than the Gemini path — full multilingual, free-
 * form reasoning needs the model — but it exercises the entire tool layer.
 */
import { executeTool } from './tools/index.js';
import { resolveLanguage } from '../domain/languages.js';

/** Ordered intent rules — first match wins. */
const INTENTS = [
  {
    tool: 'get_safety_guidance',
    test: /evacuat|emergency|fire|injur|hurt|ambulance|faint|lost child|missing child|danger|threat|suspicious/i,
    args: (text) => ({ situation: detectSituation(text) }),
  },
  {
    tool: 'get_match_schedule',
    test: /schedule|fixture|final\b|semi[- ]?final|quarter[- ]?final|what match|which match|when.*(match|game|play|final)|kick[- ]?off date/i,
    args: () => ({}),
  },
  {
    tool: 'get_accessibility_services',
    test: /wheelchair|accessib|disab|step[- ]?free|hearing|deaf|sensory|autism|blind|braille|service animal|guide dog/i,
    args: (text) => ({ need: text }),
  },
  {
    tool: 'plan_transport',
    test: /get (there|here)|transit|train|metro|subway|rail|park(ing)?|drive|driving|rideshare|uber|lyft|shuttle|\bbus\b|leav(e|ing)|depart|go home/i,
    args: (text) => ({
      mode: detectMode(text),
      direction: /leav|depart|go home|after the (match|game)/i.test(text) ? 'depart' : 'arrive',
    }),
  },
  {
    tool: 'get_crowd_status',
    test: /busy|crowd|queue|line|packed|wait|how long|quiet|congest/i,
    args: () => ({}),
  },
  {
    tool: 'find_amenities',
    test: /food|eat|hungry|drink|halal|kosher|vegan|vegetarian|gluten|restroom|toilet|bathroom|water|first aid|prayer|nursing|baby|family room|lost (and|&) found/i,
    args: (text) => ({ type: detectAmenity(text) }),
  },
  {
    tool: 'get_sustainability_tips',
    test: /recycl|sustainab|green|eco|waste|compost|refill|environment/i,
    args: () => ({}),
  },
  {
    tool: 'get_operations_brief',
    test: /brief|ops|operation|status report|situation report|overview of incident/i,
    args: () => ({}),
  },
  {
    tool: 'report_incident',
    test: /report (an? )?(incident|issue|problem)|log (an? )?incident|there('| i)s a (spill|problem|medical)/i,
    args: (text) => ({ type: 'other', zone: 'unspecified', description: text }),
  },
  {
    tool: 'plan_route_to_seat',
    test: /seat|section|my gate|which gate|how do i (get|find)|route|find my/i,
    args: (text) => ({ section: detectSection(text) ?? '100' }),
  },
];

function detectSituation(text) {
  if (/lost child|missing child/i.test(text)) return 'lost_child';
  if (/injur|hurt|ambulance|faint|medical/i.test(text)) return 'medical';
  if (/evacuat|fire/i.test(text)) return 'evacuation';
  if (/weather|lightning|storm|heat/i.test(text)) return 'weather';
  return 'security';
}

function detectMode(text) {
  if (/park|drive|driving/i.test(text)) return 'parking';
  if (/rideshare|uber|lyft/i.test(text)) return 'rideshare';
  if (/shuttle|bus/i.test(text)) return 'shuttle';
  if (/train|metro|subway|rail|transit/i.test(text)) return 'rail';
  return 'any';
}

function detectAmenity(text) {
  if (/halal|kosher|vegan|vegetarian|gluten|dietary/i.test(text)) return 'dietary';
  if (/food|eat|hungry|drink/i.test(text)) return 'food';
  if (/restroom|toilet|bathroom/i.test(text)) return 'restroom';
  if (/water|refill/i.test(text)) return 'water';
  if (/first aid|medic/i.test(text)) return 'first_aid';
  if (/prayer|faith/i.test(text)) return 'prayer';
  if (/nursing|baby|breast/i.test(text)) return 'nursing';
  if (/family/i.test(text)) return 'family';
  if (/lost (and|&) found/i.test(text)) return 'lost_and_found';
  return 'all';
}

function detectSection(text) {
  const m =
    String(text).match(/(?:section|sec|seat)\s*(\d{1,3})/i) ?? String(text).match(/\b(\d{2,3})\b/);
  return m ? m[1] : null;
}

/** Choose an intent for a user message. Falls back to a venue overview. */
export function classifyIntent(text) {
  const message = String(text ?? '');
  for (const intent of INTENTS) {
    if (intent.test.test(message)) return { tool: intent.tool, args: intent.args(message) };
  }
  return { tool: 'get_venue_guide', args: {} };
}

/* ---- Formatters: structured tool result -> friendly text ---------------- */

function bullet(lines) {
  return lines
    .filter(Boolean)
    .map((l) => `• ${l}`)
    .join('\n');
}

const FORMATTERS = {
  get_venue_guide: (r) =>
    `Here's a quick guide to ${r.venue}:\n${bullet([
      `Gates: ${r.gates.map((g) => `${g.gate} (${g.side}${g.security === 'express' ? ', express' : ''})`).join(', ')}`,
      `First aid: ${r.keyFacilities.firstAid}`,
      `Water: ${r.keyFacilities.water}`,
      r.tip,
    ])}`,
  plan_route_to_seat: (r) =>
    `To reach section ${r.section} at ${r.venue}:\n${bullet(r.steps)}` +
    `\nRecommended gate: ${r.recommendedGate}. Current crowd: ${r.crowd.level} (~${r.crowd.estimatedWaitMinutes} min).` +
    (r.alternativeGate ? `\nQuieter option: ${r.alternativeGate}.` : ''),
  get_crowd_status: (r) =>
    `${r.venue} — ${r.zone} is currently ${r.level} (about ${r.estimatedWaitMinutes} min wait).\n${r.advice}\nTip: ${r.quieterGate} is usually quieter.`,
  plan_transport: (r) =>
    `Getting ${r.direction === 'depart' ? 'away from' : 'to'} ${r.venue}:\n${bullet([
      r.chosenOption ? `Best for you: ${r.chosenOption.label} — ${r.chosenOption.detail}` : null,
      ...r.allOptions
        .filter((o) => !r.chosenOption || o.mode !== r.chosenOption.mode)
        .map((o) => `${o.label}: ${o.detail}`),
      r.departTip,
      `🌱 ${r.sustainabilityNudge}`,
    ])}`,
  get_accessibility_services: (r) =>
    `Accessibility at ${r.venue}${r.focusedOn ? ` (focus: ${r.focusedOn})` : ''}:\n${bullet([
      r.accessibleSeating,
      ...r.services,
    ])}\nNeed help now? ${r.howToGetHelp}`,
  find_amenities: (r) =>
    `At ${r.venue}:\n${bullet(r.results.map((x) => `${x.label}: ${x.detail}`))}`,
  get_sustainability_tips: (r) =>
    `Helping ${r.venue} stay green:\n${bullet([r.recycling, r.transitIncentive, ...r.tips])}`,
  get_safety_guidance: (r) =>
    `${r.situation.replace('_', ' ')} — stay calm and:\n${bullet(r.steps)}\n⚠️ ${r.reminder}`,
  get_match_schedule: (r) =>
    `${r.tournament}\n${bullet(r.matches.map((m) => `${m.date} — ${m.round}: ${m.fixture} @ ${m.venue}`))}\n${r.finale}`,
  report_incident: (r) =>
    r.logged ? `${r.message} Someone will respond shortly.` : 'I could not log that incident.',
  get_operations_brief: (r) =>
    `Ops brief — ${r.venue}:\n${bullet([
      `Crowd: ${r.crowd.level} (~${r.crowd.estimatedWaitMinutes} min). ${r.crowd.advice}`,
      `Open incidents: ${r.incidents.open} (critical ${r.incidents.bySeverity.critical}, high ${r.incidents.bySeverity.high}).`,
      `Priority: ${r.actionPlan.status}. ${r.actionPlan.summary}`,
      ...r.actionPlan.actions.map((action) => `Action: ${action}`),
    ])}`,
};

function formatResult(toolName, result) {
  if (result?.error) return result.message ?? 'Sorry, I could not help with that.';
  const fmt = FORMATTERS[toolName];
  return fmt ? fmt(result) : JSON.stringify(result);
}

/**
 * Produce an offline answer for a user message.
 * @returns {{ reply: string, toolsUsed: string[], mode: 'offline' }}
 */
export function answerOffline({ text, context = {} }) {
  const { tool, args } = classifyIntent(text);
  const result = executeTool(tool, { ...args, venue: context.venueId }, context);
  let reply = formatResult(tool, result);

  const lang = resolveLanguage(context.language);
  if (lang.code !== 'en' && !result?.error) {
    reply += `\n\n(ℹ️ Offline mode replies in English. Add a Gemini API key for full ${lang.name} support.)`;
  }
  return { reply, toolsUsed: [tool], mode: 'offline' };
}
