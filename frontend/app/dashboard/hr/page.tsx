'use client';

import { useState, useEffect } from 'react';
import { StatsCard } from '@/components/placement/cards/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { Briefcase, Users, TrendingUp, Plus, Loader2, AlertCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/components/providers/AuthContext';
import { jobsService, getDataModeInfo } from '@/lib/services';
import { useToast } from '@/hooks/use-toast';

interface Job {
  id: number;
  title: string;
  domain: string;
  positions: number;
  applicants: number;
  postedDate: string;
}

export default function HRDashboard() {
  const { accessToken } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  
  // Get data mode info for display
  const dataMode = getDataModeInfo();

  // Load jobs data
  useEffect(() => {
    const loadJobs = async () => {
      if (!accessToken) return;
      
      try {
        setLoading(true);
        
        const response = await jobsService.getMyJobs(accessToken);
        
        if (response.success) {
          const transformedJobs = response.data.map((job: any) => ({
            id: job.id,
            title: job.title,
            domain: job.domain,
            positions: job.positions || 1,
            applicants: job.application_count || job.applicants || 0,
            postedDate: job.created_at || job.postedDate,
          }));
          
          setJobs(transformedJobs);
        }
      } catch (err: any) {
        console.error('Error loading jobs:', err);
        toast({
          title: 'Error',
          description: 'Failed to load jobs. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadJobs();
  }, [accessToken, toast]);

  const totalApplicants = jobs.reduce((sum, job) => sum + job.applicants, 0);
  const totalPositions = jobs.reduce((sum, job) => sum + job.positions, 0);
  const avgApplicants = jobs.length > 0 ? Math.round(totalApplicants / jobs.length) : 0;

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Data Mode Indicator (Development Helper) */}
      {process.env.NODE_ENV === 'development' && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {dataMode.emoji} <strong>{dataMode.mode}</strong> - {dataMode.description}
          </AlertDescription>
        </Alert>
      )}

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
          value={jobs.length}
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
          value={avgApplicants}
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
                {jobs.length > 0 ? (
                  jobs.map((job) => (
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
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No jobs posted yet. Start by posting a new job.
                    </TableCell>
                  </TableRow>
                )}
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
