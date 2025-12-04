'use client';

import React, { useState, useEffect } from 'react';
import { images } from '../../assets/images';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// Gallery page - Figma node 161-233 ("Moments of Impact")
export default function Gallery() {
    const [galleryImages, setGalleryImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Layout pattern for gallery items (repeats every 12 images)
    const layoutPattern = [
        'lg:col-span-6', 'lg:col-span-3', 'lg:col-span-3', // Row 1
        'lg:col-span-4', 'lg:col-span-5', 'lg:col-span-3', // Row 2
        'lg:col-span-6', 'lg:col-span-3', 'lg:col-span-3', // Row 3
        'lg:col-span-4', 'lg:col-span-5', 'lg:col-span-3', // Row 4
    ];

    useEffect(() => {
        fetchGalleryImages();
    }, []);

    const fetchGalleryImages = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/gallery', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ expression: 'asset_folder="Gallery"' })
            });

            if (!response.ok) {
                throw new Error('Failed to fetch gallery images');
            }

            const data = await response.json();
            setGalleryImages(data.images || []);
        } catch (err) {
            console.error('Error fetching gallery:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Map images to gallery items with layout spans
    const galleryItems = galleryImages.map((img, index) => ({
        id: index + 1,
        src: img.url,
        alt: `Gallery Image ${index + 1}`,
        span: layoutPattern[index % layoutPattern.length],
    }));

    return (
        <div className="bg-white min-h-screen flex flex-col">
            {/* Navigation */}
            <Navbar currentPage="gallery" />

            {/* Hero Banner */}
            <section className="px-4 lg:px-14 pt-4 lg:pt-8 pb-12">
                <div className="max-w-[1440px] mx-auto">
                    <div className="relative rounded-[43px] overflow-hidden h-[300px] lg:h-[396px]">
                        <img src={images.imgRectangle78} alt="Gallery Hero" className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-center px-6">
                            <h1 className="font-playfair font-medium text-3xl lg:text-[47px] text-white mb-4 lg:mb-6 leading-tight">
                                <span className="text-pink-600">Moments</span> of Impact
                            </h1>
                            <p className="font-poppins font-medium text-sm lg:text-base text-white leading-relaxed max-w-[681px]">
                                Every picture tells the story of commitment, camaraderie, and service. Our gallery is a vibrant collection of experiences, capturing the heart of our work—from successful project executions and community engagement drives to the fellowship and team spirit that defines the Rotaract Club of Sabaragamuwa.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Gallery Grid */}
            <section className="px-4 lg:px-14 pb-20">
                <div className="max-w-[1440px] mx-auto">
                    {loading && (
                        <div className="text-center py-20">
                            <p className="text-lg text-gray-600">Loading gallery...</p>
                        </div>
                    )}

                    {error && (
                        <div className="text-center py-20">
                            <p className="text-lg text-red-600">Error loading gallery: {error}</p>
                        </div>
                    )}

                    {!loading && !error && galleryItems.length === 0 && (
                        <div className="text-center py-20">
                            <p className="text-lg text-gray-600">No images found</p>
                        </div>
                    )}

                    {!loading && !error && galleryItems.length > 0 && (
                        <div className="grid grid-cols-12 gap-4 lg:gap-6">
                            {galleryItems.map(item => (
                                <div
                                    key={item.id}
                                    className={`col-span-12 ${item.span} rounded-[39px] overflow-hidden bg-[#d9d9d9] h-[250px] lg:h-[321px]`}
                                >
                                    <img src={item.src} alt={item.alt} className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Footer */}
            <Footer />
        </div>
    );
}