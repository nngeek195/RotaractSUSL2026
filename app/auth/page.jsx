'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '../../lib/firebase';
import { applyActionCode, checkActionCode, verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { Mail, CheckCircle, XCircle, Loader } from 'lucide-react';

function AuthActionContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [status, setStatus] = useState('verifying');
    const [mode, setMode] = useState('');
    const [oobCode, setOobCode] = useState('');
    const [resetEmail, setResetEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [formError, setFormError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const handleActionCode = async () => {
            const actionMode = searchParams.get('mode');
            const actionOobCode = searchParams.get('oobCode');

            setMode(actionMode || '');
            setOobCode(actionOobCode || '');

            if (!actionOobCode) {
                setStatus('check-email');
                return;
            }

            const openResetPasswordForm = async () => {
                const email = await verifyPasswordResetCode(auth, actionOobCode);
                setMode('resetPassword');
                setResetEmail(email || '');
                setStatus('reset-form');
            };

            const verifyEmailAddress = async () => {
                const info = await checkActionCode(auth, actionOobCode);
                const email = info?.data?.email;

                await applyActionCode(auth, actionOobCode);
                setMode('verifyEmail');
                setStatus('success');

                if (email) {
                    try {
                        await fetch('/api/notify-admin', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email })
                        });
                    } catch (notifyError) {
                        console.error('Post-verification notification failed:', notifyError);
                    }
                }

                setTimeout(() => {
                    router.push('/login?verified=true');
                }, 3000);
            };

            if (actionMode === 'verifyEmail') {
                try {
                    await verifyEmailAddress();
                } catch (error) {
                    console.error('Verification error:', error);
                    setStatus('error');
                }
                return;
            }

            if (actionMode === 'resetPassword' || actionMode === 'action') {
                try {
                    await openResetPasswordForm();
                } catch {
                    try {
                        await verifyEmailAddress();
                    } catch (fallbackError) {
                        console.error('Could not infer action from code:', fallbackError);
                        setStatus('error');
                    }
                }
                return;
            }

            try {
                await openResetPasswordForm();
                return;
            } catch {}

            try {
                await verifyEmailAddress();
                return;
            } catch {}

            setStatus('error');
        };

        handleActionCode();
    }, [searchParams, router]);

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setFormError('');

        if (newPassword.length < 6) {
            setFormError('Password must be at least 6 characters.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setFormError('Passwords do not match.');
            return;
        }

        setSubmitting(true);
        try {
            await confirmPasswordReset(auth, oobCode, newPassword);
            setStatus('reset-success');
            setTimeout(() => {
                router.push('/login?reset=success');
            }, 3000);
        } catch (error) {
            console.error('Password reset confirmation error:', error);
            if (error.code === 'auth/weak-password') {
                setFormError('Password is too weak. Use at least 6 characters.');
            } else if (error.code === 'auth/expired-action-code' || error.code === 'auth/invalid-action-code') {
                setFormError('This password reset link is invalid or expired. Request a new link.');
            } else {
                setFormError('Could not reset password. Please try again.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (status === 'check-email') {
        return (
            <div className="mx-auto max-w-xl rounded-2xl border border-gray-200 bg-white/70 backdrop-blur p-6 sm:p-8 shadow-sm text-center">
                <div className="mx-auto w-20 h-20 rounded-full bg-pink-100 flex items-center justify-center mb-6">
                    <Mail className="w-10 h-10 text-pink-600" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-3 text-gray-900">Check your Email!</h1>
                <p className="text-gray-600 leading-relaxed">
                    We sent a verification link to your email. Please click it to verify your email.
                    <br />Once verified, you can log in to access your member account immediately.
                </p>
                <p className="text-sm mt-4 text-red-600 font-bold">
                    If you do not see the email, please check your spam or junk folder.
                </p>
                <div className="mt-6">
                    <Link href="/" className="inline-flex items-center gap-2 rounded-full bg-pink-600 px-5 py-2.5 text-white font-medium shadow hover:bg-pink-700 transition-colors">
                        Back to Home
                    </Link>
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
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing...</h2>
                    <p className="text-gray-600">Please wait while we validate your request.</p>
                </>
            )}

            {status === 'success' && (
                <>
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 text-green-600">
                        <CheckCircle className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h2>
                    <p className="text-gray-600 mb-4">Your email has been successfully verified. You can now log in to access your member account.</p>
                    <p className="text-sm text-gray-500">Redirecting to login...</p>
                </>
            )}

            {status === 'reset-form' && (
                <>
                    <div className="mx-auto w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mb-4 text-pink-600">
                        <Mail className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Set New Password</h2>
                    {resetEmail && <p className="text-gray-600 mb-4">Resetting password for {resetEmail}</p>}

                    <form onSubmit={handleResetPassword} className="space-y-4 text-left">
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="New password"
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-pink-500"
                            minLength={6}
                            required
                        />
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-pink-500"
                            minLength={6}
                            required
                        />

                        {formError && <p className="text-sm text-red-600">{formError}</p>}

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full rounded-lg bg-pink-600 text-white py-3 font-semibold hover:bg-pink-700 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {submitting ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>
                </>
            )}

            {status === 'reset-success' && (
                <>
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 text-green-600">
                        <CheckCircle className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Reset Complete</h2>
                    <p className="text-gray-600 mb-4">Your password has been updated successfully.</p>
                    <p className="text-sm text-gray-500">Redirecting to login...</p>
                </>
            )}

            {status === 'error' && (
                <>
                    <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
                        <XCircle className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {mode === 'resetPassword' ? 'Password Reset Failed' : 'Verification Failed'}
                    </h2>
                    <p className="text-gray-600 mb-4">
                        {mode === 'resetPassword'
                            ? 'The password reset link is invalid or has expired.'
                            : 'The verification link is invalid or has expired.'}
                    </p>
                    <Link href={mode === 'resetPassword' ? '/forgot-password' : '/login'} className="text-pink-600 font-semibold hover:underline">
                        {mode === 'resetPassword' ? 'Request New Reset Link' : 'Return to Login'}
                    </Link>
                </>
            )}
        </div>
    );
}

export default function AuthActionPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Suspense fallback={<div className="text-pink-600 font-bold">Loading...</div>}>
                <AuthActionContent />
            </Suspense>
        </div>
    );
}