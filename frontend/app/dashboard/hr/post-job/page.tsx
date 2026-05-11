'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function PostJobPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    domain: 'Web',
    description: '',
    requirements: '',
    minScore: '700',
    positions: '1',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDomainChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      domain: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      toast({
        title: 'Job Posted Successfully',
        description: `"${formData.title}" has been posted and is now visible to students.`,
      });
      setIsSubmitting(false);
      router.push('/dashboard/hr/my-jobs');
    }, 500);
  };

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Post a New Job
        </h1>
        <p className="text-muted-foreground">
          Create a job opening to attract qualified candidates
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Job Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Job Details</h3>
              <div className="space-y-2">
                <Label htmlFor="title">Job Title *</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="e.g., Senior Frontend Developer"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="domain">Domain *</Label>
                  <Select value={formData.domain} onValueChange={handleDomainChange}>
                    <SelectTrigger id="domain" disabled={isSubmitting}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Web">Web Development</SelectItem>
                      <SelectItem value="DSA">Data Structures & Algorithms</SelectItem>
                      <SelectItem value="ML">Machine Learning</SelectItem>
                      <SelectItem value="Cloud">Cloud Computing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="positions">Number of Positions *</Label>
                  <Input
                    id="positions"
                    name="positions"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.positions}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* Requirements */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Requirements</h3>

              <div className="space-y-2">
                <Label htmlFor="minScore">Minimum Score *</Label>
                <Input
                  id="minScore"
                  name="minScore"
                  type="number"
                  min="0"
                  max="1000"
                  value={formData.minScore}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                  Only students with this score or higher can apply
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="requirements">Required Skills & Qualifications *</Label>
                <Textarea
                  id="requirements"
                  name="requirements"
                  placeholder="List the key skills and qualifications needed..."
                  value={formData.requirements}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                  rows={4}
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Job Description</h3>
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Provide a detailed description of the job, responsibilities, and what the ideal candidate looks like..."
                  value={formData.description}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                  rows={6}
                />
              </div>
            </div>

            {/* Info Alert */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Once posted, this job will be visible to all students meeting the minimum score requirement.
              </AlertDescription>
            </Alert>

            {/* Submit */}
            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={isSubmitting || !formData.title || !formData.description}
              >
                {isSubmitting ? 'Posting...' : 'Post Job'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
