'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/components/providers/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { profileApi, ApiError, type StudentProfile } from '@/lib/api';
import {
  Camera, Upload, FileText, Trash2, CheckCircle2,
  User, Mail, Code2, Star, Phone, GraduationCap,
  Loader2, Download, Eye, EyeOff, ExternalLink,
} from 'lucide-react';

const DOMAIN_LABELS: Record<string, string> = {
  Web: 'Web Development',
  DSA: 'Data Structures & Algorithms',
  ML:  'Machine Learning',
};

// ── Upload success overlay (shows for 2.5 s then fades) ──────────────────────
function UploadSuccess({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-4 animate-in fade-in zoom-in duration-300">
      <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
        <CheckCircle2 className="w-8 h-8 text-green-600" />
      </div>
      <p className="text-sm font-semibold text-green-700 dark:text-green-400">{message}</p>
    </div>
  );
}

export default function ProfilePage() {
  const { accessToken } = useAuth();
  const { toast }       = useToast();

  const photoInputRef  = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile]   = useState<StudentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving]   = useState(false);

  const [isUploadingPhoto,  setIsUploadingPhoto]  = useState(false);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [photoJustUploaded,  setPhotoJustUploaded]  = useState(false);
  const [resumeJustUploaded, setResumeJustUploaded] = useState(false);
  const [showResumePreview,  setShowResumePreview]  = useState(false);
  const [photoError, setPhotoError] = useState(false);

  const [formData, setFormData] = useState({
    name: '', phone: '', college: '', graduation_year: '',
  });

  // ── Load profile ─────────────────────────────────────────────────────────────
  const loadProfile = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const res = await profileApi.get(accessToken);
      setProfile(res.data);
      setPhotoError(false);
      setFormData({
        name:            res.data.name            ?? '',
        phone:           res.data.phone           ?? '',
        college:         res.data.college         ?? '',
        graduation_year: res.data.graduation_year ?? '',
      });
    } catch (err) {
      toast({
        title: 'Failed to load profile',
        description: err instanceof ApiError ? err.message : 'Please refresh.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, toast]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  // ── Save text fields ──────────────────────────────────────────────────────────
  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    setIsSaving(true);
    try {
      const res = await profileApi.update(accessToken, formData);
      setProfile(res.data);
      setIsEditing(false);
      toast({ title: 'Profile updated' });
    } catch (err) {
      toast({ title: 'Save failed', description: err instanceof ApiError ? err.message : 'Try again.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  // ── Photo ─────────────────────────────────────────────────────────────────────
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !accessToken) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please upload an image.', variant: 'destructive' }); return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Too large', description: 'Photo must be under 2 MB.', variant: 'destructive' }); return;
    }
    setIsUploadingPhoto(true);
    try {
      const data = await profileApi.uploadPhoto(accessToken, file);
      setProfile((p) => p ? { ...p, profile_photo_url: data.profile_photo_url } : p);
      setPhotoError(false);
      setPhotoJustUploaded(true);
      setTimeout(() => setPhotoJustUploaded(false), 2500);
    } catch (err) {
      toast({ title: 'Upload failed', description: err instanceof ApiError ? err.message : 'Try again.', variant: 'destructive' });
    } finally {
      setIsUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = async () => {
    if (!accessToken) return;
    setIsUploadingPhoto(true);
    try {
      await profileApi.deletePhoto(accessToken);
      setProfile((p) => p ? { ...p, profile_photo_url: null } : p);
      setPhotoError(false);
      toast({ title: 'Photo removed' });
    } catch (err) {
      toast({ title: 'Failed', description: err instanceof ApiError ? err.message : 'Try again.', variant: 'destructive' });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // ── Resume ────────────────────────────────────────────────────────────────────
  const handleResumeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !accessToken) return;
    const allowed = ['application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(file.type)) {
      toast({ title: 'Invalid file', description: 'Please upload a PDF or Word document.', variant: 'destructive' }); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Too large', description: 'Resume must be under 5 MB.', variant: 'destructive' }); return;
    }
    setIsUploadingResume(true);
    setShowResumePreview(false);
    try {
      const data = await profileApi.uploadResume(accessToken, file);
      setProfile((p) => p ? { ...p, resume_url: data.resume_url, resume_name: data.resume_name } : p);
      setResumeJustUploaded(true);
      // Show success for 2.5 s, then auto-open preview
      setTimeout(() => {
        setResumeJustUploaded(false);
        setShowResumePreview(true);
      }, 2500);
    } catch (err) {
      toast({ title: 'Upload failed', description: err instanceof ApiError ? err.message : 'Try again.', variant: 'destructive' });
    } finally {
      setIsUploadingResume(false);
      if (resumeInputRef.current) resumeInputRef.current.value = '';
    }
  };

  const handleRemoveResume = async () => {
    if (!accessToken) return;
    setIsUploadingResume(true);
    setShowResumePreview(false);
    try {
      await profileApi.deleteResume(accessToken);
      setProfile((p) => p ? { ...p, resume_url: null, resume_name: null } : p);
      toast({ title: 'Resume removed' });
    } catch (err) {
      toast({ title: 'Failed', description: err instanceof ApiError ? err.message : 'Try again.', variant: 'destructive' });
    } finally {
      setIsUploadingResume(false);
    }
  };

  const isPdf = profile?.resume_url?.toLowerCase().endsWith('.pdf') ||
                profile?.resume_name?.toLowerCase().endsWith('.pdf');

  const initials = (profile?.name ?? formData.name)
    .split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  // ── Avatar component (reused in both view/edit) ───────────────────────────────
  const Avatar = ({ size = 24 }: { size?: number }) => (
    <div
      className="rounded-full overflow-hidden bg-muted border-2 border-border flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      {isUploadingPhoto ? (
        <Loader2 className="animate-spin text-muted-foreground" style={{ width: size * 0.3, height: size * 0.3 }} />
      ) : photoJustUploaded ? (
        <CheckCircle2 className="text-green-500" style={{ width: size * 0.4, height: size * 0.4 }} />
      ) : profile?.profile_photo_url && !photoError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profile.profile_photo_url}
          alt={profile.name}
          className="w-full h-full object-cover"
          onError={() => setPhotoError(true)}
        />
      ) : (
        <span className="font-bold text-muted-foreground" style={{ fontSize: size * 0.3 }}>
          {initials}
        </span>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-64 bg-muted rounded-xl animate-pulse" />
        <div className="h-48 bg-muted rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
        <p className="text-muted-foreground mt-1">
          Your photo and resume are saved permanently and visible to HR &amp; Admin
        </p>
      </div>

      {/* ── BASIC INFORMATION ──────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Your name, contact details and domain</CardDescription>
          </div>
          {!isEditing && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>Edit</Button>
          )}
        </CardHeader>

        <CardContent>
          {isEditing ? (
            <form onSubmit={handleSaveInfo} className="space-y-6">
              {/* Photo row */}
              <div className="flex items-center gap-5">
                <div className="relative shrink-0">
                  <Avatar size={80} />
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                    className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                  <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Profile Photo</p>
                  <p className="text-xs text-muted-foreground">JPG, PNG · max 2 MB · visible to HR &amp; Admin</p>
                  <div className="flex gap-2 pt-1">
                    <Button type="button" variant="outline" size="sm" disabled={isUploadingPhoto}
                      onClick={() => photoInputRef.current?.click()}>
                      <Upload className="w-3 h-3 mr-1.5" />
                      {isUploadingPhoto ? 'Uploading…' : 'Upload photo'}
                    </Button>
                    {profile?.profile_photo_url && !photoError && (
                      <Button type="button" variant="ghost" size="sm" disabled={isUploadingPhoto}
                        onClick={handleRemovePhoto} className="text-destructive hover:text-destructive">
                        <Trash2 className="w-3 h-3 mr-1.5" />Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" value={formData.name} required
                    onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" type="tel" placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="college">College / University</Label>
                  <Input id="college" placeholder="e.g. IIT Madras"
                    value={formData.college}
                    onChange={(e) => setFormData((p) => ({ ...p, college: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="graduation_year">Graduation Year</Label>
                  <Input id="graduation_year" placeholder="e.g. 2025"
                    value={formData.graduation_year}
                    onChange={(e) => setFormData((p) => ({ ...p, graduation_year: e.target.value }))} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Domain</Label>
                  <Select value={profile?.domain ?? 'Web'} disabled>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Web">Web Development</SelectItem>
                      <SelectItem value="DSA">Data Structures & Algorithms</SelectItem>
                      <SelectItem value="ML">Machine Learning</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Domain is set at registration.</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : 'Save Changes'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>
                  Cancel
                </Button>
              </div>
            </form>

          ) : (
            /* VIEW MODE */
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="shrink-0 flex flex-col items-center gap-2">
                <Avatar size={96} />
                {profile?.profile_photo_url && !photoError ? (
                  <Badge variant="secondary" className="text-xs">
                    <CheckCircle2 className="w-3 h-3 mr-1 text-green-600" />Photo set
                  </Badge>
                ) : (
                  <p className="text-xs text-muted-foreground">No photo</p>
                )}
              </div>

              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                <InfoRow icon={<User className="w-4 h-4" />}           label="Full Name"       value={profile?.name ?? '—'} />
                <InfoRow icon={<Mail className="w-4 h-4" />}           label="Email"           value={profile?.email ?? '—'} />
                <InfoRow icon={<Code2 className="w-4 h-4" />}          label="Domain"
                  value={DOMAIN_LABELS[profile?.domain ?? ''] ?? profile?.domain ?? '—'} />
                <InfoRow icon={<Star className="w-4 h-4" />}           label="Test Score"
                  value={profile?.score !== undefined ? `${profile.score} / 100` : '—'} />
                {profile?.phone           && <InfoRow icon={<Phone className="w-4 h-4" />}         label="Phone"           value={profile.phone} />}
                {profile?.college         && <InfoRow icon={<GraduationCap className="w-4 h-4" />} label="College"         value={profile.college} />}
                {profile?.graduation_year && <InfoRow label="Graduation Year" value={profile.graduation_year} />}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── RESUME ─────────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Resume</CardTitle>
          <CardDescription>
            Saved permanently — HR and Admin can view and download it from your application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Upload success flash */}
          {resumeJustUploaded && (
            <UploadSuccess message="Resume uploaded successfully! HR can now see it." />
          )}

          {/* Uploading spinner */}
          {isUploadingResume && !resumeJustUploaded && (
            <div className="flex items-center justify-center gap-3 py-6">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Uploading resume…</p>
            </div>
          )}

          {/* Uploaded state */}
          {!isUploadingResume && !resumeJustUploaded && profile?.resume_url && (
            <>
              {/* File info bar */}
              <div className="flex items-center justify-between p-4 rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-green-700 dark:text-green-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {profile.resume_name ?? 'resume.pdf'}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-green-600 font-medium">✓ Saved</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">Visible to HR &amp; Admin</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-3">
                  {/* Preview toggle */}
                  <Button variant="outline" size="sm"
                    onClick={() => setShowResumePreview((v) => !v)}>
                    {showResumePreview
                      ? <><EyeOff className="w-3.5 h-3.5 mr-1.5" />Hide</>
                      : <><Eye className="w-3.5 h-3.5 mr-1.5" />Preview</>}
                  </Button>
                  {/* Open in new tab */}
                  <Button variant="outline" size="sm" asChild>
                    <a href={profile.resume_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3.5 h-3.5 mr-1.5" />Open
                    </a>
                  </Button>
                  {/* Download */}
                  <Button variant="outline" size="sm" asChild>
                    <a href={profile.resume_url} download={profile.resume_name ?? 'resume'}>
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  </Button>
                  {/* Replace */}
                  <Button variant="outline" size="sm"
                    onClick={() => resumeInputRef.current?.click()}>
                    <Upload className="w-3.5 h-3.5 mr-1.5" />Replace
                  </Button>
                  {/* Remove */}
                  <Button variant="ghost" size="sm" onClick={handleRemoveResume}
                    className="text-destructive hover:text-destructive">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* Inline preview — scrollable */}
              {showResumePreview && (
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="bg-muted px-4 py-2 flex items-center justify-between border-b border-border">
                    <p className="text-xs font-medium text-muted-foreground">
                      Resume Preview — {profile.resume_name}
                    </p>
                    <p className="text-xs text-muted-foreground">Scroll to read · same view HR sees</p>
                  </div>
                  {isPdf ? (
                    <iframe
                      src={`${profile.resume_url}#toolbar=0&navpanes=0`}
                      className="w-full"
                      style={{ height: '600px' }}
                      title="Resume preview"
                    />
                  ) : (
                    /* Word doc — can't embed, show download prompt */
                    <div className="p-8 text-center space-y-3">
                      <FileText className="w-10 h-10 text-muted-foreground mx-auto" />
                      <p className="text-sm text-muted-foreground">
                        Word documents can&apos;t be previewed in the browser.
                      </p>
                      <Button variant="outline" size="sm" asChild>
                        <a href={profile.resume_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3.5 h-3.5 mr-1.5" />Open in new tab
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Upload zone — shown when no resume */}
          {!isUploadingResume && !resumeJustUploaded && !profile?.resume_url && (
            <div
              onClick={() => resumeInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-lg p-10 text-center cursor-pointer hover:border-primary hover:bg-muted/40 transition-colors group"
            >
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/10 transition-colors">
                <Upload className="w-7 h-7 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <p className="text-sm font-semibold text-foreground mb-1">Click to upload your resume</p>
              <p className="text-xs text-muted-foreground mb-4">PDF or Word document · max 5 MB</p>
              <Button type="button" variant="outline" size="sm"
                onClick={(e) => { e.stopPropagation(); resumeInputRef.current?.click(); }}>
                <FileText className="w-3.5 h-3.5 mr-1.5" />Browse file
              </Button>
            </div>
          )}

          <input ref={resumeInputRef} type="file" accept=".pdf,.doc,.docx"
            className="hidden" onChange={handleResumeChange} />
        </CardContent>
      </Card>

      {/* ── VISIBILITY NOTE ────────────────────────────────────────────────── */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900 p-4 flex gap-3">
        <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">i</div>
        <div className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
          <p className="font-medium">Visibility</p>
          <ul className="text-xs space-y-0.5 text-blue-700 dark:text-blue-400">
            <li>• <strong>You</strong> — see your full profile and resume preview here</li>
            <li>• <strong>HR</strong> — sees your photo, name, domain, score and can download your resume from your application card</li>
            <li>• <strong>Admin</strong> — sees your full profile including photo and resume</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
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
