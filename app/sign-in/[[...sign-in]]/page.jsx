import { SignIn } from '@clerk/nextjs';

const sanitizeReturnTo = (value) => {
    if (typeof value !== 'string') {
        return '/';
    }

    const trimmed = value.trim();
    if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
        return '/';
    }

    return trimmed;
};

export default function SignInPage({ searchParams }) {
    const returnTo = sanitizeReturnTo(searchParams?.return_to);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <SignIn routing="path" path="/sign-in" forceRedirectUrl={returnTo} fallbackRedirectUrl={returnTo} />
        </div>
    );
}
