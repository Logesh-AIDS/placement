'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/providers/AuthContext';
import { settingsApi, testsApi, ApiError } from '@/lib/api';
import { testsService, getDataModeInfo } from '@/lib/services';
import { Plus, Trash2, AlertCircle, Settings2, Upload, Download, FileText, CheckCircle, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { parseAssessmentXML, readXMLFile, downloadXML, type Assessment, type ValidationError } from '@/lib/utils/xmlAssessment';

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  domain: string;
}

export default function CreateTestPage() {
  const { toast } = useToast();
  const { accessToken } = useAuth();
  const [testName, setTestName] = useState('');
  const [domain, setDomain] = useState('Web');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get data mode info for display
  const dataMode = getDataModeInfo();

  // ── Passing score setting ─────────────────────────────────────────────────
  const [passingScore, setPassingScore]     = useState('50');
  const [isSavingScore, setIsSavingScore]   = useState(false);
  const [scoreLoaded, setScoreLoaded]       = useState(false);

  const loadSettings = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await settingsApi.get(accessToken);
      setPassingScore(res.data.passing_score ?? '50');
      setScoreLoaded(true);
    } catch { setScoreLoaded(true); }
  }, [accessToken]);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const handleSavePassingScore = async () => {
    if (!accessToken) return;
    const val = Number(passingScore);
    if (isNaN(val) || val < 0 || val > 100) {
      toast({ title: 'Invalid score', description: 'Must be 0–100.', variant: 'destructive' }); return;
    }
    setIsSavingScore(true);
    try {
      await settingsApi.update(accessToken, { passing_score: val });
      toast({ title: 'Passing score updated', description: `Students now need ${val}/100 to access jobs.` });
    } catch (err) {
      toast({ title: 'Failed', description: err instanceof ApiError ? err.message : 'Try again.', variant: 'destructive' });
    } finally {
      setIsSavingScore(false);
    }
  };

  const [formData, setFormData] = useState({
    question: '',
    option1: '',
    option2: '',
    option3: '',
    option4: '',
    correctAnswer: 'option1',
  });

  // XML Import/Export State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showPasteDialog, setShowPasteDialog] = useState(false);
  const [pastedXML, setPastedXML] = useState('');
  const [importedAssessment, setImportedAssessment] = useState<Assessment | null>(null);
  const [importErrors, setImportErrors] = useState<ValidationError[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);

  const handleAddQuestion = () => {
    if (!formData.question || !formData.option1 || !formData.option2 || !formData.option3 || !formData.option4) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    const newQuestion: Question = {
      id: editingQuestionId || `q_${Date.now()}`,
      question: formData.question,
      options: [formData.option1, formData.option2, formData.option3, formData.option4],
      correctAnswer: formData[formData.correctAnswer as keyof typeof formData] as string,
      domain,
    };

    if (editingQuestionId) {
      setQuestions(
        questions.map((q) => (q.id === editingQuestionId ? newQuestion : q))
      );
      setEditingQuestionId(null);
    } else {
      setQuestions([...questions, newQuestion]);
    }

    // Reset form
    setFormData({
      question: '',
      option1: '',
      option2: '',
      option3: '',
      option4: '',
      correctAnswer: 'option1',
    });

    toast({
      title: 'Success',
      description: editingQuestionId ? 'Question updated' : 'Question added',
    });
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestionId(question.id);
    setFormData({
      question: question.question,
      option1: question.options[0],
      option2: question.options[1],
      option3: question.options[2],
      option4: question.options[3],
      correctAnswer: `option${question.options.indexOf(question.correctAnswer) + 1}`,
    });
  };

  const handleDeleteQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
    if (editingQuestionId === id) {
      setEditingQuestionId(null);
      setFormData({
        question: '',
        option1: '',
        option2: '',
        option3: '',
        option4: '',
        correctAnswer: 'option1',
      });
    }
  };

  const handleSubmitTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testName || questions.length === 0) {
      toast({
        title: 'Error',
        description: 'Please enter test name and add at least one question',
        variant: 'destructive',
      });
      return;
    }

    if (!accessToken) {
      toast({
        title: 'Error',
        description: 'You must be logged in to create a test',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Prepare test data for API
      const testData = {
        name: testName,
        domain: domain as 'Web' | 'ML' | 'DSA',
        questions: questions.map(q => ({
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          domain: q.domain
        })),
        timeLimit: 60, // Default 60 minutes
        passingScore: Number(passingScore) || 70
      };

      // Call service layer (will route to mock or real API)
      const response = await testsService.create(accessToken, testData);

      if (response.success) {
        toast({
          title: 'Test Created Successfully',
          description: `"${testName}" has been created with ${questions.length} questions.`,
        });

        // Reset form
        setTestName('');
        setDomain('Web');
        setQuestions([]);
        setFormData({
          question: '',
          option1: '',
          option2: '',
          option3: '',
          option4: '',
          correctAnswer: 'option1',
        });
      } else {
        throw new Error('Failed to create test');
      }
    } catch (err: any) {
      console.error('Error creating test:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to create test. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── XML Import Handlers ───────────────────────────────────────────────────
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handlePasteClick = () => {
    setShowPasteDialog(true);
    setPastedXML('');
  };

  const handlePasteXML = () => {
    if (!pastedXML.trim()) {
      toast({
        title: 'Error',
        description: 'Please paste XML content',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { assessment, errors } = parseAssessmentXML(pastedXML);

      if (errors.length > 0) {
        setImportErrors(errors);
        setImportedAssessment(null);
        setShowPasteDialog(false);
        setShowImportDialog(true);
      } else if (assessment) {
        setImportedAssessment(assessment);
        setImportErrors([]);
        setShowPasteDialog(false);
        setShowImportDialog(true);
      }
    } catch (err: any) {
      toast({
        title: 'Parse Failed',
        description: err.message || 'Failed to parse XML content',
        variant: 'destructive',
      });
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.xml')) {
      toast({
        title: 'Invalid File',
        description: 'Please select an XML file',
        variant: 'destructive',
      });
      return;
    }

    try {
      const xmlContent = await readXMLFile(file);
      const { assessment, errors } = parseAssessmentXML(xmlContent);

      if (errors.length > 0) {
        setImportErrors(errors);
        setImportedAssessment(null);
        setShowImportDialog(true);
      } else if (assessment) {
        setImportedAssessment(assessment);
        setImportErrors([]);
        setShowImportDialog(true);
      }
    } catch (err: any) {
      toast({
        title: 'Import Failed',
        description: err.message || 'Failed to read XML file',
        variant: 'destructive',
      });
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirmImport = async () => {
    if (!importedAssessment || !accessToken) return;

    setIsImporting(true);
    setImportSuccess(false);
    
    try {
      // Generate XML from parsed assessment
      const xmlContent = generateXMLFromAssessment(importedAssessment);
      
      const response = await testsApi.importFromXML(accessToken, xmlContent);

      // Set success state
      setImportSuccess(true);
      
      // Show success toast with longer duration
      toast({
        title: '✅ Test Created Successfully!',
        description: `"${importedAssessment.metadata.title}" has been imported with ${importedAssessment.questions.length} questions. The test is now available.`,
        duration: 5000, // Show for 5 seconds
      });

      // Wait a moment to show success state, then close
      setTimeout(() => {
        setShowImportDialog(false);
        setImportedAssessment(null);
        setImportErrors([]);
        setImportSuccess(false);
      }, 2000);
      
    } catch (err: any) {
      console.error('Import error:', err);
      toast({
        title: '❌ Import Failed',
        description: err.message || 'Failed to import test. Please try again.',
        variant: 'destructive',
        duration: 5000,
      });
      setImportSuccess(false);
    } finally {
      setIsImporting(false);
    }
  };

  const generateXMLFromAssessment = (assessment: Assessment): string => {
    const { metadata, questions } = assessment;
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<assessment version="1.0">\n';
    xml += '  <metadata>\n';
    xml += `    <title>${escapeXML(metadata.title)}</title>\n`;
    xml += `    <domain>${metadata.domain}</domain>\n`;
    if (metadata.description) xml += `    <description>${escapeXML(metadata.description)}</description>\n`;
    xml += `    <duration_minutes>${metadata.duration_minutes}</duration_minutes>\n`;
    xml += `    <passing_marks>${metadata.passing_marks}</passing_marks>\n`;
    xml += `    <total_marks>${metadata.total_marks}</total_marks>\n`;
    xml += '  </metadata>\n';
    xml += '  <questions>\n';
    
    questions.forEach((q) => {
      xml += `    <question type="${q.type}" id="${q.id}">\n`;
      xml += `      <title>${escapeXML(q.title)}</title>\n`;
      xml += `      <description>${escapeXML(q.description)}</description>\n`;
      xml += `      <marks>${q.marks}</marks>\n`;
      xml += `      <domain>${q.domain}</domain>\n`;
      
      if (q.type === 'mcq' || q.type === 'core_subject_mcq') {
        xml += '      <options>\n';
        q.options.forEach((opt) => {
          xml += `        <option id="${opt.id}">${escapeXML(opt.text)}</option>\n`;
        });
        xml += '      </options>\n';
        xml += `      <correct_answer>${q.correct_answer}</correct_answer>\n`;
      }
      
      xml += '    </question>\n';
    });
    
    xml += '  </questions>\n';
    xml += '</assessment>';
    
    return xml;
  };

  const escapeXML = (str: string): string => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  const handleDownloadTemplate = () => {
    const templateXML = `<?xml version="1.0" encoding="UTF-8"?>
<assessment version="1.0">
  <metadata>
    <title>Sample Web Development Test</title>
    <domain>Web</domain>
    <description>A sample assessment to demonstrate XML structure</description>
    <duration_minutes>60</duration_minutes>
    <passing_marks>70</passing_marks>
    <total_marks>100</total_marks>
  </metadata>
  
  <questions>
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
      <explanation>React is a JavaScript library developed by Facebook for building user interfaces.</explanation>
    </question>

    <question type="mcq" id="q2">
      <title>HTTP Status Code</title>
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
    </question>
  </questions>
</assessment>`;

    downloadXML(templateXML, 'assessment-template.xml');
    toast({
      title: 'Template Downloaded',
      description: 'Use this template to create your own assessments with AI',
    });
  };

  return (
    <div className="p-8 space-y-6">
      {/* Data Mode Indicator (Development Helper) */}
      {process.env.NODE_ENV === 'development' && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {dataMode.emoji} <strong>{dataMode.mode}</strong> - {dataMode.description}
          </AlertDescription>
        </Alert>
      )}

      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Create Assessment Test
        </h1>
        <p className="text-muted-foreground">
          Build a new assessment test for students
        </p>
      </div>

      {/* XML Import/Export Actions */}
      <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <CardTitle className="text-base">XML Import/Export</CardTitle>
          </div>
          <CardDescription>
            Import assessments from XML files or download a template to generate questions with AI (ChatGPT, Claude)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleImportClick} variant="outline" className="gap-2">
              <Upload className="w-4 h-4" />
              Import from File
            </Button>
            <Button onClick={handlePasteClick} variant="outline" className="gap-2">
              <FileText className="w-4 h-4" />
              Paste XML Code
            </Button>
            <Button onClick={handleDownloadTemplate} variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Download Template
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xml"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            💡 <strong>Tip:</strong> Download the template, ask ChatGPT/Claude to generate questions following the schema, then import via file or paste the XML code directly.
          </p>
        </CardContent>
      </Card>

      {/* ── Passing Score Setting ─────────────────────────────────────────── */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">Assessment Passing Score</CardTitle>
          </div>
          <CardDescription>
            Students must score at or above this threshold to unlock Jobs and Applications pages.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            <div className="space-y-2 flex-1 max-w-xs">
              <Label htmlFor="passingScore">Passing Score (0–100)</Label>
              <Input
                id="passingScore"
                type="number"
                min="0"
                max="100"
                value={passingScore}
                onChange={(e) => setPassingScore(e.target.value)}
                disabled={!scoreLoaded || isSavingScore}
                placeholder="e.g. 50"
              />
            </div>
            <Button onClick={handleSavePassingScore} disabled={!scoreLoaded || isSavingScore}>
              {isSavingScore ? 'Saving…' : 'Save'}
            </Button>
            <p className="text-xs text-muted-foreground pb-1">
              Current: <span className="font-semibold text-foreground">{passingScore}/100</span>
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Question Editor */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Details</CardTitle>
              <CardDescription>Basic information about the test</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="testName">Test Name *</Label>
                <Input
                  id="testName"
                  placeholder="e.g., Web Development Fundamentals"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="domain">Domain *</Label>
                <Select value={domain} onValueChange={setDomain} disabled={isSubmitting}>
                  <SelectTrigger id="domain">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Web">Web Development</SelectItem>
                    <SelectItem value="DSA">Data Structures & Algorithms</SelectItem>
                    <SelectItem value="ML">Machine Learning</SelectItem>
                    <SelectItem value="Cloud">Cloud Computing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                {editingQuestionId ? 'Edit Question' : 'Add Question'}
              </CardTitle>
              <CardDescription>
                Add multiple choice questions to the test
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="question">Question *</Label>
                <Textarea
                  id="question"
                  placeholder="Enter the question text..."
                  value={formData.question}
                  onChange={(e) =>
                    setFormData({ ...formData, question: e.target.value })
                  }
                  disabled={isSubmitting}
                  rows={2}
                />
              </div>

              <div className="space-y-3">
                <Label>Options *</Label>
                {[1, 2, 3, 4].map((num) => (
                  <div key={num} className="flex gap-2">
                    <Input
                      placeholder={`Option ${num}`}
                      value={formData[`option${num}` as keyof typeof formData] as string}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          [`option${num}`]: e.target.value,
                        })
                      }
                      disabled={isSubmitting}
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="correctAnswer">Correct Answer *</Label>
                <Select
                  value={formData.correctAnswer}
                  onValueChange={(value) =>
                    setFormData({ ...formData, correctAnswer: value })
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="correctAnswer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="option1">Option 1</SelectItem>
                    <SelectItem value="option2">Option 2</SelectItem>
                    <SelectItem value="option3">Option 3</SelectItem>
                    <SelectItem value="option4">Option 4</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleAddQuestion}
                className="w-full"
                disabled={isSubmitting}
              >
                <Plus className="mr-2 h-4 w-4" />
                {editingQuestionId ? 'Update Question' : 'Add Question'}
              </Button>

              {editingQuestionId && (
                <Button
                  onClick={() => {
                    setEditingQuestionId(null);
                    setFormData({
                      question: '',
                      option1: '',
                      option2: '',
                      option3: '',
                      option4: '',
                      correctAnswer: 'option1',
                    });
                  }}
                  variant="outline"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  Cancel Edit
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Questions List */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Questions ({questions.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {questions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No questions added yet
                </p>
              ) : (
                <>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {questions.map((q, index) => (
                      <div
                        key={q.id}
                        className={`p-3 border rounded-lg ${
                          editingQuestionId === q.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <span className="text-xs font-semibold text-foreground">
                            Q{index + 1}
                          </span>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditQuestion(q)}
                              disabled={isSubmitting}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteQuestion(q.id)}
                              disabled={isSubmitting}
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-foreground line-clamp-2 mb-2">
                          {q.question}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {q.domain}
                        </Badge>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={handleSubmitTest}
                    className="w-full"
                    disabled={isSubmitting || questions.length === 0 || !testName}
                  >
                    {isSubmitting ? 'Creating...' : 'Create Test'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {questions.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                {questions.length} question{questions.length !== 1 ? 's' : ''} ready. Click{' '}
                <span className="font-semibold">Create Test</span> to finalize.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      {/* Paste XML Dialog */}
      <Dialog open={showPasteDialog} onOpenChange={setShowPasteDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Paste XML Code</DialogTitle>
            <DialogDescription>
              Paste your XML assessment code below. You can copy it from ChatGPT/Claude or any text editor.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            <Textarea
              value={pastedXML}
              onChange={(e) => setPastedXML(e.target.value)}
              placeholder="<?xml version=&quot;1.0&quot; encoding=&quot;UTF-8&quot;?>
<assessment version=&quot;1.0&quot;>
  <metadata>
    <title>Your Test Title</title>
    <domain>Web</domain>
    ...
  </metadata>
  <questions>
    ...
  </questions>
</assessment>"
              className="h-[400px] font-mono text-sm resize-none"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handlePasteXML} disabled={!pastedXML.trim()}>
              Parse & Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* XML Import Preview Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {importErrors.length > 0 ? 'Import Errors' : 'Preview Imported Assessment'}
            </DialogTitle>
            <DialogDescription>
              {importErrors.length > 0
                ? 'The XML file contains errors. Please fix them and try again.'
                : 'Review the assessment before importing it into the system.'}
            </DialogDescription>
          </DialogHeader>

          {importErrors.length > 0 ? (
            <div className="space-y-3">
              {importErrors.map((error, index) => (
                <Alert key={index} variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{error.code}:</strong> {error.message}
                    {error.element && <span className="block text-xs mt-1">Element: {error.element}</span>}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          ) : importedAssessment ? (
            <div className="space-y-4">
              {/* Metadata Preview */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Test Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="font-semibold">Title:</span> {importedAssessment.metadata.title}
                    </div>
                    <div>
                      <span className="font-semibold">Domain:</span>{' '}
                      <Badge variant="outline">{importedAssessment.metadata.domain}</Badge>
                    </div>
                    <div>
                      <span className="font-semibold">Duration:</span> {importedAssessment.metadata.duration_minutes} minutes
                    </div>
                    <div>
                      <span className="font-semibold">Total Marks:</span> {importedAssessment.metadata.total_marks}
                    </div>
                    <div>
                      <span className="font-semibold">Passing Marks:</span> {importedAssessment.metadata.passing_marks}
                    </div>
                    <div>
                      <span className="font-semibold">Questions:</span> {importedAssessment.questions.length}
                    </div>
                  </div>
                  {importedAssessment.metadata.description && (
                    <div className="pt-2">
                      <span className="font-semibold">Description:</span>
                      <p className="text-muted-foreground">{importedAssessment.metadata.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Questions Preview */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Questions Preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                  {importedAssessment.questions.map((q, index) => (
                    <div key={q.id} className="p-3 border rounded-lg space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="text-xs">
                              Q{index + 1}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {q.type.toUpperCase()}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{q.marks} marks</span>
                          </div>
                          <p className="font-semibold text-sm">{q.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{q.description}</p>
                        </div>
                      </div>

                      {(q.type === 'mcq' || q.type === 'core_subject_mcq') && (
                        <div className="space-y-1 pl-4">
                          {q.options.map((opt) => (
                            <div
                              key={opt.id}
                              className={`text-xs p-2 rounded ${
                                opt.id === q.correct_answer
                                  ? 'bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-700'
                                  : 'bg-muted'
                              }`}
                            >
                              <span className="font-semibold">{opt.id})</span> {opt.text}
                              {opt.id === q.correct_answer && (
                                <CheckCircle className="inline-block w-3 h-3 ml-2 text-green-600" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)} disabled={isImporting}>
              Cancel
            </Button>
            {importErrors.length === 0 && importedAssessment && (
              <Button onClick={handleConfirmImport} disabled={isImporting || importSuccess}>
                {importSuccess ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Success!
                  </>
                ) : isImporting ? (
                  'Importing...'
                ) : (
                  'Import Test'
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
