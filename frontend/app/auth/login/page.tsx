import { LoginForm } from '@/components/placement/auth/LoginForm';

export const metadata = {
  title: 'Sign In - Placement Portal',
  description: 'Sign in to your placement portal account',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Placement Portal
          </h1>
          <p className="text-muted-foreground">
            Connecting talent with opportunities
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
