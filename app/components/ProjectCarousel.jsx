'use client';

import React from 'react';
import { images } from '../../assets/images';

export function ProjectCarousel({ projects = [] }) {
    const defaultProjects = [
        {
            image: images.imgRectangle20,
            title: "Project Name",
            description: "Project details as a small para",
            hasOverlay: false
        },
        {
            image: images.imgRectangle18,
            title: "Project Name",
            description: "Project details as a small para",
            hasOverlay: true
        },
        {
            image: images.imgRectangle16,
            title: "Project Name",
            description: "Project details as a small para",
            hasOverlay: true
        },
        {
            image: images.imgRectangle17,
            title: "Project Name",
            description: "Project details as a small para",
            hasOverlay: true
        },
        {
            image: images.imgRectangle19,
            title: "Project Name",
            description: "Project details as a small para",
            hasOverlay: false
        }
    ];

    // Use passed projects if available, otherwise use defaults
    const baseProjects = projects.length > 0 ? projects : defaultProjects;
    
    // Duplicate the list to ensure seamless looping
    const displayProjects = [...baseProjects, ...baseProjects];

    return (
        <div className="relative w-full overflow-hidden py-8">
            {/* CSS Animation Styles */}
            <style>{`
                @keyframes scroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-scroll {
                    animation: scroll 40s linear infinite;
                }
                .animate-scroll:hover {
                    animation-play-state: paused;
                }
            `}</style>

            {/* Animated Container */}
            <div className="flex gap-8 w-max animate-scroll hover:cursor-grab active:cursor-grabbing">
                {displayProjects.map((project, index) => {
                    // Logic: If hasOverlay is undefined (like from Firebase), default to TRUE for readability
                    const shouldShowOverlay = project.hasOverlay !== undefined ? project.hasOverlay : true;

                    return (
                        <div
                            key={`${project.id || index}-${index}`} // Unique key for duplicates
                            className="relative flex-none w-[300px] h-[448px] rounded-[41px] shadow-[0px_0px_9px_3px_rgba(0,0,0,0.25)] overflow-hidden transition-transform hover:scale-105 group"
                        >
                            {/* Project Image */}
                            <div className="absolute inset-0">
                                <img
                                    src={project.image || images.imgRectangle20} // Fallback if image is missing
                                    alt={project.title}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                            </div>

                            {/* Overlay - Gradient for better text readability */}
                            {shouldShowOverlay && (
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                            )}

                            {/* Project Info */}
                            <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
                                <h3 className="font-playfair font-medium text-[17px] text-white mb-2 leading-normal drop-shadow-md">
                                    {project.title}
                                </h3>
                                <p className="font-poppins text-[11px] text-gray-200 leading-normal line-clamp-3">
                                    {project.description}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default ProjectCarousel;