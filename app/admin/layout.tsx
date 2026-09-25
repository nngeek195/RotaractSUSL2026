"use client";

import React, { ReactNode, useState, useEffect } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Calendar,
  LogOut,
  Menu,
  X,
  FileText,
  Heart,
  Settings,
  ChevronRight,
  Shield,
  BookOpen,
  Megaphone 
} from "lucide-react";
import { auth } from "@/lib/firebase";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, isAdmin, isCommittee, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 1. Move the route protection redirect into a useEffect
  useEffect(() => {
    if (!loading && (!user || (!isAdmin && !isCommittee))) {
      router.push("/login");
    }
  }, [loading, user, isAdmin, isCommittee, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-pink-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium text-sm">Loading workspace...</p>
        </div>
      </div>
    );
  }

  // 2. Just return null here while the useEffect handles the redirect
  if (!user || (!isAdmin && !isCommittee)) {
    return null;
  }

  const handleLogout = async () => {
    await auth.signOut();
    router.push("/login");
  };

  const NavItem = ({ href, icon: Icon, label, exact = false }: { href: string; icon: any; label: string; exact?: boolean }) => {
    const active = exact ? pathname === href : pathname.startsWith(href);
    
    return (
      <li>
        <Link
          href={href}
          onClick={() => setIsSidebarOpen(false)}
          className={`group flex items-center justify-between p-3.5 rounded-xl transition-all duration-200 ${
            active
              ? "bg-pink-600/10 text-pink-600"
              : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          <div className="flex items-center gap-3.5">
            <Icon size={20} className={active ? "text-pink-600" : "text-gray-400 group-hover:text-gray-600"} />
            <span className={`font-medium text-sm ${active ? "font-semibold" : ""}`}>{label}</span>
          </div>
          {active && <ChevronRight size={16} className="text-pink-600 opacity-100" />}
        </Link>
      </li>
    );
  };

  const renderSidebarContent = () => (
    <>
      <div className="px-6 py-8 flex items-center gap-3 mb-2">
        <Link href={isAdmin ? "/admin" : "/admin/oc-calls"} className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-pink-600/20 text-white">
                <Shield size={20} />
            </div>
            <div>
                <h1 className="font-bold text-gray-900 text-lg leading-tight">Admin<span className="text-pink-600">Portal</span></h1>
                <p className="text-xs text-gray-400 font-medium">{isAdmin ? "Rotaract Club SUSL" : "OC Management"}</p>
            </div>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {/* Main Menu */}
        <div className="mb-6">
            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Overview</p>
            <ul className="space-y-1">
            {isAdmin && (
                <NavItem href="/admin" icon={LayoutDashboard} label="Dashboard" exact />
            )}
            <NavItem href="/admin/relief" icon={Heart} label="Flood Relief" />
            </ul>
        </div>

        {/* Management (Updated permissions to let Committee manage OC Calls) */}
        {(isAdmin || isCommittee) && (
            <div className="mb-6">
            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Management</p>
            <ul className="space-y-1">
                {isAdmin && <NavItem href="/admin/users" icon={Users} label="Members & Users" />}
                {isAdmin && <NavItem href="/admin/events" icon={Calendar} label="Events & Projects" />}
                
                <NavItem href="/admin/oc-calls" icon={Megaphone} label="OC Calls" />
                
                {isAdmin && <NavItem href="/admin/magazines" icon={BookOpen} label="Magazines" />}
                {isAdmin && <NavItem href="/admin/project-details" icon={FileText} label="Project Reports" />}
            </ul>
            </div>
        )}

        {/* Rewards & Settings */}
        {isAdmin && (
            <div>
            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Configuration</p>
            <ul className="space-y-1">
                <NavItem href="/admin/leaderboard" icon={Users} label="Leaderboard" />
                <NavItem href="/admin/monthly-stars" icon={Calendar} label="Monthly Stars" />
                <NavItem href="/admin/settings" icon={Settings} label="System Settings" />
            </ul>
            </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 p-3.5 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200 group"
        >
          <LogOut size={20} className="group-hover:text-red-600 transition-colors" />
          <span className="font-medium text-sm">Sign Out</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full z-30 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
         <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-pink-600 rounded-lg flex items-center justify-center text-white">
                <Shield size={16} />
            </div>
            <span className="font-bold text-gray-900">Admin</span>
         </div>
         <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
         >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
         </button>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <nav
        className={`fixed md:sticky top-0 h-screen w-[280px] bg-white border-r border-gray-100 flex flex-col z-50 transition-transform duration-300 ease-out shadow-[4px_0_24px_rgba(0,0,0,0.02)] ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {renderSidebarContent()}
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 md:pt-0 pt-16">
         <div className="p-4 md:p-8 lg:p-10 max-w-[1600px] mx-auto transition-all duration-300">
            {children}
         </div>
      </main>
    </div>
  );
}