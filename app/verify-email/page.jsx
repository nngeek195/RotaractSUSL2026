'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { auth } from '../../lib/firebase';
import { applyActionCode } from 'firebase/auth';

function VerifyEmailContent() {
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
                        return (
                        <section className="min-h-[60vh] py-12 sm:py-16">
                            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                                <div className="mx-auto max-w-xl rounded-2xl border border-gray-200 bg-white/70 backdrop-blur p-6 sm:p-8 shadow-sm">
                                    <div className="mx-auto w-20 h-20 rounded-full bg-pink-100 flex items-center justify-center mb-6">
                                        <Mail className="w-10 h-10 text-pink-600" />
                                    </div>
                                    <h1 className="text-2xl sm:text-3xl font-bold mb-3 text-gray-900 text-center">Check your Email!</h1>
                                    <p className="text-gray-600 leading-relaxed text-center">
                                        We sent a verification link to <span className="font-semibold">your email</span>. Please click it to verify your email, then our admin team will review your application. If you don’t see the email, check your <span className="font-semibold">Spam/Junk</span> folder and mark it as Not Spam.
                                    </p>
                                    <div className="mt-6 flex justify-center">
                                        <a href="/" className="inline-flex items-center gap-2 rounded-full bg-pink-600 px-5 py-2.5 text-white font-medium shadow hover:bg-pink-700 transition-colors">Back to Home</a>
                                    </div>
                                </div>
                            </div>
                        </section>
                        );
                        export default function VerifyEmail() {
    return (
                        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
                            <VerifyEmailContent />
                        </Suspense>
                        );
}
