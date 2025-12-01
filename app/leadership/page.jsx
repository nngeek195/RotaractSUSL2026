'use client'; // <--- THIS IS REQUIRED for onError to work

import React, { useEffect, useState } from 'react';
import NavBar from '../components/Navbar';
import Footer from "../components/Footer";
import { Linkedin, Phone } from 'lucide-react';
import { images } from '../../assets/images';


// Default executive roles for fallback
const defaultExecRoles = [
    "President",
    "Vice President",
    "Vice President",
    "Vice President",
    "Secretary",
    "Assistant Secretary",
    "Editor",
    "Assistant Treasurer",
    "Sergeant at Arms"
];

const defaultDirectorRoles = [
    "Club service",
    "Community service",
    "International Service",
    "Professional development",
    "Finance",
    "Membership Development",
    "Public Relations",
    "Sports and Recreational Activities"
];
import { fetchLeaderboard } from "../../lib/leaderboard";

const handleImageError = (e) => {
    e.target.src = "https://via.placeholder.com/230x247?text=Member";
};

export default function Leadership() {
    const [members, setMembers] = useState([]);
    useEffect(() => {
        fetchLeaderboard().then(data => {
            setMembers(data);
        });
    }, []);

    return (
        <div className="bg-white min-h-screen flex flex-col">
            {/* Nav */}
            <NavBar currentPage="leadership" />
            <br /><br />

            {/* Hero banner */}
            <section className="px-4 pt-10">
                <div className="max-w-[1440px] mx-auto">
                    <div className="relative rounded-[43px] overflow-hidden h-[240px] md:h-[300px]">
                        <img src={images.imgRectangle44} alt="Hero leadership" className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-center px-6">
                            <h1 className="font-playfair font-medium text-3xl md:text-[47px] text-white mb-4 leading-tight">
                                Our Driving Force
                            </h1>
                            <p className="font-poppins font-medium text-xs md:text-[16px] text-white leading-relaxed max-w-3xl">
                                Meet the dedicated Rotaractors who steer our mission. Our <span className="font-semibold text-pink-600">Executive Board</span> provides strategic direction, while the <span className="font-semibold text-pink-600">Director Board</span> leads the execution of every project, ensuring our service translates into measurable, positive change across Sabaragamuwa.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Executive Board */}
            <section className="px-4 py-12">
                <div className="max-w-[1200px] mx-auto">
                    <div className="bg-white border-4 border-pink-600 rounded-[30px] p-8 md:p-12 relative">
                        {/* Header Badge */}
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-pink-600 px-8 py-4 rounded-t-[17px]">
                            <h2 className="font-playfair font-medium text-3xl md:text-[47px] text-white whitespace-nowrap">
                                Executive Board
                            </h2>
                        </div>

                        {/* Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
                            {members
                                .filter(m => m.positionOrder && m.positionOrder <= 9)
                                .sort((a, b) => a.positionOrder - b.positionOrder)
                                .map((member, i) => (
                                    <div key={member.id || i} className="flex flex-col items-center">
                                        <img
                                            src={member.photo || "/assets/leadership/placeholder-230x247.png"}
                                            alt={member.name || "Name"}
                                            className="bg-pink-600 rounded-[32px] aspect-[230/247] mb-4 object-cover"
                                            onError={handleImageError}
                                        />
                                        <p className="font-playfair font-medium text-lg text-pink-600 text-center mb-1">{member.role}</p>
                                        <p className="font-poppins text-lg text-black text-center mb-2">{member.name}</p>
                                        <p className="font-poppins text-[15px] text-[#707070] leading-5 text-center mb-3">{member.faculty}</p>
                                        <div className="flex items-center justify-center gap-2 flex-wrap">
                                            {member.linkedin ? (
                                                <a href={member.linkedin} target="_blank" rel="noopener noreferrer">
                                                    <Linkedin size={16} className="text-black" />
                                                </a>
                                            ) : (
                                                <Linkedin size={16} className="text-gray-400" />
                                            )}
                                            <Phone size={16} className="text-black" />
                                            <span className="font-poppins text-sm text-black">{member.phone}</span>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Board of Directors */}
            <section className="px-4 pb-12">
                <div className="max-w-[1200px] mx-auto">
                    <div className="bg-white border-4 border-pink-600 rounded-[30px] p-8 md:p-12 relative">
                        {/* Header Badge */}
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-pink-600 px-8 py-4 rounded-t-[17px]">
                            <h2 className="font-playfair font-medium text-3xl md:text-[47px] text-white whitespace-nowrap">
                                Board of Directors
                            </h2>
                        </div>

                        {/* Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
                            {members
                                .filter(m => m.positionOrder && m.positionOrder > 9)
                                .sort((a, b) => a.positionOrder - b.positionOrder)
                                .map((member, i) => (
                                    <div key={member.id || i} className="flex flex-col items-center">
                                        <img
                                            src={member.photo || "/assets/leadership/default.jpg"}
                                            alt={member.name || "Name"}
                                            className="bg-pink-600 rounded-[32px] aspect-[230/247] mb-4 object-cover"
                                            onError={handleImageError}
                                        />
                                        <p className="font-playfair font-medium text-lg text-pink-600 text-center mb-1">{member.role}</p>
                                        <p className="font-poppins text-lg text-black text-center mb-2">{member.name}</p>
                                        <p className="font-poppins text-[15px] text-[#707070] leading-5 text-center mb-3">{member.faculty}</p>
                                        <div className="flex items-center justify-center gap-2 flex-wrap">
                                            {member.linkedin ? (
                                                <a href={member.linkedin} target="_blank" rel="noopener noreferrer">
                                                    <Linkedin size={16} className="text-black" />
                                                </a>
                                            ) : (
                                                <Linkedin size={16} className="text-gray-400" />
                                            )}
                                            <Phone size={16} className="text-black" />
                                            <span className="font-poppins text-sm text-black">{member.phone}</span>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}