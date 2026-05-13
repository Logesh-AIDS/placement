'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/providers/AuthContext';
import { applicationsApi, type Application, ApiError } from '@/lib/api';
import { AssessmentGate } from '@/components/placement/shared/AssessmentGate';
import { Briefcase, Clock, RefreshCw, CheckCircle2, XCircle, FileText } from 'lucide-react';

const STATUS_CONFIG = {
  applied:     { label: 'Applied',     color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',   icon: Clock },
  shortlisted: { label: 'Shortlisted', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', icon: CheckCircle2 },
  rejected:    { label: 'Rejected',    color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',       icon: XCircle },
};

export default function ApplicationsPage() {
  const { accessToken } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [error, setError]               = useState('');

  const fetchApplications = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError('');
    try {
      const res = await applicationsApi.getMy(accessToken);
      setApplications(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load applications.');
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  const counts = {
    total:       applications.length,
    shortlisted: applications.filter((a) => a.status === 'shortlisted').length,
    rejected:    applications.filter((a) => a.status === 'rejected').length,
    applied:     applications.filter((a) => a.status === 'applied').length,
  };

  return (
    <AssessmentGate>
      <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Applications</h1>
            <p className="text-muted-foreground mt-1">Track the status of your job applications</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchApplications} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total',       value: counts.total,       color: 'text-foreground' },
            { label: 'Applied',     value: counts.applied,     color: 'text-blue-600' },
            { label: 'Shortlisted', value: counts.shortlisted, color: 'text-green-600' },
            { label: 'Rejected',    value: counts.rejected,    color: 'text-red-500' },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-4 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Application History</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
            ) : error ? (
              <div className="py-8 text-center">
                <p className="text-destructive text-sm">{error}</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={fetchApplications}>
                  Try again
                </Button>
              </div>
            ) : applications.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <Briefcase className="w-10 h-10 text-muted-foreground mx-auto" />
                <p className="font-medium text-muted-foreground">No applications yet</p>
                <p className="text-sm text-muted-foreground">
                  Browse jobs and apply to positions that match your profile
                </p>
                <Button variant="outline" size="sm" asChild>
                  <a href="/dashboard/student/jobs">Browse Jobs</a>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {applications.map((app) => {
                  const cfg    = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.applied;
                  const Icon   = cfg.icon;
                  return (
                    <div key={app.id}
                      className="flex items-center justify-between gap-4 p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {app.job_title ?? `Job #${app.job_id}`}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                            {app.domain && <span>{app.domain}</span>}
                            {app.location && <><span>·</span><span>{app.location}</span></>}
                            <span>·</span>
                            <span>Applied {new Date(app.applied_at).toLocaleDateString('en-IN', {
                              day: 'numeric', month: 'short', year: 'numeric',
                            })}</span>
                          </div>
                        </div>
                      </div>
                      <Badge className={`${cfg.color} flex items-center gap-1 shrink-0 text-xs`}>
                        <Icon className="w-3 h-3" />
                        {cfg.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AssessmentGate>
  );
}
