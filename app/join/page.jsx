'use client';

import React, { useState } from 'react';
// Check these paths based on your folder structure
import { images } from '../../assets/images';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import MotionWrapper from '../components/MotionWrapper';
import { Loader2, AlertCircle, Mail } from 'lucide-react';

import { auth, db } from "../../lib/firebase";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

const facultyData = {
    "Faculty of Agricultural Sciences": [
        "Department of Export Agriculture",
        "Department of Livestock Production",
        "Department of Agribusiness Management"
    ],
    "Faculty of Applied Sciences": [
        "Department of Food Science and Technology",
        "Department of Natural Resources",
        "Department of Physical Sciences and Technology",
        "Department of Sport Sciences and Physical Education",
        " - "
    ],
    "Faculty of Computing": [
        "Department of Computing and Information Systems",
        "Department of Software Engineering",
        "Department of Data Science"
    ],
    "Faculty of Geomatics": [
        "Department of Remote Sensing and GIS",
        "Department of Surveying and Geodesy",
        " - "
    ],
    "Faculty of Management Studies": [
        "Department of Accountancy & Finance",
        "Department of Business Management",
        "Department of Marketing Management",
        "Department of Tourism Management"
    ],
    "Faculty of Medicine": [
        "Department of Anatomy",
        "Department of Biochemistry",
        "Department of Physiology",
        "Department of Microbiology",
        "Department of Parasitology",
        "Department of Pharmacology",
        "Department of Community Medicine",
        "Department of Forensic Medicine and Toxicology",
        "Department of Pathology",
        "Department of Primary Care and Family Medicine",
        "Department of Medicine",
        "Department of Paediatrics",
        "Department of Surgery",
        "Department of Psychiatry",
        "Department of Obstetrics and Gynecology",
        "Medical Education Unit"
    ],
    "Faculty of Social Sciences and Languages": [
        "Department of Economics and Statistics",
        "Department of English Language Teaching",
        "Department of Geography and Environmental Management",
        "Department of Information Technology",
        "Department of Languages",
        "Department of Social Sciences"
    ],
    "Faculty of Technology": [
        "Department of Biosystems Technology",
        "Department of Engineering Technology"
    ]
};

export default function JoinUs() {
    const router = useRouter();

    const [formData, setFormData] = useState({
        fullName: "", nameWithInitials: "", studentId: "", faculty: "", department: "",
        contact: "", email: "", reason: "", password: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            if (name === "faculty") {
                return { ...prev, [name]: value, department: "" };
            }
            return { ...prev, [name]: value };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            // 1. Create Auth User
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;

            // 2. Send Firebase built-in verification email
            await sendEmailVerification(user, {
                url: `${window.location.origin}/login`, // Redirect to login after verification
                handleCodeInApp: false
            });

            // 3. Save to Firestore (Status: email_verification_pending)
            await setDoc(doc(db, "pendingRequests", user.uid), {
                uid: user.uid,
                fullName: formData.fullName,
                nameWithInitials: formData.nameWithInitials,
                studentId: formData.studentId,
                faculty: formData.faculty,
                department: formData.department,
                whatsapp: formData.contact,
                email: formData.email,
                reason: formData.reason,
                status: "pending", // Will check auth.currentUser.emailVerified
                submittedAt: new Date()
            });

            setSuccess(true);
        } catch (err) {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                setError("This email is already registered. Please log in. If you haven't verified your email, you can request a new link on the login page.");
            } else {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="bg-gray-50 min-h-screen flex flex-col relative">
                <Navbar currentPage="join" />
                <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
                    <MotionWrapper
                        className="bg-white p-10 rounded-[40px] shadow-2xl border border-gray-100 max-w-xl w-full"
                        variant="scaleUp"
                    >
                        <div className="bg-pink-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Mail className="text-pink-600 w-12 h-12" />
                        </div>
                        <h2 className="text-3xl font-playfair font-bold mb-4 text-gray-900">Check your Email!</h2>
                        <p className="text-gray-600 font-poppins mb-6 leading-relaxed">
                            We sent a verification link to <span className="font-bold text-gray-900">{formData.email}</span>.
                            <br />
                            Please click it to verify your email, then our admin team will review your application.
                        </p>
                        <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-8">
                            <p className="text-red-600 font-bold font-poppins text-sm">
                                Please check your Spam or Junk folder if you don't see the email.
                            </p>
                        </div>
                        <button
                            onClick={() => router.push('/')}
                            className="w-full bg-gray-900 text-white py-4 rounded-xl font-poppins font-bold hover:bg-gray-800 transition shadow-lg"
                        >
                            Back to Home
                        </button>
                    </MotionWrapper>
                </div>
                <div className="py-6 text-center text-gray-400 text-xs font-poppins">
                    © 2025 Rotaract Club of Sabaragamuwa University of Sri Lanka.
                </div>
            </div>
        );
    }

    // --- Render Form ---
    return (
        <div className="bg-white min-h-screen flex flex-col relative">
            <Navbar currentPage="join" />

            {/* Hero Banner */}
            <section className="relative w-full max-w-[1440px] mx-auto px-4 pt-4 lg:pt-8">
                <MotionWrapper className="relative rounded-[43px] overflow-hidden h-[220px] md:h-[300px]">
                    <img src={images.imgRectangle66} alt="Hands united" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-center px-6">
                        <h1 className="font-playfair font-medium text-2xl md:text-[47px] text-white mb-4 leading-tight">
                            Be the Change. <span className="text-pink-600">Join Rotaract!</span>
                        </h1>
                        <p className="font-poppins font-medium text-xs md:text-[16px] text-white leading-relaxed max-w-3xl">
                            Ready to find your purpose, develop professional skills, and create real, lasting impact in the Sabaragamuwa community? Fill out the application below to start your journey with us.
                        </p>
                    </div>
                </MotionWrapper>
            </section>

            {/* Form Panel */}
            <section className="py-10 md:py-16 flex-1 px-4">
                <div className="max-w-[1140px] mx-auto">
                    <MotionWrapper
                        className="bg-[#eeeeee] rounded-[43px] shadow-[0_0_16px_5px_rgba(0,0,0,0.25)] px-6 md:px-14 py-10 md:py-14"
                        variant="fadeInUp"
                        delay={0.2}
                    >

                        {/* Error Message Display */}
                        {error && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-[16px] mb-6 flex items-start gap-2">
                                <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
                                <div className="font-poppins text-sm">
                                    {error}
                                    {error.includes("already registered") && (
                                        <div className="mt-2">
                                            <button
                                                onClick={() => router.push('/login')}
                                                className="font-bold underline hover:text-red-900"
                                            >
                                                Go to Login Page
                                            </button>
                                        </div>
                                    )}
                                </div>
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

                            {/* Name with Initials */}
                            <div>
                                <label htmlFor="nameWithInitials" className="block font-poppins font-medium text-[14px] md:text-[18px] text-pink-600 mb-1">Name with Initials</label>
                                <input
                                    id="nameWithInitials" name="nameWithInitials" type="text" required
                                    placeholder="e.g. W.A.D. Silva"
                                    value={formData.nameWithInitials} onChange={handleChange}
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
                                        {Object.keys(facultyData).map((faculty) => (
                                            <option key={faculty} value={faculty}>{faculty}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Department */}
                            <div>
                                <label htmlFor="department" className="block font-poppins font-medium text-[14px] md:text-[18px] text-pink-600 mb-1">Department</label>
                                <select
                                    id="department" name="department" required
                                    value={formData.department} onChange={handleChange}
                                    disabled={!formData.faculty}
                                    className="w-full h-[68px] border-2 border-pink-600 rounded-[16px] bg-white px-4 font-poppins text-sm focus:outline-none focus:ring-2 focus:ring-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <option value="" disabled hidden>
                                        {formData.faculty ? "Choose department" : "Select a faculty first"}
                                    </option>
                                    {formData.faculty && facultyData[formData.faculty]?.map((dept) => (
                                        <option key={dept} value={dept}>{dept}</option>
                                    ))}
                                </select>
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
                                <label htmlFor="email" className="block font-poppins font-medium text-[14px] md:text-[18px] text-pink-600 mb-1">University Email Address</label>
                                <p className="text-xs text-slate-500 mb-2 font-poppins">You strictly need to use your university provided email address.</p>
                                <input
                                    id="email" name="email" type="email" required placeholder="Enter your university email address"
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
                    </MotionWrapper>
                </div>
            </section>

            <Footer />
        </div >
    );
}