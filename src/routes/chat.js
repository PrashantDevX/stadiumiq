/**
 * POST /api/chat — the single conversational endpoint.
 * Validated by `validateChat`, answered by the assistant orchestrator.
 */
import { Router } from 'express';
import { validateChat } from '../middleware/validateChat.js';
import { respond } from '../services/assistant.js';

const router = Router();

router.post('/chat', validateChat, async (req, res, next) => {
  try {
    const { messages, context } = req.chat;
    const result = await respond({ messages, context });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
