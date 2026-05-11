'use client';

import { StatsCard } from '@/components/placement/cards/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Briefcase, Users, TrendingUp, Plus } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const mockJobs = [
  {
    id: 1,
    title: 'Frontend Developer',
    domain: 'Web',
    positions: 5,
    applicants: 23,
    postedDate: '2024-04-01',
  },
  {
    id: 2,
    title: 'Backend Developer',
    domain: 'Web',
    positions: 4,
    applicants: 18,
    postedDate: '2024-04-03',
  },
  {
    id: 3,
    title: 'Data Scientist',
    domain: 'ML',
    positions: 2,
    applicants: 10,
    postedDate: '2024-04-05',
  },
];

export default function HRDashboard() {
  const totalApplicants = mockJobs.reduce((sum, job) => sum + job.applicants, 0);
  const totalPositions = mockJobs.reduce((sum, job) => sum + job.positions, 0);

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            HR Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage job postings and applicant pipeline
          </p>
        </div>
        <Link href="/dashboard/hr/post-job">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Post New Job
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Active Jobs"
          value={mockJobs.length}
          icon={<Briefcase className="w-5 h-5" />}
          description="Job openings"
        />
        <StatsCard
          title="Total Applicants"
          value={totalApplicants}
          icon={<Users className="w-5 h-5" />}
          description="All applications"
        />
        <StatsCard
          title="Open Positions"
          value={totalPositions}
          icon={<TrendingUp className="w-5 h-5" />}
          description="Remaining spots"
        />
        <StatsCard
          title="Avg. Applicants/Job"
          value={Math.round(totalApplicants / mockJobs.length)}
          icon={<TrendingUp className="w-5 h-5" />}
          description="Per job posting"
        />
      </div>

      {/* Recent Job Postings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Job Postings</CardTitle>
          <Link href="/dashboard/hr/my-jobs">
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </Link>
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
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">{job.title}</TableCell>
                    <TableCell>{job.domain}</TableCell>
                    <TableCell>{job.positions}</TableCell>
                    <TableCell className="font-semibold text-primary">
                      {job.applicants}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(job.postedDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Post new job openings and manage your recruitment process
            </p>
            <Link href="/dashboard/hr/post-job" className="block">
              <Button className="w-full" variant="outline">
                Post a Job
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tips for Recruiters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Write clear and detailed job descriptions</p>
            <p>• Specify required skills and experience</p>
            <p>• Review applicants regularly</p>
            <p>• Communicate promptly with candidates</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
