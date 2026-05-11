'use client';

import { useAuth } from '@/components/providers/AuthContext';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  Briefcase,
  FileText,
  User,
  LogOut,
  Settings,
  Users,
} from 'lucide-react';

export function RoleBasedSidebar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  const isActive = (href: string) => pathname === href;

  if (!user) return null;

  const studentLinks = [
    { href: '/dashboard/student', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/student/take-test', label: 'Take Test', icon: BookOpen },
    { href: '/dashboard/student/jobs', label: 'Jobs', icon: Briefcase },
    { href: '/dashboard/student/applications', label: 'Applications', icon: FileText },
    { href: '/dashboard/student/profile', label: 'Profile', icon: User },
  ];

  const hrLinks = [
    { href: '/dashboard/hr', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/hr/post-job', label: 'Post Job', icon: Briefcase },
    { href: '/dashboard/hr/my-jobs', label: 'My Jobs', icon: FileText },
  ];

  const adminLinks = [
    { href: '/dashboard/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/admin/create-test', label: 'Create Test', icon: BookOpen },
    { href: '/dashboard/admin/users', label: 'Users', icon: Users },
  ];

  const links =
    user.role === 'student' ? studentLinks : user.role === 'hr' ? hrLinks : adminLinks;

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border min-h-screen flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-xl font-bold text-sidebar-foreground">
          {user.role === 'student'
            ? 'Student Portal'
            : user.role === 'hr'
              ? 'HR Portal'
              : 'Admin Portal'}
        </h1>
        <p className="text-sm text-sidebar-foreground/60 mt-1">{user.name}</p>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-2">
        {links.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}>
            <Button
              variant={isActive(href) ? 'default' : 'ghost'}
              className="w-full justify-start text-left"
            >
              <Icon className="mr-2 h-4 w-4" />
              {label}
            </Button>
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border space-y-2">
        <Link href={`/dashboard/${user.role}/profile`} className="block">
          <Button variant="ghost" className="w-full justify-start text-left text-muted-foreground">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </Link>
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="w-full justify-start text-left text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
