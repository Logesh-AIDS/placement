'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/components/providers/AuthContext';
import { settingsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Lock, BookOpen, AlertTriangle } from 'lucide-react';

interface AssessmentGateProps {
  children: React.ReactNode;
}

export function AssessmentGate({ children }: AssessmentGateProps) {
  const { user, accessToken } = useAuth();
  const [passingScore, setPassingScore] = useState<number | null>(null);

  const loadSettings = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await settingsApi.get(accessToken);
      setPassingScore(Number(res.data.passing_score ?? 50));
    } catch {
      setPassingScore(50);
    }
  }, [accessToken]);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  // Still loading settings
  if (passingScore === null) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const score      = user?.score ?? 0;
  const hasPassed  = score >= passingScore;
  const hasTaken   = score > 0 || user?.status === 'qualified' || user?.status === 'partial';

  if (hasPassed) return <>{children}</>;

  // ── Locked wall ───────────────────────────────────────────────────────────
  return (
    <div className="flex items-center justify-center min-h-[70vh] p-6">
      <div className="max-w-md w-full text-center space-y-6">

        {/* Lock icon */}
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto">
          <Lock className="w-9 h-9 text-muted-foreground" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">
            {hasTaken ? 'Score Too Low' : 'Assessment Required'}
          </h2>
          <p className="text-muted-foreground">
            {hasTaken
              ? <>Your current score is <span className="font-semibold text-foreground">{score}/100</span>. You need at least <span className="font-semibold text-foreground">{passingScore}/100</span> to access this section.</>
              : <>You need to complete the assessment test and score at least <span className="font-semibold text-foreground">{passingScore}/100</span> to unlock this section.</>
            }
          </p>
        </div>

        {/* Steps */}
        <div className="rounded-xl border border-border bg-muted/40 p-4 text-left space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            How to unlock
          </p>
          <Step num={1} text="Go to Take Assessment" done={false} />
          <Step num={2} text={`Score at least ${passingScore}/100`} done={false} />
          <Step num={3} text="Jobs and Applications unlock automatically" done={false} />
        </div>

        {hasTaken && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 p-3 flex gap-2 text-left">
            <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-700 dark:text-yellow-400">
              You can retake the assessment as many times as needed to improve your score.
            </p>
          </div>
        )}

        <Link href="/dashboard/student/take-test">
          <Button className="w-full" size="lg">
            <BookOpen className="w-4 h-4 mr-2" />
            {hasTaken ? 'Retake Assessment' : 'Take Assessment Now'}
          </Button>
        </Link>

        <Link href="/dashboard/student" className="block">
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            ← Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}

function Step({ num, text, done }: { num: number; text: string; done: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
        done ? 'bg-green-500 text-white' : 'bg-border text-muted-foreground'
      }`}>
        {done ? '✓' : num}
      </div>
      <p className={`text-sm ${done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
        {text}
      </p>
    </div>
  );
}
