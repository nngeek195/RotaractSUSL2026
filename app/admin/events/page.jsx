"use client";

import { useState, useEffect, useRef } from "react";
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
    Calendar, MapPin, Edit, Trash, CheckCircle, Plus, Users, Loader2,
    X, Image as ImageIcon, Search, Filter, ArrowRight, Eye, Star,
    PlayCircle, Radio
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { confirmToast } from "@/lib/confirmToast";

const CLOUDINARY_UPLOAD_URL = "https://api.cloudinary.com/v1_1/dvqoiqzxe/image/upload";
const CLOUDINARY_UPLOAD_PRESET = "projects";

export default function EventHandling() {
    // Data States
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, upcoming: 0, happening: 0, completed: 0 });

    // UI States
    const [view, setView] = useState("upcoming");
    const [searchTerm, setSearchTerm] = useState("");
    const [mounted, setMounted] = useState(false);

    // Modal & Form States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentEventId, setCurrentEventId] = useState(null);
    const [isMarkingAsDone, setIsMarkingAsDone] = useState(false);

    // Upload States
    const [uploading, setUploading] = useState(false);
    const [uploadMessage, setUploadMessage] = useState("");
    const [startingEventId, setStartingEventId] = useState(null);
    const [deletingEventId, setDeletingEventId] = useState(null);

    // File States
    const [selectedCoverFile, setSelectedCoverFile] = useState(null);
    const [globalGalleryFiles, setGlobalGalleryFiles] = useState([]);
    const [projectGalleryFiles, setProjectGalleryFiles] = useState([]);

    // Existing URLs (for editing)
    const [existingGlobalImages, setExistingGlobalImages] = useState([]);
    const [existingProjectImages, setExistingProjectImages] = useState([]);

    const coverInputRef = useRef(null);
    const globalInputRef = useRef(null);
    const projectInputRef = useRef(null);

    const [formData, setFormData] = useState({
        title: "",
        location: "",
        date: "",
        description: "",
        imageUrl: "",
        participants: "",
        status: "upcoming"
    });

    useEffect(() => {
        setMounted(true);
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, "events"));
            const eventsList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Sort by date (newest first)
            eventsList.sort((a, b) => new Date(b.date) - new Date(a.date));
            setEvents(eventsList);

            // Calculate stats
            const upcomingCount = eventsList.filter(e => e.status === "upcoming").length;
            const happeningCount = eventsList.filter(e => e.status === "happening now").length;
            const completedCount = eventsList.filter(e => e.status === "completed").length;
            setStats({
                total: eventsList.length,
                upcoming: upcomingCount,
                happening: happeningCount,
                completed: completedCount
            });

        } catch (error) {
            console.error("Error fetching events:", error);
        }
        setLoading(false);
    };

    // Helper to upload a single file
    const uploadSingleFile = async (file, folderName) => {
        const formDataUpload = new FormData();
        formDataUpload.append("file", file);
        formDataUpload.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
        formDataUpload.append("folder", `Projects/${folderName}`);

        const res = await fetch(CLOUDINARY_UPLOAD_URL, {
            method: "POST",
            body: formDataUpload,
        });

        const data = await res.json();
        if (data.secure_url) {
            return data.secure_url;
        } else {
            throw new Error("Upload failed");
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const resetForm = () => {
        setFormData({
            title: "",
            location: "",
            date: "",
            description: "",
            imageUrl: "",
            participants: "",
            status: "upcoming"
        });

        setSelectedCoverFile(null);
        setGlobalGalleryFiles([]);
        setProjectGalleryFiles([]);
        setExistingGlobalImages([]);
        setExistingProjectImages([]);

        if (coverInputRef.current) coverInputRef.current.value = "";
        if (globalInputRef.current) globalInputRef.current.value = "";
        if (projectInputRef.current) projectInputRef.current.value = "";

        setIsEditing(false);
        setCurrentEventId(null);
        setIsMarkingAsDone(false);
        setUploadMessage("");
        setIsModalOpen(false);
    };

    const openCreateModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const openEditModal = (event) => {
        setIsEditing(true);
        setCurrentEventId(event.id);
        setIsMarkingAsDone(false);

        // Split existing gallery images into categories
        const gallery = event.galleryImages || [];
        const globalDocs = gallery.filter(img => img.featured);
        const projectDocs = gallery.filter(img => !img.featured);

        setExistingGlobalImages(globalDocs);
        setExistingProjectImages(projectDocs);

        setFormData({
            title: event.title || event.name || "",
            location: event.location || "",
            date: event.date || "",
            description: event.description || "",
            imageUrl: event.imageUrl || event.image || "",
            participants: event.participants ? event.participants.join(', ') : "",
            status: event.status || "upcoming"
        });
        setIsModalOpen(true);
    };

    const openMarkDoneModal = (event) => {
        setIsEditing(true);
        setCurrentEventId(event.id);
        setIsMarkingAsDone(true);

        const gallery = event.galleryImages || [];
        const globalDocs = gallery.filter(img => img.featured);
        const projectDocs = gallery.filter(img => !img.featured);

        setExistingGlobalImages(globalDocs);
        setExistingProjectImages(projectDocs);

        setFormData({
            title: event.title || event.name || "",
            location: event.location || "",
            date: event.date || "",
            description: event.description || "",
            imageUrl: event.imageUrl || event.image || "",
            participants: event.participants ? event.participants.join(', ') : "",
            status: "completed"
        });
        setIsModalOpen(true);
    };

    // Remove file from selection
    const removeNewFile = (type, index) => {
        if (type === 'global') {
            setGlobalGalleryFiles(prev => prev.filter((_, i) => i !== index));
        } else if (type === 'project') {
            setProjectGalleryFiles(prev => prev.filter((_, i) => i !== index));
        }
    };

    // Remove existing image
    const removeExistingImage = (type, index) => {
        if (type === 'global') {
            setExistingGlobalImages(prev => prev.filter((_, i) => i !== index));
        } else if (type === 'project') {
            setExistingProjectImages(prev => prev.filter((_, i) => i !== index));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isEditing && !selectedCoverFile) {
            toast.error("Please select a cover image for the new project.");
            return;
        }

        setLoading(true);
        setUploading(true);
        setUploadMessage("Uploading images...");

        try {
            const sanitizeFolderName = (name) =>
                name.toLowerCase()
                    .trim()
                    .replace(/[^a-z0-9\s-]/g, "")
                    .replace(/\s+/g, "-");
            const folderName = sanitizeFolderName(formData.title || "untitled");

            // 1. Upload Cover Image if changed
            let imageUrl = formData.imageUrl;
            if (selectedCoverFile) {
                imageUrl = await uploadSingleFile(selectedCoverFile, folderName);
            }

            // 2. Upload New Global Gallery Images
            const newGlobalUrls = await Promise.all(
                globalGalleryFiles.map(file => uploadSingleFile(file, folderName))
            );

            // 3. Upload New Project Gallery Images
            const newProjectUrls = await Promise.all(
                projectGalleryFiles.map(file => uploadSingleFile(file, folderName))
            );

            // 4. Construct Final Gallery Array
            const finalGallery = [
                ...existingGlobalImages, // Keep existing tagged as featured
                ...newGlobalUrls.map(url => ({ url, featured: true })),
                ...existingProjectImages, // Keep existing tagged as not featured
                ...newProjectUrls.map(url => ({ url, featured: false }))
            ];

            const eventData = {
                title: formData.title,
                name: formData.title,
                location: formData.location,
                date: formData.date,
                description: formData.description,
                imageUrl: imageUrl,
                galleryImages: finalGallery,
                updatedAt: Timestamp.now()
            };

            // Handle Participants
            if (formData.participants) {
                eventData.participants = formData.participants.split(',').map(email => email.trim());
            }

            if (isMarkingAsDone) {
                eventData.status = "completed";
                await updateDoc(doc(db, "events", currentEventId), eventData);
                toast.success("Project marked as completed!");
            } else if (isEditing) {
                if (formData.status) {
                    eventData.status = formData.status;
                }
                await updateDoc(doc(db, "events", currentEventId), eventData);
                toast.success("Event updated successfully!");
            } else {
                eventData.status = "upcoming";
                await addDoc(collection(db, "events"), eventData);
                toast.success("Event created successfully!");
            }

            resetForm();
            fetchEvents();
        } catch (error) {
            console.error("Error saving event:", error);
            toast.error("Failed to save event. Check console for details.");
        } finally {
            setLoading(false);
            setUploading(false);
            setUploadMessage("");
        }
    };

    const handleDelete = async (id) => {
        if (!(await confirmToast({ message: "Delete this event permanently?", confirmLabel: "Delete" }))) return;
        setDeletingEventId(id);
        try {
            await deleteDoc(doc(db, "events", id));
            setEvents(prev => prev.filter(e => e.id !== id));
            setStats(prev => ({ ...prev, total: prev.total - 1 }));
            toast.success("Event deleted successfully.");
        } catch (error) {
            console.error("Error deleting:", error);
            toast.error("Failed to delete event.");
        } finally {
            setDeletingEventId(null);
        }
    };

    const handleStartEvent = async (event) => {
        if (!(await confirmToast({
            message: `Start "${event.title || event.name}" now?`,
            description: "This will make the event LIVE and visible under Happening Now.",
            confirmLabel: "Start Event"
        }))) return;

        setStartingEventId(event.id);
        try {
            await updateDoc(doc(db, "events", event.id), {
                status: "happening now",
                updatedAt: Timestamp.now()
            });
            toast.success(`"${event.title || event.name}" is now LIVE! You can update details anytime.`, {
                action: {
                    label: "Edit Data",
                    onClick: () => openEditModal({ ...event, status: "happening now" })
                }
            });
            await fetchEvents();
        } catch (error) {
            console.error("Error starting event:", error);
            toast.error("Failed to start event.");
        } finally {
            setStartingEventId(null);
        }
    };

    // Filter events
    const filteredEvents = events
        .filter(e => e.status === view)
        .filter(e =>
            (e.title && e.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (e.name && e.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (e.location && e.location.toLowerCase().includes(searchTerm.toLowerCase()))
        );

    const LoadingSkeleton = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
                <div key={i} className="h-96 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
        </div>
    );

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-20">

            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Event Management</h1>
                    <p className="text-gray-500 mt-1 font-medium">Plan upcoming events and archive completed projects.</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="px-5 py-2.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/10 flex items-center gap-2 active:scale-95"
                >
                    <Plus size={20} /> Add New Project
                </button>
            </header>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Upcoming Events", value: stats.upcoming, icon: Calendar, color: "bg-pink-500", lightColor: "bg-pink-50 text-pink-600" },
                    { label: "Happening Now", value: stats.happening, icon: Radio, color: "bg-amber-500", lightColor: "bg-amber-50 text-amber-600" },
                    { label: "Completed Projects", value: stats.completed, icon: CheckCircle, color: "bg-green-500", lightColor: "bg-green-50 text-green-600" },
                    { label: "Total Activities", value: stats.total, icon: Users, color: "bg-blue-500", lightColor: "bg-blue-50 text-blue-600" },
                ].map((stat, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5 hover:shadow-md transition-shadow"
                    >
                        <div className={`p-4 rounded-xl ${stat.lightColor}`}>
                            <stat.icon size={28} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium mb-1">{stat.label}</p>
                            <h3 className="text-3xl font-bold text-gray-900">{stat.value}</h3>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Controls & Tabs */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-gray-200 pb-1">
                <div className="flex gap-8">
                    <button
                        onClick={() => setView("upcoming")}
                        className={`pb-4 px-2 font-bold text-sm uppercase tracking-wide transition-colors relative ${view === "upcoming" ? "text-pink-600" : "text-gray-400 hover:text-gray-600"}`}
                    >
                        Upcoming
                        {view === "upcoming" && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-600" />}
                    </button>
                    <button
                        onClick={() => setView("happening now")}
                        className={`pb-4 px-2 font-bold text-sm uppercase tracking-wide transition-colors relative flex items-center gap-2 ${view === "happening now" ? "text-amber-600" : "text-gray-400 hover:text-gray-600"}`}
                    >
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        Happening Now
                        {view === "happening now" && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600" />}
                    </button>
                    <button
                        onClick={() => setView("completed")}
                        className={`pb-4 px-2 font-bold text-sm uppercase tracking-wide transition-colors relative ${view === "completed" ? "text-green-600" : "text-gray-400 hover:text-gray-600"}`}
                    >
                        Completed
                        {view === "completed" && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600" />}
                    </button>
                </div>

                <div className="relative w-full md:w-72 mb-4 md:mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder={`Search ${view} projects...`}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Content Grid */}
            {loading ? (
                <LoadingSkeleton />
            ) : filteredEvents.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                        <Calendar size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">No {view} events found</h3>
                    <p className="text-gray-500">Try adjusting your search or add a new project.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <AnimatePresence mode="popLayout">
                        {filteredEvents.map((event, i) => (
                            <motion.div
                                key={event.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: i * 0.05 }}
                                className="group bg-white rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col h-full"
                            >
                                <div className="h-56 bg-gray-200 relative overflow-hidden">
                                    <img
                                        src={event.imageUrl}
                                        alt={event.title}
                                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                                        onError={(e) => e.target.src = 'https://via.placeholder.com/400x200?text=No+Image'}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                    <div className="absolute top-4 right-4 flex gap-2">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-md ${
                                            event.status === 'upcoming'
                                                ? 'bg-pink-500/90 text-white'
                                                : event.status === 'happening now'
                                                ? 'bg-amber-500/95 text-white flex items-center gap-1.5 ring-2 ring-amber-300/50'
                                                : 'bg-green-500/90 text-white'
                                            }`}>
                                            {event.status === 'happening now' && <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />}
                                            {event.status}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-6 flex-1 flex flex-col">
                                    <h3 className="text-xl font-bold text-gray-900 mb-3 leading-tight">{event.title}</h3>

                                    <div className="space-y-2.5 mb-5">
                                        <div className="flex items-center gap-2.5 text-sm text-gray-600 font-medium bg-gray-50 p-2 rounded-lg w-fit">
                                            <Calendar size={16} className="text-pink-500" /> {event.date}
                                        </div>
                                        <div className="flex items-center gap-2.5 text-sm text-gray-600 font-medium bg-gray-50 p-2 rounded-lg w-fit">
                                            <MapPin size={16} className="text-blue-500" /> {event.location}
                                        </div>
                                    </div>

                                    <p className="text-gray-500 text-sm line-clamp-3 mb-6 flex-1 leading-relaxed">
                                        {event.description}
                                    </p>

                                    {view === 'completed' && event.participants && (
                                        <div className="mb-5 flex items-center gap-2 text-xs font-bold text-blue-700 bg-blue-50 py-2 px-3 rounded-lg border border-blue-100">
                                            <Users size={14} />
                                            {event.participants.length} Members Participated
                                        </div>
                                    )}

                                    <div className="flex gap-2 pt-4 border-t border-gray-100 mt-auto">
                                        {view === 'upcoming' && (
                                            <>
                                                <button
                                                    onClick={() => handleStartEvent(event)}
                                                    disabled={startingEventId === event.id}
                                                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-amber-50 text-amber-700 hover:bg-amber-100 font-bold text-xs rounded-lg transition-colors disabled:opacity-50"
                                                    title="Start project and go live"
                                                >
                                                    {startingEventId === event.id ? (
                                                        <Loader2 size={14} className="animate-spin text-amber-600" />
                                                    ) : (
                                                        <PlayCircle size={14} className="text-amber-600" />
                                                    )}
                                                    {startingEventId === event.id ? "Starting..." : "Start Event"}
                                                </button>
                                                <button
                                                    onClick={() => openMarkDoneModal(event)}
                                                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 font-bold text-xs transition-colors"
                                                >
                                                    <CheckCircle size={14} /> Mark Done
                                                </button>
                                            </>
                                        )}
                                        {view === 'happening now' && (
                                            <>
                                                <button
                                                    onClick={() => openEditModal(event)}
                                                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-amber-500 text-white hover:bg-amber-600 font-bold text-xs rounded-lg transition-colors shadow-sm"
                                                    title="Update all project details while live"
                                                >
                                                    <Edit size={14} /> Update Project Data
                                                </button>
                                                <button
                                                    onClick={() => openMarkDoneModal(event)}
                                                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 font-bold text-xs transition-colors"
                                                >
                                                    <CheckCircle size={14} /> Mark Done
                                                </button>
                                            </>
                                        )}
                                        <button
                                            onClick={() => openEditModal(event)}
                                            className="p-2.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 hover:text-blue-800 transition-colors"
                                            title="Edit"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(event.id)}
                                            disabled={deletingEventId === event.id}
                                            className="p-2.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 hover:text-red-800 transition-colors disabled:opacity-50"
                                            title="Delete"
                                        >
                                            {deletingEventId === event.id ? (
                                                <Loader2 size={16} className="animate-spin text-red-600" />
                                            ) : (
                                                <Trash size={16} />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Portal Modal */}
            {mounted && createPortal(
                <AnimatePresence>
                    {isModalOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4"
                            onClick={() => setIsModalOpen(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
                            >
                                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                        {isMarkingAsDone ? (
                                            <><CheckCircle className="text-green-600" /> Complete Project</>
                                        ) : isEditing ? (
                                            <><Edit className="text-blue-600" /> Edit Project</>
                                        ) : (
                                            <><Plus className="text-pink-600" /> Create New Project</>
                                        )}
                                    </h3>
                                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                        <X size={24} />
                                    </button>
                                </div>

                                <div className="p-6 overflow-y-auto">
                                    <form id="eventForm" onSubmit={handleSubmit} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Basic Info */}
                                            <div className="col-span-2">
                                                <label className="block text-sm font-bold text-gray-700 mb-2">Project Title</label>
                                                <input
                                                    name="title"
                                                    value={formData.title}
                                                    onChange={handleInputChange}
                                                    required
                                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                                />
                                            </div>

                                            {isEditing && (
                                                <div className="col-span-2">
                                                    <label className="block text-sm font-bold text-gray-700 mb-2">Event Status</label>
                                                    <select
                                                        name="status"
                                                        value={formData.status || "upcoming"}
                                                        onChange={handleInputChange}
                                                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white font-medium text-gray-800"
                                                    >
                                                        <option value="upcoming">Upcoming</option>
                                                        <option value="happening now">Happening Now (Live)</option>
                                                        <option value="completed">Completed</option>
                                                    </select>
                                                </div>
                                            )}

                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2">Location</label>
                                                <div className="relative">
                                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                    <input
                                                        name="location"
                                                        value={formData.location}
                                                        onChange={handleInputChange}
                                                        required
                                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2">Date</label>
                                                <div className="relative">
                                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                    <input
                                                        type="date"
                                                        name="date"
                                                        value={formData.date}
                                                        onChange={handleInputChange}
                                                        required
                                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                                    />
                                                </div>
                                            </div>

                                            {/* Cover Image Upload */}
                                            <div className="col-span-2 text-center">
                                                <label className="block text-sm font-bold text-gray-700 mb-2 text-left">Cover Image</label>
                                                <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors relative">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => setSelectedCoverFile(e.target.files[0])}
                                                        ref={coverInputRef}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    />
                                                    {selectedCoverFile ? (
                                                        <div className="h-40 w-full rounded-lg overflow-hidden"><img src={URL.createObjectURL(selectedCoverFile)} className="w-full h-full object-cover" /></div>
                                                    ) : formData.imageUrl ? (
                                                        <div className="h-40 w-full rounded-lg overflow-hidden"><img src={formData.imageUrl} className="w-full h-full object-cover" /></div>
                                                    ) : (
                                                        <div className="py-6 text-gray-400">Click to upload cover <ImageIcon className="mx-auto mt-2" /></div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="col-span-2">
                                                <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                                                <textarea
                                                    name="description"
                                                    value={formData.description}
                                                    onChange={handleInputChange}
                                                    required
                                                    rows="3"
                                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                                />
                                            </div>

                                            {/* --- GALLERY SECTIONS --- */}
                                            <div className="col-span-2 border-t border-gray-100 pt-6">
                                                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                    <ImageIcon className="text-pink-600" /> Project Gallery
                                                </h4>

                                                {/* 1. Global (Featured) Gallery Section */}
                                                <div className="mb-6 bg-pink-50 p-4 rounded-xl border border-pink-100">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <label className="text-sm font-bold text-pink-900 flex items-center gap-2">
                                                            <Star size={16} fill="currentColor" /> Global Gallery Images
                                                        </label>
                                                        <span className="text-[10px] uppercase font-bold text-pink-500 bg-white px-2 py-1 rounded-full">Shows on Gallery Page</span>
                                                    </div>

                                                    {/* Existing Global */}
                                                    {existingGlobalImages.length > 0 && (
                                                        <div className="grid grid-cols-4 gap-2 mb-3">
                                                            {existingGlobalImages.map((img, idx) => (
                                                                <div key={idx} className="relative h-20 rounded-lg overflow-hidden group">
                                                                    <img src={img.url} className="w-full h-full object-cover" />
                                                                    <button type="button" onClick={() => removeExistingImage('global', idx)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* New Global Uploads */}
                                                    <input
                                                        type="file"
                                                        multiple
                                                        accept="image/*"
                                                        ref={globalInputRef}
                                                        onChange={(e) => setGlobalGalleryFiles(prev => [...prev, ...Array.from(e.target.files)])}
                                                        className="block w-full text-sm text-pink-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-pink-100 file:text-pink-700 hover:file:bg-pink-200 mb-3"
                                                    />
                                                    {globalGalleryFiles.length > 0 && (
                                                        <div className="grid grid-cols-4 gap-2">
                                                            {globalGalleryFiles.map((file, idx) => (
                                                                <div key={idx} className="relative h-20 rounded-lg overflow-hidden group border border-pink-200">
                                                                    <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                                                                    <button type="button" onClick={() => removeNewFile('global', idx)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* 2. Project Only (Not Featured) Gallery Section */}
                                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                                            <ImageIcon size={16} /> Project-Only Images
                                                        </label>
                                                        <span className="text-[10px] uppercase font-bold text-gray-500 bg-white px-2 py-1 rounded-full">Only on Project Page</span>
                                                    </div>

                                                    {/* Existing Project Only */}
                                                    {existingProjectImages.length > 0 && (
                                                        <div className="grid grid-cols-4 gap-2 mb-3">
                                                            {existingProjectImages.map((img, idx) => (
                                                                <div key={idx} className="relative h-20 rounded-lg overflow-hidden group">
                                                                    <img src={img.url} className="w-full h-full object-cover grayscale" />
                                                                    <button type="button" onClick={() => removeExistingImage('project', idx)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* New Project Uploads */}
                                                    <input
                                                        type="file"
                                                        multiple
                                                        accept="image/*"
                                                        ref={projectInputRef}
                                                        onChange={(e) => setProjectGalleryFiles(prev => [...prev, ...Array.from(e.target.files)])}
                                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-gray-200 file:text-gray-700 hover:file:bg-gray-300 mb-3"
                                                    />
                                                    {projectGalleryFiles.length > 0 && (
                                                        <div className="grid grid-cols-4 gap-2">
                                                            {projectGalleryFiles.map((file, idx) => (
                                                                <div key={idx} className="relative h-20 rounded-lg overflow-hidden group border border-gray-200">
                                                                    <img src={URL.createObjectURL(file)} className="w-full h-full object-cover grayscale" />
                                                                    <button type="button" onClick={() => removeNewFile('project', idx)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Participants Field */}
                                            {(isMarkingAsDone || (isEditing && view === 'completed')) && (
                                                <div className="col-span-2 bg-blue-50 p-4 rounded-xl border border-blue-100 mt-4">
                                                    <label className="block text-sm font-bold text-blue-900 mb-1 flex items-center gap-2">
                                                        <Users size={16} /> Participants (Optional)
                                                    </label>
                                                    <p className="text-xs text-blue-600 mb-3 font-medium">Add participant emails separated by commas if available.</p>
                                                    <textarea
                                                        name="participants"
                                                        value={formData.participants}
                                                        onChange={handleInputChange}
                                                        rows="3"
                                                        className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                                        placeholder="john@example.com, jane@example.com..."
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </form>
                                </div>

                                <div className="p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                                    <div>
                                        {(uploading || loading) && (
                                            <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 bg-blue-50 py-1.5 px-3 rounded-lg border border-blue-100 animate-pulse">
                                                <Loader2 size={13} className="animate-spin" />
                                                <span>{uploadMessage || (isMarkingAsDone ? "Saving & completing..." : isEditing ? "Saving changes..." : "Creating project...")}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setIsModalOpen(false)}
                                            className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-200 rounded-xl transition-colors text-sm"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            form="eventForm"
                                            disabled={loading || uploading}
                                            className={`px-6 py-2.5 text-white font-bold rounded-xl transition-all shadow-lg text-sm flex items-center gap-2 disabled:opacity-50
                                                ${isMarkingAsDone
                                                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:to-emerald-700 shadow-green-900/10'
                                                    : 'bg-gray-900 hover:bg-gray-800 shadow-gray-900/10'
                                                }
                                            `}
                                        >
                                            {(uploading || loading) ? <Loader2 className="animate-spin" size={16} /> : <ArrowRight size={16} />}
                                            {(uploading || loading) 
                                                ? (uploadMessage || (isMarkingAsDone ? "Completing..." : isEditing ? "Saving..." : "Creating...")) 
                                                : isMarkingAsDone ? "Complete Project" : isEditing ? "Save Changes" : "Create Project"}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
}
