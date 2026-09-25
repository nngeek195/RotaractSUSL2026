'use client';

import React, { useState, useEffect } from 'react';
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function EventRegister() {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    const [activeCalls, setActiveCalls] = useState([]);
    
    const [selectedCallId, setSelectedCallId] = useState("");
    const [selectedPosition, setSelectedPosition] = useState("");
    const [teamRole, setTeamRole] = useState(""); 
    
    const [applicantName, setApplicantName] = useState("");
    const [applicantEmail, setApplicantEmail] = useState("");
    
    // Custom Form Answers
    const [customAnswers, setCustomAnswers] = useState({});

    useEffect(() => {
        const fetchCalls = async () => {
            try {
                const q = query(collection(db, "ocCalls"), where("status", "==", "open"));
                const querySnapshot = await getDocs(q);
                const calls = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setActiveCalls(calls);
            } catch (err) {
                console.error("Failed to fetch OC calls:", err);
                toast.error("Failed to load applications.");
            } finally {
                setLoading(false);
            }
        };
        fetchCalls();
    }, []);

    const currentCall = activeCalls.find(c => c.id === selectedCallId);
    const currentPositionDetails = currentCall?.positions?.find(p => p.title === selectedPosition);

    const handleCallChange = (e) => {
        setSelectedCallId(e.target.value);
        setSelectedPosition("");
        setTeamRole("");
        setCustomAnswers({}); // Reset answers when changing calls
    };

    const handleAnswerChange = (questionId, value) => {
        setCustomAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    // --- STRICT EMAIL VALIDATION ---
    const verifyUserEmail = async (email) => {
        const userQ = query(collection(db, "users"), where("email", "==", email.trim()));
        const execQ = query(collection(db, "executiveCommittee"), where("email", "==", email.trim()));
        
        const [uSnap, eSnap] = await Promise.all([getDocs(userQ), getDocs(execQ)]);
        
        if (!uSnap.empty) return uSnap.docs[0].data();
        if (!eSnap.empty) return eSnap.docs[0].data();
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            // 1. Validate Email
            const registeredUser = await verifyUserEmail(applicantEmail);
            if (!registeredUser) {
                toast.error("This email is not registered in our system. Please use your verified university email.");
                setSubmitting(false);
                return;
            }

            // 2. Submit Application with Verified Details
            await addDoc(collection(db, "ocApplications"), {
                callId: selectedCallId,
                applicationName: currentCall.applicationName,
                position: selectedPosition,
                teamRole: teamRole || "N/A",
                // Prefer the database name/details over what they typed, ensuring accuracy for the Director
                applicantName: registeredUser.fullName || applicantName, 
                applicantEmail: applicantEmail.trim(),
                studentId: registeredUser.studentId || registeredUser.indexNumber || "N/A",
                faculty: registeredUser.faculty || "N/A",
                department: registeredUser.department || "N/A",
                contactNumber: registeredUser.whatsapp || registeredUser.mobileNumber || "N/A",
                customAnswers: customAnswers,
                status: "pending", // Status used for director selection
                userId: registeredUser.uid || auth.currentUser?.uid || "unknown",
                appliedAt: new Date()
            });

            toast.success("Application submitted successfully!");
            setSelectedCallId("");
            setSelectedPosition("");
            setTeamRole("");
            setApplicantName("");
            setApplicantEmail("");
            setCustomAnswers({});
        } catch (error) {
            console.error("Error submitting application:", error);
            toast.error("Failed to submit application.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen flex flex-col">
            <Navbar currentPage="register" />
            
            <main className="flex-1 py-12 px-4">
                <div className="max-w-2xl mx-auto bg-white p-8 md:p-12 rounded-[40px] shadow-2xl border border-gray-100">
                    
                    <div className="text-center mb-10">
                        <h1 className="text-3xl md:text-4xl font-playfair font-bold text-gray-900 mb-3">Join the OC</h1>
                        <p className="text-gray-500 font-poppins text-sm">Apply for open Organizing Committee positions and lead our upcoming events.</p>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-pink-600" size={40} /></div>
                    ) : activeCalls.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-200">
                            <p className="font-poppins text-gray-500">There are no open OC calls at the moment.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            
                            <div>
                                <label className="block font-poppins font-bold text-sm text-pink-600 mb-2">Application *</label>
                                <select 
                                    required value={selectedCallId} onChange={handleCallChange}
                                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-pink-600 outline-none font-poppins bg-white"
                                >
                                    <option value="" disabled>Select an Event</option>
                                    {activeCalls.map(call => (
                                        <option key={call.id} value={call.id}>{call.applicationName}</option>
                                    ))}
                                </select>
                            </div>

                            {currentCall && (
                                <div className="animate-in fade-in">
                                    <label className="block font-poppins font-bold text-sm text-pink-600 mb-2">Position *</label>
                                    <select 
                                        required value={selectedPosition} onChange={(e) => handlePositionChange(e)}
                                        className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-pink-600 outline-none font-poppins bg-white"
                                    >
                                        <option value="" disabled>Select a Position</option>
                                        {currentCall.positions.map((pos, idx) => (
                                            <option key={idx} value={pos.title}>{pos.title}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {currentPositionDetails?.teamStructure === 'needs_lead' && (
                                <div className="animate-in fade-in slide-in-from-top-2 bg-pink-50 p-6 rounded-2xl border border-pink-100">
                                    <label className="block font-poppins font-bold text-sm text-pink-700 mb-4">Are you applying as a Team Lead or Team Mate? *</label>
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-3 bg-white p-4 rounded-xl cursor-pointer">
                                            <input type="radio" name="teamRole" value="Team Lead" required checked={teamRole === 'Team Lead'} onChange={(e) => setTeamRole(e.target.value)} className="w-5 h-5 accent-pink-600" />
                                            <span className="font-poppins font-medium text-gray-800">Team Lead</span>
                                        </label>
                                        <label className="flex items-center gap-3 bg-white p-4 rounded-xl cursor-pointer">
                                            <input type="radio" name="teamRole" value="Team Mate" required checked={teamRole === 'Team Mate'} onChange={(e) => setTeamRole(e.target.value)} className="w-5 h-5 accent-pink-600" />
                                            <span className="font-poppins font-medium text-gray-800">Team Mate</span>
                                        </label>
                                    </div>
                                </div>
                            )}

                            {/* Dynamic Custom Questions Rendering */}
                            {currentCall?.customQuestions && currentCall.customQuestions.length > 0 && (
                                <div className="space-y-6 pt-4 border-t border-gray-200">
                                    <h3 className="font-poppins font-bold text-gray-800">Additional Questions</h3>
                                    {currentCall.customQuestions.map((q) => (
                                        <div key={q.id}>
                                            <label className="block font-poppins font-bold text-sm text-gray-600 mb-2">{q.questionText} *</label>
                                            
                                            {q.type === 'paragraph' && (
                                                <textarea required rows={3} onChange={(e) => handleAnswerChange(q.id, e.target.value)} className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-pink-600 outline-none font-poppins" />
                                            )}
                                            
                                            {q.type === 'yes_no' && (
                                                <div className="flex gap-4">
                                                    <label className="flex items-center gap-2"><input type="radio" name={q.id} value="Yes" required onChange={(e) => handleAnswerChange(q.id, e.target.value)} className="w-4 h-4 accent-pink-600"/> Yes</label>
                                                    <label className="flex items-center gap-2"><input type="radio" name={q.id} value="No" required onChange={(e) => handleAnswerChange(q.id, e.target.value)} className="w-4 h-4 accent-pink-600"/> No</label>
                                                </div>
                                            )}
                                            
                                            {q.type === 'multi_select' && (
                                                <select required onChange={(e) => handleAnswerChange(q.id, e.target.value)} className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-pink-600 outline-none font-poppins bg-white">
                                                    <option value="" disabled selected>Select an option</option>
                                                    {q.options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                                                </select>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <hr className="border-gray-200 my-8" />

                            <div className="space-y-6">
                                <div>
                                    <label className="block font-poppins font-bold text-sm text-pink-600 mb-2">Full Name *</label>
                                    <input type="text" required placeholder="Your full name" value={applicantName} onChange={(e) => setApplicantName(e.target.value)} className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-pink-600 outline-none font-poppins" />
                                </div>
                                <div>
                                    <label className="block font-poppins font-bold text-sm text-pink-600 mb-2">Registered Email Address *</label>
                                    <p className="text-xs text-gray-500 mb-2 font-poppins">Must match your verified club account email.</p>
                                    <input type="email" required placeholder="Your university email" value={applicantEmail} onChange={(e) => setApplicantEmail(e.target.value)} className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-pink-600 outline-none font-poppins" />
                                </div>
                            </div>

                            <button type="submit" disabled={submitting || !selectedPosition} className="w-full bg-pink-600 text-white font-poppins font-bold py-4 rounded-xl hover:bg-[#b51b52] transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 mt-8">
                                {submitting ? <Loader2 className="animate-spin" /> : <><Send size={20} /> Submit Application</>}
                            </button>
                        </form>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
}