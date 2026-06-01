'use client';

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { images } from '../../assets/images.js'; // Assuming you have a default image
import Footer from "../components/Footer.jsx";
import NavBar from "../components/Navbar.jsx";
import Link from 'next/link';
import { BookOpen, Calendar, ArrowRight } from 'lucide-react';
import MotionWrapper from '../components/MotionWrapper';

const getSpecialTag = (magazine) => {
    if (magazine.specialTag) return magazine.specialTag.trim();
    return magazine.title?.trim().toLowerCase().includes("fusion magazine") ? "Fusion Magazine" : "";
};

export default function MagazinePage() {
    const [magazines, setMagazines] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Assuming 'magazines' collection exists. If not, this will just return empty for now.
        const q = query(collection(db, "magazines"), orderBy("date", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMagazines(list);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching magazines:", error);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    return (
        <div className="bg-gray-100 min-h-screen flex flex-col">
            <NavBar currentPage="magazine" />

            {/* Hero Section */}
            <section className="px-4 pt-6 md:pt-10 mb-8">
                <MotionWrapper className="max-w-[1440px] mx-auto px-2 md:px-[54px]">
                    <div className="relative rounded-[43px] overflow-hidden h-[280px] md:h-[396px] shadow-xl">
                        {/* You might want a specific magazine hero image here */}
                        <img
                            src={images.imgRectangle44}
                            alt="Magazine Hero"
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-center px-6 md:px-12">
                            <h1 className="font-playfair font-medium text-3xl md:text-[52px] text-white mb-4 leading-tight">
                                Our <span className="text-pink-600">E-Magazine</span>
                            </h1>
                            <p className="font-poppins font-medium text-sm md:text-[16px] text-white/90 leading-relaxed max-w-[600px]">
                                Dive into the stories, achievements, and creative expressions of our Rotaract community.
                            </p>
                        </div>
                    </div>
                </MotionWrapper>
            </section>

            {/* Magazine Grid */}
            <section className="px-4 pb-16 flex-grow">
                <div className="max-w-[1440px] mx-auto px-2 md:px-[54px]">

                    {loading && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="bg-white rounded-[26px] shadow-lg overflow-hidden h-[450px] animate-pulse">
                                    <div className="h-[300px] bg-gray-200"></div>
                                    <div className="p-6 space-y-3">
                                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                                        <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                                        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!loading && magazines.length === 0 && (
                        <div className="text-center py-20 bg-white rounded-[30px] shadow-sm">
                            <BookOpen className="mx-auto text-gray-300 mb-4" size={64} />
                            <h3 className="font-playfair text-2xl text-gray-800 mb-2">No Magazines Found</h3>
                            <p className="font-poppins text-gray-500">Stay tuned! Our latest edition is coming soon.</p>
                        </div>
                    )}

                    {!loading && magazines.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {magazines.map((mag) => (
                                <MotionWrapper key={mag.id} className="bg-white rounded-[26px] shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
                                    {/* Cover Image */}
                                    <div className="relative h-[300px] bg-gray-200 overflow-hidden group">
                                        {getSpecialTag(mag) && (
                                            <div className="absolute top-4 left-4 z-10 bg-pink-600 text-white px-3 py-1.5 rounded-full text-xs font-poppins font-bold shadow-lg">
                                                {getSpecialTag(mag)}
                                            </div>
                                        )}
                                        <img
                                            src={mag.coverUrl || images.imgRectangle44}
                                            alt={mag.title}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />

                                        {/* Overlay with Read Button */}
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                            <Link
                                                href={`/magazine/${mag.id}`}
                                                className="bg-white text-pink-600 px-6 py-3 rounded-full font-poppins font-bold text-sm transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 flex items-center gap-2"
                                            >
                                                <BookOpen size={18} /> Read Now
                                            </Link>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-6 flex flex-col flex-grow">
                                        <div className="mb-4">
                                            <div className="flex items-center gap-2 text-pink-600 mb-2">
                                                <Calendar size={14} />
                                                <span className="font-poppins text-xs font-medium uppercase tracking-wide">
                                                    {mag.date ? new Date(mag.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Date N/A'}
                                                </span>
                                            </div>
                                            <h3 className="font-playfair font-bold text-2xl text-gray-900 leading-tight mb-3">
                                                {mag.title}
                                            </h3>
                                            <p className="font-poppins text-gray-600 text-sm line-clamp-3">
                                                {mag.description || "Click to read our latest edition."}
                                            </p>
                                        </div>

                                        <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
                                            <Link
                                                href={`/magazine/${mag.id}`}
                                                className="text-gray-900 font-poppins font-medium text-sm flex items-center gap-2 hover:text-pink-600 transition-colors"
                                            >
                                                Read Online <ArrowRight size={16} />
                                            </Link>
                                            {/* Optional Download Button if needed */}
                                            {/* <button className="text-gray-400 hover:text-pink-600 transition-colors">
                                                <Download size={20} />
                                            </button> */}
                                        </div>
                                    </div>
                                </MotionWrapper>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            <Footer />
        </div>
    );
}
