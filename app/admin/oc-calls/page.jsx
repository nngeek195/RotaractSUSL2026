'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from "@/lib/firebase";
import { collection, getDocs, updateDoc, doc, deleteDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { useAuth } from "@/app/contexts/AuthContext";
import { 
    Loader2, Users, CheckCircle, Trash2, Eye, Share2, 
    X, Search, Mail, Phone, User, Undo2, Copy, Check,
    UploadCloud, Globe, Sparkles, Edit3, ArrowLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { confirmToast } from "@/lib/confirmToast";
import Link from 'next/link';

export default function ManageOCCalls() {
    const { user, isAdmin } = useAuth();
    
    const [loading, setLoading] = useState(true);
    const [ocCalls, setOcCalls] = useState([]);
    const [applications, setApplications] = useState([]);
    const [directorsList, setDirectorsList] = useState({}); // UID -> { uid, name, position, email, imageUrl }
    const [usersMap, setUsersMap] = useState({}); // UID & email -> user data
    
    const [selectedCall, setSelectedCall] = useState(null);
    const [activeTab, setActiveTab] = useState('applicants'); // 'applicants' or 'group'
    const [selectedShareEmail, setSelectedShareEmail] = useState("");
    const [sharingLoading, setSharingLoading] = useState(false);
    
    // Admin filtering
    const [directorFilter, setDirectorFilter] = useState("all");

    // Applicants Filtering & Search
    const [searchTerm, setSearchTerm] = useState("");
    const [positionFilter, setPositionFilter] = useState("all");

    // "See More" Details Modal State
    const [viewingApplicant, setViewingApplicant] = useState(null);
    const [copiedField, setCopiedField] = useState(null);
    const [mounted, setMounted] = useState(false);

    // Publish as Post Modal State
    const [publishModalOpen, setPublishModalOpen] = useState(false);
    const [publishDescription, setPublishDescription] = useState("");
    const [publishImageUrl, setPublishImageUrl] = useState("");
    const [uploadingPublishImage, setUploadingPublishImage] = useState(false);
    const [savingPublish, setSavingPublish] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // 1. Fetch Executive Committee & Users
            const [execSnap, usersSnap, callsSnap, appsSnap] = await Promise.all([
                getDocs(collection(db, "executiveCommittee")),
                getDocs(collection(db, "users")),
                getDocs(collection(db, "ocCalls")),
                getDocs(collection(db, "ocApplications"))
            ]);

            const dirMap = {};
            const uMap = {};

            // Map all registered users
            usersSnap.forEach(d => {
                const data = { id: d.id, ...d.data(), source: 'users' };
                if (d.id) uMap[d.id] = data;
                if (data.email) uMap[data.email.toLowerCase().trim()] = data;
            });

            // Map executive committee members
            execSnap.forEach(d => {
                const data = d.data();
                const info = {
                    uid: d.id,
                    name: data.fullName || `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.firstName || "Director",
                    position: data.position || "Board Member",
                    email: data.email,
                    imageUrl: data.imageUrl || "",
                    faculty: data.faculty || "",
                    studentId: data.studentId || data.indexNumber || "",
                    contactNumber: data.whatsapp || data.mobileNumber || "",
                    source: 'executiveCommittee'
                };
                dirMap[d.id] = info;
                uMap[d.id] = { ...uMap[d.id], ...info };
                if (data.email) {
                    const normEmail = data.email.toLowerCase().trim();
                    uMap[normEmail] = { ...uMap[normEmail], ...info };
                }
            });

            setDirectorsList(dirMap);
            setUsersMap(uMap);

            // Process OC Calls
            let callsData = callsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

            // Admins see all; non-admins see owned + shared calls
            if (!isAdmin && user) {
                callsData = callsData.filter(c => 
                    c.createdBy === user.uid || 
                    (Array.isArray(c.sharedWith) && c.sharedWith.some(email => 
                        email && user.email && email.toLowerCase().trim() === user.email.toLowerCase().trim()
                    ))
                );
            }
            setOcCalls(callsData);

            // Process Applications
            const appsData = appsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            setApplications(appsData);

            // Maintain selectedCall reference if still present
            setSelectedCall(prev => {
                if (!prev) return callsData[0] || null;
                const updated = callsData.find(c => c.id === prev.id);
                return updated || callsData[0] || null;
            });

        } catch (error) {
            console.error("Error fetching OC Calls dashboard data:", error);
            toast.error("Failed to load dashboard data.");
        } finally {
            setLoading(false);
        }
    }, [isAdmin, user]);

    useEffect(() => {
        if (!user) return;
        fetchData();
    }, [user, fetchData]);

    // Format Director Name & Position
    const getDirectorDisplay = (uid) => {
        const dir = directorsList[uid] || usersMap[uid];
        if (!dir) return `Director ID: ${uid ? uid.substring(0, 6) : "..."}...`;
        return `${dir.position} - ${dir.name}`;
    };

    // Helper: Enrich raw applicant record with profile from `users` or `executiveCommittee`
    const getApplicantFullInfo = useCallback((app) => {
        if (!app) return null;
        const emailKey = app.applicantEmail?.toLowerCase()?.trim();
        const userProfile = (emailKey && usersMap[emailKey]) || 
                            (app.userId && usersMap[app.userId]) || {};

        const name = app.applicantName || userProfile.fullName || 
                     [userProfile.firstName, userProfile.lastName].filter(Boolean).join(" ") || "Applicant";
        const faculty = app.faculty && app.faculty !== "N/A" ? app.faculty : (userProfile.faculty || "N/A");
        const number = app.contactNumber && app.contactNumber !== "N/A" 
                       ? app.contactNumber 
                       : (userProfile.whatsapp || userProfile.mobileNumber || "N/A");
        const indexNumber = app.studentId || app.indexNumber || userProfile.studentId || userProfile.indexNumber || "N/A";
        const email = app.applicantEmail || userProfile.email || "N/A";
        const department = app.department || userProfile.department || "N/A";

        return {
            ...userProfile,
            ...app,
            id: app.id,
            applicantName: name,
            faculty,
            contactNumber: number,
            indexNumber,
            applicantEmail: email,
            department,
            position: app.position || "Applicant",
            teamRole: app.teamRole || "N/A",
            imageUrl: app.imageUrl || userProfile.imageUrl || "",
            nic: userProfile.nic || "N/A",
            gender: userProfile.gender || "N/A",
            dob: userProfile.dob || "N/A",
            residentialAddress: userProfile.residentialAddress || "N/A",
            city: userProfile.city || "",
            province: userProfile.province || "",
            postalCode: userProfile.postalCode || "",
            reason: userProfile.reason || "",
            userPosition: userProfile.position || (userProfile.source === 'executiveCommittee' ? 'Executive Committee' : 'Member'),
            customAnswers: app.customAnswers || {},
            appliedAt: app.appliedAt,
            status: app.status || "pending"
        };
    }, [usersMap]);

    // --- ACTIONS ---

    const handleSelectApplicant = async (appId) => {
        try {
            await updateDoc(doc(db, "ocApplications", appId), { status: "selected" });
            toast.success("Applicant added to the OC Group!");
            setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: "selected" } : a));
            if (viewingApplicant && viewingApplicant.id === appId) {
                setViewingApplicant(prev => ({ ...prev, status: "selected" }));
            }
        } catch (error) {
            console.error("Error selecting applicant:", error);
            toast.error("Error selecting applicant.");
        }
    };

    const handleUnselectApplicant = async (appId) => {
        try {
            await updateDoc(doc(db, "ocApplications", appId), { status: "pending" });
            toast.success("Applicant moved back to pending list.");
            setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: "pending" } : a));
            if (viewingApplicant && viewingApplicant.id === appId) {
                setViewingApplicant(prev => ({ ...prev, status: "pending" }));
            }
        } catch (error) {
            console.error("Error unselecting applicant:", error);
            toast.error("Error updating applicant status.");
        }
    };

    const handleDeleteApplication = async (appId) => {
        if (!(await confirmToast({ message: "Are you sure you want to delete this application?" }))) return;
        try {
            await deleteDoc(doc(db, "ocApplications", appId));
            setApplications(prev => prev.filter(a => a.id !== appId));
            if (viewingApplicant && viewingApplicant.id === appId) {
                setViewingApplicant(null);
            }
            toast.success("Application removed.");
        } catch (error) {
            console.error("Error deleting application:", error);
            toast.error("Error deleting application.");
        }
    };

    const handleDeleteCall = async (callId) => {
        if (!(await confirmToast({ 
            message: "WARNING: This will permanently delete the OC Call and all its applications. Proceed?" 
        }))) return;
        
        try {
            await deleteDoc(doc(db, "ocCalls", callId));
            
            const relatedApps = applications.filter(a => a.callId === callId);
            for (const app of relatedApps) {
                await deleteDoc(doc(db, "ocApplications", app.id));
            }
            
            setOcCalls(prev => prev.filter(c => c.id !== callId));
            setApplications(prev => prev.filter(a => a.callId !== callId));
            setSelectedCall(null);
            toast.success("OC Call and related applications deleted.");
        } catch (error) {
            console.error("Error deleting OC Call:", error);
            toast.error("Error deleting OC Call.");
        }
    };

    // --- SHARING ACTIONS ---

    const handleShareCall = async (e) => {
        e.preventDefault();
        if (!selectedShareEmail || !selectedCall) return;
        
        const emailToShare = selectedShareEmail.trim();
        setSharingLoading(true);

        try {
            await updateDoc(doc(db, "ocCalls", selectedCall.id), {
                sharedWith: arrayUnion(emailToShare)
            });

            // Find member details for friendly feedback
            const targetMember = Object.values(directorsList).find(d => 
                d.email && d.email.toLowerCase().trim() === emailToShare.toLowerCase()
            );
            const memberLabel = targetMember ? `${targetMember.position} - ${targetMember.name}` : emailToShare;

            toast.success(`Project shared with ${memberLabel}!`);
            setSelectedShareEmail("");

            const updatedShared = [...(selectedCall.sharedWith || []), emailToShare];
            setSelectedCall(prev => ({ ...prev, sharedWith: updatedShared }));
            setOcCalls(prev => prev.map(c => c.id === selectedCall.id ? { ...c, sharedWith: updatedShared } : c));
        } catch (error) {
            console.error("Error sharing project:", error);
            toast.error("Error sharing project.");
        } finally {
            setSharingLoading(false);
        }
    };

    const handleRevokeShare = async (emailToRevoke) => {
        if (!selectedCall) return;

        const targetMember = Object.values(directorsList).find(d => 
            d.email && d.email.toLowerCase().trim() === emailToRevoke.toLowerCase()
        );
        const memberLabel = targetMember ? `${targetMember.name} (${targetMember.position})` : emailToRevoke;

        if (!(await confirmToast({ 
            message: `Revoke project access for ${memberLabel}?`,
            description: "They will no longer be able to view or manage this OC Call."
        }))) return;

        try {
            await updateDoc(doc(db, "ocCalls", selectedCall.id), {
                sharedWith: arrayRemove(emailToRevoke)
            });

            toast.success(`Access revoked for ${memberLabel}.`);

            const updatedShared = (selectedCall.sharedWith || []).filter(e => 
                e.toLowerCase().trim() !== emailToRevoke.toLowerCase().trim()
            );
            setSelectedCall(prev => ({ ...prev, sharedWith: updatedShared }));
            setOcCalls(prev => prev.map(c => c.id === selectedCall.id ? { ...c, sharedWith: updatedShared } : c));
        } catch (error) {
            console.error("Error revoking project share:", error);
            toast.error("Error revoking access.");
        }
    };

    // --- PUBLISH / POST ACTIONS ---

    const handleOpenPublishModal = () => {
        if (!selectedCall) return;
        setPublishDescription(selectedCall.description || "");
        setPublishImageUrl(selectedCall.imageUrl || "");
        setPublishModalOpen(true);
    };

    const handleUploadPublishImage = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingPublishImage(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", "projects");
            const res = await fetch("https://api.cloudinary.com/v1_1/dvqoiqzxe/image/upload", {
                method: "POST",
                body: formData
            });
            const data = await res.json();
            if (data.secure_url) {
                setPublishImageUrl(data.secure_url);
                toast.success("Event poster uploaded successfully!");
            } else {
                toast.error("Failed to upload image.");
            }
        } catch (err) {
            console.error("Upload error:", err);
            toast.error("Error uploading image.");
        } finally {
            setUploadingPublishImage(false);
        }
    };

    const handleSubmitPublish = async (e) => {
        e.preventDefault();
        if (!selectedCall) return;
        if (!publishDescription.trim()) {
            toast.error("Please enter a project description.");
            return;
        }

        setSavingPublish(true);
        try {
            const publisherName = usersMap[user?.uid]?.name || user?.displayName || user?.email || "Executive Member";
            const updatePayload = {
                published: true,
                description: publishDescription.trim(),
                imageUrl: publishImageUrl.trim(),
                publishedAt: new Date(),
                publishedBy: user?.uid || "unknown",
                publishedByName: publisherName,
                publishedByEmail: user?.email || "",
                status: "open"
            };

            await updateDoc(doc(db, "ocCalls", selectedCall.id), updatePayload);

            setSelectedCall(prev => ({ ...prev, ...updatePayload }));
            setOcCalls(prev => prev.map(c => c.id === selectedCall.id ? { ...c, ...updatePayload } : c));
            setPublishModalOpen(false);
            toast.success("Project call published as a public post!");
        } catch (err) {
            console.error("Error publishing project call:", err);
            toast.error("Failed to publish project call.");
        } finally {
            setSavingPublish(false);
        }
    };

    const handleUnpublishCall = async () => {
        if (!selectedCall) return;
        if (!(await confirmToast({
            message: "Unpublish this project call?",
            description: "It will be converted to a draft and removed from public member accounts."
        }))) return;

        try {
            await updateDoc(doc(db, "ocCalls", selectedCall.id), {
                published: false
            });
            setSelectedCall(prev => ({ ...prev, published: false }));
            setOcCalls(prev => prev.map(c => c.id === selectedCall.id ? { ...c, published: false } : c));
            toast.success("Project call unpublished and saved as draft.");
        } catch (err) {
            console.error("Error unpublishing call:", err);
            toast.error("Failed to unpublish project call.");
        }
    };

    const copyToClipboard = (text, fieldName = "Text") => {
        if (!text || text === "N/A") return;
        navigator.clipboard.writeText(text);
        setCopiedField(fieldName);
        toast.success(`Copied ${fieldName} to clipboard!`);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const formatDate = (dateVal) => {
        if (!dateVal) return "N/A";
        try {
            if (dateVal.toDate && typeof dateVal.toDate === 'function') {
                return dateVal.toDate().toLocaleString(undefined, { 
                    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                });
            }
            if (dateVal instanceof Date) {
                return dateVal.toLocaleString(undefined, { 
                    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                });
            }
            return new Date(dateVal).toLocaleString(undefined, { 
                year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
            });
        } catch {
            return "N/A";
        }
    };

    // Filter Logic for Admin
    const displayedCalls = useMemo(() => {
        return isAdmin && directorFilter !== 'all' 
            ? ocCalls.filter(c => c.createdBy === directorFilter) 
            : ocCalls;
    }, [isAdmin, directorFilter, ocCalls]);

    const uniqueDirectorUids = useMemo(() => {
        return [...new Set(ocCalls.map(c => c.createdBy).filter(Boolean))];
    }, [ocCalls]);

    // Active Call Data
    const callApplications = useMemo(() => {
        return applications.filter(a => a.callId === selectedCall?.id);
    }, [applications, selectedCall]);

    // Pending vs Selected
    const pendingApps = useMemo(() => {
        return callApplications.filter(a => a.status !== "selected");
    }, [callApplications]);

    const selectedGroup = useMemo(() => {
        return callApplications.filter(a => a.status === "selected");
    }, [callApplications]);

    // Enriched & Filtered Pending Applicants
    const filteredPendingApps = useMemo(() => {
        return pendingApps
            .map(app => getApplicantFullInfo(app))
            .filter(app => {
                if (positionFilter !== "all" && app.position !== positionFilter) {
                    return false;
                }
                if (!searchTerm.trim()) return true;
                const term = searchTerm.toLowerCase().trim();
                return (
                    (app.applicantName && app.applicantName.toLowerCase().includes(term)) ||
                    (app.indexNumber && app.indexNumber.toLowerCase().includes(term)) ||
                    (app.faculty && app.faculty.toLowerCase().includes(term)) ||
                    (app.contactNumber && app.contactNumber.toLowerCase().includes(term)) ||
                    (app.applicantEmail && app.applicantEmail.toLowerCase().includes(term)) ||
                    (app.position && app.position.toLowerCase().includes(term))
                );
            });
    }, [pendingApps, searchTerm, positionFilter, getApplicantFullInfo]);

    // Enriched Selected Group Members
    const enrichedSelectedGroup = useMemo(() => {
        return selectedGroup.map(app => getApplicantFullInfo(app));
    }, [selectedGroup, getApplicantFullInfo]);

    // Available positions in selected call for filtering
    const callPositions = useMemo(() => {
        if (!selectedCall?.positions) return [];
        return selectedCall.positions.map(p => typeof p === 'string' ? p : p.title).filter(Boolean);
    }, [selectedCall]);

    // Shared with list for selected call
    const currentSharedEmails = useMemo(() => {
        return Array.isArray(selectedCall?.sharedWith) ? selectedCall.sharedWith : [];
    }, [selectedCall]);

    // Committee members available to share with (not creator, not current user, not already shared)
    const availableToShare = useMemo(() => {
        if (!selectedCall) return [];
        const creatorEmail = (directorsList[selectedCall.createdBy]?.email || "").toLowerCase().trim();
        const existingShares = currentSharedEmails.map(e => (e || "").toLowerCase().trim());

        return Object.values(directorsList).filter(dir => {
            if (!dir.email) return false;
            const normEmail = dir.email.toLowerCase().trim();
            if (normEmail === creatorEmail) return false;
            if (existingShares.includes(normEmail)) return false;
            return true;
        });
    }, [selectedCall, directorsList, currentSharedEmails]);

    const canManageSharing = useMemo(() => {
        if (!selectedCall || !user) return false;
        return isAdmin || selectedCall.createdBy === user.uid;
    }, [selectedCall, user, isAdmin]);

    const canPublishOrManage = useMemo(() => {
        if (!selectedCall || !user) return false;
        const isOwner = selectedCall.createdBy === user.uid;
        const isCollaborator = Array.isArray(selectedCall.sharedWith) && 
            selectedCall.sharedWith.some(e => e && user.email && e.toLowerCase().trim() === user.email.toLowerCase().trim());
        return isAdmin || isOwner || isCollaborator;
    }, [selectedCall, user, isAdmin]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-24 space-y-4">
                <Loader2 className="animate-spin text-pink-600" size={44} />
                <p className="text-gray-500 text-sm font-medium">Loading OC Calls & Applications...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-16">
            
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="space-y-1.5">
                    <div>
                        <Link
                            href={isAdmin ? "/admin" : "/profile"}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-pink-600 bg-gray-100 hover:bg-pink-50 px-3 py-1.5 rounded-lg transition"
                        >
                            <ArrowLeft size={14} /> Back to {isAdmin ? "Admin" : "Profile"}
                        </Link>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Manage OC Calls</h1>
                    <p className="text-gray-500 text-sm">
                        Publish calls, review applications with applicant profiles, collaborate with committee members, and select your team.
                    </p>
                </div>
                <Link 
                    href="/admin/oc-calls/create" 
                    className="bg-pink-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-pink-700 transition flex items-center justify-center gap-2 shadow-sm text-sm"
                >
                    + Create New Call
                </Link>
            </div>

            {/* Admin Director Filter */}
            {isAdmin && (
                <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-wrap items-center gap-4">
                    <span className="font-bold text-gray-700 text-sm">Filter by Director / Creator:</span>
                    <select 
                        value={directorFilter} 
                        onChange={(e) => setDirectorFilter(e.target.value)}
                        className="p-2 border rounded-lg outline-none text-sm bg-white text-gray-800 focus:border-pink-600"
                    >
                        <option value="all">All Directors</option>
                        {uniqueDirectorUids.map(uid => (
                            <option key={uid} value={uid}>{getDirectorDisplay(uid)}</option>
                        ))}
                    </select>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column: Projects List */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-fit">
                    <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                        <span className="font-bold text-gray-700 text-sm">Your Projects ({displayedCalls.length})</span>
                    </div>
                    <div className="divide-y divide-gray-100 max-h-[700px] overflow-y-auto">
                        {displayedCalls.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-sm">
                                <Users size={32} className="mx-auto mb-2 opacity-40" />
                                <p>No projects found.</p>
                            </div>
                        ) : (
                            displayedCalls.map(call => {
                                const isSelected = selectedCall?.id === call.id;
                                const isOwner = call.createdBy === user?.uid;
                                const isSharedWithMe = Array.isArray(call.sharedWith) && 
                                    call.sharedWith.some(e => e && user?.email && e.toLowerCase().trim() === user.email.toLowerCase().trim());
                                const countForCall = applications.filter(a => a.callId === call.id).length;

                                return (
                                    <button 
                                        key={call.id}
                                        onClick={() => { setSelectedCall(call); setActiveTab('applicants'); setSearchTerm(""); }}
                                        className={`w-full text-left p-4 hover:bg-pink-50/70 transition-all ${
                                            isSelected ? 'bg-pink-50 border-l-4 border-pink-600' : ''
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className="font-bold text-gray-900 text-sm line-clamp-1">{call.applicationName}</h3>
                                            <span className="bg-pink-100 text-pink-700 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                                                {countForCall} {countForCall === 1 ? 'app' : 'apps'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 font-medium mt-1 truncate">
                                            By: {getDirectorDisplay(call.createdBy)}
                                        </p>
                                        
                                        <div className="flex items-center gap-2 mt-2">
                                            {isOwner && (
                                                <span className="text-[10px] font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                                                    Owner
                                                </span>
                                            )}
                                            {isSharedWithMe && !isOwner && (
                                                <span className="text-[10px] font-semibold bg-purple-50 text-purple-700 px-2 py-0.5 rounded flex items-center gap-1">
                                                    <Share2 size={10} /> Shared with you
                                                </span>
                                            )}
                                            {Array.isArray(call.sharedWith) && call.sharedWith.length > 0 && (
                                                <span className="text-[10px] text-gray-400 font-medium">
                                                    Shared with {call.sharedWith.length}
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Right Column: Management View */}
                {selectedCall ? (
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* Selected Call Header & Share Management Card */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-5">
                            
                            {/* Call Header */}
                            <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 pb-4 border-b border-gray-100">
                                <div>
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <h2 className="text-2xl font-bold text-gray-900">{selectedCall.applicationName}</h2>
                                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                                            selectedCall.status === 'open' 
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                                : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {selectedCall.status || 'Active'}
                                        </span>
                                        {selectedCall.published !== false && selectedCall.published ? (
                                            <span className="text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                                                <Globe size={11} /> Published Post
                                            </span>
                                        ) : (
                                            <span className="text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider bg-gray-100 text-gray-500 border border-gray-200">
                                                Draft / Hidden
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Created by: <span className="font-semibold text-gray-700">{getDirectorDisplay(selectedCall.createdBy)}</span>
                                    </p>
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-2 self-start">
                                    {canPublishOrManage && (
                                        selectedCall.published !== false && selectedCall.published ? (
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    onClick={handleOpenPublishModal}
                                                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
                                                    title="Edit published post description and banner"
                                                >
                                                    <Edit3 size={13} /> Edit Post
                                                </button>
                                                <button
                                                    onClick={handleUnpublishCall}
                                                    className="text-amber-700 bg-amber-50 hover:bg-amber-100 text-xs font-bold px-2.5 py-1.5 rounded-lg border border-amber-200 transition"
                                                    title="Unpublish post from member accounts"
                                                >
                                                    Unpublish
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={handleOpenPublishModal}
                                                className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm transition"
                                            >
                                                <Sparkles size={14} /> Publish as Post
                                            </button>
                                        )
                                    )}

                                    {(selectedCall.createdBy === user?.uid || isAdmin) && (
                                        <button 
                                            onClick={() => handleDeleteCall(selectedCall.id)} 
                                            className="text-red-500 text-xs font-bold hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 flex items-center gap-1.5 transition"
                                            title="Delete Entire Call"
                                        >
                                            <Trash2 size={14} /> Delete
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Project Post Preview Banner */}
                            {(selectedCall.description || selectedCall.imageUrl) && (
                                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-start">
                                    {selectedCall.imageUrl && (
                                        <div className="w-full sm:w-36 h-28 rounded-lg overflow-hidden shrink-0 border border-gray-200 bg-white">
                                            <img src={selectedCall.imageUrl} alt={selectedCall.applicationName} className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                    <div className="flex-1 space-y-1 text-xs">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px]">Public Post Description</span>
                                            {selectedCall.published !== false && selectedCall.published ? (
                                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                    <Globe size={10} /> Active in Member Accounts
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                                                    Draft / Hidden from Members
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-gray-700 whitespace-pre-line leading-relaxed line-clamp-3">
                                            {selectedCall.description || "No description provided yet."}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* SHARE MANAGEMENT SECTION */}
                            <div className="bg-gradient-to-br from-pink-50/40 to-purple-50/30 border border-pink-100/80 rounded-xl p-4 space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-pink-100 text-pink-700 rounded-lg">
                                            <Share2 size={16} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-sm">
                                                Shared Committee Members ({currentSharedEmails.length})
                                            </h3>
                                            <p className="text-[11px] text-gray-500">
                                                Committee members who can view and manage applicants for this call
                                            </p>
                                        </div>
                                    </div>

                                    {selectedCall.createdBy === user?.uid ? (
                                        <span className="text-[11px] font-bold bg-pink-100 text-pink-700 px-2 py-0.5 rounded-md self-start sm:self-auto">
                                            You are the Owner
                                        </span>
                                    ) : (
                                        <span className="text-[11px] font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-md self-start sm:self-auto">
                                            Collaborator
                                        </span>
                                    )}
                                </div>

                                {/* Who it is already shared with */}
                                {currentSharedEmails.length === 0 ? (
                                    <div className="bg-white/80 border border-pink-100 p-3 rounded-lg text-xs text-gray-500 italic">
                                        Not shared with any committee members yet. Only you and Administrators currently have access.
                                    </div>
                                ) : (
                                    <div className="space-y-1.5">
                                        <p className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Already shared with:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {currentSharedEmails.map((email) => {
                                                const member = Object.values(directorsList).find(d => 
                                                    d.email && d.email.toLowerCase().trim() === email.toLowerCase().trim()
                                                ) || usersMap[email.toLowerCase().trim()];

                                                const name = member?.name || email;
                                                const position = member?.position || "Committee Member";

                                                return (
                                                    <div 
                                                        key={email}
                                                        className="flex items-center gap-2 bg-white border border-pink-200 text-gray-800 text-xs py-1.5 pl-2.5 pr-2 rounded-xl shadow-xs"
                                                    >
                                                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                                                            {name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="leading-tight">
                                                            <p className="font-bold text-gray-900 text-xs">{name}</p>
                                                            <p className="text-[10px] text-pink-600 font-medium">{position}</p>
                                                        </div>

                                                        {canManageSharing && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRevokeShare(email)}
                                                                className="text-gray-400 hover:text-red-600 p-1 rounded-md transition hover:bg-red-50 ml-1"
                                                                title={`Revoke access for ${name}`}
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Share Form */}
                                {canManageSharing && (
                                    <form onSubmit={handleShareCall} className="pt-2 border-t border-pink-100 flex flex-col sm:flex-row gap-2">
                                        {availableToShare.length === 0 ? (
                                            <p className="text-xs text-gray-500 italic py-1">
                                                All available committee members already have access to this project.
                                            </p>
                                        ) : (
                                            <>
                                                <select 
                                                    required 
                                                    value={selectedShareEmail} 
                                                    onChange={(e) => setSelectedShareEmail(e.target.value)}
                                                    className="flex-1 p-2 text-xs border border-gray-200 rounded-lg outline-none bg-white text-gray-800 focus:border-pink-600 font-medium"
                                                >
                                                    <option value="">Select Committee Member to Share With...</option>
                                                    {availableToShare.map(dir => (
                                                        <option key={dir.uid} value={dir.email}>
                                                            {dir.position} - {dir.name} ({dir.email})
                                                        </option>
                                                    ))}
                                                </select>
                                                <button 
                                                    type="submit" 
                                                    disabled={sharingLoading || !selectedShareEmail}
                                                    className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50 transition shrink-0"
                                                >
                                                    {sharingLoading ? <Loader2 size={14} className="animate-spin" /> : <Share2 size={14} />}
                                                    Share Access
                                                </button>
                                            </>
                                        )}
                                    </form>
                                )}
                            </div>
                        </div>

                        {/* Tabs Navigation */}
                        <div className="flex gap-2 bg-gray-100 p-1.5 rounded-xl w-fit">
                            <button 
                                onClick={() => setActiveTab('applicants')} 
                                className={`px-5 py-2 rounded-lg font-bold text-sm transition ${
                                    activeTab === 'applicants' ? 'bg-white shadow-sm text-pink-600' : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                Applicants ({pendingApps.length})
                            </button>
                            <button 
                                onClick={() => setActiveTab('group')} 
                                className={`px-5 py-2 rounded-lg font-bold text-sm transition ${
                                    activeTab === 'group' ? 'bg-white shadow-sm text-pink-600' : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                Selected OC Group ({selectedGroup.length})
                            </button>
                        </div>

                        {/* TAB 1: APPLICANTS VIEW */}
                        {activeTab === 'applicants' && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                                
                                {/* Search and Filter Header */}
                                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            placeholder="Search by Name, Faculty, Contact, Index No, or Email..."
                                            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:border-pink-600 outline-none text-gray-800"
                                        />
                                        {searchTerm && (
                                            <button 
                                                onClick={() => setSearchTerm("")}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>

                                    {callPositions.length > 0 && (
                                        <select
                                            value={positionFilter}
                                            onChange={(e) => setPositionFilter(e.target.value)}
                                            className="p-2 text-sm border border-gray-200 rounded-xl outline-none bg-white text-gray-700 focus:border-pink-600 shrink-0"
                                        >
                                            <option value="all">All Positions</option>
                                            {callPositions.map(pos => (
                                                <option key={pos} value={pos}>{pos}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                {filteredPendingApps.length === 0 ? (
                                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-100">
                                        <User size={36} className="mx-auto text-gray-300 mb-2" />
                                        <p className="text-gray-500 font-medium text-sm">
                                            {pendingApps.length === 0 ? "No pending applications for this call." : "No applicants match your search criteria."}
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Desktop Table: Name | Faculty | Number | IndexNumber | Email | Actions */}
                                        <div className="hidden md:block overflow-x-auto border border-gray-100 rounded-xl">
                                            <table className="w-full text-left text-sm">
                                                <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-[11px] tracking-wider border-b border-gray-100">
                                                    <tr>
                                                        <th className="p-3">Name & Position</th>
                                                        <th className="p-3">Faculty</th>
                                                        <th className="p-3">Number</th>
                                                        <th className="p-3">Index Number</th>
                                                        <th className="p-3">Email</th>
                                                        <th className="p-3 text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {filteredPendingApps.map(app => (
                                                        <tr key={app.id} className="hover:bg-pink-50/40 transition-colors">
                                                            {/* Name */}
                                                            <td className="p-3">
                                                                <div className="flex items-center gap-2.5">
                                                                    {app.imageUrl ? (
                                                                        <img 
                                                                            src={app.imageUrl} 
                                                                            alt={app.applicantName} 
                                                                            className="w-8 h-8 rounded-full object-cover shrink-0 border border-gray-200" 
                                                                        />
                                                                    ) : (
                                                                        <div className="w-8 h-8 rounded-full bg-pink-100 text-pink-700 font-bold text-xs flex items-center justify-center shrink-0">
                                                                            {app.applicantName?.charAt(0) || "U"}
                                                                        </div>
                                                                    )}
                                                                    <div>
                                                                        <p className="font-bold text-gray-900 leading-tight">{app.applicantName}</p>
                                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                                            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                                                                                {app.position}
                                                                            </span>
                                                                            {app.teamRole !== "N/A" && (
                                                                                <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                                                                                    {app.teamRole}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            {/* Faculty */}
                                                            <td className="p-3 text-gray-700">
                                                                <span className="text-xs font-medium">{app.faculty}</span>
                                                            </td>

                                                            {/* Number */}
                                                            <td className="p-3">
                                                                <a 
                                                                    href={`tel:${app.contactNumber}`} 
                                                                    className="font-mono text-xs text-gray-800 hover:text-pink-600 transition flex items-center gap-1"
                                                                >
                                                                    <Phone size={11} className="text-gray-400" />
                                                                    {app.contactNumber}
                                                                </a>
                                                            </td>

                                                            {/* IndexNumber */}
                                                            <td className="p-3">
                                                                <span className="font-mono text-xs font-bold bg-gray-100 text-gray-800 px-2 py-0.5 rounded">
                                                                    {app.indexNumber}
                                                                </span>
                                                            </td>

                                                            {/* Email */}
                                                            <td className="p-3">
                                                                <a 
                                                                    href={`mailto:${app.applicantEmail}`} 
                                                                    className="text-xs text-gray-600 hover:text-pink-600 transition truncate max-w-[160px] block" 
                                                                    title={app.applicantEmail}
                                                                >
                                                                    {app.applicantEmail}
                                                                </a>
                                                            </td>

                                                            {/* Actions */}
                                                            <td className="p-3 text-right">
                                                                <div className="flex items-center justify-end gap-1.5">
                                                                    <button
                                                                        onClick={() => setViewingApplicant(app)}
                                                                        className="p-1.5 bg-gray-100 hover:bg-purple-100 text-gray-700 hover:text-purple-700 rounded-lg text-xs font-bold transition flex items-center gap-1"
                                                                        title="See More Details"
                                                                    >
                                                                        <Eye size={14} />
                                                                        <span>See More</span>
                                                                    </button>

                                                                    <button
                                                                        onClick={() => handleSelectApplicant(app.id)}
                                                                        className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold transition flex items-center gap-1"
                                                                        title="Select for OC"
                                                                    >
                                                                        <CheckCircle size={14} />
                                                                        <span>Select</span>
                                                                    </button>

                                                                    <button
                                                                        onClick={() => handleDeleteApplication(app.id)}
                                                                        className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs transition"
                                                                        title="Reject / Delete"
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Mobile Card View */}
                                        <div className="md:hidden space-y-3">
                                            {filteredPendingApps.map(app => (
                                                <div key={app.id} className="border border-gray-200 rounded-xl p-4 bg-white shadow-2xs space-y-3">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div>
                                                            <h3 className="font-bold text-gray-900">{app.applicantName}</h3>
                                                            <p className="text-xs text-gray-500">{app.applicantEmail}</p>
                                                        </div>
                                                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                                                            {app.position}
                                                        </span>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-2.5 rounded-lg">
                                                        <div>
                                                            <span className="text-[10px] uppercase font-bold text-gray-500 block">Faculty</span>
                                                            <span className="text-gray-800 font-medium">{app.faculty}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] uppercase font-bold text-gray-500 block">Index No</span>
                                                            <span className="font-mono text-gray-900 font-bold">{app.indexNumber}</span>
                                                        </div>
                                                        <div className="col-span-2">
                                                            <span className="text-[10px] uppercase font-bold text-gray-500 block">Number</span>
                                                            <span className="font-mono text-gray-800">{app.contactNumber}</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                                                        <button
                                                            onClick={() => setViewingApplicant(app)}
                                                            className="flex-1 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition"
                                                        >
                                                            <Eye size={13} /> See More
                                                        </button>
                                                        <button
                                                            onClick={() => handleSelectApplicant(app.id)}
                                                            className="flex-1 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition"
                                                        >
                                                            <CheckCircle size={13} /> Select
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteApplication(app.id)}
                                                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* TAB 2: SELECTED GROUP VIEW */}
                        {activeTab === 'group' && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                                
                                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-2 border-b border-gray-100">
                                    <div>
                                        <h3 className="font-bold text-gray-900">Final Organizing Committee Team</h3>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {selectedGroup.length} member{selectedGroup.length === 1 ? '' : 's'} confirmed
                                        </p>
                                    </div>

                                    {selectedGroup.length > 0 && (
                                        <div className="flex flex-wrap items-center gap-2">
                                            <button 
                                                onClick={() => {
                                                    const emails = enrichedSelectedGroup.map(g => g.applicantEmail).filter(Boolean).join(',');
                                                    window.location.href = `mailto:?bcc=${emails}&subject=Selected for ${selectedCall.applicationName} Organizing Committee!&body=Dear OC Member,%0D%0A%0D%0ACongratulations on being selected for the ${selectedCall.applicationName} Organizing Committee.%0D%0A%0D%0AWe look forward to working with you!`;
                                                }}
                                                className="text-xs bg-gray-900 text-white px-3.5 py-2 rounded-lg hover:bg-gray-800 font-bold transition flex items-center gap-1.5"
                                            >
                                                <Mail size={13} /> Email Entire Group
                                            </button>
                                            
                                            <button
                                                onClick={() => {
                                                    const emails = enrichedSelectedGroup.map(g => g.applicantEmail).filter(Boolean).join(', ');
                                                    copyToClipboard(emails, "All Emails");
                                                }}
                                                className="text-xs border border-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 font-medium transition flex items-center gap-1"
                                                title="Copy all group emails"
                                            >
                                                <Copy size={13} /> Copy Emails
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="overflow-x-auto border border-gray-100 rounded-xl">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-[11px] tracking-wider border-b border-gray-100">
                                            <tr>
                                                <th className="p-3">Position</th>
                                                <th className="p-3">Name</th>
                                                <th className="p-3">Faculty</th>
                                                <th className="p-3">Number</th>
                                                <th className="p-3">Index Number</th>
                                                <th className="p-3">Email</th>
                                                <th className="p-3 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {enrichedSelectedGroup.length === 0 ? (
                                                <tr>
                                                    <td colSpan="7" className="p-8 text-center text-gray-400 text-sm">
                                                        No members selected yet. Review applicants and click &quot;Select&quot; to build your OC.
                                                    </td>
                                                </tr>
                                            ) : (
                                                enrichedSelectedGroup.map(member => (
                                                    <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="p-3 font-semibold text-pink-600 text-xs">
                                                            {member.position} {member.teamRole !== 'N/A' && `(${member.teamRole})`}
                                                        </td>
                                                        <td className="p-3 font-bold text-gray-900 text-xs">{member.applicantName}</td>
                                                        <td className="p-3 text-gray-600 text-xs">{member.faculty}</td>
                                                        <td className="p-3 font-mono text-gray-600 text-xs">{member.contactNumber}</td>
                                                        <td className="p-3 font-mono text-gray-700 text-xs font-semibold">{member.indexNumber}</td>
                                                        <td className="p-3 text-gray-600 text-xs">{member.applicantEmail}</td>
                                                        <td className="p-3 text-right">
                                                            <div className="flex items-center justify-end gap-1.5">
                                                                <button 
                                                                    onClick={() => setViewingApplicant(member)} 
                                                                    className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                                                                    title="See More Details"
                                                                >
                                                                    <Eye size={15} />
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleUnselectApplicant(member.id)} 
                                                                    className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                                                                    title="Move Back to Pending"
                                                                >
                                                                    <Undo2 size={15} />
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleDeleteApplication(member.id)} 
                                                                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                                                    title="Remove from Group"
                                                                >
                                                                    <Trash2 size={15} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                    </div>
                ) : (
                    <div className="lg:col-span-2 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col items-center justify-center p-20 text-gray-400 min-h-[400px]">
                        <Users size={48} className="mb-4 opacity-40" />
                        <p className="font-medium text-sm">Select a project from the left to view applications.</p>
                    </div>
                )}
            </div>

            {/* "SEE MORE" COMPREHENSIVE APPLICANT DETAILS MODAL */}
            {mounted && createPortal(
                <AnimatePresence>
                    {viewingApplicant && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto"
                            onClick={() => setViewingApplicant(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0, y: 15 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.95, opacity: 0, y: 15 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto"
                            >
                                {/* Modal Header */}
                                <div className="p-6 bg-gradient-to-r from-pink-600 to-rose-600 text-white relative">
                                    <div className="absolute top-4 right-4 flex items-center gap-2">
                                        <button
                                            onClick={() => setViewingApplicant(null)}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-xl text-white text-xs font-bold transition"
                                            title="Back to Applicants"
                                        >
                                            <ArrowLeft size={14} /> Back
                                        </button>
                                        <button
                                            onClick={() => setViewingApplicant(null)}
                                            className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition hover:rotate-90"
                                            title="Close"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                                        {viewingApplicant.imageUrl ? (
                                            <img
                                                src={viewingApplicant.imageUrl}
                                                alt={viewingApplicant.applicantName}
                                                className="w-20 h-20 rounded-2xl object-cover border-2 border-white/40 shadow-md shrink-0 bg-white"
                                            />
                                        ) : (
                                            <div className="w-20 h-20 rounded-2xl bg-white/20 border-2 border-white/40 flex items-center justify-center text-3xl font-bold shadow-md shrink-0">
                                                {viewingApplicant.applicantName?.charAt(0) || "U"}
                                            </div>
                                        )}

                                        <div className="text-center sm:text-left space-y-1">
                                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                                                <h2 className="text-xl sm:text-2xl font-bold">{viewingApplicant.applicantName}</h2>
                                                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                                                    viewingApplicant.status === 'selected' 
                                                        ? 'bg-emerald-500 text-white' 
                                                        : 'bg-white/20 text-white border border-white/30'
                                                }`}>
                                                    {viewingApplicant.status === 'selected' ? 'Selected for OC' : 'Pending Review'}
                                                </span>
                                            </div>
                                            <p className="text-pink-100 text-sm">{viewingApplicant.applicantEmail}</p>

                                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                                                <span className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-lg font-bold">
                                                    Position: {viewingApplicant.position}
                                                </span>
                                                {viewingApplicant.teamRole && viewingApplicant.teamRole !== "N/A" && (
                                                    <span className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-lg font-bold">
                                                        Team: {viewingApplicant.teamRole}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Modal Body (Scrollable) */}
                                <div className="p-6 space-y-6 overflow-y-auto">
                                    
                                    {/* Primary 5 Fields Summary Card */}
                                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                                            Primary Applicant Summary
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                            <div className="p-2.5 bg-white rounded-xl border border-gray-100">
                                                <p className="text-[10px] uppercase font-bold text-gray-400">Full Name</p>
                                                <p className="font-bold text-gray-900 mt-0.5">{viewingApplicant.applicantName}</p>
                                            </div>

                                            <div className="p-2.5 bg-white rounded-xl border border-gray-100">
                                                <p className="text-[10px] uppercase font-bold text-gray-400">Index Number / Student ID</p>
                                                <div className="flex items-center justify-between mt-0.5">
                                                    <span className="font-mono font-bold text-pink-600">{viewingApplicant.indexNumber}</span>
                                                    <button 
                                                        onClick={() => copyToClipboard(viewingApplicant.indexNumber, "Index Number")}
                                                        className="text-gray-400 hover:text-gray-700" 
                                                        title="Copy Index Number"
                                                    >
                                                        {copiedField === "Index Number" ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="p-2.5 bg-white rounded-xl border border-gray-100">
                                                <p className="text-[10px] uppercase font-bold text-gray-400">Faculty</p>
                                                <p className="font-medium text-gray-900 mt-0.5">{viewingApplicant.faculty}</p>
                                            </div>

                                            <div className="p-2.5 bg-white rounded-xl border border-gray-100">
                                                <p className="text-[10px] uppercase font-bold text-gray-400">Contact Number (WhatsApp/Mobile)</p>
                                                <div className="flex items-center justify-between mt-0.5">
                                                    <a href={`tel:${viewingApplicant.contactNumber}`} className="font-mono font-medium text-blue-600 hover:underline">
                                                        {viewingApplicant.contactNumber}
                                                    </a>
                                                    <button 
                                                        onClick={() => copyToClipboard(viewingApplicant.contactNumber, "Contact Number")}
                                                        className="text-gray-400 hover:text-gray-700"
                                                        title="Copy Number"
                                                    >
                                                        {copiedField === "Contact Number" ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="p-2.5 bg-white rounded-xl border border-gray-100 sm:col-span-2">
                                                <p className="text-[10px] uppercase font-bold text-gray-400">Email Address</p>
                                                <div className="flex items-center justify-between mt-0.5">
                                                    <a href={`mailto:${viewingApplicant.applicantEmail}`} className="font-medium text-blue-600 hover:underline">
                                                        {viewingApplicant.applicantEmail}
                                                    </a>
                                                    <button 
                                                        onClick={() => copyToClipboard(viewingApplicant.applicantEmail, "Email")}
                                                        className="text-gray-400 hover:text-gray-700"
                                                        title="Copy Email"
                                                    >
                                                        {copiedField === "Email" ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Personal & Academic Profile */}
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            Academic & Personal Details
                                        </h4>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                                            <div className="p-3 bg-gray-50 rounded-xl">
                                                <p className="text-gray-500 font-semibold mb-0.5">Department</p>
                                                <p className="font-medium text-gray-900">{viewingApplicant.department || "N/A"}</p>
                                            </div>
                                            <div className="p-3 bg-gray-50 rounded-xl">
                                                <p className="text-gray-500 font-semibold mb-0.5">National ID (NIC)</p>
                                                <p className="font-medium text-gray-900 font-mono">{viewingApplicant.nic || "N/A"}</p>
                                            </div>
                                            <div className="p-3 bg-gray-50 rounded-xl">
                                                <p className="text-gray-500 font-semibold mb-0.5">Gender</p>
                                                <p className="font-medium text-gray-900 capitalize">{viewingApplicant.gender || "N/A"}</p>
                                            </div>
                                            <div className="p-3 bg-gray-50 rounded-xl">
                                                <p className="text-gray-500 font-semibold mb-0.5">Date of Birth</p>
                                                <p className="font-medium text-gray-900">{viewingApplicant.dob || "N/A"}</p>
                                            </div>
                                            <div className="p-3 bg-gray-50 rounded-xl">
                                                <p className="text-gray-500 font-semibold mb-0.5">Club Position</p>
                                                <p className="font-medium text-gray-900">{viewingApplicant.userPosition || "Member"}</p>
                                            </div>
                                            <div className="p-3 bg-gray-50 rounded-xl">
                                                <p className="text-gray-500 font-semibold mb-0.5">Applied Timestamp</p>
                                                <p className="font-medium text-gray-900">{formatDate(viewingApplicant.appliedAt)}</p>
                                            </div>
                                        </div>

                                        {(viewingApplicant.residentialAddress !== "N/A" || viewingApplicant.city) && (
                                            <div className="p-3 bg-gray-50 rounded-xl text-xs space-y-1">
                                                <p className="text-gray-500 font-semibold">Residential Address</p>
                                                <p className="font-medium text-gray-800">
                                                    {[
                                                        viewingApplicant.residentialAddress !== "N/A" ? viewingApplicant.residentialAddress : null,
                                                        viewingApplicant.city,
                                                        viewingApplicant.province,
                                                        viewingApplicant.postalCode
                                                    ].filter(Boolean).join(", ") || "N/A"}
                                                </p>
                                            </div>
                                        )}

                                        {viewingApplicant.reason && (
                                            <div className="p-3 bg-pink-50/50 border border-pink-100 rounded-xl text-xs space-y-1">
                                                <p className="text-pink-700 font-bold">Why they joined Rotaract / Bio Statement</p>
                                                <p className="text-gray-700 italic">&quot;{viewingApplicant.reason}&quot;</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Application Form Responses (Custom Questions) */}
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            Application Form Responses
                                        </h4>
                                        
                                        {!viewingApplicant.customAnswers || Object.keys(viewingApplicant.customAnswers).length === 0 ? (
                                            <p className="text-xs text-gray-400 italic p-3 bg-gray-50 rounded-xl">
                                                No custom question responses were required for this application.
                                            </p>
                                        ) : (
                                            <div className="space-y-2.5">
                                                {Object.entries(viewingApplicant.customAnswers).map(([qId, answer]) => {
                                                    const qDef = selectedCall?.customQuestions?.find(q => q.id === qId);
                                                    const questionText = qDef?.questionText || qId;
                                                    
                                                    return (
                                                        <div key={qId} className="bg-gray-50 border border-gray-100 p-3 rounded-xl space-y-1 text-xs">
                                                            <p className="font-bold text-gray-700">Q: {questionText}</p>
                                                            <div className="pt-0.5 text-gray-900 font-medium">
                                                                {Array.isArray(answer) ? (
                                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                                        {answer.map((ansItem, i) => (
                                                                            <span key={i} className="bg-pink-100 text-pink-700 px-2 py-0.5 rounded-md font-semibold">
                                                                                {ansItem}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                ) : typeof answer === 'boolean' ? (
                                                                    <span className={`px-2 py-0.5 rounded font-bold ${answer ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                                        {answer ? 'Yes' : 'No'}
                                                                    </span>
                                                                ) : (
                                                                    <p className="whitespace-pre-wrap">{answer || "No response provided"}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                </div>

                                {/* Modal Footer Actions */}
                                <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                                    <button
                                        onClick={() => setViewingApplicant(null)}
                                        className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-100 transition flex items-center gap-1.5"
                                    >
                                        <ArrowLeft size={14} /> Back to Applicants
                                    </button>

                                    <div className="flex items-center gap-2">
                                        <a
                                            href={`mailto:${viewingApplicant.applicantEmail}?subject=Rotaract OC Call - ${selectedCall.applicationName}&body=Hi ${viewingApplicant.applicantName},`}
                                            className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                                        >
                                            <Mail size={13} /> Email Applicant
                                        </a>

                                        {viewingApplicant.status !== 'selected' ? (
                                            <button
                                                onClick={() => handleSelectApplicant(viewingApplicant.id)}
                                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
                                            >
                                                <CheckCircle size={14} /> Select for OC
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleUnselectApplicant(viewingApplicant.id)}
                                                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
                                            >
                                                <Undo2 size={14} /> Move to Pending
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* PUBLISH / EDIT POST MODAL */}
            {mounted && createPortal(
                <AnimatePresence>
                    {publishModalOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto"
                            onClick={() => setPublishModalOpen(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0, y: 15 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.95, opacity: 0, y: 15 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] my-auto"
                            >
                                <div className="p-6 bg-gradient-to-r from-pink-600 to-rose-600 text-white relative">
                                    <div className="absolute top-4 right-4 flex items-center gap-2">
                                        <button
                                            onClick={() => setPublishModalOpen(false)}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-xl text-white text-xs font-bold transition"
                                        >
                                            <ArrowLeft size={14} /> Back
                                        </button>
                                        <button
                                            onClick={() => setPublishModalOpen(false)}
                                            className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition hover:rotate-90"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Sparkles size={20} className="text-pink-200" />
                                        <h2 className="text-xl font-bold">Publish Call as Member Post</h2>
                                    </div>
                                    <p className="text-pink-100 text-xs">
                                        Provide a description and event poster so all members can view and apply for this event in their accounts.
                                    </p>
                                </div>

                                <form onSubmit={handleSubmitPublish} className="p-6 space-y-5 overflow-y-auto">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                            Project Name
                                        </label>
                                        <p className="font-bold text-gray-900 text-base">{selectedCall?.applicationName}</p>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-pink-600 uppercase tracking-wider mb-1.5">
                                            Project / Event Description *
                                        </label>
                                        <textarea
                                            rows={5}
                                            required
                                            value={publishDescription}
                                            onChange={(e) => setPublishDescription(e.target.value)}
                                            placeholder="Explain what the event is about, what the organizing committee will do, responsibilities, and why members should apply..."
                                            className="w-full p-3.5 border-2 border-gray-200 rounded-xl focus:border-pink-600 outline-none text-sm text-gray-800 font-poppins transition"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-pink-600 uppercase tracking-wider mb-1.5">
                                            Event Poster / Promotional Banner
                                        </label>
                                        <p className="text-xs text-gray-500 mb-3">Upload a banner image or provide an image link to show in members&apos; project feeds.</p>

                                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                            <label className="flex items-center justify-center gap-2 px-4 py-2.5 bg-pink-50 text-pink-600 border border-pink-200 rounded-xl font-bold text-xs cursor-pointer hover:bg-pink-100 transition shrink-0">
                                                {uploadingPublishImage ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
                                                <span>{uploadingPublishImage ? "Uploading..." : "Upload Poster Image"}</span>
                                                <input 
                                                    type="file" 
                                                    accept="image/*" 
                                                    disabled={uploadingPublishImage}
                                                    onChange={handleUploadPublishImage} 
                                                    className="hidden" 
                                                />
                                            </label>

                                            <input 
                                                type="url" 
                                                placeholder="Or enter image URL (https://...)"
                                                value={publishImageUrl}
                                                onChange={(e) => setPublishImageUrl(e.target.value)}
                                                className="flex-1 p-2.5 text-xs border border-gray-200 rounded-xl outline-none focus:border-pink-600 text-gray-800"
                                            />
                                        </div>

                                        {publishImageUrl && (
                                            <div className="mt-3 relative w-full h-44 rounded-2xl overflow-hidden border border-gray-200 bg-gray-50">
                                                <img src={publishImageUrl} alt="Poster preview" className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => setPublishImageUrl("")}
                                                    className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-600 text-white rounded-full transition"
                                                    title="Remove Image"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setPublishModalOpen(false)}
                                            className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition flex items-center gap-1.5"
                                        >
                                            <ArrowLeft size={14} /> Back
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={savingPublish || uploadingPublishImage}
                                            className="px-5 py-2.5 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5 disabled:opacity-50"
                                        >
                                            {savingPublish ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                            <span>{selectedCall?.published ? "Save & Update Post" : "Publish as Member Post"}</span>
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}

        </div>
    );
}