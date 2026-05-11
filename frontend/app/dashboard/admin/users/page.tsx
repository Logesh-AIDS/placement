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
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Trash2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DomainBadge } from '@/components/placement/shared/DomainBadge';

const mockUsers = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'student', domain: 'Web', score: 850, joinedDate: '2024-04-10' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'student', domain: 'ML', score: 920, joinedDate: '2024-04-09' },
  { id: 3, name: 'Tech Corp HR', email: 'hr@techcorp.com', role: 'hr', domain: '-', score: '-', joinedDate: '2024-04-08' },
  { id: 4, name: 'Alice Johnson', email: 'alice@example.com', role: 'student', domain: 'DSA', score: 780, joinedDate: '2024-04-07' },
  { id: 5, name: 'StartUp Inc HR', email: 'hr@startup.com', role: 'hr', domain: '-', score: '-', joinedDate: '2024-04-06' },
  { id: 6, name: 'Bob Wilson', email: 'bob@example.com', role: 'student', domain: 'Cloud', score: 720, joinedDate: '2024-04-05' },
  { id: 7, name: 'Emma Davis', email: 'emma@example.com', role: 'student', domain: 'Web', score: 890, joinedDate: '2024-04-04' },
  { id: 8, name: 'Global Tech HR', email: 'hr@globaltech.com', role: 'hr', domain: '-', score: '-', joinedDate: '2024-04-03' },
];

export default function UsersPage() {
  const [users, setUsers] = useState(mockUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const filteredUsers = users.filter((user) => {
    const searchMatch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const roleMatch = roleFilter === 'all' || user.role === roleFilter;
    return searchMatch && roleMatch;
  });

  const handleDeleteUser = (userId: number) => {
    setUsers(users.filter((user) => user.id !== userId));
  };

  const studentUsers = users.filter((u) => u.role === 'student');
  const hrUsers = users.filter((u) => u.role === 'hr');
  const avgScore = Math.round(
    studentUsers.reduce((sum, u) => sum + (typeof u.score === 'number' ? u.score : 0), 0) /
      studentUsers.length
  );

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          User Management
        </h1>
        <p className="text-muted-foreground">
          View and manage all users on the platform
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Total Users</p>
              <p className="text-3xl font-bold text-foreground">{users.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Students</p>
              <p className="text-3xl font-bold text-primary">{studentUsers.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground mb-2">HR Partners</p>
              <p className="text-3xl font-bold text-primary">{hrUsers.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="student">Students Only</SelectItem>
                <SelectItem value="hr">HR Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell className="text-sm">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {user.role === 'student' ? 'Student' : 'HR'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.domain !== '-' ? (
                          <DomainBadge domain={user.domain as any} />
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
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
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Stats Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Statistics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Active Students</p>
              <p className="text-2xl font-bold text-foreground">{studentUsers.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">HR Partners</p>
              <p className="text-2xl font-bold text-foreground">{hrUsers.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Student Score</p>
              <p className="text-2xl font-bold text-primary">{avgScore}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Showing</p>
              <p className="text-2xl font-bold text-foreground">
                {filteredUsers.length}/{users.length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
