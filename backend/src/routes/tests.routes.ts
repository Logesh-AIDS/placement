import { Router } from 'express';
import { body } from 'express-validator';
import {
  getAllTests,
  getTestById,
  createTest,
  updateTest,
  deleteTest,
} from '../controllers/tests.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();

// All authenticated users can view tests
router.get('/', authenticate, getAllTests);
router.get('/:id', authenticate, getTestById);

// Admin creates/manages tests
router.post(
  '/',
  authenticate,
  authorize('admin'),
  [
    body('title').trim().notEmpty().withMessage('Title is required.'),
    body('domain').isIn(['Web', 'DSA', 'ML']).withMessage('Domain must be Web, DSA, or ML.'),
    body('duration_minutes').isInt({ min: 1 }).withMessage('Duration must be at least 1 minute.'),
    body('total_marks').isInt({ min: 1 }).withMessage('Total marks must be at least 1.'),
    body('passing_marks').isInt({ min: 1 }).withMessage('Passing marks must be at least 1.'),
  ],
  validate,
  createTest
);

router.patch('/:id', authenticate, authorize('admin'), updateTest);
router.delete('/:id', authenticate, authorize('admin'), deleteTest);

export default router;
