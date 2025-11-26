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
    const [director, setDirector] = useState(initialState);
    const [rotaractor, setRotaractor] = useState(initialState);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        // Fetch current data from Firestore
        const fetchData = async () => {
            const querySnapshot = await getDocs(collection(db, "monthlyStars"));
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.type === "director") setDirector(data);
                if (data.type === "rotaractor") setRotaractor(data);
            });
        };
        fetchData();
    }, []);

    const handleImageUpload = async (file, setFunc) => {
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
                setFunc((prev) => ({ ...prev, image: data.secure_url }));
                setMessage("Image uploaded successfully.");
            } else {
                setMessage("Image upload failed.");
            }
        } catch (err) {
            setMessage("Image upload error.");
        }
        setLoading(false);
    };

    const handleSave = async (type, data) => {
        setLoading(true);
        setMessage("");
        try {
            await setDoc(doc(db, "monthlyStars", type), { ...data, type });
            setMessage("Saved successfully.");
            // Clear the form after successful save
            if (type === "director") {
                setDirector(initialState);
            } else if (type === "rotaractor") {
                setRotaractor(initialState);
            }
        } catch (err) {
            setMessage("Save failed.");
        }
        setLoading(false);
    };

    return (
        <div className="max-w-3xl mx-auto py-12 px-4">
            <h2 className="font-playfair text-3xl mb-8">Monthly Stars Admin Panel</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Director of the Month */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="font-bold text-xl mb-4">Director of the Month</h3>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                            handleImageUpload(e.target.files[0], setDirector)
                        }
                        className="mb-2"
                    />
                    {director.image && (
                        <img
                            src={director.image}
                            alt="Director Preview"
                            className="rounded mb-2 w-full h-48 object-cover"
                        />
                    )}
                    <input
                        type="text"
                        placeholder="Name"
                        value={director.name}
                        onChange={(e) =>
                            setDirector((prev) => ({ ...prev, name: e.target.value }))
                        }
                        className="mb-2 w-full border p-2 rounded"
                    />
                    <select
                        value={director.faculty}
                        onChange={(e) =>
                            setDirector((prev) => ({ ...prev, faculty: e.target.value }))
                        }
                        className="mb-2 w-full border p-2 rounded"
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
                    <textarea
                        placeholder="Quote"
                        value={director.quote}
                        onChange={(e) =>
                            setDirector((prev) => ({ ...prev, quote: e.target.value }))
                        }
                        className="mb-2 w-full border p-2 rounded"
                    />
                    <button
                        onClick={() => handleSave("director", director)}
                        className="bg-pink-600 text-white px-4 py-2 rounded"
                        disabled={loading}
                    >
                        Save Director
                    </button>
                </div>
                {/* Rotaractor of the Month */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="font-bold text-xl mb-4">Rotaractor of the Month</h3>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                            handleImageUpload(e.target.files[0], setRotaractor)
                        }
                        className="mb-2"
                    />
                    {rotaractor.image && (
                        <img
                            src={rotaractor.image}
                            alt="Rotaractor Preview"
                            className="rounded mb-2 w-full h-48 object-cover"
                        />
                    )}
                    <input
                        type="text"
                        placeholder="Name"
                        value={rotaractor.name}
                        onChange={(e) =>
                            setRotaractor((prev) => ({ ...prev, name: e.target.value }))
                        }
                        className="mb-2 w-full border p-2 rounded"
                    />
                    <select
                        value={rotaractor.faculty}
                        onChange={(e) =>
                            setRotaractor((prev) => ({ ...prev, faculty: e.target.value }))
                        }
                        className="mb-2 w-full border p-2 rounded"
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
                    <textarea
                        placeholder="Quote"
                        value={rotaractor.quote}
                        onChange={(e) =>
                            setRotaractor((prev) => ({ ...prev, quote: e.target.value }))
                        }
                        className="mb-2 w-full border p-2 rounded"
                    />
                    <button
                        onClick={() => handleSave("rotaractor", rotaractor)}
                        className="bg-pink-600 text-white px-4 py-2 rounded"
                        disabled={loading}
                    >
                        Save Rotaractor
                    </button>
                </div>
            </div>
            {message && <div className="mt-6 text-center text-pink-600">{message}</div>}

            {/* Current Saved Details Preview */}
            <div className="mt-12">
                <h3 className="font-playfair text-2xl mb-6 text-center">Current Saved Details</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {/* Director of the Month Preview */}
                    <div className="bg-pink-600 rounded-[37px] shadow-lg p-8 relative flex flex-col">
                        <p className="font-playfair font-medium text-[32px] text-white mb-1">Director</p>
                        <p className="font-poppins font-light text-[17px] text-white mb-6">of the Month</p>
                        {director.image ? (
                            <img
                                src={director.image}
                                alt="Director of the Month"
                                className="bg-white rounded-[32px] h-[320px] mb-6 flex-shrink-0 w-full object-cover"
                            />
                        ) : (
                            <div className="bg-white rounded-[32px] h-[320px] mb-6 flex items-center justify-center">
                                <p className="text-gray-500">No image uploaded</p>
                            </div>
                        )}
                        <p className="font-playfair font-medium text-[28px] text-white mb-1">
                            {director.name || "Director Name"}
                        </p>
                        <p className="font-poppins text-[19px] text-[#d9d9d9] mb-6">
                            {director.faculty || "Director Faculty"}
                        </p>
                        <p className="font-poppins font-medium italic text-[17px] text-white leading-relaxed">
                            {director.quote || "Director quote goes here."}
                        </p>
                    </div>

                    {/* Rotaractor of the Month Preview */}
                    <div className="bg-pink-600 rounded-[37px] shadow-lg p-8 relative flex flex-col">
                        <p className="font-playfair font-medium text-[32px] text-white mb-1">Rotaractor</p>
                        <p className="font-poppins font-light text-[17px] text-white mb-6">of the Month</p>
                        {rotaractor.image ? (
                            <img
                                src={rotaractor.image}
                                alt="Rotaractor of the Month"
                                className="bg-white rounded-[32px] h-[320px] mb-6 flex-shrink-0 w-full object-cover"
                            />
                        ) : (
                            <div className="bg-white rounded-[32px] h-[320px] mb-6 flex items-center justify-center">
                                <p className="text-gray-500">No image uploaded</p>
                            </div>
                        )}
                        <p className="font-playfair font-medium text-[28px] text-white mb-1">
                            {rotaractor.name || "Rotaractor Name"}
                        </p>
                        <p className="font-poppins text-[19px] text-[#d9d9d9] mb-6">
                            {rotaractor.faculty || "Rotaractor Faculty"}
                        </p>
                        <p className="font-poppins font-medium italic text-[17px] text-white leading-relaxed">
                            {rotaractor.quote || "Rotaractor quote goes here."}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
