import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

// ── Ensure upload directories exist ──────────────────────────────────────────
const UPLOAD_DIR   = path.join(process.cwd(), 'uploads');
const PHOTO_DIR    = path.join(UPLOAD_DIR, 'photos');
const RESUME_DIR   = path.join(UPLOAD_DIR, 'resumes');

[UPLOAD_DIR, PHOTO_DIR, RESUME_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ── Storage: photos ───────────────────────────────────────────────────────────
const photoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, PHOTO_DIR),
  filename: (req, file, cb) => {
    const userId = (req as Request & { user?: { id: number } }).user?.id ?? 'unknown';
    const ext    = path.extname(file.originalname).toLowerCase();
    cb(null, `photo_${userId}_${Date.now()}${ext}`);
  },
});

// ── Storage: resumes ──────────────────────────────────────────────────────────
const resumeStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, RESUME_DIR),
  filename: (req, file, cb) => {
    const userId = (req as Request & { user?: { id: number } }).user?.id ?? 'unknown';
    const ext    = path.extname(file.originalname).toLowerCase();
    cb(null, `resume_${userId}_${Date.now()}${ext}`);
  },
});

// ── File filters ──────────────────────────────────────────────────────────────
const photoFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only JPG, PNG, GIF or WebP images are allowed.'));
};

const resumeFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowed = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only PDF or Word documents are allowed.'));
};

// ── Exported multer instances ─────────────────────────────────────────────────
export const uploadPhoto = multer({
  storage:  photoStorage,
  fileFilter: photoFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
}).single('photo');

export const uploadResume = multer({
  storage:  resumeStorage,
  fileFilter: resumeFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
}).single('resume');

export { PHOTO_DIR, RESUME_DIR, UPLOAD_DIR };
