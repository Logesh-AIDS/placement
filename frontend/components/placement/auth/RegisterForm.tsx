'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth, type UserRole, type DomainType } from '@/components/providers/AuthContext';
import { ApiError } from '@/lib/api';

export function RegisterForm() {
  const [name, setName]                     = useState('');
  const [email, setEmail]                   = useState('');
  const [password, setPassword]             = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole]                     = useState<UserRole>('student');
  const [domain, setDomain]                 = useState<DomainType>('Web');
  const [error, setError]                   = useState('');
  const [isLoading, setIsLoading]           = useState(false);

  const { register, user } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    // Client-side password strength check (mirrors backend rules)
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError('Password must contain at least one uppercase letter.');
      return;
    }
    if (!/[0-9]/.test(password)) {
      setError('Password must contain at least one number.');
      return;
    }

    setIsLoading(true);

    try {
      await register(name, email, password, role, role === 'student' ? domain : undefined);
      // register() sets user in context — redirect handled below
    } catch (err) {
      console.error('[Register] error:', err);
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Redirect after user is set in context
  if (user) {
    router.push(`/dashboard/${user.role}`);
    return null;
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Create Account</CardTitle>
        <CardDescription>Sign up to join the placement portal</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isLoading}
              autoComplete="name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Min 8 chars, 1 uppercase, 1 number"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              {/* Real-time match indicator — only show once user starts typing */}
              {confirmPassword.length > 0 && (
                <span
                  className={`text-xs font-medium ${
                    password === confirmPassword ? 'text-green-600' : 'text-destructive'
                  }`}
                >
                  {password === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                </span>
              )}
            </div>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading}
              autoComplete="off"
            />
          </div>

          <div className="space-y-3">
            <Label>I am a:</Label>
            <RadioGroup
              value={role}
              onValueChange={(v) => setRole(v as UserRole)}
              className="flex gap-4"
            >
              {(['student', 'hr', 'admin'] as UserRole[]).map((r) => (
                <div key={r} className="flex items-center space-x-2">
                  <RadioGroupItem value={r} id={r} disabled={isLoading} />
                  <Label htmlFor={r} className="font-normal cursor-pointer capitalize">
                    {r}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {role === 'student' && (
            <div className="space-y-2">
              <Label htmlFor="domain">Domain</Label>
              <Select
                value={domain}
                onValueChange={(v) => setDomain(v as DomainType)}
                disabled={isLoading}
              >
                <SelectTrigger id="domain">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Web">Web Development</SelectItem>
                  <SelectItem value="DSA">Data Structures & Algorithms</SelectItem>
                  <SelectItem value="ML">Machine Learning</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Error from backend or client validation */}
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !name || !email || !password || !confirmPassword}
          >
            {isLoading ? 'Creating account...' : 'Create Account'}
          </Button>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <a href="/auth/login" className="text-primary hover:underline">
              Sign in here
            </a>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
