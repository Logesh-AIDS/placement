'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/components/providers/AuthContext';
import { settingsApi, ApiError } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DomainBadge } from '@/components/placement/shared/DomainBadge';
import Link from 'next/link';
import {
  BookOpen, Briefcase, FileText, Lock, CheckCircle2,
  TrendingUp, Award, Star, AlertTriangle,
} from 'lucide-react';

export default function StudentDashboard() {
  const { user, accessToken } = useAuth();
  const [passingScore, setPassingScore] = useState<number>(50);

  const loadSettings = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await settingsApi.get(accessToken);
      const ps = Number(res.data.passing_score ?? 50);
      setPassingScore(ps);
    } catch {
      // fallback to 50
    }
  }, [accessToken]);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const score        = user?.score ?? 0;
  const hasTakenTest = score > 0 || user?.status === 'qualified' || user?.status === 'partial';
  const hasPassedTest = score >= passingScore;

  // Status badge colour
  const statusColor =
    user?.status === 'qualified' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
    user?.status === 'partial'   ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
    'bg-muted text-muted-foreground';

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-5xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Track your placement journey
        </p>
      </div>

      {/* ── Assessment prerequisite banner ─────────────────────────────────── */}
      {!hasTakenTest && (
        <div className="rounded-xl border-2 border-orange-300 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800 p-5 flex gap-4 items-start">
          <AlertTriangle className="w-6 h-6 text-orange-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-orange-800 dark:text-orange-300">
              Complete your assessment first
            </p>
            <p className="text-sm text-orange-700 dark:text-orange-400 mt-1">
              You must take the assessment test and score at least{' '}
              <span className="font-bold">{passingScore}/100</span> to unlock
              job browsing and applications.
            </p>
            <Link href="/dashboard/student/take-test" className="inline-block mt-3">
              <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white">
                <BookOpen className="w-4 h-4 mr-2" />
                Take Assessment Now
              </Button>
            </Link>
          </div>
        </div>
      )}

      {hasTakenTest && !hasPassedTest && (
        <div className="rounded-xl border-2 border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800 p-5 flex gap-4 items-start">
          <AlertTriangle className="w-6 h-6 text-yellow-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-yellow-800 dark:text-yellow-300">
              Score below passing threshold
            </p>
            <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
              Your score is <span className="font-bold">{score}/100</span>. You need at least{' '}
              <span className="font-bold">{passingScore}/100</span> to access jobs and applications.
            </p>
            <Link href="/dashboard/student/take-test" className="inline-block mt-3">
              <Button size="sm" variant="outline" className="border-yellow-500 text-yellow-700 hover:bg-yellow-100">
                <BookOpen className="w-4 h-4 mr-2" />
                Retake Assessment
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* ── Stats row ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Star className="w-5 h-5 text-yellow-500" />}
          label="Test Score"
          value={hasTakenTest ? `${score}/100` : 'Not taken'}
          sub={hasTakenTest ? (hasPassedTest ? 'Passed ✓' : `Need ${passingScore}`) : 'Take test first'}
          highlight={hasPassedTest ? 'green' : hasTakenTest ? 'yellow' : 'default'}
        />
        <StatCard
          icon={<Award className="w-5 h-5 text-blue-500" />}
          label="Domain"
          value={user?.domain ?? '—'}
          sub="Your specialization"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-purple-500" />}
          label="Status"
          value={
            <Badge className={`text-xs capitalize ${statusColor}`}>
              {user?.status?.replace('_', ' ') ?? 'not qualified'}
            </Badge>
          }
          sub="Placement status"
        />
        <StatCard
          icon={<Briefcase className="w-5 h-5 text-green-500" />}
          label="Applications"
          value="—"
          sub="Jobs applied"
        />
      </div>

      {/* ── Quick Actions ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Take Assessment — always unlocked */}
        <ActionCard
          icon={<BookOpen className="w-6 h-6" />}
          title="Take Assessment"
          description={
            hasTakenTest
              ? `Your score: ${score}/100. You can retake to improve.`
              : 'Required before you can apply to jobs.'
          }
          href="/dashboard/student/take-test"
          locked={false}
          done={hasTakenTest && hasPassedTest}
          ctaLabel={hasTakenTest ? 'Retake Test' : 'Start Test'}
          ctaVariant={hasTakenTest ? 'outline' : 'default'}
        />

        {/* Browse Jobs — locked until passed */}
        <ActionCard
          icon={<Briefcase className="w-6 h-6" />}
          title="Browse Jobs"
          description={
            hasPassedTest
              ? 'View all active job postings from HR.'
              : `Unlock by scoring ≥ ${passingScore} on the assessment.`
          }
          href="/dashboard/student/jobs"
          locked={!hasPassedTest}
          ctaLabel="Browse Jobs"
        />

        {/* View Applications — locked until passed */}
        <ActionCard
          icon={<FileText className="w-6 h-6" />}
          title="My Applications"
          description={
            hasPassedTest
              ? 'Track the status of your job applications.'
              : `Unlock by scoring ≥ ${passingScore} on the assessment.`
          }
          href="/dashboard/student/applications"
          locked={!hasPassedTest}
          ctaLabel="View Applications"
        />
      </div>

      {/* ── Profile summary ──────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle>Profile Summary</CardTitle>
          <Link href="/dashboard/student/profile">
            <Button variant="outline" size="sm">Edit Profile</Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Name</p>
              <p className="font-medium">{user?.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Email</p>
              <p className="font-medium truncate">{user?.email}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Domain</p>
              <DomainBadge domain={(user?.domain as 'Web' | 'DSA' | 'ML') ?? 'Web'} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Assessment</p>
              {hasTakenTest
                ? <span className="text-green-600 font-medium flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />Completed</span>
                : <span className="text-orange-500 font-medium">Pending</span>
              }
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({
  icon, label, value, sub, highlight = 'default',
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub: string;
  highlight?: 'green' | 'yellow' | 'default';
}) {
  const valueColor =
    highlight === 'green'  ? 'text-green-600' :
    highlight === 'yellow' ? 'text-yellow-600' :
    'text-foreground';

  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-muted shrink-0">{icon}</div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`text-lg font-bold leading-tight ${valueColor}`}>{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Action card ───────────────────────────────────────────────────────────────
function ActionCard({
  icon, title, description, href, locked, done, ctaLabel, ctaVariant = 'default',
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  locked: boolean;
  done?: boolean;
  ctaLabel: string;
  ctaVariant?: 'default' | 'outline';
}) {
  return (
    <Card className={`relative overflow-hidden transition-all ${locked ? 'opacity-70' : 'hover:shadow-md'}`}>
      {locked && (
        <div className="absolute top-3 right-3">
          <div className="w-7 h-7 rounded-full bg-muted border border-border flex items-center justify-center">
            <Lock className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
        </div>
      )}
      {done && !locked && (
        <div className="absolute top-3 right-3">
          <div className="w-7 h-7 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
          </div>
        </div>
      )}
      <CardContent className="pt-5 pb-5 space-y-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          locked ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'
        }`}>
          {icon}
        </div>
        <div>
          <p className="font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
        </div>
        {locked ? (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground border border-dashed border-border rounded-lg px-3 py-2">
            <Lock className="w-3 h-3" />
            Complete assessment to unlock
          </div>
        ) : (
          <Link href={href}>
            <Button size="sm" variant={ctaVariant} className="w-full">
              {ctaLabel}
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
