'use client';
import React from 'react';
import { images } from '../../assets/images';

export default function Navbar({ currentPage = 'home' }) {
    return (
        <nav className="absolute top-0 left-0 right-0 z-50 px-4 lg:px-8 py-5">
            <div className="flex items-center justify-between max-w-[1440px] mx-auto">
                <a href="/" className="w-40 lg:w-48 h-16">
                    <img src={images.imgRotaractLogo2} alt="Rotaract Logo" className="w-full h-full object-contain" />
                </a>

                <div className="hidden md:flex items-center gap-6 lg:gap-10">
                    <a
                        href="/"
                        className={`font-poppins font-medium text-sm ${currentPage === 'home' ? 'text-pink-600' : 'text-black hover:text-pink-600'}`}
                    >
                        Home
                    </a>
                    <a
                        href="/about"
                        className={`font-poppins font-medium text-sm ${currentPage === 'about' ? 'text-pink-600' : 'text-black hover:text-pink-600'}`}
                    >
                        About
                    </a>
                    <a
                        href="/projects"
                        className={`font-poppins font-medium text-sm ${currentPage === 'projects' ? 'text-pink-600' : 'text-black hover:text-pink-600'}`}
                    >
                        Projects
                    </a>
                    <a
                        href="/gallery"
                        className={`font-poppins font-medium text-sm ${currentPage === 'gallery' ? 'text-pink-600' : 'text-black hover:text-pink-600'}`}
                    >
                        Gallery
                    </a>
                    <a
                        href="/leadership"
                        className={`font-poppins font-medium text-sm ${currentPage === 'leadership' ? 'text-pink-600' : 'text-black hover:text-pink-600'}`}
                    >
                        Leadership
                    </a>
                    <a
                        href="/join"
                        className={`font-poppins font-medium text-sm ${currentPage === 'join' ? 'text-pink-600' : 'text-black hover:text-pink-600'}`}
                    >
                        Join Us
                    </a>
                    {currentPage === 'login' ? (
                        <button className="bg-white border-2 border-pink-600 text-pink-600 px-6 py-2.5 rounded-full font-poppins font-medium text-sm hover:bg-pink-600 hover:text-white transition-colors cursor-default">
                            Log in
                        </button>
                    ) : (
                        <a
                            href="/login"
                            className="bg-pink-600 text-white px-6 py-2.5 rounded-full font-poppins font-medium text-sm hover:bg-opacity-90"
                        >
                            Log in
                        </a>
                    )}
                </div>
            </div>
        </nav>
    );
}