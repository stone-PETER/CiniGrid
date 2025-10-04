import express from 'express';
import { searchLocations } from '../controllers/aiController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// POST /api/ai/search - Get AI location suggestions
router.post('/search', authMiddleware, searchLocations);

export default router;