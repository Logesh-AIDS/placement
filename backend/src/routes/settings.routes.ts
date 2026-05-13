import { Router } from 'express';
import { body } from 'express-validator';
import { getSettings, updateSettings } from '../controllers/settings.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();

// Public — all authenticated users can read settings (students need passing_score)
router.get('/', authenticate, getSettings);

// Admin only — update settings
router.patch(
  '/',
  authenticate,
  authorize('admin'),
  [body('passing_score').optional().isInt({ min: 0, max: 100 }).withMessage('passing_score must be 0–100.')],
  validate,
  updateSettings
);

export default router;
