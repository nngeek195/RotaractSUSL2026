'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { images } from '../../assets/images';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import MotionWrapper from '../components/MotionWrapper';

import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

// Gallery page - Figma node 161-233 ("Moments of Impact")
export default function Gallery() {
    const [galleryImages, setGalleryImages] = useState([]);
    const [selectedImage, setSelectedImage] = useState(null);
    const [downloading, setDownloading] = useState(false);
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
        fetchAllImages();
    }, []);

    const fetchAllImages = async () => {
        try {
            setLoading(true);

            // 1. Fetch Cloudinary Images
            const cloudinaryPromise = fetch('/api/gallery', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ expression: 'asset_folder="Gallery"' })
            }).then(res => res.ok ? res.json() : { images: [] });

            // 2. Fetch Featured Project Images from Firestore
            const firestorePromise = getDocs(collection(db, "events")).then(snapshot => {
                let featuredImages = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    if (data.galleryImages && Array.isArray(data.galleryImages)) {
                        const projectFeatured = data.galleryImages
                            .filter(img => img.featured === true)
                            .map(img => ({
                                url: img.url,
                                derived: true,
                                date: data.date ? new Date(data.date) : new Date(0) // Capture date for sorting
                            }));
                        featuredImages = [...featuredImages, ...projectFeatured];
                    }
                });
                // Sort featured images by date (newest first)
                return featuredImages.sort((a, b) => b.date - a.date);
            });

            const [cloudinaryData, projectImages] = await Promise.all([cloudinaryPromise, firestorePromise]);

            // Merge: Project images (latest) first, then existing Cloudinary images
            const allImages = [...projectImages, ...(cloudinaryData.images || [])];

            setGalleryImages(allImages);

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

    const handleDownloadImage = async (imageUrl) => {
        if (!imageUrl || downloading) return;
        try {
            setDownloading(true);
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);

            const fileNameFromUrl = imageUrl.split("/").pop()?.split("?")[0] || `gallery-image-${Date.now()}.jpg`;
            const link = document.createElement("a");
            link.href = objectUrl;
            link.download = fileNameFromUrl;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(objectUrl);
        } catch (err) {
            console.error("Download failed:", err);
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="bg-white min-h-screen flex flex-col">
            {/* Navigation */}
            <Navbar currentPage="gallery" />

            {/* Hero Banner */}
            <section className="px-4 lg:px-14 pt-4 lg:pt-8 pb-12">
                <MotionWrapper className="max-w-[1440px] mx-auto">
                    <div className="relative rounded-[43px] overflow-hidden h-[300px] lg:h-[396px]">
                        <Image src={images.imgRectangle78} alt="Gallery Hero" fill className="object-cover" priority />
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-center px-6">
                            <h1 className="font-playfair font-medium text-3xl lg:text-[47px] text-white mb-4 lg:mb-6 leading-tight">
                                <span className="text-pink-600">Moments</span> of Impact
                            </h1>
                            <p className="font-poppins font-medium text-sm lg:text-base text-white leading-relaxed max-w-[681px]">
                                Every picture tells the story of commitment, camaraderie, and service. Our gallery is a vibrant collection of experiences, capturing the heart of our work—from successful project executions and community engagement drives to the fellowship and team spirit that defines the Rotaract Club of Sabaragamuwa.
                            </p>
                        </div>
                    </div>
                </MotionWrapper>
            </section>

            {/* Gallery Grid */}
            <section className="px-4 lg:px-14 pb-20">
                <div className="max-w-[1440px] mx-auto">
                    {loading && (
                        <div className="grid grid-cols-12 gap-4 lg:gap-6">
                            {[...Array(12)].map((_, index) => (
                                <div
                                    key={`skeleton-${index}`}
                                    className={`col-span-12 ${layoutPattern[index % layoutPattern.length]} rounded-[39px] overflow-hidden bg-gray-300 animate-pulse h-[250px] lg:h-[321px] flex items-center justify-center`}
                                >
                                    <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            ))}
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
                                <MotionWrapper
                                    key={item.id}
                                    variant="scaleUp"
                                    delay={0.1}
                                    className={`col-span-12 ${item.span} relative rounded-[39px] overflow-hidden bg-[#d9d9d9] h-[250px] lg:h-[321px] group cursor-pointer`}
                                    onClick={() => setSelectedImage(item.src)}
                                >
                                    <Image
                                        src={item.src}
                                        alt={item.alt}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    />
                                    {/* Hover Overlay with Icon */}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                            <img
                                                src={images.imgIcons8ExpandArrow481}
                                                alt="View"
                                                className="w-6 h-6 brightness-0 invert"
                                            />
                                        </div>
                                    </div>
                                </MotionWrapper>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Image Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="absolute top-6 right-6 z-50 flex items-center gap-2">
                        <button
                            type="button"
                            className="text-white hover:text-gray-200 transition-colors bg-black/40 p-2.5 rounded-lg border border-white/20"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadImage(selectedImage);
                            }}
                            title="Download image"
                            aria-label="Download image"
                            disabled={downloading}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 12l-4-4m4 4l4-4M4 20h16" />
                            </svg>
                        </button>

                        <button
                            className="text-white hover:text-gray-200 transition-colors bg-black/40 p-2.5 rounded-lg border border-white/20"
                            onClick={() => setSelectedImage(null)}
                            title="Close"
                            aria-label="Close"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div
                        className="relative w-full max-w-6xl max-h-[90vh] rounded-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={selectedImage}
                            alt="Full view"
                            className="w-full h-full object-contain max-h-[90vh]"
                        />
                    </div>
                </div>
            )}

            {/* Footer */}
            <Footer />
        </div>
    );
}
