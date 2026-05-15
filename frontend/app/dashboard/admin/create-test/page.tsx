'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/providers/AuthContext';
import { settingsApi, ApiError } from '@/lib/api';
import { testsService, getDataModeInfo } from '@/lib/services';
import { Plus, Trash2, AlertCircle, Settings2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

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
    </div>
  );
}
