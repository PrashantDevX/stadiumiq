/**
 * Express middleware wrapping the pure chat validator.
 * On success it attaches the normalized payload to `req.chat`.
 */
import { validateChatRequest } from '../utils/validation.js';

export function validateChat(req, res, next) {
  const result = validateChatRequest(req.body);
  if (!result.ok) {
    return res.status(400).json({ error: 'invalid_request', messages: result.errors });
  }
  req.chat = result.value;
  next();
}
