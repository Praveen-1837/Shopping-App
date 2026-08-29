import { SignUp } from '@clerk/clerk-react';

export default function SignUpPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md flex justify-center">
        <SignUp
          routing="path"
          path="/signup"
          signInUrl="/login"
          fallbackRedirectUrl="/my-account"
          appearance={{
            elements: {
              card: 'shadow-soft border border-text-muted/15 rounded-2xl bg-background-card',
              primaryButton: 'bg-primary hover:bg-primary-hover text-white text-sm font-medium',
              footerActionLink: 'text-primary hover:text-primary-hover font-semibold',
            },
          }}
        />
      </div>
    </div>
  );
}
