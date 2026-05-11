'use client';

import { useState } from 'react';
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
import { Users, Search } from 'lucide-react';

// Mock data — replace with real API call
const MOCK_APPLICANTS: Applicant[] = [
  {
    id: 1,
    name: 'Arun Kumar',
    email: 'arun@college.edu',
    domain: 'Web',
    score: 88,
    status: 'applied',
    appliedAt: '2024-04-10',
    college: 'IIT Madras',
    phone: '+91 98765 43210',
    photoUrl: null,
    resumeUrl: '/mock/resume.pdf',
    resumeName: 'Arun_Kumar_Resume.pdf',
  },
  {
    id: 2,
    name: 'Priya Sharma',
    email: 'priya@college.edu',
    domain: 'ML',
    score: 74,
    status: 'shortlisted',
    appliedAt: '2024-04-09',
    college: 'NIT Trichy',
    photoUrl: null,
    resumeUrl: '/mock/resume.pdf',
    resumeName: 'Priya_Sharma_Resume.pdf',
  },
  {
    id: 3,
    name: 'Rahul Verma',
    email: 'rahul@college.edu',
    domain: 'DSA',
    score: 45,
    status: 'rejected',
    appliedAt: '2024-04-08',
    college: 'VIT Vellore',
    photoUrl: null,
    resumeUrl: null,
    resumeName: null,
  },
  {
    id: 4,
    name: 'Sneha Patel',
    email: 'sneha@college.edu',
    domain: 'Web',
    score: 92,
    status: 'applied',
    appliedAt: '2024-04-11',
    college: 'BITS Pilani',
    phone: '+91 91234 56789',
    photoUrl: null,
    resumeUrl: '/mock/resume.pdf',
    resumeName: 'Sneha_Patel_Resume.pdf',
  },
];

type StatusFilter = 'all' | 'applied' | 'shortlisted' | 'rejected';

export default function ApplicantsPage() {
  const [applicants, setApplicants] = useState<Applicant[]>(MOCK_APPLICANTS);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const handleShortlist = (id: number) => {
    setApplicants((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'shortlisted' } : a))
    );
  };

  const handleReject = (id: number) => {
    setApplicants((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'rejected' } : a))
    );
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
