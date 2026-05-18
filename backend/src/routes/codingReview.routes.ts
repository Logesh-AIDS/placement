import { Router } from 'express';
import { body } from 'express-validator';
import {
  getPendingSubmissions,
  getSubmissionsByAttempt,
  gradeSubmission,
  getTestAttemptsWithCoding,
} from '../controllers/codingReview.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();

// All routes require admin authentication
router.use(authenticate, authorize('admin'));

// Get all test attempts with coding questions
router.get('/test-attempts', getTestAttemptsWithCoding);

// Get all coding submissions (with optional status filter)
router.get('/coding-submissions', getPendingSubmissions);

// Get coding submissions for a specific attempt
router.get('/coding-submissions/:attemptId', getSubmissionsByAttempt);

// Grade a coding submission
router.post(
  '/coding-submissions/:id/grade',
  [
    body('marks_obtained').isInt({ min: 0 }).withMessage('Marks must be a non-negative integer.'),
    body('admin_feedback').optional().isString(),
  ],
  validate,
  gradeSubmission
);

export default router;
