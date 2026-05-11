import { Router } from 'express';
import { body } from 'express-validator';
import {
  startAttempt,
  submitAttempt,
  getMyAttempts,
  getAllAttempts,
} from '../controllers/testAttempts.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();

// Student starts a test
router.post(
  '/start',
  authenticate,
  authorize('student'),
  [body('test_id').isInt().withMessage('test_id must be an integer.')],
  validate,
  startAttempt
);

// Student submits answers
router.post(
  '/:id/submit',
  authenticate,
  authorize('student'),
  [body('answers').isObject().withMessage('answers must be an object.')],
  validate,
  submitAttempt
);

// Student views their own attempts
router.get('/my', authenticate, authorize('student'), getMyAttempts);

// Admin views all attempts
router.get('/', authenticate, authorize('admin'), getAllAttempts);

export default router;
