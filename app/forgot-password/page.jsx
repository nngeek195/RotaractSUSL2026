'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import MotionWrapper from '../components/MotionWrapper';
import { auth } from '@/lib/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            await sendPasswordResetEmail(auth, email.trim());
            setSuccess('Password reset email sent. Check your inbox and spam folder.');
        } catch (err) {
            console.error(err);
            if (err.code === 'auth/invalid-email') {
                setError('Please enter a valid email address.');
            } else if (err.code === 'auth/too-many-requests') {
                setError('Too many requests. Please wait and try again.');
            } else {
                setError('Could not send reset email. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white relative w-full min-h-screen flex flex-col">
            <Navbar currentPage="login" />

            <main className="flex-1 flex items-center justify-center px-4 pt-12 pb-20">
                <MotionWrapper className="w-full max-w-[732px]" variant="scaleUp">
                    <div className="text-center mb-8">
                        <h1 className="font-poppins text-3xl font-semibold text-black">Forgot Password</h1>
                        <p className="font-poppins text-gray-600 mt-3">
                            Enter your email and we will send you a password reset link.
                        </p>
                    </div>

                    {success && (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-2xl mb-8 flex items-center gap-2 font-poppins text-sm">
                            <CheckCircle size={18} />
                            {success}
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl mb-8 flex items-center gap-2 font-poppins text-sm">
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="relative">
                            <div className="border border-pink-600 rounded-2xl px-6 py-5 h-[68px] flex items-center focus-within:ring-2 focus-within:ring-pink-600/20 transition-all">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-transparent outline-none font-poppins text-base text-black placeholder-transparent"
                                    placeholder="Student Email"
                                    required
                                />
                            </div>
                            <label className="absolute -top-3.5 left-8 bg-white px-3 font-poppins font-medium text-pink-600 text-lg">
                                Student Email
                            </label>
                        </div>

                        <div className="flex flex-col items-center gap-4 pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-pink-600 text-white px-20 py-3.5 rounded-lg font-poppins font-medium text-lg hover:bg-[#b51b52] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        Sending...
                                    </>
                                ) : (
                                    'Send Reset Link'
                                )}
                            </button>

                            <Link href="/login" className="font-poppins text-sm text-pink-600 font-semibold hover:underline mt-2">
                                Back to Login
                            </Link>
                        </div>
                    </form>
                </MotionWrapper>
            </main>

            <Footer />
        </div>
    );
}