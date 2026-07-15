/**
 * Tool registry & dispatcher.
 *
 * Aggregates every decision tool into one registry, exposes the Gemini
 * function declarations filtered to what the current role may use, and executes
 * a requested tool with a hard server-side authorization check.
 *
 * Authorization lives HERE (not in the model): even if a prompt-injected
 * message convinces the model to call `report_incident` as a fan, the
 * dispatcher refuses. That is the security backbone of the assistant.
 */
import { resolveRole } from '../../domain/roles.js';
import { navigationTools } from './navigation.js';
import { crowdTools } from './crowd.js';
import { transportTools } from './transport.js';
import { accessibilityTools } from './accessibility.js';
import { amenityTools } from './amenities.js';
import { sustainabilityTools } from './sustainability.js';
import { safetyTools } from './safety.js';
import { operationsTools } from './operations.js';
import { scheduleTools } from './schedule.js';

const ALL_TOOLS = [
  ...navigationTools,
  ...crowdTools,
  ...transportTools,
  ...accessibilityTools,
  ...amenityTools,
  ...sustainabilityTools,
  ...safetyTools,
  ...operationsTools,
  ...scheduleTools,
];

/** Registry keyed by tool name for O(1) dispatch. */
export const TOOL_REGISTRY = Object.freeze(
  Object.fromEntries(ALL_TOOLS.map((t) => [t.name, t])),
);

/**
 * Gemini `functionDeclarations` array, filtered to the tools this role may use.
 * @param {string} roleId
 */
export function getToolDeclarations(roleId) {
  const role = resolveRole(roleId);
  const allowed = new Set(role.allowedTools);
  return ALL_TOOLS.filter((t) => allowed.has(t.name)).map((t) => t.declaration);
}

/**
 * Execute a tool by name with authorization + error isolation.
 * Always returns a plain object (never throws) so the model/offline formatter
 * can react to failures gracefully.
 *
 * @param {string} name
 * @param {object} args
 * @param {object} context  { role, venueId, language, minutesToKickoff, mobilityNeeds }
 */
export function executeTool(name, args = {}, context = {}) {
  const tool = TOOL_REGISTRY[name];
  if (!tool) {
    return { error: 'unknown_tool', message: `No such tool: ${name}.` };
  }

  const role = resolveRole(context.role);
  if (!role.allowedTools.includes(name)) {
    return {
      error: 'not_authorized',
      message: `The ${role.label} role is not permitted to use ${name}. For that, please contact venue staff.`,
    };
  }

  try {
    return tool.handler(args ?? {}, context);
  } catch (err) {
    return { error: 'tool_failed', message: 'That request could not be completed.', detail: err.message };
  }
}

/** Names of every registered tool (used in tests and diagnostics). */
export const TOOL_NAMES = ALL_TOOLS.map((t) => t.name);
