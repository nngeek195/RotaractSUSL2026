'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Loader2, AlertCircle, CheckCircle, Info } from 'lucide-react'; // Ensure lucide-react is installed

// Firebase Imports
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter, useSearchParams } from "next/navigation";

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // UI State
    const [activeTab, setActiveTab] = useState('member');

    // Logic State
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [notice, setNotice] = useState("");
    const [loading, setLoading] = useState(false);

    // Check for verification success from URL
    useEffect(() => {
        if (searchParams.get('verified') === 'true') {
            setSuccess('Email verified successfully! You can now log in.');
        }
    }, [searchParams]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");
        setNotice("");

        try {
            // 1. Firebase Auth Login
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 1.5. Check if email is verified (for pending users)
            const pendingSnap = await getDoc(doc(db, "pendingRequests", user.uid));
            if (pendingSnap.exists()) {
                if (!user.emailVerified) {
                    setError("Please verify your email before logging in. Check your inbox for the verification link.");
                    await auth.signOut();
                    return;
                }
                // Do not write to Firestore here; admin manages approvals.
                setNotice("Your email is verified! Your application is now pending admin approval. You'll receive an email once approved.");
                await auth.signOut();
                return;
            }

            // 2. Role-Based Routing Logic

            // Check Admin Collection
            const adminSnap = await getDoc(doc(db, "admins", user.uid));
            if (adminSnap.exists()) {
                router.push("/admin");
                return;
            }

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

            // If not found anywhere, check if still pending approval
            const pendingAgain = await getDoc(doc(db, "pendingRequests", user.uid));
            if (pendingAgain.exists()) {
                setNotice("Your application is pending admin approval. Please wait for confirmation. You'll receive an email once approved.");
                await auth.signOut();
                return;
            }

            // Otherwise, show a clearer guidance message
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
            <main className="flex-1 flex items-center justify-center px-4 pt-32 pb-20">
                <div className="w-full max-w-[732px]">

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
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl mb-8 flex items-center gap-2 font-poppins text-sm">
                            <AlertCircle size={18} />
                            {error}
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
                </div>
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