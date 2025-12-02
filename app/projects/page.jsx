'use client';

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query } from "firebase/firestore";
import { images } from '../../assets/images.js';
import Footer from "../components/Footer.jsx";
import NavBar from "../components/Navbar.jsx";
// Installing icons: npm install lucide-react
import { Calendar, MapPin, Clock, CheckCircle, Loader2, CircleDashed } from 'lucide-react';

export default function ProjectsPage() {
    const router = useRouter();
    // --- 1. Logic: State & Data Fetching ---
    const [allProjects, setAllProjects] = useState([]);
    const [view, setView] = useState('upcoming'); // 'upcoming' or 'completed'
    const [loading, setLoading] = useState(true);

    // Helper function to create URL-friendly slug
    const createSlug = (project) => {
        const name = project.title || project.name || 'project';
        const slug = name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric with hyphens
            .replace(/^-+|-+$/g, '');      // Remove leading/trailing hyphens
        return `${slug}-${project.id}`;
    };

    useEffect(() => {
        setLoading(true);
        const q = query(collection(db, "events"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setAllProjects(list);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // --- 2. Logic: Filtering & Sorting ---
    const filteredProjects = useMemo(() => {
        return allProjects
            .filter(project => {
                const status = project.status?.toLowerCase() || '';
                // If view is upcoming, looking for 'upcoming'
                // If view is completed, looking for 'happened', 'completed', or 'past'
                if (view === 'upcoming') return status === 'upcoming';
                return status === 'happened' || status === 'completed' || status === 'past';
            })
            .sort((a, b) => {
                const dateA = new Date(a.date).getTime();
                const dateB = new Date(b.date).getTime();
                // Upcoming: Soonest first | Completed: Newest first
                return view === 'upcoming' ? dateA - dateB : dateB - dateA;
            });
    }, [allProjects, view]);

    // --- 3. Logic: Column Splitting for your Layout ---
    const leftColumnProjects = filteredProjects.filter((_, index) => index % 2 === 0);
    const rightColumnProjects = filteredProjects.filter((_, index) => index % 2 !== 0);

    return (
        <><div className="bg-gray-100">
            <NavBar currentPage="projects" />
            <br /><br />

            {/* Hero banner - Preserved your Exact CSS */}
            <section className="px-4 pt-6 md:pt-10 bg-gray-100" >
                <div className="max-w-[1440px] mx-auto px-2 md:px-[54px]">
                    <div className="relative rounded-[43px] overflow-hidden h-[280px] md:h-[396px]">
                        <img src={images.imgRectangle44} alt="Hero projects" className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-center px-6 md:px-12">
                            <h1 className="font-playfair font-medium text-3xl md:text-[47px] text-white mb-3 md:mb-4 leading-tight">
                                {view === 'upcoming' ? 'Upcoming ' : 'Transforming '}
                                <span className="text-pink-600">
                                    {view === 'upcoming' ? 'Initiatives' : 'Vision into Action'}
                                </span>
                            </h1>
                            <p className="font-poppins font-medium text-sm md:text-[16px] text-white leading-normal md:leading-relaxed max-w-[681px]">
                                {view === 'upcoming'
                                    ? "Explore the projects we have planned. Join us in making a difference in the Sabaragamuwa region."
                                    : "Our projects are the living proof of our commitment to Service Above Self. Dive in to witness the dedication behind every success story."
                                }
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Logic: View Toggle Buttons (Added to fit your style) */}
            <section className="px-4 pt-8 bg-gray-100">
                <div className="max-w-[1440px] mx-auto px-2 md:px-[54px] flex justify-center gap-4">
                    <button
                        onClick={() => setView('upcoming')}
                        className={`flex items-center gap-2 px-6 py-2 rounded-[26px] font-poppins font-medium transition-all
                            ${view === 'upcoming'
                                ? 'bg-pink-600 text-white shadow-lg'
                                : 'bg-white text-[#707070] border border-[#E0E0E0] hover:bg-gray-50'}`}
                    >
                        <Clock size={18} /> Upcoming
                    </button>
                    <button
                        onClick={() => setView('completed')}
                        className={`flex items-center gap-2 px-6 py-2 rounded-[26px] font-poppins font-medium transition-all
                            ${view === 'completed'
                                ? 'bg-pink-600 text-white shadow-lg'
                                : 'bg-white text-[#707070] border border-[#E0E0E0] hover:bg-gray-50'}`}
                    >
                        <CheckCircle size={18} /> Completed
                    </button>
                </div>
            </section>

            {/* Project Cards - Two Column Grid (Your Exact CSS) */}
            <section className="px-4 py-8 md:py-12 bg-gray-100">
                <div className="max-w-[1440px] mx-auto px-2 md:px-[54px]">

                    {/* Loading State */}
                    {loading && (
                        <div className="flex justify-center py-20">
                            <Loader2 className="animate-spin text-pink-600" size={40} />
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && filteredProjects.length === 0 && (
                        <div className="text-center py-20 text-[#707070]">
                            <p className="font-playfair text-xl">No {view} projects found.</p>
                        </div>
                    )}

                    {!loading && filteredProjects.length > 0 && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">

                            {/* Left Column - Image on Left */}
                            <div className="space-y-6 md:space-y-8">
                                {leftColumnProjects.map((project) => (
                                    <div key={project.id} className="bg-white rounded-[22px] shadow-[0_0_26px_2px_rgba(0,0,0,0.25)] overflow-hidden flex flex-col sm:flex-row h-auto sm:h-[254px]">
                                        {/* Image */}
                                        <div className="w-full sm:w-[254px] h-[254px] flex-shrink-0 bg-[#d9d9d9] rounded-tl-[22px] rounded-bl-none sm:rounded-bl-[22px]">
                                            <img src={project.imageUrl || images.imgRectangle44} alt={project.name} className="w-full h-full object-cover rounded-tl-[22px] rounded-bl-none sm:rounded-bl-[22px]" />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 p-5 md:p-6 flex flex-col justify-between">
                                            <div>
                                                <h2 className="font-playfair font-medium text-xl md:text-[28px] text-black mb-3 md:mb-4 line-clamp-2">
                                                    {project.title || project.name}
                                                </h2>

                                                {/* Location & Date */}
                                                <div className="space-y-1 mb-3 md:mb-4">
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="w-[16px] h-[16px] text-pink-600" />
                                                        <p className="font-poppins text-[13px] text-pink-600">{project.location}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-[16px] h-[16px] text-pink-600" />
                                                        <p className="font-poppins text-[13px] text-pink-600">{project.date}</p>
                                                    </div>

                                                    {/* Description / Status */}
                                                    <div className="flex items-center gap-2">
                                                        <CircleDashed className="w-[13px] h-[13px] text-[#707070]" />
                                                        <p className="font-poppins text-[13px] text-[#707070] uppercase">
                                                            {project.status}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Button */}
                                            <div>
                                                <button
                                                    onClick={() => router.push(`/projects/${createSlug(project)}`)}
                                                    className="bg-pink-600 text-white px-5 py-2 rounded-[26px] font-poppins font-medium text-sm hover:bg-[#b51b52] transition"
                                                >
                                                    See More
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Right Column - Image on Right (Your exact CSS for reverse layout) */}
                            <div className="space-y-6 md:space-y-8">
                                {rightColumnProjects.map((project) => (
                                    <div key={project.id} className="bg-white rounded-[22px] shadow-[0_0_26px_2px_rgba(0,0,0,0.25)] overflow-hidden flex flex-col sm:flex-row-reverse h-auto sm:h-[254px]">
                                        {/* Image */}
                                        <div className="w-full sm:w-[254px] h-[254px] flex-shrink-0 bg-[#d9d9d9] rounded-tl-[22px] rounded-bl-none sm:rounded-bl-[22px] sm:rounded-tl-none sm:rounded-tr-[22px]">
                                            <img src={project.imageUrl || images.imgRectangle44} alt={project.name} className="w-full h-full object-cover rounded-tl-[22px] rounded-bl-none sm:rounded-bl-[22px] sm:rounded-tl-none sm:rounded-tr-[22px]" />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 p-5 md:p-6 flex flex-col justify-between">
                                            <div>
                                                <h2 className="font-playfair font-medium text-xl md:text-[28px] text-black mb-3 md:mb-4 line-clamp-2">
                                                    {project.title || project.name}
                                                </h2>

                                                {/* Location & Date */}
                                                <div className="space-y-1 mb-3 md:mb-4">
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="w-[16px] h-[16px] text-pink-600" />
                                                        <p className="font-poppins text-[13px] text-pink-600">{project.location}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-[16px] h-[16px] text-pink-600" />
                                                        <p className="font-poppins text-[13px] text-pink-600">{project.date}</p>
                                                    </div>

                                                    {/* Description / Status */}
                                                    <div className="flex items-center gap-2">
                                                        <CircleDashed className="w-[13px] h-[13px] text-[#707070]" />
                                                        <p className="font-poppins text-[13px] text-[#707070] uppercase">
                                                            {project.status}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Button */}
                                            <div>
                                                <button
                                                    onClick={() => router.push(`/projects/${createSlug(project)}`)}
                                                    className="bg-pink-600 text-white px-5 py-2 rounded-[26px] font-poppins font-medium text-sm hover:bg-[#b51b52] transition"
                                                >
                                                    See More
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </div>
            <Footer />
        </>
    );
}