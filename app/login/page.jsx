'use client';

import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Loader2, AlertCircle } from 'lucide-react'; // Ensure lucide-react is installed

// Firebase Imports
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function Login() {
    const router = useRouter();

    // UI State
    const [activeTab, setActiveTab] = useState('member');

    // Logic State
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            // 1. Firebase Auth Login
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

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

            // Check if still pending
            const pendingSnap = await getDoc(doc(db, "pendingRequests", user.uid));
            if (pendingSnap.exists()) {
                setError("Your account is pending approval by the Board.");
                await auth.signOut(); // Force logout so they can't access protected routes
            } else {
                setError("Account not found in active member lists.");
                await auth.signOut();
            }

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