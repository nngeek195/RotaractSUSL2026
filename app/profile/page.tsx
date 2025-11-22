"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, arrayUnion } from 'firebase/firestore';
import { Html5QrcodeScanner } from 'html5-qrcode';
import QRCode from 'react-qr-code';
import {
    Mail, Phone, Award, LogOut, Loader2, BookOpen,
    Calendar, QrCode as QrIcon, GraduationCap, ShieldCheck, PlayCircle, MapPin
} from 'lucide-react';
import { images } from '../../assets/images';
import NavBar from '../components/Navbar';
import Footer from '../components/Footer';

// ... (Interfaces and Imports remain the same) ...

export default function Profile() {
    const router = useRouter();

    // ... (State definitions remain the same) ...
    const [loading, setLoading] = useState<boolean>(true);
    const [profile, setProfile] = useState<any>(null); // Using any for simplicity here, keep your interface
    const [contributions, setContributions] = useState<any[]>([]);
    const [isExec, setIsExec] = useState<boolean>(false); // This controls the visibility

    // ... (Other states: upcomingEvents, attendanceModal, etc.) ...
    const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
    const [happeningEvents, setHappeningEvents] = useState<any[]>([]);
    const [attendanceModal, setAttendanceModal] = useState<any>({ isOpen: false });
    const [attendanceEmail, setAttendanceEmail] = useState<string>("");
    const [attendanceProject, setAttendanceProject] = useState<any>({ projectId: null, eventName: "" });

    // --- DATA FETCHING (Logic remains the same) ---
    useEffect(() => {
        let scanner: any = null;
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) { router.push("/login"); return; }

            try {
                let userDoc = await getDoc(doc(db, "users", user.uid));
                let data = userDoc.data();
                let sourceCollection = "users";

                if (!userDoc.exists()) {
                    userDoc = await getDoc(doc(db, "executiveCommittee", user.uid));
                    data = userDoc.data();
                    sourceCollection = "executiveCommittee";
                }

                if (!userDoc.exists()) {
                    // ... (Admin check logic)
                    const adminDoc = await getDoc(doc(db, "admins", user.uid));
                    if (adminDoc.exists()) { router.push("/admin"); return; }
                    return;
                }

                if (data) {
                    setProfile({
                        fullName: data.fullName,
                        email: data.email,
                        studentId: data.studentId,
                        faculty: data.faculty,
                        department: data.department || "N/A",
                        whatsapp: data.whatsapp,
                        position: data.position || "Member",
                        collection: sourceCollection,
                        imageUrl: data.imageUrl || ""
                    });

                    // --- CHECK IF EXEC ---
                    if (sourceCollection === "executiveCommittee") {
                        setIsExec(true); // <--- This sets the flag
                        fetchExCoProjects();
                    }

                    // ... (Fetch Contributions logic) ...
                    const q = query(collection(db, "events"), where("participants", "array-contains", data.email));
                    const querySnapshot = await getDocs(q);
                    const userContributions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    userContributions.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
                    setContributions(userContributions);
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
            } finally {
                setLoading(false);
            }
        });
        return () => { unsubscribe(); if (scanner) scanner.clear(); };
    }, [router]);

    // ... (Helper functions: fetchExCoProjects, handleLogout, etc. remain the same) ...
    const fetchExCoProjects = async () => { /* ... */ };
    const handleLogout = async () => { await signOut(auth); router.push("/"); };
    const handleAddParticipant = async (e: any) => { /* ... */ };
    const startQrScanner = () => { /* ... */ };
    const selectEvent = (eventId: string, eventName: string) => { setAttendanceProject({ projectId: eventId, eventName: eventName }); };

    if (loading) return <div className="flex min-h-screen items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-blue-900" size={40} /></div>;
    if (!profile) return null;

    return (
        <div className="bg-white min-h-screen flex flex-col">
            <NavBar currentPage="leadership" />
            <br /><br /><br /><br /><br />

            <main className="flex-1 px-4 py-8">
                <div className="max-w-[1440px] mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-8 lg:gap-16">

                        {/* --- LEFT COLUMN: My Profile --- */}
                        <div className="lg:w-[450px]">
                            <div className="mb-6">
                                <h2 className="font-poppins font-medium text-lg text-pink-600 text-center mb-4">
                                    My Profile
                                </h2>
                                <div className="border-t-2 border-gray-300 mb-8"></div>
                            </div>

                            {/* --- CONDITIONAL RENDERING START --- */}
                            {/* Only show Image and Position Badge if user is Executive Committee */}
                            {isExec && (
                                <div className="flex flex-col items-center mb-8">
                                    <div className="relative mb-4">
                                        <img
                                            src={profile.imageUrl || "https://via.placeholder.com/296"}
                                            alt="Profile"
                                            className="w-[296px] h-[296px] rounded-[38px] object-cover bg-gray-200"
                                            onError={(e) => (e.target as HTMLImageElement).src = "https://via.placeholder.com/296?text=No+Image"}
                                        />
                                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-rotaract-pink text-white px-8 py-3 rounded-[32px] shadow-md whitespace-nowrap">
                                            <p className="font-playfair font-medium text-[19px]">{profile.position}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {/* --- CONDITIONAL RENDERING END --- */}

                            {/* User Details */}
                            <div className="space-y-3 mb-8">
                                <div className="flex items-center gap-4">
                                    <p className="font-poppins font-medium text-[15px] text-pink-600 w-28">Index No</p>
                                    <p className="font-poppins text-[15px] text-[#707070]">{profile.studentId}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <p className="font-poppins font-medium text-[15px] text-pink-600 w-28">Name</p>
                                    <p className="font-poppins text-[15px] text-[#707070]">{profile.fullName}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <p className="font-poppins font-medium text-[15px] text-pink-600 w-28">Faculty</p>
                                    <p className="font-poppins text-[15px] text-[#707070]">{profile.faculty}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <p className="font-poppins font-medium text-[15px] text-pink-600 w-28">Department</p>
                                    <p className="font-poppins text-[15px] text-[#707070]">{profile.department}</p>
                                </div>
                            </div>

                            {/* QR Code */}
                            <div className="flex justify-center">
                                <div className="p-2 bg-white border-4 border-black rounded-xl">
                                    <QRCode
                                        value={profile.email}
                                        className="w-[250px] h-[250px]"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* --- RIGHT COLUMN: Dashboard & Contributions --- */}
                        <div>
                            {isExec && (
                                <div className="mb-12">
                                    <h2 className="font-poppins font-medium text-lg text-pink-600 text-center mb-4">
                                        Scan Code
                                    </h2>
                                    <div className="border-t-2 border-gray-300 mb-8"></div>

                                    <div className="flex justify-center">
                                        <button
                                            className="relative w-[221px] h-[221px] rounded-[38px] border border-black/20 flex items-center justify-center overflow-hidden group hover:scale-105 transition-transform duration-200 shadow-sm"
                                            onClick={() => setAttendanceModal({ isOpen: true })}
                                        >
                                            <div
                                                className="absolute inset-0 bg-cover bg-center filter blur-sm opacity-30"
                                                style={{
                                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cg fill='%23000'%3E%3Crect x='0' y='0' width='20' height='20'/%3E%3Crect x='80' y='0' width='20' height='20'/%3E%3Crect x='0' y='80' width='20' height='20'/%3E%3C/g%3E%3C/svg%3E")`
                                                }}
                                            />
                                            <div className="absolute inset-0 bg-[#625f5f]/80" />
                                            <div className="relative z-10 flex flex-col items-center gap-2">
                                                <QrIcon size={32} color='white' />
                                                <p className="font-poppins text-white text-center px-4 text-sm font-medium">
                                                    Mark Attendance
                                                </p>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* My Contributions */}
                            <div className="mb-6">
                                <h2 className="font-poppins font-medium text-lg text-pink-600 text-center mb-4">
                                    My Contributions
                                </h2>
                                <div className="border-t-2 border-gray-300 mb-8"></div>
                            </div>

                            {/* Contributions Grid */}
                            {contributions.length === 0 ? (
                                <div className="text-center text-gray-500 py-10 bg-gray-50 rounded-2xl border border-gray-100">
                                    <p>You haven't participated in any events yet.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {contributions.map((project) => (
                                        <div key={project.id} className="bg-white rounded-[22px] shadow-[0_0_26px_2px_rgba(0,0,0,0.25)] overflow-hidden h-[255px] flex flex-col group hover:shadow-xl transition-shadow">
                                            <div className="flex h-full">
                                                {/* Image */}
                                                <div className="w-[157px] h-full bg-[#d9d9d9] flex-shrink-0 rounded-bl-[22px] rounded-tl-[22px]">
                                                    <img
                                                        src={project.imageUrl || images.imgRectangle20}
                                                        alt={project.name}
                                                        className="w-full h-full object-cover rounded-bl-[22px] rounded-tl-[22px]"
                                                        onError={(e) => (e.target as HTMLImageElement).src = 'https://via.placeholder.com/157x255?text=Event'}
                                                    />
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 p-4 flex flex-col justify-between">
                                                    <div>
                                                        <h3 className="font-playfair font-medium text-lg text-black mb-3 leading-tight line-clamp-2">
                                                            {project.name}
                                                        </h3>

                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-2">
                                                                <MapPin className="w-4 h-4 text-pink-600" />
                                                                <p className="font-poppins text-[13px] text-pink-600 truncate">{project.location}</p>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Calendar className="w-4 h-4 text-pink-600" />
                                                                <p className="font-poppins text-[13px] text-pink-600">{project.date}</p>
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-2">
                                                                <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                                                                <p className="font-poppins text-[12px] text-[#625f5f] uppercase font-semibold">
                                                                    {project.status}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Modal Logic (Hidden by default) */}
                    {attendanceModal.isOpen && (
                        // ... (Keep your existing Modal Code here) ...
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                            <div className="bg-white p-6 rounded-[22px] shadow-2xl max-w-md w-full border border-gray-200">
                                <h3 className="text-xl font-playfair font-bold mb-6 text-center text-gray-900">Mark Attendance</h3>
                                {/* ... Modal Content ... */}
                                <div className="mb-6">
                                    <label className="block text-sm font-poppins font-medium text-gray-700 mb-2 text-center">Select Active Event</label>
                                    <EventSelector happeningEvents={happeningEvents} selectedEventId={attendanceProject.projectId} onEventSelect={selectEvent} />
                                </div>
                                <form id="email-form" onSubmit={handleAddParticipant} className="space-y-4">
                                    <input type="email" value={attendanceEmail} onChange={(e) => setAttendanceEmail(e.target.value)} placeholder="Enter member's email" className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rotaract-pink outline-none font-poppins text-sm" />
                                    <button type="submit" className="w-full bg-rotaract-pink text-white p-3 rounded-xl font-bold hover:bg-[#b51b52] transition shadow-md font-poppins">Add by Email</button>
                                    <div className="relative flex py-2 items-center"><div className="flex-grow border-t border-gray-200"></div><span className="flex-shrink mx-4 text-gray-400 text-xs font-bold font-poppins">OR SCAN QR</span><div className="flex-grow border-t border-gray-200"></div></div>
                                    <button type="button" onClick={startQrScanner} className="w-full bg-gray-800 text-white p-3 rounded-xl font-bold hover:bg-gray-900 transition flex items-center justify-center gap-2 shadow-md font-poppins"><QrIcon size={18} /> Open Scanner</button>
                                </form>
                                <div id="qr-scanner" style={{ display: 'none', width: '100%', border: '2px dashed #ccc', borderRadius: '12px', overflow: 'hidden' }} className="mt-4"></div>
                                <button id="modal-close-btn" onClick={() => { setAttendanceModal({ isOpen: false }); setAttendanceProject({ projectId: null, eventName: "" }); }} className="mt-6 w-full py-3 text-gray-500 hover:text-gray-800 text-sm font-medium transition font-poppins">Cancel & Close</button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
}

// --- HELPER COMPONENTS ---
const EventSelector = ({ happeningEvents, selectedEventId, onEventSelect, className = "", placeholder = "Select an active event" }: any) => (
    <div className={`space-y-3 ${className}`}>
        {happeningEvents.length === 0 ? (
            <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                <p className="text-red-500 text-sm text-center font-poppins">No live events currently. Start one from the Dashboard.</p>
            </div>
        ) : (
            <select
                value={selectedEventId || ""}
                onChange={(e) => { const selectedEvent = happeningEvents.find((event: any) => event.id === e.target.value); if (selectedEvent) { onEventSelect(selectedEvent.id, selectedEvent.name); } }}
                className="w-full p-3 border border-rotaract-pink rounded-xl focus:ring-2 focus:ring-rotaract-pink outline-none font-poppins text-sm bg-white text-gray-700"
            >
                <option value="" disabled>{placeholder}</option>
                {happeningEvents.map((event: any) => (<option key={event.id} value={event.id}>{event.name}</option>))}
            </select>
        )}
    </div>
);
