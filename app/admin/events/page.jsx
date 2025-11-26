"use client";

import { useState, useEffect, useRef } from "react";
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Calendar, MapPin, Edit, Trash, CheckCircle, Plus, Users, Loader2 } from "lucide-react";

const CLOUDINARY_UPLOAD_URL = "https://api.cloudinary.com/v1_1/dvqoiqzxe/image/upload";
const CLOUDINARY_UPLOAD_PRESET = "projects"; // Replace with your actual preset name from Cloudinary

export default function EventHandling() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form States
    const [isEditing, setIsEditing] = useState(false);
    const [currentEventId, setCurrentEventId] = useState(null);
    const [formData, setFormData] = useState({
        title: "",
        location: "",
        date: "",
        description: "",
        imageUrl: "",
        participants: "" // We will store this as a comma-separated string in the form
    });

    // View State: 'upcoming' or 'completed'
    const [view, setView] = useState("upcoming");
    const [uploading, setUploading] = useState(false);
    const [uploadMessage, setUploadMessage] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchEvents();
    }, []);

    const uploadImage = async () => {
        if (!selectedFile) return formData.imageUrl;

        const sanitizeFolderName = (name) =>
            name.toLowerCase()
                .trim()
                .replace(/[^a-z0-9\s-]/g, "")
                .replace(/\s+/g, "-");

        const folderName = sanitizeFolderName(formData.title);

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
        } catch (error) {
            console.error("Error fetching events:", error);
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
            location: "",
            date: "",
            description: "",
            imageUrl: "",
            participants: ""
        });
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        setIsEditing(false);
        setCurrentEventId(null);
    };

    // 1. Create or Update Event
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isEditing && !selectedFile) {
            alert("Please select an image for the new project.");
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
                // If creating new, default to upcoming. If editing, keep existing status.
                status: isEditing ? events.find(e => e.id === currentEventId).status : "upcoming",
                updatedAt: Timestamp.now()
            };

            // If marking as completed (we check this via the logic below), save participants
            if (formData.participants) {
                eventData.participants = formData.participants.split(',').map(email => email.trim());
            }

            if (isEditing) {
                await updateDoc(doc(db, "events", currentEventId), eventData);
                alert("Event updated successfully!");
            } else {
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

    // 2. Mark as Happened (Switch Status)
    const handleMarkAsHappened = (event) => {
        setIsEditing(true);
        setCurrentEventId(event.id);
        // Pre-fill form but force user to add participants
        setFormData({
            title: event.title,
            location: event.location,
            date: event.date,
            description: event.description,
            imageUrl: event.imageUrl,
            participants: event.participants ? event.participants.join(', ') : ""
        });

        // We handle the actual status change in a specialized update function
        // But for UI flow, we open the form and ask them to fill participants
        window.scrollTo({ top: 0, behavior: 'smooth' });
        alert("Please add the participant emails in the form above and click 'Save Project' to finalize.");
    };

    // Special function to finalize "Happened" status
    const finalizeHappened = async () => {
        if (!currentEventId) return;

        try {
            await updateDoc(doc(db, "events", currentEventId), {
                status: "completed",
                title: formData.title,
                location: formData.location,
                date: formData.date,
                description: formData.description,
                imageUrl: formData.imageUrl,
                participants: formData.participants.split(',').map(email => email.trim())
            });
            alert("Project marked as completed and moved to Projects section!");
            resetForm();
            fetchEvents();
        } catch (error) {
            console.error("Error:", error);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Delete this event permanently?")) return;
        try {
            await deleteDoc(doc(db, "events", id));
            setEvents(events.filter(e => e.id !== id));
        } catch (error) {
            console.error("Error deleting:", error);
        }
    };

    const handleEditClick = (event) => {
        setIsEditing(true);
        setCurrentEventId(event.id);
        setFormData({
            title: event.title,
            location: event.location,
            date: event.date,
            description: event.description,
            imageUrl: event.imageUrl,
            participants: event.participants ? event.participants.join(', ') : ""
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Filter events based on view tab
    const filteredEvents = events.filter(e => e.status === view);

    return (
        <div className="max-w-5xl mx-auto space-y-12 pb-20">

            {/* --- 1. ADD / EDIT SECTION --- */}
            <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    {isEditing ? <Edit className="text-blue-600" /> : <Plus className="text-pink-600" />}
                    {isEditing ? "Edit / Finalize Project" : "Add New Project"}
                </h2>

                <form onSubmit={(e) => { e.preventDefault(); isEditing && view === 'upcoming' ? finalizeHappened() : handleSubmit(e); }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                        <input name="title" value={formData.title} onChange={handleInputChange} required className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="e.g., Beach Cleanup Phase 1" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                        <input name="location" value={formData.location} onChange={handleInputChange} required className="w-full p-3 border rounded-lg" placeholder="Colombo Fort" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                        <input type="date" name="date" value={formData.date} onChange={handleInputChange} required className="w-full p-3 border rounded-lg" />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Project Image</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setSelectedFile(e.target.files[0])}
                            ref={fileInputRef}
                            className="w-full p-3 border rounded-lg"
                        />
                        {selectedFile && (
                            <img
                                src={URL.createObjectURL(selectedFile)}
                                alt="Project Preview"
                                className="mt-2 rounded w-full h-48 object-cover"
                            />
                        )}
                        {formData.imageUrl && !selectedFile && (
                            <img
                                src={formData.imageUrl}
                                alt="Current Project Image"
                                className="mt-2 rounded w-full h-48 object-cover"
                            />
                        )}
                        {uploadMessage && <p className="mt-2 text-sm text-pink-600">{uploadMessage}</p>}
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea name="description" value={formData.description} onChange={handleInputChange} required rows="4" className="w-full p-3 border rounded-lg" placeholder="Project details..." />
                    </div>

                    {/* Only show Participants field if Editing an existing event */}
                    {isEditing && (
                        <div className="md:col-span-2 bg-blue-50 p-4 rounded-lg border border-blue-100">
                            <label className="block text-sm font-bold text-blue-900 mb-1">
                                <Users size={16} className="inline mr-2" />
                                Participants (Required for Completed Projects)
                            </label>
                            <p className="text-xs text-blue-600 mb-2">Enter member emails separated by commas.</p>
                            <textarea
                                name="participants"
                                value={formData.participants}
                                onChange={handleInputChange}
                                rows="2"
                                className="w-full p-3 border rounded-lg"
                                placeholder="student1@email.com, student2@email.com..."
                            />
                        </div>
                    )}

                    <div className="md:col-span-2 flex gap-3 mt-2">
                        {isEditing ? (
                            <>
                                {/* If it's upcoming, we show 'Mark as Happened' button logic */}
                                {view === 'upcoming' ? (
                                    <button type="submit" className="flex-1 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition">
                                        Save as "Happened" & Move to Projects
                                    </button>
                                ) : (
                                    <button onClick={handleSubmit} className="flex-1 py-3 bg-blue-900 text-white rounded-lg font-bold hover:bg-blue-800 transition">
                                        Update Project Details
                                    </button>
                                )}

                                <button type="button" onClick={resetForm} className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300">
                                    Cancel
                                </button>
                            </>
                        ) : (
                            <button type="submit" className="flex-1 py-3 bg-blue-900 text-white rounded-lg font-bold hover:bg-blue-800 transition">
                                Create Upcoming Event
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* --- 2. TABS SECTION --- */}
            <div className="flex border-b border-gray-200">
                <button
                    onClick={() => { setView("upcoming"); resetForm(); }}
                    className={`pb-4 px-6 font-medium text-lg ${view === "upcoming" ? "text-pink-600 border-b-2 border-pink-600" : "text-gray-500 hover:text-gray-700"}`}
                >
                    Upcoming Events
                </button>
                <button
                    onClick={() => { setView("completed"); resetForm(); }}
                    className={`pb-4 px-6 font-medium text-lg ${view === "completed" ? "text-green-600 border-b-2 border-green-600" : "text-gray-500 hover:text-gray-700"}`}
                >
                    Completed Projects
                </button>
            </div>

            {/* --- 3. LIST SECTION --- */}
            {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin" size={40} /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEvents.length === 0 && (
                        <div className="col-span-full text-center py-10 text-gray-500">No {view} projects found.</div>
                    )}

                    {filteredEvents.map(event => (
                        <div key={event.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition overflow-hidden border border-gray-100 flex flex-col">
                            <div className="h-48 bg-gray-200 relative">
                                <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" onError={(e) => e.target.src = 'https://via.placeholder.com/400x200?text=No+Image'} />
                                <div className="absolute top-2 right-2 bg-white px-3 py-1 rounded-full text-xs font-bold shadow-sm uppercase tracking-wider">
                                    {event.status}
                                </div>
                            </div>

                            <div className="p-5 flex-1 flex flex-col">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{event.title}</h3>
                                <div className="space-y-2 text-sm text-gray-600 mb-4">
                                    <div className="flex items-center gap-2"><Calendar size={16} className="text-pink-500" /> {event.date}</div>
                                    <div className="flex items-center gap-2"><MapPin size={16} className="text-blue-500" /> {event.location}</div>
                                </div>
                                <p className="text-gray-500 text-sm line-clamp-3 mb-4 flex-1">{event.description}</p>

                                {/* Participants Preview for Completed Events */}
                                {view === 'completed' && event.participants && (
                                    <div className="mb-4 p-2 bg-gray-50 rounded text-xs text-gray-500">
                                        <strong>Participants:</strong> {event.participants.length} members
                                    </div>
                                )}

                                <div className="flex gap-2 mt-auto pt-4 border-t border-gray-100">
                                    {view === 'upcoming' && (
                                        <button onClick={() => handleMarkAsHappened(event)} className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-50 text-green-700 rounded hover:bg-green-100 font-medium text-xs">
                                            <CheckCircle size={16} /> Mark Done
                                        </button>
                                    )}
                                    <button onClick={() => handleEditClick(event)} className="p-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100">
                                        <Edit size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(event.id)} className="p-2 bg-red-50 text-red-700 rounded hover:bg-red-100">
                                        <Trash size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}