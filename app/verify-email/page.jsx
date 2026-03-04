'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function VerifyEmailRedirectPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const qs = searchParams.toString();
        router.replace(qs ? `/auth?${qs}` : '/auth');
    }, [router, searchParams]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 text-gray-700">
            Redirecting...
        </div>
    );
}