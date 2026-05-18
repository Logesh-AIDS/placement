# XML Import/Export Implementation Guide

## Overview

The XML Import/Export feature allows admins to:
1. **Import** assessments from XML files
2. **Export** existing tests to XML format
3. **Generate** questions using AI (ChatGPT, Claude) by providing the XML schema
4. **Download** XML templates for easy assessment creation

## Architecture

### Backend Implementation

#### New API Endpoints

**1. POST `/api/tests/import-xml`** (Admin only)
- Accepts XML content in request body
- Parses and validates XML structure
- Creates test and questions in database
- Returns created test metadata

**2. GET `/api/tests/:id/export-xml`** (Admin only)
- Fetches test and questions from database
- Converts to XML format
- Returns XML file for download

#### Dependencies Added

```bash
npm install xml2js
npm install --save-dev @types/xml2js
```

#### Files Modified

**`backend/src/controllers/tests.controller.ts`**
- Added `importTestFromXML()` function
- Added `exportTestToXML()` function
- Imports `xml2js` library for parsing/generation

**`backend/src/routes/tests.routes.ts`**
- Added POST `/import-xml` route
- Added GET `/:id/export-xml` route
- Both routes require admin authentication

**`backend/package.json`**
- Added `xml2js` dependency
- Added `@types/xml2js` dev dependency

### Frontend Implementation

#### New Features

**1. Import from XML**
- File upload button
- XML validation
- Preview dialog with parsed assessment
- Error display for invalid XML
- Confirmation before import

**2. Download Template**
- Pre-built XML template
- Includes sample MCQ questions
- Ready for AI generation

**3. Preview Dialog**
- Shows test metadata (title, domain, duration, marks)
- Lists all questions with options
- Highlights correct answers
- Displays validation errors

#### Files Modified

**`frontend/app/dashboard/admin/create-test/page.tsx`**
- Added XML import/export UI
- Added file upload handler
- Added preview dialog
- Added template download function
- Integrated with XML utilities

**`frontend/lib/api.ts`**
- Added `testsApi.importFromXML()` endpoint
- Added `testsApi.exportToXML()` endpoint

**`frontend/lib/utils/xmlAssessment.ts`** (Already created)
- XML parsing functions
- XML generation functions
- Validation logic
- File operations

## User Workflow

### Importing an Assessment

1. **Admin clicks "Import from XML"**
   - File picker opens
   - Admin selects `.xml` file

2. **Frontend validates and parses XML**
   - Uses `parseAssessmentXML()` utility
   - Checks for syntax errors
   - Validates schema structure

3. **Preview dialog shows parsed data**
   - Test metadata displayed
   - All questions listed
   - Correct answers highlighted
   - Admin reviews before confirming

4. **Admin confirms import**
   - XML sent to backend API
   - Backend creates test in database
   - Success toast notification
   - Dialog closes

### Generating with AI

1. **Admin clicks "Download Template"**
   - Sample XML file downloads
   - Contains example questions

2. **Admin opens ChatGPT/Claude**
   - Pastes XML schema from `ASSESSMENT_XML_SCHEMA.md`
   - Provides requirements (topic, difficulty, count)
   - AI generates valid XML

3. **Admin saves AI-generated XML**
   - Saves as `.xml` file
   - Returns to platform

4. **Admin imports generated XML**
   - Follows import workflow above
   - Reviews AI-generated questions
   - Confirms and creates test

### Exporting an Assessment

1. **Admin navigates to test management**
   - Views list of existing tests
   - Selects test to export

2. **Admin clicks "Export to XML"**
   - Backend fetches test data
   - Converts to XML format
   - Browser downloads file

3. **Admin can share or modify**
   - Share with other admins
   - Modify in text editor
   - Re-import modified version

## XML Schema Support

### Supported Question Types

1. **MCQ (Multiple Choice Questions)**
   - 2-6 options
   - Single correct answer
   - Optional explanation

2. **Core Subject MCQ**
   - Same as MCQ
   - Different categorization

3. **SQL Questions** (Stored as JSON in DB)
   - Schema context
   - Expected output
   - Hints

4. **Coding Questions** (Stored as JSON in DB)
   - Language specification
   - Starter code
   - Test cases
   - Constraints

### Validation Rules

**Metadata Validation:**
- Title: Required, 1-255 characters
- Domain: Must be Web, DSA, ML, or Cloud
- Duration: 1-300 minutes
- Passing marks ≤ Total marks

**Question Validation:**
- At least 1 question required
- Question IDs must be unique
- Type must be valid (mcq, core_subject_mcq, sql, coding)
- Marks must be positive integer

**MCQ Validation:**
- Must have 2-6 options
- Correct answer must reference valid option ID
- Option IDs must be unique within question

## Error Handling

### Frontend Errors

**XML Parse Errors:**
```typescript
{
  code: 'XML_PARSE_ERROR',
  message: 'Invalid XML syntax: ...',
}
```

**Schema Validation Errors:**
```typescript
{
  code: 'MISSING_METADATA',
  message: 'Missing <metadata> section',
}
```

**Domain Validation Errors:**
```typescript
{
  code: 'INVALID_DOMAIN',
  message: 'Invalid domain: XYZ. Must be Web, DSA, ML, or Cloud',
}
```

### Backend Errors

**400 Bad Request:**
- Invalid XML syntax
- Missing required fields
- Invalid domain value
- No questions provided

**404 Not Found:**
- Test not found (for export)

**500 Internal Server Error:**
- Database errors
- Unexpected parsing errors

## Database Schema

### Tests Table
```sql
CREATE TABLE tests (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  domain VARCHAR(50) NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL,
  total_marks INTEGER NOT NULL,
  passing_marks INTEGER NOT NULL,
  created_by INTEGER REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Questions Table
```sql
CREATE TABLE questions (
  id SERIAL PRIMARY KEY,
  test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer VARCHAR(255),
  marks INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Note:** SQL and Coding questions are stored as JSON in `question_text` field. In production, you should create separate tables for these question types.

## Security Considerations

### Authentication & Authorization
- All endpoints require authentication
- Import/Export restricted to admin role only
- Token validation on every request

### Input Validation
- XML content sanitized before parsing
- SQL injection prevention via parameterized queries
- XSS prevention via XML escaping

### File Upload Security
- Only `.xml` files accepted
- File size limits enforced
- Content-type validation

## Performance Considerations

### Backend Optimization
- Batch insert for questions
- Transaction rollback on error
- Efficient XML parsing with `xml2js`

### Frontend Optimization
- Client-side XML validation before API call
- Preview dialog prevents unnecessary API calls
- File reading uses FileReader API (non-blocking)

### Database Optimization
- Foreign key constraints for data integrity
- Cascade delete for test cleanup
- Indexes on frequently queried fields

## Testing Strategy

### Unit Tests (Recommended)

**Backend:**
```typescript
describe('XML Import', () => {
  it('should parse valid XML', async () => {
    const xml = '<assessment>...</assessment>';
    const result = await importTestFromXML(xml);
    expect(result.success).toBe(true);
  });

  it('should reject invalid domain', async () => {
    const xml = '<assessment><metadata><domain>Invalid</domain>...';
    await expect(importTestFromXML(xml)).rejects.toThrow();
  });
});
```

**Frontend:**
```typescript
describe('XML Parsing', () => {
  it('should parse valid assessment XML', () => {
    const xml = '<?xml version="1.0"?>...';
    const { assessment, errors } = parseAssessmentXML(xml);
    expect(errors).toHaveLength(0);
    expect(assessment).toBeDefined();
  });

  it('should detect missing metadata', () => {
    const xml = '<?xml version="1.0"?><assessment><questions>...';
    const { assessment, errors } = parseAssessmentXML(xml);
    expect(errors).toContainEqual(
      expect.objectContaining({ code: 'MISSING_METADATA' })
    );
  });
});
```

### Integration Tests (Recommended)

```typescript
describe('XML Import/Export Flow', () => {
  it('should export and re-import test', async () => {
    // Create test
    const test = await createTest({ title: 'Test 1', ... });
    
    // Export to XML
    const xml = await exportTestToXML(test.id);
    
    // Import XML
    const imported = await importTestFromXML(xml);
    
    // Verify data matches
    expect(imported.title).toBe(test.title);
    expect(imported.questions.length).toBe(test.questions.length);
  });
});
```

## Future Enhancements

### Phase 2 Features

1. **JSON Support**
   - Import/export in JSON format
   - Easier for programmatic generation

2. **CSV Support**
   - Bulk import from spreadsheets
   - Template with columns for question data

3. **Question Bank**
   - Reusable question library
   - Tag-based organization
   - Search and filter

4. **Version Control**
   - Track changes to tests
   - Rollback to previous versions
   - Diff view for changes

5. **AI Integration**
   - Direct AI generation in platform
   - No need to download/upload
   - Real-time preview

6. **Collaborative Editing**
   - Multiple admins edit same test
   - Real-time sync
   - Conflict resolution

7. **Advanced Validation**
   - Duplicate question detection
   - Difficulty balance checking
   - Marks distribution analysis

### Database Schema Evolution

**Separate Tables for Question Types:**

```sql
-- MCQ Questions
CREATE TABLE mcq_questions (
  id SERIAL PRIMARY KEY,
  question_id INTEGER REFERENCES questions(id),
  options JSONB NOT NULL,
  correct_answer VARCHAR(255) NOT NULL,
  explanation TEXT
);

-- SQL Questions
CREATE TABLE sql_questions (
  id SERIAL PRIMARY KEY,
  question_id INTEGER REFERENCES questions(id),
  schema_context TEXT,
  expected_output TEXT,
  hints JSONB
);

-- Coding Questions
CREATE TABLE coding_questions (
  id SERIAL PRIMARY KEY,
  question_id INTEGER REFERENCES questions(id),
  language VARCHAR(50) NOT NULL,
  starter_code TEXT,
  test_cases JSONB NOT NULL,
  constraints JSONB
);
```

## Troubleshooting

### Common Issues

**Issue: "Invalid XML syntax"**
- **Cause:** Malformed XML structure
- **Solution:** Validate XML with online validator, check for unclosed tags

**Issue: "Missing required metadata fields"**
- **Cause:** Incomplete metadata section
- **Solution:** Ensure all required fields present (title, domain, duration, marks)

**Issue: "Question IDs not unique"**
- **Cause:** Duplicate question IDs in XML
- **Solution:** Make all question IDs unique (q1, q2, q3, etc.)

**Issue: "Correct answer not found in options"**
- **Cause:** correct_answer doesn't match any option ID
- **Solution:** Verify correct_answer matches an option's id attribute

**Issue: "Import succeeds but questions not showing"**
- **Cause:** SQL/Coding questions stored as JSON
- **Solution:** Update frontend to parse JSON question_text for these types

## AI Prompt Templates

### ChatGPT/Claude Prompt

```
Generate an assessment XML file following this schema:

[Paste ASSESSMENT_XML_SCHEMA.md content here]

Requirements:
- Topic: React Hooks and State Management
- Domain: Web
- Number of questions: 10
- Question types: 7 MCQ, 2 SQL, 1 Coding
- Difficulty: 3 easy, 5 medium, 2 hard
- Duration: 60 minutes
- Total marks: 100
- Passing marks: 70

Please generate a complete, valid XML file with realistic questions covering:
- useState and useEffect hooks
- Context API
- Redux basics
- Component lifecycle
- State management patterns

Ensure all questions are technically accurate and follow the schema exactly.
```

### Example AI Response

The AI will generate a complete XML file like:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<assessment version="1.0">
  <metadata>
    <title>React Hooks and State Management</title>
    <domain>Web</domain>
    <description>Comprehensive assessment covering React Hooks, Context API, and Redux</description>
    <duration_minutes>60</duration_minutes>
    <passing_marks>70</passing_marks>
    <total_marks>100</total_marks>
  </metadata>
  
  <questions>
    <!-- AI generates 10 questions here -->
  </questions>
</assessment>
```

## Conclusion

The XML Import/Export feature provides a production-grade solution for:
- **Rapid assessment creation** using AI
- **Easy sharing** of test templates
- **Flexible editing** outside the platform
- **Scalable architecture** for future enhancements

The implementation follows best practices:
- ✅ Proper validation and error handling
- ✅ Security through authentication and authorization
- ✅ Clean separation of concerns (parsing, validation, storage)
- ✅ User-friendly preview and confirmation flow
- ✅ Comprehensive documentation

**Next Steps:**
1. Test the import/export functionality
2. Create sample XML files for different domains
3. Document AI prompt templates for each domain
4. Train admins on the workflow
5. Gather feedback for Phase 2 enhancements
