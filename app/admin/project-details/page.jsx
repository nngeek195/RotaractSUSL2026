"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Edit, Save, X, Plus, Trash2, Image as ImageIcon, MessageSquare, Users as UsersIcon, DollarSign, Calendar, Loader2 } from "lucide-react";

const CLOUDINARY_UPLOAD_URL = "https://api.cloudinary.com/v1_1/dvqoiqzxe/image/upload";
const CLOUDINARY_UPLOAD_PRESET = "projects";

export default function ProjectDetailsManagement() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProject, setSelectedProject] = useState(null);
    const [editingProject, setEditingProject] = useState(null);
    const [saving, setSaving] = useState(false);

    // Form states
    const [mainImage, setMainImage] = useState("");
    const [galleryImages, setGalleryImages] = useState([]);
    const [newGalleryUrl, setNewGalleryUrl] = useState("");
    const [testimonials, setTestimonials] = useState([]);
    const [partners, setPartners] = useState([]);
    const [category, setCategory] = useState("");
    const [budget, setBudget] = useState("");
    const [longDescription, setLongDescription] = useState("");

    // Upload states
    const [uploadingMainImage, setUploadingMainImage] = useState(false);
    const [uploadingGallery, setUploadingGallery] = useState(false);

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
        }
        setLoading(false);
    };

    const handleSelectProject = (project) => {
        setSelectedProject(project);
        setEditingProject(project);

        // Populate form with existing data or defaults
        setMainImage(project.imageUrl || project.image || "");
        setGalleryImages(project.galleryImages || []);
        setTestimonials(project.testimonials || []);
        setPartners(project.partners || []);
        setCategory(project.category || "Community Development");
        setBudget(project.budget || "");
        setLongDescription(project.longDescription || project.description || "");
    };

    const handleSave = async () => {
        if (!editingProject) return;

        setSaving(true);
        try {
            const updateData = {
                imageUrl: mainImage,
                galleryImages,
                testimonials,
                partners,
                category,
                budget,
                longDescription,
            };

            await updateDoc(doc(db, "events", editingProject.id), updateData);
            alert("Project details updated successfully!");

            // Refresh projects list
            await fetchProjects();
            setSelectedProject(null);
            setEditingProject(null);
            resetForm();
        } catch (error) {
            console.error("Error updating project:", error);
            alert("Failed to update project details.");
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setMainImage("");
        setGalleryImages([]);
        setNewGalleryUrl("");
        setTestimonials([]);
        setPartners([]);
        setCategory("");
        setBudget("");
        setLongDescription("");
    };

    const handleCancel = () => {
        setSelectedProject(null);
        setEditingProject(null);
        resetForm();
    };

    // Gallery Image Management
    const handleAddGalleryImage = () => {
        if (newGalleryUrl.trim()) {
            setGalleryImages([...galleryImages, newGalleryUrl.trim()]);
            setNewGalleryUrl("");
        }
    };

    const handleRemoveGalleryImage = (index) => {
        setGalleryImages(galleryImages.filter((_, i) => i !== index));
    };

    const handleUploadGalleryImage = async (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        setUploadingGallery(true);
        try {
            const sanitizeFolderName = (name) =>
                name.toLowerCase()
                    .trim()
                    .replace(/[^a-z0-9\s-]/g, "")
                    .replace(/\s+/g, "-");

            const folderName = sanitizeFolderName(editingProject.title || editingProject.name || "project");

            const uploadPromises = files.map(async (file) => {
                const formData = new FormData();
                formData.append("file", file);
                formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
                formData.append("folder", `Projects/${folderName}/gallery`);

                const res = await fetch(CLOUDINARY_UPLOAD_URL, {
                    method: "POST",
                    body: formData,
                });

                const data = await res.json();

                if (data.secure_url) {
                    return data.secure_url;
                } else {
                    throw new Error("Upload failed for " + file.name);
                }
            });

            const uploadedUrls = await Promise.all(uploadPromises);
            setGalleryImages([...galleryImages, ...uploadedUrls]);
            alert(`${uploadedUrls.length} image(s) uploaded successfully!`);

            // Clear the file input
            e.target.value = '';
        } catch (err) {
            console.error(err);
            alert("Some images failed to upload. Please try again.");
        } finally {
            setUploadingGallery(false);
        }
    };

    // Main Image Upload
    const handleUploadMainImage = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingMainImage(true);
        try {
            const sanitizeFolderName = (name) =>
                name.toLowerCase()
                    .trim()
                    .replace(/[^a-z0-9\s-]/g, "")
                    .replace(/\s+/g, "-");

            const folderName = sanitizeFolderName(editingProject.title || editingProject.name || "project");

            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
            formData.append("folder", `Projects/${folderName}`);

            const res = await fetch(CLOUDINARY_UPLOAD_URL, {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (data.secure_url) {
                setMainImage(data.secure_url);
                alert("Main image uploaded successfully!");
                e.target.value = '';
            } else {
                throw new Error("Upload failed");
            }
        } catch (err) {
            console.error(err);
            alert("Main image upload error.");
        } finally {
            setUploadingMainImage(false);
        }
    };

    // Testimonial Management
    const handleAddTestimonial = () => {
        setTestimonials([...testimonials, { quote: "", author: "" }]);
    };

    const handleUpdateTestimonial = (index, field, value) => {
        const updated = [...testimonials];
        updated[index][field] = value;
        setTestimonials(updated);
    };

    const handleRemoveTestimonial = (index) => {
        setTestimonials(testimonials.filter((_, i) => i !== index));
    };

    // Partner Management
    const handleAddPartner = () => {
        setPartners([...partners, ""]);
    };

    const handleUpdatePartner = (index, value) => {
        const updated = [...partners];
        updated[index] = value;
        setPartners(updated);
    };

    const handleRemovePartner = (index) => {
        setPartners(partners.filter((_, i) => i !== index));
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
            <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100">
                <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                    <Edit className="text-pink-600" size={32} />
                    Project Details Management
                </h1>
                <p className="text-gray-600 mb-6">
                    Manage gallery images, testimonials, partners, and additional details for your projects
                </p>
            </div>

            {/* Project Selection */}
            {!selectedProject && (
                <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Select a Project to Edit</h2>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="animate-spin text-pink-600" size={40} />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {projects.map((project) => (
                                <button
                                    key={project.id}
                                    onClick={() => handleSelectProject(project)}
                                    className="text-left p-4 border-2 border-gray-200 rounded-lg hover:border-pink-600 hover:shadow-lg transition-all"
                                >
                                    <div className="flex items-start gap-3">
                                        <Calendar className="text-pink-600 mt-1" size={20} />
                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-800 mb-1 line-clamp-1">
                                                {project.title || project.name}
                                            </h3>
                                            <p className="text-sm text-gray-600">{project.date}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Status: <span className="font-medium">{project.status}</span>
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Edit Form */}
            {selectedProject && (
                <div className="space-y-6">
                    {/* Header with project info */}
                    <div className="bg-gradient-to-r from-pink-600 to-purple-600 p-6 rounded-xl shadow-lg text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold mb-2">
                                    {selectedProject.title || selectedProject.name}
                                </h2>
                                <p className="text-pink-100">{selectedProject.location} • {selectedProject.date}</p>
                            </div>
                            <button
                                onClick={handleCancel}
                                className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition"
                            >
                                <X size={24} />
                            </button>
                        </div>
                    </div>

                    {/* Main Project Image */}
                    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <ImageIcon className="text-pink-600" />
                            Main Project Image
                        </h3>

                        {mainImage && (
                            <div className="mb-4">
                                <img
                                    src={mainImage}
                                    alt="Main project"
                                    className="w-full max-w-2xl h-64 object-cover rounded-lg"
                                />
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
                                <input
                                    type="text"
                                    value={mainImage}
                                    onChange={(e) => setMainImage(e.target.value)}
                                    placeholder="Enter image URL or upload below"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Or Upload New Image</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleUploadMainImage}
                                    disabled={uploadingMainImage}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                />
                                {uploadingMainImage && (
                                    <p className="text-sm text-gray-600 mt-2 flex items-center gap-2">
                                        <Loader2 className="animate-spin" size={16} />
                                        Uploading main image...
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Category & Budget */}
                    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <DollarSign className="text-green-600" />
                            Basic Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                                <input
                                    type="text"
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    placeholder="e.g., Community Development"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Budget</label>
                                <input
                                    type="text"
                                    value={budget}
                                    onChange={(e) => setBudget(e.target.value)}
                                    placeholder="e.g., LKR 500,000"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Extended Description</label>
                            <textarea
                                value={longDescription}
                                onChange={(e) => setLongDescription(e.target.value)}
                                placeholder="Additional project details..."
                                rows={4}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Gallery Images */}
                    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <ImageIcon className="text-blue-600" />
                            Gallery Images ({galleryImages.length})
                        </h3>

                        <div className="mb-4 flex gap-2">
                            <input
                                type="text"
                                value={newGalleryUrl}
                                onChange={(e) => setNewGalleryUrl(e.target.value)}
                                placeholder="Enter image URL or upload below"
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                            />
                            <button
                                onClick={handleAddGalleryImage}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                            >
                                <Plus size={20} /> Add URL
                            </button>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Or Upload Images (multiple)</label>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleUploadGalleryImage}
                                disabled={uploadingGallery}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                            />
                            {uploadingGallery && <p className="text-sm text-gray-600 mt-2">Uploading images...</p>}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {galleryImages.map((url, index) => (
                                <div key={index} className="relative group">
                                    <img
                                        src={url}
                                        alt={`Gallery ${index + 1}`}
                                        className="w-full h-32 object-cover rounded-lg"
                                    />
                                    <button
                                        onClick={() => handleRemoveGalleryImage(index)}
                                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Partners */}
                    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <UsersIcon className="text-purple-600" />
                            Partners ({partners.length})
                        </h3>

                        <button
                            onClick={handleAddPartner}
                            className="mb-4 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
                        >
                            <Plus size={20} /> Add Partner
                        </button>

                        <div className="space-y-2">
                            {partners.map((partner, index) => (
                                <div key={index} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={partner}
                                        onChange={(e) => handleUpdatePartner(index, e.target.value)}
                                        placeholder="Partner name"
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                    />
                                    <button
                                        onClick={() => handleRemovePartner(index)}
                                        className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Testimonials */}
                    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <MessageSquare className="text-orange-600" />
                            Testimonials ({testimonials.length})
                        </h3>

                        <button
                            onClick={handleAddTestimonial}
                            className="mb-4 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition flex items-center gap-2"
                        >
                            <Plus size={20} /> Add Testimonial
                        </button>

                        <div className="space-y-4">
                            {testimonials.map((testimonial, index) => (
                                <div key={index} className="border-2 border-gray-200 p-4 rounded-lg">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-medium text-gray-700">Testimonial {index + 1}</h4>
                                        <button
                                            onClick={() => handleRemoveTestimonial(index)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                    <textarea
                                        value={testimonial.quote}
                                        onChange={(e) => handleUpdateTestimonial(index, 'quote', e.target.value)}
                                        placeholder="Quote..."
                                        rows={3}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                    />
                                    <input
                                        type="text"
                                        value={testimonial.author}
                                        onChange={(e) => handleUpdateTestimonial(index, 'author', e.target.value)}
                                        placeholder="Author name"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex gap-4 sticky bottom-4 bg-white p-4 rounded-xl shadow-lg border border-gray-200">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-1 bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save size={20} />
                                    Save Project Details
                                </>
                            )}
                        </button>
                        <button
                            onClick={handleCancel}
                            className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition font-bold"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
