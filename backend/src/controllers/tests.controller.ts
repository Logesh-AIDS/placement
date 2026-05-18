import { Request, Response, NextFunction } from 'express';
import { query } from '../config/db';
import { createError } from '../middleware/error.middleware';
import { parseStringPromise, Builder } from 'xml2js';

// ── GET /api/tests  (all roles) ───────────────────────────────────────────────
export const getAllTests = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { domain } = req.query;
    const params: unknown[] = [];
    let where = 'WHERE t.is_active = true';

    if (domain) { where += ' AND t.domain = $1'; params.push(domain); }

    const result = await query(
      `SELECT t.*, u.name AS created_by_name
       FROM tests t
       JOIN users u ON t.created_by = u.id
       ${where}
       ORDER BY t.created_at DESC`,
      params
    );

    res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/tests/:id  (all roles) ──────────────────────────────────────────
export const getTestById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const testResult = await query(
      `SELECT t.*, u.name AS created_by_name
       FROM tests t JOIN users u ON t.created_by = u.id
       WHERE t.id = $1`,
      [req.params.id]
    );

    if (!testResult.rows[0]) return next(createError('Test not found.', 404));

    // Include questions (hide correct_answer for students)
    const isStudent = req.user!.role === 'student';
    const questionFields = isStudent
      ? 'id, test_id, question_text, options, marks'
      : 'id, test_id, question_text, options, correct_answer, marks';

    const questionsResult = await query(
      `SELECT ${questionFields} FROM questions WHERE test_id = $1 ORDER BY id`,
      [req.params.id]
    );

    res.status(200).json({
      success: true,
      data: { ...testResult.rows[0], questions: questionsResult.rows },
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/tests  (admin only) ─────────────────────────────────────────────
export const createTest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, domain, description, duration_minutes, total_marks, passing_marks, questions } = req.body;

    // Create test
    const testResult = await query(
      `INSERT INTO tests (title, domain, description, duration_minutes, total_marks, passing_marks, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [title, domain, description, duration_minutes, total_marks, passing_marks, req.user!.id]
    );

    const test = testResult.rows[0];

    // Insert questions if provided
    if (questions && Array.isArray(questions) && questions.length > 0) {
      const questionInserts = questions.map((_: unknown, i: number) => {
        const base = i * 4;
        return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`;
      });

      const questionValues = questions.flatMap((q: {
        question_text: string;
        options: string[];
        correct_answer: string;
        marks?: number;
      }) => [q.question_text, JSON.stringify(q.options), q.correct_answer, q.marks ?? 1]);

      await query(
        `INSERT INTO questions (test_id, question_text, options, correct_answer, marks)
         SELECT $1, q.question_text, q.options::jsonb, q.correct_answer, q.marks
         FROM (VALUES ${questionInserts.map((_, i) => `($${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4}, $${i * 4 + 5})`).join(',')}) 
         AS q(question_text, options, correct_answer, marks)`,
        [test.id, ...questionValues]
      );
    }

    res.status(201).json({ success: true, message: 'Test created.', data: test });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/tests/:id  (admin only) ───────────────────────────────────────
export const updateTest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, domain, description, duration_minutes, total_marks, passing_marks, is_active } = req.body;

    const result = await query(
      `UPDATE tests
       SET title           = COALESCE($1, title),
           domain          = COALESCE($2, domain),
           description     = COALESCE($3, description),
           duration_minutes= COALESCE($4, duration_minutes),
           total_marks     = COALESCE($5, total_marks),
           passing_marks   = COALESCE($6, passing_marks),
           is_active       = COALESCE($7, is_active)
       WHERE id = $8
       RETURNING *`,
      [title, domain, description, duration_minutes, total_marks, passing_marks, is_active, req.params.id]
    );

    if (!result.rows[0]) return next(createError('Test not found.', 404));

    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/tests/:id  (admin only) ──────────────────────────────────────
export const deleteTest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await query('DELETE FROM tests WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows[0]) return next(createError('Test not found.', 404));

    res.status(200).json({ success: true, message: 'Test deleted.' });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/tests/import-xml  (admin only) ─────────────────────────────────
export const importTestFromXML = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { xmlContent } = req.body;

    if (!xmlContent || typeof xmlContent !== 'string') {
      return next(createError('XML content is required.', 400));
    }

    // Parse XML
    let parsedXML: any;
    try {
      parsedXML = await parseStringPromise(xmlContent, {
        explicitArray: false,
        mergeAttrs: true,
        trim: true,
      });
    } catch (parseErr: any) {
      return next(createError(`Invalid XML: ${parseErr.message}`, 400));
    }

    // Validate root element
    if (!parsedXML.assessment) {
      return next(createError('Root element must be <assessment>', 400));
    }

    const assessment = parsedXML.assessment;
    const metadata = assessment.metadata;
    const questions = assessment.questions?.question;

    // Validate metadata
    if (!metadata) {
      return next(createError('Missing <metadata> section', 400));
    }

    const { title, domain, description, duration_minutes, passing_marks, total_marks } = metadata;

    if (!title || !domain || !duration_minutes || !passing_marks || !total_marks) {
      return next(createError('Missing required metadata fields', 400));
    }

    // Validate domain
    if (!['Web', 'DSA', 'ML', 'Cloud'].includes(domain)) {
      return next(createError(`Invalid domain: ${domain}. Must be Web, DSA, ML, or Cloud`, 400));
    }

    // Validate questions
    if (!questions || (Array.isArray(questions) && questions.length === 0)) {
      return next(createError('At least one question is required', 400));
    }

    const questionArray = Array.isArray(questions) ? questions : [questions];

    // Create test
    const testResult = await query(
      `INSERT INTO tests (title, domain, description, duration_minutes, total_marks, passing_marks, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        title,
        domain,
        description || null,
        parseInt(duration_minutes),
        parseInt(total_marks),
        parseInt(passing_marks),
        req.user!.id,
      ]
    );

    const test = testResult.rows[0];

    // Insert questions
    for (const q of questionArray) {
      const questionType = q.type;
      const questionId = q.id;
      const questionTitle = q.title;
      const questionDescription = q.description;
      const marks = parseInt(q.marks);
      const questionDomain = q.domain || domain;

      if (!questionType || !questionId || !questionTitle || !questionDescription || !marks) {
        await query('DELETE FROM tests WHERE id = $1', [test.id]);
        return next(createError(`Question ${questionId || 'unknown'}: Missing required fields`, 400));
      }

      if (questionType === 'mcq' || questionType === 'core_subject_mcq') {
        // Parse MCQ
        const options = q.options?.option;
        const correctAnswer = q.correct_answer;

        if (!options || !correctAnswer) {
          await query('DELETE FROM tests WHERE id = $1', [test.id]);
          return next(createError(`Question ${questionId}: Missing options or correct_answer`, 400));
        }

        const optionsArray = Array.isArray(options) ? options : [options];
        const optionsJSON = optionsArray.map((opt: any) => ({
          id: opt.id,
          text: opt._,
        }));

        await query(
          `INSERT INTO questions (test_id, question_text, options, correct_answer, marks)
           VALUES ($1, $2, $3, $4, $5)`,
          [test.id, questionDescription, JSON.stringify(optionsJSON), correctAnswer, marks]
        );
      } else if (questionType === 'sql' || questionType === 'coding') {
        // For SQL and Coding questions, store as JSON in question_text for now
        // In production, you'd have separate tables for these question types
        const questionData = {
          type: questionType,
          title: questionTitle,
          description: questionDescription,
          marks,
          domain: questionDomain,
          ...(questionType === 'sql' && {
            schema_context: q.schema_context,
            expected_output: q.expected_output,
            hints: q.hints?.hint ? (Array.isArray(q.hints.hint) ? q.hints.hint : [q.hints.hint]) : [],
          }),
          ...(questionType === 'coding' && {
            language: q.language,
            starter_code: q.starter_code,
            test_cases: q.test_cases?.test_case
              ? (Array.isArray(q.test_cases.test_case) ? q.test_cases.test_case : [q.test_cases.test_case])
              : [],
            constraints: q.constraints?.constraint
              ? (Array.isArray(q.constraints.constraint) ? q.constraints.constraint : [q.constraints.constraint])
              : [],
          }),
        };

        await query(
          `INSERT INTO questions (test_id, question_text, options, correct_answer, marks)
           VALUES ($1, $2, $3, $4, $5)`,
          [test.id, JSON.stringify(questionData), JSON.stringify([
            { id: 'manual', text: 'Manual evaluation required' },
            { id: 'placeholder', text: 'This is a coding question' }
          ]), '', marks]
        );
      } else {
        await query('DELETE FROM tests WHERE id = $1', [test.id]);
        return next(createError(`Question ${questionId}: Invalid type "${questionType}"`, 400));
      }
    }

    res.status(201).json({
      success: true,
      message: 'Test imported successfully from XML.',
      data: test,
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/tests/:id/export-xml  (admin only) ──────────────────────────────
export const exportTestToXML = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Fetch test
    const testResult = await query(
      `SELECT t.*, u.name AS created_by_name
       FROM tests t JOIN users u ON t.created_by = u.id
       WHERE t.id = $1`,
      [req.params.id]
    );

    if (!testResult.rows[0]) {
      return next(createError('Test not found.', 404));
    }

    const test = testResult.rows[0];

    // Fetch questions
    const questionsResult = await query(
      `SELECT id, test_id, question_text, options, correct_answer, marks
       FROM questions WHERE test_id = $1 ORDER BY id`,
      [req.params.id]
    );

    const questions = questionsResult.rows;

    // Build XML structure
    const xmlObj: any = {
      assessment: {
        $: { version: '1.0' },
        metadata: {
          title: test.title,
          domain: test.domain,
          description: test.description || '',
          duration_minutes: test.duration_minutes,
          passing_marks: test.passing_marks,
          total_marks: test.total_marks,
          created_by: test.created_by_name,
          created_at: test.created_at,
        },
        questions: {
          question: questions.map((q: any) => {
            // Try to parse as JSON (for SQL/Coding questions)
            let questionData: any;
            try {
              questionData = JSON.parse(q.question_text);
              if (questionData.type === 'sql' || questionData.type === 'coding') {
                // This is a SQL or Coding question stored as JSON
                const xmlQuestion: any = {
                  $: { type: questionData.type, id: `q${q.id}` },
                  title: questionData.title,
                  description: questionData.description,
                  marks: questionData.marks,
                  domain: questionData.domain,
                };

                if (questionData.type === 'sql') {
                  if (questionData.schema_context) xmlQuestion.schema_context = questionData.schema_context;
                  if (questionData.expected_output) xmlQuestion.expected_output = questionData.expected_output;
                  if (questionData.hints && questionData.hints.length > 0) {
                    xmlQuestion.hints = { hint: questionData.hints };
                  }
                } else if (questionData.type === 'coding') {
                  xmlQuestion.language = questionData.language;
                  if (questionData.starter_code) xmlQuestion.starter_code = questionData.starter_code;
                  if (questionData.test_cases && questionData.test_cases.length > 0) {
                    xmlQuestion.test_cases = { test_case: questionData.test_cases };
                  }
                  if (questionData.constraints && questionData.constraints.length > 0) {
                    xmlQuestion.constraints = { constraint: questionData.constraints };
                  }
                }

                return xmlQuestion;
              }
            } catch {
              // Not JSON, treat as MCQ
            }

            // MCQ question
            const options = JSON.parse(q.options);
            return {
              $: { type: 'mcq', id: `q${q.id}` },
              title: `Question ${q.id}`,
              description: q.question_text,
              marks: q.marks,
              domain: test.domain,
              options: {
                option: options.map((opt: any) => ({
                  $: { id: opt.id },
                  _: opt.text,
                })),
              },
              correct_answer: q.correct_answer,
            };
          }),
        },
      },
    };

    // Generate XML
    const builder = new Builder({
      xmldec: { version: '1.0', encoding: 'UTF-8' },
      renderOpts: { pretty: true, indent: '  ' },
    });
    const xml = builder.buildObject(xmlObj);

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', `attachment; filename="test-${test.id}-${test.title.replace(/\s+/g, '-')}.xml"`);
    res.status(200).send(xml);
  } catch (err) {
    next(err);
  }
};
