"use client";

import React, { ReactNode } from 'react'; // Import ReactNode for children type
import { useAuth } from "@/app/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Users, Clock, Calendar, LogOut, Mail } from "lucide-react";
import { auth } from "@/lib/firebase";

// Define the type for props
interface AdminLayoutProps {
    children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const { user, isAdmin, loading } = useAuth();
    const router = useRouter();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p>Loading session...</p>
            </div>
        );
    }

    // This is our route protection
    if (!user || !isAdmin) {
        // We use useEffect to avoid server-side render issues with router
        if (typeof window !== "undefined") {
            router.push("/login");
        }
        return null; // Return null while redirecting
    }

    const handleLogout = async () => {
        await auth.signOut();
        router.push("/login");
    };

    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* Sidebar */}
            <nav className="w-64 bg-gray-900 text-white p-5 flex flex-col fixed h-full z-10">
                <div className="text-2xl font-bold mb-10 text-center border-b border-gray-800 pb-4">
                    <span className="text-blue-400">Admin</span>Panel
                </div>
                <ul className="space-y-2 flex-1">
                    <li>
                        <Link href="/admin" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 hover:text-pink-400 transition">
                            <LayoutDashboard size={20} /> Dashboard
                        </Link>
                    </li>
                    <li>
                        <Link href="/admin/requests" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 hover:text-pink-400 transition">
                            <Clock size={20} /> Pending Requests
                        </Link>
                    </li>
                    <li>
                        <Link href="/admin/users" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 hover:text-pink-400 transition">
                            <Users size={20} /> User Handling
                        </Link>
                    </li>
                    <li>
                        <Link href="/admin/events" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 hover:text-pink-400 transition">
                            <Calendar size={20} /> Event Handling
                        </Link>
                    </li>
                </ul>
                <button
                    onClick={handleLogout}
                    className="mt-auto flex items-center gap-3 text-red-400 hover:text-red-300 p-3 hover:bg-gray-800 rounded-lg transition"
                >
                    <LogOut size={20} /> Logout
                </button>
            </nav>

            {/* Main Content */}
            <main className="flex-1 p-10 ml-64">{children}</main>
        </div>
    );
}