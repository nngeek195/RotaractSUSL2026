'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Loader2, AlertCircle, CheckCircle, Info } from 'lucide-react';
import MotionWrapper from '../components/MotionWrapper';
import { useAuth } from '../contexts/AuthContext';

import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence, sendEmailVerification } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter, useSearchParams } from "next/navigation";

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, loading: authLoading, isAdmin, isCommittee, isApproved } = useAuth();

    const [activeTab, setActiveTab] = useState('member');

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [notice, setNotice] = useState("");
    const [loading, setLoading] = useState(false);
    const [showResendLink, setShowResendLink] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);

    useEffect(() => {
        if (authLoading) return;
        if (!user) return;
        const isVerified = !!user.emailVerified;
        const canAccessProfile = isVerified && (isAdmin || isCommittee || isApproved);
        if (isAdmin) {
            router.push('/admin');
            return;
        }
        if (canAccessProfile) {
            router.push('/profile');
        }
    }, [user, authLoading, isAdmin, isCommittee, isApproved, router]);

    useEffect(() => {
        if (searchParams.get('verified') === 'true') {
            setSuccess('Your email has been verified. Your application is now pending admin approval. We will notify you by email once your account is approved.');
        }
        if (searchParams.get('reset') === 'success') {
            setSuccess('Your password has been reset successfully. Please log in with your new password.');
        }
    }, [searchParams]);

    useEffect(() => {
        if (authLoading) return;
        if (!user) return;
        const isVerified = !!user.emailVerified;
        const hasAccess = isAdmin || isCommittee || isApproved;
        if (isVerified && !hasAccess) {
            setNotice("Your email is verified! Your application is now pending admin approval. You'll receive an email once approved.");
        }
    }, [user, authLoading, isAdmin, isCommittee, isApproved]);

    const handleResendVerification = async () => {
        if (!auth.currentUser) return;
        setResendLoading(true);
        try {
            await sendEmailVerification(auth.currentUser);
            setSuccess("Verification email resent! Please check your inbox (and spam folder).");
            setShowResendLink(false);
            setError("");
        } catch (err) {
            console.error(err);
            if (err.code === 'auth/too-many-requests') {
                setError("Too many requests. Please wait a while before trying again.");
            } else {
                setError("Failed to resend email. Please try again later.");
            }
        } finally {
            setResendLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");
        setNotice("");
        setShowResendLink(false);

        try {
            await setPersistence(auth, browserLocalPersistence);

            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const loggedInUser = userCredential.user;

            const adminSnap = await getDoc(doc(db, "admins", loggedInUser.uid));
            if (adminSnap.exists()) {
                router.push("/admin");
                return;
            }

            if (!loggedInUser.emailVerified) {
                setError("Email not verified. Please check your inbox.");
                setShowResendLink(true);
                return;
            }

            try {
                await fetch('/api/notify-admin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: loggedInUser.email || email })
                });
            } catch (notifyErr) {
                console.error("Verification notification fallback error:", notifyErr);
            }

            const execSnap = await getDoc(doc(db, "executiveCommittee", loggedInUser.uid));
            if (execSnap.exists()) {
                router.push("/profile");
                return;
            }

            const userSnap = await getDoc(doc(db, "users", loggedInUser.uid));
            if (userSnap.exists()) {
                router.push("/profile");
                return;
            }

            setError("We couldn't find an active membership for this account. If you recently applied, please wait for admin approval. Otherwise, contact support.");
            await auth.signOut();
        } catch (err) {
            console.error(err);
            if (err.code === 'auth/invalid-credential') {
                setError("Invalid email or password.");
            } else {
                setError("Something went wrong. Please try again.");
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
                    <div className="flex mb-8">
                        <button
                            onClick={() => setActiveTab('member')}
                            className={`flex-1 py-3 font-poppins font-medium text-lg transition-colors ${activeTab === 'member'
                                ? 'bg-pink-600 text-white rounded-tl-lg rounded-tr-lg'
                                : 'bg-transparent text-black border-b-2 border-gray-200'
                                }`}
                        >
                            Member
                        </button>
                        <button
                            onClick={() => setActiveTab('committee')}
                            className={`flex-1 py-3 font-poppins font-medium text-lg transition-colors ${activeTab === 'committee'
                                ? 'bg-pink-600 text-white rounded-tl-lg rounded-tr-lg'
                                : 'bg-transparent text-black border-b-2 border-gray-200'
                                }`}
                        >
                            Committee
                        </button>
                    </div>

                    <div className="w-full h-px bg-gray-300 mb-8"></div>

                    {success && (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-2xl mb-8 flex items-center gap-2 font-poppins text-sm">
                            <CheckCircle size={18} />
                            {success}
                        </div>
                    )}

                    {notice && (
                        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-2xl mb-8 flex items-center gap-2 font-poppins text-sm">
                            <Info size={18} />
                            {notice}
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl mb-8 flex flex-col gap-2 font-poppins text-sm">
                            <div className="flex items-center gap-2">
                                <AlertCircle size={18} />
                                {error}
                            </div>
                            {showResendLink && (
                                <button
                                    type="button"
                                    onClick={handleResendVerification}
                                    disabled={resendLoading}
                                    className="text-sm font-semibold underline hover:text-red-800 self-start ml-6 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {resendLoading ? "Sending..." : "Resend Verification Email"}
                                </button>
                            )}
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

                        <div className="relative">
                            <div className="border border-pink-600 rounded-2xl px-6 py-5 h-[68px] flex items-center focus-within:ring-2 focus-within:ring-pink-600/20 transition-all">
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-transparent outline-none font-poppins text-base text-black placeholder-transparent"
                                    placeholder="Password"
                                    required
                                />
                            </div>
                            <label className="absolute -top-3.5 left-8 bg-white px-3 font-poppins font-medium text-pink-600 text-lg">
                                Password
                            </label>
                        </div>

                        <div className="flex justify-end -mt-4">
                            <Link href="/forgot-password" className="font-poppins text-sm text-pink-600 font-semibold hover:underline">
                                Forgot Password?
                            </Link>
                        </div>

                        <div className="flex flex-col items-center gap-4 pt-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-pink-600 text-white px-20 py-3.5 rounded-lg font-poppins font-medium text-lg hover:bg-[#b51b52] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        Logging in...
                                    </>
                                ) : (
                                    "Log in"
                                )}
                            </button>

                            <p className="font-poppins text-sm text-gray-500 mt-4">
                                Don&apos;t have an account?{' '}
                                <Link href="/join" className="text-pink-600 font-semibold hover:underline">
                                    Join the Club
                                </Link>
                            </p>
                        </div>
                    </form>
                </MotionWrapper>
            </main>

            <Footer />
        </div>
    );
}

export default function Login() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
            <LoginContent />
        </Suspense>
    );
}