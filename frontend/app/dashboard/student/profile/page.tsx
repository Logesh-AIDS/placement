'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/components/providers/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Camera,
  Upload,
  FileText,
  Trash2,
  CheckCircle2,
  User,
  Mail,
  Code2,
  Star,
  Download,
} from 'lucide-react';

const DOMAIN_LABELS: Record<string, string> = {
  Web: 'Web Development',
  DSA: 'Data Structures & Algorithms',
  ML: 'Machine Learning',
};

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const photoInputRef  = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing]   = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [resumeFile, setResumeFile]     = useState<File | null>(null);
  const [resumeUploaded, setResumeUploaded] = useState(false);

  const [formData, setFormData] = useState({
    name:   user?.name   || '',
    email:  user?.email  || '',
    domain: user?.domain || 'Web',
    phone:  '',
    college: '',
    graduationYear: '',
  });

  // ── Photo upload ─────────────────────────────────────────────────────────────
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please upload an image file.', variant: 'destructive' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Photo must be under 2 MB.', variant: 'destructive' });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  // ── Resume upload ─────────────────────────────────────────────────────────────
  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

    if (!allowed.includes(file.type)) {
      toast({ title: 'Invalid file', description: 'Please upload a PDF or Word document.', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Resume must be under 5 MB.', variant: 'destructive' });
      return;
    }

    setResumeFile(file);
  };

  const removeResume = () => {
    setResumeFile(null);
    setResumeUploaded(false);
    if (resumeInputRef.current) resumeInputRef.current.value = '';
  };

  // ── Save ──────────────────────────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (resumeFile) setResumeUploaded(true);
    toast({ title: 'Profile saved', description: 'Your profile has been updated.' });
    setIsEditing(false);
  };

  const initials = formData.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">

      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
        <p className="text-muted-foreground mt-1">
          Manage your information — your photo and resume are visible to HR
        </p>
      </div>

      {/* ── BASIC INFORMATION CARD ─────────────────────────────────────────── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Your name, contact details and domain</CardDescription>
          </div>
          {!isEditing && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
          )}
        </CardHeader>

        <CardContent>
          {isEditing ? (
            /* ── EDIT MODE ─────────────────────────────────────────────────── */
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Photo upload row */}
              <div className="flex items-center gap-6">
                {/* Avatar preview */}
                <div className="relative shrink-0">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-muted border-2 border-border flex items-center justify-center">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold text-muted-foreground">{initials}</span>
                    )}
                  </div>
                  {/* Camera button */}
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium">Profile Photo</p>
                  <p className="text-xs text-muted-foreground">JPG, PNG or GIF · max 2 MB</p>
                  <p className="text-xs text-muted-foreground">
                    Visible to HR when they review your application
                  </p>
                  <div className="flex gap-2 pt-1">
                    <Button type="button" variant="outline" size="sm"
                      onClick={() => photoInputRef.current?.click()}>
                      <Upload className="w-3.5 h-3.5 mr-1.5" />
                      Upload
                    </Button>
                    {photoPreview && (
                      <Button type="button" variant="ghost" size="sm"
                        onClick={removePhoto} className="text-destructive hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Form fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" value={formData.name}
                    onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={formData.email}
                    onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" type="tel" placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="college">College / University</Label>
                  <Input id="college" placeholder="e.g. IIT Madras"
                    value={formData.college}
                    onChange={(e) => setFormData(p => ({ ...p, college: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="graduationYear">Graduation Year</Label>
                  <Input id="graduationYear" placeholder="e.g. 2025"
                    value={formData.graduationYear}
                    onChange={(e) => setFormData(p => ({ ...p, graduationYear: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="domain">Domain</Label>
                  <Select value={formData.domain}
                    onValueChange={(v) => setFormData(p => ({ ...p, domain: v }))}>
                    <SelectTrigger id="domain"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Web">Web Development</SelectItem>
                      <SelectItem value="DSA">Data Structures & Algorithms</SelectItem>
                      <SelectItem value="ML">Machine Learning</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit">Save Changes</Button>
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            </form>

          ) : (
            /* ── VIEW MODE ─────────────────────────────────────────────────── */
            <div className="flex flex-col sm:flex-row gap-6">

              {/* Avatar */}
              <div className="shrink-0 flex flex-col items-center gap-2">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-muted border-2 border-border flex items-center justify-center">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-muted-foreground">{initials}</span>
                  )}
                </div>
                {photoPreview && (
                  <Badge variant="secondary" className="text-xs">
                    <CheckCircle2 className="w-3 h-3 mr-1 text-green-600" />
                    Photo set
                  </Badge>
                )}
              </div>

              {/* Info grid */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                <InfoRow icon={<User className="w-4 h-4" />}    label="Full Name"        value={formData.name} />
                <InfoRow icon={<Mail className="w-4 h-4" />}    label="Email"            value={formData.email} />
                <InfoRow icon={<Code2 className="w-4 h-4" />}   label="Domain"
                  value={DOMAIN_LABELS[formData.domain] || formData.domain} />
                <InfoRow icon={<Star className="w-4 h-4" />}    label="Test Score"
                  value={user?.score !== undefined ? `${user.score} / 100` : '—'} />
                {formData.phone      && <InfoRow label="Phone"           value={formData.phone} />}
                {formData.college    && <InfoRow label="College"         value={formData.college} />}
                {formData.graduationYear && <InfoRow label="Graduation Year" value={formData.graduationYear} />}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── RESUME CARD ────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Resume</CardTitle>
          <CardDescription>
            Upload your resume — HR will be able to download it when reviewing your application
          </CardDescription>
        </CardHeader>
        <CardContent>
          {resumeFile || resumeUploaded ? (
            /* Resume uploaded state */
            <div className="flex items-center justify-between p-4 rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-green-700 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {resumeFile?.name || 'resume.pdf'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {resumeFile ? `${(resumeFile.size / 1024).toFixed(0)} KB` : 'Uploaded'} ·{' '}
                    <span className="text-green-600 font-medium">Visible to HR</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm"
                  onClick={() => resumeInputRef.current?.click()}>
                  <Upload className="w-3.5 h-3.5 mr-1.5" />
                  Replace
                </Button>
                <Button variant="ghost" size="sm" onClick={removeResume}
                  className="text-destructive hover:text-destructive">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ) : (
            /* Upload drop zone */
            <div
              onClick={() => resumeInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-muted/40 transition-colors group"
            >
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/10 transition-colors">
                <Upload className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">
                Click to upload your resume
              </p>
              <p className="text-xs text-muted-foreground">
                PDF or Word document · max 5 MB
              </p>
              <Button type="button" variant="outline" size="sm" className="mt-4"
                onClick={(e) => { e.stopPropagation(); resumeInputRef.current?.click(); }}>
                <FileText className="w-3.5 h-3.5 mr-1.5" />
                Browse file
              </Button>
            </div>
          )}

          <input
            ref={resumeInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            className="hidden"
            onChange={handleResumeChange}
          />

          {/* Save resume button — only shown when a new file is selected */}
          {resumeFile && !resumeUploaded && (
            <div className="mt-4 flex items-center gap-3">
              <Button onClick={() => { setResumeUploaded(true); toast({ title: 'Resume saved', description: 'HR can now view your resume.' }); }}>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Save Resume
              </Button>
              <p className="text-xs text-muted-foreground">
                This will be visible to HR when they review your application
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── VISIBILITY NOTE ────────────────────────────────────────────────── */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900 p-4 flex gap-3">
        <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
          i
        </div>
        <div className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
          <p className="font-medium">What HR can see</p>
          <ul className="text-xs space-y-0.5 text-blue-700 dark:text-blue-400">
            <li>• Your profile photo, name, email, domain and test score</li>
            <li>• Your resume (download button appears on your application)</li>
            <li>• Your application status history</li>
          </ul>
        </div>
      </div>

    </div>
  );
}

// ── Small helper component ────────────────────────────────────────────────────
function InfoRow({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      {icon && <span className="text-muted-foreground mt-0.5">{icon}</span>}
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}
