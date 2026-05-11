'use client';

import { StatsCard } from '@/components/placement/cards/StatsCard';
import { StatusBadge } from '@/components/placement/shared/StatusBadge';
import { DomainBadge } from '@/components/placement/shared/DomainBadge';
import { useAuth } from '@/components/providers/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BookOpen, Briefcase, TrendingUp, Award } from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Welcome back, {user?.name}
        </h1>
        <p className="text-muted-foreground">
          Track your placement journey and opportunities
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Test Score"
          value={`${user?.score || 0}`}
          icon={<TrendingUp className="w-5 h-5" />}
          description="Out of 1000"
        />
        <StatsCard
          title="Domain"
          value={user?.domain || 'Not Selected'}
          icon={<Award className="w-5 h-5" />}
          description="Your specialization"
        />
        <StatsCard
          title="Applications"
          value="0"
          icon={<Briefcase className="w-5 h-5" />}
          description="Jobs applied for"
        />
        <StatsCard
          title="Status"
          value="Active"
          icon={<BookOpen className="w-5 h-5" />}
          description="Account status"
        />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Name</span>
                <span className="font-semibold text-foreground">{user?.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Email</span>
                <span className="font-semibold text-foreground text-sm">{user?.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Domain</span>
                <DomainBadge domain={(user?.domain as any) || 'Web'} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status</span>
                <StatusBadge status="qualified" />
              </div>
            </div>
            <Link href="/dashboard/student/profile" className="block">
              <Button className="w-full" variant="outline">
                Edit Profile
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/dashboard/student/take-test" className="block">
              <Button className="w-full justify-start" variant="outline">
                <BookOpen className="mr-2 h-4 w-4" />
                Take Assessment
              </Button>
            </Link>
            <Link href="/dashboard/student/jobs" className="block">
              <Button className="w-full justify-start" variant="outline">
                <Briefcase className="mr-2 h-4 w-4" />
                Browse Jobs
              </Button>
            </Link>
            <Link href="/dashboard/student/applications" className="block">
              <Button className="w-full justify-start" variant="outline">
                <TrendingUp className="mr-2 h-4 w-4" />
                View Applications
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
              <div>
                <p className="font-semibold text-foreground">Complete Your Profile</p>
                <p className="text-sm text-muted-foreground">Add your skills and experience to improve job matches</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
              <div>
                <p className="font-semibold text-foreground">Take Assessment Test</p>
                <p className="text-sm text-muted-foreground">Demonstrate your knowledge and improve your placement chances</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
              <div>
                <p className="font-semibold text-foreground">Apply to Jobs</p>
                <p className="text-sm text-muted-foreground">Browse available positions and apply to those matching your profile</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
