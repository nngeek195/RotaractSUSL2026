import React from 'react';
import { images } from '../../assets/images';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function About() {
    return (
        <div className="bg-white min-h-screen relative">
            {/* Top nav matching Figma design */}
            <Navbar currentPage="about" />

            {/* Foundation banner - Figma design */}
            <section id="foundation" className="px-4 py-8 lg:py-12 pt-24 lg:pt-28">
                <div className="max-w-[1440px] mx-auto px-8">
                    <div className="rounded-[43px] overflow-hidden relative h-[280px] md:h-[339px]">
                        <img src={images.imgRectangle66} alt="Hands united" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-center px-6">
                            <h1 className="font-playfair font-medium text-3xl md:text-[47px] text-white mb-4 leading-tight">
                                Our <span className="text-rotaract-pink">Foundation</span> of Action
                            </h1>
                            <p className="font-poppins font-medium text-sm md:text-base text-white max-w-2xl leading-relaxed">
                                The Rotaract Club of Sabaragamuwa is driven by purpose and lasting community contribution. We thrive through teamwork, leadership, service, and fellowship, creating meaningful impact across our university and region.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Placeholder for extended about content */}
            <section className="px-4 pb-24">
                <div className="max-w-5xl mx-auto space-y-8 font-poppins text-[#343434] text-sm leading-relaxed">
                    <p>
                        The Rotaract Club of Sabaragamuwa University of Sri Lanka was established in 2024 as a platform for young leaders to create meaningful impact within the university and the wider community. Since its inception, the club has grown steadily, bringing together passionate undergraduates who are committed to service, leadership, and professional development. Today, the club continues to expand its initiatives through sustainable projects, volunteer programs, and youth empowerment activities, positioning itself as a vibrant and active force within the Rotaract movement at SUSL.
                    </p>
                </div>
            </section>

            {/* Footer */}
            <Footer />
        </div>
    );
}