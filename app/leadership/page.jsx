'use client'; // <--- THIS IS REQUIRED for onError to work

import React from 'react';
import { images } from "../../assets/images"; // Fixed: Added { } for named import
import NavBar from '../components/Navbar';
import Footer from "../components/Footer";
import { Linkedin, Phone } from 'lucide-react';

// Helper function for public images
const getImageUrl = (filename) => `/assets/leadership/${filename}`;

export default function Leadership() {
    const executiveBoard = [
        { name: 'M.D.K.K. Basnayake', role: 'President', faculty: 'Faculty of Agriculture Sciences', phone: '+94 78 2479942', photo: images.presidentPhoto },
        { name: 'D.M.H.S. Dewamiththa', role: 'Vice President', faculty: 'Faculty of Applied Science', phone: '+94 77 0813440', photo: images.vicePresidentDewamiththa },
        { name: 'W.H.A.A.T. Wickrama', role: 'Vice President', faculty: 'Faculty of Applied Science', phone: '+94 75 0727812', photo: images.vicePresidentWickrama },
        { name: 'A.I. Ravihansa', role: 'Vice President', faculty: 'Faculty of Applied Science', phone: '+94 75 6570290', photo: images.vicePresidentRavihansa },
        { name: 'S.N. Edirisooriya', role: 'Secretary', faculty: 'Faculty of Agriculture Sciences', phone: '+94 76 893844', photo: images.secretaryEdirisooriya },
        { name: 'A.A.O.I.S. Kulathilaka', role: 'Assistant Secretary', faculty: 'Faculty of Management Studies', phone: '+94 78 7337298', photo: images.assistantSecretaryKulathilaka },
        { name: 'G.P.S. Kariyawasam', role: 'Editor', faculty: 'Faculty of Applied Sciences', phone: '+94 77 1281159', photo: images.editorKariyawasam },
        { name: 'Nayomi Awanthika', role: 'Assistant Treasurer', faculty: 'Faculty of Management Studies', phone: '+94 76 6072719', photo: images.assistantTreasurerAwanthika },
        { name: 'J.M.D. Jayasundara', role: 'Sergeant at Arms', faculty: 'Faculty of Management Studies', phone: '+94 70 1127907', photo: images.sergeantAtArmsJayasundara }
    ];

    const boardOfDirectors = [
        { name: 'R.M. Kithmi Geena', role: 'Club service', faculty: 'Faculty of Management Studies', phone: '+94 76 4455199', photo: images.clubServiceGeena },
        { name: 'S.D.U.D. Subasingha', role: 'Community service', faculty: 'Faculty of Agricultural Sciences', phone: '+94 70 2524820', photo: images.communityServiceSubasingha },
        { name: 'A. Randeniarachchi', role: 'International Service', faculty: 'Faculty of Social Science and Languages', phone: '+94 77 0074315', photo: images.internationalServiceRandeniarachchi },
        { name: 'S.M.D.S.N. Jayatilleke', role: 'Professional development', faculty: 'Faculty of Management Studies', phone: '+94 76 4454684', photo: images.professionalDevelopmentJayatilleke },
        { name: 'M.F.F. Farha', role: 'Finance', faculty: 'Faculty of Management Studies', phone: '+94 74 1993268', photo: images.financeDirectorFazly },
        { name: 'K.D.A.S. Premathilaka', role: 'Membership Development', faculty: 'Faculty of Agricultural Sciences', phone: '+94 71 3503498', photo: images.membershipDevelopmentPremathilaka },
        { name: 'Pasindu Denuwan', role: 'Public Relations', faculty: 'Faculty of Computing', phone: '+94 74 1129514', photo: images.publicRelationsDenuwan },
        { name: 'J.A.U. Jayakodi', role: 'Sports and Recreational Activities', faculty: 'Faculty of Applied Sciences', phone: '+94 78 6397512', photo: images.sportsRecreationalJayakodi }
    ];

    // Helper function to handle image errors safely
    const handleImageError = (e) => {
        e.target.src = "https://via.placeholder.com/230x247?text=Member";
    };

    return (
        <div className="bg-white min-h-screen flex flex-col">
            {/* Nav */}
            <NavBar activeLink="leadership" />
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
                            {executiveBoard.map((member, i) => (
                                <div key={i} className="flex flex-col items-center">
                                    <img
                                        src={member.photo}
                                        alt={member.name}
                                        className="bg-pink-600 rounded-[32px] aspect-[230/247] mb-4 object-cover"
                                        onError={handleImageError}
                                    />
                                    <p className="font-playfair font-medium text-lg text-pink-600 text-center mb-1">{member.role}</p>
                                    <p className="font-poppins text-lg text-black text-center mb-2">{member.name}</p>
                                    <p className="font-poppins text-[15px] text-[#707070] leading-5 text-center mb-3">{member.faculty}</p>

                                    <div className="flex items-center justify-center gap-2 flex-wrap">
                                        <Linkedin size={16} className="text-black" />
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
                            {boardOfDirectors.map((member, i) => (
                                <div key={i} className="flex flex-col items-center">
                                    <img
                                        src={member.photo}
                                        alt={member.name}
                                        className="bg-pink-600 rounded-[32px] aspect-[230/247] mb-4 object-cover"
                                        onError={handleImageError}
                                    />
                                    <p className="font-playfair font-medium text-lg text-pink-600 text-center mb-1">{member.role}</p>
                                    <p className="font-poppins text-lg text-black text-center mb-2">{member.name}</p>
                                    <p className="font-poppins text-[15px] text-[#707070] leading-5 text-center mb-3">{member.faculty}</p>

                                    <div className="flex items-center justify-center gap-2 flex-wrap">
                                        <Linkedin size={16} className="text-black" />
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