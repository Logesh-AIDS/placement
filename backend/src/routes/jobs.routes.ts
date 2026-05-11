import { Router } from 'express';
import { body } from 'express-validator';
import {
  getAllJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  getMyJobs,
} from '../controllers/jobs.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();

// Public-ish: all authenticated users can browse jobs
router.get('/', authenticate, getAllJobs);
router.get('/my', authenticate, authorize('hr'), getMyJobs);
router.get('/:id', authenticate, getJobById);

// HR creates jobs
router.post(
  '/',
  authenticate,
  authorize('hr'),
  [
    body('title').trim().notEmpty().withMessage('Title is required.'),
    body('role').trim().notEmpty().withMessage('Role is required.'),
    body('domain').isIn(['Web', 'DSA', 'ML']).withMessage('Domain must be Web, DSA, or ML.'),
    body('min_score').isInt({ min: 0, max: 100 }).withMessage('min_score must be 0–100.'),
    body('description').trim().notEmpty().withMessage('Description is required.'),
  ],
  validate,
  createJob
);

// HR updates/deletes their own jobs; admin can do any
router.patch('/:id', authenticate, authorize('hr', 'admin'), updateJob);
router.delete('/:id', authenticate, authorize('hr', 'admin'), deleteJob);

export default router;
