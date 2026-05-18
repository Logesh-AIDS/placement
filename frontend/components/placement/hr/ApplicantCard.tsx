'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  User,
  ExternalLink,
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
  const [showProfile, setShowProfile] = useState(false);
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
    <>
      <Card 
        className="hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => setShowProfile(true)}
      >
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

              {/* Click to view hint */}
              <div className="mt-3 text-xs text-primary flex items-center gap-1">
                <User className="w-3 h-3" />
                Click to view full profile & resume
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile View Dialog */}
      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-muted border-2 border-border flex items-center justify-center">
                {applicant.photoUrl ? (
                  <img
                    src={applicant.photoUrl}
                    alt={applicant.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-base font-bold text-muted-foreground">{initials}</span>
                )}
              </div>
              <div>
                <div className="text-xl font-bold">{applicant.name}</div>
                <Badge className={`${statusCfg.className} flex items-center gap-1 text-xs mt-1 w-fit`}>
                  <StatusIcon className="w-3 h-3" />
                  {statusCfg.label}
                </Badge>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Contact & Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase">Contact Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <a href={`mailto:${applicant.email}`} className="text-primary hover:underline">
                      {applicant.email}
                    </a>
                  </div>
                  {applicant.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <a href={`tel:${applicant.phone}`} className="text-primary hover:underline">
                        {applicant.phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase">Academic Details</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Code2 className="w-4 h-4 text-muted-foreground" />
                    <span>{DOMAIN_LABELS[applicant.domain] || applicant.domain}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className={`font-semibold ${
                      applicant.score >= 80 ? 'text-green-600' : 
                      applicant.score >= 50 ? 'text-yellow-600' : 
                      'text-red-500'
                    }`}>
                      Score: {applicant.score}/100
                    </span>
                  </div>
                  {applicant.college && (
                    <div className="flex items-center gap-2 text-sm">
                      <GraduationCap className="w-4 h-4 text-muted-foreground" />
                      <span>{applicant.college}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Resume Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase">Resume</h3>
                {applicant.resumeUrl && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleResumeDownload();
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                )}
              </div>

              {applicant.resumeUrl ? (
                <div className="border rounded-lg overflow-hidden bg-muted/30">
                  <iframe
                    src={applicant.resumeUrl}
                    className="w-full h-[600px]"
                    title={`${applicant.name}'s Resume`}
                  />
                </div>
              ) : (
                <div className="border border-dashed rounded-lg p-8 text-center text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No resume uploaded</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              {applicant.status === 'applied' && (
                <>
                  {onShortlist && (
                    <Button 
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        onShortlist(applicant.id);
                        setShowProfile(false);
                      }}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Shortlist Candidate
                    </Button>
                  )}
                  {onReject && (
                    <Button 
                      variant="outline"
                      className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        onReject(applicant.id);
                        setShowProfile(false);
                      }}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  )}
                </>
              )}
              <Button 
                variant="outline"
                onClick={() => setShowProfile(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
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
