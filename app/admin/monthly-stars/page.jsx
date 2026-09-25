"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, setDoc, doc, query } from "firebase/firestore";
import {
    Upload, Save, Loader2, User, Trophy,
    Smartphone, CheckCircle2, AlertCircle, X,
    Star, Calendar, Filter, Search, Award, ShieldCheck,
    Sparkles, PlayCircle, RefreshCw, Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { STAR_RULES } from "@/lib/stars";

const CLOUDINARY_UPLOAD_URL = "https://api.cloudinary.com/v1_1/dvqoiqzxe/image/upload";
const CLOUDINARY_UPLOAD_PRESET = "monthly_stars_upload";

const initialState = {
    image: "",
    images: [],
    name: "",
    faculty: "",
};

export default function MonthlyStarsAdmin() {
    const [activeTab, setActiveTab] = useState("distribution"); // 'distribution' | 'director' | 'rotaractor'
    const [directorData, setDirectorData] = useState(initialState);
    const [rotaractorData, setRotaractorData] = useState(initialState);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState({ show: false, message: "", type: "success" });

    // Star Distribution & Logs State
    const [starTransactions, setStarTransactions] = useState([]);
    const [loadingTransactions, setLoadingTransactions] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState("all");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [distributionSubTab, setDistributionSubTab] = useState("members"); // 'members' | 'transactions'

    // Helper to get current active data/setter
    const currentData = activeTab === "director" ? directorData : rotaractorData;
    const setCurrentData = activeTab === "director" ? setDirectorData : setRotaractorData;

    const showToast = useCallback((message, type = "success") => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
    }, []);

    const fetchData = useCallback(async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "monthlyStars"));
            querySnapshot.forEach((docSnap) => {
                const data = docSnap.data();
                const normalizedData = {
                    ...initialState,
                    ...data,
                    images: Array.isArray(data.images) ? data.images : (data.image ? [data.image] : []),
                };
                if (docSnap.id === "director") setDirectorData(normalizedData);
                if (docSnap.id === "rotaractor") setRotaractorData(normalizedData);
            });
        } catch (error) {
            console.error("Error fetching flyer data:", error);
            showToast("Failed to load flyer data", "error");
        }
    }, [showToast]);

    const fetchTransactions = useCallback(async () => {
        setLoadingTransactions(true);
        try {
            const qTrans = query(collection(db, "starTransactions"));
            const snap = await getDocs(qTrans);
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            list.sort((a, b) => {
                const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
                const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
                return tB - tA;
            });
            setStarTransactions(list);
        } catch (err) {
            console.error("Error fetching transactions:", err);
            showToast("Failed to load star transactions", "error");
        } finally {
            setLoadingTransactions(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchData();
        fetchTransactions();
    }, [fetchData, fetchTransactions]);

    // Computed distinct months
    const distinctMonths = useMemo(() => {
        const set = new Set();
        starTransactions.forEach(t => {
            if (t.month) set.add(t.month);
        });
        return Array.from(set).sort((a, b) => b.localeCompare(a));
    }, [starTransactions]);

    // Filtered Transactions
    const filteredTransactions = useMemo(() => {
        return starTransactions.filter(tx => {
            if (selectedMonth !== "all" && tx.month !== selectedMonth) return false;
            if (selectedCategory !== "all" && tx.category !== selectedCategory) return false;
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const matchName = (tx.userName || "").toLowerCase().includes(q);
                const matchEmail = (tx.userEmail || "").toLowerCase().includes(q);
                const matchEvent = (tx.eventName || tx.title || "").toLowerCase().includes(q);
                if (!matchName && !matchEmail && !matchEvent) return false;
            }
            return true;
        });
    }, [starTransactions, selectedMonth, selectedCategory, searchQuery]);

    // Leaderboard Aggregation per member
    const memberLeaderboard = useMemo(() => {
        const map = new Map();
        filteredTransactions.forEach(tx => {
            const email = (tx.userEmail || "").toLowerCase().trim();
            if (!email) return;
            if (!map.has(email)) {
                map.set(email, {
                    email,
                    name: tx.userName || email.split("@")[0],
                    attendanceStars: 0,
                    ocMemberStars: 0,
                    starterStars: 0,
                    organizerStars: 0,
                    totalStars: 0,
                    transactionCount: 0,
                    latestMonth: tx.month || "",
                });
            }
            const record = map.get(email);
            record.totalStars += (tx.stars || 0);
            record.transactionCount += 1;
            if (tx.category === "attendance") record.attendanceStars += tx.stars;
            else if (tx.category === "oc_member") record.ocMemberStars += tx.stars;
            else if (tx.category === "event_starter") record.starterStars += tx.stars;
            else if (tx.category === "oc_organizer") record.organizerStars += tx.stars;
        });
        return Array.from(map.values()).sort((a, b) => b.totalStars - a.totalStars);
    }, [filteredTransactions]);

    // Summary Totals
    const totalStarsDistributed = useMemo(() => {
        return filteredTransactions.reduce((acc, t) => acc + (t.stars || 0), 0);
    }, [filteredTransactions]);

    const attendanceTotal = useMemo(() => {
        return filteredTransactions.filter(t => t.category === "attendance").reduce((acc, t) => acc + (t.stars || 0), 0);
    }, [filteredTransactions]);

    const ocMemberTotal = useMemo(() => {
        return filteredTransactions.filter(t => t.category === "oc_member").reduce((acc, t) => acc + (t.stars || 0), 0);
    }, [filteredTransactions]);

    const starterTotal = useMemo(() => {
        return filteredTransactions.filter(t => t.category === "event_starter").reduce((acc, t) => acc + (t.stars || 0), 0);
    }, [filteredTransactions]);

    const organizerTotal = useMemo(() => {
        return filteredTransactions.filter(t => t.category === "oc_organizer").reduce((acc, t) => acc + (t.stars || 0), 0);
    }, [filteredTransactions]);

    const formatTransDate = (createdAt) => {
        if (!createdAt) return "";
        try {
            const d = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
            return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
        } catch {
            return "";
        }
    };

    // Flyer Image Upload
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
        setSaving(true);
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

    const faculties = [
        "Faculty of Applied Sciences", "Faculty of Agricultural Sciences", "Faculty of Geomatics",
        "Faculty of Management Studies", "Faculty of Medicine", "Faculty of Social Sciences & Languages",
        "Faculty of Technology", "Faculty of Computing"
    ];

    return (
        <div className="max-w-7xl mx-auto pb-20 space-y-8 font-poppins selection:bg-pink-500 selection:text-white">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-gray-200 pb-6">
                <div>
                    <h1 className="text-3xl font-bold font-playfair text-gray-900 tracking-tight flex items-center gap-3">
                        Monthly Stars &amp; Recognition
                        <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full border border-amber-200">
                            Gamification Hub
                        </span>
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Monitor live member star distributions, verify points allocation, and manage monthly spotlight flyers.
                    </p>
                </div>

                {/* Tabs */}
                <div className="bg-gray-100 p-1.5 rounded-2xl inline-flex flex-wrap gap-1.5 border border-gray-200">
                    <button
                        onClick={() => setActiveTab("distribution")}
                        className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 ${
                            activeTab === "distribution"
                                ? "bg-amber-500 text-white shadow-sm"
                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                        }`}
                    >
                        <Star size={15} className={activeTab === "distribution" ? "fill-white" : "fill-amber-500 text-amber-500"} />
                        <span>⭐ Stars Distribution &amp; Logs</span>
                    </button>
                    <button
                        onClick={() => setActiveTab("director")}
                        className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all capitalize ${
                            activeTab === "director"
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                        }`}
                    >
                        Director Flyer
                    </button>
                    <button
                        onClick={() => setActiveTab("rotaractor")}
                        className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all capitalize ${
                            activeTab === "rotaractor"
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                        }`}
                    >
                        Rotaractor Flyer
                    </button>
                </div>
            </div>

            {/* TAB 1: STARS DISTRIBUTION & LOGS */}
            {activeTab === "distribution" && (
                <div className="space-y-8 animate-in fade-in duration-300">
                    {/* PROMINENT SPECIAL NOTE: 4 RULES OF STARS DISTRIBUTION */}
                    <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border-2 border-amber-300/80 rounded-3xl p-6 sm:p-8 shadow-sm">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-md">
                                    <Star size={24} className="fill-white" />
                                </div>
                                <div>
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full">
                                        Special Official Policy
                                    </span>
                                    <h3 className="text-xl font-bold text-gray-900 mt-1 font-playfair">
                                        System-Wide Star Distribution &amp; Recognition Rules
                                    </h3>
                                </div>
                            </div>
                            <div className="text-xs text-amber-900 font-semibold bg-white border border-amber-200 px-3.5 py-1.5 rounded-xl shadow-2xs">
                                Automated &amp; Idempotent via Transaction IDs
                            </div>
                        </div>

                        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                            Stars are automatically and permanently distributed across member accounts based on 4 verified engagement milestones. Even if committee members transition roles or return to general membership, their historical leadership contributions and stars remain fully preserved.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {STAR_RULES.map((rule, idx) => (
                                <div key={idx} className="bg-white border border-amber-200/90 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-bold text-amber-700 bg-amber-50 border border-amber-200 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1 font-playfair">
                                                <Star size={13} className="fill-amber-500 text-amber-500" />
                                                +{rule.stars} {rule.stars === 1 ? 'Star' : 'Stars'}
                                            </span>
                                            <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                                                Rule #{idx + 1}
                                            </span>
                                        </div>
                                        <h4 className="font-bold text-gray-900 text-sm mb-1.5">
                                            {rule.title}
                                        </h4>
                                        <p className="text-xs text-gray-500 leading-relaxed">
                                            {rule.description}
                                        </p>
                                    </div>
                                    <div className="mt-3 pt-2.5 border-t border-gray-100 text-[11px] font-semibold text-amber-900 flex items-center gap-1">
                                        <Check size={13} className="text-emerald-600 shrink-0" />
                                        <span>
                                            {rule.category === 'attendance' ? 'Attendance Scanned / Added' :
                                             rule.category === 'oc_member' ? 'Project Completed / Ended' :
                                             rule.category === 'event_starter' ? 'Executive Starts Event Live' :
                                             'Event Live (Creator & Collabs)'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* OVERVIEW METRICS */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                        <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-2xl p-5 shadow-sm col-span-2 sm:col-span-1">
                            <div className="flex items-center justify-between text-amber-100 text-xs mb-1 font-medium">
                                <span>Total Stars</span>
                                <Trophy size={16} />
                            </div>
                            <div className="text-3xl font-bold font-playfair flex items-center gap-2">
                                <span>{totalStarsDistributed}</span>
                                <Star size={22} className="fill-white" />
                            </div>
                            <p className="text-[11px] text-amber-100/90 mt-1">In selected filter</p>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-2xs">
                            <div className="flex items-center justify-between text-gray-500 text-xs mb-1 font-medium">
                                <span>Unique Members</span>
                                <User size={16} className="text-pink-600" />
                            </div>
                            <div className="text-2xl font-bold text-gray-900">
                                {memberLeaderboard.length}
                            </div>
                            <p className="text-[11px] text-gray-400 mt-1">Awarded members</p>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-2xs">
                            <div className="flex items-center justify-between text-gray-500 text-xs mb-1 font-medium">
                                <span>Attendance Stars</span>
                                <Calendar size={16} className="text-emerald-600" />
                            </div>
                            <div className="text-2xl font-bold text-emerald-700">
                                {attendanceTotal} <span className="text-xs font-normal text-gray-400">pts</span>
                            </div>
                            <p className="text-[11px] text-gray-400 mt-1">1★ per event check-in</p>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-2xs">
                            <div className="flex items-center justify-between text-gray-500 text-xs mb-1 font-medium">
                                <span>OC Member Stars</span>
                                <ShieldCheck size={16} className="text-purple-600" />
                            </div>
                            <div className="text-2xl font-bold text-purple-700">
                                {ocMemberTotal} <span className="text-xs font-normal text-gray-400">pts</span>
                            </div>
                            <p className="text-[11px] text-gray-400 mt-1">2★ per ended event</p>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-2xs">
                            <div className="flex items-center justify-between text-gray-500 text-xs mb-1 font-medium">
                                <span>Leadership Stars</span>
                                <Award size={16} className="text-pink-600" />
                            </div>
                            <div className="text-2xl font-bold text-pink-600">
                                {starterTotal + organizerTotal} <span className="text-xs font-normal text-gray-400">pts</span>
                            </div>
                            <p className="text-[11px] text-gray-400 mt-1">Starter (2★) &amp; OC (3★)</p>
                        </div>
                    </div>

                    {/* FILTER & SEARCH BAR */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                            {/* Month Filter */}
                            <div className="flex items-center gap-2">
                                <Filter size={15} className="text-gray-400" />
                                <span className="text-xs font-semibold text-gray-600">Month:</span>
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    className="text-xs font-medium bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-500 cursor-pointer"
                                >
                                    <option value="all">All Time (Lifetime)</option>
                                    {distinctMonths.map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Category Filter */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-gray-600">Category:</span>
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="text-xs font-medium bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-500 cursor-pointer"
                                >
                                    <option value="all">All Categories</option>
                                    <option value="attendance">Event Attendance (1★)</option>
                                    <option value="oc_member">Selected OC Member (2★)</option>
                                    <option value="event_starter">Event Starter (2★)</option>
                                    <option value="oc_organizer">OC Creator / Collab (3★)</option>
                                </select>
                            </div>
                        </div>

                        {/* Search & Actions */}
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="relative flex-1 md:w-64">
                                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search member, email, event..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500"
                                />
                            </div>

                            <button
                                onClick={fetchTransactions}
                                disabled={loadingTransactions}
                                className="p-2 text-gray-500 hover:text-pink-600 bg-gray-50 hover:bg-pink-50 rounded-xl border border-gray-200 transition"
                                title="Refresh data"
                            >
                                <RefreshCw size={16} className={loadingTransactions ? "animate-spin text-pink-600" : ""} />
                            </button>
                        </div>
                    </div>

                    {/* SUB-TABS: LEADERBOARD vs TRANSACTIONS */}
                    <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setDistributionSubTab("members")}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                    distributionSubTab === "members"
                                        ? "bg-gray-900 text-white shadow-sm"
                                        : "text-gray-500 hover:text-gray-800 bg-gray-100"
                                }`}
                            >
                                Member Summary &amp; Rankings ({memberLeaderboard.length})
                            </button>
                            <button
                                onClick={() => setDistributionSubTab("transactions")}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                    distributionSubTab === "transactions"
                                        ? "bg-gray-900 text-white shadow-sm"
                                        : "text-gray-500 hover:text-gray-800 bg-gray-100"
                                }`}
                            >
                                Full Transactions Audit Log ({filteredTransactions.length})
                            </button>
                        </div>
                    </div>

                    {/* VIEW 1: MEMBER LEADERBOARD */}
                    {distributionSubTab === "members" && (
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
                            {memberLeaderboard.length === 0 ? (
                                <div className="text-center py-16 text-gray-400 text-sm">
                                    No member stars recorded for the selected criteria.
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-gray-50/80 text-gray-600 font-bold uppercase tracking-wider border-b border-gray-200">
                                            <tr>
                                                <th className="py-3.5 px-4 w-12 text-center">#</th>
                                                <th className="py-3.5 px-4">Member Name &amp; Email</th>
                                                <th className="py-3.5 px-4 text-center">Attendance (1★)</th>
                                                <th className="py-3.5 px-4 text-center">OC Roles (2★)</th>
                                                <th className="py-3.5 px-4 text-center">Leadership (2-3★)</th>
                                                <th className="py-3.5 px-4 text-right">Total Stars</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {memberLeaderboard.map((member, idx) => (
                                                <tr key={member.email} className="hover:bg-gray-50/70 transition">
                                                    <td className="py-3.5 px-4 text-center font-bold text-gray-400">
                                                        {idx === 0 ? "🥇 1" : idx === 1 ? "🥈 2" : idx === 2 ? "🥉 3" : idx + 1}
                                                    </td>
                                                    <td className="py-3.5 px-4">
                                                        <div className="font-bold text-gray-900">{member.name}</div>
                                                        <div className="text-gray-400 text-[11px]">{member.email}</div>
                                                    </td>
                                                    <td className="py-3.5 px-4 text-center text-emerald-700 font-semibold">
                                                        {member.attendanceStars} pts
                                                    </td>
                                                    <td className="py-3.5 px-4 text-center text-purple-700 font-semibold">
                                                        {member.ocMemberStars} pts
                                                    </td>
                                                    <td className="py-3.5 px-4 text-center text-pink-600 font-semibold">
                                                        {member.starterStars + member.organizerStars} pts
                                                    </td>
                                                    <td className="py-3.5 px-4 text-right">
                                                        <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full text-xs font-playfair">
                                                            <Star size={13} className="fill-amber-500 text-amber-500" />
                                                            {member.totalStars} Stars
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* VIEW 2: FULL TRANSACTIONS AUDIT LOG */}
                    {distributionSubTab === "transactions" && (
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
                            {filteredTransactions.length === 0 ? (
                                <div className="text-center py-16 text-gray-400 text-sm">
                                    No transactions match the selected filters.
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-gray-50/80 text-gray-600 font-bold uppercase tracking-wider border-b border-gray-200">
                                            <tr>
                                                <th className="py-3.5 px-4">Date &amp; Month</th>
                                                <th className="py-3.5 px-4">Member</th>
                                                <th className="py-3.5 px-4">Category</th>
                                                <th className="py-3.5 px-4">Event &amp; Role</th>
                                                <th className="py-3.5 px-4 text-right">Stars</th>
                                                <th className="py-3.5 px-4 text-right">Transaction ID</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {filteredTransactions.map((tx) => (
                                                <tr key={tx.id} className="hover:bg-gray-50/70 transition">
                                                    <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                                                        <div>{formatTransDate(tx.createdAt)}</div>
                                                        <span className="text-[10px] text-gray-400">{tx.monthLabel || tx.month}</span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="font-bold text-gray-900">{tx.userName}</div>
                                                        <div className="text-gray-400 text-[11px]">{tx.userEmail}</div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                                                            tx.category === 'oc_organizer'
                                                                ? 'bg-purple-100 text-purple-700'
                                                                : tx.category === 'event_starter'
                                                                ? 'bg-pink-100 text-pink-700'
                                                                : tx.category === 'oc_member'
                                                                ? 'bg-emerald-100 text-emerald-700'
                                                                : 'bg-amber-100 text-amber-700'
                                                        }`}>
                                                            {tx.category === 'oc_organizer' ? <Sparkles size={11} /> :
                                                             tx.category === 'event_starter' ? <PlayCircle size={11} /> :
                                                             tx.category === 'oc_member' ? <Trophy size={11} /> :
                                                             <Calendar size={11} />}
                                                            {tx.category === 'oc_organizer' ? 'OC Organizer (3★)' :
                                                             tx.category === 'event_starter' ? 'Event Starter (2★)' :
                                                             tx.category === 'oc_member' ? 'Selected OC (2★)' :
                                                             'Attendance (1★)'}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="font-bold text-gray-800">{tx.eventName || tx.title}</div>
                                                        {tx.role && (
                                                            <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                                                {tx.role}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4 text-right">
                                                        <span className="font-bold font-playfair text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                                                            <Star size={12} className="fill-amber-500 text-amber-500" />
                                                            +{tx.stars} ★
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-mono text-[10px] text-gray-400">
                                                        {tx.transactionId || tx.id}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2 & 3: FLYERS MANAGEMENT (DIRECTOR & ROTARACTOR) */}
            {activeTab !== "distribution" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-300">
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
                                            <p className="text-white/70 text-xs line-clamp-1">
                                                {currentData.faculty || "Faculty Here"}
                                            </p>
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
            )}

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
