'use client';

import { useAuth } from '@/components/providers/AuthContext';
import { settingsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import {
  LayoutDashboard, BookOpen, Briefcase, FileText,
  User, LogOut, Settings, Users, Lock,
} from 'lucide-react';

export function RoleBasedSidebar() {
  const { user, logout, accessToken } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();

  const [passingScore, setPassingScore] = useState(50);

  const loadSettings = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await settingsApi.get(accessToken);
      setPassingScore(Number(res.data.passing_score ?? 50));
    } catch { /* use default */ }
  }, [accessToken]);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  const isActive = (href: string) => pathname === href;

  if (!user) return null;

  const score       = user.score ?? 0;
  const hasPassed   = score >= passingScore;

  const studentLinks = [
    { href: '/dashboard/student',              label: 'Dashboard',    icon: LayoutDashboard, locked: false },
    { href: '/dashboard/student/take-test',    label: 'Assessment',   icon: BookOpen,        locked: false },
    { href: '/dashboard/student/jobs',         label: 'Jobs',         icon: Briefcase,       locked: !hasPassed },
    { href: '/dashboard/student/applications', label: 'Applications', icon: FileText,        locked: !hasPassed },
    { href: '/dashboard/student/profile',      label: 'Profile',      icon: User,            locked: false },
  ];

  const hrLinks = [
    { href: '/dashboard/hr',             label: 'Dashboard',  icon: LayoutDashboard, locked: false },
    { href: '/dashboard/hr/post-job',    label: 'Post Job',   icon: Briefcase,       locked: false },
    { href: '/dashboard/hr/my-jobs',     label: 'My Jobs',    icon: FileText,        locked: false },
    { href: '/dashboard/hr/applicants',  label: 'Applicants', icon: Users,           locked: false },
  ];

  const adminLinks = [
    { href: '/dashboard/admin',              label: 'Dashboard',    icon: LayoutDashboard, locked: false },
    { href: '/dashboard/admin/create-test',  label: 'Create Test',  icon: BookOpen,        locked: false },
    { href: '/dashboard/admin/users',        label: 'Users',        icon: Users,           locked: false },
  ];

  const links =
    user.role === 'student' ? studentLinks :
    user.role === 'hr'      ? hrLinks      : adminLinks;

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border min-h-screen flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-xl font-bold text-sidebar-foreground">
          {user.role === 'student' ? 'Student Portal' :
           user.role === 'hr'      ? 'HR Portal'      : 'Admin Portal'}
        </h1>
        <p className="text-sm text-sidebar-foreground/60 mt-1 truncate">{user.name}</p>
        {user.role === 'student' && (
          <div className="mt-2 flex items-center gap-1.5">
            <span className="text-xs text-sidebar-foreground/50">Score:</span>
            <span className={`text-xs font-semibold ${hasPassed ? 'text-green-500' : 'text-yellow-500'}`}>
              {score}/100
            </span>
            {hasPassed && <span className="text-xs text-green-500">✓</span>}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {links.map(({ href, label, icon: Icon, locked }) => {
          const active = isActive(href);

          if (locked) {
            return (
              <div key={href}
                title={`Score ≥ ${passingScore} required`}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-muted-foreground/60 cursor-not-allowed select-none">
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-sm">{label}</span>
                <Lock className="h-3 w-3 shrink-0" />
              </div>
            );
          }

          return (
            <Link key={href} href={href}>
              <Button
                variant={active ? 'default' : 'ghost'}
                className="w-full justify-start text-left"
              >
                <Icon className="mr-2 h-4 w-4" />
                {label}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border space-y-1">
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
