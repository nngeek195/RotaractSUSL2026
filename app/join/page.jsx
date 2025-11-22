'use client';

import React, { useState } from 'react';
import { images } from '../../assets/images';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

// Firebase Imports (Storage imports removed)
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function JoinUs() {
    const router = useRouter();

    // Form State
    const [formData, setFormData] = useState({
        fullName: "",
        studentId: "",
        faculty: "",
        department: "",
        contact: "",
        email: "",
        reason: "",
        password: "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    // Handle Input Changes
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Handle Form Submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            // 1. Create User in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;

            // 2. Save Data to Firestore (Pending Requests) - NO IMAGE URL
            await setDoc(doc(db, "pendingRequests", user.uid), {
                uid: user.uid,
                fullName: formData.fullName,
                studentId: formData.studentId,
                faculty: formData.faculty,
                department: formData.department,
                whatsapp: formData.contact,
                email: formData.email,
                reason: formData.reason,
                status: "pending",
                submittedAt: new Date()
            });

            setSuccess(true);

            // Redirect after success
            setTimeout(() => {
                router.push("/");
            }, 3000);

        } catch (err) {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                setError("This email is already registered.");
            } else if (err.code === 'auth/weak-password') {
                setError("Password should be at least 6 characters.");
            } else {
                setError("Something went wrong. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    // --- Render Success State ---
    if (success) {
        return (
            <div className="bg-white min-h-screen flex flex-col relative">
                <Navbar currentPage="join" />
                <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
                    <CheckCircle className="text-green-500 w-20 h-20 mb-6" />
                    <h2 className="font-playfair text-3xl text-black mb-4">Application Submitted!</h2>
                    <p className="font-poppins text-gray-600 max-w-md">
                        Thank you for your interest. Your application has been sent to the Executive Committee for review. You will be notified once approved.
                    </p>
                    <button onClick={() => router.push('/')} className="mt-8 bg-pink-600 text-white px-8 py-3 rounded-full font-poppins">
                        Back to Home
                    </button>
                </div>
                <Footer />
            </div>
        );
    }

    // --- Render Form ---
    return (
        <div className="bg-white min-h-screen flex flex-col relative">
            <Navbar currentPage="join" />

            {/* Hero Banner */}
            <section className="relative w-full max-w-[1440px] mx-auto px-4 pt-24 lg:pt-28">
                <div className="relative rounded-[43px] overflow-hidden h-[220px] md:h-[300px]">
                    <img src={images.imgRectangle66} alt="Hands united" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-center px-6">
                        <h1 className="font-playfair font-medium text-2xl md:text-[47px] text-white mb-4 leading-tight">
                            Be the Change. <span className="text-pink-600">Join Rotaract!</span>
                        </h1>
                        <p className="font-poppins font-medium text-xs md:text-[16px] text-white leading-relaxed max-w-3xl">
                            Ready to find your purpose, develop professional skills, and create real, lasting impact in the Sabaragamuwa community? Fill out the application below to start your journey with us.
                        </p>
                    </div>
                </div>
            </section>

            {/* Form Panel */}
            <section className="py-10 md:py-16 flex-1 px-4">
                <div className="max-w-[1140px] mx-auto">
                    <div className="bg-[#eeeeee] rounded-[43px] shadow-[0_0_16px_5px_rgba(0,0,0,0.25)] px-6 md:px-14 py-10 md:py-14">

                        {/* Error Message Display */}
                        {error && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-[16px] mb-6 flex items-center gap-2">
                                <AlertCircle size={20} />
                                <span className="font-poppins text-sm">{error}</span>
                            </div>
                        )}

                        <form className="space-y-6" onSubmit={handleSubmit}>
                            {/* Full Name */}
                            <div>
                                <label htmlFor="fullName" className="block font-poppins font-medium text-[14px] md:text-[18px] text-pink-600 mb-1">Full Name</label>
                                <input
                                    id="fullName" name="fullName" type="text" required
                                    value={formData.fullName} onChange={handleChange}
                                    className="w-full h-[68px] border-2 border-pink-600 rounded-[16px] bg-transparent px-4 font-poppins text-sm focus:outline-none focus:ring-2 focus:ring-pink-600"
                                />
                            </div>

                            {/* Row: Student ID / Faculty */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="studentId" className="block font-poppins font-medium text-[14px] md:text-[18px] text-pink-600 mb-1">Student ID</label>
                                    <input
                                        id="studentId" name="studentId" type="text" required
                                        value={formData.studentId} onChange={handleChange}
                                        className="w-full h-[68px] border-2 border-pink-600 rounded-[16px] bg-transparent px-4 font-poppins text-sm focus:outline-none focus:ring-2 focus:ring-pink-600"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="faculty" className="block font-poppins font-medium text-[14px] md:text-[18px] text-pink-600 mb-1">Faculty</label>
                                    <select
                                        id="faculty" name="faculty" required
                                        value={formData.faculty} onChange={handleChange}
                                        className="w-full h-[68px] border-2 border-pink-600 rounded-[16px] bg-white px-4 font-poppins text-sm focus:outline-none focus:ring-2 focus:ring-pink-600"
                                    >
                                        <option value="" disabled hidden>Choose faculty</option>
                                        <option value="Computing">Faculty of Computing</option>
                                        <option value="Applied Sciences">Applied Sciences</option>
                                        <option value="Management Studies">Management Studies</option>
                                        <option value="Social Sciences">Social Sciences & Languages</option>
                                        <option value="Agricultural Sciences">Agricultural Sciences</option>
                                        <option value="Geomatics">Geomatics</option>
                                        <option value="Medicine">Medicine</option>
                                        <option value="Technology">Technology</option>
                                    </select>
                                </div>
                            </div>

                            {/* Department */}
                            <div>
                                <label htmlFor="department" className="block font-poppins font-medium text-[14px] md:text-[18px] text-pink-600 mb-1">Department</label>
                                <input
                                    id="department" name="department" type="text" placeholder="e.g. Computing and Information System"
                                    value={formData.department} onChange={handleChange}
                                    className="w-full h-[68px] border-2 border-pink-600 rounded-[16px] bg-transparent px-4 font-poppins text-sm focus:outline-none focus:ring-2 focus:ring-pink-600"
                                />
                            </div>

                            {/* Contact No */}
                            <div>
                                <label htmlFor="contact" className="block font-poppins font-medium text-[14px] md:text-[18px] text-pink-600 mb-1">Contact No (WhatsApp)</label>
                                <input
                                    id="contact" name="contact" type="text" required
                                    value={formData.contact} onChange={handleChange}
                                    className="w-full h-[68px] border-2 border-pink-600 rounded-[16px] bg-transparent px-4 font-poppins text-sm focus:outline-none focus:ring-2 focus:ring-pink-600"
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="block font-poppins font-medium text-[14px] md:text-[18px] text-pink-600 mb-1">Student Email</label>
                                <input
                                    id="email" name="email" type="email" required placeholder="It is compulsury to use your Student Email"
                                    value={formData.email} onChange={handleChange}
                                    className="w-full h-[68px] border-2 border-pink-600 rounded-[16px] bg-transparent px-4 font-poppins text-sm focus:outline-none focus:ring-2 focus:ring-pink-600"
                                />
                            </div>

                            {/* Password Field */}
                            <div>
                                <label htmlFor="password" className="block font-poppins font-medium text-[14px] md:text-[18px] text-pink-600 mb-1">Set a Password (Min 6 chars)</label>
                                <input
                                    id="password" name="password" type="password" required minLength={6}
                                    value={formData.password} onChange={handleChange}
                                    className="w-full h-[68px] border-2 border-pink-600 rounded-[16px] bg-transparent px-4 font-poppins text-sm focus:outline-none focus:ring-2 focus:ring-pink-600"
                                />
                            </div>

                            {/* Why join */}
                            <div>
                                <label htmlFor="reason" className="block font-poppins font-medium text-[14px] md:text-[18px] text-pink-600 mb-1">Why do you want to join Rotaract?</label>
                                <textarea
                                    id="reason" name="reason" rows={5} required
                                    placeholder="Tell us about your passion for service..."
                                    value={formData.reason} onChange={handleChange}
                                    className="w-full border-2 border-pink-600 rounded-[16px] bg-transparent p-4 font-poppins text-sm focus:outline-none focus:ring-2 focus:ring-pink-600"
                                />
                            </div>

                            {/* Submit */}
                            <div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-pink-600 text-white h-[58px] rounded-[12px] font-poppins font-semibold text-sm hover:bg-[#b51b52] transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="animate-spin" size={20} />
                                            Processing...
                                        </>
                                    ) : (
                                        "Submit Application"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}