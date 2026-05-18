// ============================================================================
// XML Assessment Import/Export Utilities
// ============================================================================
// Handles conversion between XML format and internal assessment structure

export interface AssessmentMetadata {
  title: string;
  domain: 'Web' | 'DSA' | 'ML' | 'Cloud';
  description?: string;
  duration_minutes: number;
  passing_marks: number;
  total_marks: number;
  created_by?: string;
  created_at?: string;
}

export interface MCQQuestion {
  type: 'mcq' | 'core_subject_mcq';
  id: string;
  title: string;
  description: string;
  marks: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  domain: string;
  options: Array<{ id: string; text: string }>;
  correct_answer: string;
  explanation?: string;
}

export interface SQLQuestion {
  type: 'sql';
  id: string;
  title: string;
  description: string;
  marks: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  domain: string;
  schema_context?: string;
  expected_output?: string;
  hints?: string[];
}

export interface CodingQuestion {
  type: 'coding';
  id: string;
  title: string;
  description: string;
  marks: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  domain: string;
  language: string;
  starter_code?: string;
  test_cases: Array<{
    input: string;
    expected_output: string;
    is_hidden: boolean;
  }>;
  constraints?: string[];
}

export type Question = MCQQuestion | SQLQuestion | CodingQuestion;

export interface Assessment {
  metadata: AssessmentMetadata;
  questions: Question[];
}

export interface ValidationError {
  code: string;
  message: string;
  line?: number;
  column?: number;
  element?: string;
}

// ============================================================================
// XML PARSING
// ============================================================================

export function parseAssessmentXML(xmlString: string): { assessment: Assessment | null; errors: ValidationError[] } {
  const errors: ValidationError[] = [];
  
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
    
    // Check for parsing errors
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      errors.push({
        code: 'XML_PARSE_ERROR',
        message: 'Invalid XML syntax: ' + parserError.textContent,
      });
      return { assessment: null, errors };
    }
    
    // Validate root element
    const root = xmlDoc.documentElement;
    if (root.tagName !== 'assessment') {
      errors.push({
        code: 'INVALID_ROOT',
        message: 'Root element must be <assessment>',
      });
      return { assessment: null, errors };
    }
    
    // Parse metadata
    const metadata = parseMetadata(xmlDoc, errors);
    if (!metadata) {
      return { assessment: null, errors };
    }
    
    // Parse questions
    const questions = parseQuestions(xmlDoc, errors);
    
    // Validate marks sum (warning only, not blocking)
    const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
    if (totalMarks !== metadata.total_marks) {
      console.warn(`Marks mismatch: Sum of question marks (${totalMarks}) does not equal total_marks (${metadata.total_marks})`);
      // Auto-adjust total_marks to match sum
      metadata.total_marks = totalMarks;
    }
    
    if (errors.length > 0) {
      return { assessment: null, errors };
    }
    
    return {
      assessment: { metadata, questions },
      errors: [],
    };
  } catch (err) {
    errors.push({
      code: 'PARSE_ERROR',
      message: err instanceof Error ? err.message : 'Unknown parsing error',
    });
    return { assessment: null, errors };
  }
}

function parseMetadata(xmlDoc: Document, errors: ValidationError[]): AssessmentMetadata | null {
  const metadataEl = xmlDoc.querySelector('metadata');
  if (!metadataEl) {
    errors.push({
      code: 'MISSING_METADATA',
      message: 'Missing <metadata> section',
    });
    return null;
  }
  
  const getRequired = (name: string): string | null => {
    const el = metadataEl.querySelector(name);
    if (!el || !el.textContent) {
      errors.push({
        code: 'MISSING_REQUIRED',
        message: `Missing required element: <${name}>`,
        element: 'metadata',
      });
      return null;
    }
    return el.textContent.trim();
  };
  
  const getOptional = (name: string): string | undefined => {
    const el = metadataEl.querySelector(name);
    return el?.textContent?.trim();
  };
  
  const title = getRequired('title');
  const domain = getRequired('domain');
  const durationStr = getRequired('duration_minutes');
  const passingStr = getRequired('passing_marks');
  const totalStr = getRequired('total_marks');
  
  if (!title || !domain || !durationStr || !passingStr || !totalStr) {
    return null;
  }
  
  // Validate domain (be flexible with common variations)
  const validDomains = ['Web', 'DSA', 'ML', 'Cloud'];
  const domainMap: Record<string, string> = {
    'web': 'Web',
    'web development': 'Web',
    'webdev': 'Web',
    'dsa': 'DSA',
    'data structures': 'DSA',
    'algorithms': 'DSA',
    'ml': 'ML',
    'machine learning': 'ML',
    'cloud': 'Cloud',
    'cloud computing': 'Cloud',
  };
  
  const normalizedDomain = domainMap[domain.toLowerCase()] || domain;
  
  if (!validDomains.includes(normalizedDomain)) {
    errors.push({
      code: 'INVALID_DOMAIN',
      message: `Invalid domain: "${domain}". Must be one of: Web, DSA, ML, or Cloud`,
    });
    return null;
  }
  
  const duration_minutes = parseInt(durationStr);
  const passing_marks = parseInt(passingStr);
  const total_marks = parseInt(totalStr);
  
  if (isNaN(duration_minutes) || duration_minutes < 1) {
    errors.push({
      code: 'INVALID_DURATION',
      message: 'duration_minutes must be a positive integer',
    });
    return null;
  }
  
  if (isNaN(passing_marks) || passing_marks < 0) {
    errors.push({
      code: 'INVALID_PASSING_MARKS',
      message: 'passing_marks must be a non-negative integer',
    });
    return null;
  }
  
  if (isNaN(total_marks) || total_marks < 1) {
    errors.push({
      code: 'INVALID_TOTAL_MARKS',
      message: 'total_marks must be a positive integer',
    });
    return null;
  }
  
  if (passing_marks > total_marks) {
    errors.push({
      code: 'INVALID_MARKS',
      message: 'passing_marks cannot exceed total_marks',
    });
    return null;
  }
  
  return {
    title,
    domain: normalizedDomain as 'Web' | 'DSA' | 'ML' | 'Cloud',
    description: getOptional('description'),
    duration_minutes,
    passing_marks,
    total_marks,
    created_by: getOptional('created_by'),
    created_at: getOptional('created_at'),
  };
}

function parseQuestions(xmlDoc: Document, errors: ValidationError[]): Question[] {
  const questionsEl = xmlDoc.querySelector('questions');
  if (!questionsEl) {
    errors.push({
      code: 'MISSING_QUESTIONS',
      message: 'Missing <questions> section',
    });
    return [];
  }
  
  const questionEls = questionsEl.querySelectorAll('question');
  if (questionEls.length === 0) {
    errors.push({
      code: 'NO_QUESTIONS',
      message: 'At least one question is required',
    });
    return [];
  }
  
  const questions: Question[] = [];
  const usedIds = new Set<string>();
  
  questionEls.forEach((qEl, index) => {
    const type = qEl.getAttribute('type');
    const id = qEl.getAttribute('id');
    
    if (!type) {
      errors.push({
        code: 'MISSING_TYPE',
        message: `Question ${index + 1}: Missing type attribute`,
      });
      return;
    }
    
    if (!id) {
      errors.push({
        code: 'MISSING_ID',
        message: `Question ${index + 1}: Missing id attribute`,
      });
      return;
    }
    
    if (usedIds.has(id)) {
      errors.push({
        code: 'DUPLICATE_ID',
        message: `Question ${index + 1}: Duplicate id "${id}"`,
      });
      return;
    }
    usedIds.add(id);
    
    switch (type) {
      case 'mcq':
      case 'core_subject_mcq':
        const mcq = parseMCQQuestion(qEl, id, type, errors);
        if (mcq) questions.push(mcq);
        break;
      case 'sql':
        const sql = parseSQLQuestion(qEl, id, errors);
        if (sql) questions.push(sql);
        break;
      case 'coding':
        const coding = parseCodingQuestion(qEl, id, errors);
        if (coding) questions.push(coding);
        break;
      default:
        errors.push({
          code: 'INVALID_TYPE',
          message: `Question ${id}: Invalid type "${type}"`,
        });
    }
  });
  
  return questions;
}

function parseMCQQuestion(
  qEl: Element,
  id: string,
  type: 'mcq' | 'core_subject_mcq',
  errors: ValidationError[]
): MCQQuestion | null {
  const title = qEl.querySelector('title')?.textContent?.trim();
  const description = qEl.querySelector('description')?.textContent?.trim();
  const marksStr = qEl.querySelector('marks')?.textContent?.trim();
  const domain = qEl.querySelector('domain')?.textContent?.trim();
  const correctAnswer = qEl.querySelector('correct_answer')?.textContent?.trim();
  
  if (!title || !description || !marksStr || !domain || !correctAnswer) {
    errors.push({
      code: 'MISSING_REQUIRED',
      message: `Question ${id}: Missing required fields`,
    });
    return null;
  }
  
  const marks = parseInt(marksStr);
  if (isNaN(marks) || marks < 1) {
    errors.push({
      code: 'INVALID_MARKS',
      message: `Question ${id}: marks must be a positive integer`,
    });
    return null;
  }
  
  const optionsEl = qEl.querySelector('options');
  if (!optionsEl) {
    errors.push({
      code: 'MISSING_OPTIONS',
      message: `Question ${id}: Missing <options> element`,
    });
    return null;
  }
  
  const optionEls = optionsEl.querySelectorAll('option');
  if (optionEls.length < 2) {
    errors.push({
      code: 'INSUFFICIENT_OPTIONS',
      message: `Question ${id}: At least 2 options required`,
    });
    return null;
  }
  
  const options: Array<{ id: string; text: string }> = [];
  const optionIds = new Set<string>();
  
  optionEls.forEach((optEl) => {
    const optId = optEl.getAttribute('id');
    const text = optEl.textContent?.trim();
    
    if (!optId || !text) {
      errors.push({
        code: 'INVALID_OPTION',
        message: `Question ${id}: Option missing id or text`,
      });
      return;
    }
    
    if (optionIds.has(optId)) {
      errors.push({
        code: 'DUPLICATE_OPTION_ID',
        message: `Question ${id}: Duplicate option id "${optId}"`,
      });
      return;
    }
    
    optionIds.add(optId);
    options.push({ id: optId, text });
  });
  
  if (!optionIds.has(correctAnswer)) {
    errors.push({
      code: 'INVALID_CORRECT_ANSWER',
      message: `Question ${id}: correct_answer "${correctAnswer}" not found in options`,
    });
    return null;
  }
  
  return {
    type,
    id,
    title,
    description,
    marks,
    difficulty: qEl.querySelector('difficulty')?.textContent?.trim() as 'easy' | 'medium' | 'hard' | undefined,
    domain,
    options,
    correct_answer: correctAnswer,
    explanation: qEl.querySelector('explanation')?.textContent?.trim(),
  };
}

function parseSQLQuestion(qEl: Element, id: string, errors: ValidationError[]): SQLQuestion | null {
  const title = qEl.querySelector('title')?.textContent?.trim();
  const description = qEl.querySelector('description')?.textContent?.trim();
  const marksStr = qEl.querySelector('marks')?.textContent?.trim();
  const domain = qEl.querySelector('domain')?.textContent?.trim();
  
  if (!title || !description || !marksStr || !domain) {
    errors.push({
      code: 'MISSING_REQUIRED',
      message: `Question ${id}: Missing required fields`,
    });
    return null;
  }
  
  const marks = parseInt(marksStr);
  if (isNaN(marks) || marks < 1) {
    errors.push({
      code: 'INVALID_MARKS',
      message: `Question ${id}: marks must be a positive integer`,
    });
    return null;
  }
  
  const hints: string[] = [];
  const hintsEl = qEl.querySelector('hints');
  if (hintsEl) {
    hintsEl.querySelectorAll('hint').forEach((hintEl) => {
      const hint = hintEl.textContent?.trim();
      if (hint) hints.push(hint);
    });
  }
  
  return {
    type: 'sql',
    id,
    title,
    description,
    marks,
    difficulty: qEl.querySelector('difficulty')?.textContent?.trim() as 'easy' | 'medium' | 'hard' | undefined,
    domain,
    schema_context: qEl.querySelector('schema_context')?.textContent?.trim(),
    expected_output: qEl.querySelector('expected_output')?.textContent?.trim(),
    hints: hints.length > 0 ? hints : undefined,
  };
}

function parseCodingQuestion(qEl: Element, id: string, errors: ValidationError[]): CodingQuestion | null {
  const title = qEl.querySelector('title')?.textContent?.trim();
  const description = qEl.querySelector('description')?.textContent?.trim();
  const marksStr = qEl.querySelector('marks')?.textContent?.trim();
  const domain = qEl.querySelector('domain')?.textContent?.trim();
  const language = qEl.querySelector('language')?.textContent?.trim();
  
  if (!title || !description || !marksStr || !domain) {
    errors.push({
      code: 'MISSING_REQUIRED',
      message: `Question ${id}: Missing required fields (title, description, marks, or domain)`,
    });
    return null;
  }
  
  const marks = parseInt(marksStr);
  if (isNaN(marks) || marks < 1) {
    errors.push({
      code: 'INVALID_MARKS',
      message: `Question ${id}: marks must be a positive integer`,
    });
    return null;
  }
  
  // Language is optional, default to javascript
  const questionLanguage = language || 'javascript';
  
  const testCasesEl = qEl.querySelector('test_cases');
  let test_cases: Array<{ input: string; expected_output: string; is_hidden: boolean }> = [];
  
  if (testCasesEl) {
    const testCaseEls = testCasesEl.querySelectorAll('test_case');
    
    testCaseEls.forEach((tcEl, index) => {
      const input = tcEl.querySelector('input')?.textContent?.trim();
      const expected_output = tcEl.querySelector('expected_output')?.textContent?.trim();
      const is_hidden = tcEl.querySelector('is_hidden')?.textContent?.trim() === 'true';
      
      if (!input || !expected_output) {
        errors.push({
          code: 'INVALID_TEST_CASE',
          message: `Question ${id}, Test case ${index + 1}: Missing input or expected_output`,
        });
        return;
      }
      
      test_cases.push({ input, expected_output, is_hidden });
    });
  } else {
    // Try to get sample input/output (alternative format)
    const sampleInput = qEl.querySelector('sample_input')?.textContent?.trim();
    const sampleOutput = qEl.querySelector('sample_output')?.textContent?.trim();
    
    if (sampleInput && sampleOutput) {
      test_cases.push({
        input: sampleInput,
        expected_output: sampleOutput,
        is_hidden: false,
      });
    }
  }
  
  // Test cases are optional for manual evaluation
  if (test_cases.length === 0) {
    console.warn(`Question ${id}: No test cases provided. This question will require manual evaluation.`);
  }
  
  const constraints: string[] = [];
  const constraintsEl = qEl.querySelector('constraints');
  if (constraintsEl) {
    constraintsEl.querySelectorAll('constraint').forEach((cEl) => {
      const constraint = cEl.textContent?.trim();
      if (constraint) constraints.push(constraint);
    });
  } else {
    // Try single constraint element
    const constraintEl = qEl.querySelector('constraints');
    if (constraintEl?.textContent?.trim()) {
      constraints.push(constraintEl.textContent.trim());
    }
  }
  
  return {
    type: 'coding',
    id,
    title,
    description,
    marks,
    difficulty: qEl.querySelector('difficulty')?.textContent?.trim() as 'easy' | 'medium' | 'hard' | undefined,
    domain,
    language: questionLanguage,
    starter_code: qEl.querySelector('starter_code')?.textContent?.trim(),
    test_cases,
    constraints: constraints.length > 0 ? constraints : undefined,
  };
}

// ============================================================================
// XML GENERATION
// ============================================================================

export function generateAssessmentXML(assessment: Assessment): string {
  const { metadata, questions } = assessment;
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<assessment version="1.0">\n';
  
  // Metadata
  xml += '  <metadata>\n';
  xml += `    <title>${escapeXML(metadata.title)}</title>\n`;
  xml += `    <domain>${metadata.domain}</domain>\n`;
  if (metadata.description) {
    xml += `    <description>${escapeXML(metadata.description)}</description>\n`;
  }
  xml += `    <duration_minutes>${metadata.duration_minutes}</duration_minutes>\n`;
  xml += `    <passing_marks>${metadata.passing_marks}</passing_marks>\n`;
  xml += `    <total_marks>${metadata.total_marks}</total_marks>\n`;
  if (metadata.created_by) {
    xml += `    <created_by>${escapeXML(metadata.created_by)}</created_by>\n`;
  }
  if (metadata.created_at) {
    xml += `    <created_at>${metadata.created_at}</created_at>\n`;
  }
  xml += '  </metadata>\n\n';
  
  // Questions
  xml += '  <questions>\n';
  questions.forEach((q) => {
    xml += generateQuestionXML(q);
  });
  xml += '  </questions>\n';
  
  xml += '</assessment>';
  
  return xml;
}

function generateQuestionXML(question: Question): string {
  let xml = `    <question type="${question.type}" id="${question.id}">\n`;
  xml += `      <title>${escapeXML(question.title)}</title>\n`;
  xml += `      <description>${escapeXML(question.description)}</description>\n`;
  xml += `      <marks>${question.marks}</marks>\n`;
  if (question.difficulty) {
    xml += `      <difficulty>${question.difficulty}</difficulty>\n`;
  }
  xml += `      <domain>${question.domain}</domain>\n`;
  
  if (question.type === 'mcq' || question.type === 'core_subject_mcq') {
    xml += '      <options>\n';
    question.options.forEach((opt) => {
      xml += `        <option id="${opt.id}">${escapeXML(opt.text)}</option>\n`;
    });
    xml += '      </options>\n';
    xml += `      <correct_answer>${question.correct_answer}</correct_answer>\n`;
    if (question.explanation) {
      xml += `      <explanation>${escapeXML(question.explanation)}</explanation>\n`;
    }
  } else if (question.type === 'sql') {
    if (question.schema_context) {
      xml += `      <schema_context><![CDATA[\n${question.schema_context}\n      ]]></schema_context>\n`;
    }
    if (question.expected_output) {
      xml += `      <expected_output><![CDATA[\n${question.expected_output}\n      ]]></expected_output>\n`;
    }
    if (question.hints && question.hints.length > 0) {
      xml += '      <hints>\n';
      question.hints.forEach((hint) => {
        xml += `        <hint>${escapeXML(hint)}</hint>\n`;
      });
      xml += '      </hints>\n';
    }
  } else if (question.type === 'coding') {
    xml += `      <language>${question.language}</language>\n`;
    if (question.starter_code) {
      xml += `      <starter_code><![CDATA[\n${question.starter_code}\n      ]]></starter_code>\n`;
    }
    xml += '      <test_cases>\n';
    question.test_cases.forEach((tc) => {
      xml += '        <test_case>\n';
      xml += `          <input>${escapeXML(tc.input)}</input>\n`;
      xml += `          <expected_output>${escapeXML(tc.expected_output)}</expected_output>\n`;
      xml += `          <is_hidden>${tc.is_hidden}</is_hidden>\n`;
      xml += '        </test_case>\n';
    });
    xml += '      </test_cases>\n';
    if (question.constraints && question.constraints.length > 0) {
      xml += '      <constraints>\n';
      question.constraints.forEach((c) => {
        xml += `        <constraint>${escapeXML(c)}</constraint>\n`;
      });
      xml += '      </constraints>\n';
    }
  }
  
  xml += '    </question>\n\n';
  return xml;
}

function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ============================================================================
// FILE OPERATIONS
// ============================================================================

export function downloadXML(xml: string, filename: string): void {
  const blob = new Blob([xml], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function readXMLFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      resolve(content);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
