'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Loader2, AlertCircle, CheckCircle, Info } from 'lucide-react'; // Ensure lucide-react is installed
import MotionWrapper from '../components/MotionWrapper';
import { useAuth } from '../contexts/AuthContext';

// Firebase Imports
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence, sendEmailVerification } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter, useSearchParams } from "next/navigation";

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, loading: authLoading, isAdmin, isCommittee, isApproved } = useAuth();

    // UI State
    const [activeTab, setActiveTab] = useState('member');

    // Logic State
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [notice, setNotice] = useState("");
    const [loading, setLoading] = useState(false);
    const [showResendLink, setShowResendLink] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);

    // Redirect only when verified and approved/committee/admin
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
        // If not approved or not verified, stay on login page
    }, [user, authLoading, isAdmin, isCommittee, isApproved, router]);

    // Check for verification success from URL
    useEffect(() => {
        if (searchParams.get('verified') === 'true') {
            setSuccess('Your email has been verified. Your application is now pending admin approval. We will notify you by email once your account is approved.');
        }
    }, [searchParams]);

    // Show pending/verification status when user visits login
    useEffect(() => {
        if (authLoading) return;
        if (!user) return;
        const isVerified = !!user.emailVerified;
        const hasAccess = isAdmin || isCommittee || isApproved;
        if (isVerified && !hasAccess) {
            setNotice("Your email is verified! Your application is now pending admin approval. You'll receive an email once approved.");
        }
        // Removed the automatic "Please verify" notice to avoid clutter, logic handled in submit
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
            // 0. Set Persistence
            await setPersistence(auth, browserLocalPersistence);

            // 1. Firebase Auth Login
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Check Admin Collection FIRST to bypass verification if admin
            const adminSnap = await getDoc(doc(db, "admins", user.uid));
            if (adminSnap.exists()) {
                router.push("/admin");
                return;
            }

            // 1.5. Check if email is verified (Only for non-admins)
            if (!user.emailVerified) {
                setError("Email not verified. Please check your inbox.");
                setShowResendLink(true);
                // Do NOT sign out here, so we can resend the email
                return;
            }

            // 2. Role-Based Routing Logic
            // Check pending requests

            // Check Executive Committee Collection
            const execSnap = await getDoc(doc(db, "executiveCommittee", user.uid));
            if (execSnap.exists()) {
                router.push("/profile");
                return;
            }

            // Check User Collection
            const userSnap = await getDoc(doc(db, "users", user.uid));
            if (userSnap.exists()) {
                router.push("/profile");
                return;
            }

            // If not found anywhere
            setError("We couldn't find an active membership for this account. If you recently applied, please wait for admin approval. Otherwise, contact support.");
            await auth.signOut();

        } catch (err) {
            console.error(err);
            // Customize error messages
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
            {/* Navigation */}
            <Navbar currentPage="login" />

            {/* Login Form Section */}
            <main className="flex-1 flex items-center justify-center px-4 pt-12 pb-20">
                <MotionWrapper
                    className="w-full max-w-[732px]"
                    variant="scaleUp"
                >

                    {/* Tabs */}
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

                    {/* Divider Line */}
                    <div className="w-full h-px bg-gray-300 mb-8"></div>

                    {/* Success Message */}
                    {success && (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-2xl mb-8 flex items-center gap-2 font-poppins text-sm">
                            <CheckCircle size={18} />
                            {success}
                        </div>
                    )}

                    {/* Notice (Pending Approval) */}
                    {notice && (
                        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-2xl mb-8 flex items-center gap-2 font-poppins text-sm">
                            <Info size={18} />
                            {notice}
                        </div>
                    )}

                    {/* Error Display */}
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

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-8">

                        {/* Email Input */}
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

                        {/* Password Input */}
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

                        {/* Submit Button */}
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
                                Don't have an account?{' '}
                                <a href="/join" className="text-pink-600 font-semibold hover:underline">
                                    Join the Club
                                </a>
                            </p>
                        </div>
                    </form>
                </MotionWrapper>
            </main>

            {/* Footer */}
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