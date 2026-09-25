'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import NavBar from "../components/Navbar";
import Footer from "../components/Footer";
import { 
    Megaphone, Sparkles, ArrowRight, ArrowLeft, Briefcase, 
    Clock, ChevronRight, UserCheck, CheckCircle 
} from 'lucide-react';

export default function ApplyProjectsPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [calls, setCalls] = useState([]);
    const [userApplications, setUserApplications] = useState([]);

    const [execMap, setExecMap] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            if (user?.email) {
                try {
                    const qApp = query(collection(db, "ocApplications"), where("applicantEmail", "==", user.email));
                    const snapApp = await getDocs(qApp);
                    setUserApplications(snapApp.docs.map(d => ({ id: d.id, ...d.data() })));
                } catch (err) {
                    console.error("Error fetching user applications:", err);
                }
            } else {
                setUserApplications([]);
            }
        };
        fetchUserData();
    }, [user]);

    useEffect(() => {
        const fetchOpenCalls = async () => {
            try {
                // Fetch executive committee profiles to resolve creator & collaborator names
                const execSnap = await getDocs(collection(db, "executiveCommittee"));
                const eMap = {};
                execSnap.docs.forEach(doc => {
                    const data = doc.data();
                    const name = data.fullName || `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.firstName || "Committee Member";
                    const item = {
                        id: doc.id,
                        name,
                        position: data.position || "Board Member",
                        email: data.email?.toLowerCase()?.trim() || "",
                        imageUrl: data.imageUrl || ""
                    };
                    eMap[doc.id] = item;
                    if (data.email) eMap[data.email.toLowerCase().trim()] = item;
                });
                setExecMap(eMap);

                // Fetch published, open OC calls
                const callsQuery = query(collection(db, "ocCalls"), where("status", "==", "open"));
                const callsSnap = await getDocs(callsQuery);
                const openCalls = callsSnap.docs
                    .map(d => ({ id: d.id, ...d.data() }))
                    .filter(c => c.published !== false && c.published)
                    .sort((a, b) => {
                        const dateA = a.createdAt?.toDate?.() ? a.createdAt.toDate().getTime() : 0;
                        const dateB = b.createdAt?.toDate?.() ? b.createdAt.toDate().getTime() : 0;
                        return dateB - dateA;
                    });

                setCalls(openCalls);
            } catch (err) {
                console.error("Error loading project calls:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchOpenCalls();
    }, []);

    const handleApplyClick = (callId) => {
        const targetUrl = `/profile?applyCallId=${callId}`;
        if (!user) {
            router.push(`/login?redirect=${encodeURIComponent(targetUrl)}`);
        } else {
            router.push(targetUrl);
        }
    };

    // Helper to resolve member info
    const resolveMember = (idOrEmail) => {
        if (!idOrEmail) return { name: "Organizing Committee", position: "Executive Member" };
        const key = idOrEmail.toLowerCase().trim();
        if (execMap[key]) return execMap[key];
        if (execMap[idOrEmail]) return execMap[idOrEmail];
        return { name: idOrEmail.includes('@') ? idOrEmail.split('@')[0] : "Committee Member", position: "Executive Member" };
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-poppins selection:bg-pink-500 selection:text-white">
            <NavBar currentPage="apply-projects" />

            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative overflow-hidden bg-gradient-to-br from-gray-950 via-slate-900 to-pink-950 text-white py-16 md:py-24 px-4 sm:px-6 lg:px-8 border-b border-pink-900/20">
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ec4899_1px,transparent_1px)] [background-size:16px_16px]"></div>
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>

                    <div className="relative max-w-5xl mx-auto">
                        <div className="mb-6 flex justify-start">
                            <Link 
                                href="/" 
                                className="inline-flex items-center gap-2 text-slate-300 hover:text-white text-xs font-semibold bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full transition backdrop-blur-md"
                            >
                                <ArrowLeft size={14} /> Back to Home
                            </Link>
                        </div>
                        <div className="text-center">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-400 text-xs md:text-sm font-semibold tracking-wide uppercase mb-6 backdrop-blur-md">
                                <Sparkles size={14} className="text-pink-400" />
                                Rotaract Club of SUSL • Organizing Committees
                            </div>
                            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-playfair font-extrabold tracking-tight text-white mb-6 leading-tight">
                                Apply for Project
                                <br />
                                 <span className="bg-gradient-to-r from-pink-400 via-rose-300 to-amber-200 bg-clip-text text-transparent">Organizing Committees</span>
                            </h1>
                            <p className="text-slate-300 text-base sm:text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
                                Step up, sharpen your leadership abilities, and co-create impactful initiatives with passionate fellow Rotaractors. Choose your desired position and submit your application online.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Content Section */}
                <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 space-y-4">
                            <div className="w-12 h-12 border-4 border-pink-500/20 border-t-pink-600 rounded-full animate-spin"></div>
                            <p className="text-gray-500 text-sm font-medium animate-pulse">Loading active project calls...</p>
                        </div>
                    ) : calls.length === 0 ? (
                        <div className="bg-white rounded-3xl p-12 text-center max-w-xl mx-auto border border-gray-100 shadow-sm">
                            <div className="w-20 h-20 bg-pink-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-pink-600">
                                <Megaphone size={36} />
                            </div>
                            <h2 className="text-2xl font-playfair font-bold text-gray-900 mb-3">No Open Project Calls</h2>
                            <p className="text-gray-600 text-sm leading-relaxed mb-8">
                                There are currently no active committee recruitment calls open for applications. Stay tuned or check back soon as our teams announce new projects!
                            </p>
                            <Link 
                                href="/projects" 
                                className="inline-flex items-center gap-2 bg-gray-900 hover:bg-pink-600 text-white font-semibold text-sm px-6 py-3 rounded-full transition shadow-md"
                            >
                                Explore Past Projects <ChevronRight size={16} />
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-12">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
                                <div>
                                    <h2 className="text-2xl md:text-3xl font-playfair font-bold text-gray-900">
                                        Active Opportunities ({calls.length})
                                    </h2>
                                    <p className="text-gray-500 text-sm mt-1">
                                        Review roles, committee collaborators, and click Apply to submit via your member profile.
                                    </p>
                                </div>
                                <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3.5 py-1.5 rounded-full text-xs font-semibold border border-green-200">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
                                    Applications Now Open
                                </div>
                            </div>

                            {/* Project Cards Grid */}
                            <div className="grid grid-cols-1 gap-8">
                                {calls.map((call) => {
                                    const creator = resolveMember(call.createdByName || call.createdBy || call.publishedByEmail);
                                    const collaborators = (call.sharedWith || []).map(resolveMember);

                                    return (
                                        <div 
                                            key={call.id}
                                            className="bg-white rounded-3xl border border-gray-200/80 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col lg:flex-row group"
                                        >
                                            {/* Poster / Banner column */}
                                            <div className="lg:w-[420px] bg-slate-100 relative shrink-0 overflow-hidden flex items-center justify-center min-h-[260px] lg:min-h-full">
                                                {call.imageUrl ? (
                                                    <img 
                                                        src={call.imageUrl} 
                                                        alt={call.applicationName}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 max-h-[380px] lg:max-h-full"
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="w-full h-full min-h-[280px] bg-gradient-to-br from-pink-600 via-rose-700 to-indigo-900 p-8 flex flex-col justify-between text-white">
                                                        <div className="flex items-center gap-2">
                                                            <span className="p-2 bg-white/20 backdrop-blur-md rounded-xl">
                                                                <Megaphone size={24} />
                                                            </span>
                                                            <span className="text-xs uppercase font-bold tracking-wider opacity-80">OC Call</span>
                                                        </div>
                                                        <div>
                                                            <p className="text-xl font-playfair font-bold line-clamp-2 leading-tight">
                                                                {call.applicationName}
                                                            </p>
                                                            <p className="text-xs opacity-80 mt-1">Rotaract Club of SUSL</p>
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                <div className="absolute top-4 left-4 bg-gray-950/80 backdrop-blur-md text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-md flex items-center gap-1.5">
                                                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                                    Open Call
                                                </div>
                                            </div>

                                            {/* Information Column */}
                                            <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between space-y-6">
                                                <div>
                                                    {/* Title & Metadata */}
                                                    <div className="mb-4">
                                                        <h3 className="text-2xl sm:text-3xl font-playfair font-bold text-gray-900 group-hover:text-pink-600 transition-colors">
                                                            {call.applicationName}
                                                        </h3>
                                                    </div>

                                                    {/* Creator & Collaborators Notice */}
                                                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 mb-5">
                                                        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-700">
                                                            <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                                                                <UserCheck size={16} className="text-pink-600" />
                                                                <span>Created by:</span>
                                                                <span className="bg-pink-100 text-pink-700 font-bold px-2 py-0.5 rounded-md">
                                                                    {creator.name}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Description */}
                                                    <div className="mb-6">
                                                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 font-poppins">
                                                            Project Overview
                                                        </h4>
                                                        <p className="text-gray-700 text-sm sm:text-base leading-relaxed whitespace-pre-line line-clamp-4 hover:line-clamp-none transition-all">
                                                            {call.description || "Join this committee to take an active role in planning, coordinating, and delivering a landmark Rotaract SUSL event."}
                                                        </p>
                                                    </div>

                                                    {/* Applicable Positions */}
                                                    <div>
                                                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 font-poppins flex items-center gap-1.5">
                                                            <Briefcase size={14} className="text-pink-600" />
                                                            Available Positions ({call.positions?.length || 0})
                                                        </h4>
                                                        <div className="flex flex-wrap gap-2">
                                                            {call.positions && call.positions.length > 0 ? (
                                                                call.positions.map((pos, idx) => (
                                                                    <div 
                                                                        key={pos.id || idx}
                                                                        className="bg-white border-2 border-pink-100 text-slate-800 hover:border-pink-500 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition flex items-center gap-1.5 shadow-sm"
                                                                    >
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span>
                                                                        <span>{pos.title}</span>
                                                                        {pos.maintainTeam && pos.teamStructure === 'needs_lead' && (
                                                                            <span className="bg-pink-50 text-pink-600 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ml-1">
                                                                                Lead / Member
                                                                            </span>
                                                                        )}
                                                                        {pos.maintainTeam && pos.teamStructure === 'all_members' && (
                                                                            <span className="bg-slate-100 text-slate-600 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ml-1">
                                                                                Members
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <span className="text-xs text-gray-400 italic">Open general committee positions</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Action Bar */}
                                                {(() => {
                                                    const userApp = userApplications.find(a => a.callId === call.id);
                                                    if (userApp) {
                                                        if (userApp.status === 'selected') {
                                                            return (
                                                                <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-emerald-50 border border-emerald-200 p-4 rounded-2xl">
                                                                    <div className="flex items-center gap-2.5 text-emerald-800">
                                                                        <CheckCircle size={20} className="text-emerald-600 shrink-0" />
                                                                        <div>
                                                                            <p className="text-xs sm:text-sm font-bold">
                                                                                🎉 You have been selected for this project as <span className="underline decoration-emerald-500 font-extrabold">{userApp.selectedRole || userApp.teamRole || "Team Member"}</span>!
                                                                            </p>
                                                                            <p className="text-[11px] text-emerald-700 font-normal">
                                                                                Position: {userApp.position} • Organizing Committee
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <Link
                                                                        href="/profile"
                                                                        className="inline-flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-poppins font-bold text-xs px-5 py-2.5 rounded-full transition shadow-xs shrink-0"
                                                                    >
                                                                        <span>View in Profile</span>
                                                                        <ArrowRight size={14} />
                                                                    </Link>
                                                                </div>
                                                            );
                                                        }
                                                        return (
                                                            <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-amber-50 border border-amber-200 p-4 rounded-2xl">
                                                                <div className="flex items-center gap-2.5 text-amber-800">
                                                                    <Clock size={20} className="text-amber-600 shrink-0" />
                                                                    <div>
                                                                        <p className="text-xs sm:text-sm font-bold">
                                                                            You have applied on this already
                                                                        </p>
                                                                        <p className="text-[11px] text-amber-700 font-normal">
                                                                            Applied Position: {userApp.position} • Status: Pending Review
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <Link
                                                                    href="/profile"
                                                                    className="inline-flex items-center justify-center gap-1.5 bg-white border border-amber-300 hover:bg-amber-100 text-amber-800 font-poppins font-bold text-xs px-4 py-2 rounded-full transition shadow-2xs shrink-0"
                                                                >
                                                                    <span>View Application</span>
                                                                    <ArrowRight size={14} />
                                                                </Link>
                                                            </div>
                                                        );
                                                    }

                                                    return (
                                                        <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                                                            <p className="text-xs text-gray-500 flex items-center gap-1.5">
                                                                <Clock size={14} className="text-gray-400" />
                                                                Applications are reviewed continuously by the OC team
                                                            </p>
                                                            <button
                                                                onClick={() => handleApplyClick(call.id)}
                                                                className="inline-flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-700 text-white font-poppins font-bold text-sm px-6 py-3 rounded-full transition shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                                                            >
                                                                <span>Apply for this Project</span>
                                                                <ArrowRight size={16} />
                                                            </button>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </section>
            </main>
            <Footer />
        </div>
        
    );
}
