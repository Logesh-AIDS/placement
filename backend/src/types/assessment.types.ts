// ============================================================================
// ASSESSMENT MODULE - TypeScript Types
// ============================================================================
// Mirrors the PostgreSQL assessment schema with proper type safety

export type QuestionType = 'mcq' | 'core_subject_mcq' | 'sql' | 'coding';
export type EvaluationStatus = 'pending' | 'in_review' | 'completed';
export type AttemptStatus = 'in_progress' | 'submitted' | 'evaluated';

// ── Question Bank Types ──────────────────────────────────────────────────────

export interface MCQTypeData {
  options: string[];
  correct_answer: string;
}

export interface SQLTypeData {
  expected_output?: string;
  schema_context?: string;
  hints?: string[];
}

export interface CodingTypeData {
  language: string;
  starter_code?: string;
  test_cases?: Array<{
    input: string;
    expected_output: string;
    is_hidden?: boolean;
  }>;
  constraints?: string[];
}

export type QuestionTypeSpecificData = MCQTypeData | SQLTypeData | CodingTypeData;

export interface QuestionBank {
  id: number;
  question_type: QuestionType;
  domain: string;
  title: string;
  description: string;
  type_specific_data: QuestionTypeSpecificData;
  difficulty_level: string;
  default_marks: number;
  default_time_mins: number;
  created_by: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// ── Test Question (Join Table) ───────────────────────────────────────────────

export interface TestQuestion {
  id: number;
  test_id: number;
  question_id: number;
  order_index: number;
  marks: number;
  is_required: boolean;
  created_at: Date;
}

// ── Student Attempt ──────────────────────────────────────────────────────────

export interface StudentAttempt {
  id: number;
  student_id: number;
  test_id: number;
  status: AttemptStatus;
  mcq_score: number;
  manual_score: number;
  total_score: number;
  max_possible_score: number;
  percentage: number;
  started_at: Date;
  submitted_at: Date | null;
  evaluated_at: Date | null;
  ip_address: string | null;
  user_agent: string | null;
  last_autosave_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

// ── Student Answer ───────────────────────────────────────────────────────────

export interface MCQAnswerData {
  selected_option: string;
}

export interface CodeAnswerData {
  code: string;
  language?: string;
}

export type AnswerData = MCQAnswerData | CodeAnswerData;

export interface StudentAnswer {
  id: number;
  attempt_id: number;
  question_id: number;
  answer_data: AnswerData;
  is_correct: boolean | null;
  auto_score: number;
  version: number;
  is_final: boolean;
  time_spent_seconds: number;
  answered_at: Date;
  updated_at: Date;
}

// ── Manual Review ────────────────────────────────────────────────────────────

export interface ManualReview {
  id: number;
  answer_id: number;
  reviewer_id: number | null;
  status: EvaluationStatus;
  marks_awarded: number | null;
  max_marks: number;
  feedback: string | null;
  assigned_at: Date;
  reviewed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

// ── API Request/Response Types ───────────────────────────────────────────────

// Admin: Create Question
export interface CreateQuestionRequest {
  question_type: QuestionType;
  domain: string;
  title: string;
  description: string;
  type_specific_data: QuestionTypeSpecificData;
  difficulty_level?: string;
  default_marks?: number;
  default_time_mins?: number;
}

// Admin: Create Test with Questions
export interface CreateTestRequest {
  title: string;
  domain: string;
  description?: string;
  duration_minutes: number;
  passing_marks: number;
  questions: Array<{
    question_id?: number; // Existing question from bank
    question_data?: CreateQuestionRequest; // Or create new question
    marks: number;
    order_index: number;
  }>;
}

// Student: Start Attempt
export interface StartAttemptRequest {
  test_id: number;
}

export interface StartAttemptResponse {
  attempt_id: number;
  test: {
    id: number;
    title: string;
    duration_minutes: number;
    total_marks: number;
  };
  questions: Array<{
    id: number;
    question_type: QuestionType;
    title: string;
    description: string;
    type_specific_data: Omit<QuestionTypeSpecificData, 'correct_answer'>; // Hide correct answer
    marks: number;
    order_index: number;
  }>;
  started_at: Date;
  expires_at: Date;
}

// Student: Autosave Answer
export interface AutosaveAnswerRequest {
  attempt_id: number;
  question_id: number;
  answer_data: AnswerData;
  time_spent_seconds: number;
}

// Student: Submit Attempt
export interface SubmitAttemptRequest {
  attempt_id: number;
  answers: Array<{
    question_id: number;
    answer_data: AnswerData;
    time_spent_seconds: number;
  }>;
}

export interface SubmitAttemptResponse {
  attempt_id: number;
  status: AttemptStatus;
  mcq_score: number;
  total_score: number;
  max_possible_score: number;
  percentage: number;
  submitted_at: Date;
  requires_manual_review: boolean;
  pending_review_count: number;
}

// Admin: Review Queue
export interface ReviewQueueItem {
  review_id: number;
  answer_id: number;
  question_id: number;
  question_type: QuestionType;
  question_title: string;
  question_description: string;
  type_specific_data: QuestionTypeSpecificData;
  answer_data: AnswerData;
  student_id: number;
  student_name: string;
  student_email: string;
  test_id: number;
  test_title: string;
  max_marks: number;
  assigned_at: Date;
}

// Admin: Submit Review
export interface SubmitReviewRequest {
  review_id: number;
  marks_awarded: number;
  feedback?: string;
}

// Student: View Results
export interface AttemptResultResponse {
  attempt: StudentAttempt;
  test: {
    id: number;
    title: string;
    domain: string;
    passing_marks: number;
  };
  answers: Array<{
    question_id: number;
    question_type: QuestionType;
    question_title: string;
    answer_data: AnswerData;
    is_correct: boolean | null;
    auto_score: number;
    manual_review?: {
      status: EvaluationStatus;
      marks_awarded: number | null;
      feedback: string | null;
      reviewed_at: Date | null;
    };
    max_marks: number;
  }>;
}

// ── Validation Schemas (for runtime validation) ─────────────────────────────

export const QuestionTypeSchema = {
  mcq: (data: unknown): data is MCQTypeData => {
    const d = data as MCQTypeData;
    return (
      Array.isArray(d.options) &&
      d.options.length >= 2 &&
      typeof d.correct_answer === 'string' &&
      d.options.includes(d.correct_answer)
    );
  },
  
  core_subject_mcq: (data: unknown): data is MCQTypeData => {
    return QuestionTypeSchema.mcq(data);
  },
  
  sql: (data: unknown): data is SQLTypeData => {
    const d = data as SQLTypeData;
    return (
      (d.expected_output === undefined || typeof d.expected_output === 'string') &&
      (d.schema_context === undefined || typeof d.schema_context === 'string')
    );
  },
  
  coding: (data: unknown): data is CodingTypeData => {
    const d = data as CodingTypeData;
    return (
      typeof d.language === 'string' &&
      (d.starter_code === undefined || typeof d.starter_code === 'string') &&
      (d.test_cases === undefined || Array.isArray(d.test_cases))
    );
  },
};

// ── Helper Functions ─────────────────────────────────────────────────────────

export function validateQuestionTypeData(
  questionType: QuestionType,
  data: unknown
): { valid: boolean; error?: string } {
  const validator = QuestionTypeSchema[questionType];
  
  if (!validator) {
    return { valid: false, error: `Unknown question type: ${questionType}` };
  }
  
  if (!validator(data)) {
    return { valid: false, error: `Invalid type_specific_data for ${questionType}` };
  }
  
  return { valid: true };
}

export function sanitizeQuestionForStudent(
  question: QuestionBank
): Omit<QuestionBank, 'type_specific_data'> & { type_specific_data: Partial<QuestionTypeSpecificData> } {
  const sanitized = { ...question };
  
  // Remove correct_answer from MCQ questions
  if (question.question_type === 'mcq' || question.question_type === 'core_subject_mcq') {
    const mcqData = question.type_specific_data as MCQTypeData;
    sanitized.type_specific_data = {
      options: mcqData.options,
    } as Partial<QuestionTypeSpecificData>;
  }
  
  return sanitized;
}

export function calculateAutoScore(
  question: QuestionBank,
  answer: AnswerData
): { is_correct: boolean; score: number } {
  // Only MCQ questions can be auto-scored
  if (question.question_type !== 'mcq' && question.question_type !== 'core_subject_mcq') {
    return { is_correct: false, score: 0 };
  }
  
  const mcqData = question.type_specific_data as MCQTypeData;
  const mcqAnswer = answer as MCQAnswerData;
  
  const is_correct = mcqAnswer.selected_option === mcqData.correct_answer;
  const score = is_correct ? question.default_marks : 0;
  
  return { is_correct, score };
}

// ── Timer Validation ─────────────────────────────────────────────────────────

export function isAttemptExpired(
  startedAt: Date,
  durationMinutes: number
): boolean {
  const expiresAt = new Date(startedAt.getTime() + durationMinutes * 60 * 1000);
  return new Date() > expiresAt;
}

export function getRemainingTime(
  startedAt: Date,
  durationMinutes: number
): number {
  const expiresAt = new Date(startedAt.getTime() + durationMinutes * 60 * 1000);
  const remaining = expiresAt.getTime() - new Date().getTime();
  return Math.max(0, Math.floor(remaining / 1000)); // seconds
}
