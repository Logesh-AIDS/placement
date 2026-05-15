'use client';

import { useState, useEffect } from 'react';
import { StatsCard } from '@/components/placement/cards/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { Users, BookOpen, Briefcase, TrendingUp, Plus, Loader2, AlertCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/components/providers/AuthContext';
import { usersService, jobsService, getDataModeInfo } from '@/lib/services';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: number;
  name: string;
  role: string;
  domain?: string;
  score?: number | string;
  joinedDate: string;
}

interface Stats {
  totalStudents: number;
  totalHR: number;
  totalJobs: number;
  totalApplications: number;
  averageScore: number;
}

export default function AdminDashboard() {
  const { accessToken } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    totalHR: 0,
    totalJobs: 0,
    totalApplications: 0,
    averageScore: 0,
  });
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  
  // Get data mode info for display
  const dataMode = getDataModeInfo();

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!accessToken) return;
      
      try {
        setLoading(true);
        
        // Load users
        const usersResponse = await usersService.getAll(accessToken);
        
        if (usersResponse.success) {
          const allUsers = usersResponse.data;
          
          // Calculate stats
          const students = allUsers.filter((u: any) => u.role === 'student');
          const hrUsers = allUsers.filter((u: any) => u.role === 'hr');
          
          const avgScore = students.length > 0
            ? Math.round(
                students.reduce((sum: number, u: any) => 
                  sum + (typeof u.score === 'number' ? u.score : 0), 0
                ) / students.length
              )
            : 0;
          
          setStats({
            totalStudents: students.length,
            totalHR: hrUsers.length,
            totalJobs: 0, // Will be updated when jobs are loaded
            totalApplications: 0, // Placeholder
            averageScore: avgScore,
          });
          
          // Get recent 5 users
          const recent = allUsers
            .sort((a: any, b: any) => 
              new Date(b.joinedDate || b.created_at).getTime() - 
              new Date(a.joinedDate || a.created_at).getTime()
            )
            .slice(0, 5)
            .map((u: any) => ({
              id: u.id,
              name: u.name,
              role: u.role,
              domain: u.domain || '-',
              score: u.score !== undefined ? u.score : '-',
              joinedDate: u.joinedDate || u.created_at,
            }));
          
          setRecentUsers(recent);
        }
        
        // Try to load jobs count (may fail if not in mock mode)
        try {
          const jobsResponse = await jobsService.getAll(accessToken);
          if (jobsResponse.success) {
            setStats(prev => ({
              ...prev,
              totalJobs: jobsResponse.data?.length || 0,
            }));
          }
        } catch (err) {
          console.log('Jobs data not available');
        }
        
      } catch (err: any) {
        console.error('Error loading dashboard data:', err);
        toast({
          title: 'Error',
          description: 'Failed to load dashboard data. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [accessToken, toast]);

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
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            Monitor and manage the placement portal system
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/admin/create-test">
            <Button variant="outline">
              <BookOpen className="mr-2 h-4 w-4" />
              Create Test
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard
          title="Total Students"
          value={stats.totalStudents}
          icon={<Users className="w-5 h-5" />}
          description="Active accounts"
        />
        <StatsCard
          title="HR Partners"
          value={stats.totalHR}
          icon={<Briefcase className="w-5 h-5" />}
          description="Companies"
        />
        <StatsCard
          title="Job Postings"
          value={stats.totalJobs}
          icon={<Briefcase className="w-5 h-5" />}
          description="Open positions"
        />
        <StatsCard
          title="Applications"
          value={stats.totalApplications}
          icon={<TrendingUp className="w-5 h-5" />}
          description="Total submissions"
        />
        <StatsCard
          title="Avg Score"
          value={stats.averageScore}
          icon={<TrendingUp className="w-5 h-5" />}
          description="Student average"
        />
      </div>

      {/* Recent Users */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Users</CardTitle>
          <Link href="/dashboard/admin/users">
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
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>
                      <span className="capitalize">{user.role}</span>
                    </TableCell>
                    <TableCell>{user.domain}</TableCell>
                    <TableCell>
                      {user.score !== '-' ? (
                        <span className="font-semibold text-foreground">
                          {user.score}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(user.joinedDate).toLocaleDateString()}
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
            <CardTitle>System Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/dashboard/admin/create-test" className="block">
              <Button className="w-full justify-start" variant="outline">
                <BookOpen className="mr-2 h-4 w-4" />
                Create Assessment Test
              </Button>
            </Link>
            <Link href="/dashboard/admin/users" className="block">
              <Button className="w-full justify-start" variant="outline">
                <Users className="mr-2 h-4 w-4" />
                Manage Users
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Portal Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• {stats.totalStudents} students actively using the portal</p>
            <p>• {stats.totalHR} companies recruiting through our platform</p>
            <p>• {stats.totalApplications} applications processed</p>
            <p>• Average student score: {stats.averageScore}/1000</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
