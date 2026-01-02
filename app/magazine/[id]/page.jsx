"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import NavBar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { Loader2, ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function MagazineViewer({ params }) {
    // Determine how to unwrap params safely for different Next.js versions
    const [id, setId] = useState(null);
    const [magazine, setMagazine] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Handle params which might be a Promise in newer Next.js versions
        const unwrapParams = async () => {
            try {
                const resolvedParams = await params;
                setId(resolvedParams.id);
            } catch (e) {
                // Fallback if params is not a promise
                setId(params.id);
            }
        };
        unwrapParams();
    }, [params]);

    useEffect(() => {
        if (!id) return;

        const fetchMagazine = async () => {
            try {
                const docRef = doc(db, "magazines", id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setMagazine(docSnap.data());
                } else {
                    console.error("No such magazine!");
                }
            } catch (error) {
                console.error("Error fetching magazine:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMagazine();
    }, [id]);

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <NavBar currentPage="magazine" />
            <div className="flex-grow flex items-center justify-center">
                <Loader2 className="animate-spin text-pink-600" size={40} />
            </div>
            <Footer />
        </div>
    );

    if (!magazine) return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <NavBar currentPage="magazine" />
            <div className="flex-grow flex flex-col items-center justify-center p-4 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Magazine Not Found</h2>
                <Link href="/magazine" className="text-pink-600 hover:underline">Back to Magazines</Link>
            </div>
            <Footer />
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <NavBar currentPage="magazine" />

            <div className="flex-grow flex flex-col max-w-[1440px] mx-auto w-full px-4 md:px-8 py-6">
                {/* Header / Nav Back */}
                <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <Link
                        href="/magazine"
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-pink-600 font-medium transition-colors bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100"
                    >
                        <ArrowLeft size={18} /> Back to Library
                    </Link>

                    <div className="text-center md:text-right">
                        <h1 className="text-xl md:text-2xl font-playfair font-bold text-gray-900">{magazine.title}</h1>
                        <p className="text-sm text-gray-500 font-poppins">
                            {magazine.date ? new Date(magazine.date).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : ''}
                        </p>
                    </div>
                </div>

                {/* PDF Viewer Container */}
                <div className="flex-grow bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden relative min-h-[80vh]">
                    <iframe
                        src={magazine.pdfUrl}
                        className="absolute inset-0 w-full h-full border-0"
                        title={magazine.title}
                        allow="autoplay; fullscreen"
                        allowFullScreen
                    />
                </div>

                {/* Fallback Link for usability */}
                <div className="mt-4 text-center text-sm text-gray-500">
                    Having trouble viewing within the site? <a href={magazine.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-pink-600 font-bold hover:underline inline-flex items-center gap-1">Open in new tab <ExternalLink size={12} /></a>
                </div>
            </div>

            <Footer />
        </div>
    );
}
