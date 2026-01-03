"use client";

import { motion } from "framer-motion";
import { Code, Heart, Coffee, Github, Linkedin, Globe } from "lucide-react";
import NavBar from "../components/Navbar";
import Footer from "../components/Footer";

const contributors = [
    {
        name: "Tharusha Theekshana",
        role: "Lead Developer",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
        links: {
            github: "https://github.com/tharushatheekshana",
            linkedin: "https://www.linkedin.com/in/tharushatheekshana",
            website: "https://tharushatheekshana.me"
        }
    },
    {
        name: "Niranga Nayanajith",
        role: "Backend Developer",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=James",
        links: {
            github: "https://github.com/nngeek195",
            linkedin: "https://www.linkedin.com/in/niranga-nayanajith",
            // website: "https://nirangannayanajith.me"
        }
    },
    // {
    //     name: "Prabhashini Perera",
    //     role: "UI/UX Designer",
    //     image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
    //     links: {
    //         github: "#",
    //         linkedin: "#",
    //         website: "#"
    //     }
    // },
    // {
    //     name: "Samantha Perera",
    //     role: "Frontend Developer",
    //     image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    //     links: {
    //         github: "#",
    //         linkedin: "#",
    //         website: "#"
    //     }
    // },
    // {
    //     name: "David Kim",
    //     role: "Frontend Developer",
    //     image: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
    //     links: {
    //         github: "#",
    //         linkedin: "#",
    //         website: "#"
    //     }
    // },
];

export default function DevelopersPage() {
    return (
        <div className="bg-gray-50 min-h-screen flex flex-col">
            <NavBar currentPage="home" />

            <div className="flex-grow flex flex-col items-center justify-center py-20 px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-6xl w-full text-center"
                >
                    <div className="inline-flex items-center justify-center p-3 bg-pink-100 rounded-full text-pink-600 mb-6">
                        <Code size={24} />
                    </div>

                    <h1 className="font-playfair text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                        Behind the <span className="text-pink-600">Pixels</span>
                    </h1>

                    <p className="font-poppins text-gray-500 text-lg md:text-xl max-w-2xl mx-auto mb-16 leading-relaxed">
                        Meet the creative minds who brought the Rotaract SUSL digital experience to life.
                        Coding with coffee, passion, and a touch of magic.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-center">
                        {contributors.map((dev, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.2, duration: 0.5 }}
                                className="bg-white p-8 rounded-[30px] shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100 group"
                            >
                                <div className="w-24 h-24 mx-auto mb-6 relative">
                                    <div className="absolute inset-0 bg-pink-100 rounded-full scale-0 group-hover:scale-110 transition-transform duration-500"></div>
                                    <img
                                        src={
                                            dev.image.includes("dicebear") && dev.links.github && dev.links.github !== "#"
                                                ? `${dev.links.github}.png`
                                                : dev.image
                                        }
                                        alt={dev.name}
                                        className="w-full h-full rounded-full object-cover relative z-10 border-4 border-white shadow-sm"
                                    />
                                </div>

                                <h3 className="font-playfair font-bold text-2xl text-gray-900 mb-1">{dev.name}</h3>
                                <p className="font-poppins text-pink-600 text-sm font-medium uppercase tracking-wider mb-6">{dev.role}</p>

                                <div className="flex justify-center gap-4 text-gray-400">
                                    {dev.links.github && dev.links.github !== "#" && (
                                        <a href={dev.links.github} target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 transition-colors">
                                            <Github size={20} />
                                        </a>
                                    )}
                                    {dev.links.linkedin && dev.links.linkedin !== "#" && (
                                        <a href={dev.links.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-blue-700 transition-colors">
                                            <Linkedin size={20} />
                                        </a>
                                    )}
                                    {dev.links.website && dev.links.website !== "#" && (
                                        <a href={dev.links.website} target="_blank" rel="noopener noreferrer" className="hover:text-pink-600 transition-colors">
                                            <Globe size={20} />
                                        </a>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1, duration: 1 }}
                        className="mt-20 flex items-center justify-center gap-2 text-gray-400 font-poppins text-sm"
                    >
                        <span>Crafted with</span>
                        <Heart size={14} className="text-red-500 fill-current animate-pulse" />
                        <span>and</span>
                        <Coffee size={14} className="text-amber-700" />
                        <span>for Rotaract SUSL.</span>
                    </motion.div>
                </motion.div>
            </div>

            <Footer />
        </div>
    );
}
