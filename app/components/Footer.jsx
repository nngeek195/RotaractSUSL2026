'use client';
import React, { useState, useEffect } from 'react';
import { images } from '../../assets/images';

export default function Footer() {
    const [socialLinks, setSocialLinks] = useState({
        facebookUrl: "",
        instagramUrl: "",
        linkedinUrl: "",
        tiktokUrl: "",
        youtubeUrl: "",
        contactEmail: "info@rotaractsusl.org"
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/settings/public');
                if (res.ok) {
                    const data = await res.json();
                    setSocialLinks({
                        facebookUrl: data.facebookUrl || "",
                        instagramUrl: data.instagramUrl || "",
                        linkedinUrl: data.linkedinUrl || "",
                        tiktokUrl: data.tiktokUrl || "",
                        youtubeUrl: data.youtubeUrl || "",
                        contactEmail: data.contactEmail || "info@rotaractsusl.org"
                    });
                }
            } catch (error) {
                console.error("Error fetching footer settings:", error);
            }
        };

        fetchSettings();
    }, []);

    return (
        <footer className="bg-[#3a3a3a] py-12 px-6 lg:px-16">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                {/* Logo & Description */}
                <div>
                    <div className="w-64 h-20 mb-6">
                        <img src={images.imgRotaractLogo2} alt="Rotaract Logo" className="w-full h-full object-contain" />
                    </div>
                    <p className="font-poppins text-[17px] text-white leading-normal mb-6">
                        Empowering youth to create positive change through service, leadership, and fellowship in our community.
                    </p>
                    <div className="flex gap-4">
                        {socialLinks.facebookUrl && (
                            <a href={socialLinks.facebookUrl} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                                <img src={images.imgIcons8Fb481} alt="Facebook" className="w-8 h-8 cursor-pointer hover:opacity-80" />
                            </a>
                        )}
                        {socialLinks.instagramUrl && (
                            <a href={socialLinks.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                                <img src={images.imgIcons8Insta641} alt="Instagram" className="w-8 h-8 cursor-pointer hover:opacity-80" />
                            </a>
                        )}
                        {socialLinks.linkedinUrl && (
                            <a href={socialLinks.linkedinUrl} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                                <img src={images.imgIcons8LinkedIn501} alt="LinkedIn" className="w-8 h-8 cursor-pointer hover:opacity-80" />
                            </a>
                        )}
                        {socialLinks.tiktokUrl && (
                            <a href={socialLinks.tiktokUrl} target="_blank" rel="noopener noreferrer" aria-label="TikTok">
                                <img src={images.imgIcons8Tiktok501} alt="TikTok" className="w-8 h-8 cursor-pointer hover:opacity-80" />
                            </a>
                        )}
                        {socialLinks.youtubeUrl && (
                            <a href={socialLinks.youtubeUrl} target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                                <img src={images.imgIcons8Youtube501} alt="YouTube" className="w-8 h-8 cursor-pointer hover:opacity-80" />
                            </a>
                        )}
                    </div>
                </div>

                {/* Quick Links */}
                <div className="md:justify-self-center">
                    <h3 className="font-poppins font-bold text-xl text-white mb-4">Quick Links</h3>
                    <ul className="space-y-2 font-poppins text-base text-white">
                        <li><a href="/" className="hover:text-pink-600">Home</a></li>
                        <li><a href="/about" className="hover:text-pink-600">About</a></li>
                        <li><a href="/projects" className="hover:text-pink-600">Projects</a></li>
                        <li><a href="/gallery" className="hover:text-pink-600">Gallery</a></li>
                        <li><a href="/leadership" className="hover:text-pink-600">Leadership</a></li>
                        <li><a href="/join" className="hover:text-pink-600">Join Us</a></li>
                    </ul>
                </div>

                {/* Contact */}
                <div className="md:justify-self-end">
                    <h3 className="font-poppins font-bold text-xl text-white mb-4">Contact Us</h3>
                    <div className="space-y-4 font-poppins text-base text-white">
                        <div className="flex items-start gap-3">
                            <img src={images.imgIcons8Location501} alt="Location" className="w-6 h-6 mt-1" />
                            <p>Sabaragamuwa University of Sri Lanka, Belihuloya</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <img src={images.imgIcons8Mail481} alt="Email" className="w-6 h-6" />
                            <a href={`mailto:${socialLinks.contactEmail}`} className="hover:text-pink-600">
                                {socialLinks.contactEmail}
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <div className="border-t border-white pt-6">
                <p className="font-poppins text-sm text-white text-center">
                    © 2025 Rotaract Club of Sabaragamuwa University of Sri Lanka. All rights reserved.
                </p>
            </div>
        </footer>
    );
}