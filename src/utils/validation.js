/**
 * Request validation & sanitization (pure functions, unit-tested).
 *
 * Kept dependency-free and separate from Express so the rules can be tested in
 * isolation. Enforcing strict shapes and length caps here is a security control
 * (bounds payloads, rejects malformed input before it reaches the model).
 */
import { isValidRole, DEFAULT_ROLE } from '../domain/roles.js';
import { LANGUAGES_BY_CODE, DEFAULT_LANGUAGE } from '../domain/languages.js';

export const LIMITS = Object.freeze({
  maxMessages: 40,
  maxContentLength: 2000,
  minMinutes: -240,
  maxMinutes: 600,
});

const VALID_MESSAGE_ROLES = new Set(['user', 'assistant']);

/** Clamp a number into [min, max], or return fallback if not finite. */
function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/**
 * Validate & normalize a /api/chat request body.
 * @returns {{ok:true, value:object} | {ok:false, errors:string[]}}
 */
export function validateChatRequest(body) {
  const errors = [];
  if (typeof body !== 'object' || body === null) {
    return { ok: false, errors: ['Request body must be a JSON object.'] };
  }

  // --- messages ---
  const { messages } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    errors.push('`messages` must be a non-empty array.');
  } else if (messages.length > LIMITS.maxMessages) {
    errors.push(`\`messages\` may not exceed ${LIMITS.maxMessages} entries.`);
  }

  const cleanMessages = [];
  if (Array.isArray(messages)) {
    for (const [i, m] of messages.entries()) {
      if (typeof m !== 'object' || m === null) {
        errors.push(`messages[${i}] must be an object.`);
        continue;
      }
      const role = VALID_MESSAGE_ROLES.has(m.role) ? m.role : 'user';
      const content = typeof m.content === 'string' ? m.content.trim() : '';
      if (!content) {
        errors.push(`messages[${i}].content must be a non-empty string.`);
        continue;
      }
      cleanMessages.push({ role, content: content.slice(0, LIMITS.maxContentLength) });
    }
    if (cleanMessages.length && cleanMessages[cleanMessages.length - 1].role !== 'user') {
      errors.push('The last message must be from the user.');
    }
  }

  if (errors.length) return { ok: false, errors };

  // --- context (all optional, defaulted) ---
  const ctx = typeof body.context === 'object' && body.context !== null ? body.context : {};
  const value = {
    messages: cleanMessages,
    context: {
      role: isValidRole(ctx.role) ? ctx.role : DEFAULT_ROLE,
      venueId: typeof ctx.venueId === 'string' ? ctx.venueId.slice(0, 40) : null,
      language: LANGUAGES_BY_CODE[ctx.language] ? ctx.language : DEFAULT_LANGUAGE,
      minutesToKickoff:
        ctx.minutesToKickoff === undefined
          ? undefined
          : clampNumber(ctx.minutesToKickoff, LIMITS.minMinutes, LIMITS.maxMinutes, undefined),
      isEgress: Boolean(ctx.isEgress),
      mobilityNeeds: Boolean(ctx.mobilityNeeds),
    },
  };

  return { ok: true, value };
}
