"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, setDoc, doc } from "firebase/firestore";
import {
    Upload, Save, Loader2, User, Trophy, Quote,
    Smartphone, RotateCw, CheckCircle2, AlertCircle, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CLOUDINARY_UPLOAD_URL = "https://api.cloudinary.com/v1_1/dvqoiqzxe/image/upload";
const CLOUDINARY_UPLOAD_PRESET = "monthly_stars_upload";

const initialState = {
    image: "",
    images: [],
    name: "",
    faculty: "",
    quote: "",
};

export default function MonthlyStarsAdmin() {
    const [activeTab, setActiveTab] = useState("director"); // 'director' | 'rotaractor'
    const [directorData, setDirectorData] = useState(initialState);
    const [rotaractorData, setRotaractorData] = useState(initialState);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState({ show: false, message: "", type: "success" });

    // Helper to get current active data/setter
    const currentData = activeTab === "director" ? directorData : rotaractorData;
    const setCurrentData = activeTab === "director" ? setDirectorData : setRotaractorData;

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, "monthlyStars"));
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const normalizedData = {
                    ...initialState,
                    ...data,
                    images: Array.isArray(data.images) ? data.images : (data.image ? [data.image] : []),
                };
                if (doc.id === "director") setDirectorData(normalizedData);
                if (doc.id === "rotaractor") setRotaractorData(normalizedData);
            });
        } catch (error) {
            console.error("Error fetching data:", error);
            showToast("Failed to load data", "error");
        }
        setLoading(false);
    };

    const uploadImageToCloudinary = async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
        formData.append("folder", "MonthlyStars");
        const res = await fetch(CLOUDINARY_UPLOAD_URL, { method: "POST", body: formData });
        const data = await res.json();
        return data?.public_id || "";
    };

    const handleImageUpload = async (files) => {
        if (!files || files.length === 0) return;
        setSaving(true); // Re-using saving spinner for upload
        try {
            const selectedFiles = Array.from(files);
            if (activeTab === "director") {
                const publicId = await uploadImageToCloudinary(selectedFiles[0]);
                if (!publicId) {
                    showToast("Upload failed", "error");
                    return;
                }
                setCurrentData((prev) => ({ ...prev, image: publicId }));
                showToast("Image uploaded successfully");
            } else {
                const uploadedIds = [];
                for (const file of selectedFiles) {
                    const publicId = await uploadImageToCloudinary(file);
                    if (publicId) uploadedIds.push(publicId);
                }
                if (uploadedIds.length === 0) {
                    showToast("Upload failed", "error");
                    return;
                }
                setCurrentData((prev) => {
                    const existingImages = Array.isArray(prev.images) ? prev.images : (prev.image ? [prev.image] : []);
                    const nextImages = [...existingImages, ...uploadedIds];
                    return {
                        ...prev,
                        images: nextImages,
                        image: nextImages[0] || "",
                    };
                });
                showToast(`${uploadedIds.length} flyer(s) uploaded successfully`);
            }
        } catch (err) {
            console.error("Upload error:", err);
            showToast("Upload failed", "error");
        }
        setSaving(false);
    };

    const removeRotaractorImage = (indexToRemove) => {
        setRotaractorData((prev) => {
            const nextImages = (prev.images || []).filter((_, index) => index !== indexToRemove);
            return {
                ...prev,
                images: nextImages,
                image: nextImages[0] || "",
            };
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = { ...currentData, type: activeTab };
            if (activeTab === "rotaractor") {
                const normalizedImages = Array.isArray(currentData.images) ? currentData.images : (currentData.image ? [currentData.image] : []);
                payload.images = normalizedImages;
                payload.image = normalizedImages[0] || "";
            } else {
                delete payload.images;
            }
            await setDoc(doc(db, "monthlyStars", activeTab), payload);
            showToast(`${activeTab === 'director' ? 'Director' : 'Rotaractor'} updated successfully!`);
        } catch (err) {
            console.error("Save error:", err);
            showToast("Failed to save changes", "error");
        }
        setSaving(false);
    };

    const showToast = (message, type = "success") => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
    };

    const faculties = [
        "Faculty of Applied Sciences", "Faculty of Agricultural Sciences", "Faculty of Geomatics",
        "Faculty of Management Studies", "Faculty of Medicine", "Faculty of Social Sciences & Languages",
        "Faculty of Technology", "Faculty of Computing"
    ];

    return (
        <div className="max-w-7xl mx-auto pb-20 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Monthly Stars</h1>
                    <p className="text-gray-500 mt-1">Highlight the top performing members of the month.</p>
                </div>

                {/* Tabs */}
                <div className="bg-gray-100 p-1 rounded-xl inline-flex">
                    {["director", "rotaractor"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all capitalize ${activeTab === tab
                                    ? "bg-white text-gray-900 shadow-sm"
                                    : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Editor */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <User className="text-blue-500" />
                                Edit {activeTab === 'director' ? 'Director' : 'Rotaractor'} Details
                            </h2>
                            {saving && <span className="text-sm text-blue-600 font-medium animate-pulse">Saving...</span>}
                        </div>

                        <div className="space-y-6">
                            {/* Image Upload */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    {activeTab === "rotaractor" ? "Flyers" : "Profile Image"}
                                </label>
                                <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer relative group">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple={activeTab === "rotaractor"}
                                        onChange={(e) => handleImageUpload(e.target.files)}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <div className="flex flex-col items-center gap-3 text-gray-500 group-hover:text-blue-600">
                                        <div className="p-3 bg-gray-50 rounded-full group-hover:bg-white transition-colors">
                                            <Upload size={24} />
                                        </div>
                                        <p className="font-medium text-sm">
                                            {activeTab === "rotaractor"
                                                ? "Click to upload one or more flyers"
                                                : "Click to upload or drag and drop"}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {activeTab === "rotaractor"
                                                ? "You can upload multiple flyer images"
                                                : "SVG, PNG, JPG (MAX. 800x800px)"}
                                        </p>
                                    </div>
                                </div>
                                {activeTab === "rotaractor" && (
                                    <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {(rotaractorData.images || []).map((publicId, index) => (
                                            <div key={`${publicId}-${index}`} className="relative rounded-lg overflow-hidden border border-gray-200">
                                                <img
                                                    src={`https://res.cloudinary.com/dvqoiqzxe/image/upload/${publicId}`}
                                                    alt={`Rotaractor flyer ${index + 1}`}
                                                    className="w-full h-28 object-cover"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeRotaractorImage(index)}
                                                    className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-1 hover:bg-black"
                                                    title="Remove flyer"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Form Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. John Doe"
                                        value={currentData.name}
                                        onChange={(e) => setCurrentData(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Faculty</label>
                                    <select
                                        value={currentData.faculty}
                                        onChange={(e) => setCurrentData(prev => ({ ...prev, faculty: e.target.value }))}
                                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white transition-all"
                                    >
                                        <option value="">Select Faculty</option>
                                        {faculties.map((fac) => (
                                            <option key={fac} value={fac}>{fac}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Inspirational Quote</label>
                                <div className="relative">
                                    <Quote className="absolute left-3 top-3 text-gray-400" size={16} />
                                    <textarea
                                        placeholder="Enter a short quote..."
                                        value={currentData.quote}
                                        onChange={(e) => setCurrentData(prev => ({ ...prev, quote: e.target.value }))}
                                        className="w-full pl-10 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-32 resize-none transition-all"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/10 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Live Mobile Preview */}
                <div className="lg:col-span-5 flex flex-col items-center">
                    <div className="sticky top-8">
                        <div className="flex items-center gap-2 mb-4 text-gray-500 font-medium text-sm">
                            <Smartphone size={16} />
                            <span>Live Mobile Preview</span>
                        </div>

                        {/* Phone Frame */}
                        <div className="w-[320px] h-[640px] bg-gray-900 rounded-[3rem] p-3 shadow-2xl relative border-4 border-gray-800">
                            {/* Screen */}
                            <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden relative flex items-center justify-center bg-dot-pattern">
                                {/* Dynamic Content Card */}
                                <div className="w-[90%] transform scale-90 origin-center">
                                    <div className="bg-pink-600 rounded-[32px] shadow-xl p-6 relative flex flex-col text-center items-center">

                                        {/* Title */}
                                        <div className="mb-4">
                                            <h3 className="font-serif text-2xl text-white capitalize">{activeTab}</h3>
                                            <p className="font-light text-white/80 text-sm">of the Month</p>
                                        </div>

                                        {/* Image */}
                                        <div className="w-48 h-48 bg-white/10 rounded-full mb-6 p-1 relative overflow-hidden ring-4 ring-white/20">
                                            {(activeTab === "rotaractor"
                                                ? (currentData.images?.[0] || currentData.image)
                                                : currentData.image) ? (
                                                <img
                                                    src={`https://res.cloudinary.com/dvqoiqzxe/image/upload/${activeTab === "rotaractor"
                                                        ? (currentData.images?.[0] || currentData.image)
                                                        : currentData.image}`}
                                                    alt="Preview"
                                                    className="w-full h-full rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center text-gray-400">
                                                    <User size={40} />
                                                </div>
                                            )}
                                        </div>

                                        {/* Name & Faculty */}
                                        <h4 className="font-bold text-xl text-white mb-1 line-clamp-1">
                                            {currentData.name || "Name Here"}
                                        </h4>
                                        <p className="text-white/70 text-xs mb-4 line-clamp-1">
                                            {currentData.faculty || "Faculty Here"}
                                        </p>

                                        {/* Quote */}
                                        <div className="relative">
                                            <Quote size={12} className="text-white/40 absolute -top-2 -left-2 transform -scale-x-100" />
                                            <p className="text-white text-sm font-medium italic leading-relaxed px-2 line-clamp-3">
                                                "{currentData.quote || "Your inspiring quote will appear here..."}"
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Status Bar Simulation */}
                                <div className="absolute top-0 w-full h-6 bg-black/20 backdrop-blur-sm z-10" />
                                <div className="absolute bottom-1 w-1/3 h-1 bg-gray-300 rounded-full left-1/3" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Toast Notification */}
            <AnimatePresence>
                {toast.show && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className={`fixed bottom-8 right-8 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-50 ${toast.type === "error" ? "bg-red-500 text-white" : "bg-gray-900 text-white"
                            }`}
                    >
                        {toast.type === "error" ? <AlertCircle size={24} /> : <CheckCircle2 size={24} />}
                        <span className="font-bold">{toast.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
