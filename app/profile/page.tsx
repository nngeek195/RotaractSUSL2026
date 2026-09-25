"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { 
    doc, getDoc, collection, query, where, getDocs, 
    updateDoc, arrayUnion, addDoc 
} from 'firebase/firestore';
import { Html5QrcodeScanner } from 'html5-qrcode';
import QRCode from 'react-qr-code';
import {
    LogOut, Loader2,
    Calendar, QrCode as QrIcon, PlayCircle, MapPin, 
    ArrowLeft, StopCircle, Heart, Camera,
    Megaphone, Sparkles, ArrowRight, UserCheck, CheckCircle,
    ChevronRight, Check, X
} from 'lucide-react';
import { images } from '../../assets/images';
import NavBar from '../components/Navbar';
import Footer from '../components/Footer';
import { toast } from "sonner";
import { confirmToast } from "@/lib/confirmToast";

const CLOUDINARY_UPLOAD_URL = "https://api.cloudinary.com/v1_1/dvqoiqzxe/image/upload";
const CLOUDINARY_UPLOAD_PRESET = "projects";

// --- TYPES & INTERFACES ---
interface UserProfile {
    uid: string;
    fullName: string;
    email: string;
    studentId: string;
    faculty: string;
    department: string;
    whatsapp: string;
    position: string;
    collection: string;
    imageUrl: string;
}

interface EventItem {
    id: string;
    name?: string;
    title?: string;
    date?: string;
    location?: string;
    status?: string;
    imageUrl?: string;
    participants?: string[];
    [key: string]: unknown;
}

interface PositionItem {
    id?: string;
    title: string;
    maintainTeam?: boolean;
    teamStructure?: unknown;
}

interface QuestionItem {
    title?: string;
    question?: string;
    required?: boolean;
}

interface OcCall {
    id: string;
    applicationName: string;
    description?: string;
    imageUrl?: string;
    positions?: PositionItem[];
    customQuestions?: Array<string | QuestionItem>;
    status?: string;
    published?: boolean;
    publishedAt?: unknown;
    publishedBy?: string;
    publishedByEmail?: string;
    createdBy?: string;
    createdByName?: string;
    createdByEmail?: string;
    sharedWith?: string[];
    createdAt?: { toDate?: () => Date } | Date | unknown;
}

interface OcApplication {
    id?: string;
    callId: string;
    applicationName: string;
    userId: string;
    applicantName: string;
    applicantEmail: string;
    studentId: string;
    faculty: string;
    department: string;
    contactNumber: string;
    position: string;
    teamRole?: string;
    customAnswers?: Record<string, string>;
    status?: string;
    appliedAt?: unknown;
}

interface ExecInfo {
    id: string;
    name: string;
    position: string;
    email: string;
}

function ProfileContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const paramApplyCallId = searchParams?.get('applyCallId');

    // --- STATES ---
    const [loading, setLoading] = useState<boolean>(true);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [contributions, setContributions] = useState<EventItem[]>([]);
    const [uploadingImage, setUploadingImage] = useState<boolean>(false);

    // Exec Dashboard States
    const [isExec, setIsExec] = useState<boolean>(false);
    const [upcomingEvents, setUpcomingEvents] = useState<EventItem[]>([]);
    const [happeningEvents, setHappeningEvents] = useState<EventItem[]>([]);

    // Executive Attendance Modal States
    const [attendanceModal, setAttendanceModal] = useState<boolean>(false);
    const [modalView, setModalView] = useState<'list' | 'scanner'>('list');
    const [attendanceEmail, setAttendanceEmail] = useState<string>("");
    const [selectedProject, setSelectedProject] = useState<EventItem | null>(null);

    // OC Calls & Applications States
    const [openCalls, setOpenCalls] = useState<OcCall[]>([]);
    const [userApplications, setUserApplications] = useState<OcApplication[]>([]);
    const [execMap, setExecMap] = useState<Record<string, ExecInfo>>({});
    
    // Application Form Modal States
    const [applyModalOpen, setApplyModalOpen] = useState<boolean>(false);
    const [selectedCallToApply, setSelectedCallToApply] = useState<OcCall | null>(null);
    const [selectedPosition, setSelectedPosition] = useState<string>("");
    const [teamRoleNote, setTeamRoleNote] = useState<string>("");
    const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});
    const [submittingApp, setSubmittingApp] = useState<boolean>(false);

    // View Submitted Application Modal State
    const [viewAppModalOpen, setViewAppModalOpen] = useState<boolean>(false);
    const [selectedAppToView, setSelectedAppToView] = useState<OcApplication | null>(null);

    // Helper: Sort OC Calls by creation date descending
    const getCallTimestamp = (c: OcCall): number => {
        if (c.createdAt && typeof (c.createdAt as { toDate?: () => Date }).toDate === 'function') {
            return (c.createdAt as { toDate: () => Date }).toDate().getTime();
        }
        if (c.createdAt instanceof Date) return c.createdAt.getTime();
        return 0;
    };

    // --- DATA FETCHING ---
    useEffect(() => {
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
                    const userProfile: UserProfile = {
                        uid: user.uid,
                        fullName: data.fullName,
                        email: data.email,
                        studentId: data.studentId || data.indexNumber || "",
                        faculty: data.faculty || "",
                        department: data.department || "N/A",
                        whatsapp: data.whatsapp || data.mobileNumber || "",
                        position: data.position || "Member",
                        collection: sourceCollection,
                        imageUrl: data.imageUrl || ""
                    };
                    setProfile(userProfile);

                    // 2. If Exec, fetch dashboard data
                    if (sourceCollection === "executiveCommittee") {
                        setIsExec(true);
                        fetchExCoProjects();
                    }

                    // 3. Fetch User's Past Contributions
                    const q = query(collection(db, "events"), where("participants", "array-contains", data.email));
                    const querySnapshot = await getDocs(q);
                    const userContributions: EventItem[] = querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
                    userContributions.sort((a, b) => {
                        const dateA = a.date ? new Date(a.date).getTime() : 0;
                        const dateB = b.date ? new Date(b.date).getTime() : 0;
                        return dateB - dateA;
                    });
                    setContributions(userContributions);

                    // 4. Fetch Open OC Calls, Exec Profiles, and User's submitted applications
                    await Promise.all([
                        fetchOpenCalls(),
                        fetchExecMap(),
                        fetchUserApplications(data.email, user.uid)
                    ]);
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
            } finally {
                setLoading(false);
            }
        });

        return () => { unsubscribe(); };
    }, [router]);

    // Check if applyCallId param is in URL and automatically trigger the modal
    useEffect(() => {
        if (paramApplyCallId && openCalls.length > 0 && profile) {
            const targetCall = openCalls.find(c => c.id === paramApplyCallId);
            if (targetCall) {
                const alreadyApplied = userApplications.some(a => a.callId === targetCall.id);
                if (!alreadyApplied) {
                    handleOpenApplyModal(targetCall);
                }
            }
        }
    }, [paramApplyCallId, openCalls, userApplications, profile]);

    // Fetch Executive Committee Members to resolve names
    const fetchExecMap = async () => {
        try {
            const snap = await getDocs(collection(db, "executiveCommittee"));
            const map: Record<string, ExecInfo> = {};
            snap.docs.forEach(docSnap => {
                const data = docSnap.data();
                const name = data.fullName || `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.firstName || "Director";
                const info: ExecInfo = {
                    id: docSnap.id,
                    name,
                    position: data.position || "Board Member",
                    email: data.email?.toLowerCase()?.trim() || ""
                };
                map[docSnap.id] = info;
                if (data.email) map[data.email.toLowerCase().trim()] = info;
            });
            setExecMap(map);
        } catch (e) {
            console.error("Error fetching committee map:", e);
        }
    };

    // Fetch Open Published OC Calls
    const fetchOpenCalls = async () => {
        try {
            const q = query(collection(db, "ocCalls"), where("status", "==", "open"));
            const snap = await getDocs(q);
            const list: OcCall[] = snap.docs
                .map(d => ({ id: d.id, ...d.data() } as OcCall))
                .filter(c => c.published !== false && c.published)
                .sort((a, b) => getCallTimestamp(b) - getCallTimestamp(a));
            setOpenCalls(list);
        } catch (e) {
            console.error("Error fetching open OC calls:", e);
        }
    };

    // Fetch User's Submitted Applications
    const fetchUserApplications = async (userEmail: string, userId: string) => {
        try {
            const appsQuery = query(collection(db, "ocApplications"), where("applicantEmail", "==", userEmail));
            const snap = await getDocs(appsQuery);
            let list: OcApplication[] = snap.docs.map(d => ({ id: d.id, ...d.data() } as OcApplication));

            // If none by email, also check by userId
            if (list.length === 0 && userId) {
                const userAppsQuery = query(collection(db, "ocApplications"), where("userId", "==", userId));
                const userSnap = await getDocs(userAppsQuery);
                list = userSnap.docs.map(d => ({ id: d.id, ...d.data() } as OcApplication));
            }
            setUserApplications(list);
        } catch (e) {
            console.error("Error fetching user applications:", e);
        }
    };

    // Helper: Resolve member name and position
    const resolveMember = (idOrEmail?: string): ExecInfo => {
        if (!idOrEmail) return { id: "", name: "Organizing Committee", position: "Executive Member", email: "" };
        const key = idOrEmail.toLowerCase().trim();
        if (execMap[key]) return execMap[key];
        if (execMap[idOrEmail]) return execMap[idOrEmail];
        return { 
            id: idOrEmail,
            name: idOrEmail.includes('@') ? idOrEmail.split('@')[0] : "Committee Member", 
            position: "Executive Member",
            email: idOrEmail.includes('@') ? idOrEmail : ""
        };
    };

    // --- APPLICATION MODAL HANDLERS ---
    const handleOpenApplyModal = (call: OcCall) => {
        setSelectedCallToApply(call);
        setSelectedPosition(call.positions?.[0]?.title || "");
        setTeamRoleNote("");
        setCustomAnswers({});
        setApplyModalOpen(true);
    };

    const handleOpenViewAppModal = (app: OcApplication) => {
        setSelectedAppToView(app);
        setViewAppModalOpen(true);
    };

    const handleApplySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCallToApply || !profile) return;
        if (!selectedPosition) {
            toast.error("Please select a position to apply for.");
            return;
        }

        setSubmittingApp(true);
        try {
            const appPayload: OcApplication = {
                callId: selectedCallToApply.id,
                applicationName: selectedCallToApply.applicationName || "Project Committee",
                userId: profile.uid,
                applicantName: profile.fullName || "",
                applicantEmail: profile.email || "",
                studentId: profile.studentId || "",
                faculty: profile.faculty || "",
                department: profile.department || "N/A",
                contactNumber: profile.whatsapp || "",
                position: selectedPosition,
                teamRole: teamRoleNote.trim(),
                customAnswers: customAnswers,
                status: "pending",
                appliedAt: new Date()
            };

            const docRef = await addDoc(collection(db, "ocApplications"), appPayload);
            toast.success(`Application for "${selectedCallToApply.applicationName}" submitted successfully!`);
            
            setUserApplications(prev => [...prev, { id: docRef.id, ...appPayload }]);
            setApplyModalOpen(false);
            setSelectedCallToApply(null);
            setSelectedPosition("");
            setTeamRoleNote("");
            setCustomAnswers({});
        } catch (err) {
            console.error("Error submitting application:", err);
            toast.error("Failed to submit application. Please try again.");
        } finally {
            setSubmittingApp(false);
        }
    };

    // --- EXCO FUNCTIONS ---
    const fetchExCoProjects = async () => {
        try {
            const upcomingQuery = query(collection(db, "events"), where("status", "==", "upcoming"));
            const upcomingSnap = await getDocs(upcomingQuery);
            setUpcomingEvents(upcomingSnap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() })));

            const happeningQuery = query(collection(db, "events"), where("status", "==", "happening now"));
            const happeningSnap = await getDocs(happeningQuery);
            setHappeningEvents(happeningSnap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() })));
        } catch (e) {
            console.error("Error fetching ExCo events", e);
        }
    };

    // START EVENT LOGIC
    const handleStartProject = async (project: EventItem) => {
        if (!(await confirmToast({ 
            message: `Are you ready to START "${project.name || project.title}"?`, 
            description: "This will make the event LIVE and mark your attendance automatically.", 
            confirmLabel: "Start" 
        }))) return;

        try {
            const eventRef = doc(db, "events", project.id);
            await updateDoc(eventRef, {
                status: "happening now",
                startedBy: profile?.email,
                participants: arrayUnion(profile?.email)
            });

            await fetchExCoProjects();

            setContributions((prev) => [
                {
                    ...project,
                    status: "happening now",
                    participants: [...(project.participants || []), profile?.email || ""] 
                },
                ...prev
            ]);

            setSelectedProject({ ...project, status: "happening now" });
            setModalView('scanner');
        } catch (err) {
            console.error(err);
            toast.error("Error starting project.");
        }
    };

    // END EVENT LOGIC
    const handleEndProject = async (project: EventItem) => {
        if (!(await confirmToast({ 
            message: `Are you sure you want to END "${project.name || project.title}"?`, 
            description: "This will move it to Completed history.", 
            confirmLabel: "End" 
        }))) return;

        try {
            const eventRef = doc(db, "events", project.id);
            await updateDoc(eventRef, { status: "completed" });
            await fetchExCoProjects();

            setContributions((prev) => prev.map((item) =>
                item.id === project.id ? { ...item, status: "completed" } : item
            ));

            toast.success("Event marked as Completed.");
        } catch (err) {
            console.error(err);
            toast.error("Error ending project.");
        }
    };

    const handleManageProject = (project: EventItem) => {
        setSelectedProject(project);
        setModalView('scanner');
    };

    const handleAddParticipant = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!attendanceEmail || !selectedProject) return;

        try {
            const eventRef = doc(db, "events", selectedProject.id);
            await updateDoc(eventRef, {
                participants: arrayUnion(attendanceEmail)
            });
            toast.success(`Added ${attendanceEmail} to ${selectedProject.name || selectedProject.title}`);
            setAttendanceEmail("");
        } catch (err) {
            console.error(err);
            toast.error("Error adding participant.");
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !profile) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error("File size exceeds 5MB limit.");
            return;
        }

        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
        if (!allowedTypes.includes(file.type)) {
            toast.error("Invalid file type. Please upload JPEG, PNG, or WEBP.");
            return;
        }

        setUploadingImage(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
            formData.append("folder", "Profiles");

            const res = await fetch(CLOUDINARY_UPLOAD_URL, {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (data.secure_url) {
                const userRef = doc(db, profile.collection, profile.uid);
                await updateDoc(userRef, { imageUrl: data.secure_url });
                setProfile((prev) => prev ? ({ ...prev, imageUrl: data.secure_url }) : null);
                toast.success("Profile picture updated successfully!");
            } else {
                throw new Error("Upload failed");
            }
        } catch (err) {
            console.error("Error uploading image:", err);
            toast.error("Failed to upload profile picture. Please try again.");
        } finally {
            setUploadingImage(false);
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
                toast.success(`Member ${decodedText} added!`);

                emailForm.style.display = "block";
                if (closeBtn) closeBtn.style.display = "block";
                qrScannerDiv.style.display = "none";
            } catch {
                toast.error("Error adding scanned member.");
            }
        }, () => { });
    };

    const handleLogout = async () => { await signOut(auth); router.push("/"); };

    const closeModal = () => {
        setAttendanceModal(false);
        setModalView('list');
        setSelectedProject(null);
    };

    if (loading) return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <Loader2 className="animate-spin text-pink-600" size={40} />
        </div>
    );
    if (!profile) return null;

    return (
        <div className="bg-white min-h-screen flex flex-col font-poppins selection:bg-pink-500 selection:text-white">
            <NavBar currentPage="profile" />
            
            <main className="flex-1 px-4 py-8">
                <div className="max-w-[1440px] mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-8 lg:gap-16">

                        {/* --- LEFT COLUMN: My Profile --- */}
                        <div className="lg:w-[450px]">
                            <div className="mb-6">
                                <h2 className="font-poppins font-medium text-lg text-pink-600 text-center mb-4">My Profile</h2>
                                <div className="border-t-2 border-gray-300 mb-8"></div>
                            </div>

                            <div className="flex flex-col items-center mb-8">
                                <div className="relative mb-4 group">
                                    <div className="w-[296px] h-[296px] rounded-[38px] overflow-hidden bg-gray-200 shadow-lg relative">
                                        <img
                                            src={profile.imageUrl || "https://via.placeholder.com/296"}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                            onError={(e) => (e.target as HTMLImageElement).src = "https://via.placeholder.com/296?text=No+Image"}
                                        />
                                        <label className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                            {uploadingImage ? (
                                                <Loader2 className="animate-spin text-white" size={48} />
                                            ) : (
                                                <>
                                                    <Camera className="text-white mb-2" size={48} />
                                                    <span className="text-white font-poppins font-medium text-sm">Change Photo</span>
                                                </>
                                            )}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleImageUpload}
                                                disabled={uploadingImage}
                                            />
                                        </label>
                                    </div>
                                    
                                    {isExec && (
                                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-pink-600 text-white px-8 py-3 rounded-[32px] shadow-md whitespace-nowrap z-10">
                                            <p className="font-playfair font-medium text-[19px]">{profile.position}</p>
                                        </div>
                                    )}
                                </div>
                                {isExec && <><br /><br /><br /></>}
                            </div>

                            <div className="space-y-4 mb-8 bg-gray-50 p-6 rounded-[22px] border border-gray-100">
                                <InfoRow label="Index No" value={profile.studentId} />
                                <InfoRow label="Name" value={profile.fullName} />
                                <InfoRow label="Faculty" value={profile.faculty} />
                                <InfoRow label="Department" value={profile.department} />
                                <InfoRow label="Email" value={profile.email} />
                                <InfoRow label="Contact / WhatsApp" value={profile.whatsapp} />
                                <div className="pt-2">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center justify-center gap-2 text-white bg-pink-600 hover:bg-pink-700 transition font-poppins font-bold text-sm px-4 py-3 rounded-xl shadow-md"
                                    >
                                        <LogOut size={16} /> Sign Out
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-center">
                                <div className="p-4 bg-white border-2 border-gray-200 rounded-[22px] shadow-sm">
                                    <QRCode value={profile.email} className="w-[200px] h-[200px]" />
                                    <p className="text-center text-gray-500 text-xs mt-2 font-poppins">Scan to mark attendance</p>
                                </div>
                            </div>
                        </div>

                        {/* --- RIGHT COLUMN: Dashboard & Activities --- */}
                        <div>
                            {/* --- 1. EXCO DASHBOARD ACTIONS --- */}
                            {isExec && (
                                <div className="mb-12">
                                    <h2 className="font-poppins font-medium text-lg text-pink-600 text-center mb-4">ExCo Actions</h2>
                                    <div className="border-t-2 border-gray-300 mb-8"></div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <button
                                            className="relative w-full h-[140px] rounded-[22px] bg-gradient-to-r from-gray-800 to-gray-900 flex items-center justify-between px-6 overflow-hidden group hover:shadow-xl transition-all duration-300 shadow-lg text-left"
                                            onClick={() => { setAttendanceModal(true); fetchExCoProjects(); }}
                                        >
                                            <div className="flex flex-col items-start z-10">
                                                <h3 className="font-playfair text-white text-xl font-bold mb-1">Manage Events</h3>
                                                <span className="text-xs text-gray-300">Live attendance & check-in</span>
                                            </div>
                                            <div className="bg-white/10 p-3 rounded-full z-10 shrink-0">
                                                <QrIcon size={24} className="text-white" />
                                            </div>
                                            <div className="absolute right-0 top-0 w-24 h-24 bg-pink-600/20 rounded-full blur-2xl -mr-8 -mt-8"></div>
                                        </button>

                                        <a
                                            href="/admin/relief"
                                            className="relative w-full h-[140px] rounded-[22px] bg-gradient-to-r from-pink-600 to-pink-700 flex items-center justify-between px-6 overflow-hidden group hover:shadow-xl transition-all duration-300 shadow-lg"
                                        >
                                            <div className="flex flex-col items-start z-10">
                                                <h3 className="font-playfair text-white text-xl font-bold mb-1">Manage Relief</h3>
                                                <span className="text-xs text-pink-100">Disaster relief requests</span>
                                            </div>
                                            <div className="bg-white/10 p-3 rounded-full z-10 shrink-0">
                                                <Heart size={24} className="text-white" />
                                            </div>
                                            <div className="absolute right-0 top-0 w-24 h-24 bg-white/20 rounded-full blur-2xl -mr-8 -mt-8"></div>
                                        </a>

                                        <a
                                            href="/admin/oc-calls"
                                            className="relative w-full h-[140px] rounded-[22px] bg-gradient-to-r from-purple-600 to-indigo-700 flex items-center justify-between px-6 overflow-hidden group hover:shadow-xl transition-all duration-300 shadow-lg"
                                        >
                                            <div className="flex flex-col items-start z-10">
                                                <h3 className="font-playfair text-white text-xl font-bold mb-1">OC Calls</h3>
                                                <span className="text-xs text-purple-100">Manage calls & applicants</span>
                                            </div>
                                            <div className="bg-white/10 p-3 rounded-full z-10 shrink-0">
                                                <Megaphone size={24} className="text-white" />
                                            </div>
                                            <div className="absolute right-0 top-0 w-24 h-24 bg-white/20 rounded-full blur-2xl -mr-8 -mt-8"></div>
                                        </a>
                                    </div>
                                </div>
                            )}

                            {/* --- 2. OC ACCOUNTS COLLABORATIVE NOTICES --- */}
                            {isExec && (
                                <div className="mb-12 bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-purple-500/20 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl pointer-events-none"></div>
                                    
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md shrink-0">
                                                <Megaphone className="text-pink-400" size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-playfair font-bold text-white flex items-center gap-2">
                                                    Executive Updates: Active OC Calls
                                                    <span className="bg-pink-500/20 text-pink-300 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-pink-500/30">
                                                        Committee Notice
                                                    </span>
                                                </h3>
                                                <p className="text-xs text-purple-200 mt-0.5">
                                                    Collaborative Organizing Committee calls published by board directors
                                                </p>
                                            </div>
                                        </div>
                                        <a
                                            href="/admin/oc-calls"
                                            className="inline-flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white font-poppins text-xs font-bold px-4 py-2.5 rounded-full transition shadow-md whitespace-nowrap"
                                        >
                                            <span>Manage Calls</span>
                                            <ArrowRight size={14} />
                                        </a>
                                    </div>

                                    {openCalls.length === 0 ? (
                                        <div className="bg-white/5 rounded-2xl p-6 text-center border border-white/5">
                                            <p className="text-xs text-purple-200/70 italic">No published project calls active right now.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {openCalls.map(call => {
                                                const creator = resolveMember(call.createdByName || call.createdBy || call.publishedByEmail);
                                                const collaborators = (call.sharedWith || []).map(resolveMember);

                                                return (
                                                    <div 
                                                        key={call.id} 
                                                        className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-white/[0.14] transition"
                                                    >
                                                        <div className="space-y-1.5 flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                                                <h4 className="font-playfair font-bold text-base sm:text-lg text-white">
                                                                    {call.applicationName}
                                                                </h4>
                                                            </div>
                                                            <div className="text-xs sm:text-sm text-purple-100 font-poppins leading-relaxed">
                                                                New event has been created by <span className="text-pink-300 font-bold bg-pink-900/40 px-2 py-0.5 rounded-md">{creator.name}</span>
                                                                {collaborators.length > 0 ? (
                                                                    <>
                                                                        {' '}with{' '}
                                                                        <span className="text-indigo-200 font-bold bg-indigo-900/40 px-2 py-0.5 rounded-md">
                                                                            {collaborators.map(c => c.name).join(", ")}
                                                                        </span>
                                                                        {' '}as the collaborating member{collaborators.length > 1 ? 's' : ''}.
                                                                    </>
                                                                ) : (
                                                                    <span>.</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <a
                                                                href="/admin/oc-calls"
                                                                className="text-xs font-semibold bg-white/20 hover:bg-white text-white hover:text-slate-900 px-4 py-2 rounded-xl transition shadow-sm"
                                                            >
                                                                Review Call
                                                            </a>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* --- 3. ALL PERSONAL ACCOUNTS: APPLY FOR EVENT SECTION --- */}
                            <div className="mb-12">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <h2 className="font-poppins font-medium text-lg text-pink-600">
                                            Open Project Calls
                                        </h2>
                                        {openCalls.length > 0 && (
                                            <span className="bg-pink-100 text-pink-600 text-xs font-bold px-2 py-0.5 rounded-full">
                                                {openCalls.length} Available
                                            </span>
                                        )}
                                    </div>
                                    {openCalls.length > 0 && (
                                        <Link 
                                            href="/apply-projects"
                                            className="text-xs font-medium text-gray-500 hover:text-pink-600 transition flex items-center gap-1"
                                        >
                                            View public catalog <ChevronRight size={14} />
                                        </Link>
                                    )}
                                </div>
                                <div className="border-t-2 border-gray-300 mb-6"></div>

                                {openCalls.length === 0 ? (
                                    <div className="text-center text-gray-500 py-12 bg-gray-50 rounded-[22px] border border-gray-100">
                                        <Megaphone className="mx-auto text-gray-300 mb-2" size={32} />
                                        <p className="font-poppins text-sm font-medium">No active project calls at this moment.</p>
                                        <p className="font-poppins text-xs text-gray-400 mt-1">Check back soon for new committee recruitment opportunities.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-6">
                                        {openCalls.map(call => {
                                            const userApp = userApplications.find(a => a.callId === call.id);
                                            const creator = resolveMember(call.createdByName || call.createdBy || call.publishedByEmail);
                                            const collaborators = (call.sharedWith || []).map(resolveMember);

                                            return (
                                                <div 
                                                    key={call.id}
                                                    className="bg-white rounded-[24px] border border-gray-100 shadow-[0_0_26px_2px_rgba(0,0,0,0.05)] overflow-hidden p-6 hover:shadow-xl transition-all flex flex-col md:flex-row gap-6 items-start group"
                                                >
                                                    {/* Call Image or Placeholder */}
                                                    <div className="w-full md:w-52 h-44 bg-gray-100 rounded-2xl overflow-hidden shrink-0 relative">
                                                        {call.imageUrl ? (
                                                            <img 
                                                                src={call.imageUrl} 
                                                                alt={call.applicationName}
                                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=OC+Call';
                                                                }}
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full bg-gradient-to-br from-pink-600 to-indigo-700 flex flex-col items-center justify-center text-white p-4 text-center">
                                                                <Megaphone size={28} className="mb-2 opacity-80" />
                                                                <span className="text-xs font-bold font-playfair line-clamp-2">{call.applicationName}</span>
                                                            </div>
                                                        )}
                                                        <div className="absolute top-2.5 left-2.5 bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                                                            Recruiting
                                                        </div>
                                                    </div>

                                                    {/* Call Content */}
                                                    <div className="flex-1 flex flex-col justify-between w-full h-full">
                                                        <div>
                                                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                                                <h3 className="font-playfair font-bold text-xl text-gray-900 group-hover:text-pink-600 transition-colors">
                                                                    {call.applicationName}
                                                                </h3>
                                                                {userApp && (
                                                                    <span className={`text-[11px] font-bold uppercase tracking-wide px-3 py-1 rounded-full flex items-center gap-1.5 ${
                                                                        userApp.status === 'selected' 
                                                                            ? 'bg-green-100 text-green-700 border border-green-200' 
                                                                            : userApp.status === 'rejected'
                                                                            ? 'bg-gray-100 text-gray-600 border border-gray-200'
                                                                            : 'bg-amber-100 text-amber-700 border border-amber-200'
                                                                    }`}>
                                                                        <span className={`w-1.5 h-1.5 rounded-full ${
                                                                            userApp.status === 'selected' ? 'bg-green-500' : userApp.status === 'rejected' ? 'bg-gray-400' : 'bg-amber-500 animate-pulse'
                                                                        }`}></span>
                                                                        {userApp.status === 'selected' ? 'Selected' : userApp.status === 'rejected' ? 'Closed' : 'Applied • Pending Review'}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {/* Creator / Collaborator line */}
                                                            <div className="text-xs text-gray-500 mb-3 flex flex-wrap items-center gap-1.5">
                                                                <span>Organized by <strong className="text-gray-800 font-semibold">{creator.name}</strong></span>
                                                                {collaborators.length > 0 && (
                                                                    <span className="text-gray-400">• Collaborators: <strong className="text-gray-700">{collaborators.map(c => c.name).join(", ")}</strong></span>
                                                                )}
                                                            </div>

                                                            <p className="text-sm text-gray-600 line-clamp-2 mb-4 leading-relaxed whitespace-pre-line">
                                                                {call.description || "Join this committee to take an active role in planning, coordinating, and delivering this event."}
                                                            </p>

                                                            {/* Positions pill list */}
                                                            <div className="flex flex-wrap gap-1.5 mb-4">
                                                                {call.positions?.map((p, i) => (
                                                                    <span key={i} className="bg-slate-50 border border-slate-200 text-slate-700 text-xs px-2.5 py-1 rounded-lg font-medium">
                                                                        {p.title}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* Action Footer */}
                                                        <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                                                            {userApp ? (
                                                                <div className="flex items-center justify-between w-full">
                                                                    <span className="text-xs text-gray-500 font-poppins">
                                                                        Applied position: <strong className="text-pink-600">{userApp.position}</strong>
                                                                    </span>
                                                                    <button
                                                                        onClick={() => handleOpenViewAppModal(userApp)}
                                                                        className="text-xs font-semibold text-pink-600 hover:text-pink-700 underline font-poppins"
                                                                    >
                                                                        View Submitted Form
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center justify-between w-full">
                                                                    <span className="text-xs text-gray-400 hidden sm:inline">
                                                                        Pre-filled from your profile
                                                                    </span>
                                                                    <button
                                                                        onClick={() => handleOpenApplyModal(call)}
                                                                        className="inline-flex items-center gap-1.5 bg-pink-600 hover:bg-pink-700 text-white font-poppins font-bold text-xs px-5 py-2.5 rounded-full transition shadow-md hover:shadow-lg hover:scale-105 active:scale-95 ml-auto sm:ml-0"
                                                                    >
                                                                        <span>Apply for Event</span>
                                                                        <ArrowRight size={14} />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* --- 4. MY CONTRIBUTIONS --- */}
                            <div className="mb-6">
                                <h2 className="font-poppins font-medium text-lg text-pink-600 text-center mb-4">My Contributions</h2>
                                <div className="border-t-2 border-gray-300 mb-8"></div>
                            </div>

                            {contributions.length === 0 ? (
                                <div className="text-center text-gray-500 py-16 bg-gray-50 rounded-[22px] border border-gray-100">
                                    <Calendar className="mx-auto text-gray-300 mb-3" size={40} />
                                    <p className="font-poppins">You haven&apos;t participated in any events yet.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {contributions.map((project) => (
                                        <ContributionCard key={project.id} project={project} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ============================================================== */}
                    {/* --- APPLICATION FORM MODAL (IN-ACCOUNT) --- */}
                    {/* ============================================================== */}
                    {applyModalOpen && selectedCallToApply && (
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
                            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
                                {/* Header */}
                                <div className="bg-gradient-to-r from-pink-600 to-rose-700 p-6 text-white flex items-center justify-between">
                                    <div>
                                        <div className="inline-flex items-center gap-1.5 bg-white/20 text-white text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full mb-1">
                                            <Sparkles size={12} />
                                            OC Application
                                        </div>
                                        <h3 className="text-2xl font-playfair font-bold">
                                            {selectedCallToApply.applicationName}
                                        </h3>
                                        <p className="text-pink-100 text-xs mt-0.5">
                                            Your existing profile details will be linked automatically.
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => setApplyModalOpen(false)}
                                        className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>

                                <form onSubmit={handleApplySubmit} className="p-6 sm:p-8 space-y-6 max-h-[80vh] overflow-y-auto">
                                    {/* Auto-Fetched Profile Info Box */}
                                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                                <UserCheck size={16} className="text-emerald-600" />
                                                Fetched from Verified Profile
                                            </span>
                                            <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                                                <Check size={12} /> Verified
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                            <div>
                                                <span className="text-slate-400 block">Full Name:</span>
                                                <span className="font-semibold text-slate-800">{profile.fullName}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 block">Student / Index No:</span>
                                                <span className="font-semibold text-slate-800">{profile.studentId || "N/A"}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 block">Faculty:</span>
                                                <span className="font-semibold text-slate-800">{profile.faculty}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 block">Department:</span>
                                                <span className="font-semibold text-slate-800">{profile.department}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 block">Email:</span>
                                                <span className="font-semibold text-slate-800">{profile.email}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 block">WhatsApp / Phone:</span>
                                                <span className="font-semibold text-slate-800">{profile.whatsapp}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Position Selection */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 font-poppins">
                                            Select Position to Apply For <span className="text-pink-600">*</span>
                                        </label>
                                        <select
                                            value={selectedPosition}
                                            onChange={(e) => setSelectedPosition(e.target.value)}
                                            required
                                            className="w-full p-3.5 bg-white border-2 border-gray-200 rounded-xl focus:border-pink-600 outline-none font-poppins text-sm text-gray-900 font-medium transition"
                                        >
                                            <option value="">-- Choose Position --</option>
                                            {selectedCallToApply.positions?.map((pos, idx) => (
                                                <option key={pos.id || idx} value={pos.title}>
                                                    {pos.title} {pos.maintainTeam ? "(Team Lead)" : ""}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Team Role / Sub-team note if position has maintainTeam */}
                                    {(() => {
                                        const currentPosObj = selectedCallToApply.positions?.find(p => p.title === selectedPosition);
                                        if (currentPosObj && currentPosObj.maintainTeam) {
                                            return (
                                                <div className="bg-pink-50 border border-pink-200 rounded-2xl p-4 space-y-2">
                                                    <label className="block text-xs font-bold text-pink-700 uppercase tracking-wider font-poppins">
                                                        Team Structure / Proposed Sub-team Members (Optional)
                                                    </label>
                                                    <p className="text-xs text-pink-600">
                                                        This position involves coordinating a team. You can propose team roles or mention members you would like to work with.
                                                    </p>
                                                    <input 
                                                        type="text"
                                                        value={teamRoleNote}
                                                        onChange={(e) => setTeamRoleNote(e.target.value)}
                                                        placeholder="e.g. Lead Coordinator, or proposed co-directors..."
                                                        className="w-full p-3 bg-white border border-pink-300 rounded-xl focus:border-pink-600 outline-none text-xs font-poppins text-gray-900"
                                                    />
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}

                                    {/* Custom Questions (if any) */}
                                    {selectedCallToApply.customQuestions && selectedCallToApply.customQuestions.length > 0 && (
                                        <div className="space-y-4 pt-2 border-t border-gray-100">
                                            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider font-poppins">
                                                Additional Project Questions
                                            </h4>
                                            {selectedCallToApply.customQuestions.map((q, qIdx) => {
                                                const qText = typeof q === 'string' ? q : (q.title || q.question || `Question ${qIdx + 1}`);
                                                const isRequired = typeof q === 'object' && q.required !== false;
                                                return (
                                                    <div key={qIdx} className="space-y-1.5">
                                                        <label className="block text-xs font-medium text-gray-700 font-poppins">
                                                            {qText} {isRequired && <span className="text-pink-600">*</span>}
                                                        </label>
                                                        <textarea
                                                            rows={2}
                                                            required={isRequired}
                                                            value={customAnswers[qText] || ""}
                                                            onChange={(e) => setCustomAnswers(prev => ({ ...prev, [qText]: e.target.value }))}
                                                            placeholder="Your answer..."
                                                            className="w-full p-3 border border-gray-200 rounded-xl focus:border-pink-600 outline-none text-xs font-poppins text-gray-800 transition"
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setApplyModalOpen(false)}
                                            className="px-5 py-2.5 text-xs font-bold text-gray-600 hover:text-gray-900 transition font-poppins"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={submittingApp}
                                            className="inline-flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white font-poppins font-bold text-xs px-6 py-3 rounded-full transition shadow-md hover:shadow-lg disabled:opacity-50"
                                        >
                                            {submittingApp ? (
                                                <>
                                                    <Loader2 size={14} className="animate-spin" />
                                                    <span>Submitting...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span>Submit Application</span>
                                                    <ArrowRight size={14} />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* ============================================================== */}
                    {/* --- VIEW SUBMITTED APPLICATION MODAL --- */}
                    {/* ============================================================== */}
                    {viewAppModalOpen && selectedAppToView && (
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
                            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden my-8 animate-in fade-in duration-200">
                                <div className="bg-gray-900 p-6 text-white flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xl font-playfair font-bold">
                                            {selectedAppToView.applicationName || "Application Details"}
                                        </h3>
                                        <p className="text-xs text-gray-400 mt-0.5">Submitted Application Review</p>
                                    </div>
                                    <button 
                                        onClick={() => setViewAppModalOpen(false)}
                                        className="text-gray-400 hover:text-white transition"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                                <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                                    <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                                        <span className="text-xs font-semibold text-gray-600">Application Status</span>
                                        <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full ${
                                            selectedAppToView.status === 'selected' 
                                                ? 'bg-green-100 text-green-700' 
                                                : selectedAppToView.status === 'rejected'
                                                ? 'bg-gray-100 text-gray-600'
                                                : 'bg-amber-100 text-amber-700'
                                        }`}>
                                            {selectedAppToView.status || "Pending"}
                                        </span>
                                    </div>

                                    <div className="space-y-3 text-xs font-poppins">
                                        <div className="border-b pb-2">
                                            <span className="text-gray-400 block mb-0.5">Applied Position</span>
                                            <span className="font-bold text-gray-900 text-sm">{selectedAppToView.position}</span>
                                        </div>

                                        {selectedAppToView.teamRole && (
                                            <div className="border-b pb-2">
                                                <span className="text-gray-400 block mb-0.5">Team Role / Structure Note</span>
                                                <span className="font-medium text-gray-800">{selectedAppToView.teamRole}</span>
                                            </div>
                                        )}

                                        {selectedAppToView.customAnswers && Object.keys(selectedAppToView.customAnswers).length > 0 && (
                                            <div className="space-y-3 pt-2">
                                                <span className="text-gray-400 block font-bold uppercase tracking-wider text-[11px]">
                                                    Your Questionnaire Responses
                                                </span>
                                                {Object.entries(selectedAppToView.customAnswers).map(([k, v], idx) => (
                                                    <div key={idx} className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                        <span className="font-medium text-gray-700 block mb-1">{k}</span>
                                                        <p className="text-gray-900 font-semibold">{v || "N/A"}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-2">
                                        <button
                                            onClick={() => setViewAppModalOpen(false)}
                                            className="w-full bg-gray-900 hover:bg-gray-800 text-white font-poppins font-bold text-xs py-3 rounded-xl transition"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ============================================================== */}
                    {/* --- EXECUTIVE ATTENDANCE MODAL --- */}
                    {/* ============================================================== */}
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

export default function Profile() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <Loader2 className="animate-spin text-pink-600" size={40} />
            </div>
        }>
            <ProfileContent />
        </Suspense>
    );
}

// --- HELPER COMPONENTS ---

const InfoRow = ({ label, value }: { label: string; value?: React.ReactNode }) => (
    <div className="flex items-start gap-4 justify-between border-b border-gray-200/50 last:border-0 pb-2 last:pb-0">
        <p className="font-poppins font-medium text-[14px] text-pink-600 whitespace-nowrap flex-shrink-0">{label}</p>
        <div className="font-poppins text-[14px] text-gray-600 text-right flex-1 break-words">
            {value || "N/A"}
        </div>
    </div>
);

const ContributionCard = ({ project }: { project: EventItem }) => (
    <div className="bg-white rounded-[22px] shadow-[0_0_26px_2px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden h-[255px] flex flex-col group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        <div className="flex h-full">
            <div className="w-[140px] h-full bg-[#f0f0f0] flex-shrink-0">
                <img
                    src={project.imageUrl || images.imgRectangle20}
                    alt={project.name || "Event"}
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