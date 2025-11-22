'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { images } from '../assets/images';
import ProjectCarousel from './components/ProjectCarousel';
// import GalleryGrid from './components/GalleryGrid'; // Unused in your snippet, but kept commented
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Firebase Imports
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query } from "firebase/firestore";

export default function Home() {
  // --- 1. State & Data Fetching Logic ---
  type Project = {
    id: string;
    imageUrl?: string;
    title?: string;
    name?: string;
    description?: string;
    date?: string;
    status?: string;
    [key: string]: any;
  };
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // Fetch ALL events/projects
    const q = query(collection(db, "events"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAllProjects(list);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching projects:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // --- 2. Filtering Logic ---

  // Filter for "Our Projects" (Completed/Happened) - Sort Newest First
  const completedProjects = useMemo(() => {
    return allProjects
      .filter(p => {
        const status = p.status?.toLowerCase() || '';
        return status === 'happened' || status === 'completed' || status === 'past';
      })
      .sort((a, b) => {
        const ta = a.date ? new Date(a.date).getTime() : 0;
        const tb = b.date ? new Date(b.date).getTime() : 0;
        return tb - ta;
      })
      // Map Firebase fields to the format ProjectCarousel expects
      .map(p => ({
        id: p.id,
        image: p.imageUrl || images.imgRectangle20, // Fallback image
        title: p.title || p.name,
        description: p.description || 'No description available.'
      }));
  }, [allProjects]);

  // Filter for "Upcoming Projects" - Sort Soonest First
  const upcomingProjects = useMemo(() => {
    return allProjects
      .filter(p => {
        const status = p.status?.toLowerCase() || '';
        return status === 'upcoming';
      })
      .sort((a, b) => {
        const ta = a.date ? new Date(a.date).getTime() : Infinity;
        const tb = b.date ? new Date(b.date).getTime() : Infinity;
        return ta - tb;
      })
      .slice(0, 3); // Limit to 3 for the grid layout
  }, [allProjects]);


  // --- Static Data (Leadership) ---
  const leadershipTeam = [
    { name: 'M.D.K.K. Basnayake', role: 'President', faculty: 'Faculty of Agriculture Sciences', phone: '+94 78 2479942' },
    { name: 'D.M.H.S. Dewamiththa', role: 'Vice President', faculty: 'Faculty of Applied Science', phone: '+94 77 0813440' },
    { name: 'W.H.A.A.T. Wickrama', role: 'Vice President', faculty: 'Faculty of Applied Science', phone: '+94 75 0727812' },
    { name: 'A.I. Ravihansa', role: 'Vice President', faculty: 'Faculty of Applied Science', phone: '+94 75 6570290' },
    { name: 'S.N. Edirisooriya', role: 'Secretary', faculty: 'Faculty of Agriculture Sciences', phone: '+94 76 893844' },
    { name: 'A.A.O.I.S. Kulathilaka', role: 'Assistant Secretary', faculty: 'Faculty of Management Studies', phone: '+94 78 7337298' },
    { name: 'G.P.S. Kariyawasam', role: 'Editor', faculty: 'Faculty of Applied Sciences', phone: '+94 77 1281159' },
    { name: 'Nayomi Awanthika', role: 'Assistant treasurer', faculty: 'Faculty of Management Studies', phone: '+94 76 6072719' },
  ];

  return (
    <div className="bg-white relative w-full">
      {/* Navigation */}
      <Navbar currentPage="home" />

      {/* Hero Section */}
      <section className="relative min-h-[600px] lg:min-h-[750px] flex items-center px-4 lg:px-16 pt-24 pb-16">
        <div className="max-w-[1440px] mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            <h1 className="font-playfair font-medium text-4xl lg:text-5xl leading-tight">
              <span className="text-text-pink-600">Serve. Grow. Lead.</span>
              <br />
              <span className="text-black text-3xl lg:text-4xl">Make Your Mark.</span>
            </h1>

            <p className="font-poppins text-[15px] text-[#343434] leading-relaxed max-w-lg">
              We're the Rotaract Club of SUSL, a vibrant community of students committed to creating lasting change, one project at a time. Dive into our impactful service projects, sharpen your professional skills, and connect with future leaders. <span className="font-bold">Your journey to global impact starts right here.</span>
            </p>

            <div className="flex gap-4 pt-2">
              <button className="bg-pink-600 text-white px-6 py-3 rounded-full font-poppins font-medium text-sm hover:bg-opacity-90">
                Learn More
              </button>
              <a href="/join" className="border border-black text-black px-6 py-3 rounded-full font-poppins font-medium text-sm hover:bg-black hover:text-white transition text-center">
                Join Us
              </a>
            </div>
          </div>

          {/* Right Images */}
          <div className="relative h-[400px] lg:h-[500px]">
            {/* Main Large Image - Top Left */}
            <div className="absolute top-0 left-0 w-[65%] h-[60%] rounded-[59px] shadow-lg overflow-hidden z-10">
              <img src={images.imgImage1} alt="Community" className="w-full h-full object-cover" />
            </div>

            {/* Bottom Right Image */}
            <div className="absolute bottom-0 right-0 w-[48%] h-[35%] rounded-[44px] shadow-lg overflow-hidden z-20">
              <img src={images.imgRectangle4} alt="Service" className="w-full h-full object-cover" />
            </div>

            {/* Middle Right Image - Overlapping */}
            <div className="absolute top-[22%] right-[18%] w-[42%] h-[40%] rounded-[33px] shadow-lg overflow-hidden z-30">
              <img src={images.imgRectangle5} alt="Fellowship" className="w-full h-full object-cover" />
            </div>

            {/* Decorative Dots */}
            <img src={images.imgEllipse1} alt="" className="absolute bottom-24 right-2 w-3 h-3 z-5" />
            <img src={images.imgEllipse3} alt="" className="absolute bottom-20 right-6 w-2 h-2 z-5" />
            <img src={images.imgEllipse2} alt="" className="absolute top-10 right-10 w-2.5 h-2.5 z-5" />
          </div>
        </div>
      </section>

      {/* Values Banner */}
      <section className="bg-pink-600 py-12 lg:py-16">
        <div className="max-w-[1300px] mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Service */}
          <div className="bg-white rounded-[33px] shadow-lg p-6 flex flex-col min-h-[220px]">
            <img src={images.imgIcons8Heart601} alt="Service" className="w-[60px] h-[60px] mb-4" />
            <h3 className="font-playfair font-medium text-2xl text-black mb-3">Service</h3>
            <div className="h-px bg-pink-600 w-3/4 mb-4"></div>
            <p className="font-poppins text-[15px] text-[#625f5f] leading-relaxed">
              Dedicated to serving our community and making a positive impact.
            </p>
          </div>

          {/* Fellowship */}
          <div className="bg-white rounded-[33px] shadow-lg p-6 flex flex-col min-h-[220px]">
            <img src={images.imgIcons8UserAccount641} alt="Fellowship" className="w-[44px] h-[44px] mb-4" />
            <h3 className="font-playfair font-medium text-2xl text-black mb-3">Fellowship</h3>
            <div className="h-px bg-pink-600 w-3/4 mb-4"></div>
            <p className="font-poppins text-[15px] text-[#625f5f] leading-relaxed">
              Building lasting friendships and professional networks.
            </p>
          </div>

          {/* Leadership */}
          <div className="bg-white rounded-[33px] shadow-lg p-6 flex flex-col min-h-[220px]">
            <img src={images.imgIcons8Leadership481} alt="Leadership" className="w-[33px] h-[33px] mb-4" />
            <h3 className="font-playfair font-medium text-2xl text-black mb-3">Leadership</h3>
            <div className="h-px bg-pink-600 w-3/4 mb-4"></div>
            <p className="font-poppins text-[15px] text-[#625f5f] leading-relaxed">
              Developing future leaders through hands-on experience.
            </p>
          </div>

          {/* Excellence */}
          <div className="bg-white rounded-[33px] shadow-lg p-6 flex flex-col min-h-[220px]">
            <img src={images.imgIcons8Badge501} alt="Excellence" className="w-[31px] h-[31px] mb-4" />
            <h3 className="font-playfair font-medium text-2xl text-black mb-3">Excellence</h3>
            <div className="h-px bg-pink-600 w-3/4 mb-4"></div>
            <p className="font-poppins text-[15px] text-[#625f5f] leading-relaxed">
              Striving for excellence in everything we do.
            </p>
          </div>
        </div>
      </section>

      {/* Who are we Section */}
      <section id="about" className="bg-[#e9e9e9] py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div>
              <h2 className="font-playfair font-medium text-4xl lg:text-5xl text-black mb-6">
                Who are we?
              </h2>
              <p className="font-poppins text-[15px] text-black leading-relaxed mb-6">
                We are the Rotaract Club of Sabaragamuwa University of Sri Lanka (SUSL), a dynamic, youth-led volunteer organization dedicated to service, fellowship, and professional growth. Affiliated with Rotary International, our club brings together passionate undergraduates from various faculties who are committed to making a tangible, positive impact both within our university community and across the Sabaragamuwa region. We're more than just a club; we're a platform for developing leadership skills, expanding professional networks, and channeling the collective energy of the student body into sustainable, impactful projects that address real-world needs. We strive to embody Rotary's motto of "Service Above Self" while fostering lifelong friendships and shaping ethical leaders for tomorrow.
              </p>
              <button className="bg-pink-600 text-white px-6 py-3 rounded-full font-poppins font-medium text-sm hover:bg-opacity-90">
                Learn More
              </button>
            </div>

            <div className="relative h-[400px]">
              <div className="absolute top-0 right-0 w-3/5 h-4/5 rounded-[57px] shadow-lg overflow-hidden">
                <img src={images.imgRectangle14} alt="Club Activity" className="w-full h-full object-cover" />
              </div>
              <div className="absolute bottom-0 left-0 w-1/2 h-3/5 bg-pink-600 rounded-[46px]"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="bg-[#e9e9e9] pb-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div>
              <p className="font-prata text-5xl text-text-pink-600 mb-2">10+</p>
              <p className="font-poppins font-medium text-base text-black">Years of Service</p>
            </div>
            <div>
              <p className="font-prata text-5xl text-text-pink-600 mb-2">30+</p>
              <p className="font-poppins font-medium text-base text-black">Total Projects</p>
            </div>
            <div>
              <p className="font-prata text-5xl text-text-pink-600 mb-2">200+</p>
              <p className="font-poppins font-medium text-base text-black">Members</p>
            </div>
            <div>
              <p className="font-prata text-5xl text-text-pink-600 mb-2">9</p>
              <p className="font-poppins font-medium text-base text-black">Faculties</p>
            </div>
          </div>
        </div>
      </section>

      {/* Join Rotaract Banner */}
      <section className="relative h-[341px] overflow-hidden">
        <img src={images.imgRectangle15} alt="Join Us" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/60"></div>

        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
          <h2 className="font-playfair font-medium text-3xl lg:text-5xl text-white mb-4">
            Be the Change. <span className="text-text-pink-600">Join Rotaract!</span>
          </h2>
          <p className="font-poppins font-medium text-base text-white max-w-4xl mb-6">
            Ready to find your purpose and a supportive network? Join the Rotaract Club of Sabaragamuwa to gain leadership experience and create real, sustainable impact in our community. Start your journey of service and growth today.
          </p>
          <a href="/join" className="bg-pink-600 text-white px-6 py-3 rounded-full font-poppins font-medium text-sm hover:bg-opacity-90">
            Join Us
          </a>
        </div>
      </section>

      {/* Our Projects (COMPLETED PROJECTS CAROUSEL) */}
      <section id="projects" className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 lg:px-16">
          <h2 className="font-playfair font-medium text-4xl lg:text-5xl text-black text-center mb-6">
            Our Projects
          </h2>
          <p className="font-poppins font-medium text-base text-black text-center max-w-4xl mx-auto mb-12">
            Our club is driven by impactful, student-led projects. We focus on key areas like Community Development, Professional Growth, and Environmental Sustainability. Explore our completed work below.
          </p>

          <div className="mb-12">
            {/* Passing dynamic completed projects here */}
            {loading ? (
              <div className="text-center py-10">Loading Projects...</div>
            ) : (
              <ProjectCarousel projects={completedProjects as any} />
            )}
          </div>

          <div className="text-right">
            <a href="/projects" className="bg-pink-600 text-white px-6 py-3 rounded-full font-poppins font-medium text-sm hover:bg-opacity-90 inline-block">
              See All Projects
            </a>
          </div>
        </div>
      </section>

      {/* Upcoming Projects (DYNAMIC GRID) */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          {/* Outer pink border container */}
          <div className="bg-pink-600 rounded-[51px] p-1">
            {/* Inner white container */}
            <div className="bg-white rounded-[51px] p-12 lg:p-16">
              <h2 className="font-playfair font-medium text-4xl lg:text-5xl text-text-pink-600 text-center mb-12">
                Upcoming Projects
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {loading && <div className="col-span-3 text-center">Loading Upcoming Projects...</div>}

                {!loading && upcomingProjects.length === 0 && (
                  <div className="col-span-3 text-center text-gray-500">
                    No upcoming projects scheduled at the moment.
                  </div>
                )}

                {upcomingProjects.map((project) => (
                  <div key={project.id} className="bg-black rounded-[41px] h-[300px] relative overflow-hidden flex items-end group">
                    {/* Image Background */}
                    <img
                      src={project.imageUrl || images.imgRectangle44}
                      alt={project.title || project.name}
                      className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-300"
                    />

                    {/* Content Overlay */}
                    <div className="relative z-10 p-6 w-full bg-gradient-to-t from-black/90 to-transparent">
                      <p className="font-playfair text-white text-xl mb-1 font-bold">
                        {project.title || project.name}
                      </p>
                      <div className="flex justify-between items-center">
                        <p className="font-poppins text-[12px] text-text-pink-600">
                          {project.date}
                        </p>
                        <span className="text-xs text-white border border-white px-2 py-1 rounded-full">
                          Upcoming
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Fillers if less than 3 projects, just to keep layout nice (Optional) */}
                {!loading && upcomingProjects.length > 0 && upcomingProjects.length < 3 && (
                  <div className="bg-gray-100 rounded-[41px] h-[300px] flex items-center justify-center border-2 border-dashed border-gray-300">
                    <p className="font-poppins text-gray-400 text-center px-4">
                      More projects coming soon...
                    </p>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cherished Memories Header */}
      <section id="gallery" className="bg-pink-600 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="font-playfair font-medium text-4xl lg:text-5xl text-white mb-4">
            Cherished Memories
          </h2>
          <p className="font-poppins font-medium text-sm text-white max-w-5xl mx-auto">
            Our photo gallery is a vibrant showcase of the fellowship and dedicated service that defines our club. These images capture the energy from our projects, reflecting the tangible impact and unforgettable memories we create together.
          </p>
        </div>
      </section>

      {/* Gallery Grid - Separate Grey Container */}
      <section className="bg-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-[#d9d9d9] rounded-[43px] py-12 px-6">

            <div className="text-center mt-8">
              <button className="bg-pink-600 text-white px-6 py-3 rounded-full font-poppins font-medium text-sm hover:bg-opacity-90">
                See More
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Service Stars */}
      <section className="bg-[#eeeeee] py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="font-playfair font-medium text-4xl lg:text-5xl text-black mb-4">
            Our Service Stars
          </h2>
          <p className="font-playfair font-medium text-2xl text-text-pink-600 mb-6">
            Celebrating Dedication
          </p>
          <p className="font-poppins font-medium text-sm text-black max-w-4xl mx-auto mb-12">
            Recognizing the Rotaractors and Directors whose unwavering commitment and passion have driven our mission and delivered exceptional impact this month. Their enthusiasm is the engine of our club.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Rotaractor of the Month */}
            <div className="bg-pink-600 rounded-[37px] shadow-lg p-8 relative flex flex-col">
              <p className="font-poppins font-light text-[17px] text-white mb-1">of the Month</p>
              <p className="font-playfair font-medium text-[32px] text-white mb-6">Rotaractor</p>
              <div className="bg-white rounded-[32px] h-[320px] mb-6 flex-shrink-0"></div>
              <p className="font-playfair font-medium text-[28px] text-white mb-1">Name</p>
              <p className="font-poppins text-[19px] text-[#d9d9d9] mb-6">Faculty</p>
              <p className="font-poppins font-medium italic text-[17px] text-white leading-relaxed">
                "Service to others is the rent you pay for your room here on earth."
              </p>
            </div>

            {/* Director of the Month */}
            <div className="bg-pink-600 rounded-[37px] shadow-lg p-8 relative flex flex-col">
              <p className="font-poppins font-light text-[17px] text-white mb-1">of the Month</p>
              <p className="font-playfair font-medium text-[32px] text-white mb-6">Director</p>
              <div className="bg-white rounded-[32px] h-[320px] mb-6 flex-shrink-0"></div>
              <p className="font-playfair font-medium text-[28px] text-white mb-1">Name</p>
              <p className="font-poppins text-[19px] text-[#d9d9d9] mb-6">Faculty</p>
              <p className="font-poppins font-medium italic text-[17px] text-white leading-relaxed">
                "Service to others is the rent you pay for your room here on earth."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Leadership Section */}
      <section id="leadership" className="bg-[#e9e9e9] py-16 lg:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="font-playfair font-medium text-4xl lg:text-5xl text-black text-center mb-6">
            Our Leadership
          </h2>
          <p className="font-poppins font-medium text-base text-black text-center max-w-3xl mx-auto mb-12">
            Meet the dedicated team leading our club towards excellence and positive impact.
          </p>

          {/* Unified Leadership Container */}
          <div className="bg-[#d9d9d9] rounded-[39px] p-8 lg:p-10">
            {/* Leadership Grid - All 9 Members */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {leadershipTeam.map((member, i) => (
                <div key={i} className="flex flex-col">
                  <div className="bg-pink-600 rounded-[32px] aspect-[230/247] mb-4"></div>
                  <p className="font-playfair font-medium text-lg text-text-pink-600 mb-1">{member.role}</p>
                  <p className="font-poppins text-lg text-black mb-2">{member.name}</p>
                  <p className="font-poppins text-[15px] text-[#707070] leading-5 mb-3">{member.faculty}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <img src={images.imgIcons8LinkedIn501} alt="LinkedIn" className="w-7 h-7" />
                    <img src={images.imgIcons8Call501} alt="Call" className="w-6 h-6" />
                    <span className="font-poppins text-sm text-black">{member.phone}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Sgt at Arms - In Same Grid */}
            <div className="flex justify-center lg:justify-start lg:pl-6">
              <div className="w-full max-w-[230px]">
                <div className="bg-pink-600 rounded-[32px] aspect-[230/247] mb-4"></div>
                <p className="font-playfair font-medium text-lg text-text-pink-600 mb-1">sgt at arms</p>
                <p className="font-poppins text-lg text-black mb-2">J.M.D. Jayasundara</p>
                <p className="font-poppins text-[15px] text-[#707070] leading-5 mb-3">Faculty of Management Studies</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <img src={images.imgIcons8LinkedIn501} alt="LinkedIn" className="w-7 h-7" />
                  <img src={images.imgIcons8Call501} alt="Call" className="w-6 h-6" />
                  <span className="font-poppins text-sm text-black">+94 70 1127907</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contribution Section */}
      <section className="relative h-[363px] overflow-hidden">
        <img src={images.imgRectangle44} alt="Contribute" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/50"></div>

        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
          <h2 className="font-playfair font-medium text-3xl lg:text-5xl text-white mb-6">
            Every Contribution Matters!
          </h2>
          <p className="font-poppins font-medium text-lg text-white max-w-3xl mb-4">
            Whether big or small, your support enables us to continue making a difference in the lives of those we serve.
          </p>
          <p className="font-poppins font-medium text-lg text-white">
            Contact us at: rotaract.sabaragamuwa@gmail.com
          </p>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}