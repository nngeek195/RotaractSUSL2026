'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { images } from '../../assets/images';

export function ProjectCarousel({ projects = [] }) {
    const scrollerRef = useRef(null);
    const [isHovered, setIsHovered] = useState(false);

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

    const getScrollStep = useCallback(() => {
        if (!scrollerRef.current) return 332; // Fallback width + gap
        const firstCard = scrollerRef.current.querySelector('[data-project-card="true"]');
        if (!firstCard) return 332;
        const firstCardWidth = firstCard.getBoundingClientRect().width;
        const styles = window.getComputedStyle(scrollerRef.current);
        const gap = parseFloat(styles.columnGap || styles.gap || '32') || 32;
        return firstCardWidth + gap;
    }, []);

    const scrollProjects = useCallback((direction = 'next') => {
        if (!scrollerRef.current) return;

        const step = getScrollStep();
        const { scrollLeft, scrollWidth, clientWidth } = scrollerRef.current;
        const maxScrollLeft = Math.max(0, scrollWidth - clientWidth);

        if (direction === 'next') {
            if (scrollLeft + step >= maxScrollLeft - 2) {
                scrollerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                scrollerRef.current.scrollBy({ left: step, behavior: 'smooth' });
            }
        } else {
            if (scrollLeft - step <= 0) {
                scrollerRef.current.scrollTo({ left: maxScrollLeft, behavior: 'smooth' });
            } else {
                scrollerRef.current.scrollBy({ left: -step, behavior: 'smooth' });
            }
        }
    }, [getScrollStep]);

    useEffect(() => {
        if (baseProjects.length <= 1 || isHovered) return;
        const timer = setInterval(() => {
            scrollProjects('next');
        }, 3500);

        return () => clearInterval(timer);
    }, [baseProjects.length, isHovered, scrollProjects]);

    return (
        <div className="relative w-full overflow-hidden py-8">
            {/* Local utility styles */}
            <style>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>

            {/* Manual Controls */}
            <button
                type="button"
                onClick={() => scrollProjects('prev')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white text-gray-800 rounded-full w-10 h-10 shadow-md border border-gray-200 flex items-center justify-center"
                aria-label="Previous projects"
            >
                &#8249;
            </button>
            <button
                type="button"
                onClick={() => scrollProjects('next')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white text-gray-800 rounded-full w-10 h-10 shadow-md border border-gray-200 flex items-center justify-center"
                aria-label="Next projects"
            >
                &#8250;
            </button>

            {/* Auto + Manual Scroll Container */}
            <div
                ref={scrollerRef}
                className="no-scrollbar flex gap-8 overflow-x-auto scroll-smooth px-12"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {baseProjects.map((project, index) => {
                    // Logic: If hasOverlay is undefined (like from Firebase), default to TRUE for readability
                    const shouldShowOverlay = project.hasOverlay !== undefined ? project.hasOverlay : true;

                    return (
                        <div
                            key={project.id || index}
                            data-project-card="true"
                            className="relative flex-none w-[85%] sm:w-[48%] lg:w-[calc((100%-4rem)/3)] h-[448px] rounded-[41px] shadow-[0px_0px_9px_3px_rgba(0,0,0,0.25)] overflow-hidden transition-transform hover:scale-105 group"
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
