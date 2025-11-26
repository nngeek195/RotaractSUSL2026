"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
    collection,
    doc,
    getDocs,
    setDoc,
    updateDoc,
} from "firebase/firestore";

const CLOUDINARY_UPLOAD_URL = "https://api.cloudinary.com/v1_1/dvqoiqzxe/image/upload";
const CLOUDINARY_UPLOAD_PRESET = "monthly_stars_upload"; // Replace with your actual preset name from Cloudinary

const initialState = {
    image: "",
    name: "",
    faculty: "",
    quote: "",
};

export default function MonthlyStarsAdmin() {
    const [selectedType, setSelectedType] = useState("director");
    const [currentData, setCurrentData] = useState(initialState);
    const [savedDirector, setSavedDirector] = useState(initialState);
    const [savedRotaractor, setSavedRotaractor] = useState(initialState);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        // Fetch current data from Firestore for preview
        const fetchData = async () => {
            const querySnapshot = await getDocs(collection(db, "monthlyStars"));
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.type === "director") setSavedDirector(data);
                if (data.type === "rotaractor") setSavedRotaractor(data);
            });
        };
        fetchData();
    }, []);

    const handleImageUpload = async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
        formData.append("folder", "MonthlyStars"); // Upload to specific folder
        setLoading(true);
        setMessage("");
        try {
            const res = await fetch(CLOUDINARY_UPLOAD_URL, {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            if (data.secure_url) {
                setCurrentData((prev) => ({ ...prev, image: data.secure_url }));
                setMessage("Image uploaded successfully.");
            } else {
                setMessage("Image upload failed.");
            }
        } catch (err) {
            setMessage("Image upload error.");
        }
        setLoading(false);
    }; const handleSave = async () => {
        setLoading(true);
        setMessage("");
        try {
            await setDoc(doc(db, "monthlyStars", selectedType), { ...currentData, type: selectedType });
            setMessage("Saved successfully.");
            // Update the saved data state
            if (selectedType === "director") {
                setSavedDirector({ ...currentData, type: selectedType });
            } else {
                setSavedRotaractor({ ...currentData, type: selectedType });
            }
            // Clear the form
            setCurrentData(initialState);
        } catch (err) {
            setMessage("Save failed.");
        }
        setLoading(false);
    };

    return (
        <div className="max-w-7xl mx-auto py-12 px-4">
            <h2 className="font-playfair text-3xl mb-8 text-center">Monthly Stars Admin Panel</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Left Side - Form */}
                <div className="space-y-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="font-bold text-xl mb-6">Update Monthly Star</h3>

                        {/* Type Selector */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Select Type</label>
                            <select
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value)}
                                className="w-full border p-2 rounded"
                            >
                                <option value="director">Director of the Month</option>
                                <option value="rotaractor">Rotaractor of the Month</option>
                            </select>
                        </div>

                        {/* Image Upload */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                    handleImageUpload(e.target.files[0])
                                }
                                className="w-full"
                            />
                            {currentData.image && (
                                <img
                                    src={currentData.image}
                                    alt="Preview"
                                    className="mt-2 rounded w-full h-48 object-cover"
                                />
                            )}
                        </div>

                        {/* Name */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                            <input
                                type="text"
                                placeholder="Enter name"
                                value={currentData.name}
                                onChange={(e) =>
                                    setCurrentData((prev) => ({ ...prev, name: e.target.value }))
                                }
                                className="w-full border p-2 rounded"
                            />
                        </div>

                        {/* Faculty */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Faculty</label>
                            <select
                                value={currentData.faculty}
                                onChange={(e) =>
                                    setCurrentData((prev) => ({ ...prev, faculty: e.target.value }))
                                }
                                className="w-full border p-2 rounded"
                            >
                                <option value="">Select Faculty</option>
                                <option value="Faculty of Applied Sciences">Faculty of Applied Sciences</option>
                                <option value="Faculty of Agricultural Sciences">Faculty of Agricultural Sciences</option>
                                <option value="Faculty of Geomatics">Faculty of Geomatics</option>
                                <option value="Faculty of Management Studies">Faculty of Management Studies</option>
                                <option value="Faculty of Medicine">Faculty of Medicine</option>
                                <option value="Faculty of Social Sciences & Languages">Faculty of Social Sciences & Languages</option>
                                <option value="Faculty of Technology">Faculty of Technology</option>
                                <option value="Faculty of Computing">Faculty of Computing</option>
                            </select>
                        </div>

                        {/* Quote */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Quote</label>
                            <textarea
                                placeholder="Enter quote"
                                value={currentData.quote}
                                onChange={(e) =>
                                    setCurrentData((prev) => ({ ...prev, quote: e.target.value }))
                                }
                                className="w-full border p-2 rounded h-24"
                            />
                        </div>

                        {/* Save Button */}
                        <button
                            onClick={handleSave}
                            className="bg-pink-600 text-white px-6 py-3 rounded w-full font-medium"
                            disabled={loading}
                        >
                            {loading ? "Saving..." : `Save ${selectedType === "director" ? "Director" : "Rotaractor"}`}
                        </button>
                    </div>
                </div>

                {/* Right Side - Preview */}
                <div className="space-y-6">
                    <h3 className="font-bold text-xl">Current Saved Details</h3>

                    {/* Director Preview */}
                    <div className="bg-pink-600 rounded-[37px] shadow-lg p-8 relative flex flex-col">
                        <p className="font-playfair font-medium text-[32px] text-white mb-1">Director</p>
                        <p className="font-poppins font-light text-[17px] text-white mb-6">of the Month</p>
                        {savedDirector.image ? (
                            <img
                                src={savedDirector.image}
                                alt="Director of the Month"
                                className="bg-white rounded-[32px] h-[280px] mb-6 flex-shrink-0 w-full object-cover"
                            />
                        ) : (
                            <div className="bg-white rounded-[32px] h-[280px] mb-6 flex items-center justify-center">
                                <p className="text-gray-500">No image uploaded</p>
                            </div>
                        )}
                        <p className="font-playfair font-medium text-[24px] text-white mb-1">
                            {savedDirector.name || "Director Name"}
                        </p>
                        <p className="font-poppins text-[16px] text-[#d9d9d9] mb-4">
                            {savedDirector.faculty || "Director Faculty"}
                        </p>
                        <p className="font-poppins font-medium italic text-[15px] text-white leading-relaxed">
                            {savedDirector.quote || "Director quote goes here."}
                        </p>
                    </div>

                    {/* Rotaractor Preview */}
                    <div className="bg-pink-600 rounded-[37px] shadow-lg p-8 relative flex flex-col">
                        <p className="font-playfair font-medium text-[32px] text-white mb-1">Rotaractor</p>
                        <p className="font-poppins font-light text-[17px] text-white mb-6">of the Month</p>
                        {savedRotaractor.image ? (
                            <img
                                src={savedRotaractor.image}
                                alt="Rotaractor of the Month"
                                className="bg-white rounded-[32px] h-[280px] mb-6 flex-shrink-0 w-full object-cover"
                            />
                        ) : (
                            <div className="bg-white rounded-[32px] h-[280px] mb-6 flex items-center justify-center">
                                <p className="text-gray-500">No image uploaded</p>
                            </div>
                        )}
                        <p className="font-playfair font-medium text-[24px] text-white mb-1">
                            {savedRotaractor.name || "Rotaractor Name"}
                        </p>
                        <p className="font-poppins text-[16px] text-[#d9d9d9] mb-4">
                            {savedRotaractor.faculty || "Rotaractor Faculty"}
                        </p>
                        <p className="font-poppins font-medium italic text-[15px] text-white leading-relaxed">
                            {savedRotaractor.quote || "Rotaractor quote goes here."}
                        </p>
                    </div>
                </div>
            </div>
            {message && <div className="mt-6 text-center text-pink-600 font-medium">{message}</div>}
        </div>
    );
}
