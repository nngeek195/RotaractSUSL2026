'use client';
import React from 'react';
import { images } from '../../assets/images';

export function GalleryGrid({ images: galleryImages }) {

    return (
        <div className="grid grid-cols-3 gap-2">
            <img src={images.project1} alt="" className="w-full h-24 object-cover" />
            <img src={images.project1} alt="" className="w-full h-24 object-cover" />
            <img src={images.project1} alt="" className="w-full h-24 object-cover" />
        </div>
    );
    // Default gallery images if none provided
    const defaultImages = [
        "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=500&fit=crop",
        "https://images.unsplash.com/photo-1525026198548-4baa812f1183?w=400&h=500&fit=crop",
        "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=400&h=600&fit=crop",
    ];

    const images = galleryImages || defaultImages;

    return (
        <div className="relative w-full max-w-[1285px] h-[824px] mx-auto">
            {/* Image 1 - Top left large */}
            <div className="absolute bottom-[72.45%] left-0 right-[65.21%] top-0">
                <div className="absolute inset-0 rounded-bl-[35px] rounded-tl-[35px] rounded-tr-[35px] overflow-hidden">
                    <div className="absolute bg-[#3a3a3a] inset-0" />
                    <img
                        alt="Gallery 1"
                        className="absolute w-full h-full object-cover"
                        src={images[0]}
                    />
                </div>
            </div>

            {/* Image 2 - Middle left */}
            <div className="absolute bottom-[29.85%] left-0 right-[75.8%] top-[29.13%]">
                <div className="absolute inset-0 rounded-bl-[35px] rounded-tl-[35px] rounded-tr-[35px] overflow-hidden">
                    <div className="absolute bg-[#3a3a3a] inset-0" />
                    <img
                        alt="Gallery 2"
                        className="absolute w-full h-full object-cover"
                        src={images[1]}
                    />
                </div>
            </div>

            {/* Image 3 - Bottom middle-right */}
            <div className="absolute inset-[53.03%_23.58%_0.36%_40.39%]">
                <div className="absolute inset-0 rounded-bl-[35px] rounded-tl-[35px] rounded-tr-[35px] overflow-hidden">
                    <div className="absolute bg-[#3a3a3a] inset-0" />
                    <img
                        alt="Gallery 3"
                        className="absolute w-full h-full object-cover"
                        src={images[2]}
                    />
                </div>
            </div>

            {/* Image 4 - Bottom left small */}
            <div className="absolute bottom-0 left-0 right-[75.8%] top-[71.48%]">
                <div className="absolute inset-0 rounded-bl-[35px] rounded-tl-[35px] rounded-tr-[35px] overflow-hidden">
                    <div className="absolute bg-[#3a3a3a] inset-0" />
                    <img
                        alt="Gallery 4"
                        className="absolute w-full h-full object-cover"
                        src={images[3]}
                    />
                </div>
            </div>

            {/* Image 5 - Middle center */}
            <div className="absolute inset-[29.13%_43.89%_49.03%_25.53%]">
                <div className="absolute inset-0 rounded-bl-[35px] rounded-tl-[35px] rounded-tr-[35px] overflow-hidden">
                    <div className="absolute bg-[#3a3a3a] inset-0" />
                    <img
                        alt="Gallery 5"
                        className="absolute w-full h-full object-cover"
                        src={images[4]}
                    />
                </div>
            </div>

            {/* Image 6 - Bottom center-left */}
            <div className="absolute bottom-0 left-[25.53%] right-[60.93%] top-[52.55%]">
                <div className="absolute inset-0 rounded-bl-[35px] rounded-tl-[35px] rounded-tr-[35px] overflow-hidden">
                    <div className="absolute bg-[#3a3a3a] inset-0" />
                    <img
                        alt="Gallery 6"
                        className="absolute w-full h-full object-cover"
                        src={images[5]}
                    />
                </div>
            </div>

            {/* Image 7 - Top center */}
            <div className="absolute bottom-[72.45%] left-[35.64%] right-[43.89%] top-0">
                <div className="absolute inset-0 rounded-bl-[35px] rounded-tl-[35px] rounded-tr-[35px] overflow-hidden">
                    <div className="absolute bg-[#3a3a3a] inset-0" />
                    <img
                        alt="Gallery 7"
                        className="absolute w-full h-full object-cover"
                        src={images[6]}
                    />
                </div>
            </div>

            {/* Image 8 - Top center-right tall */}
            <div className="absolute bottom-[49.03%] left-[56.96%] right-[23.35%] top-0">
                <div className="absolute inset-0 rounded-bl-[35px] rounded-tl-[35px] rounded-tr-[35px] overflow-hidden">
                    <div className="absolute bg-[#3a3a3a] inset-0" />
                    <img
                        alt="Gallery 8"
                        className="absolute w-full h-full object-cover"
                        src={images[7]}
                    />
                </div>
            </div>

            {/* Image 9 - Top right */}
            <div className="absolute bottom-[64.81%] left-[77.51%] right-0 top-0">
                <div className="absolute inset-0 rounded-bl-[35px] rounded-tl-[35px] rounded-tr-[35px] overflow-hidden">
                    <div className="absolute bg-[#3a3a3a] inset-0" />
                    <img
                        alt="Gallery 9"
                        className="absolute w-full h-full object-cover"
                        src={images[8]}
                    />
                </div>
            </div>

            {/* Image 10 - Bottom right tall */}
            <div className="absolute bottom-[0.36%] left-[77.51%] right-0 top-[36.77%]">
                <div className="absolute inset-0 rounded-bl-[35px] rounded-tl-[35px] rounded-tr-[35px] overflow-hidden">
                    <div className="absolute bg-[#3a3a3a] inset-0" />
                    <img
                        alt="Gallery 10"
                        className="absolute w-full h-full object-cover"
                        src={images[9]}
                    />
                </div>
            </div>
        </div>
    );
}

export default GalleryGrid;