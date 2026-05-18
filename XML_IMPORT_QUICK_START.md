# XML Import/Export - Quick Start Guide

## For Admins: How to Use XML Import/Export

### Method 1: Download Template and Modify

**Step 1:** Click "Download Template" button
- A sample XML file will download
- Contains 2 example MCQ questions

**Step 2:** Open the XML file in a text editor
- Use VS Code, Notepad++, or any text editor
- You'll see the XML structure

**Step 3:** Modify the template
- Change the title, domain, duration
- Add/remove questions
- Update options and correct answers

**Step 4:** Save and import
- Save your changes
- Click "Import from XML"
- Select your modified file
- Review the preview
- Click "Import Test"

### Method 2: Generate with AI (Recommended)

**Step 1:** Download the template
- Click "Download Template"
- Open the file to see the structure

**Step 2:** Open ChatGPT or Claude
- Go to ChatGPT (chat.openai.com) or Claude (claude.ai)
- Start a new conversation

**Step 3:** Use this prompt

```
Generate an assessment XML file following this structure:

<?xml version="1.0" encoding="UTF-8"?>
<assessment version="1.0">
  <metadata>
    <title>Test Title Here</title>
    <domain>Web</domain> <!-- Web, DSA, ML, or Cloud -->
    <description>Test description</description>
    <duration_minutes>60</duration_minutes>
    <passing_marks>70</passing_marks>
    <total_marks>100</total_marks>
  </metadata>
  
  <questions>
    <question type="mcq" id="q1">
      <title>Question Title</title>
      <description>Question text here</description>
      <marks>10</marks>
      <difficulty>easy</difficulty> <!-- easy, medium, or hard -->
      <domain>Web</domain>
      <options>
        <option id="a">Option A text</option>
        <option id="b">Option B text</option>
        <option id="c">Option C text</option>
        <option id="d">Option D text</option>
      </options>
      <correct_answer>a</correct_answer>
      <explanation>Why this is correct</explanation>
    </question>
    
    <!-- Add more questions -->
  </questions>
</assessment>

Requirements:
- Topic: [YOUR TOPIC HERE, e.g., "JavaScript ES6 Features"]
- Domain: [Web/DSA/ML/Cloud]
- Number of questions: [e.g., 10]
- Difficulty: [e.g., "5 easy, 3 medium, 2 hard"]
- Total marks: [e.g., 100]
- Duration: [e.g., 60 minutes]

Generate realistic, technically accurate questions.
```

**Step 4:** Copy AI-generated XML
- AI will generate complete XML
- Copy the entire XML content

**Step 5:** Save as XML file
- Create new file: `my-test.xml`
- Paste the AI-generated content
- Save the file

**Step 6:** Import to platform
- Go to Create Test page
- Click "Import from XML"
- Select your saved XML file
- Review the preview
- Click "Import Test"

Done! Your test is created with all questions.

## Example AI Prompts

### For Web Development Test

```
Generate an assessment XML for Web Development covering:
- HTML5 semantic elements
- CSS Flexbox and Grid
- JavaScript ES6 features
- React basics

Requirements:
- 10 MCQ questions
- 5 easy, 3 medium, 2 hard
- 60 minutes duration
- 100 total marks
- Domain: Web
```

### For Data Structures Test

```
Generate an assessment XML for Data Structures covering:
- Arrays and Linked Lists
- Stacks and Queues
- Trees and Graphs
- Sorting algorithms

Requirements:
- 8 MCQ questions
- 4 easy, 3 medium, 1 hard
- 45 minutes duration
- 80 total marks
- Domain: DSA
```

### For Machine Learning Test

```
Generate an assessment XML for Machine Learning covering:
- Supervised vs Unsupervised learning
- Linear and Logistic Regression
- Decision Trees and Random Forests
- Neural Networks basics

Requirements:
- 12 MCQ questions
- 6 easy, 4 medium, 2 hard
- 75 minutes duration
- 120 total marks
- Domain: ML
```

## XML Structure Cheat Sheet

### Metadata Section (Required)

```xml
<metadata>
  <title>Your Test Title</title>
  <domain>Web</domain> <!-- Web, DSA, ML, or Cloud -->
  <description>Optional description</description>
  <duration_minutes>60</duration_minutes>
  <passing_marks>70</passing_marks>
  <total_marks>100</total_marks>
</metadata>
```

### MCQ Question (Most Common)

```xml
<question type="mcq" id="q1">
  <title>Question Title</title>
  <description>What is React?</description>
  <marks>10</marks>
  <difficulty>easy</difficulty>
  <domain>Web</domain>
  <options>
    <option id="a">A library</option>
    <option id="b">A framework</option>
    <option id="c">A database</option>
    <option id="d">A language</option>
  </options>
  <correct_answer>a</correct_answer>
  <explanation>React is a JavaScript library</explanation>
</question>
```

### SQL Question (Advanced)

```xml
<question type="sql" id="q2">
  <title>Write a JOIN Query</title>
  <description>Fetch all users with their orders</description>
  <marks>20</marks>
  <difficulty>medium</difficulty>
  <domain>Web</domain>
  <schema_context>
    <![CDATA[
    users(id, name, email)
    orders(id, user_id, total)
    ]]>
  </schema_context>
  <expected_output>
    <![CDATA[
    SELECT u.name, o.total
    FROM users u
    JOIN orders o ON u.id = o.user_id;
    ]]>
  </expected_output>
  <hints>
    <hint>Use INNER JOIN</hint>
    <hint>Match user_id with id</hint>
  </hints>
</question>
```

### Coding Question (Advanced)

```xml
<question type="coding" id="q3">
  <title>Binary Search</title>
  <description>Implement binary search algorithm</description>
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
  </test_cases>
  <constraints>
    <constraint>Array is sorted</constraint>
    <constraint>All elements unique</constraint>
  </constraints>
</question>
```

## Common Mistakes to Avoid

### ❌ Wrong Domain Value
```xml
<domain>JavaScript</domain> <!-- WRONG -->
```
✅ **Correct:**
```xml
<domain>Web</domain> <!-- Must be: Web, DSA, ML, or Cloud -->
```

### ❌ Mismatched Correct Answer
```xml
<options>
  <option id="a">Option A</option>
  <option id="b">Option B</option>
</options>
<correct_answer>c</correct_answer> <!-- WRONG: 'c' doesn't exist -->
```
✅ **Correct:**
```xml
<correct_answer>a</correct_answer> <!-- Must match an option id -->
```

### ❌ Duplicate Question IDs
```xml
<question type="mcq" id="q1">...</question>
<question type="mcq" id="q1">...</question> <!-- WRONG: duplicate id -->
```
✅ **Correct:**
```xml
<question type="mcq" id="q1">...</question>
<question type="mcq" id="q2">...</question> <!-- Unique ids -->
```

### ❌ Missing Required Fields
```xml
<question type="mcq" id="q1">
  <description>What is React?</description>
  <!-- WRONG: Missing title, marks, domain -->
</question>
```
✅ **Correct:**
```xml
<question type="mcq" id="q1">
  <title>React Question</title>
  <description>What is React?</description>
  <marks>10</marks>
  <domain>Web</domain>
  <!-- All required fields present -->
</question>
```

### ❌ Marks Don't Add Up
```xml
<metadata>
  <total_marks>100</total_marks>
</metadata>
<questions>
  <question><marks>10</marks></question>
  <question><marks>20</marks></question>
  <!-- Total: 30, but metadata says 100 -->
</questions>
```
✅ **Correct:**
```xml
<!-- Sum of question marks should equal total_marks -->
<metadata>
  <total_marks>30</total_marks>
</metadata>
```

## Validation Errors and Solutions

### Error: "Invalid XML syntax"
**Cause:** Malformed XML
**Solution:** 
- Check for unclosed tags
- Ensure proper nesting
- Use XML validator online

### Error: "Missing <metadata> section"
**Cause:** No metadata element
**Solution:** Add complete metadata section with all required fields

### Error: "Invalid domain"
**Cause:** Domain value not in allowed list
**Solution:** Use only: Web, DSA, ML, or Cloud

### Error: "At least one question is required"
**Cause:** Empty questions section
**Solution:** Add at least one question

### Error: "Duplicate question id"
**Cause:** Two questions have same id
**Solution:** Make all question ids unique (q1, q2, q3, etc.)

### Error: "Correct answer not found in options"
**Cause:** correct_answer doesn't match any option id
**Solution:** Verify correct_answer matches an option's id attribute

## Tips for Success

### 1. Start Small
- Begin with 2-3 questions
- Test the import process
- Gradually increase complexity

### 2. Use AI Effectively
- Be specific in your prompts
- Provide clear requirements
- Review AI-generated content before importing

### 3. Validate Before Import
- Check XML syntax
- Verify all required fields
- Ensure marks add up correctly

### 4. Preview Carefully
- Review all questions in preview dialog
- Check correct answers are highlighted
- Verify metadata is correct

### 5. Keep Templates
- Save successful XML files
- Reuse as templates for similar tests
- Build a library of test templates

## Need Help?

### Resources
- Full schema documentation: `ASSESSMENT_XML_SCHEMA.md`
- Implementation details: `XML_IMPORT_EXPORT_IMPLEMENTATION.md`
- Assessment architecture: `ASSESSMENT_ARCHITECTURE.md`

### Support
- Check validation errors in preview dialog
- Review error messages carefully
- Refer to schema documentation for correct format

## Quick Checklist

Before importing, verify:
- [ ] XML file has `.xml` extension
- [ ] All required metadata fields present
- [ ] Domain is Web, DSA, ML, or Cloud
- [ ] At least one question included
- [ ] All question IDs are unique
- [ ] Correct answers match option IDs
- [ ] Marks sum equals total_marks
- [ ] Duration is reasonable (1-300 minutes)
- [ ] Passing marks ≤ Total marks

---

**Ready to create your first test?**
1. Click "Download Template"
2. Open ChatGPT/Claude
3. Use the AI prompt above
4. Import the generated XML
5. Review and confirm

That's it! You've created a complete assessment in minutes. 🎉
