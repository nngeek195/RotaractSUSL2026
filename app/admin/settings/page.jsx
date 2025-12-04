"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Save, Loader2, Smartphone, Globe, Mail, Facebook, Instagram, Linkedin, Youtube, Music } from "lucide-react";

export default function AdminSettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form State
    const [settings, setSettings] = useState({
        // WhatsApp Notification
        whatsappPhone: "",
        callMeBotApiKey: "",
        
        // General Site Info
        siteName: "Rotaract Club of SUSL",
        contactEmail: "info@rotaractsusl.org",
        
        // Social Media
        facebookUrl: "",
        instagramUrl: "",
        linkedinUrl: "",
        tiktokUrl: "",
        youtubeUrl: ""
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            // Fetch Settings from reliefConfig (Publicly readable, Admin writable)
            const docRef = doc(db, "reliefConfig", "website_settings");
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                setSettings(prev => ({ ...prev, ...docSnap.data() }));
            } else {
                // Fallback to old 'general' doc for migration
                const generalDoc = await getDoc(doc(db, "adminSettings", "general"));
                if (generalDoc.exists()) {
                    setSettings(prev => ({ ...prev, ...generalDoc.data() }));
                }
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
        }
        setLoading(false);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Save all settings to reliefConfig/website_settings
            await setDoc(doc(db, "reliefConfig", "website_settings"), settings);
            
            alert("Settings saved successfully!");
        } catch (error) {
            console.error("Error saving settings:", error);
            alert("Failed to save settings. Ensure you are an admin.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Admin Settings</h1>
                    <p className="text-gray-600 mt-1">Manage system configurations and general site details.</p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-blue-600" size={40} />
                </div>
            ) : (
                <form onSubmit={handleSave} className="space-y-8">
                    
                    {/* 1. WhatsApp Notification Settings */}
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                            <div className="bg-green-100 p-3 rounded-lg text-green-600">
                                <Smartphone size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">WhatsApp Notifications</h2>
                                <p className="text-sm text-gray-500">Configure admin alerts for new membership requests.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Admin Phone Number
                                </label>
                                <input
                                    type="text"
                                    name="whatsappPhone"
                                    value={settings.whatsappPhone}
                                    onChange={handleChange}
                                    placeholder="+9471XXXXXXX"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Include country code (e.g., +94). This number will receive alerts.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    CallMeBot API Key
                                </label>
                                <input
                                    type="text"
                                    name="callMeBotApiKey"
                                    value={settings.callMeBotApiKey}
                                    onChange={handleChange}
                                    placeholder="123456"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Get your free API key from <a href="https://www.callmebot.com/blog/free-api-whatsapp-messages/" target="_blank" rel="noreferrer" className="text-blue-600 underline">CallMeBot</a>.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 2. General Site Information */}
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                            <div className="bg-blue-100 p-3 rounded-lg text-blue-600">
                                <Globe size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">General Information</h2>
                                <p className="text-sm text-gray-500">Basic details displayed across the site.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Site Name
                                </label>
                                <input
                                    type="text"
                                    name="siteName"
                                    value={settings.siteName}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Contact Email
                                </label>
                                <div className="flex">
                                    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                                        <Mail size={16} />
                                    </span>
                                    <input
                                        type="email"
                                        name="contactEmail"
                                        value={settings.contactEmail}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 3. Social Media Links */}
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                            <div className="bg-pink-100 p-3 rounded-lg text-pink-600">
                                <Instagram size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Social Media</h2>
                                <p className="text-sm text-gray-500">Links to your club's social profiles.</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Facebook URL</label>
                                <div className="flex">
                                    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                                        <Facebook size={16} />
                                    </span>
                                    <input
                                        type="url"
                                        name="facebookUrl"
                                        value={settings.facebookUrl}
                                        onChange={handleChange}
                                        placeholder="https://facebook.com/..."
                                        className="w-full px-4 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Instagram URL</label>
                                <div className="flex">
                                    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                                        <Instagram size={16} />
                                    </span>
                                    <input
                                        type="url"
                                        name="instagramUrl"
                                        value={settings.instagramUrl}
                                        onChange={handleChange}
                                        placeholder="https://instagram.com/..."
                                        className="w-full px-4 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">LinkedIn URL</label>
                                <div className="flex">
                                    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                                        <Linkedin size={16} />
                                    </span>
                                    <input
                                        type="url"
                                        name="linkedinUrl"
                                        value={settings.linkedinUrl}
                                        onChange={handleChange}
                                        placeholder="https://linkedin.com/..."
                                        className="w-full px-4 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">TikTok URL</label>
                                <div className="flex">
                                    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                                        <Music size={16} />
                                    </span>
                                    <input
                                        type="url"
                                        name="tiktokUrl"
                                        value={settings.tiktokUrl}
                                        onChange={handleChange}
                                        placeholder="https://tiktok.com/..."
                                        className="w-full px-4 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">YouTube URL</label>
                                <div className="flex">
                                    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                                        <Youtube size={16} />
                                    </span>
                                    <input
                                        type="url"
                                        name="youtubeUrl"
                                        value={settings.youtubeUrl}
                                        onChange={handleChange}
                                        placeholder="https://youtube.com/..."
                                        className="w-full px-4 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end sticky bottom-4">
                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-blue-900 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg hover:bg-blue-800 transition flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save size={20} />
                                    Save All Settings
                                </>
                            )}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
