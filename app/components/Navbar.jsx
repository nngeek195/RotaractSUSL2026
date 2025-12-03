'use client';
import React, { useState } from 'react';
import { images } from '../../assets/images';
// Make sure you have lucide-react installed (npm install lucide-react)
import { Menu, X, LogIn, User, LogOut, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../../lib/firebase';
import { useRouter } from 'next/navigation';

export default function Navbar({ currentPage = 'home' }) {
    // State to toggle the mobile sidebar
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { user, loading, isApproved, isCommittee, isAdmin } = useAuth();
    const isVerified = !!(user && user.emailVerified);
    const canShowAccount = isVerified && (isApproved || isCommittee || isAdmin);
    const router = useRouter();

    // Helper to close menu when clicking a link
    const closeMenu = () => setIsMobileMenuOpen(false);

    const handleLogout = async () => {
        try {
            await auth.signOut();
            router.push('/login');
            closeMenu();
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    return (
        <>
            <nav className="relative z-50 w-full bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-sm px-4 lg:px-8 py-4">
                <div className="flex items-center justify-between max-w-[1440px] mx-auto">

                    {/* Logo */}
                    <a href="/" className="w-32 md:w-40 lg:w-48 h-12 md:h-16 relative z-50">
                        <img src={images.imgRotaractLogo2} alt="Rotaract Logo" className="w-full h-full object-contain" />
                    </a>

                    {/* --- DESKTOP MENU (Hidden on Mobile) --- */}
                    <div className="hidden md:flex items-center gap-6 lg:gap-10">
                        <NavLink href="/" label="Home" active={currentPage === 'home'} />
                        <NavLink href="/about" label="About" active={currentPage === 'about'} />
                        <NavLink href="/projects" label="Projects" active={currentPage === 'projects'} />
                        <NavLink href="/relief-requests" label="🇱🇰 Relief" active={currentPage === 'relief'} />
                        <NavLink href="/gallery" label="Gallery" active={currentPage === 'gallery'} />
                        <NavLink href="/leadership" label="Leadership" active={currentPage === 'leadership'} />

                        {!user && !loading && (
                            <NavLink href="/join" label="Join Us" active={currentPage === 'join'} />
                        )}

                        {loading ? (
                            <div className="w-24 h-10 flex items-center justify-center">
                                <Loader2 className="animate-spin text-pink-600" size={20} />
                            </div>
                        ) : canShowAccount ? (
                            <div className="flex items-center gap-4">
                                <a
                                    href="/profile"
                                    className={`flex items-center gap-2 font-poppins font-medium text-sm transition-colors ${currentPage === 'profile' ? 'text-pink-600' : 'text-black hover:text-pink-600'}`}
                                >
                                    <User size={18} />
                                    Profile
                                </a>
                                <button
                                    onClick={handleLogout}
                                    className="bg-white border-2 border-gray-200 text-gray-600 px-5 py-2 rounded-full font-poppins font-medium text-sm hover:border-pink-600 hover:text-pink-600 transition-all flex items-center gap-2"
                                >
                                    <LogOut size={16} />
                                    Logout
                                </button>
                            </div>
                        ) : (
                            currentPage === 'login' ? (
                                <button className="bg-white border-2 border-pink-600 text-pink-600 px-6 py-2.5 rounded-full font-poppins font-medium text-sm hover:bg-pink-600 hover:text-white transition-colors cursor-default">
                                    Log in
                                </button>
                            ) : (
                                <a
                                    href="/login"
                                    className="bg-pink-600 text-white px-6 py-2.5 rounded-full font-poppins font-medium text-sm hover:bg-opacity-90 shadow-md transition-transform hover:scale-105"
                                >
                                    Log in
                                </a>
                            )
                        )}
                    </div>

                    {/* --- MOBILE HAMBURGER BUTTON (Visible only on Mobile) --- */}
                    <button
                        className="md:hidden text-black p-2 focus:outline-none z-50"
                        onClick={() => setIsMobileMenuOpen(true)}
                    >
                        <Menu size={28} />
                    </button>
                </div>
            </nav>

            {/* --- MOBILE SIDEBAR OVERLAY & MENU --- */}

            {/* Dark Backdrop (Background Overlay) */}
            <div
                className={`fixed inset-0 bg-black/50 z-[60] transition-opacity duration-300 md:hidden ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={closeMenu} // Close when clicking outside
            />

            {/* Sidebar Container */}
            <div
                className={`fixed top-0 right-0 h-full w-[280px] bg-white z-[70] shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                {/* Sidebar Header (Logo & Close Btn) */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <img src={images.imgRotaractLogo2} alt="Logo" className="w-24 object-contain" />
                    <button onClick={closeMenu} className="text-gray-500 hover:text-pink-600 transition">
                        <X size={28} />
                    </button>
                </div>

                {/* Sidebar Links */}
                <div className="flex flex-col p-6 gap-4 overflow-y-auto">
                    <MobileNavLink href="/" label="Home" active={currentPage === 'home'} onClick={closeMenu} />
                    <MobileNavLink href="/about" label="About" active={currentPage === 'about'} onClick={closeMenu} />
                    <MobileNavLink href="/projects" label="Projects" active={currentPage === 'projects'} onClick={closeMenu} />
                    <MobileNavLink href="/relief-requests" label="🇱🇰 Relief" active={currentPage === 'relief-requests'} onClick={closeMenu} />
                    <MobileNavLink href="/gallery" label="Gallery" active={currentPage === 'gallery'} onClick={closeMenu} />
                    <MobileNavLink href="/leadership" label="Leadership" active={currentPage === 'leadership'} onClick={closeMenu} />

                    {!user && !loading && (
                        <MobileNavLink href="/join" label="Join Us" active={currentPage === 'join'} onClick={closeMenu} />
                    )}

                    {canShowAccount && (
                        <MobileNavLink href="/profile" label="My Profile" active={currentPage === 'profile'} onClick={closeMenu} />
                    )}

                    <div className="mt-4 border-t pt-6">
                        {loading ? (
                            <div className="w-full flex justify-center py-3">
                                <Loader2 className="animate-spin text-pink-600" size={24} />
                            </div>
                        ) : canShowAccount ? (
                            <button
                                onClick={handleLogout}
                                className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-poppins font-bold text-sm hover:bg-gray-200 transition flex items-center justify-center gap-2"
                            >
                                <LogOut size={18} /> Logout
                            </button>
                        ) : (
                            currentPage === 'login' ? (
                                <button className="w-full bg-pink-50 text-pink-600 border border-pink-200 px-6 py-3 rounded-xl font-poppins font-bold text-sm flex items-center justify-center gap-2">
                                    <LogIn size={18} /> Currently Logged In
                                </button>
                            ) : (
                                <a
                                    href="/login"
                                    onClick={closeMenu}
                                    className="w-full bg-pink-600 text-white px-6 py-3 rounded-xl font-poppins font-bold text-sm hover:bg-pink-700 transition shadow-md flex items-center justify-center gap-2"
                                >
                                    <LogIn size={18} /> Log in
                                </a>
                            )
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

// --- HELPER COMPONENTS FOR CLEANER CODE ---

// Desktop Link Component
const NavLink = ({ href, label, active }) => (
    <a
        href={href}
        className={`font-poppins font-medium text-sm transition-colors duration-200 ${active ? 'text-pink-600' : 'text-black hover:text-pink-600'
            }`}
    >
        {label}
    </a>
);

// Mobile Link Component
const MobileNavLink = ({ href, label, active, onClick }) => (
    <a
        href={href}
        onClick={onClick}
        className={`font-poppins text-lg font-medium py-2 border-b border-gray-50 transition-colors ${active ? 'text-pink-600 pl-2 border-l-4 border-l-pink-600' : 'text-gray-700 hover:text-pink-600 hover:pl-2'
            }`}
    >
        {label}
    </a>
);