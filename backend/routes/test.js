import express from 'express';
import { testAddToPotential } from '../controllers/testController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/test-add', authMiddleware, testAddToPotential);

export default router;