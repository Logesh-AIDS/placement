'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthContext';
import { jobsApi, ApiError, type DomainType } from '@/lib/api';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function PostJobPage() {
  const { toast }       = useToast();
  const router          = useRouter();
  const { accessToken } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError]               = useState('');

  const [formData, setFormData] = useState({
    title:        '',
    role:         '',
    domain:       'Web' as DomainType,
    description:  '',
    requirements: '',
    min_score:    '60',
    location:     '',
    salary_range: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    setError('');
    setIsSubmitting(true);

    try {
      await jobsApi.create(accessToken, {
        title:        formData.title,
        role:         formData.role || formData.title,
        domain:       formData.domain,
        min_score:    Number(formData.min_score),
        description:  formData.description,
        requirements: formData.requirements || undefined,
        location:     formData.location     || undefined,
        salary_range: formData.salary_range || undefined,
      });

      toast({
        title: 'Job posted!',
        description: `"${formData.title}" is now live and visible to students.`,
      });

      router.push('/dashboard/hr/my-jobs');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to post job. Please try again.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Post a New Job</h1>
        <p className="text-muted-foreground mt-1">
          Fill in the details — the job will appear immediately for eligible students
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* ── Job Details ─────────────────────────────────────────────── */}
            <section className="space-y-4">
              <h3 className="font-semibold text-foreground border-b pb-2">Job Details</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="title">Job Title *</Label>
                  <Input id="title" name="title" placeholder="e.g. Senior Frontend Developer"
                    value={formData.title} onChange={handleChange} required disabled={isSubmitting} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="domain">Domain *</Label>
                  <Select value={formData.domain}
                    onValueChange={(v) => setFormData((p) => ({ ...p, domain: v as DomainType }))}
                    disabled={isSubmitting}>
                    <SelectTrigger id="domain"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Web">Web Development</SelectItem>
                      <SelectItem value="DSA">Data Structures & Algorithms</SelectItem>
                      <SelectItem value="ML">Machine Learning</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="min_score">Minimum Score (0–100) *</Label>
                  <Input id="min_score" name="min_score" type="number" min="0" max="100"
                    value={formData.min_score} onChange={handleChange} required disabled={isSubmitting} />
                  <p className="text-xs text-muted-foreground">
                    Only students with this score or higher can apply
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" name="location" placeholder="e.g. Bangalore / Remote"
                    value={formData.location} onChange={handleChange} disabled={isSubmitting} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salary_range">Salary Range</Label>
                  <Input id="salary_range" name="salary_range" placeholder="e.g. ₹8–12 LPA"
                    value={formData.salary_range} onChange={handleChange} disabled={isSubmitting} />
                </div>
              </div>
            </section>

            {/* ── Description ─────────────────────────────────────────────── */}
            <section className="space-y-4">
              <h3 className="font-semibold text-foreground border-b pb-2">Description</h3>

              <div className="space-y-2">
                <Label htmlFor="description">Job Description *</Label>
                <Textarea id="description" name="description" rows={5}
                  placeholder="Describe the role, responsibilities and what the ideal candidate looks like..."
                  value={formData.description} onChange={handleChange} required disabled={isSubmitting} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="requirements">Required Skills & Qualifications</Label>
                <Textarea id="requirements" name="requirements" rows={3}
                  placeholder="e.g. React, Node.js, 1+ year experience..."
                  value={formData.requirements} onChange={handleChange} disabled={isSubmitting} />
              </div>
            </section>

            {/* Error */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Info */}
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>
                Once posted, this job will appear immediately at the top of the student jobs list.
              </AlertDescription>
            </Alert>

            {/* Actions */}
            <div className="flex gap-3">
              <Button type="submit"
                disabled={isSubmitting || !formData.title || !formData.description}>
                {isSubmitting ? 'Posting...' : 'Post Job'}
              </Button>
              <Button type="button" variant="outline"
                onClick={() => router.back()} disabled={isSubmitting}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
