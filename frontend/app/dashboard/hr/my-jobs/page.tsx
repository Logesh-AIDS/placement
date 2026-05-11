'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { DomainBadge } from '@/components/placement/shared/DomainBadge';

const mockJobs = [
  {
    id: 1,
    title: 'Frontend Developer',
    domain: 'Web' as const,
    positions: 5,
    applicants: 23,
    postedDate: '2024-04-01',
    status: 'active' as const,
  },
  {
    id: 2,
    title: 'Backend Developer',
    domain: 'Web' as const,
    positions: 4,
    applicants: 18,
    postedDate: '2024-04-03',
    status: 'active' as const,
  },
  {
    id: 3,
    title: 'Data Scientist',
    domain: 'ML' as const,
    positions: 2,
    applicants: 10,
    postedDate: '2024-04-05',
    status: 'active' as const,
  },
  {
    id: 4,
    title: 'Cloud Engineer',
    domain: 'Cloud' as const,
    positions: 3,
    applicants: 7,
    postedDate: '2024-03-25',
    status: 'filled' as const,
  },
];

export default function MyJobsPage() {
  const [jobs, setJobs] = useState(mockJobs);

  const handleDelete = (jobId: number) => {
    setJobs(jobs.filter((job) => job.id !== jobId));
  };

  const activeJobs = jobs.filter((job) => job.status === 'active');
  const filledJobs = jobs.filter((job) => job.status === 'filled');

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            My Jobs
          </h1>
          <p className="text-muted-foreground">
            Manage your job postings and applications
          </p>
        </div>
        <Link href="/dashboard/hr/post-job">
          <Button>Post New Job</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Active Jobs</p>
              <p className="text-3xl font-bold text-foreground">{activeJobs.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Filled Positions</p>
              <p className="text-3xl font-bold text-primary">{filledJobs.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Active Job Postings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Positions</TableHead>
                  <TableHead>Applicants</TableHead>
                  <TableHead>Posted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeJobs.length > 0 ? (
                  activeJobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">{job.title}</TableCell>
                      <TableCell>
                        <DomainBadge domain={job.domain} />
                      </TableCell>
                      <TableCell>{job.positions}</TableCell>
                      <TableCell>
                        <span className="font-semibold text-primary">
                          {job.applicants}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(job.postedDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="View applicants"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Edit">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(job.id)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No active jobs. Start by posting a new job.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Filled Jobs */}
      {filledJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Filled Positions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job Title</TableHead>
                    <TableHead>Domain</TableHead>
                    <TableHead>Positions</TableHead>
                    <TableHead>Applicants</TableHead>
                    <TableHead>Posted</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filledJobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">{job.title}</TableCell>
                      <TableCell>
                        <DomainBadge domain={job.domain} />
                      </TableCell>
                      <TableCell>{job.positions}</TableCell>
                      <TableCell className="font-semibold">{job.applicants}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(job.postedDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-100 text-green-800">
                          Filled
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
