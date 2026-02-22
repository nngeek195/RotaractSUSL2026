"use client";

import { useState, useEffect, useRef } from "react";
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc, Timestamp, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
    BookOpen, Upload, Trash, Plus, Loader2,
    X, Image as ImageIcon, CheckCircle, Link as LinkIcon, Edit
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { confirmToast } from "@/lib/confirmToast";

const CLOUDINARY_UPLOAD_URL = "https://api.cloudinary.com/v1_1/dvqoiqzxe/image/upload";
const CLOUDINARY_UPLOAD_PRESET = "projects";

export default function MagazineManagement() {
    // Data States
    const [magazines, setMagazines] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal & Form States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadMessage, setUploadMessage] = useState("");
    const [mounted, setMounted] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // File States
    const [selectedCoverFile, setSelectedCoverFile] = useState(null);
    const coverInputRef = useRef(null);

    const [formData, setFormData] = useState({
        title: "",
        date: "",
        description: "",
        pdfLink: "", // FlipHTML5 Link
    });

    useEffect(() => {
        setMounted(true);
        fetchMagazines();
    }, []);

    const fetchMagazines = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "magazines"), orderBy("date", "desc"));
            const querySnapshot = await getDocs(q);
            const list = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMagazines(list);
        } catch (error) {
            console.error("Error fetching magazines:", error);
        }
        setLoading(false);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const resetForm = () => {
        setFormData({
            title: "",
            date: "",
            description: "",
            pdfLink: "",
        });
        setSelectedCoverFile(null);
        if (coverInputRef.current) coverInputRef.current.value = "";
        setUploadMessage("");
        setEditingId(null);
    };

    const openCreateModal = () => {
        resetForm();
        setEditingId(null);
        setIsModalOpen(true);
    };

    const handleEdit = (mag) => {
        setFormData({
            title: mag.title,
            date: mag.date,
            description: mag.description,
            pdfLink: mag.pdfSource === 'fliphtml5' ? mag.pdfUrl : '', // Fallback for other types
        });
        setEditingId(mag.id);
        setSelectedCoverFile(null); // Reset file input, current cover is kept unless changed
        setIsModalOpen(true);
    };

    // Helper to upload image to Cloudinary
    const uploadImageToCloudinary = async (file) => {
        const formDataUpload = new FormData();
        formDataUpload.append("file", file);
        formDataUpload.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
        formDataUpload.append("folder", "Magazines");

        const res = await fetch(CLOUDINARY_UPLOAD_URL, {
            method: "POST",
            body: formDataUpload,
        });

        const data = await res.json();
        if (data.secure_url) {
            return data.secure_url;
        } else {
            throw new Error("Image upload failed");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation: For create, cover is required. For edit, it's optional.
        if (!editingId && !selectedCoverFile) {
            toast.error("Please select a cover image.");
            return;
        }

        if (!formData.pdfLink) {
            toast.error("Please enter the FlipHTML5 link or embed code.");
            return;
        }

        // Extract URL if user pasted full iframe code
        let cleanUrl = formData.pdfLink;
        if (cleanUrl.includes("<iframe") && cleanUrl.includes("src=")) {
            const srcMatch = cleanUrl.match(/src=["'](.*?)["']/);
            if (srcMatch && srcMatch[1]) {
                cleanUrl = srcMatch[1];
            }
        }

        setUploading(true);
        setUploadMessage(editingId ? "Updating magazine..." : "Publishing magazine...");

        try {
            let coverUrl = null;

            // 1. Upload Cover Image (Cloudinary) if selected
            if (selectedCoverFile) {
                coverUrl = await uploadImageToCloudinary(selectedCoverFile);
            }

            // 2. Save/Update Firestore
            setUploadMessage("Finalizing...");

            const magazineData = {
                title: formData.title,
                date: formData.date,
                description: formData.description,
                pdfUrl: cleanUrl,
                pdfSource: "fliphtml5",
                updatedAt: Timestamp.now()
            };

            // Only update coverUrl if a new one was uploaded
            if (coverUrl) {
                magazineData.coverUrl = coverUrl;
            }

            if (editingId) {
                await updateDoc(doc(db, "magazines", editingId), magazineData);
                toast.success("Magazine updated successfully!");
                // Update local state instead of full refetch for smoother UX
                setMagazines(prev => prev.map(m => m.id === editingId ? { ...m, ...magazineData, coverUrl: coverUrl || m.coverUrl } : m));
            } else {
                magazineData.createdAt = Timestamp.now();
                // For create, coverUrl is mandatory, effectively guaranteed by validation above
                if (!coverUrl) throw new Error("Cover URL missing for new magazine");
                magazineData.coverUrl = coverUrl;

                const docRef = await addDoc(collection(db, "magazines"), magazineData);
                setMagazines(prev => [{ id: docRef.id, ...magazineData }, ...prev]); // Optimistic add or reload
                toast.success("Magazine published successfully!");
                fetchMagazines(); // Refresh to be sure
            }

            setIsModalOpen(false);
            resetForm();

        } catch (error) {
            console.error("Error saving magazine:", error);
            toast.error("Failed to save magazine. Please try again.");
        } finally {
            setUploading(false);
            setUploadMessage("");
        }
    };

    const handleDelete = async (id) => {
        if (!(await confirmToast({ message: "Delete this magazine permanently?", confirmLabel: "Delete" }))) return;
        try {
            await deleteDoc(doc(db, "magazines", id));
            setMagazines(prev => prev.filter(m => m.id !== id));
        } catch (error) {
            console.error("Error deleting:", error);
            toast.error("Failed to delete magazine.");
        }
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-20">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Magazine Management</h1>
                    <p className="text-gray-500 mt-1 font-medium">Manage your FlipHTML5 e-magazines.</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="px-5 py-2.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/10 flex items-center gap-2 active:scale-95"
                >
                    <Plus size={20} /> Publish New Issue
                </button>
            </header>

            {/* List */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-pink-600" size={40} />
                </div>
            ) : magazines.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                        <BookOpen size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">No magazines found</h3>
                    <p className="text-gray-500">Publish your first FlipHTML5 magazine.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {magazines.map((mag) => (
                        <div key={mag.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-lg transition-all duration-300">
                            {/* Cover Preview */}
                            <div className="relative h-64 bg-gray-200 overflow-hidden">
                                <img
                                    src={mag.coverUrl}
                                    alt={mag.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-gray-700 shadow-sm">
                                    {mag.date ? new Date(mag.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}
                                </div>
                            </div>

                            <div className="p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">{mag.title}</h3>
                                <p className="text-gray-500 text-sm line-clamp-2 mb-4 h-10">{mag.description}</p>

                                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                    <a
                                        href={mag.pdfUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-pink-600 text-sm font-bold flex items-center gap-2 hover:underline"
                                    >
                                        <BookOpen size={16} /> Read Now
                                    </a>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => handleEdit(mag)}
                                            className="text-gray-400 hover:text-blue-600 transition-colors p-2 hover:bg-blue-50 rounded-lg"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(mag.id)}
                                            className="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg"
                                        >
                                            <Trash size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {mounted && createPortal(
                <AnimatePresence>
                    {isModalOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4"
                            onClick={() => !uploading && setIsModalOpen(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
                            >
                                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                        <Upload className="text-pink-600" /> {editingId ? "Edit Magazine" : "Publish Magazine"}
                                    </h3>
                                    {!uploading && (
                                        <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                            <X size={24} />
                                        </button>
                                    )}
                                </div>

                                <div className="p-6 overflow-y-auto">
                                    <form id="magForm" onSubmit={handleSubmit} className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Issue Title</label>
                                            <input
                                                name="title"
                                                value={formData.title}
                                                onChange={handleInputChange}
                                                required
                                                placeholder="e.g. October 2023 Edition"
                                                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Date</label>
                                            <input
                                                type="date"
                                                name="date"
                                                value={formData.date}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">FlipHTML5 Link or Embed Code</label>
                                            <div className="relative">
                                                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                <input
                                                    type="text"
                                                    name="pdfLink"
                                                    value={formData.pdfLink}
                                                    onChange={handleInputChange}
                                                    required
                                                    placeholder="Paste Link OR full <iframe> code here..."
                                                    className="w-full pl-10 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                                                />
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Works with direct links (e.g., https://online.fliphtml5.com/...) or the Embed Code.
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Cover Image</label>
                                            <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors relative h-32 flex items-center justify-center">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => setSelectedCoverFile(e.target.files[0])}
                                                    ref={coverInputRef}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                />
                                                {selectedCoverFile ? (
                                                    <div className="text-center">
                                                        <CheckCircle className="mx-auto text-green-500 mb-1" size={24} />
                                                        <span className="text-xs text-green-600 font-bold">New Image Selected</span>
                                                    </div>
                                                ) : editingId ? (
                                                    <div className="text-center text-gray-400">
                                                        <ImageIcon className="mx-auto mb-1" size={20} />
                                                        <span className="text-xs">Upload New Cover (Optional)</span>
                                                    </div>
                                                ) : (
                                                    <div className="text-center text-gray-400">
                                                        <ImageIcon className="mx-auto mb-1" size={20} />
                                                        <span className="text-xs">Upload Cover</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {uploading && (
                                            <div className="text-center py-2 flex items-center justify-center gap-2">
                                                <Loader2 className="animate-spin text-pink-600" size={16} />
                                                <p className="text-xs font-bold text-pink-600">{uploadMessage}</p>
                                            </div>
                                        )}
                                    </form>
                                </div>

                                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        disabled={uploading}
                                        className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-200 rounded-xl transition-colors text-sm disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        form="magForm"
                                        disabled={uploading}
                                        className="px-6 py-2.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/10 text-sm flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {uploading ? "Processing..." : editingId ? "Save Changes" : "Publish Magazine"}
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
