'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Download,
  FileText,
  Mail,
  Code2,
  Star,
  GraduationCap,
  Phone,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';

export interface Applicant {
  id: number;
  name: string;
  email: string;
  domain: string;
  score: number;
  status: 'applied' | 'shortlisted' | 'rejected';
  appliedAt: string;
  college?: string;
  phone?: string;
  photoUrl?: string | null;
  resumeUrl?: string | null;
  resumeName?: string | null;
}

interface ApplicantCardProps {
  applicant: Applicant;
  onShortlist?: (id: number) => void;
  onReject?: (id: number) => void;
}

const STATUS_CONFIG = {
  applied:     { label: 'Applied',     icon: Clock,         className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  shortlisted: { label: 'Shortlisted', icon: CheckCircle2,  className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  rejected:    { label: 'Rejected',    icon: XCircle,       className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
};

const DOMAIN_LABELS: Record<string, string> = {
  Web: 'Web Development',
  DSA: 'Data Structures & Algorithms',
  ML:  'Machine Learning',
};

export function ApplicantCard({ applicant, onShortlist, onReject }: ApplicantCardProps) {
  const statusCfg = STATUS_CONFIG[applicant.status];
  const StatusIcon = statusCfg.icon;

  const initials = applicant.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleResumeDownload = () => {
    if (!applicant.resumeUrl) return;
    const a = document.createElement('a');
    a.href = applicant.resumeUrl;
    a.download = applicant.resumeName || `${applicant.name.replace(/\s+/g, '_')}_resume.pdf`;
    a.click();
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex gap-4">

          {/* ── Profile photo ─────────────────────────────────────────────── */}
          <div className="shrink-0">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-muted border-2 border-border flex items-center justify-center">
              {applicant.photoUrl ? (
                <img
                  src={applicant.photoUrl}
                  alt={applicant.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-lg font-bold text-muted-foreground">{initials}</span>
              )}
            </div>
          </div>

          {/* ── Main info ─────────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* Name + status */}
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <h3 className="font-semibold text-foreground text-base leading-tight">
                  {applicant.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Applied {new Date(applicant.appliedAt).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </p>
              </div>
              <Badge className={`${statusCfg.className} flex items-center gap-1 text-xs shrink-0`}>
                <StatusIcon className="w-3 h-3" />
                {statusCfg.label}
              </Badge>
            </div>

            {/* Details grid */}
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
              <Detail icon={<Mail className="w-3.5 h-3.5" />}         text={applicant.email} />
              <Detail icon={<Code2 className="w-3.5 h-3.5" />}        text={DOMAIN_LABELS[applicant.domain] || applicant.domain} />
              <Detail icon={<Star className="w-3.5 h-3.5 text-yellow-500" />}
                text={`Score: ${applicant.score}/100`}
                highlight={applicant.score >= 80 ? 'green' : applicant.score >= 50 ? 'yellow' : 'red'}
              />
              {applicant.college && (
                <Detail icon={<GraduationCap className="w-3.5 h-3.5" />} text={applicant.college} />
              )}
              {applicant.phone && (
                <Detail icon={<Phone className="w-3.5 h-3.5" />} text={applicant.phone} />
              )}
            </div>

            {/* Resume + action buttons */}
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              {/* Resume download */}
              {applicant.resumeUrl ? (
                <Button variant="outline" size="sm" onClick={handleResumeDownload}
                  className="text-xs h-8">
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Download Resume
                </Button>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground border border-dashed border-border rounded-md px-3 py-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  No resume uploaded
                </div>
              )}

              {/* Status actions */}
              {applicant.status === 'applied' && (
                <>
                  {onShortlist && (
                    <Button size="sm" className="text-xs h-8 bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => onShortlist(applicant.id)}>
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                      Shortlist
                    </Button>
                  )}
                  {onReject && (
                    <Button size="sm" variant="outline"
                      className="text-xs h-8 text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={() => onReject(applicant.id)}>
                      <XCircle className="w-3.5 h-3.5 mr-1.5" />
                      Reject
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Small helper ──────────────────────────────────────────────────────────────
function Detail({
  icon,
  text,
  highlight,
}: {
  icon?: React.ReactNode;
  text: string;
  highlight?: 'green' | 'yellow' | 'red';
}) {
  const colorClass =
    highlight === 'green'  ? 'text-green-600 font-semibold' :
    highlight === 'yellow' ? 'text-yellow-600 font-semibold' :
    highlight === 'red'    ? 'text-red-500 font-semibold' :
    'text-muted-foreground';

  return (
    <div className="flex items-center gap-1.5 min-w-0">
      {icon && <span className="text-muted-foreground shrink-0">{icon}</span>}
      <span className={`text-xs truncate ${colorClass}`}>{text}</span>
    </div>
  );
}
