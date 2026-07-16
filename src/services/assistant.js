/**
 * Assistant orchestrator — the brain that ties everything together.
 *
 * Flow:
 *   1. Build a context-aware system prompt.
 *   2. If Gemini is configured, run the function-calling loop: the model picks
 *      tools, we execute them server-side (authorized), feed results back, and
 *      repeat until it produces a final answer.
 *   3. If Gemini is unavailable or errors, fall back to the offline engine.
 *
 * The client is injectable so tests can drive the whole loop with a fake model
 * and no network access.
 */
import { config } from '../config.js';
import { logger } from '../utils/logger.js';
import { buildSystemPrompt } from './prompt.js';
import { getToolDeclarations, executeTool } from './tools/index.js';
import { getGeminiClient } from './geminiClient.js';
import { answerOffline } from './offlineEngine.js';

const DEFAULT_REPLY =
  "I'm not certain about that — please ask a steward or visit any Guest Services booth.";

/** Convert chat history into Gemini `contents`, trimmed for efficiency. */
function toContents(messages) {
  return messages
    .slice(-config.gemini.maxHistoryTurns)
    .filter((m) => m && typeof m.content === 'string' && m.content.trim())
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));
}

/** Run the Gemini function-calling loop. Throws on API failure (caller falls back). */
async function runWithGemini(client, { messages, context }) {
  const systemInstruction = buildSystemPrompt(context);
  const tools = getToolDeclarations(context.role);
  const contents = toContents(messages);
  const toolsUsed = [];

  for (let i = 0; i <= config.gemini.maxToolIterations; i += 1) {
    // On the final pass we drop tools to force a text answer, bounding cost.
    const offerTools = i < config.gemini.maxToolIterations;
    const res = await client.generate({
      systemInstruction,
      contents,
      tools: offerTools ? tools : [],
    });

    if (offerTools && res.functionCalls?.length) {
      if (res.candidateContent) contents.push(res.candidateContent);
      const parts = [];
      for (const call of res.functionCalls) {
        toolsUsed.push(call.name);
        const result = executeTool(call.name, call.args ?? {}, context);
        parts.push({ functionResponse: { name: call.name, response: result } });
      }
      contents.push({ role: 'user', parts });
      continue;
    }

    return { reply: res.text?.trim() || DEFAULT_REPLY, toolsUsed, mode: 'gemini' };
  }

  return { reply: DEFAULT_REPLY, toolsUsed, mode: 'gemini' };
}

/**
 * Main entry point.
 * @param {object} params
 * @param {Array<{role:string, content:string}>} params.messages  Full chat history.
 * @param {object} params.context  { role, venueId, language, minutesToKickoff, isEgress, mobilityNeeds }
 * @param {object} [params.client] Optional injected Gemini client (for tests).
 * @returns {Promise<{reply:string, toolsUsed:string[], mode:'gemini'|'offline'}>}
 */
export async function respond({ messages, context = {}, client }) {
  const latest = messages[messages.length - 1]?.content ?? '';
  const geminiClient = client ?? getGeminiClient();

  if (geminiClient) {
    try {
      return await runWithGemini(geminiClient, { messages, context });
    } catch (err) {
      logger.error('Gemini call failed — using offline engine', { error: err.message });
      const offline = answerOffline({ text: latest, context });
      return { ...offline, mode: 'offline_fallback' };
    }
  }

  return answerOffline({ text: latest, context });
}
