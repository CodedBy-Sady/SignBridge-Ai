import express from 'express';
import {
  startSession,
  getSessionById,
  getUserSessions,
  postMessage,
  endSession
} from '../controllers/sessionController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All session endpoints require authentication
router.use(authMiddleware);

router.post('/start', startSession);
router.get('/', getUserSessions);
router.get('/:id', getSessionById);
router.post('/:id/messages', postMessage);
router.patch('/:id/end', endSession);

export default router;

