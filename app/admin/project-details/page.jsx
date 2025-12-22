"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
    Edit, Save, X, Plus, Trash2, Image as ImageIcon,
    MessageSquare, Users as UsersIcon, DollarSign, Calendar,
    Loader2, ChevronRight, LayoutGrid, FileText, Share2, MapPin,
    Star
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CLOUDINARY_UPLOAD_URL = "https://api.cloudinary.com/v1_1/dvqoiqzxe/image/upload";
const CLOUDINARY_UPLOAD_PRESET = "projects";

const TABS = [
    { id: "overview", label: "Overview", icon: LayoutGrid },
    { id: "media", label: "Media Gallery", icon: ImageIcon },
    { id: "content", label: "Content", icon: FileText },
    { id: "relations", label: "Relations", icon: UsersIcon },
];

export default function ProjectDetailsManagement() {
    // Core Data States
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProject, setSelectedProject] = useState(null);
    const [editingProject, setEditingProject] = useState(null);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("overview");

    // Form States
    const [formData, setFormData] = useState({
        title: "",
        date: "",
        location: "",
        status: "upcoming",
        description: "",
        mainImage: "",
        testimonials: [],
        partners: [],
        category: "",
        budget: "",
        longDescription: "",
    });

    // Separated Gallery States
    const [globalGalleryImages, setGlobalGalleryImages] = useState([]); // { url, featured: true }
    const [projectGalleryImages, setProjectGalleryImages] = useState([]); // { url, featured: false }

    // Upload States
    const [uploadingMain, setUploadingMain] = useState(false);
    const [uploadingGlobal, setUploadingGlobal] = useState(false);
    const [uploadingProject, setUploadingProject] = useState(false);

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, "events"));
            const projectsList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            projectsList.sort((a, b) => new Date(b.date) - new Date(a.date));
            setProjects(projectsList);
        } catch (error) {
            console.error("Error fetching projects:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectProject = (project) => {
        setSelectedProject(project);
        setEditingProject(project);
        setActiveTab("overview");

        // Split existing gallery into Global vs Project
        const rawGallery = project.galleryImages || [];
        const globalImgs = [];
        const projectImgs = [];

        rawGallery.forEach(item => {
            if (typeof item === 'string') {
                // Backward compatibility: Assume string URLs are standard Project images unless verified otherwise
                projectImgs.push({ url: item, featured: false });
            } else if (item && typeof item === 'object') {
                if (item.featured) {
                    globalImgs.push(item);
                } else {
                    projectImgs.push(item);
                }
            }
        });

        setGlobalGalleryImages(globalImgs);
        setProjectGalleryImages(projectImgs);

        // Populate Form
        setFormData({
            title: project.title || project.name || "",
            date: project.date || "",
            location: project.location || "",
            status: (project.status || "upcoming").toLowerCase(),
            description: project.description || "",
            mainImage: project.imageUrl || project.image || "",
            testimonials: project.testimonials || [],
            partners: project.partners || [],
            category: project.category || "Community Development",
            budget: project.budget || "",
            longDescription: project.longDescription || project.description || "",
        });
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        if (!editingProject) return;
        setSaving(true);
        try {
            // Combine gallery arrays
            const combinedGallery = [
                ...globalGalleryImages.map(img => ({ url: img.url, featured: true })),
                ...projectGalleryImages.map(img => ({ url: img.url, featured: false }))
            ];

            const updateData = {
                title: formData.title,
                name: formData.title, // Compatibility
                date: formData.date,
                location: formData.location,
                status: formData.status,
                description: formData.description,
                imageUrl: formData.mainImage,
                galleryImages: combinedGallery,
                testimonials: formData.testimonials,
                partners: formData.partners,
                category: formData.category,
                budget: formData.budget,
                longDescription: formData.longDescription,
            };

            await updateDoc(doc(db, "events", editingProject.id), updateData);

            // Refresh local state without full reload
            setProjects(prev => prev.map(p =>
                p.id === editingProject.id ? { ...p, ...updateData } : p
            ));

            alert("Project saved successfully!");
        } catch (error) {
            console.error("Error updating project:", error);
            alert("Failed to update project.");
        } finally {
            setSaving(false);
        }
    };

    // --- Media Handlers ---

    const handleUploadImage = async (file, folderSubpath) => {
        const sanitizeFolderName = (name) =>
            name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");

        const folderName = sanitizeFolderName(formData.title || "project");
        const formDataUpload = new FormData();
        formDataUpload.append("file", file);
        // We pass the folder path to our internal API
        formDataUpload.append("folder", `Projects/${folderName}${folderSubpath}`);

        // Call our internal API route instead of direct Cloudinary URL
        const res = await fetch("/api/upload", {
            method: "POST",
            body: formDataUpload,
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "Upload failed");
        }

        const data = await res.json();
        if (data.secure_url) return data.secure_url;
        throw new Error("Upload failed: No URL returned");
    };

    const onMainImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingMain(true);
        try {
            const url = await handleUploadImage(file, "");
            handleInputChange("mainImage", url);
        } catch (err) {
            alert("Upload failed.");
        } finally {
            setUploadingMain(false);
        }
    };

    const onGlobalGalleryUpload = async (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        setUploadingGlobal(true);
        try {
            const promises = files.map(file => handleUploadImage(file, "/gallery"));
            const urls = await Promise.all(promises);
            const newImages = urls.map(url => ({ url, featured: true }));
            setGlobalGalleryImages(prev => [...prev, ...newImages]);
        } catch (err) {
            alert("Some images failed to upload.");
        } finally {
            setUploadingGlobal(false);
        }
    };

    const onProjectGalleryUpload = async (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        setUploadingProject(true);
        try {
            const promises = files.map(file => handleUploadImage(file, "/gallery"));
            const urls = await Promise.all(promises);
            const newImages = urls.map(url => ({ url, featured: false }));
            setProjectGalleryImages(prev => [...prev, ...newImages]);
        } catch (err) {
            alert("Some images failed to upload.");
        } finally {
            setUploadingProject(false);
        }
    };

    // --- List Handlers (Testimonials/Partners) ---

    const updateListItem = (listName, index, field, value) => {
        const updatedList = [...formData[listName]];
        if (typeof updatedList[index] === 'object') {
            updatedList[index][field] = value;
        } else {
            updatedList[index] = value;
        }
        handleInputChange(listName, updatedList);
    };

    const addListItem = (listName, emptyItem) => {
        handleInputChange(listName, [...formData[listName], emptyItem]);
    };

    const removeListItem = (listName, index) => {
        handleInputChange(listName, formData[listName].filter((_, i) => i !== index));
    };

    return (
        <div className="max-w-[1600px] mx-auto pb-12 h-[calc(100vh-100px)] flex flex-col">
            {/* Header */}
            <div className={`mb-6 flex justify-between items-end ${selectedProject ? 'hidden md:flex' : 'flex'}`}>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Project Management</h1>
                    <p className="text-gray-500 mt-1 font-medium">Edit project details, media, and relations.</p>
                </div>
                {selectedProject && (
                    <div className="hidden md:block">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-gray-900 text-white px-6 py-2.5 rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/20 font-bold flex items-center gap-2 disabled:opacity-70 text-sm"
                        >
                            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            Save Changes
                        </button>
                    </div>
                )}
            </div>

            <div className="flex-1 flex gap-6 overflow-hidden relative">
                {/* Sidebar: Project List */}
                <div className={`
                    flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden shrink-0 transition-all duration-300
                    w-full md:w-96
                    ${selectedProject ? 'hidden md:flex' : 'flex'}
                `}>
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                        <h2 className="font-bold text-gray-700">All Projects ({projects.length})</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {loading ? (
                            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-gray-400" /></div>
                        ) : (
                            projects.map(project => (
                                <button
                                    key={project.id}
                                    onClick={() => handleSelectProject(project)}
                                    className={`w-full text-left p-3 rounded-xl transition-all border group relative ${selectedProject?.id === project.id
                                        ? "bg-blue-50 border-blue-200 shadow-sm"
                                        : "bg-white border-transparent hover:bg-gray-50 hover:border-gray-200"
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${selectedProject?.id === project.id ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"
                                            }`}>
                                            <Calendar size={18} />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className={`font-bold text-sm truncate ${selectedProject?.id === project.id ? "text-blue-900" : "text-gray-700"
                                                }`}>
                                                {project.title || project.name}
                                            </h3>
                                            <p className="text-xs text-gray-500 truncate">{project.date}</p>
                                        </div>
                                        <div className="hidden md:block">
                                            {selectedProject?.id === project.id && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500">
                                                    <ChevronRight size={16} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className={`
                    flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex-col overflow-hidden relative
                    ${selectedProject ? 'flex' : 'hidden md:flex'}
                `}>
                    {!selectedProject ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                <Edit size={40} className="opacity-20" />
                            </div>
                            <p className="text-lg font-medium">Select a project to start editing</p>
                        </div>
                    ) : (
                        <>
                            {/* Tabs Header */}
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-gray-100 px-4 pt-4 pb-0 sticky top-0 bg-white/80 backdrop-blur-md z-10 gap-4">

                                {/* Mobile Header with Back Button */}
                                <div className="flex items-center w-full md:w-auto md:hidden pb-2 border-b border-gray-100 md:border-0">
                                    <button
                                        onClick={() => setSelectedProject(null)}
                                        className="mr-3 p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full"
                                    >
                                        <ChevronRight size={24} className="rotate-180" />
                                    </button>
                                    <h3 className="font-bold text-lg truncate flex-1">{formData.title || "New Project"}</h3>
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="bg-gray-900 text-white p-2 rounded-lg"
                                    >
                                        {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                    </button>
                                </div>

                                <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto no-scrollbar">
                                    {TABS.map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`flex items-center gap-2 px-4 py-3 md:px-6 md:py-4 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id
                                                ? "border-blue-600 text-blue-600"
                                                : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50/50 rounded-t-lg"
                                                }`}
                                        >
                                            <tab.icon size={18} />
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>


                            </div>

                            {/* Tab Content */}
                            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={activeTab}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className="max-w-4xl mx-auto"
                                    >
                                        {/* --- OVERVIEW TAB --- */}
                                        {activeTab === "overview" && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div className="space-y-6">
                                                    <div>
                                                        <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block">Project Title</label>
                                                        <input
                                                            type="text"
                                                            value={formData.title}
                                                            onChange={(e) => handleInputChange("title", e.target.value)}
                                                            className="w-full p-3 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-medium text-gray-900"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block">Date</label>
                                                        <input
                                                            type="date"
                                                            value={formData.date}
                                                            onChange={(e) => handleInputChange("date", e.target.value)}
                                                            className="w-full p-3 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-medium text-gray-900"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-6">
                                                    <div>
                                                        <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block">Status</label>
                                                        <select
                                                            value={formData.status}
                                                            onChange={(e) => handleInputChange("status", e.target.value)}
                                                            className="w-full p-3 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-medium text-gray-900"
                                                        >
                                                            <option value="upcoming">Upcoming</option>
                                                            <option value="completed">Completed</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block">Location</label>
                                                        <div className="relative">
                                                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                            <input
                                                                type="text"
                                                                value={formData.location}
                                                                onChange={(e) => handleInputChange("location", e.target.value)}
                                                                className="w-full p-3 pl-10 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-medium text-gray-900"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="md:col-span-2 space-y-6 mt-2">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                        <div>
                                                            <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block">Category</label>
                                                            <input
                                                                type="text"
                                                                value={formData.category}
                                                                onChange={(e) => handleInputChange("category", e.target.value)}
                                                                className="w-full p-3 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-medium text-gray-900"
                                                                placeholder="e.g. Community Service"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block">Budget</label>
                                                            <div className="relative">
                                                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                                <input
                                                                    type="text"
                                                                    value={formData.budget}
                                                                    onChange={(e) => handleInputChange("budget", e.target.value)}
                                                                    className="w-full p-3 pl-10 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-medium text-gray-900"
                                                                    placeholder="e.g. 50,000 LKR"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* --- MEDIA TAB --- */}
                                        {activeTab === "media" && (
                                            <div className="space-y-8">
                                                {/* Main Image */}
                                                <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                                                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                                        <ImageIcon className="text-blue-500" size={20} /> Main Hero Image
                                                    </h3>
                                                    <div className="flex gap-6 items-start flex-col md:flex-row">
                                                        <div className="w-48 h-32 bg-gray-200 rounded-lg overflow-hidden shrink-0 border border-gray-300">
                                                            {formData.mainImage ? (
                                                                <img src={formData.mainImage} alt="Main" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="flex items-center justify-center h-full text-gray-400">No Image</div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 space-y-3 w-full">
                                                            <input
                                                                type="text"
                                                                value={formData.mainImage}
                                                                onChange={(e) => handleInputChange("mainImage", e.target.value)}
                                                                placeholder="Image URL"
                                                                className="w-full p-3 bg-white border-gray-200 rounded-xl text-sm"
                                                            />
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-xs font-bold text-gray-400 uppercase">OR</span>
                                                                <label className={`cursor-pointer px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-2 ${uploadingMain ? 'opacity-50 pointer-events-none' : ''}`}>
                                                                    {uploadingMain ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                                                                    Upload New
                                                                    <input type="file" className="hidden" accept="image/*" onChange={onMainImageUpload} />
                                                                </label>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Global Gallery (Featured) */}
                                                <div className="p-6 bg-pink-50 rounded-2xl border border-pink-100">
                                                    <div className="flex justify-between items-center mb-4">
                                                        <div>
                                                            <h3 className="font-bold text-pink-900 flex items-center gap-2">
                                                                <Star className="text-pink-600" size={20} fill="currentColor" /> Global Gallery Images
                                                            </h3>
                                                            <p className="text-xs text-pink-600 mt-1">These images appear on the main site Gallery page.</p>
                                                        </div>
                                                        <label className={`cursor-pointer px-4 py-2 bg-white text-pink-600 rounded-lg text-sm font-bold hover:bg-pink-50 transition-colors flex items-center gap-2 border border-pink-200 ${uploadingGlobal ? 'opacity-50 pointer-events-none' : ''}`}>
                                                            {uploadingGlobal ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                                                            Upload New
                                                            <input type="file" className="hidden" multiple accept="image/*" onChange={onGlobalGalleryUpload} />
                                                        </label>
                                                    </div>

                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                        {globalGalleryImages.map((img, idx) => (
                                                            <div key={idx} className="relative group aspect-square bg-white rounded-xl overflow-hidden border border-pink-200">
                                                                <img src={img.url} alt={`Global ${idx}`} className="w-full h-full object-cover" />
                                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                                    <button
                                                                        onClick={() => setGlobalGalleryImages(prev => prev.filter((_, i) => i !== idx))}
                                                                        className="p-2 bg-white rounded-lg text-gray-900 hover:bg-red-50 hover:text-red-600 transition-colors"
                                                                        title="Remove"
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {globalGalleryImages.length === 0 && (
                                                            <div className="col-span-full py-8 text-center text-pink-300 bg-white/50 rounded-xl border-dashed border-2 border-pink-200">
                                                                No global images yet. Upload some to feature them!
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Project Only Gallery */}
                                                <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                                                    <div className="flex justify-between items-center mb-4">
                                                        <div>
                                                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                                                <ImageIcon className="text-gray-500" size={20} /> Project-Only Images
                                                            </h3>
                                                            <p className="text-xs text-gray-500 mt-1">These images appear ONLY on this project's details page.</p>
                                                        </div>
                                                        <label className={`cursor-pointer px-4 py-2 bg-white text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-100 transition-colors flex items-center gap-2 border border-gray-200 ${uploadingProject ? 'opacity-50 pointer-events-none' : ''}`}>
                                                            {uploadingProject ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                                                            Upload New
                                                            <input type="file" className="hidden" multiple accept="image/*" onChange={onProjectGalleryUpload} />
                                                        </label>
                                                    </div>

                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                        {projectGalleryImages.map((img, idx) => (
                                                            <div key={idx} className="relative group aspect-square bg-white rounded-xl overflow-hidden border border-gray-200">
                                                                <img src={img.url} alt={`Project ${idx}`} className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
                                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                                    <button
                                                                        onClick={() => setProjectGalleryImages(prev => prev.filter((_, i) => i !== idx))}
                                                                        className="p-2 bg-white rounded-lg text-gray-900 hover:bg-red-50 hover:text-red-600 transition-colors"
                                                                        title="Remove"
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {projectGalleryImages.length === 0 && (
                                                            <div className="col-span-full py-8 text-center text-gray-400 bg-white/50 rounded-xl border-dashed border-2 border-gray-200">
                                                                No project-only images.
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                            </div>
                                        )}

                                        {/* --- CONTENT TAB --- */}
                                        {activeTab === "content" && (
                                            <div className="space-y-8">
                                                <div>
                                                    <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block">Short Description</label>
                                                    <textarea
                                                        value={formData.description}
                                                        onChange={(e) => handleInputChange("description", e.target.value)}
                                                        className="w-full p-4 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-medium text-gray-900 min-h-[100px]"
                                                        placeholder="Brief summary shown on cards..."
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block">Detailed Article</label>
                                                    <textarea
                                                        value={formData.longDescription}
                                                        onChange={(e) => handleInputChange("longDescription", e.target.value)}
                                                        className="w-full p-4 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-medium text-gray-900 min-h-[300px]"
                                                        placeholder="Full project details, markdown supported..."
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* --- RELATIONS TAB --- */}
                                        {activeTab === "relations" && (
                                            <div className="space-y-8">
                                                {/* Partners */}
                                                <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
                                                    <div className="flex justify-between items-center mb-4">
                                                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                                            <Share2 className="text-orange-500" size={20} /> Partners & Sponsors
                                                        </h3>
                                                        <button
                                                            onClick={() => addListItem("partners", "")}
                                                            className="text-xs font-bold bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                                                        >
                                                            <Plus size={14} /> Add Pattern
                                                        </button>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {formData.partners.map((partner, idx) => (
                                                            <div key={idx} className="flex gap-2">
                                                                <input
                                                                    type="text"
                                                                    value={partner}
                                                                    onChange={(e) => updateListItem("partners", idx, null, e.target.value)}
                                                                    className="flex-1 p-2.5 bg-gray-50 border-gray-200 rounded-lg text-sm"
                                                                    placeholder="Partner Name"
                                                                />
                                                                <button
                                                                    onClick={() => removeListItem("partners", idx)}
                                                                    className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                                                >
                                                                    <Trash2 size={18} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                        {formData.partners.length === 0 && <p className="text-sm text-gray-400 italic">No partners listed.</p>}
                                                    </div>
                                                </div>

                                                {/* Testimonials */}
                                                <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
                                                    <div className="flex justify-between items-center mb-4">
                                                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                                            <MessageSquare className="text-green-500" size={20} /> Testimonials
                                                        </h3>
                                                        <button
                                                            onClick={() => addListItem("testimonials", { quote: "", author: "" })}
                                                            className="text-xs font-bold bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                                                        >
                                                            <Plus size={14} /> Add Testimonial
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-1 gap-4">
                                                        {formData.testimonials.map((test, idx) => (
                                                            <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-100 relative group">
                                                                <button
                                                                    onClick={() => removeListItem("testimonials", idx)}
                                                                    className="absolute top-2 right-2 p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                                                                >
                                                                    <X size={16} />
                                                                </button>
                                                                <div className="space-y-3">
                                                                    <textarea
                                                                        value={test.quote}
                                                                        onChange={(e) => updateListItem("testimonials", idx, "quote", e.target.value)}
                                                                        placeholder="Quote text..."
                                                                        className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm min-h-[60px]"
                                                                    />
                                                                    <input
                                                                        type="text"
                                                                        value={test.author}
                                                                        onChange={(e) => updateListItem("testimonials", idx, "author", e.target.value)}
                                                                        placeholder="- Author Name"
                                                                        className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700"
                                                                    />
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {formData.testimonials.length === 0 && <p className="text-sm text-gray-400 italic">No testimonials added.</p>}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
