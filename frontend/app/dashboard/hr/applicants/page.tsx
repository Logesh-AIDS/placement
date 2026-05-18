'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ApplicantCard, type Applicant } from '@/components/placement/hr/ApplicantCard';
import { useAuth } from '@/components/providers/AuthContext';
import { applicationsApi, ApiError } from '@/lib/api';
import { Users, Search, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

type StatusFilter = 'all' | 'applied' | 'shortlisted' | 'rejected';

export default function ApplicantsPage() {
  const { accessToken } = useAuth();
  
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Load applicants from API
  useEffect(() => {
    const loadApplicants = async () => {
      if (!accessToken) return;
      
      setIsLoading(true);
      setError('');
      
      try {
        const res = await applicationsApi.getHRApplications(accessToken);
        
        // Transform API data to Applicant format
        const transformed: Applicant[] = res.data.map((app) => ({
          id: app.id,
          name: app.student_name,
          email: app.student_email,
          domain: app.student_domain,
          score: app.student_score,
          status: app.status,
          appliedAt: app.applied_at,
          college: app.college || undefined,
          phone: app.phone || undefined,
          photoUrl: app.profile_photo_url || null,
          resumeUrl: app.resume_url || null,
          resumeName: app.resume_name || null,
        }));
        
        setApplicants(transformed);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load applicants.');
      } finally {
        setIsLoading(false);
      }
    };

    loadApplicants();
  }, [accessToken]);

  const handleShortlist = async (id: number) => {
    if (!accessToken) return;
    
    try {
      await applicationsApi.updateStatus(accessToken, id, 'shortlisted');
      setApplicants((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'shortlisted' } : a))
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update status.');
    }
  };

  const handleReject = async (id: number) => {
    if (!accessToken) return;
    
    try {
      await applicationsApi.updateStatus(accessToken, id, 'rejected');
      setApplicants((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'rejected' } : a))
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update status.');
    }
  };

  const filtered = applicants.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const counts = {
    all:         applicants.length,
    applied:     applicants.filter((a) => a.status === 'applied').length,
    shortlisted: applicants.filter((a) => a.status === 'shortlisted').length,
    rejected:    applicants.filter((a) => a.status === 'rejected').length,
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 md:p-8 max-w-5xl mx-auto">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Loading applicants...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6 md:p-8 max-w-5xl mx-auto">
        <Card className="border-destructive/30">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
            <p className="font-semibold text-foreground">{error}</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Applicants</h1>
        <p className="text-muted-foreground mt-1">
          Review candidates — view their profile photo and download their resume
        </p>
      </div>

      {/* Summary badges */}
      <div className="flex flex-wrap gap-3">
        {([ 'all', 'applied', 'shortlisted', 'rejected'] as StatusFilter[]).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              statusFilter === s
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground border-border hover:border-primary/50'
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
            <span className="ml-1.5 text-xs opacity-70">{counts[s]}</span>
          </button>
        ))}
      </div>

      {/* Search + filter bar */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="applied">Applied</SelectItem>
                <SelectItem value="shortlisted">Shortlisted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Applicant cards */}
      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((applicant) => (
            <ApplicantCard
              key={applicant.id}
              applicant={applicant}
              onShortlist={handleShortlist}
              onReject={handleReject}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No applicants found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {search ? 'Try a different search term' : 'No applications yet for this filter'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
