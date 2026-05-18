'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/components/providers/AuthContext';
import { adminReviewApi, ApiError, type CodingSubmission } from '@/lib/api';
import {
  CheckCircle2, Clock, Loader2, AlertCircle, Code2,
  User, Calendar, Award, FileText, ChevronRight,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

type Phase = 'loading' | 'list' | 'error';

export default function ReviewSubmissionsPage() {
  const { accessToken } = useAuth();

  const [phase, setPhase] = useState<Phase>('loading');
  const [submissions, setSubmissions] = useState<CodingSubmission[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed'>('pending');

  // Grading dialog state
  const [selectedSubmission, setSelectedSubmission] = useState<CodingSubmission | null>(null);
  const [marks, setMarks] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [grading, setGrading] = useState(false);

  // Load submissions
  const loadSubmissions = async () => {
    if (!accessToken) return;
    setPhase('loading');
    try {
      const res = await adminReviewApi.getPendingSubmissions(accessToken, filter);
      setSubmissions(res.data);
      setPhase('list');
    } catch (err) {
      setErrorMsg(err instanceof ApiError ? err.message : 'Failed to load submissions.');
      setPhase('error');
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, [accessToken, filter]);

  // Open grading dialog
  const handleOpenGrading = (submission: CodingSubmission) => {
    setSelectedSubmission(submission);
    setMarks(submission.marks_obtained?.toString() || '');
    setFeedback(submission.admin_feedback || '');
  };

  // Submit grade
  const handleSubmitGrade = async () => {
    if (!accessToken || !selectedSubmission) return;
    
    const marksNum = parseInt(marks);
    if (isNaN(marksNum) || marksNum < 0 || marksNum > selectedSubmission.max_marks) {
      alert(`Marks must be between 0 and ${selectedSubmission.max_marks}`);
      return;
    }

    setGrading(true);
    try {
      await adminReviewApi.gradeSubmission(accessToken, selectedSubmission.id, marksNum, feedback);
      setSelectedSubmission(null);
      setMarks('');
      setFeedback('');
      loadSubmissions(); // Reload list
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to submit grade.');
    } finally {
      setGrading(false);
    }
  };

  // Parse question data
  const parseQuestionData = (questionText: string) => {
    try {
      return JSON.parse(questionText);
    } catch {
      return null;
    }
  };

  // ── LOADING ───────────────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground text-sm">Loading submissions…</p>
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
            <Button variant="outline" onClick={loadSubmissions}>Try again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── LIST ──────────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Review Coding Submissions</h1>
        <p className="text-muted-foreground mt-1">
          Grade student coding answers and provide feedback
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'pending' ? 'default' : 'outline'}
          onClick={() => setFilter('pending')}
          size="sm"
        >
          <Clock className="w-4 h-4 mr-2" />
          Pending
        </Button>
        <Button
          variant={filter === 'reviewed' ? 'default' : 'outline'}
          onClick={() => setFilter('reviewed')}
          size="sm"
        >
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Reviewed
        </Button>
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          size="sm"
        >
          All
        </Button>
      </div>

      {/* Submissions list */}
      {submissions.length === 0 ? (
        <Card>
          <CardContent className="pt-8 pb-8 text-center">
            <Code2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No submissions found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {submissions.map((submission) => {
            const questionData = parseQuestionData(submission.question_text || '');
            const isPending = !submission.reviewed_at;

            return (
              <Card
                key={submission.id}
                className={`hover:shadow-md transition-shadow cursor-pointer ${
                  isPending ? 'border-l-4 border-l-yellow-500' : 'border-l-4 border-l-green-500'
                }`}
                onClick={() => handleOpenGrading(submission)}
              >
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      {/* Header */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground">
                          {questionData?.title || 'Coding Question'}
                        </h3>
                        <Badge variant={isPending ? 'default' : 'secondary'}>
                          {isPending ? 'Pending Review' : 'Reviewed'}
                        </Badge>
                        {questionData?.difficulty && (
                          <Badge variant="outline" className="text-xs">
                            {questionData.difficulty}
                          </Badge>
                        )}
                      </div>

                      {/* Student info */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {submission.student_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {submission.test_title}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(submission.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Marks info */}
                      <div className="flex items-center gap-2 text-sm">
                        <Award className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Max Marks:</span>
                        <span className="font-semibold">{submission.max_marks}</span>
                        {submission.marks_obtained !== null && (
                          <>
                            <span className="text-muted-foreground">|</span>
                            <span className="text-muted-foreground">Awarded:</span>
                            <span className="font-semibold text-green-600">
                              {submission.marks_obtained}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Grading Dialog */}
      <Dialog open={!!selectedSubmission} onOpenChange={(open) => !open && setSelectedSubmission(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {parseQuestionData(selectedSubmission?.question_text || '')?.title || 'Grade Coding Submission'}
            </DialogTitle>
            <DialogDescription>
              Review the student's code and provide marks and feedback
            </DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-4">
              {/* Student info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Student</p>
                  <p className="font-semibold">{selectedSubmission.student_name}</p>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Test</p>
                  <p className="font-semibold">{selectedSubmission.test_title}</p>
                </div>
              </div>

              {/* Question details */}
              {(() => {
                const qData = parseQuestionData(selectedSubmission.question_text || '');
                if (qData) {
                  return (
                    <Card className="bg-muted/30">
                      <CardHeader>
                        <CardTitle className="text-base">Problem Description</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm whitespace-pre-wrap">{qData.description}</p>
                        
                        {qData.test_cases && qData.test_cases.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-semibold">Test Cases:</p>
                            {qData.test_cases
                              .filter((tc: any) => !tc.is_hidden)
                              .map((tc: any, idx: number) => (
                                <div key={idx} className="text-xs font-mono bg-background p-2 rounded">
                                  <div>Input: {tc.input}</div>
                                  <div>Output: {tc.expected_output}</div>
                                </div>
                              ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                }
                return null;
              })()}

              {/* Student's code */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Student's Solution</Label>
                <Textarea
                  value={selectedSubmission.code_answer}
                  readOnly
                  className="font-mono text-sm min-h-[300px] bg-muted/30"
                  style={{
                    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, "Courier New", monospace',
                    fontSize: '13px',
                    lineHeight: '1.6',
                  }}
                />
              </div>

              {/* Grading inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="marks">
                    Marks Obtained (Max: {selectedSubmission.max_marks})
                  </Label>
                  <Input
                    id="marks"
                    type="number"
                    min="0"
                    max={selectedSubmission.max_marks}
                    value={marks}
                    onChange={(e) => setMarks(e.target.value)}
                    placeholder="Enter marks"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="feedback">Admin Feedback (Optional)</Label>
                <Textarea
                  id="feedback"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Provide feedback to the student..."
                  className="min-h-[100px]"
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSubmitGrade}
                  disabled={grading || !marks}
                  className="flex-1"
                >
                  {grading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Submit Grade
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedSubmission(null)}
                  disabled={grading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
