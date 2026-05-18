# Assessment XML Schema Documentation

## Overview

This XML schema allows admins to:
1. **Export** existing tests to XML format
2. **Import** tests from XML files
3. **Generate** questions using AI (ChatGPT, Claude, etc.) by providing the schema
4. **Share** test templates across teams

## XML Schema Structure

### Complete Example

```xml
<?xml version="1.0" encoding="UTF-8"?>
<assessment version="1.0">
  <metadata>
    <title>Web Development Fundamentals</title>
    <domain>Web</domain>
    <description>Comprehensive test covering HTML, CSS, JavaScript, and React basics</description>
    <duration_minutes>60</duration_minutes>
    <passing_marks>70</passing_marks>
    <total_marks>100</total_marks>
    <created_by>Admin</created_by>
    <created_at>2024-01-15T10:00:00Z</created_at>
  </metadata>
  
  <questions>
    <!-- MCQ Question -->
    <question type="mcq" id="q1">
      <title>What is React?</title>
      <description>Choose the correct answer about React</description>
      <marks>10</marks>
      <difficulty>easy</difficulty>
      <domain>Web</domain>
      <options>
        <option id="a">A JavaScript library for building user interfaces</option>
        <option id="b">A CSS framework</option>
        <option id="c">A database management system</option>
        <option id="d">A backend framework</option>
      </options>
      <correct_answer>a</correct_answer>
      <explanation>React is a JavaScript library developed by Facebook for building user interfaces, particularly single-page applications.</explanation>
    </question>

    <!-- Core Subject MCQ -->
    <question type="core_subject_mcq" id="q2">
      <title>HTTP Status Codes</title>
      <description>Which HTTP status code indicates a successful request?</description>
      <marks>5</marks>
      <difficulty>easy</difficulty>
      <domain>Web</domain>
      <options>
        <option id="a">404</option>
        <option id="b">500</option>
        <option id="c">200</option>
        <option id="d">301</option>
      </options>
      <correct_answer>c</correct_answer>
      <explanation>HTTP 200 OK indicates that the request has succeeded.</explanation>
    </question>

    <!-- SQL Question -->
    <question type="sql" id="q3">
      <title>Write a JOIN Query</title>
      <description>Write a SQL query to fetch all users with their orders</description>
      <marks>20</marks>
      <difficulty>medium</difficulty>
      <domain>Web</domain>
      <schema_context>
        <![CDATA[
        users(id, name, email)
        orders(id, user_id, total, created_at)
        ]]>
      </schema_context>
      <expected_output>
        <![CDATA[
        SELECT u.name, u.email, o.total, o.created_at
        FROM users u
        INNER JOIN orders o ON u.id = o.user_id
        ORDER BY o.created_at DESC;
        ]]>
      </expected_output>
      <hints>
        <hint>Use INNER JOIN to combine tables</hint>
        <hint>Match user_id with id</hint>
      </hints>
    </question>

    <!-- Coding Question -->
    <question type="coding" id="q4">
      <title>Implement Binary Search</title>
      <description>Write a function to perform binary search on a sorted array</description>
      <marks>30</marks>
      <difficulty>hard</difficulty>
      <domain>DSA</domain>
      <language>javascript</language>
      <starter_code>
        <![CDATA[
function binarySearch(arr, target) {
  // Your code here
}
        ]]>
      </starter_code>
      <test_cases>
        <test_case>
          <input>[1, 2, 3, 4, 5], 3</input>
          <expected_output>2</expected_output>
          <is_hidden>false</is_hidden>
        </test_case>
        <test_case>
          <input>[1, 2, 3, 4, 5], 6</input>
          <expected_output>-1</expected_output>
          <is_hidden>false</is_hidden>
        </test_case>
        <test_case>
          <input>[10, 20, 30, 40, 50], 30</input>
          <expected_output>2</expected_output>
          <is_hidden>true</is_hidden>
        </test_case>
      </test_cases>
      <constraints>
        <constraint>1 &lt;= arr.length &lt;= 10^4</constraint>
        <constraint>Array is sorted in ascending order</constraint>
        <constraint>All elements are unique</constraint>
      </constraints>
    </question>
  </questions>
</assessment>
```

## Schema Elements

### Root Element: `<assessment>`

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| version | string | Yes | Schema version (currently "1.0") |

### `<metadata>` Section

| Element | Type | Required | Description |
|---------|------|----------|-------------|
| title | string | Yes | Test name |
| domain | enum | Yes | Web, DSA, ML, Cloud |
| description | string | No | Test description |
| duration_minutes | integer | Yes | Time limit in minutes |
| passing_marks | integer | Yes | Minimum marks to pass |
| total_marks | integer | Yes | Maximum possible marks |
| created_by | string | No | Creator name |
| created_at | datetime | No | Creation timestamp (ISO 8601) |

### `<question>` Element

#### Common Attributes

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| type | enum | Yes | mcq, core_subject_mcq, sql, coding |
| id | string | Yes | Unique question identifier |

#### Common Elements

| Element | Type | Required | Description |
|---------|------|----------|-------------|
| title | string | Yes | Question title |
| description | string | Yes | Question text |
| marks | integer | Yes | Points for this question |
| difficulty | enum | No | easy, medium, hard |
| domain | enum | Yes | Web, DSA, ML, Cloud |

### MCQ-Specific Elements

| Element | Type | Required | Description |
|---------|------|----------|-------------|
| options | container | Yes | Contains option elements |
| option | string | Yes | Answer choice (id attribute: a, b, c, d) |
| correct_answer | string | Yes | ID of correct option |
| explanation | string | No | Explanation of correct answer |

### SQL-Specific Elements

| Element | Type | Required | Description |
|---------|------|----------|-------------|
| schema_context | CDATA | No | Database schema description |
| expected_output | CDATA | No | Sample correct query |
| hints | container | No | Contains hint elements |
| hint | string | No | Helpful hint for students |

### Coding-Specific Elements

| Element | Type | Required | Description |
|---------|------|----------|-------------|
| language | string | Yes | javascript, python, java, cpp |
| starter_code | CDATA | No | Initial code template |
| test_cases | container | Yes | Contains test_case elements |
| test_case | container | Yes | Single test case |
| input | string | Yes | Test input |
| expected_output | string | Yes | Expected result |
| is_hidden | boolean | No | Hide from students (default: false) |
| constraints | container | No | Contains constraint elements |
| constraint | string | No | Problem constraint |

## AI Prompt Template

Use this prompt with ChatGPT/Claude to generate assessments:

```
Generate an assessment XML file following this schema:

[Paste the XML schema above]

Requirements:
- Topic: [Your topic, e.g., "React Hooks"]
- Domain: [Web/DSA/ML/Cloud]
- Number of questions: [e.g., 10]
- Question types: [e.g., "5 MCQ, 3 SQL, 2 Coding"]
- Difficulty: [easy/medium/hard]
- Duration: [e.g., 60 minutes]

Please generate a complete, valid XML file with realistic questions.
```

## Validation Rules

### Required Validations

1. **XML Structure**
   - Valid XML syntax
   - Root element must be `<assessment>`
   - Version attribute must be present

2. **Metadata**
   - Title: 1-255 characters
   - Domain: Must be Web, DSA, ML, or Cloud
   - Duration: 1-300 minutes
   - Passing marks ≤ Total marks

3. **Questions**
   - At least 1 question required
   - Question IDs must be unique
   - Type must be valid (mcq, core_subject_mcq, sql, coding)

4. **MCQ Questions**
   - Must have 2-6 options
   - Correct answer must reference valid option ID
   - Option IDs must be unique within question

5. **SQL Questions**
   - Schema context recommended
   - Expected output recommended for grading

6. **Coding Questions**
   - Language must be specified
   - At least 1 test case required
   - Test case inputs/outputs must be valid

### Optional Validations

1. **Marks Distribution**
   - Sum of question marks should equal total_marks
   - Warning if mismatch (not error)

2. **Difficulty Balance**
   - Recommend mix of easy/medium/hard
   - Warning if all same difficulty

3. **Domain Consistency**
   - All questions should match test domain
   - Warning if mismatch

## Import Process

### Step 1: Upload XML File
```
Admin uploads XML file → Frontend validates file size/type → Sends to backend
```

### Step 2: Parse & Validate
```
Backend parses XML → Validates schema → Checks business rules → Returns errors if any
```

### Step 3: Preview
```
Frontend displays parsed questions → Admin reviews → Can edit before saving
```

### Step 4: Save
```
Admin confirms → Backend creates test + questions → Returns success
```

## Export Process

### Step 1: Select Test
```
Admin selects existing test → Clicks "Export to XML"
```

### Step 2: Generate XML
```
Backend fetches test + questions → Converts to XML format → Returns file
```

### Step 3: Download
```
Frontend triggers download → File saved as "test-name-YYYY-MM-DD.xml"
```

## Error Handling

### Common Errors

| Error Code | Description | Solution |
|------------|-------------|----------|
| XML_PARSE_ERROR | Invalid XML syntax | Check XML structure |
| INVALID_SCHEMA | Missing required elements | Add missing fields |
| INVALID_DOMAIN | Unknown domain value | Use Web/DSA/ML/Cloud |
| INVALID_QUESTION_TYPE | Unknown question type | Use mcq/sql/coding |
| DUPLICATE_QUESTION_ID | Question IDs not unique | Make IDs unique |
| MARKS_MISMATCH | Sum ≠ total_marks | Adjust question marks |
| NO_QUESTIONS | No questions found | Add at least 1 question |
| INVALID_OPTIONS | MCQ has <2 options | Add more options |
| INVALID_CORRECT_ANSWER | Correct answer not in options | Fix correct_answer |

### Error Response Format

```json
{
  "success": false,
  "error": "INVALID_SCHEMA",
  "message": "Missing required element: <title>",
  "details": {
    "line": 5,
    "column": 10,
    "element": "metadata"
  }
}
```

## Best Practices

### 1. Question IDs
- Use descriptive IDs: `q1_react_basics`, `q2_sql_joins`
- Keep consistent format across test
- Avoid special characters

### 2. CDATA Sections
- Use CDATA for code blocks
- Use CDATA for SQL queries
- Prevents XML parsing issues

### 3. Marks Distribution
- Easy questions: 5-10 marks
- Medium questions: 10-20 marks
- Hard questions: 20-30 marks

### 4. Test Duration
- 1 minute per mark (rule of thumb)
- Add 10-15 minutes buffer
- Example: 100 marks = 110-115 minutes

### 5. Difficulty Balance
- 40% easy, 40% medium, 20% hard
- Start with easy questions
- End with hard questions

## Example Use Cases

### Use Case 1: Generate with AI

```
1. Copy XML schema
2. Open ChatGPT/Claude
3. Paste prompt: "Generate React assessment with 10 MCQ questions"
4. AI generates valid XML
5. Download XML file
6. Import to platform
```

### Use Case 2: Share Test Template

```
1. Admin A creates test
2. Export to XML
3. Share XML file with Admin B
4. Admin B imports XML
5. Customize questions
6. Save as new test
```

### Use Case 3: Bulk Import

```
1. Prepare multiple XML files
2. Import each file
3. Platform creates tests automatically
4. Review and activate tests
```

## Migration from Current Format

### Current Format (JSON)
```json
{
  "name": "Web Test",
  "questions": [
    {
      "question": "What is React?",
      "options": ["Library", "Framework"],
      "correctAnswer": "Library"
    }
  ]
}
```

### New Format (XML)
```xml
<assessment version="1.0">
  <metadata>
    <title>Web Test</title>
  </metadata>
  <questions>
    <question type="mcq" id="q1">
      <title>What is React?</title>
      <options>
        <option id="a">Library</option>
        <option id="b">Framework</option>
      </options>
      <correct_answer>a</correct_answer>
    </question>
  </questions>
</assessment>
```

## Future Enhancements

1. **JSON Support**: Import/export in JSON format
2. **CSV Support**: Bulk import from spreadsheets
3. **Version Control**: Track changes to tests
4. **Templates**: Pre-built test templates
5. **AI Integration**: Direct AI generation in platform
6. **Collaborative Editing**: Multiple admins edit same test
7. **Question Bank**: Reusable question library

---

**This schema is production-ready and AI-friendly. Use it to generate assessments quickly and efficiently.**
