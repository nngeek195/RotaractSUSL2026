import React from 'react';
import { images } from '../../assets/images';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// Gallery page - Figma node 161-233 ("Moments of Impact")
export default function Gallery() {
    // Gallery images in specific layout order matching Figma
    const galleryItems = [
        // Row 1
        { id: 1, src: images.imgRectangle84, alt: 'Gallery Image 1', span: 'lg:col-span-6' },
        { id: 2, src: images.imgRectangle87, alt: 'Gallery Image 2', span: 'lg:col-span-3' },
        { id: 3, src: images.imgRectangle88, alt: 'Gallery Image 3', span: 'lg:col-span-3' },
        // Row 2
        { id: 4, src: images.imgRectangle85, alt: 'Gallery Image 4', span: 'lg:col-span-4' },
        { id: 5, src: images.imgRectangle86, alt: 'Gallery Image 5', span: 'lg:col-span-5' },
        { id: 6, src: images.imgRectangle89, alt: 'Gallery Image 6', span: 'lg:col-span-3' },
        // Row 3
        { id: 7, src: images.imgRectangle90, alt: 'Gallery Image 7', span: 'lg:col-span-6' },
        { id: 8, src: images.imgRectangle91, alt: 'Gallery Image 8', span: 'lg:col-span-3' },
        { id: 9, src: images.imgRectangle92, alt: 'Gallery Image 9', span: 'lg:col-span-3' },
        // Row 4
        { id: 10, src: images.imgRectangle93, alt: 'Gallery Image 10', span: 'lg:col-span-4' },
        { id: 11, src: images.imgRectangle94, alt: 'Gallery Image 11', span: 'lg:col-span-5' },
        { id: 12, src: images.imgRectangle95, alt: 'Gallery Image 12', span: 'lg:col-span-3' },
    ];

    return (
        <div className="bg-white min-h-screen flex flex-col">
            {/* Navigation */}
            <Navbar currentPage="gallery" />

            {/* Hero Banner */}
            <section className="px-4 lg:px-14 pt-24 lg:pt-28 pb-12">
                <div className="max-w-[1440px] mx-auto">
                    <div className="relative rounded-[43px] overflow-hidden h-[300px] lg:h-[396px]">
                        <img src={images.imgRectangle66} alt="Gallery Hero" className="absolute inset-0 w-full h-full object-cover" />
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
                <div className="max-w-[1440px] mx-auto grid grid-cols-12 gap-4 lg:gap-6">
                    {galleryItems.map(item => (
                        <div
                            key={item.id}
                            className={`col-span-12 ${item.span} rounded-[39px] overflow-hidden bg-[#d9d9d9] h-[250px] lg:h-[321px]`}
                        >
                            <img src={item.src} alt={item.alt} className="w-full h-full object-cover" />
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <Footer />
        </div>
    );
}