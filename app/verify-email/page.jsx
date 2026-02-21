'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { auth, db } from '../../lib/firebase';
import { applyActionCode, checkActionCode } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Mail, CheckCircle, XCircle, Loader } from 'lucide-react';

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
                    // 1. Check the code first to get the email address
                    const info = await checkActionCode(auth, oobCode);
                    const email = info['data']['email'];

                    // 2. Apply the verification code
                    await applyActionCode(auth, oobCode);

                    setStatus('success');

                    // 3. Trigger WhatsApp Notification (API handles data fetch)
                    if (email) {
                        try {
                            const notifyRes = await fetch('/api/notify-admin', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ provider: 'waha', email })
                            });

                            if (!notifyRes.ok) {
                                const notifyResult = await notifyRes.json().catch(() => ({}));
                                console.error("WhatsApp notification failed:", notifyResult);
                            }
                        } catch (err) {
                            console.error("Notification trigger failed:", err);
                        }
                    }

                    // Redirect to login after 3 seconds
                    setTimeout(() => {
                        router.push('/login?verified=true');
                    }, 3000);
                } catch (error) {
                    console.error('Verification error:', error);
                    setStatus('error');
                }
            } else {
                // If no code is present, show the "Check your email" message
                setStatus('check-email');
            }
        };

        verifyEmail();
    }, [searchParams, router]);

    if (status === 'check-email') {
        return (
            <div className="mx-auto max-w-xl rounded-2xl border border-gray-200 bg-white/70 backdrop-blur p-6 sm:p-8 shadow-sm text-center">
                <div className="mx-auto w-20 h-20 rounded-full bg-pink-100 flex items-center justify-center mb-6">
                    <Mail className="w-10 h-10 text-pink-600" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-3 text-gray-900">Check your Email!</h1>
                <p className="text-gray-600 leading-relaxed">
                    We sent a verification link to your email. Please click it to verify your email. 
                    <br/>After verification, our admin team will review your membership application.
                </p>
                <p className="text-sm mt-4 text-red-600 font-bold">
                    If you don’t see the email, please check your Spam or Junk folder.
                </p>
                <div className="mt-6">
                    <a href="/" className="inline-flex items-center gap-2 rounded-full bg-pink-600 px-5 py-2.5 text-white font-medium shadow hover:bg-pink-700 transition-colors">
                        Back to Home
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
            {status === 'verifying' && (
                <>
                    <div className="mx-auto w-16 h-16 flex items-center justify-center mb-4 text-pink-600">
                        <Loader className="w-10 h-10 animate-spin" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying...</h2>
                    <p className="text-gray-600">Please wait while we verify your email address.</p>
                </>
            )}

            {status === 'success' && (
                <>
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 text-green-600">
                        <CheckCircle className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h2>
                    <p className="text-gray-600 mb-4">Your email has been successfully verified.</p>
                    <p className="text-sm text-gray-500">Redirecting to login...</p>
                </>
            )}

            {status === 'error' && (
                <>
                    <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
                        <XCircle className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
                    <p className="text-gray-600 mb-4">The verification link is invalid or has expired.</p>
                    <a href="/login" className="text-pink-600 font-semibold hover:underline">
                        Return to Login
                    </a>
                </>
            )}
             {status === 'invalid' && (
                <>
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-600">
                        <XCircle className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Link</h2>
                    <p className="text-gray-600 mb-4">This verification link is missing required information.</p>
                    <a href="/" className="text-pink-600 font-semibold hover:underline">
                        Go Home
                    </a>
                </>
            )}
        </div>
    );
}

export default function VerifyEmail() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Suspense fallback={<div className="text-pink-600 font-bold">Loading...</div>}>
                <VerifyEmailContent />
            </Suspense>
        </div>
    );
}