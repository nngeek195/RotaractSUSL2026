'use client';

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { images } from '../../../assets/images.js';
import Footer from "../../components/Footer.jsx";
import NavBar from "../../components/Navbar.jsx";
import { ArrowLeft, MapPin, Calendar, Share2 } from 'lucide-react';

export default function ProjectDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProject = async () => {
            try {
                // Try to extract ID from the URL param (format: "project-name-id" or just "id")
                const urlParam = params.id;
                let projectId = urlParam;

                // If the URL contains a hyphen, extract the last segment as the ID
                if (urlParam.includes('-')) {
                    const segments = urlParam.split('-');
                    projectId = segments[segments.length - 1];
                }

                const docRef = doc(db, "events", projectId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setProject({ id: docSnap.id, ...docSnap.data() });
                } else {
                    console.log("No such document!");
                }
            } catch (error) {
                console.error("Error fetching project:", error);
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchProject();
        }
    }, [params.id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-pink-600 mx-auto mb-4"></div>
                    <p className="font-poppins text-gray-600">Loading project...</p>
                </div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <h1 className="font-playfair text-4xl font-medium text-gray-800 mb-4">Project Not Found</h1>
                    <button
                        onClick={() => router.push('/projects')}
                        className="text-pink-600 font-poppins hover:underline"
                    >
                        Back to Projects
                    </button>
                </div>
            </div>
        );
    }

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: project.name || 'Project',
                    text: project.description || 'Check out this project!',
                    url: window.location.href,
                });
            } catch (err) {
                console.log('Error sharing:', err);
            }
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(window.location.href);
            alert('Link copied to clipboard!');
        }
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'TBA';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).replace(/\//g, '. ');
    };

    // Determine status badge
    const getStatusBadge = () => {
        const status = project.status?.toLowerCase() || '';
        if (status === 'upcoming') {
            return <span className="bg-blue-500 text-white px-4 py-1.5 rounded-full font-poppins font-medium text-xs">Upcoming</span>;
        } else if (status === 'happened' || status === 'completed' || status === 'past') {
            return <span className="bg-[#cd215e] text-white px-4 py-1.5 rounded-full font-poppins font-medium text-xs">Completed</span>;
        }
        return <span className="bg-gray-500 text-white px-4 py-1.5 rounded-full font-poppins font-medium text-xs">{status}</span>;
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Navbar */}
            <NavBar currentPage="projects" />

            {/* Back to Projects Button */}
            <div className="pt-8 px-4 lg:px-8 max-w-7xl mx-auto">
                <button
                    onClick={() => router.push('/projects')}
                    className="flex items-center gap-2 text-[#cd215e] font-poppins font-medium text-sm hover:opacity-80 transition-opacity mb-6"
                >
                    <ArrowLeft size={20} />
                    <span>Back to Projects</span>
                </button>
            </div>

            {/* Hero Image */}
            <div className="px-4 lg:px-8 max-w-7xl mx-auto mb-12">
                <div className="relative h-[500px] rounded-[43px] overflow-hidden">
                    <img
                        src={project.imageUrl || project.image || images.imgRectangle20}
                        alt={project.title || project.name || 'Project'}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                </div>
            </div>

            {/* Main Content */}
            <div className="px-4 lg:px-8 max-w-7xl mx-auto pb-16">
                <div className="flex flex-col lg:flex-row gap-12">
                    {/* Left Column - Main Content */}
                    <div className="flex-1">
                        {/* Project Title */}
                        <h1 className="font-playfair font-medium text-5xl text-black mb-6">
                            {project.title || project.name || 'Project Name'}
                        </h1>

                        {/* Location and Date */}
                        <div className="flex flex-wrap gap-6 mb-8">
                            <div className="flex items-center gap-2">
                                <MapPin size={20} className="text-[#cd215e]" />
                                <p className="font-poppins text-[#cd215e] text-[15px]">
                                    {project.location || 'Sabaragamuwa, Sri Lanka'}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar size={20} className="text-[#cd215e]" />
                                <p className="font-poppins text-[#cd215e] text-[15px]">
                                    {formatDate(project.date)}
                                </p>
                            </div>
                        </div>

                        {/* About the Project */}
                        <div className="mb-16">
                            <h2 className="font-playfair font-medium text-[32px] text-black mb-4">
                                About the Project
                            </h2>
                            <div className="space-y-4">
                                <p className="font-poppins text-[#707070] text-base leading-[26px]">
                                    {project.description || 'This transformative initiative represents our commitment to Service Above Self, bringing together passionate Rotaractors to address critical needs in the Sabaragamuwa region. Through careful planning and dedicated execution, we\'ve created a sustainable impact that will benefit the community for years to come.'}
                                </p>
                                {project.longDescription && (
                                    <p className="font-poppins text-[#707070] text-base leading-[26px]">
                                        {project.longDescription}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* What People Say */}
                        {project.testimonials && project.testimonials.length > 0 && (
                            <div className="mb-16">
                                <h2 className="font-playfair font-medium text-[36px] text-black mb-8">
                                    What People Say
                                </h2>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {project.testimonials.map((testimonial, index) => (
                                        <div
                                            key={index}
                                            className="bg-white rounded-[22px] shadow-lg p-8"
                                        >
                                            <p className="font-poppins text-[#707070] text-[15px] leading-[22.5px] mb-4">
                                                "{testimonial.quote}"
                                            </p>
                                            <p className="font-poppins font-medium text-sm text-black">
                                                - {testimonial.author}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Project Details Card */}
                    <div className="lg:w-[330px]">
                        <div className="bg-[#f9f9f9] rounded-[22px] p-8 sticky top-24">
                            <h3 className="font-playfair font-medium text-2xl text-black mb-6">
                                Project Details
                            </h3>

                            <div className="space-y-8 mb-6">
                                {/* Category */}
                                <div>
                                    <p className="font-poppins font-medium text-sm text-black mb-1">
                                        Category
                                    </p>
                                    <p className="font-poppins text-sm text-[#707070]">
                                        {project.category || 'Community Development'}
                                    </p>
                                </div>

                                {/* Status */}
                                <div>
                                    <p className="font-poppins font-medium text-sm text-black mb-2">
                                        Status
                                    </p>
                                    {getStatusBadge()}
                                </div>

                                {/* Partners */}
                                {project.partners && project.partners.length > 0 && (
                                    <div>
                                        <p className="font-poppins font-medium text-sm text-black mb-1">
                                            Partners
                                        </p>
                                        {project.partners.map((partner, index) => (
                                            <p key={index} className="font-poppins text-sm text-[#707070]">
                                                {partner}
                                            </p>
                                        ))}
                                    </div>
                                )}

                                {/* Budget */}
                                {project.budget && (
                                    <div>
                                        <p className="font-poppins font-medium text-sm text-black mb-1">
                                            Budget
                                        </p>
                                        <p className="font-poppins text-sm text-[#707070]">
                                            {project.budget}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Share Button */}
                            <button
                                onClick={handleShare}
                                className="w-full bg-[#cd215e] text-white font-poppins font-medium text-sm py-3 rounded-[26px] hover:bg-opacity-90 transition-opacity flex items-center justify-center gap-2"
                            >
                                <Share2 size={18} />
                                Share Project
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Project Gallery - Full Width */}
            {project.galleryImages && project.galleryImages.length > 0 && (
                <div className="px-4 lg:px-8 max-w-7xl mx-auto pb-16">
                    <h2 className="font-playfair font-medium text-[36px] text-black mb-8">
                        Project Gallery
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {project.galleryImages.map((image, index) => (
                            <div
                                key={index}
                                className="h-[300px] rounded-[22px] overflow-hidden"
                            >
                                <img
                                    src={image}
                                    alt={`Gallery ${index + 1}`}
                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Footer */}
            <Footer />
        </div>
    );
}
