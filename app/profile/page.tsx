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
    Calendar, QrCode as QrIcon, GraduationCap, PlayCircle, MapPin, CheckCircle, ArrowLeft, StopCircle, Heart
} from 'lucide-react';
import { images } from '../../assets/images';
import NavBar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Profile() {
    const router = useRouter();

    // --- STATES ---
    const [loading, setLoading] = useState<boolean>(true);
    const [profile, setProfile] = useState<any>(null);
    const [contributions, setContributions] = useState<any[]>([]);

    // Exec Dashboard States
    const [isExec, setIsExec] = useState<boolean>(false);
    const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
    const [happeningEvents, setHappeningEvents] = useState<any[]>([]);

    // Modal States
    const [attendanceModal, setAttendanceModal] = useState<boolean>(false);
    const [modalView, setModalView] = useState<'list' | 'scanner'>('list');
    const [attendanceEmail, setAttendanceEmail] = useState<string>("");
    const [selectedProject, setSelectedProject] = useState<any>(null);

    // --- DATA FETCHING ---
    useEffect(() => {
        let scanner: any = null;
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) { router.push("/login"); return; }

            try {
                // 1. Get User Data
                let userDoc = await getDoc(doc(db, "users", user.uid));
                let data = userDoc.data();
                let sourceCollection = "users";

                if (!userDoc.exists()) {
                    userDoc = await getDoc(doc(db, "executiveCommittee", user.uid));
                    data = userDoc.data();
                    sourceCollection = "executiveCommittee";
                }

                if (!userDoc.exists()) {
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

                    // 2. If Exec, fetch dashboard data
                    if (sourceCollection === "executiveCommittee") {
                        setIsExec(true);
                        fetchExCoProjects();
                    }

                    // 3. Fetch User's Past Contributions
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

    // --- EXCO FUNCTIONS ---
    const fetchExCoProjects = async () => {
        try {
            const upcomingQuery = query(collection(db, "events"), where("status", "==", "upcoming"));
            const upcomingSnap = await getDocs(upcomingQuery);
            setUpcomingEvents(upcomingSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

            const happeningQuery = query(collection(db, "events"), where("status", "==", "happening now"));
            const happeningSnap = await getDocs(happeningQuery);
            setHappeningEvents(happeningSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (e) {
            console.error("Error fetching ExCo events", e);
        }
    };

    // START EVENT LOGIC
    const handleStartProject = async (project: any) => {
        if (!confirm(`Are you ready to START "${project.name || project.title}"?\n\nThis will make the event LIVE and mark your attendance automatically.`)) return;

        try {
            const eventRef = doc(db, "events", project.id);

            // 1. Update Status & Auto-mark Admin Attendance in DB
            await updateDoc(eventRef, {
                status: "happening now",
                startedBy: profile?.email,
                participants: arrayUnion(profile?.email)
            });

            // 2. Refresh Dashboard Lists (Upcoming/Happening)
            await fetchExCoProjects();

            // 3. INSTANTLY Update "My Contributions" Local State
            // This puts the new event at the top of the profile list immediately
            setContributions((prev) => [
                {
                    ...project,
                    status: "happening now",
                    participants: [...(project.participants || []), profile?.email] // Optimistic update
                },
                ...prev
            ]);

            // 4. Switch to Scanner View inside Modal
            setSelectedProject({ ...project, status: "happening now" });
            setModalView('scanner');

        } catch (err) {
            console.error(err);
            alert("Error starting project.");
        }
    };

    // END EVENT LOGIC
    const handleEndProject = async (project: any) => {
        if (!confirm(`Are you sure you want to END "${project.name || project.title}"?\n\nThis will move it to Completed history.`)) return;

        try {
            const eventRef = doc(db, "events", project.id);

            // 1. Update DB Status
            await updateDoc(eventRef, {
                status: "completed"
            });

            // 2. Refresh Dashboard Lists
            await fetchExCoProjects();

            // 3. INSTANTLY Update "My Contributions" Local State
            // Finds the event in your list and changes status to completed
            setContributions((prev) => prev.map((item) =>
                item.id === project.id ? { ...item, status: "completed" } : item
            ));

            alert("Event marked as Completed.");

        } catch (err) {
            console.error(err);
            alert("Error ending project.");
        }
    };

    const handleManageProject = (project: any) => {
        setSelectedProject(project);
        setModalView('scanner');
    };

    const handleAddParticipant = async (e: any) => {
        e.preventDefault();
        if (!attendanceEmail || !selectedProject) return;

        try {
            const eventRef = doc(db, "events", selectedProject.id);
            await updateDoc(eventRef, {
                participants: arrayUnion(attendanceEmail)
            });
            alert(`✅ Added ${attendanceEmail} to ${selectedProject.name || selectedProject.title}`);
            setAttendanceEmail("");
        } catch (err) {
            console.error(err);
            alert("Error adding participant.");
        }
    };

    const startQrScanner = () => {
        const emailForm = document.getElementById("email-form");
        const qrScannerDiv = document.getElementById("qr-scanner");
        const closeBtn = document.getElementById("modal-back-btn");

        if (!emailForm || !qrScannerDiv) return;

        emailForm.style.display = "none";
        if (closeBtn) closeBtn.style.display = "none";
        qrScannerDiv.style.display = "block";

        const scanner = new Html5QrcodeScanner(
            "qr-scanner", { fps: 10, qrbox: { width: 250, height: 250 } }, false
        );

        scanner.render(async (decodedText) => {
            scanner.clear();
            if (!selectedProject) return;

            try {
                const eventRef = doc(db, "events", selectedProject.id);
                await updateDoc(eventRef, { participants: arrayUnion(decodedText) });
                alert(`✅ Member ${decodedText} added!`);

                // Reset Modal View
                emailForm.style.display = "block";
                if (closeBtn) closeBtn.style.display = "block";
                qrScannerDiv.style.display = "none";
            } catch (err) {
                alert("Error adding scanned member.");
            }
        }, (err) => { });
    };

    const handleLogout = async () => { await signOut(auth); router.push("/"); };

    const closeModal = () => {
        setAttendanceModal(false);
        setModalView('list');
        setSelectedProject(null);
    };

    if (loading) return <div className="flex min-h-screen items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-blue-900" size={40} /></div>;
    if (!profile) return null;

    return (
        <div className="bg-white min-h-screen flex flex-col">
            <NavBar currentPage="profile" />
            <br /><br /><br /><br />

            <main className="flex-1 px-4 py-8">
                <div className="max-w-[1440px] mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-8 lg:gap-16">

                        {/* --- LEFT COLUMN: My Profile --- */}
                        <div className="lg:w-[450px]">
                            <div className="mb-6">
                                <h2 className="font-poppins font-medium text-lg text-pink-600 text-center mb-4">My Profile</h2>
                                <div className="border-t-2 border-gray-300 mb-8"></div>
                            </div>

                            {isExec && (
                                <div className="flex flex-col items-center mb-8">
                                    <div className="relative mb-4">
                                        <img
                                            src={profile.imageUrl || "https://via.placeholder.com/296"}
                                            alt="Profile"
                                            className="w-[296px] h-[296px] rounded-[38px] object-cover bg-gray-200 shadow-lg"
                                            onError={(e) => (e.target as HTMLImageElement).src = "https://via.placeholder.com/296?text=No+Image"}
                                        />
                                        <br /><br /><br />
                                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-pink-600 text-white px-8 py-3 rounded-[32px] shadow-md whitespace-nowrap">
                                            <p className="font-playfair font-medium text-[19px]">{profile.position}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* User Details */}
                            <div className="space-y-4 mb-8 bg-gray-50 p-6 rounded-[22px] border border-gray-100">
                                <InfoRow label="Index No" value={profile.studentId} />
                                <InfoRow label="Name" value={profile.fullName} />
                                <InfoRow label="Faculty" value={profile.faculty} />
                                <InfoRow label="Department" value={profile.department} />
                            </div>

                            {/* QR Code */}
                            <div className="flex justify-center">
                                <div className="p-4 bg-white border-2 border-gray-200 rounded-[22px] shadow-sm">
                                    <QRCode value={profile.email} className="w-[200px] h-[200px]" />
                                    <p className="text-center text-gray-500 text-xs mt-2 font-poppins">Scan to mark attendance</p>
                                </div>
                            </div>
                        </div>

                        {/* --- RIGHT COLUMN: Dashboard & Contributions --- */}
                        <div>
                            {isExec && (
                                <div className="mb-12">
                                    <h2 className="font-poppins font-medium text-lg text-pink-600 text-center mb-4">ExCo Actions</h2>
                                    <div className="border-t-2 border-gray-300 mb-8"></div>

                                    <div className="flex flex-col md:flex-row justify-center gap-6">
                                        <button
                                            className="relative w-full max-w-md h-[140px] rounded-[22px] bg-gradient-to-r from-gray-800 to-gray-900 flex items-center justify-between px-8 overflow-hidden group hover:shadow-xl transition-all duration-300 shadow-lg"
                                            onClick={() => { setAttendanceModal(true); fetchExCoProjects(); }}
                                        >
                                            <div className="flex flex-col items-start z-10">
                                                <h3 className="font-playfair text-white text-2xl font-bold mb-1">Manage Events</h3>
                                                <p className="font-poppins text-gray-300 text-sm text-left">Start events & <br />mark attendance</p>
                                            </div>
                                            <div className="bg-white/10 p-4 rounded-full z-10">
                                                <QrIcon size={32} className="text-white" />
                                            </div>

                                            {/* Decorative Background Elements */}
                                            <div className="absolute right-0 top-0 w-32 h-32 bg-pink-600/20 rounded-full blur-2xl -mr-10 -mt-10"></div>
                                        </button>

                                        <a
                                            href="/admin/relief"
                                            className="relative w-full max-w-md h-[140px] rounded-[22px] bg-gradient-to-r from-pink-600 to-pink-700 flex items-center justify-between px-8 overflow-hidden group hover:shadow-xl transition-all duration-300 shadow-lg"
                                        >
                                            <div className="flex flex-col items-start z-10">
                                                <h3 className="font-playfair text-white text-2xl font-bold mb-1">Manage Relief</h3>
                                                <p className="font-poppins text-pink-100 text-sm text-left">View requests & <br />donations</p>
                                            </div>
                                            <div className="bg-white/10 p-4 rounded-full z-10">
                                                <Heart size={32} className="text-white" />
                                            </div>

                                            {/* Decorative Background Elements */}
                                            <div className="absolute right-0 top-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -mr-10 -mt-10"></div>
                                        </a>
                                    </div>
                                </div>
                            )}

                            {/* My Contributions */}
                            <div className="mb-6">
                                <h2 className="font-poppins font-medium text-lg text-pink-600 text-center mb-4">My Contributions</h2>
                                <div className="border-t-2 border-gray-300 mb-8"></div>
                            </div>

                            {/* Contributions Grid */}
                            {contributions.length === 0 ? (
                                <div className="text-center text-gray-500 py-16 bg-gray-50 rounded-[22px] border border-gray-100">
                                    <Calendar className="mx-auto text-gray-300 mb-3" size={40} />
                                    <p className="font-poppins">You haven't participated in any events yet.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {contributions.map((project) => (
                                        <ContributionCard key={project.id} project={project} />
                                    ))}
                                </div>
                            )}

                            {/* Logout Button */}
                            <div className="flex justify-end mt-10">
                                <button onClick={handleLogout} className="flex items-center gap-2 text-gray-400 hover:text-pink-600 transition font-poppins font-medium text-sm px-4 py-2 rounded-full hover:bg-pink-50">
                                    <LogOut size={16} /> Sign Out
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* --- EXECUTIVE MODAL --- */}
                    {attendanceModal && (
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                            <div className="bg-white rounded-[30px] shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">

                                {/* Modal Header */}
                                <div className="bg-pink-600 p-6 flex items-center justify-between">
                                    <h3 className="text-xl font-playfair font-bold text-white flex items-center gap-2">
                                        {modalView === 'list' ? 'Event Dashboard' : 'Mark Attendance'}
                                    </h3>
                                    <button onClick={closeModal} className="text-white/80 hover:text-white transition font-poppins text-sm font-medium">
                                        Close
                                    </button>
                                </div>

                                {/* Modal Body */}
                                <div className="p-6 overflow-y-auto">

                                    {/* VIEW 1: LIST OF EVENTS */}
                                    {modalView === 'list' && (
                                        <div className="space-y-8">

                                            {/* Happening Now Section */}
                                            {happeningEvents.length > 0 && (
                                                <div>
                                                    <h4 className="font-poppins text-sm font-bold text-green-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Happening Now
                                                    </h4>
                                                    <div className="space-y-3">
                                                        {happeningEvents.map(event => (
                                                            <div key={event.id} className="border border-green-200 bg-green-50 rounded-xl p-4 flex items-center justify-between group hover:shadow-md transition-all">
                                                                <div className="flex-1 mr-4">
                                                                    <p className="font-playfair font-bold text-gray-800">{event.name || event.title}</p>
                                                                    <p className="text-xs text-green-700 font-poppins mt-1">Event is Live</p>
                                                                </div>

                                                                {/* Action Buttons */}
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        onClick={() => handleManageProject(event)}
                                                                        className="bg-white text-green-600 border border-green-200 p-2 rounded-full hover:bg-green-600 hover:text-white transition shadow-sm"
                                                                        title="Scan Attendance"
                                                                    >
                                                                        <QrIcon size={18} />
                                                                    </button>

                                                                    <button
                                                                        onClick={() => handleEndProject(event)}
                                                                        className="bg-white text-red-500 border border-red-200 p-2 rounded-full hover:bg-red-500 hover:text-white transition shadow-sm"
                                                                        title="End Event"
                                                                    >
                                                                        <StopCircle size={18} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Upcoming Section */}
                                            <div>
                                                <h4 className="font-poppins text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                    <Calendar size={14} /> Upcoming Events
                                                </h4>

                                                {upcomingEvents.length === 0 ? (
                                                    <p className="text-gray-400 text-sm italic text-center py-4">No upcoming events scheduled.</p>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {upcomingEvents.map(event => (
                                                            <div key={event.id} className="border border-gray-100 bg-white rounded-xl p-4 flex items-center justify-between shadow-sm hover:border-pink-600/30 transition-all">
                                                                <div>
                                                                    <p className="font-playfair font-bold text-gray-800 text-base">
                                                                        {event.name || event.title || "Unnamed Event"}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500 font-poppins mt-1">
                                                                        {event.date ? event.date : "Date not set"}
                                                                    </p>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleStartProject(event)}
                                                                    className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-full text-xs font-bold font-poppins hover:bg-pink-600 transition shadow-md"
                                                                >
                                                                    <PlayCircle size={14} /> START
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* VIEW 2: SCANNER & INPUT */}
                                    {modalView === 'scanner' && selectedProject && (
                                        <div className="animate-in slide-in-from-right-4 duration-300">
                                            <div className="mb-6 flex items-center gap-2 text-gray-500 text-sm font-poppins">
                                                <button onClick={() => setModalView('list')} className="hover:text-pink-600 flex items-center gap-1">
                                                    <ArrowLeft size={16} /> Back to List
                                                </button>
                                            </div>

                                            <div className="text-center mb-6">
                                                <h4 className="font-playfair text-2xl font-bold text-gray-800">{selectedProject.name || selectedProject.title}</h4>
                                                <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-[10px] font-bold px-3 py-1 rounded-full mt-2 uppercase tracking-wide">
                                                    <CheckCircle size={12} /> Marking Attendance
                                                </span>
                                            </div>

                                            <form id="email-form" onSubmit={handleAddParticipant} className="space-y-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1 font-poppins">Manual Entry</label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="email"
                                                            value={attendanceEmail}
                                                            onChange={(e) => setAttendanceEmail(e.target.value)}
                                                            placeholder="Enter member email..."
                                                            className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-600 outline-none font-poppins text-sm"
                                                        />
                                                        <button type="submit" className="bg-pink-600 text-white px-4 rounded-xl font-bold hover:bg-[#b51b52] transition shadow-md">
                                                            Add
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="relative flex py-3 items-center">
                                                    <div className="flex-grow border-t border-gray-200"></div>
                                                    <span className="flex-shrink mx-4 text-gray-400 text-xs font-bold font-poppins">OR</span>
                                                    <div className="flex-grow border-t border-gray-200"></div>
                                                </div>

                                                <button type="button" onClick={startQrScanner} className="w-full bg-gray-900 text-white p-4 rounded-xl font-bold hover:bg-gray-800 transition flex items-center justify-center gap-3 shadow-lg font-poppins group">
                                                    <QrIcon size={20} className="group-hover:scale-110 transition-transform" />
                                                    Launch QR Scanner
                                                </button>
                                            </form>

                                            <div id="qr-scanner" style={{ display: 'none', width: '100%', border: 'none', borderRadius: '16px', overflow: 'hidden' }} className="mt-4 shadow-inner bg-white"></div>
                                        </div>
                                    )}
                                </div>
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

const InfoRow = ({ label, value }: any) => (
    <div className="flex items-center gap-4 justify-between border-b border-gray-200/50 last:border-0 pb-2 last:pb-0">
        <p className="font-poppins font-medium text-[14px] text-pink-600">{label}</p>
        <p className="font-poppins text-[14px] text-gray-600 text-right truncate max-w-[200px]">{value}</p>
    </div>
);

const ContributionCard = ({ project }: any) => (
    <div className="bg-white rounded-[22px] shadow-[0_0_26px_2px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden h-[255px] flex flex-col group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        <div className="flex h-full">
            <div className="w-[140px] h-full bg-[#f0f0f0] flex-shrink-0">
                <img
                    src={project.imageUrl || images.imgRectangle20}
                    alt={project.name}
                    className="w-full h-full object-cover"
                    onError={(e) => (e.target as HTMLImageElement).src = 'https://via.placeholder.com/157x255?text=Event'}
                />
            </div>
            <div className="flex-1 p-5 flex flex-col justify-between">
                <div>
                    <h3 className="font-playfair font-bold text-lg text-gray-900 mb-3 leading-tight line-clamp-2 group-hover:text-pink-600 transition-colors">
                        {project.name || project.title}
                    </h3>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                            <p className="font-poppins text-[12px] text-gray-500 truncate">{project.location}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            <p className="font-poppins text-[12px] text-gray-500">{project.date}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                            <div className={`w-2 h-2 rounded-full ${project.status === 'happening now' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                            <p className="font-poppins text-[11px] text-gray-400 uppercase font-bold tracking-wide">
                                {project.status}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);
