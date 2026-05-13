'use client';

import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/components/providers/AuthContext';
import { jobsApi, applicationsApi, type Job, ApiError } from '@/lib/api';
import { AssessmentGate } from '@/components/placement/shared/AssessmentGate';
import {
  Search, Briefcase, MapPin, Users, Clock, Star, Building2, RefreshCw,
} from 'lucide-react';

const DOMAIN_LABELS: Record<string, string> = {
  Web: 'Web Dev',
  DSA: 'DSA',
  ML:  'ML',
};

const DOMAIN_COLORS: Record<string, string> = {
  Web: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  DSA: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  ML:  'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 60)  return `${mins}m ago`;
  if (hours < 24)  return `${hours}h ago`;
  if (days  < 30)  return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function JobsPage() {
  const { user, accessToken } = useAuth();

  const [jobs, setJobs]               = useState<Job[]>([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [error, setError]             = useState('');
  const [search, setSearch]           = useState('');
  const [domain, setDomain]           = useState('all');
  const [appliedIds, setAppliedIds]   = useState<Set<number>>(new Set());

  const fetchJobs = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError('');
    try {
      const res = await jobsApi.getAll(accessToken, domain);
      setJobs(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load jobs.');
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, domain]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const filtered = jobs.filter((j) =>
    j.title.toLowerCase().includes(search.toLowerCase()) ||
    j.hr_name.toLowerCase().includes(search.toLowerCase()) ||
    (j.location ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const handleApply = async (jobId: number) => {
    if (!accessToken) return;
    try {
      await applicationsApi.apply(accessToken, jobId);
      setAppliedIds((prev) => new Set([...prev, jobId]));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to apply.');
    }
  };

  const canApply = (job: Job) =>
    user?.score !== undefined && user.score >= job.min_score &&
    user.domain === job.domain;

  return (
    <AssessmentGate>
    <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Available Jobs</h1>
          <p className="text-muted-foreground mt-1">
            Newest postings first — apply to roles matching your domain and score
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchJobs} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, company or location..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={domain} onValueChange={setDomain}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="All Domains" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Domains</SelectItem>
            <SelectItem value="Web">Web Development</SelectItem>
            <SelectItem value="DSA">Data Structures & Algorithms</SelectItem>
            <SelectItem value="ML">Machine Learning</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Count */}
      {!isLoading && !error && (
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filtered.length}</span> job{filtered.length !== 1 ? 's' : ''}
          {domain !== 'all' && ` in ${domain}`}
        </p>
      )}

      {/* States */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-52 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-8 text-center">
            <p className="text-destructive font-medium">{error}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={fetchJobs}>
              Try again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Job cards */}
      {!isLoading && !error && (
        filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((job) => {
              const applied    = appliedIds.has(job.id);
              const eligible   = canApply(job);
              const isNew      = Date.now() - new Date(job.created_at).getTime() < 48 * 3600000;

              return (
                <Card key={job.id}
                  className="flex flex-col hover:shadow-md transition-shadow border-border">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Badge className={`text-xs px-2 py-0.5 ${DOMAIN_COLORS[job.domain] ?? 'bg-muted text-muted-foreground'}`}>
                            {DOMAIN_LABELS[job.domain] ?? job.domain}
                          </Badge>
                          {isNew && (
                            <Badge className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                              New
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-base leading-snug">{job.title}</CardTitle>
                      </div>
                    </div>

                    {/* Company / HR */}
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                      <Building2 className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{job.hr_name}</span>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col gap-3 pt-0">
                    {/* Meta row */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-yellow-500" />
                        Min score: <span className="font-medium text-foreground ml-0.5">{job.min_score}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        <span className="font-medium text-foreground">{job.application_count}</span> applied
                      </div>
                      {job.location && (
                        <div className="flex items-center gap-1 col-span-2">
                          <MapPin className="w-3.5 h-3.5" />
                          <span className="truncate">{job.location}</span>
                        </div>
                      )}
                      {job.salary_range && (
                        <div className="flex items-center gap-1 col-span-2">
                          <Briefcase className="w-3.5 h-3.5" />
                          <span>{job.salary_range}</span>
                        </div>
                      )}
                    </div>

                    {/* Description preview */}
                    <p className="text-xs text-muted-foreground line-clamp-2 flex-1">
                      {job.description}
                    </p>

                    {/* Posted time */}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      Posted {timeAgo(job.created_at)}
                    </div>

                    {/* Apply button */}
                    <Button
                      size="sm"
                      className="w-full mt-1"
                      disabled={applied || !eligible}
                      variant={applied ? 'outline' : 'default'}
                      onClick={() => handleApply(job.id)}
                    >
                      {applied
                        ? '✓ Applied'
                        : !eligible
                          ? user?.domain !== job.domain
                            ? `Requires ${job.domain} domain`
                            : `Need score ≥ ${job.min_score}`
                          : 'Apply Now'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-16 text-center">
              <Briefcase className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium text-muted-foreground">No jobs found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {search ? 'Try a different search term' : 'No active jobs right now — check back soon'}
              </p>
            </CardContent>
          </Card>
        )
      )}
    </div>
    </AssessmentGate>
  );
}
