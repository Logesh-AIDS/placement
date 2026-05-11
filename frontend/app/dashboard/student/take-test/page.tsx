'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const mockQuestions = [
  {
    id: 1,
    question: 'What is the time complexity of binary search?',
    options: ['O(n)', 'O(log n)', 'O(n²)', 'O(n log n)'],
    correctAnswer: 'O(log n)',
  },
  {
    id: 2,
    question: 'Which data structure is used to implement a function call stack?',
    options: ['Queue', 'Stack', 'Tree', 'Graph'],
    correctAnswer: 'Stack',
  },
  {
    id: 3,
    question: 'What is the main purpose of middleware in web applications?',
    options: [
      'To store data',
      'To handle requests between client and server',
      'To create databases',
      'To render HTML',
    ],
    correctAnswer: 'To handle requests between client and server',
  },
  {
    id: 4,
    question: 'Which sorting algorithm has the best average time complexity?',
    options: ['Bubble Sort', 'Quick Sort', 'Selection Sort', 'Insertion Sort'],
    correctAnswer: 'Quick Sort',
  },
  {
    id: 5,
    question: 'What does REST stand for in API design?',
    options: [
      'Remote End Server Testing',
      'Representational State Transfer',
      'Required Endpoint Service Token',
      'Response Evaluation System Tool',
    ],
    correctAnswer: 'Representational State Transfer',
  },
];

export default function TakeTestPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [submitted, setSubmitted] = useState(false);
  const [testStarted, setTestStarted] = useState(false);

  const question = mockQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / mockQuestions.length) * 100;

  const handleSelectAnswer = (option: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion]: option,
    }));
  };

  const handleNext = () => {
    if (currentQuestion < mockQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const calculateScore = () => {
    let correct = 0;
    mockQuestions.forEach((q) => {
      if (answers[q.id - 1] === q.correctAnswer) {
        correct++;
      }
    });
    return Math.round((correct / mockQuestions.length) * 1000);
  };

  const score = submitted ? calculateScore() : 0;
  const correctAnswers = Object.entries(answers).filter(
    ([index, answer]) =>
      answer === mockQuestions[parseInt(index)].correctAnswer
  ).length;

  if (!testStarted) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Assessment Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-foreground mb-3">
                Test Details:
              </h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>• <span className="font-semibold">Questions:</span> {mockQuestions.length}</li>
                <li>• <span className="font-semibold">Duration:</span> Unlimited</li>
                <li>• <span className="font-semibold">Type:</span> Multiple Choice</li>
                <li>• <span className="font-semibold">Topics:</span> DSA, Web, Cloud Computing</li>
              </ul>
            </div>
            <div className="bg-secondary p-4 rounded-lg">
              <p className="text-sm text-secondary-foreground">
                This assessment will evaluate your knowledge across multiple domains. Your score will be used to match you with relevant job opportunities.
              </p>
            </div>
            <Button
              onClick={() => setTestStarted(true)}
              className="w-full"
              size="lg"
            >
              Start Test
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-primary" />
            </div>
            <CardTitle className="text-2xl">Test Submitted</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-secondary p-6 rounded-lg text-center">
              <p className="text-sm text-secondary-foreground mb-2">
                Your Score
              </p>
              <p className="text-4xl font-bold text-foreground">{score}</p>
              <p className="text-sm text-muted-foreground mt-2">
                out of 1000
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-card border border-border p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Correct Answers</p>
                  <p className="text-2xl font-bold text-foreground">
                    {correctAnswers}/{mockQuestions.length}
                  </p>
                </div>
                <div className="bg-card border border-border p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Accuracy</p>
                  <p className="text-2xl font-bold text-foreground">
                    {Math.round((correctAnswers / mockQuestions.length) * 100)}%
                  </p>
                </div>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your score has been saved and will be used for job matching. Higher scores unlock more job opportunities.
              </AlertDescription>
            </Alert>

            <Button
              onClick={() => {
                setTestStarted(false);
                setCurrentQuestion(0);
                setAnswers({});
                setSubmitted(false);
              }}
              className="w-full"
              variant="outline"
            >
              Retake Test
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-muted-foreground">
              Question {currentQuestion + 1} of {mockQuestions.length}
            </span>
            <span className="text-sm font-semibold text-foreground">
              {Math.round(progress)}%
            </span>
          </div>
          <Progress value={progress} className="mb-4" />
          <CardTitle className="text-xl">{question.question}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup
            value={answers[currentQuestion] || ''}
            onValueChange={handleSelectAnswer}
          >
            <div className="space-y-3">
              {question.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={option}
                    id={`option-${index}`}
                  />
                  <Label htmlFor={`option-${index}`} className="font-normal cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>

          <div className="flex gap-3">
            <Button
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              variant="outline"
              className="flex-1"
            >
              Previous
            </Button>
            {currentQuestion === mockQuestions.length - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={Object.keys(answers).length < mockQuestions.length}
                className="flex-1"
              >
                Submit Test
              </Button>
            ) : (
              <Button onClick={handleNext} className="flex-1">
                Next
              </Button>
            )}
          </div>

          <div className="bg-secondary p-4 rounded-lg">
            <p className="text-xs text-secondary-foreground">
              {Object.keys(answers).length} of {mockQuestions.length} questions answered
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
