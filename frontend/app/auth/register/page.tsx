import { RegisterForm } from '@/components/placement/auth/RegisterForm';

export const metadata = {
  title: 'Sign Up - Placement Portal',
  description: 'Create a new placement portal account',
};

export default function RegisterPage() {
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
        <RegisterForm />
      </div>
    </div>
  );
}
