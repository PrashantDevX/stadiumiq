/**
 * Thin wrapper around the official @google/genai SDK.
 *
 * Isolating the SDK behind one small `generate()` method means:
 *  - the rest of the app never imports the SDK directly,
 *  - tests can inject a fake client with the same shape (no network, no key),
 *  - swapping models or providers later touches only this file.
 */
import { GoogleGenAI } from '@google/genai';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';

/** Normalize an SDK response into the minimal shape the assistant needs. */
function normalize(response) {
  return {
    text: typeof response.text === 'string' ? response.text : '',
    functionCalls: response.functionCalls ?? [],
    candidateContent: response.candidates?.[0]?.content ?? null,
  };
}

class GeminiClient {
  constructor({ apiKey, model }) {
    this._ai = new GoogleGenAI({ apiKey });
    this._model = model;
  }

  /**
   * One content-generation round-trip with optional tools.
   * @param {object} params
   * @param {string} params.systemInstruction
   * @param {Array} params.contents  Gemini `contents` history.
   * @param {Array} [params.tools]   Array of functionDeclarations.
   * @returns {Promise<{text:string, functionCalls:Array, candidateContent:object|null}>}
   */
  async generate({ systemInstruction, contents, tools }) {
    const response = await this._ai.models.generateContent({
      model: this._model,
      contents,
      config: {
        systemInstruction,
        temperature: 0.4,
        ...(tools?.length ? { tools: [{ functionDeclarations: tools }] } : {}),
      },
    });
    return normalize(response);
  }
}

let singleton = null;

/**
 * Return a shared Gemini client, or null when no API key is configured
 * (the assistant then falls back to the offline engine).
 */
export function getGeminiClient() {
  if (!config.gemini.enabled) return null;
  if (!singleton) {
    singleton = new GeminiClient({ apiKey: config.gemini.apiKey, model: config.gemini.model });
    logger.info('Gemini client initialized', { model: config.gemini.model });
  }
  return singleton;
}

export { GeminiClient };
