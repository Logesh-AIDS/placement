'use client';

import { StatsCard } from '@/components/placement/cards/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Users, BookOpen, Briefcase, TrendingUp, Plus } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const mockStats = {
  totalStudents: 150,
  totalHR: 15,
  totalJobs: 8,
  totalApplications: 245,
  averageScore: 762,
};

const recentUsers = [
  { id: 1, name: 'John Doe', role: 'student', domain: 'Web', score: 850, joinedDate: '2024-04-10' },
  { id: 2, name: 'Jane Smith', role: 'student', domain: 'ML', score: 920, joinedDate: '2024-04-09' },
  { id: 3, name: 'Tech Corp HR', role: 'hr', domain: '-', score: '-', joinedDate: '2024-04-08' },
  { id: 4, name: 'Alice Johnson', role: 'student', domain: 'DSA', score: 780, joinedDate: '2024-04-07' },
  { id: 5, name: 'StartUp Inc HR', role: 'hr', domain: '-', score: '-', joinedDate: '2024-04-06' },
];

export default function AdminDashboard() {
  return (
    <div className="p-8 space-y-8">
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
          value={mockStats.totalStudents}
          icon={<Users className="w-5 h-5" />}
          description="Active accounts"
        />
        <StatsCard
          title="HR Partners"
          value={mockStats.totalHR}
          icon={<Briefcase className="w-5 h-5" />}
          description="Companies"
        />
        <StatsCard
          title="Job Postings"
          value={mockStats.totalJobs}
          icon={<Briefcase className="w-5 h-5" />}
          description="Open positions"
        />
        <StatsCard
          title="Applications"
          value={mockStats.totalApplications}
          icon={<TrendingUp className="w-5 h-5" />}
          description="Total submissions"
        />
        <StatsCard
          title="Avg Score"
          value={mockStats.averageScore}
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
            <p>• {mockStats.totalStudents} students actively using the portal</p>
            <p>• {mockStats.totalHR} companies recruiting through our platform</p>
            <p>• {mockStats.totalApplications} applications processed</p>
            <p>• Average student score: {mockStats.averageScore}/1000</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
