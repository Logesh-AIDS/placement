'use client';

import { useState } from 'react';
import { JobCard } from '@/components/placement/cards/JobCard';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

const mockJobs = [
  {
    id: '1',
    title: 'Frontend Developer',
    company: 'Tech Company A',
    domain: 'Web' as const,
    minScore: 700,
    maxPositions: 5,
    applicants: 23,
  },
  {
    id: '2',
    title: 'Full Stack Engineer',
    company: 'Tech Company B',
    domain: 'Web' as const,
    minScore: 750,
    maxPositions: 3,
    applicants: 15,
  },
  {
    id: '3',
    title: 'Data Scientist',
    company: 'AI Solutions',
    domain: 'ML' as const,
    minScore: 800,
    maxPositions: 2,
    applicants: 10,
  },
  {
    id: '4',
    title: 'Backend Developer',
    company: 'Cloud Services Inc',
    domain: 'Cloud' as const,
    minScore: 750,
    maxPositions: 4,
    applicants: 18,
  },
  {
    id: '5',
    title: 'Algorithm Engineer',
    company: 'Tech Company C',
    domain: 'DSA' as const,
    minScore: 850,
    maxPositions: 2,
    applicants: 8,
  },
  {
    id: '6',
    title: 'Cloud Architect',
    company: 'Cloud Services Inc',
    domain: 'Cloud' as const,
    minScore: 800,
    maxPositions: 1,
    applicants: 5,
  },
];

export default function JobsPage() {
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedJobs, setAppliedJobs] = useState<string[]>([]);

  const filteredJobs = mockJobs.filter((job) => {
    const domainMatch = selectedDomain === 'all' || job.domain === selectedDomain;
    const searchMatch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase());
    return domainMatch && searchMatch;
  });

  const handleApply = (jobId: string) => {
    setAppliedJobs([...appliedJobs, jobId]);
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Available Jobs</h1>
        <p className="text-muted-foreground">
          Browse and apply to positions matching your profile
        </p>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search jobs or companies..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={selectedDomain} onValueChange={setSelectedDomain}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Domains</SelectItem>
              <SelectItem value="Web">Web Development</SelectItem>
              <SelectItem value="DSA">Data Structures & Algorithms</SelectItem>
              <SelectItem value="ML">Machine Learning</SelectItem>
              <SelectItem value="Cloud">Cloud Computing</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredJobs.length > 0 ? (
          filteredJobs.map((job) => (
            <JobCard
              key={job.id}
              {...job}
              onApply={handleApply}
              applied={appliedJobs.includes(job.id)}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground mb-2">No jobs found</p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your filters
            </p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="bg-card border border-border rounded-lg p-6">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filteredJobs.length}</span> of{' '}
          <span className="font-semibold text-foreground">{mockJobs.length}</span> jobs
        </p>
      </div>
    </div>
  );
}
