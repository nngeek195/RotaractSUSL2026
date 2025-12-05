"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, limit, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import {
    Users, Clock, Calendar, CheckCircle,
    ArrowRight, TrendingUp, Activity, AlertCircle, Loader2
} from "lucide-react";

export default function AdminDashboard() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalMembers: 0,
        pendingRequests: 0,
        upcomingEvents: 0,
        completedEvents: 0,
        execMembers: 0
    });
    const [recentRequests, setRecentRequests] = useState<any[]>([]);
    const [nextEvent, setNextEvent] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // 1. Fetch Users & Execs for Total Count
                const usersSnap = await getDocs(collection(db, "users"));
                const execSnap = await getDocs(collection(db, "executiveCommittee"));
                const totalMembers = usersSnap.size + execSnap.size;
                const execMembers = execSnap.size;

                // 2. Fetch Pending Requests (Count + Recent 5) - WITH VERIFICATION CHECK
                const requestsRef = collection(db, "pendingRequests");
                const requestsSnap = await getDocs(requestsRef);
                
                const allRequests = requestsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
                const pendingUids = allRequests.filter((r: any) => r.status === 'pending').map((r: any) => r.id);

                let verifiedRequestsCount = 0;
                let verificationStatus: Record<string, boolean> = {};

                if (pendingUids.length > 0) {
                    try {
                        // Check email verification status via API
                        const response = await fetch('/api/check-verification', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ uids: pendingUids })
                        });

                        if (response.ok) {
                            const data = await response.json();
                            verificationStatus = data.verificationStatus || {};
                            
                            // Count verified users
                            verifiedRequestsCount = allRequests.filter(req => 
                                verificationStatus[req.id] === true && req.status === 'pending'
                            ).length;
                        } else {
                            console.error("Failed to check verification status");
                        }
                    } catch (err) {
                        console.error("Error checking verification:", err);
                    }
                }

                // Recent Requests: Show ALL (verified or not), sorted by date, enriched with verification status
                const sortedRequests = allRequests
                    .map(req => ({
                        ...req,
                        isVerified: verificationStatus[req.id] === true
                    }))
                    .sort((a: any, b: any) => {
                        const dateA = a.submittedAt?.toDate ? a.submittedAt.toDate() : new Date(0);
                        const dateB = b.submittedAt?.toDate ? b.submittedAt.toDate() : new Date(0);
                        return dateB.getTime() - dateA.getTime();
                    })
                    .slice(0, 5);

                setRecentRequests(sortedRequests);

                // 3. Fetch Events (Count + Next Upcoming)
                const eventsSnap = await getDocs(collection(db, "events"));
                let upcomingCount = 0;
                let completedCount = 0;
                let upcomingEventsList: any[] = [];

                eventsSnap.forEach(doc => {
                    const data = doc.data();
                    if (data.status === 'upcoming') {
                        upcomingCount++;
                        upcomingEventsList.push({ id: doc.id, ...data });
                    } else if (data.status === 'completed') {
                        completedCount++;
                    }
                });

                // Find the soonest upcoming event
                upcomingEventsList.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                setNextEvent(upcomingEventsList[0] || null);

                setStats({
                    totalMembers,
                    pendingRequests: verifiedRequestsCount,
                    upcomingEvents: upcomingCount,
                    completedEvents: completedCount,
                    execMembers
                });

            } catch (error) {
                console.error("Error loading dashboard:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center p-10">
                <Loader2 className="animate-spin text-blue-600" size={40} />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Dashboard Overview</h1>
                    <p className="text-gray-500 mt-1">Welcome back, Admin. Here's what's happening in the club.</p>
                </div>
                <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Card 1: Pending Requests (Action needed) */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Clock size={60} className="text-orange-500" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-gray-500 text-sm font-medium mb-1">Pending Requests</span>
                        <span className="text-3xl font-bold text-gray-900">{stats.pendingRequests}</span>
                        {stats.pendingRequests > 0 && (
                            <Link href="/admin/requests" className="text-xs font-bold text-orange-500 mt-3 flex items-center gap-1 hover:underline">
                                Review Now <ArrowRight size={12} />
                            </Link>
                        )}
                    </div>
                </div>

                {/* Card 2: Total Members */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Users size={60} className="text-blue-500" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-gray-500 text-sm font-medium mb-1">Active Members</span>
                        <span className="text-3xl font-bold text-gray-900">{stats.totalMembers}</span>
                        <span className="text-xs text-gray-400 mt-2">
                            {stats.execMembers} Executive Committee
                        </span>
                    </div>
                </div>

                {/* Card 3: Upcoming Events */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Calendar size={60} className="text-pink-500" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-gray-500 text-sm font-medium mb-1">Upcoming Events</span>
                        <span className="text-3xl font-bold text-gray-900">{stats.upcomingEvents}</span>
                        <Link href="/admin/events" className="text-xs font-bold text-pink-600 mt-3 flex items-center gap-1 hover:underline">
                            Manage Events <ArrowRight size={12} />
                        </Link>
                    </div>
                </div>

                {/* Card 4: Completed Impact */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <CheckCircle size={60} className="text-green-500" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-gray-500 text-sm font-medium mb-1">Completed Projects</span>
                        <span className="text-3xl font-bold text-gray-900">{stats.completedEvents}</span>
                        <span className="text-xs text-green-600 mt-3 flex items-center gap-1">
                            <TrendingUp size={12} /> Impact Growing
                        </span>
                    </div>
                </div>
            </div>

            {/* Dashboard Main Content Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Recent Requests (2/3 width) */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <Activity size={18} className="text-blue-600" /> Recent Membership Requests
                        </h3>
                        <Link href="/admin/requests" className="text-sm text-blue-600 hover:underline">View All</Link>
                    </div>

                    <div className="divide-y divide-gray-50">
                        {recentRequests.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <p>No pending requests.</p>
                            </div>
                        ) : (
                            recentRequests.map((req) => (
                                <div key={req.id} className="p-4 hover:bg-gray-50 transition border-b border-gray-100 last:border-0">
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold shrink-0 mt-1">
                                            {req.fullName?.charAt(0)}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-medium text-gray-900">{req.fullName}</h4>
                                                {req.isVerified ? (
                                                    <Link href="/admin/requests" className="px-3 py-1 bg-white border border-gray-200 text-gray-600 text-xs rounded-md hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition">
                                                        Review
                                                    </Link>
                                                ) : (
                                                    <span className="px-3 py-1 bg-gray-100 border border-gray-200 text-gray-400 text-xs rounded-md cursor-not-allowed" title="Email not verified yet">
                                                        Unverified
                                                    </span>
                                                )}
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 mt-2 text-sm text-gray-600">
                                                <p><span className="font-semibold">Initials:</span> {req.nameWithInitials}</p>
                                                <p><span className="font-semibold">Student ID:</span> {req.studentId}</p>
                                                <p><span className="font-semibold">Faculty:</span> {req.faculty}</p>
                                                <p><span className="font-semibold">Department:</span> {req.department}</p>
                                                <p><span className="font-semibold">Email:</span> {req.email}</p>
                                                <p><span className="font-semibold">WhatsApp:</span> {req.whatsapp}</p>
                                                <p className="md:col-span-2"><span className="font-semibold">Submitted:</span> {req.submittedAt?.toDate ? req.submittedAt.toDate().toLocaleString() : 'N/A'}</p>
                                            </div>
                                            
                                            {req.reason && (
                                                <div className="mt-2 bg-gray-50 p-2 rounded text-xs text-gray-700 border border-gray-100">
                                                    <span className="font-semibold">Reason:</span> {req.reason}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Column: Next Event Highlight (1/3 width) */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-gray-100">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <AlertCircle size={18} className="text-pink-600" /> Next Project
                        </h3>
                    </div>

                    {nextEvent ? (
                        <div className="flex-1 flex flex-col">
                            <div className="h-32 bg-gray-200 relative">
                                <img
                                    src={nextEvent.imageUrl}
                                    alt="Event"
                                    className="w-full h-full object-cover"
                                    onError={(e) => (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x200?text=Project'}
                                />
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                                    <p className="text-white font-bold truncate">{nextEvent.title}</p>
                                </div>
                            </div>
                            <div className="p-6 flex-1">
                                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                    <Calendar size={16} className="text-pink-500" /> {nextEvent.date}
                                </div>
                                <p className="text-sm text-gray-500 line-clamp-3 mb-4">{nextEvent.description}</p>
                                <Link href="/admin/events" className="block w-full py-2 bg-pink-50 text-pink-700 text-center text-sm font-bold rounded-lg hover:bg-pink-100 transition">
                                    Manage Event
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center h-full">
                            <Calendar size={40} className="text-gray-300 mb-3" />
                            <p>No upcoming events.</p>
                            <Link href="/admin/events" className="mt-4 text-sm text-pink-600 font-bold hover:underline">Create One +</Link>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}