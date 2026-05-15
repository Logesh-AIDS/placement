'use client';

import { useState, useEffect } from 'react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { Eye, Edit, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import { DomainBadge } from '@/components/placement/shared/DomainBadge';
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
  status: string;
}

export default function MyJobsPage() {
  const { accessToken } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get data mode info for display
  const dataMode = getDataModeInfo();

  // Load jobs on component mount
  useEffect(() => {
    const loadJobs = async () => {
      if (!accessToken) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await jobsService.getMyJobs(accessToken);
        
        if (response.success) {
          // Transform API response to match component expectations
          const transformedJobs = response.data.map((job: any) => ({
            id: job.id,
            title: job.title,
            domain: job.domain,
            positions: job.positions || 1,
            applicants: job.application_count || job.applicants || 0,
            postedDate: job.created_at || job.postedDate,
            status: job.is_active !== false ? 'active' : 'closed'
          }));
          
          setJobs(transformedJobs);
        } else {
          throw new Error('Failed to load jobs');
        }
      } catch (err: any) {
        console.error('Error loading jobs:', err);
        setError(err.message || 'Failed to load jobs');
        toast({
          title: 'Error',
          description: 'Failed to load your jobs. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadJobs();
  }, [accessToken, toast]);

  const handleDelete = async (jobId: number) => {
    if (!accessToken) return;
    
    try {
      await jobsService.delete(accessToken, jobId);
      setJobs(jobs.filter((job) => job.id !== jobId));
      toast({
        title: 'Success',
        description: 'Job deleted successfully',
      });
    } catch (err: any) {
      console.error('Error deleting job:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to delete job',
        variant: 'destructive',
      });
    }
  };

  const activeJobs = jobs.filter((job) => job.status === 'active');
  const filledJobs = jobs.filter((job) => job.status === 'filled' || job.status === 'closed');

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading your jobs...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Data Mode Indicator (Development Helper) */}
      {process.env.NODE_ENV === 'development' && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {dataMode.emoji} <strong>{dataMode.mode}</strong> - {dataMode.description}
          </AlertDescription>
        </Alert>
      )}

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

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

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
