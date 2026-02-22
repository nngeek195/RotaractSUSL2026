"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
    Save, Loader2, Smartphone, Globe, Mail,
    Facebook, Instagram, Linkedin, Youtube, Music,
    MessageSquare, Shield, Bell, LayoutGrid, CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminSettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("general");
    const [toast, setToast] = useState({ show: false, message: "" });
    const [testLoading, setTestLoading] = useState(false);

    // Form State
    const [settings, setSettings] = useState({
        // General Site Info
        siteName: "Rotaract Club of SUSL",
        contactEmail: "info@rotaractsusl.org",
        whatsappPhone: "",

        // Telegram Notification
        telegramBotToken: "",
        telegramChatId: "",

        // Social Media
        facebookUrl: "",
        instagramUrl: "",
        linkedinUrl: "",
        tiktokUrl: "",
        youtubeUrl: "",

        // WAHA (WhatsApp HTTP API)
        wahaApiUrl: "",
        wahaApiKey: "",
        wahaSession: "default",
        wahaRecipient: ""
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            // 1. Fetch Public Settings
            const publicDocRef = doc(db, "reliefConfig", "website_settings");
            const publicSnap = await getDoc(publicDocRef);
            const publicData = publicSnap.exists() ? publicSnap.data() : {};

            // 2. Fetch Secure Settings
            const secureDocRef = doc(db, "adminSettings", "secure");
            const secureSnap = await getDoc(secureDocRef);
            const secureData = secureSnap.exists() ? secureSnap.data() : {};

            setSettings(prev => ({
                ...prev,
                siteName: publicData.siteName || "",
                contactEmail: publicData.contactEmail || "",
                whatsappPhone: publicData.whatsappPhone || "",
                facebookUrl: publicData.facebookUrl || "",
                instagramUrl: publicData.instagramUrl || "",
                linkedinUrl: publicData.linkedinUrl || "",
                tiktokUrl: publicData.tiktokUrl || "",
                youtubeUrl: publicData.youtubeUrl || "",
                telegramBotToken: secureData.telegramBotToken || "",
                telegramChatId: secureData.telegramChatId || "",
                wahaApiUrl: secureData.wahaApiUrl || "",
                wahaApiKey: secureData.wahaApiKey || secureData.inoutApiKey || "",
                wahaSession: secureData.wahaSession || "default",
                wahaRecipient: secureData.wahaRecipient || secureData.inoutPhoneNumber || ""
            }));
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
            // 1. Save Public Data
            const publicData = {
                siteName: settings.siteName,
                contactEmail: settings.contactEmail,
                whatsappPhone: settings.whatsappPhone,
                facebookUrl: settings.facebookUrl,
                instagramUrl: settings.instagramUrl,
                linkedinUrl: settings.linkedinUrl,
                tiktokUrl: settings.tiktokUrl,
                youtubeUrl: settings.youtubeUrl
            };
            await setDoc(doc(db, "reliefConfig", "website_settings"), publicData, { merge: true });

            // 2. Save Secure Data
            const secureData = {
                telegramBotToken: settings.telegramBotToken,
                telegramChatId: settings.telegramChatId,
                wahaApiUrl: settings.wahaApiUrl,
                wahaApiKey: settings.wahaApiKey,
                wahaSession: settings.wahaSession,
                wahaRecipient: settings.wahaRecipient
            };
            await setDoc(doc(db, "adminSettings", "secure"), secureData, { merge: true });

            setToast({ show: true, message: "Settings saved successfully!" });
            setTimeout(() => setToast({ show: false, message: "" }), 3000);
        } catch (error) {
            console.error("Error saving settings:", error);
            setToast({ show: true, message: "Failed to save settings.", type: "error" });
        } finally {
            setSaving(false);
        }
    };

    const tabs = [
        { id: "general", label: "General", icon: LayoutGrid },
        { id: "notifications", label: "Notifications", icon: Bell },
        { id: "social", label: "Social Media", icon: Globe },
        { id: "security", label: "Security & API", icon: Shield },
    ];

    return (
        <div className="max-w-7xl mx-auto pb-20">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">System Settings</h1>
                    <p className="text-gray-500 mt-1">Configure site details, API keys, and notifications.</p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-blue-600" size={40} />
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Sidebar Tabs */}
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 sticky top-8">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all text-sm mb-1 ${activeTab === tab.id
                                        ? "bg-blue-50 text-blue-700 shadow-sm"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                        }`}
                                >
                                    <tab.icon size={18} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="lg:col-span-9 space-y-6">
                        <form id="settingsForm" onSubmit={handleSave}>
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeTab}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {/* General Settings */}
                                    {activeTab === "general" && (
                                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                                            <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
                                                <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
                                                    <Globe size={24} />
                                                </div>
                                                <div>
                                                    <h2 className="text-xl font-bold text-gray-900">General Information</h2>
                                                    <p className="text-gray-500 text-sm">Basic details visible to the public.</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-700 mb-2">Site Name</label>
                                                    <input
                                                        name="siteName"
                                                        value={settings.siteName}
                                                        onChange={handleChange}
                                                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-700 mb-2">Contact Email</label>
                                                    <input
                                                        name="contactEmail"
                                                        value={settings.contactEmail}
                                                        onChange={handleChange}
                                                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-700 mb-2">Public WhatsApp</label>
                                                    <input
                                                        name="whatsappPhone"
                                                        value={settings.whatsappPhone}
                                                        onChange={handleChange}
                                                        placeholder="+9477... or 9477...@c.us"
                                                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Notifications */}
                                    {activeTab === "notifications" && (
                                        <div className="space-y-6">
                                            {/* Telegram */}
                                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                                                <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
                                                    <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                                                        <Smartphone size={24} />
                                                    </div>
                                                    <div>
                                                        <h2 className="text-xl font-bold text-gray-900">Telegram Bot</h2>
                                                        <p className="text-gray-500 text-sm">Receive instant alerts for new requests.</p>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <label className="block text-sm font-bold text-gray-700 mb-2">Bot Token</label>
                                                        <input
                                                            name="telegramBotToken"
                                                            value={settings.telegramBotToken}
                                                            onChange={handleChange}
                                                            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-bold text-gray-700 mb-2">Chat ID</label>
                                                        <input
                                                            name="telegramChatId"
                                                            value={settings.telegramChatId}
                                                            onChange={handleChange}
                                                            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* WAHA (WhatsApp) */}
                                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                                                <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
                                                    <div className="p-3 bg-green-100 text-green-600 rounded-xl">
                                                        <MessageSquare size={24} />
                                                    </div>
                                                    <div>
                                                        <h2 className="text-xl font-bold text-gray-900">WAHA (WhatsApp)</h2>
                                                        <p className="text-gray-500 text-sm">Use your WAHA server to send WhatsApp notifications.</p>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 gap-6">
                                                    <div>
                                                        <label className="block text-sm font-bold text-gray-700 mb-2">WAHA API Key (optional)</label>
                                                        <input
                                                            type="password"
                                                            name="wahaApiKey"
                                                            value={settings.wahaApiKey}
                                                            onChange={handleChange}
                                                            placeholder="Optional if your WAHA instance is open or IP-restricted"
                                                            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-bold text-gray-700 mb-2">Recipient (phone or chatId)</label>
                                                        <input
                                                            name="wahaRecipient"
                                                            value={settings.wahaRecipient}
                                                            onChange={handleChange}
                                                            placeholder="+9477... or 9477...@c.us"
                                                            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                                                        />
                                                        <p className="text-xs text-gray-400 mt-1">Use E.164 phone or a full WAHA chatId.</p>
                                                    </div>
                                                </div>
                                                    <div>
                                                        <label className="block text-sm font-bold text-gray-700 mb-2">WAHA API URL</label>
                                                        <input
                                                            name="wahaApiUrl"
                                                            value={settings.wahaApiUrl}
                                                            onChange={handleChange}
                                                            placeholder="http://localhost:3000"
                                                            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-bold text-gray-700 mb-2">WAHA Session</label>
                                                        <input
                                                            name="wahaSession"
                                                            value={settings.wahaSession}
                                                            onChange={handleChange}
                                                            placeholder="default"
                                                            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                                                        />
                                                        <p className="text-xs text-gray-400 mt-1">Usually <code>default</code> unless you configured another session.</p>
                                                    </div>

                                                <div className="flex justify-end pt-4 border-t border-gray-100">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleTestNotification('waha')}
                                                        disabled={testLoading}
                                                        className="flex items-center gap-2 text-green-600 bg-green-50 hover:bg-green-100 px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                                                    >
                                                        {testLoading ? <Loader2 className="animate-spin" size={16} /> : <MessageSquare size={16} />}
                                                        Send Test WAHA
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Social Media */}
                                    {activeTab === "social" && (
                                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                                            <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
                                                <div className="p-3 bg-pink-100 text-pink-600 rounded-xl">
                                                    <Instagram size={24} />
                                                </div>
                                                <div>
                                                    <h2 className="text-xl font-bold text-gray-900">Social Media Links</h2>
                                                    <p className="text-gray-500 text-sm">Manage links to external social profiles.</p>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                {[
                                                    { icon: Facebook, name: "facebookUrl", label: "Facebook" },
                                                    { icon: Instagram, name: "instagramUrl", label: "Instagram" },
                                                    { icon: Linkedin, name: "linkedinUrl", label: "LinkedIn" },
                                                    { icon: Music, name: "tiktokUrl", label: "TikTok" },
                                                    { icon: Youtube, name: "youtubeUrl", label: "YouTube" },
                                                ].map((social, i) => (
                                                    <div key={i} className="flex items-center gap-3">
                                                        <div className="p-2 bg-gray-50 rounded-lg text-gray-500">
                                                            <social.icon size={20} />
                                                        </div>
                                                        <input
                                                            name={social.name}
                                                            value={settings[social.name]}
                                                            onChange={handleChange}
                                                            placeholder={`${social.label} URL...`}
                                                            className="flex-1 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Security - Clean placeholder for now */}
                                    {activeTab === "security" && (
                                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center py-20">
                                            <div className="p-4 bg-gray-50 rounded-full mb-4">
                                                <Shield size={40} className="text-gray-400" />
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900">Security Settings</h3>
                                            <p className="text-gray-500 max-w-sm mt-2">
                                                Advanced security configurations and audit logs will be available here in a future update.
                                            </p>
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </form>
                    </div>
                </div>
            )}

            <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-200 p-4 z-40 lg:pl-[280px]">
                <div className="max-w-7xl mx-auto flex justify-end gap-4 items-center px-4 md:px-8">
                    {toast.show && (
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm animate-in fade-in slide-in-from-bottom-2 ${toast.type === "error" ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
                            }`}>
                            {toast.type === "error" ? <Shield size={18} /> : <CheckCircle2 size={18} />} {toast.message}
                        </div>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={saving || loading}
                        className="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-gray-800 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                        Save Changes
                    </button>
                </div>
            </div>
        </div >
    );

    async function handleTestNotification(provider) {
        // validate settings
        if (provider === 'waha' && (!settings.wahaApiUrl || !settings.wahaRecipient)) {
            const msg = "Please save WAHA settings first!";
            setToast({ show: true, message: msg, type: "error" });
            return;
        }

        setTestLoading(true);
        try {
            const res = await fetch('/api/notify-admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fullName: "Test Admin",
                    email: "test@rotaractsusl.org",
                    contact: "+94700000000",
                    faculty: "Test Faculty",
                    department: "Test Dept",
                    provider
                })
            });

            const data = await res.json();
            if (res.ok) {
                // Find the success message for the requested provider
                const resultMsg = data.results?.find(r => r.status === 'fulfilled' && String(r.value).includes(provider === 'waha' ? 'WAHA' : 'Telegram'))?.value;
                const msg = resultMsg || `${provider === 'waha' ? 'WhatsApp (WAHA)' : 'Telegram'} test sent! Check your device.`;

                setToast({ show: true, message: msg, type: "success" });
            } else {
                throw new Error(data.details || data.error || "Failed to send");
            }
        } catch (error) {
            console.error("Test failed:", error);
            const msg = `Test failed: ${error.message}`;
            setToast({ show: true, message: msg, type: "error" });
        } finally {
            setTestLoading(false);
            // Clear toast after 5s
            setTimeout(() => setToast(prev => ({ ...prev, show: false })), 5000);
        }
    }
}
