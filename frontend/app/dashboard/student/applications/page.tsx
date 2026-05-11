'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/placement/shared/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Empty } from '@/components/ui/empty';

const mockApplications = [
  {
    id: 1,
    company: 'Tech Company A',
    position: 'Frontend Developer',
    appliedDate: '2024-04-10',
    status: 'qualified' as const,
  },
  {
    id: 2,
    company: 'AI Solutions',
    position: 'Data Scientist',
    appliedDate: '2024-04-08',
    status: 'pending' as const,
  },
  {
    id: 3,
    company: 'Cloud Services Inc',
    position: 'Backend Developer',
    appliedDate: '2024-04-05',
    status: 'rejected' as const,
  },
];

export default function ApplicationsPage() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          My Applications
        </h1>
        <p className="text-muted-foreground">
          Track the status of your job applications
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Application History</CardTitle>
        </CardHeader>
        <CardContent>
          {mockApplications.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Applied Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockApplications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">{app.company}</TableCell>
                      <TableCell>{app.position}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(app.appliedDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={app.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <Empty>
              <p className="text-muted-foreground">
                No applications yet
              </p>
              <p className="text-sm text-muted-foreground">
                Start applying to jobs to see your applications here
              </p>
            </Empty>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Total Applications</p>
              <p className="text-3xl font-bold text-foreground">
                {mockApplications.length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Qualified</p>
              <p className="text-3xl font-bold text-qualified">
                {mockApplications.filter((a) => a.status === 'qualified').length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Pending</p>
              <p className="text-3xl font-bold text-partial">
                {mockApplications.filter((a) => a.status === 'pending').length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
