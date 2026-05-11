import { Router } from 'express';
import { body } from 'express-validator';
import {
  applyToJob,
  getMyApplications,
  getApplicationsForJob,
  updateApplicationStatus,
  getAllApplications,
} from '../controllers/applications.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();

// Student applies to a job
router.post(
  '/',
  authenticate,
  authorize('student'),
  [body('job_id').isInt().withMessage('job_id must be an integer.')],
  validate,
  applyToJob
);

// Student views their own applications
router.get('/my', authenticate, authorize('student'), getMyApplications);

// HR views applications for their job
router.get('/job/:jobId', authenticate, authorize('hr'), getApplicationsForJob);

// HR updates application status
router.patch(
  '/:id/status',
  authenticate,
  authorize('hr'),
  [body('status').isIn(['applied', 'shortlisted', 'rejected']).withMessage('Invalid status.')],
  validate,
  updateApplicationStatus
);

// Admin views all applications
router.get('/', authenticate, authorize('admin'), getAllApplications);

export default router;
