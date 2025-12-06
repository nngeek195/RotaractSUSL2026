import React from 'react';
import { images } from '../../assets/images';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

import MotionWrapper from '../components/MotionWrapper';

export default function About() {
    return (
        <div className="bg-white min-h-screen relative">
            <Navbar currentPage="about" />

            {/* Hero Header */}
            <section className="px-4 py-8 lg:py-12 pt-4 lg:pt-8">
                <MotionWrapper className="max-w-[1440px] mx-auto px-8">
                    <div className="rounded-[43px] overflow-hidden relative h-[280px] md:h-[339px]">
                        <img src={images.imgRectangle66} alt="About Us" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-center px-6">
                            <h1 className="font-playfair font-medium text-3xl md:text-[47px] text-white mb-4 leading-tight">
                                About <span className="text-pink-600">Us</span>
                            </h1>
                            <p className="font-poppins font-medium text-sm md:text-base text-white max-w-2xl leading-relaxed">
                                Discover the heart of our movement: Service, Fellowship, and Leadership.
                            </p>
                        </div>
                    </div>
                </MotionWrapper>
            </section>

            {/* What is Rotaract? */}
            <section className="px-4 py-12 lg:py-16">
                <MotionWrapper className="max-w-5xl mx-auto text-center">
                    <h2 className="font-playfair font-bold text-3xl md:text-4xl text-gray-900 mb-6">
                        What is Rotaract?
                    </h2>
                    <p className="font-poppins text-gray-600 leading-relaxed text-base md:text-lg text-justify md:text-center">
                        Rotaract is a global movement of young leaders (ages 18-30) who are dedicated to making a positive impact in their communities and developing their own leadership and professional skills. Sponsored by Rotary International, Rotaract clubs are non-political, non-religious, and open to all. We organize service projects, professional development workshops, and social events to foster fellowship and create sustainable change. Whether it’s through community service, international understanding, or personal growth, Rotaract provides a platform for young adults to "Self-Development - Fellowship through Service."
                    </p>
                </MotionWrapper>
            </section>

            {/* Motto & 4-Way Test Split */}
            <section className="bg-gray-50 px-4 py-16">
                <MotionWrapper className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Motto */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center h-full">
                        <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mb-6">
                            <span className="text-3xl">🤝</span>
                        </div>
                        <h3 className="font-playfair font-bold text-2xl text-gray-900 mb-4">Rotaract Motto</h3>
                        <p className="font-playfair italic text-2xl md:text-3xl text-pink-600">
                            "Fellowship Through Service"
                        </p>
                    </div>

                    {/* 4-Way Test */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                        <h3 className="font-playfair font-bold text-2xl text-gray-900 mb-6 text-center">
                            Rotary 4-Way Test
                        </h3>
                        <div className="space-y-4">
                            <p className="font-poppins font-semibold text-gray-700 text-center mb-4">
                                Of the things we think, say or do:
                            </p>
                            <ol className="list-decimal list-inside space-y-3 font-poppins text-gray-600 text-lg ml-4">
                                <li>Is it the <strong className="text-pink-600">TRUTH</strong>?</li>
                                <li>Is it <strong className="text-pink-600">FAIR</strong> to all concerned?</li>
                                <li>Will it build <strong className="text-pink-600">GOODWILL</strong> and <strong className="text-pink-600">BETTER FRIENDSHIPS</strong>?</li>
                                <li>Will it be <strong className="text-pink-600">BENEFICIAL</strong> to all concerned?</li>
                            </ol>
                        </div>
                    </div>
                </MotionWrapper>
            </section>

            {/* Goals */}
            <section className="px-4 py-16 lg:py-24">
                <MotionWrapper className="max-w-5xl mx-auto">
                    <h2 className="font-playfair font-bold text-3xl md:text-4xl text-gray-900 mb-12 text-center">
                        Rotaract Goals
                    </h2>
                    <div className="grid gap-6 md:grid-cols-2">
                        {[
                            "To develop professional and leadership skills.",
                            "To emphasize respect for the rights of others, based on recognition of the worth of each individual.",
                            "To recognize the dignity and value of all useful occupations as opportunities to serve.",
                            "To recognize, practice, and promote ethical standards as leadership qualities and vocational responsibilities.",
                            "To develop knowledge and understanding of the needs, problems, and opportunities in the community and worldwide.",
                            "To provide opportunities for personal and group activities to serve the community and promote international understanding and goodwill."
                        ].map((goal, index) => (
                            <div key={index} className="flex items-start gap-4 bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition border border-gray-100">
                                <div className="bg-pink-600 text-white w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center font-bold text-sm mt-1">
                                    {index + 1}
                                </div>
                                <p className="font-poppins text-gray-600 leading-relaxed text-sm md:text-base">
                                    {goal}
                                </p>
                            </div>
                        ))}
                    </div>
                </MotionWrapper>
            </section>

            <Footer />
        </div>
    );
}