'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/providers/AuthContext';
import { testsApi, ApiError, type TestWithQuestions, type AttemptResult } from '@/lib/api';
import {
  CheckCircle2, AlertCircle, BookOpen, Clock,
  ChevronLeft, ChevronRight, Loader2, RefreshCw,
} from 'lucide-react';

type Phase = 'loading' | 'list' | 'intro' | 'taking' | 'submitting' | 'result' | 'error';

export default function TakeTestPage() {
  const { user, accessToken, refreshUser } = useAuth();

  const [phase, setPhase]           = useState<Phase>('loading');
  const [tests, setTests]           = useState<TestWithQuestions[]>([]);
  const [selectedTest, setSelectedTest] = useState<TestWithQuestions | null>(null);
  const [attemptId, setAttemptId]   = useState<number | null>(null);
  const [answers, setAnswers]       = useState<Record<number, string>>({});
  const [currentQ, setCurrentQ]     = useState(0);
  const [result, setResult]         = useState<AttemptResult | null>(null);
  const [errorMsg, setErrorMsg]     = useState('');
  const [pastAttempts, setPastAttempts] = useState<AttemptResult[]>([]);

  // ── Load tests for this student's domain ─────────────────────────────────────
  const loadTests = useCallback(async () => {
    if (!accessToken || !user?.domain) return;
    setPhase('loading');
    try {
      const [testsRes, attemptsRes] = await Promise.all([
        testsApi.getAll(accessToken, user.domain),
        testsApi.getMyAttempts(accessToken),
      ]);
      setTests(testsRes.data);
      setPastAttempts(attemptsRes.data);
      setPhase(testsRes.data.length === 0 ? 'error' : 'list');
      if (testsRes.data.length === 0) setErrorMsg('No active tests available for your domain yet.');
    } catch (err) {
      setErrorMsg(err instanceof ApiError ? err.message : 'Failed to load tests.');
      setPhase('error');
    }
  }, [accessToken, user?.domain]);

  useEffect(() => { loadTests(); }, [loadTests]);

  // ── Select a test and load its questions ──────────────────────────────────────
  const handleSelectTest = async (testId: number) => {
    if (!accessToken) return;
    setPhase('loading');
    try {
      const res = await testsApi.getById(accessToken, testId);
      setSelectedTest(res.data);
      setPhase('intro');
    } catch (err) {
      setErrorMsg(err instanceof ApiError ? err.message : 'Failed to load test.');
      setPhase('error');
    }
  };

  // ── Start attempt ─────────────────────────────────────────────────────────────
  const handleStartTest = async () => {
    if (!accessToken || !selectedTest) return;
    setPhase('loading');
    try {
      const res = await testsApi.startAttempt(accessToken, selectedTest.id);
      setAttemptId(res.data.id);
      setAnswers({});
      setCurrentQ(0);
      setPhase('taking');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to start test.';
      // If already attempted, still allow viewing result
      setErrorMsg(msg);
      setPhase('error');
    }
  };

  // ── Submit answers ────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!accessToken || !attemptId || !selectedTest) return;
    setPhase('submitting');

    // Map answers: { questionIndex -> answer } → { questionId -> answer }
    const mappedAnswers: Record<number, string> = {};
    selectedTest.questions.forEach((q, idx) => {
      if (answers[idx] !== undefined) mappedAnswers[q.id] = answers[idx];
    });

    try {
      const res = await testsApi.submitAttempt(accessToken, attemptId, mappedAnswers);
      setResult(res.data);
      // Refresh user in context so score/status updates everywhere immediately
      await refreshUser();
      setPhase('result');
    } catch (err) {
      setErrorMsg(err instanceof ApiError ? err.message : 'Failed to submit test.');
      setPhase('error');
    }
  };

  const questions = selectedTest?.questions ?? [];
  const progress  = questions.length > 0 ? ((currentQ + 1) / questions.length) * 100 : 0;
  const answered  = Object.keys(answers).length;

  // ── LOADING ───────────────────────────────────────────────────────────────────
  if (phase === 'loading' || phase === 'submitting') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground text-sm">
            {phase === 'submitting' ? 'Submitting your answers…' : 'Loading…'}
          </p>
        </div>
      </div>
    );
  }

  // ── ERROR ─────────────────────────────────────────────────────────────────────
  if (phase === 'error') {
    return (
      <div className="p-8 max-w-xl mx-auto">
        <Card className="border-destructive/30">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
            <p className="font-semibold text-foreground">{errorMsg}</p>
            <Button variant="outline" onClick={loadTests}>
              <RefreshCw className="w-4 h-4 mr-2" />Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── TEST LIST ─────────────────────────────────────────────────────────────────
  if (phase === 'list') {
    return (
      <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Assessment Tests</h1>
          <p className="text-muted-foreground mt-1">
            Available tests for your domain: <span className="font-semibold">{user?.domain}</span>
          </p>
        </div>

        {/* Past attempts summary */}
        {pastAttempts.length > 0 && (
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
            <CardContent className="pt-4 pb-4">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">Your best score</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                {Math.max(...pastAttempts.map((a) => a.score))}/{pastAttempts[0]?.total_marks ?? 100}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">
                {pastAttempts.length} attempt{pastAttempts.length !== 1 ? 's' : ''} taken
              </p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {tests.map((test) => {
            const attempt = pastAttempts.find((a) => a.test_id === test.id);
            return (
              <Card key={test.id} className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleSelectTest(test.id)}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">{test.title}</h3>
                        <Badge variant="outline" className="text-xs">{test.domain}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />{test.questions?.length ?? '?'} questions
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />{test.duration_minutes} min
                        </span>
                        <span>Pass: {test.passing_marks}/{test.total_marks}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {attempt ? (
                        <div>
                          <p className={`text-lg font-bold ${attempt.score >= test.passing_marks ? 'text-green-600' : 'text-yellow-600'}`}>
                            {attempt.score}/{test.total_marks}
                          </p>
                          <p className="text-xs text-muted-foreground">Last score</p>
                        </div>
                      ) : (
                        <Badge className="bg-primary/10 text-primary">Not taken</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // ── INTRO ─────────────────────────────────────────────────────────────────────
  if (phase === 'intro' && selectedTest) {
    const pastAttempt = pastAttempts.find((a) => a.test_id === selectedTest.id);
    return (
      <div className="p-8 max-w-xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{selectedTest.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {selectedTest.description && (
              <p className="text-sm text-muted-foreground">{selectedTest.description}</p>
            )}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-muted rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Questions</p>
                <p className="font-bold text-foreground">{selectedTest.questions.length}</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="font-bold text-foreground">{selectedTest.duration_minutes} min</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Total Marks</p>
                <p className="font-bold text-foreground">{selectedTest.total_marks}</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Passing Marks</p>
                <p className="font-bold text-green-600">{selectedTest.passing_marks}</p>
              </div>
            </div>

            {pastAttempt && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 p-3">
                <p className="text-xs font-medium text-yellow-800 dark:text-yellow-300">
                  Previous attempt: {pastAttempt.score}/{pastAttempt.total_marks} ({pastAttempt.percentage}%)
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-0.5">
                  Retaking will create a new attempt record.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={handleStartTest} className="flex-1">
                <BookOpen className="w-4 h-4 mr-2" />
                {pastAttempt ? 'Retake Test' : 'Start Test'}
              </Button>
              <Button variant="outline" onClick={() => setPhase('list')}>Back</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── TAKING ────────────────────────────────────────────────────────────────────
  if (phase === 'taking' && selectedTest) {
    const q = questions[currentQ];
    return (
      <div className="p-6 md:p-8 max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-muted-foreground">
                Question {currentQ + 1} of {questions.length}
              </span>
              <span className="text-sm font-semibold text-foreground">
                {answered}/{questions.length} answered
              </span>
            </div>
            <Progress value={progress} className="mb-4" />
            <CardTitle className="text-lg leading-snug">{q.question_text}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Question Content - Handle both MCQ and Coding */}
            {(() => {
              // Parse question to check if it's a coding question
              let questionData: any = null;
              try {
                questionData = JSON.parse(q.question_text);
              } catch {
                questionData = null;
              }

              const isCodingQuestion = questionData?.type === 'coding';

              if (isCodingQuestion) {
                // CODING QUESTION - Split Screen Layout
                return (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ minHeight: '500px' }}>
                    {/* LEFT SIDE - Problem Description */}
                    <div className="space-y-4 overflow-y-auto pr-4 lg:border-r max-h-[600px]">
                      <div>
                        <h3 className="text-lg font-semibold mb-2">{questionData.title}</h3>
                        <Badge variant="outline" className="mb-4">
                          {questionData.difficulty || 'medium'}
                        </Badge>
                        <div className="prose prose-sm max-w-none">
                          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{questionData.description}</p>
                        </div>
                      </div>

                      {/* Test Cases */}
                      {questionData.test_cases && questionData.test_cases.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm">Example Test Cases:</h4>
                          {questionData.test_cases
                            .filter((tc: any) => !tc.is_hidden)
                            .map((tc: any, idx: number) => (
                              <Card key={idx} className="p-3 bg-muted/30">
                                <div className="space-y-1 text-xs font-mono">
                                  <div>
                                    <span className="font-semibold">Input:</span> <code>{tc.input}</code>
                                  </div>
                                  <div>
                                    <span className="font-semibold">Output:</span> <code>{tc.expected_output}</code>
                                  </div>
                                </div>
                              </Card>
                            ))}
                        </div>
                      )}

                      {/* Constraints */}
                      {questionData.constraints && questionData.constraints.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm">Constraints:</h4>
                          <ul className="list-disc list-inside text-xs space-y-1 text-muted-foreground">
                            {questionData.constraints.map((c: string, idx: number) => (
                              <li key={idx}>{c}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* RIGHT SIDE - Code Editor */}
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-semibold">Your Solution</Label>
                        <Badge variant="secondary" className="text-xs">
                          {questionData.language || 'javascript'}
                        </Badge>
                      </div>
                      <Textarea
                        value={answers[currentQ] || questionData.starter_code || ''}
                        onChange={(e) => setAnswers((p) => ({ ...p, [currentQ]: e.target.value }))}
                        placeholder="Write your code here..."
                        className="flex-1 font-mono text-sm resize-none min-h-[450px]"
                        style={{
                          fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, "Courier New", monospace',
                          fontSize: '13px',
                          lineHeight: '1.6',
                          tabSize: 2,
                        }}
                      />
                      <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded text-xs text-blue-700 dark:text-blue-300">
                        💡 This question will be manually evaluated by the admin
                      </div>
                    </div>
                  </div>
                );
              }

              // REGULAR MCQ QUESTION
              return (
                <RadioGroup
                  value={answers[currentQ] ?? ''}
                  onValueChange={(val) => setAnswers((p) => ({ ...p, [currentQ]: val }))}
                >
                  <div className="space-y-2">
                    {q.options.map((opt, i) => {
                      // Handle both string options and object options {id, text}
                      // IMPORTANT: Store the ID (a, b, c, d) not the text, to match correct_answer in DB
                      const optionValue = typeof opt === 'string' ? opt : opt.id;
                      const optionText = typeof opt === 'string' ? opt : opt.text;
                      
                      return (
                        <div key={i}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            answers[currentQ] === optionValue
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:bg-muted/50'
                          }`}
                          onClick={() => setAnswers((p) => ({ ...p, [currentQ]: optionValue }))}
                        >
                          <RadioGroupItem value={optionValue} id={`opt-${i}`} />
                          <Label htmlFor={`opt-${i}`} className="cursor-pointer flex-1">{optionText}</Label>
                        </div>
                      );
                    })}
                  </div>
                </RadioGroup>
              );
            })()}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setCurrentQ((q) => q - 1)}
                disabled={currentQ === 0} className="flex-1">
                <ChevronLeft className="w-4 h-4 mr-1" />Previous
              </Button>
              {currentQ < questions.length - 1 ? (
                <Button onClick={() => setCurrentQ((q) => q + 1)} className="flex-1">
                  Next<ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={answered < questions.length}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  Submit Test
                </Button>
              )}
            </div>

            {/* Question navigator */}
            <div className="flex flex-wrap gap-1.5 pt-2">
              {questions.map((_, i) => (
                <button key={i}
                  onClick={() => setCurrentQ(i)}
                  className={`w-8 h-8 rounded text-xs font-medium transition-colors ${
                    i === currentQ
                      ? 'bg-primary text-primary-foreground'
                      : answers[i] !== undefined
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── RESULT ────────────────────────────────────────────────────────────────────
  if (phase === 'result' && result && selectedTest) {
    const passed    = result.score >= selectedTest.passing_marks;
    const pct       = result.percentage ?? Math.round((result.score / result.total_marks) * 100);
    const hasCoding = (result as any).has_coding_questions;
    const codingCount = (result as any).coding_questions_count || 0;

    return (
      <div className="p-8 max-w-xl mx-auto">
        <Card>
          <CardHeader className="text-center pb-2">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${
              passed ? 'bg-green-100 dark:bg-green-900/30' : 'bg-yellow-100 dark:bg-yellow-900/30'
            }`}>
              <CheckCircle2 className={`w-9 h-9 ${passed ? 'text-green-600' : 'text-yellow-500'}`} />
            </div>
            <CardTitle className="text-2xl">
              {hasCoding ? 'Test Submitted!' : passed ? '🎉 Test Passed!' : 'Test Completed'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Coding questions pending notice */}
            {hasCoding && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20 p-4 text-sm">
                <p className="font-semibold text-blue-800 dark:text-blue-300 mb-1">
                  ⏳ Coding Questions Under Review
                </p>
                <p className="text-blue-700 dark:text-blue-400">
                  {codingCount} coding {codingCount === 1 ? 'question' : 'questions'} will be manually reviewed by the admin. 
                  Your final score will be updated after the review is complete.
                </p>
              </div>
            )}

            {/* Score display */}
            <div className={`rounded-xl p-6 text-center ${
              passed ? 'bg-green-50 dark:bg-green-950/20' : 'bg-yellow-50 dark:bg-yellow-950/20'
            }`}>
              <p className="text-xs text-muted-foreground mb-1">
                {hasCoding ? 'Current Score (MCQ Only)' : 'Your Score'}
              </p>
              <p className={`text-5xl font-bold ${passed ? 'text-green-600' : 'text-yellow-600'}`}>
                {result.score}
              </p>
              <p className="text-sm text-muted-foreground mt-1">out of {result.total_marks}</p>
              <p className={`text-lg font-semibold mt-2 ${passed ? 'text-green-600' : 'text-yellow-600'}`}>
                {pct}%
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-muted rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Passing Mark</p>
                <p className="font-bold">{selectedTest.passing_marks}/{result.total_marks}</p>
              </div>
              <div className="bg-muted rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Status</p>
                <p className={`font-bold ${passed ? 'text-green-600' : 'text-yellow-600'}`}>
                  {hasCoding ? 'Pending Review' : passed ? 'Passed ✓' : 'Not Passed'}
                </p>
              </div>
            </div>

            {!hasCoding && passed ? (
              <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 p-3 text-sm text-green-700 dark:text-green-400">
                ✓ Jobs and Applications are now unlocked. Your score has been saved to your profile.
              </div>
            ) : !hasCoding ? (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 p-3 text-sm text-yellow-700 dark:text-yellow-400">
                You need {selectedTest.passing_marks - result.score} more marks to pass. You can retake the test.
              </div>
            ) : null}

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => {
                setPhase('intro');
                setResult(null);
                setAnswers({});
                setCurrentQ(0);
              }}>
                Retake Test
              </Button>
              <Button className="flex-1" onClick={() => {
                setPhase('list');
                setResult(null);
                loadTests();
              }}>
                Back to Tests
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
