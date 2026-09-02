import { Router } from 'express';
import { chatWithAI, getChatHistory, getMyChatHistory, analyzeVasProgression } from '../controllers/ai.controller';
import { aiRateLimiter } from '../middlewares/rateLimit.middleware';
import { verifyToken, optionalVerifyToken, authorizeRoles } from '../middlewares/auth.middleware';

const router = Router();

router.post('/chat', optionalVerifyToken, aiRateLimiter, chatWithAI);
router.get('/chat/history', optionalVerifyToken, getChatHistory);
router.get('/chat/history/me', verifyToken, authorizeRoles(1), getMyChatHistory);
router.post('/analyze-vas', optionalVerifyToken, analyzeVasProgression);

export default router;
