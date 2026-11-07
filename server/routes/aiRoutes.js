import express from 'express';
import { reconstructSignSentence, classifyLandmarksStub } from '../controllers/aiController.js';

const router = express.Router();

router.post('/reconstruct', reconstructSignSentence);
router.post('/classify-landmarks', classifyLandmarksStub);

export default router;

