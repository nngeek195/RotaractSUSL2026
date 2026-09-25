"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import {
    Users, Calendar, CheckCircle,
    ArrowRight, Activity, AlertCircle, Loader2,
    ShieldCheck, Megaphone // Added new icon
} from "lucide-react";
import { motion } from "framer-motion";

export default function AdminDashboard() {
    const { user, isAdmin, isCommittee, loading: authLoading } = useAuth();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalMembers: 0,
        execMembers: 0,
        upcomingEvents: 0,
        completedEvents: 0,
        activeOcCalls: 0 // Added OC Call state
    });
    const [recentMembers, setRecentMembers] = useState<any[]>([]);
    const [nextEvent, setNextEvent] = useState<any>(null);

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.replace("/login");
            } else if (!isAdmin && isCommittee) {
                // Redirect committee members away from admin dashboard directly to OC Calls
                router.replace("/admin/oc-calls");
            }
        }
    }, [authLoading, user, isAdmin, isCommittee, router]);

    useEffect(() => {
        if (authLoading || !isAdmin) return;
        const fetchData = async () => {
            try {
                setLoading(true);

                // 1. Fetch Users & Execs for Counts
                const usersSnap = await getDocs(collection(db, "users"));
                const execSnap = await getDocs(collection(db, "executiveCommittee"));
                const totalMembers = usersSnap.size + execSnap.size;
                const execMembers = execSnap.size;
                
                // Fetch Active OC Calls
                const ocCallsSnap = await getDocs(query(collection(db, "ocCalls"), where("status", "==", "open")));
                const activeOcCalls = ocCallsSnap.size;

                // 2. Fetch Recent Members
                const usersList = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
                usersList.sort((a: any, b: any) => {
                    const dateA = a.joinedAt?.toDate ? a.joinedAt.toDate() : (a.joinedAt ? new Date(a.joinedAt) : (a.submittedAt?.toDate ? a.submittedAt.toDate() : new Date(0)));
                    const dateB = b.joinedAt?.toDate ? b.joinedAt.toDate() : (b.joinedAt ? new Date(b.joinedAt) : (b.submittedAt?.toDate ? b.submittedAt.toDate() : new Date(0)));
                    return dateB.getTime() - dateA.getTime();
                });
                setRecentMembers(usersList.slice(0, 5));

                // 3. Fetch Events
                const eventsSnap = await getDocs(collection(db, "events"));
                let upcomingCount = 0;
                let completedCount = 0;
                const upcomingEventsList: any[] = [];

                eventsSnap.forEach(doc => {
                    const data = doc.data();
                    if (data.status === 'upcoming') {
                        upcomingCount++;
                        upcomingEventsList.push({ id: doc.id, ...data });
                    } else if (data.status === 'completed') {
                        completedCount++;
                    }
                });

                upcomingEventsList.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                setNextEvent(upcomingEventsList[0] || null);

                setStats({
                    totalMembers,
                    execMembers,
                    upcomingEvents: upcomingCount,
                    completedEvents: completedCount,
                    activeOcCalls // Included in state
                });

            } catch (error) {
                console.error("Error loading dashboard:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [authLoading, isAdmin]);

    if (authLoading || loading || !isAdmin) {
        return (
            <div className="flex h-[calc(100vh-100px)] items-center justify-center">
                <Loader2 className="animate-spin text-pink-600" size={40} />
            </div>
        );
    }

    const StatCard = ({ title, value, icon: Icon, color, link, subtext }: any) => (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group"
        >
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-white`}>
                    <Icon size={24} className={color.replace('bg-', 'text-')} />
                </div>
                {link && (
                    <Link href={link} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <ArrowRight size={18} className="transform group-hover:translate-x-1 transition-transform" />
                    </Link>
                )}
            </div>
            <div>
                <span className="text-gray-500 font-medium text-sm block mb-1">{title}</span>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">{value}</h3>
                {subtext && <p className="text-xs text-gray-400 font-medium">{subtext}</p>}
            </div>
        </motion.div>
    );

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12">
            
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Dashboard Overview</h1>
                    <p className="text-sm md:text-base text-gray-500 mt-1 font-medium">Welcome back, Admin. Here&apos;s what&apos;s happening today.</p>
                </div>
                <div className="self-start md:self-auto flex items-center gap-3 bg-white px-5 py-2.5 rounded-full shadow-sm border border-gray-100 text-sm font-medium text-gray-600 w-full md:w-auto justify-center md:justify-start">
                    <Calendar size={18} className="text-pink-600" />
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </header>

            {/* Stats Grid - Updated to allow the 5th card to wrap smoothly */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard 
                    title="Total Members" 
                    value={stats.totalMembers} 
                    icon={Users} 
                    color="bg-blue-500" 
                    link="/admin/users"
                    subtext="All registered members"
                />
                <StatCard 
                    title="Executive Committee" 
                    value={stats.execMembers} 
                    icon={ShieldCheck} 
                    color="bg-purple-500" 
                    link="/admin/users"
                    subtext="Club leaders & board"
                />
                <StatCard 
                    title="Upcoming Events" 
                    value={stats.upcomingEvents} 
                    icon={Calendar} 
                    color="bg-pink-500" 
                    link="/admin/events"
                    subtext="Scheduled projects"
                />
                <StatCard 
                    title="Completed Projects" 
                    value={stats.completedEvents} 
                    icon={CheckCircle} 
                    color="bg-green-500" 
                    link="/admin/project-details"
                    subtext="Successfully executed"
                />
                <StatCard 
                    title="Active OC Calls" 
                    value={stats.activeOcCalls} 
                    icon={Megaphone} 
                    color="bg-indigo-500" 
                    link="/admin/oc-calls"
                    subtext="Open applications"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                
                {/* Recent Members Section */}
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden"
                >
                    <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2.5 text-lg">
                            <Activity size={20} className="text-blue-600" /> Recent Members
                        </h3>
                        <Link href="/admin/users" className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                            View All Members
                        </Link>
                    </div>

                    <div className="divide-y divide-gray-50">
                        {recentMembers.length === 0 ? (
                            <div className="p-12 text-center flex flex-col items-center justify-center text-gray-400">
                                <ShieldCheck size={48} className="text-gray-200 mb-3" />
                                <p>No members registered yet.</p>
                            </div>
                        ) : (
                            recentMembers.map((member, i) => (
                                <motion.div 
                                    key={member.id} 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="p-6 hover:bg-gray-50 transition-colors flex flex-col gap-4 group"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 bg-pink-100 text-pink-600">
                                            {(member.fullName || member.firstName || 'M').charAt(0)}
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                                                <div className="w-full sm:w-auto sm:min-w-0">
                                                    <h4 className="font-bold text-gray-900 text-lg break-words sm:truncate">
                                                        {member.fullName || `${member.firstName || ''} ${member.lastName || ''}`}
                                                    </h4>
                                                    <p className="text-sm text-gray-500 font-medium break-all sm:truncate">{member.email}</p>
                                                </div>
                                                <span className="shrink-0 px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-100 flex items-center gap-1 w-fit">
                                                    <CheckCircle size={12} /> {member.position || 'Member'}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 mt-4 text-sm text-gray-600 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                                                <p><span className="font-semibold text-gray-900">Student ID:</span> {member.studentId || 'N/A'}</p>
                                                <p><span className="font-semibold text-gray-900">Contact:</span> {member.whatsapp || member.mobileNumber || 'N/A'}</p>
                                                <p><span className="font-semibold text-gray-900">Faculty:</span> {member.faculty || 'N/A'}</p>
                                                <p><span className="font-semibold text-gray-900">Dept:</span> {member.department || 'N/A'}</p>
                                            </div>
                                            
                                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-4 gap-3">
                                                 <p className="text-xs text-gray-400 font-medium">
                                                     Joined: {member.joinedAt?.toDate ? member.joinedAt.toDate().toLocaleDateString() : 'Active Member'}
                                                 </p>
                                                 
                                                 <Link 
                                                     href="/admin/users"
                                                     className="w-full sm:w-auto text-center px-5 py-2 bg-pink-600 text-white text-sm font-semibold rounded-lg shadow-lg shadow-pink-600/20 hover:bg-pink-700 transition"
                                                 >
                                                     View in Members
                                                 </Link>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </motion.div>

                {/* Upcoming Project Highlight */}
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full"
                >
                    <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2.5 text-lg">
                            <AlertCircle size={20} className="text-pink-600" /> Next Project
                        </h3>
                    </div>

                    {nextEvent ? (
                        <div className="flex-1 flex flex-col p-6">
                            <div className="relative aspect-video rounded-2xl overflow-hidden mb-6 group">
                                <img
                                    src={nextEvent.imageUrl}
                                    alt="Event"
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    onError={(e) => (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x200?text=Project'}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-5 flex flex-col justify-end">
                                    <h4 className="text-white font-bold text-lg leading-tight">{nextEvent.title}</h4>
                                </div>
                            </div>
                            
                            <div className="flex-1">
                                <div className="flex items-center gap-3 text-sm font-semibold text-gray-800 mb-4 bg-pink-50 w-fit px-3 py-1.5 rounded-lg border border-pink-100">
                                    <Calendar size={16} className="text-pink-600" /> 
                                    {new Date(nextEvent.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </div>
                                <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 mb-6">
                                    {nextEvent.description}
                                </p>
                            </div>

                            <Link 
                                href="/admin/events" 
                                className="block w-full py-3.5 bg-gray-900 text-white text-center text-sm font-bold rounded-xl hover:bg-gray-800 transition-colors shadow-lg shadow-gray-900/10"
                            >
                                Manage Event
                            </Link>
                        </div>
                    ) : (
                        <div className="p-10 text-center text-gray-400 flex flex-col items-center justify-center h-full min-h-[300px]">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                <Calendar size={32} className="text-gray-300" />
                            </div>
                            <p className="font-medium text-gray-600 mb-1">No upcoming events</p>
                            <p className="text-sm text-gray-400 mb-6">Your schedule is clear for now.</p>
                            <Link href="/admin/events" className="px-6 py-2.5 bg-pink-600 text-white text-sm font-bold rounded-xl hover:bg-pink-700 transition shadow-lg shadow-pink-600/20">
                                Create New Event
                            </Link>
                        </div>
                    )}
                </motion.div>

            </div>
        </div>
    );
}