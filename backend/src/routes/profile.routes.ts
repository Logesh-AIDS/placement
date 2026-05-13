import { Router, Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import {
  getProfile,
  updateProfile,
  uploadProfilePhoto,
  deleteProfilePhoto,
  uploadResume,
  deleteResume,
  getStudentProfile,
} from '../controllers/profile.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  uploadPhoto as multerPhoto,
  uploadResume as multerResume,
} from '../middleware/upload.middleware';

const router = Router();

// All profile routes require authentication
router.use(authenticate);

// ── Text profile ──────────────────────────────────────────────────────────────
router.get('/', getProfile);

// HR/admin view a specific student's profile (photo + resume visible)
router.get('/student/:id', authorize('hr', 'admin'), getStudentProfile);

router.patch(
  '/',
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty.'),
    body('phone').optional().trim(),
    body('college').optional().trim(),
    body('graduation_year').optional().trim(),
  ],
  validate,
  updateProfile
);

// ── Photo ─────────────────────────────────────────────────────────────────────
router.post(
  '/photo',
  authorize('student'),
  (req: Request, res: Response, next: NextFunction) => {
    multerPhoto(req, res, (err) => {
      if (err) {
        res.status(400).json({ success: false, message: err.message });
        return;
      }
      next();
    });
  },
  uploadProfilePhoto
);

router.delete('/photo', authorize('student'), deleteProfilePhoto);

// ── Resume ────────────────────────────────────────────────────────────────────
router.post(
  '/resume',
  authorize('student'),
  (req: Request, res: Response, next: NextFunction) => {
    multerResume(req, res, (err) => {
      if (err) {
        res.status(400).json({ success: false, message: err.message });
        return;
      }
      next();
    });
  },
  uploadResume
);

router.delete('/resume', authorize('student'), deleteResume);

export default router;
