"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { images } from "../assets/images";
import ProjectCarousel from "./components/ProjectCarousel";
// import GalleryGrid from './components/GalleryGrid'; // Unused in your snippet, but kept commented
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import MotionWrapper from "./components/MotionWrapper"; // Added animation wrapper
import { motion } from "framer-motion";

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
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    // Fetch ALL events/projects
    const q = query(collection(db, "events"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAllProjects(list);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching projects:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Fetch gallery images
    const fetchGalleryImages = async () => {
      try {
        setGalleryLoading(true);
        const response = await fetch("/api/gallery");
        if (response.ok) {
          const data = await response.json();
          setGalleryImages(data.images?.slice(0, 8) || []); // Get first 8 images
        }
      } catch (error) {
        console.error("Error fetching gallery:", error);
      } finally {
        setGalleryLoading(false);
      }
    };

    fetchGalleryImages();
  }, []);
  // --- 2. Filtering Logic ---

  // Filter for "Our Projects" (Completed/Happened) - Sort Newest First
  const completedProjects = useMemo(() => {
    return (
      allProjects
        .filter((p) => {
          const status = p.status?.toLowerCase() || "";
          return (
            status === "happened" || status === "completed" || status === "past"
          );
        })
        .sort((a, b) => {
          const ta = a.date ? new Date(a.date).getTime() : 0;
          const tb = b.date ? new Date(b.date).getTime() : 0;
          return tb - ta;
        })
        // Map Firebase fields to the format ProjectCarousel expects
        .map((p) => ({
          id: p.id,
          image: p.imageUrl || images.imgRectangle20, // Fallback image
          title: p.title || p.name,
          description: p.description || "No description available.",
        }))
    );
  }, [allProjects]);

  // Filter for "Upcoming Projects" - Sort Soonest First
  const upcomingProjects = useMemo(() => {
    return allProjects
      .filter((p) => {
        const status = p.status?.toLowerCase() || "";
        return status === "upcoming";
      })
      .sort((a, b) => {
        const ta = a.date ? new Date(a.date).getTime() : Infinity;
        const tb = b.date ? new Date(b.date).getTime() : Infinity;
        return ta - tb;
      })
      .slice(0, 3); // Limit to 3 for the grid layout
  }, [allProjects]);

  // --- Dynamic Data (Leadership) ---
  // --- Dynamic Data (Monthly Stars) ---
  type MonthlyStar = {
    image: string;
    images?: string[];
    name: string;
    faculty: string;
    type: "director" | "rotaractor";
  };
  const [directorOfMonth, setDirectorOfMonth] = useState<MonthlyStar | null>(
    null
  );
  const [rotaractorOfMonth, setRotaractorOfMonth] =
    useState<MonthlyStar | null>(null);
  const [rotaractorFlyerIndex, setRotaractorFlyerIndex] = useState(0);
  useEffect(() => {
    // Fetch monthly stars from Firestore
    const fetchMonthlyStars = async () => {
      const { getDocs, collection } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");
      const querySnapshot = await getDocs(collection(db, "monthlyStars"));
      querySnapshot.forEach((doc) => {
        const data = doc.data() as MonthlyStar;
        if (data.type === "director") setDirectorOfMonth(data);
        if (data.type === "rotaractor") setRotaractorOfMonth(data);
      });
    };
    fetchMonthlyStars();
  }, []);
  const rotaractorFlyers = useMemo(() => {
    if (!rotaractorOfMonth) return [];
    if (
      Array.isArray(rotaractorOfMonth.images) &&
      rotaractorOfMonth.images.length > 0
    ) {
      return rotaractorOfMonth.images;
    }
    if (rotaractorOfMonth.image) return [rotaractorOfMonth.image];
    return [];
  }, [rotaractorOfMonth]);

  useEffect(() => {
    setRotaractorFlyerIndex(0);
    if (rotaractorFlyers.length <= 1) return;
    const intervalId = setInterval(() => {
      setRotaractorFlyerIndex((prev) => (prev + 1) % rotaractorFlyers.length);
    }, 3000);
    return () => clearInterval(intervalId);
  }, [rotaractorFlyers]);
  type LeadershipMember = {
    id: string;
    name?: string;
    role?: string;
    faculty?: string;
    phone?: string;
    photo?: string;
    linkedin?: string;
    positionOrder?: number;
  };
  const [leadershipTeam, setLeadershipTeam] = useState<LeadershipMember[]>([]);
  useEffect(() => {
    const q = query(collection(db, "leaderboard"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as LeadershipMember)
      );
      setLeadershipTeam(
        list.sort((a, b) => (a.positionOrder ?? 999) - (b.positionOrder ?? 999))
      );
    });
    return () => unsubscribe();
  }, []);

  // Helper function to create URL-friendly slug
  const createSlug = (project: Project) => {
    const name = project.title || project.name || 'project';
    const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric with hyphens
        .replace(/^-+|-+$/g, '');      // Remove leading/trailing hyphens
    return `${slug}-${project.id}`;
  };

  return (
    <div className="bg-white relative w-full">
      {/* Navigation */}
      <Navbar currentPage="home" />

      {/* Hero Section */}
      <section className="relative min-h-[600px] lg:min-h-[750px] flex items-start px-4 lg:px-16 pt-10 lg:pt-14 pb-16">
        <MotionWrapper className="max-w-[1440px] mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            <h1 className="font-playfair font-medium text-4xl lg:text-5xl leading-tight">
              <span className="text-text-pink-600">Serve. Grow. Lead.</span>
              <br />
              <span className="text-black text-3xl lg:text-4xl">
                Make Your Mark.
              </span>
            </h1>

            <p className="font-poppins text-[15px] text-[#343434] leading-relaxed max-w-lg">
              We're the Rotaract Club of SUSL, a vibrant community of students
              committed to creating lasting change, one project at a time. Dive
              into our impactful service projects, sharpen your professional
              skills, and connect with future leaders.{" "}
              <span className="font-bold">
                Your journey to global impact starts right here.
              </span>
            </p>

            <div className="flex gap-4 pt-2">
              <a
                href="/about"
                className="bg-pink-600 text-white px-6 py-3 rounded-full font-poppins font-medium text-sm hover:bg-opacity-90 text-center transition-transform hover:scale-105"
              >
                Learn More
              </a>
              <a
                href="/join"
                className="border border-black text-black px-6 py-3 rounded-full font-poppins font-medium text-sm hover:bg-black hover:text-white transition transition-transform hover:scale-105 text-center"
              >
                Join Us
              </a>
            </div>
          </div>

          {/* Right Images */}
          <div className="relative h-[400px] lg:h-[500px]">
            {/* Main Large Image - Top Left */}
            <div className="absolute top-0 left-0 w-[65%] h-[60%] rounded-[59px] shadow-lg overflow-hidden z-10">
              <img
                src={images.imgImage1}
                alt="Community"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Bottom Right Image */}
            <div className="absolute bottom-0 right-0 w-[48%] h-[35%] rounded-[44px] shadow-lg overflow-hidden z-20">
              <img
                src={images.decor1}
                alt="Service"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Middle Right Image - Overlapping */}
            <div className="absolute top-[22%] right-[18%] w-[42%] h-[40%] rounded-[33px] shadow-lg overflow-hidden z-30">
              <img
                src={images.decor2}
                alt="Fellowship"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Decorative Dots */}
            <img
              src={images.imgEllipse1}
              alt=""
              className="absolute bottom-24 right-2 w-3 h-3 z-5"
            />
            <img
              src={images.imgEllipse3}
              alt=""
              className="absolute bottom-20 right-6 w-2 h-2 z-5"
            />
            <img
              src={images.imgEllipse2}
              alt=""
              className="absolute top-10 right-10 w-2.5 h-2.5 z-5"
            />
          </div>
        </MotionWrapper>
      </section>

      {/* Values Banner */}
      <section className="bg-pink-600 py-12 lg:py-16">
        <div className="max-w-[1300px] mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Service */}
          <MotionWrapper delay={0.1} whileHover={{ y: -10, transition: { duration: 0.2 } }} className="bg-white rounded-[33px] shadow-lg p-6 flex flex-col min-h-[220px] hover:shadow-2xl">
            <img
              src={images.imgIcons8Heart601}
              alt="Service"
              className="w-[60px] h-[60px] mb-4"
            />
            <h3 className="font-playfair font-medium text-2xl text-black mb-3">
              Service
            </h3>
            <div className="h-px bg-pink-600 w-3/4 mb-4"></div>
            <p className="font-poppins text-[15px] text-[#625f5f] leading-relaxed">
              Dedicated to serving our community and making a positive impact.
            </p>
          </MotionWrapper>

          {/* Fellowship */}
          <MotionWrapper delay={0.2} whileHover={{ y: -10, transition: { duration: 0.2 } }} className="bg-white rounded-[33px] shadow-lg p-6 flex flex-col min-h-[220px] hover:shadow-2xl">
            <img
              src={images.imgIcons8UserAccount641}
              alt="Fellowship"
              className="w-[44px] h-[44px] mb-4"
            />
            <h3 className="font-playfair font-medium text-2xl text-black mb-3">
              Fellowship
            </h3>
            <div className="h-px bg-pink-600 w-3/4 mb-4"></div>
            <p className="font-poppins text-[15px] text-[#625f5f] leading-relaxed">
              Building lasting friendships and professional networks.
            </p>
          </MotionWrapper>

          {/* Leadership */}
          <MotionWrapper delay={0.3} whileHover={{ y: -10, transition: { duration: 0.2 } }} className="bg-white rounded-[33px] shadow-lg p-6 flex flex-col min-h-[220px] hover:shadow-2xl">
            <img
              src={images.imgIcons8Leadership481}
              alt="Leadership"
              className="w-[33px] h-[33px] mb-4"
            />
            <h3 className="font-playfair font-medium text-2xl text-black mb-3">
              Leadership
            </h3>
            <div className="h-px bg-pink-600 w-3/4 mb-4"></div>
            <p className="font-poppins text-[15px] text-[#625f5f] leading-relaxed">
              Developing future leaders through hands-on experience.
            </p>
          </MotionWrapper>

          {/* Excellence */}
          <MotionWrapper delay={0.4} whileHover={{ y: -10, transition: { duration: 0.2 } }} className="bg-white rounded-[33px] shadow-lg p-6 flex flex-col min-h-[220px] hover:shadow-2xl">
            <img
              src={images.imgIcons8Badge501}
              alt="Excellence"
              className="w-[31px] h-[31px] mb-4"
            />
            <h3 className="font-playfair font-medium text-2xl text-black mb-3">
              Excellence
            </h3>
            <div className="h-px bg-pink-600 w-3/4 mb-4"></div>
            <p className="font-poppins text-[15px] text-[#625f5f] leading-relaxed">
              Striving for excellence in everything we do.
            </p>
          </MotionWrapper>
        </div>
      </section>

      {/* Who are we Section */}
      <section id="about" className="bg-[#e9e9e9] py-16 lg:py-24">
        <MotionWrapper className="max-w-7xl mx-auto px-4 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div>
              <h2 className="font-playfair font-medium text-4xl lg:text-5xl text-black mb-6">
                Who are we?
              </h2>
              <p className="font-poppins text-[15px] text-black leading-relaxed mb-6">
                We are the Rotaract Club of Sabaragamuwa University of Sri Lanka
                (SUSL), a dynamic, youth-led volunteer organization dedicated to
                service, fellowship, and professional growth. Affiliated with
                Rotary International, our club brings together passionate
                undergraduates from various faculties who are committed to
                making a tangible, positive impact both within our university
                community and across the Sabaragamuwa region. We're more than
                just a club; we're a platform for developing leadership skills,
                expanding professional networks, and channeling the collective
                energy of the student body into sustainable, impactful projects
                that address real-world needs. We strive to embody Rotary's
                motto of "Service Above Self" while fostering lifelong
                friendships and shaping ethical leaders for tomorrow.
              </p>
              <a
                href="/about"
                className="bg-pink-600 text-white px-6 py-3 rounded-full font-poppins font-medium text-sm hover:bg-opacity-90 inline-block transition-transform hover:scale-105"
              >
                Learn More
              </a>
            </div>

            <div className="relative h-[400px]">
              <div className="absolute top-0 right-0 w-3/5 h-4/5 rounded-[57px] shadow-lg overflow-hidden">
                <img
                  src={images.imgRectangle14}
                  alt="Club Activity"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Replaced pink placeholder with rose image */}
              <div className="absolute bottom-0 left-0 w-1/2 h-3/5 rounded-[46px] overflow-hidden shadow-lg">
                <img
                  src={images.imgRectangle16}
                  alt="Rose Decoration"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </MotionWrapper>
      </section>

      {/* Statistics */}
      <section className="bg-[#e9e9e9] pb-16">
        <MotionWrapper className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div>
              <p className="font-prata text-5xl text-text-pink-600 mb-2">1+</p>
              <p className="font-poppins font-medium text-base text-black">
                Years of Service
              </p>
            </div>
            <div>
              <p className="font-prata text-5xl text-text-pink-600 mb-2">30+</p>
              <p className="font-poppins font-medium text-base text-black">
                Total Projects
              </p>
            </div>
            <div>
              <p className="font-prata text-5xl text-text-pink-600 mb-2">
                800+
              </p>
              <p className="font-poppins font-medium text-base text-black">
                Members
              </p>
            </div>
            <div>
              <p className="font-prata text-5xl text-text-pink-600 mb-2">8</p>
              <p className="font-poppins font-medium text-base text-black">
                Faculties
              </p>
            </div>
          </div>
        </MotionWrapper>
      </section>

      {/* Join Rotaract Banner */}
      <section className="relative h-[341px] overflow-hidden">
        <img
          src={images.imgRectangle15}
          alt="Join Us"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60"></div>
        <MotionWrapper className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
          <h2 className="font-playfair font-medium text-3xl lg:text-5xl text-white mb-4">
            Be the Change.{" "}
            <span className="text-text-pink-600">Join Rotaract!</span>
          </h2>
          <p className="font-poppins font-medium text-base text-white max-w-4xl mb-6">
            Ready to find your purpose and a supportive network? Join the
            Rotaract Club of Sabaragamuwa to gain leadership experience and
            create real, sustainable impact in our community. Start your journey
            of service and growth today.
          </p>
          <a
            href="/join"
            className="bg-pink-600 text-white px-6 py-3 rounded-full font-poppins font-medium text-sm hover:bg-opacity-90 transition-transform hover:scale-105"
          >
            Join Us
          </a>
        </MotionWrapper>
      </section>

      {/* Our Projects (COMPLETED PROJECTS CAROUSEL) */}
      <section id="projects" className="py-16 lg:py-24">
        <MotionWrapper className="max-w-7xl mx-auto px-4 lg:px-16">
          <h2 className="font-playfair font-medium text-4xl lg:text-5xl text-black text-center mb-8">
            Our Projects
          </h2>
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 max-w-5xl mx-auto mb-12">
            <p className="font-poppins font-medium text-sm lg:text-base text-black leading-relaxed text-center lg:text-left flex-1">
              Our club is driven by impactful, student-led projects. We focus on
              key areas like Community Development, Professional Growth, and
              Environmental Sustainability right here in the Sabaragamuwa
              region. Every initiative, from career workshops to green
              campaigns, is carefully planned to create real, measurable change.
              Explore our work to see our commitment in action!
            </p>
            <div className="text-center lg:text-right">
              <a
                href="/projects"
                className="bg-pink-600 text-white px-6 py-3 rounded-full font-poppins font-medium text-sm hover:bg-opacity-90 inline-block transition-transform hover:scale-105"
              >
                See All Projects
              </a>
            </div>
          </div>

          <div className="mb-12">
            {/* Passing dynamic completed projects here */}
            {loading ? (
              <div className="text-center py-10">Loading Projects...</div>
            ) : (
              <ProjectCarousel projects={completedProjects as any} />
            )}
          </div>
        </MotionWrapper>
      </section>

      {/* Upcoming Projects (DYNAMIC GRID) */}
      <section className="py-16">
        <MotionWrapper className="max-w-7xl mx-auto px-4">
          {/* Outer pink border container */}
          <div className="bg-pink-600 rounded-[51px] p-1">
            {/* Inner white container */}
            <div className="bg-white rounded-[51px] p-12 lg:p-16">
              <h2 className="font-playfair font-medium text-4xl lg:text-5xl text-text-pink-600 text-center mb-12">
                Upcoming Projects
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {loading && (
                  <div className="col-span-3 text-center">
                    Loading Upcoming Projects...
                  </div>
                )}

                {!loading && upcomingProjects.length === 0 && (
                  <div className="col-span-3 text-center text-gray-500">
                    No upcoming projects scheduled at the moment.
                  </div>
                )}

                {upcomingProjects.map((project) => {
                  const isRecruiting = project.isOcCalling && !project.ocCallingEnded;
                  const targetHref = isRecruiting ? `/apply-projects` : `/projects/${createSlug(project)}`;
                  return (
                    <Link
                      href={targetHref}
                      key={project.id}
                      className="block"
                    >
                      <MotionWrapper
                        delay={0.1}
                        variant="fadeInUp"
                        whileHover={{ scale: 1.03 }}
                        className="bg-black rounded-[41px] h-[300px] relative overflow-hidden flex items-end group cursor-pointer transition-transform"
                      >
                        {/* Image Background */}
                        <img
                          src={project.imageUrl || images.imgRectangle44}
                          alt={project.title || project.name}
                          className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-300"
                        />

                        {/* Content Overlay */}
                        <div className="relative z-10 p-6 w-full bg-gradient-to-t from-black/90 to-transparent">
                          <p className="font-playfair text-white text-xl mb-1 font-bold line-clamp-1">
                            {project.title || project.name}
                          </p>
                          <div className="flex justify-between items-center gap-2">
                            <p className="font-poppins text-[12px] text-text-pink-600">
                              {project.date || "Date TBA"}
                            </p>
                            {isRecruiting ? (
                              <span className="text-xs font-bold text-pink-300 bg-pink-950/80 border border-pink-400 px-2.5 py-0.5 rounded-full">
                                Recruiting OC
                              </span>
                            ) : (
                              <span className="text-xs text-white border border-white px-2 py-1 rounded-full">
                                Upcoming
                              </span>
                            )}
                          </div>
                        </div>
                      </MotionWrapper>
                    </Link>
                  );
                })}

                {/* Fillers if less than 3 projects, just to keep layout nice (Optional) */}
                {!loading &&
                  upcomingProjects.length > 0 &&
                  upcomingProjects.length < 3 && (
                    <div className="bg-gray-100 rounded-[41px] h-[300px] flex items-center justify-center border-2 border-dashed border-gray-300">
                      <p className="font-poppins text-gray-400 text-center px-4">
                        More projects coming soon...
                      </p>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </MotionWrapper>
      </section>

      {/* Cherished Memories Header */}
      <section id="gallery" className="bg-pink-600 py-12">
        <MotionWrapper className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="font-playfair font-medium text-4xl lg:text-5xl text-white mb-4">
            Cherished Memories
          </h2>
          <p className="font-poppins font-medium text-sm text-white max-w-5xl mx-auto">
            Our photo gallery is a vibrant showcase of the fellowship and
            dedicated service that defines our club. These images capture the
            energy from our projects, reflecting the tangible impact and
            unforgettable memories we create together.
          </p>
        </MotionWrapper>
      </section>

      {/* Gallery Grid - Separate Grey Container */}
      <section className="bg-white py-8">
        <MotionWrapper className="max-w-7xl mx-auto px-4">
          <div className="bg-[#d9d9d9] rounded-[43px] py-12 px-6">
            {galleryLoading ? (
              <div className="text-center py-10">
                <p className="text-lg text-gray-600">Loading gallery...</p>
              </div>
            ) : galleryImages.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {galleryImages.map((img, index) => (
                  <MotionWrapper
                    key={index}
                    delay={index * 0.1} // Staggered delay for each image
                    variant="scaleUp" // Using scaleUp for a nice pop effect
                    className="rounded-[20px] overflow-hidden bg-gray-300 aspect-square"
                  >
                    <img
                      src={img.url || images.imgRectangle20}
                      alt={`Gallery ${index + 1}`}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                    />
                  </MotionWrapper>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-lg text-gray-600">No gallery images yet</p>
              </div>
            )}

            <div className="text-center mt-8">
              <a
                href="/gallery"
                className="bg-pink-600 text-white px-6 py-3 rounded-full font-poppins font-medium text-sm hover:bg-opacity-90 inline-block transition-transform hover:scale-105"
              >
                See More
              </a>
            </div>
          </div>
        </MotionWrapper>
      </section>

      {/* Service Stars */}
      <section className="bg-[#eeeeee] py-16 lg:py-24">
        <MotionWrapper className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="font-playfair font-medium text-4xl lg:text-5xl text-black mb-4">
            Our Service Stars
          </h2>
          <p className="font-playfair font-medium text-2xl text-text-pink-600 mb-6">
            Celebrating Dedication
          </p>
          <p className="font-poppins font-medium text-sm text-black max-w-4xl mx-auto mb-12">
            Recognizing the Rotaractors and Directors whose unwavering
            commitment and passion have driven our mission and delivered
            exceptional impact this month. Their enthusiasm is the engine of our
            club.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Director of the Month (Dynamic) */}
            <MotionWrapper delay={0.1} variant="fadeInLeft" whileHover={{ y: -5 }} className="bg-pink-600 rounded-[37px] shadow-lg p-8 relative flex flex-col transition-shadow hover:shadow-2xl">
              <p className="font-playfair font-medium text-[32px] text-white mb-1">
                Director
              </p>
              <p className="font-poppins font-light text-[17px] text-white mb-6">
                of the Month
              </p>
              <img
                src={
                  directorOfMonth?.image
                    ? `https://res.cloudinary.com/dvqoiqzxe/image/upload/${directorOfMonth.image}`
                    : "https://placehold.co/300x300?text=Director+of+Month"
                }
                alt="Director of the Month"
                className="rounded-[32px] h-[360px] lg:h-[420px] mb-6 flex-shrink-0 w-full object-contain"
              />
              <p className="font-playfair font-medium text-[28px] text-white mb-1">
                {directorOfMonth?.name || "\u00A0"}
              </p>
              <p className="font-poppins text-[19px] text-[#d9d9d9]">
                {directorOfMonth?.faculty || "\u00A0"}
              </p>
            </MotionWrapper>

            {/* Rotaractor of the Month (Dynamic) */}
            <MotionWrapper delay={0.2} variant="fadeInRight" whileHover={{ y: -5 }} className="bg-pink-600 rounded-[37px] shadow-lg p-8 relative flex flex-col transition-shadow hover:shadow-2xl">
              <p className="font-playfair font-medium text-[32px] text-white mb-1">
                Rotaractor
              </p>
              <p className="font-poppins font-light text-[17px] text-white mb-6">
                of the Month
              </p>
              <img
                src={
                  rotaractorFlyers.length > 0
                    ? `https://res.cloudinary.com/dvqoiqzxe/image/upload/${rotaractorFlyers[rotaractorFlyerIndex]}`
                    : "https://placehold.co/300x300?text=Rotaractor+of+Month"
                }
                alt="Rotaractor of the Month"
                className="rounded-[32px] h-[360px] lg:h-[420px] mb-6 flex-shrink-0 w-full object-contain"
              />
              {rotaractorFlyers.length > 1 && (
                <div className="flex items-center justify-center gap-2 mb-4">
                  {rotaractorFlyers.map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setRotaractorFlyerIndex(index)}
                      className={`w-2.5 h-2.5 rounded-full transition ${
                        index === rotaractorFlyerIndex
                          ? "bg-white"
                          : "bg-white/40 hover:bg-white/70"
                      }`}
                      aria-label={`Show Rotaractor flyer ${index + 1}`}
                    />
                  ))}
                </div>
              )}

              <p className="font-playfair font-medium text-[28px] text-white mb-1">
                {rotaractorOfMonth?.name || "\u00A0"}
              </p>
              <p className="font-poppins text-[19px] text-[#d9d9d9]">
                {rotaractorOfMonth?.faculty || "\u00A0"}
              </p>
            </MotionWrapper>
          </div>
        </MotionWrapper>
      </section>

      {/* Leadership Section */}
      <section id="leadership" className="bg-[#e9e9e9] py-16 lg:py-24">
        <MotionWrapper
          className="max-w-6xl mx-auto px-4"
          viewport={{ once: true, amount: 0 }}
        >
          <h2 className="font-playfair font-medium text-4xl lg:text-5xl text-black text-center mb-6">
            Our Leadership
          </h2>
          <p className="font-poppins font-medium text-base text-black text-center max-w-3xl mx-auto mb-12">
            Meet the dedicated team leading our club towards excellence and
            positive impact.
          </p>

          {/* Unified Leadership Container */}
          <div className="bg-[#d9d9d9] rounded-[39px] p-8 lg:p-10">
            {/* Leadership Grid - All 9 Members */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {leadershipTeam.map((member, i) => (
                <MotionWrapper
                  key={member.id || i}
                  delay={i * 0.1} // Staggered delay for each card
                  variant="fadeInUp"
                  className="flex flex-col"
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden rounded-[32px] mb-4 aspect-[230/247]"
                  >
                    <img
                      src={
                        member.photo ||
                        "/assets/leadership/placeholder-230x247.png"
                      }
                      alt={member.name}
                      className="bg-pink-600 w-full h-full object-cover"
                    />
                  </motion.div>
                  <p className="font-playfair font-medium text-lg text-text-pink-600 mb-1">
                    {member.role}
                  </p>
                  <p className="font-poppins text-lg text-black mb-2">
                    {member.name}
                  </p>
                  <p className="font-poppins text-[15px] text-[#707070] leading-5 mb-3">
                    {member.faculty}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {member.linkedin ? (
                      <a
                        href={member.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <img
                          src={images.imgIcons8LinkedIn501}
                          alt="LinkedIn"
                          className="w-7 h-7"
                        />
                      </a>
                    ) : (
                      <img
                        src={images.imgIcons8LinkedIn501}
                        alt="LinkedIn"
                        className="w-7 h-7 opacity-40"
                      />
                    )}
                    <img
                      src={images.imgIcons8Call501}
                      alt="Call"
                      className="w-6 h-6"
                    />
                    <span className="font-poppins text-sm text-black">
                      {member.phone}
                    </span>
                  </div>
                </MotionWrapper>
              ))}
            </div>
          </div>
        </MotionWrapper>
      </section>

      {/* Contribution Section */}
      <section className="relative h-[363px] overflow-hidden">
        <img
          src={images.imgRectangle44}
          alt="Contribute"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50"></div>
        <MotionWrapper className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
          <h2 className="font-playfair font-medium text-3xl lg:text-5xl text-white mb-6">
            Every Contribution Matters!
          </h2>
          <p className="font-poppins font-medium text-lg text-white max-w-3xl mb-4">
            Whether big or small, your support enables us to continue making a
            difference in the lives of those we serve.
          </p>
          <p className="font-poppins font-medium text-lg text-white">
            Contact us at: info@rotaractsusl.org
          </p>
        </MotionWrapper>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
