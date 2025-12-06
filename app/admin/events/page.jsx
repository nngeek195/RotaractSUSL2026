"use client";

import { useState, useEffect, useRef } from "react";
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
    Calendar, MapPin, Edit, Trash, CheckCircle, Plus, Users, Loader2,
    X, Image as ImageIcon, Search, Filter, ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

const CLOUDINARY_UPLOAD_URL = "https://api.cloudinary.com/v1_1/dvqoiqzxe/image/upload";
const CLOUDINARY_UPLOAD_PRESET = "projects";

export default function EventHandling() {
    // Data States
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, upcoming: 0, completed: 0 });

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
    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        title: "",
        location: "",
        date: "",
        description: "",
        imageUrl: "",
        participants: ""
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
            const completedCount = eventsList.filter(e => e.status === "completed").length;
            setStats({
                total: eventsList.length,
                upcoming: upcomingCount,
                completed: completedCount
            });

        } catch (error) {
            console.error("Error fetching events:", error);
        }
        setLoading(false);
    };

    const uploadImage = async () => {
        if (!selectedFile) return formData.imageUrl;

        const sanitizeFolderName = (name) =>
            name.toLowerCase()
                .trim()
                .replace(/[^a-z0-9\s-]/g, "")
                .replace(/\s+/g, "-");

        const folderName = sanitizeFolderName(formData.title || "untitled");

        const formDataUpload = new FormData();
        formDataUpload.append("file", selectedFile);
        formDataUpload.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
        formDataUpload.append("folder", `Projects/${folderName}`);

        setUploading(true);
        setUploadMessage("");

        try {
            const res = await fetch(CLOUDINARY_UPLOAD_URL, {
                method: "POST",
                body: formDataUpload,
            });

            const data = await res.json();

            if (data.secure_url) {
                setUploadMessage("Image uploaded successfully.");
                return data.secure_url;
            } else {
                throw new Error("Upload failed");
            }
        } catch (err) {
            console.error(err);
            setUploadMessage("Image upload error.");
            throw err;
        } finally {
            setUploading(false);
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
            participants: ""
        });
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
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
        setFormData({
            title: event.title,
            location: event.location,
            date: event.date,
            description: event.description,
            imageUrl: event.imageUrl,
            participants: event.participants ? event.participants.join(', ') : ""
        });
        setIsModalOpen(true);
    };

    const openMarkDoneModal = (event) => {
        setIsEditing(true);
        setCurrentEventId(event.id);
        setIsMarkingAsDone(true);
        setFormData({
            title: event.title,
            location: event.location,
            date: event.date,
            description: event.description,
            imageUrl: event.imageUrl,
            participants: event.participants ? event.participants.join(', ') : ""
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isEditing && !selectedFile) {
            alert("Please select an image for the new project.");
            return;
        }

        if (isMarkingAsDone && !formData.participants) {
            alert("Please add participants to mark this project as completed.");
            return;
        }

        setLoading(true);

        try {
            let imageUrl = formData.imageUrl;
            if (selectedFile) {
                imageUrl = await uploadImage();
            }

            const eventData = {
                title: formData.title,
                location: formData.location,
                date: formData.date,
                description: formData.description,
                imageUrl: imageUrl,
                updatedAt: Timestamp.now()
            };

            // Handle Participants
            if (formData.participants) {
                eventData.participants = formData.participants.split(',').map(email => email.trim());
            }

            if (isMarkingAsDone) {
                eventData.status = "completed";
                await updateDoc(doc(db, "events", currentEventId), eventData);
                alert("Project marked as completed!");
            } else if (isEditing) {
                // Keep existing status if just editing details
                await updateDoc(doc(db, "events", currentEventId), eventData);
                alert("Event updated successfully!");
            } else {
                eventData.status = "upcoming";
                await addDoc(collection(db, "events"), eventData);
                alert("Event created successfully!");
            }

            resetForm();
            fetchEvents();
        } catch (error) {
            console.error("Error saving event:", error);
            alert("Failed to save event.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Delete this event permanently?")) return;
        try {
            await deleteDoc(doc(db, "events", id));
            setEvents(prev => prev.filter(e => e.id !== id));
            // Recalculate stats locally or refetch
            setStats(prev => ({ ...prev, total: prev.total - 1 }));
        } catch (error) {
            console.error("Error deleting:", error);
        }
    };

    // Filter events
    const filteredEvents = events
        .filter(e => e.status === view)
        .filter(e =>
            e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.location.toLowerCase().includes(searchTerm.toLowerCase())
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: "Upcoming Events", value: stats.upcoming, icon: Calendar, color: "bg-pink-500", lightColor: "bg-pink-50 text-pink-600" },
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
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-md ${event.status === 'upcoming'
                                                ? 'bg-pink-500/90 text-white'
                                                : 'bg-green-500/90 text-white'
                                            }`}>
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
                                            <button
                                                onClick={() => openMarkDoneModal(event)}
                                                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 font-bold text-xs transition-colors"
                                            >
                                                <CheckCircle size={14} /> Mark Done
                                            </button>
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
                                            className="p-2.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 hover:text-red-800 transition-colors"
                                            title="Delete"
                                        >
                                            <Trash size={16} />
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
                                            <div className="col-span-2">
                                                <label className="block text-sm font-bold text-gray-700 mb-2">Project Title</label>
                                                <input
                                                    name="title"
                                                    value={formData.title}
                                                    onChange={handleInputChange}
                                                    required
                                                    placeholder="e.g. Annual Blood Drive 2024"
                                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2">Location</label>
                                                <div className="relative">
                                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                    <input
                                                        name="location"
                                                        value={formData.location}
                                                        onChange={handleInputChange}
                                                        required
                                                        placeholder="Colombo"
                                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
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
                                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                                    />
                                                </div>
                                            </div>

                                            <div className="col-span-2">
                                                <label className="block text-sm font-bold text-gray-700 mb-2">Cover Image</label>
                                                <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:bg-gray-50 transition-colors relative">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => setSelectedFile(e.target.files[0])}
                                                        ref={fileInputRef}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    />

                                                    {selectedFile ? (
                                                        <div className="relative h-48 w-full rounded-lg overflow-hidden group">
                                                            <img
                                                                src={URL.createObjectURL(selectedFile)}
                                                                alt="Preview"
                                                                className="w-full h-full object-cover"
                                                            />
                                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <span className="text-white font-bold text-sm">Click to Change</span>
                                                            </div>
                                                        </div>
                                                    ) : formData.imageUrl ? (
                                                        <div className="relative h-48 w-full rounded-lg overflow-hidden group">
                                                            <img
                                                                src={formData.imageUrl}
                                                                alt="Current"
                                                                className="w-full h-full object-cover"
                                                            />
                                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <span className="text-white font-bold text-sm">Click to Change</span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="py-8">
                                                            <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                                                                <ImageIcon size={24} />
                                                            </div>
                                                            <p className="text-sm font-bold text-gray-700">Click to upload cover image</p>
                                                            <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                                                        </div>
                                                    )}
                                                </div>
                                                {uploadMessage && <p className="text-xs font-bold text-green-600 mt-2">{uploadMessage}</p>}
                                            </div>

                                            <div className="col-span-2">
                                                <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                                                <textarea
                                                    name="description"
                                                    value={formData.description}
                                                    onChange={handleInputChange}
                                                    required
                                                    rows="4"
                                                    placeholder="Detailed description of the project..."
                                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                                />
                                            </div>

                                            {/* Participants Field - Only for 'Mark as Done' or 'Completed' view editing */}
                                            {(isMarkingAsDone || (isEditing && view === 'completed')) && (
                                                <div className="col-span-2 bg-blue-50 p-4 rounded-xl border border-blue-100">
                                                    <label className="block text-sm font-bold text-blue-900 mb-1 flex items-center gap-2">
                                                        <Users size={16} />
                                                        Participants (Required for Completion)
                                                    </label>
                                                    <p className="text-xs text-blue-600 mb-3 font-medium">Add participant emails separated by commas to award points.</p>
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

                                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
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
                                        className={`px-6 py-2.5 text-white font-bold rounded-xl transition-all shadow-lg text-sm flex items-center gap-2
                                            ${isMarkingAsDone
                                                ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:to-emerald-700 shadow-green-900/10'
                                                : 'bg-gray-900 hover:bg-gray-800 shadow-gray-900/10'
                                            }
                                        `}
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={16} /> : <ArrowRight size={16} />}
                                        {isMarkingAsDone ? "Complete Project" : isEditing ? "Save Changes" : "Create Project"}
                                    </button>
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