'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { auth } from '../../lib/firebase';
import { applyActionCode } from 'firebase/auth';

export default function VerifyEmail() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState('verifying');

    useEffect(() => {
        const verifyEmail = async () => {
            const mode = searchParams.get('mode');
            const oobCode = searchParams.get('oobCode');

            if (mode === 'verifyEmail' && oobCode) {
                try {
                    // Apply the verification code (marks email as verified in Firebase Auth)
                    await applyActionCode(auth, oobCode);

                    setStatus('success');

                    // Redirect to login after 2 seconds
                    // Admin will check Firebase Auth directly for verification status
                    setTimeout(() => {
                        router.push('/login?verified=true');
                    }, 2000);
                } catch (error) {
                    console.error('Verification error:', error);
                    setStatus('error');
                }
            } else {
                setStatus('invalid');
            }
        };

        verifyEmail();
    }, [searchParams, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
                {status === 'verifying' && (
                    <>
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Email</h2>
                        <p className="text-gray-600">Please wait while we verify your email address...</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="text-green-500 text-5xl mb-4">✓</div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h2>
                        <p className="text-gray-600 mb-4">Your email has been successfully verified.</p>
                        <p className="text-sm text-gray-500">Redirecting to login...</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="text-red-500 text-5xl mb-4">✗</div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
                        <p className="text-gray-600 mb-4">The verification link is invalid or has expired.</p>
                        <button
                            onClick={() => router.push('/join')}
                            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
                        >
                            Register Again
                        </button>
                    </>
                )}

                {status === 'invalid' && (
                    <>
                        <div className="text-yellow-500 text-5xl mb-4">⚠</div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Link</h2>
                        <p className="text-gray-600">This verification link is not valid.</p>
                    </>
                )}
            </div>
        </div>
    );
}
