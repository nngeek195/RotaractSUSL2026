'use client';

import React, { useState, useEffect } from 'react';
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, getDocs, updateDoc, doc } from "firebase/firestore";
import { Loader2, PlusCircle, ArrowLeft, Trash2, Plus, Share2, Users, X, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateOCCall() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    
    // Form State
    const [applicationName, setApplicationName] = useState("");
    const [description, setDescription] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [uploadingImage, setUploadingImage] = useState(false);
    const [publishNow, setPublishNow] = useState(true);
    
    // Dynamic Positions State
    const [positions, setPositions] = useState([
        { id: Date.now().toString(), title: "", maintainTeam: false, teamStructure: null }
    ]);
    
    // Custom Questions State
    const [customQuestions, setCustomQuestions] = useState([]);

    // Sharing State
    const [execCommittee, setExecCommittee] = useState([]);
    const [sharedWith, setSharedWith] = useState([]);

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingImage(true);
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
                setImageUrl(data.secure_url);
                toast.success("Event poster uploaded successfully!");
            } else {
                toast.error("Failed to upload image.");
            }
        } catch (err) {
            console.error("Upload error:", err);
            toast.error("Error uploading image.");
        } finally {
            setUploadingImage(false);
        }
    };

    const [currentUserName, setCurrentUserName] = useState("");

    useEffect(() => {
        const fetchCommittee = async () => {
            try {
                const snap = await getDocs(collection(db, "executiveCommittee"));
                const list = snap.docs.map(d => ({
                    id: d.id,
                    name: d.data().fullName || d.data().firstName || "Director",
                    position: d.data().position || "Board Member",
                    email: d.data().email
                })).filter(dir => dir.email && dir.email !== auth.currentUser?.email);
                setExecCommittee(list);

                const current = snap.docs.find(d => d.id === auth.currentUser?.uid || d.data().email === auth.currentUser?.email);
                if (current) {
                    setCurrentUserName(current.data().fullName || current.data().position || "Executive Member");
                }
            } catch (err) {
                console.error("Error fetching executive committee:", err);
            }
        };
        fetchCommittee();
    }, []);

    // --- Position Handlers ---
    const handleAddPosition = () => {
        setPositions([...positions, { 
            id: Date.now().toString(), 
            title: "", 
            maintainTeam: false, 
            teamStructure: null 
        }]);
    };

    const updatePosition = (id, key, value) => {
        setPositions(prev => prev.map(p => {
            if (p.id === id) {
                if (key === 'maintainTeam') {
                    if (!value) {
                        return { ...p, maintainTeam: false, teamStructure: null };
                    } else {
                        return { ...p, maintainTeam: true, teamStructure: p.teamStructure || 'needs_lead' };
                    }
                }
                return { ...p, [key]: value };
            }
            return p;
        }));
    };

    const removePosition = (id) => {
        setPositions(prev => prev.filter(p => p.id !== id));
    };

    // --- Question Builder Handlers ---
    const handleAddQuestion = (type) => {
        const newQuestion = {
            id: Date.now().toString(),
            type,
            questionText: "",
            options: type === "multi_select" ? ["", ""] : []
        };
        setCustomQuestions([...customQuestions, newQuestion]);
    };

    const updateQuestion = (id, field, value) => {
        setCustomQuestions(prev => prev.map(q => q.id === id ? { ...q, [field]: value } : q));
    };

    const updateOption = (qId, index, value) => {
        setCustomQuestions(prev => prev.map(q => {
            if (q.id === qId) {
                const newOptions = [...q.options];
                newOptions[index] = value;
                return { ...q, options: newOptions };
            }
            return q;
        }));
    };

    const addOption = (qId) => {
        setCustomQuestions(prev => prev.map(q => {
            if (q.id === qId) {
                return { ...q, options: [...q.options, ""] };
            }
            return q;
        }));
    };

    const removeQuestion = (id) => {
        setCustomQuestions(prev => prev.filter(q => q.id !== id));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const validPositions = positions.filter(p => p.title.trim() !== "");
        if (validPositions.length === 0) {
            toast.error("Please add at least one valid position.");
            return;
        }

        setLoading(true);
        try {
            const callDocRef = await addDoc(collection(db, "ocCalls"), {
                applicationName,
                description: description.trim(),
                imageUrl: imageUrl.trim(),
                positions: validPositions,
                customQuestions,
                status: "open",
                callingEnded: false,
                published: publishNow,
                publishedAt: publishNow ? new Date() : null,
                publishedBy: auth.currentUser?.uid || "unknown",
                publishedByEmail: auth.currentUser?.email || "",
                createdBy: auth.currentUser?.uid || "unknown",
                createdByName: currentUserName || auth.currentUser?.displayName || "Executive Member",
                createdByEmail: auth.currentUser?.email || "",
                sharedWith: sharedWith,
                createdAt: new Date()
            });

            // If published right away, create linked upcoming event
            if (publishNow) {
                const eventDocRef = await addDoc(collection(db, "events"), {
                    title: applicationName,
                    name: applicationName,
                    description: description.trim(),
                    imageUrl: imageUrl.trim() || "",
                    status: "upcoming",
                    isOcCalling: true,
                    ocCallingEnded: false,
                    ocCallId: callDocRef.id,
                    createdBy: auth.currentUser?.uid || "unknown",
                    createdByEmail: auth.currentUser?.email || "",
                    createdByName: currentUserName || "Executive Member",
                    collaborators: sharedWith || [],
                    date: new Date().toISOString().split('T')[0],
                    participants: [],
                    createdAt: new Date()
                });

                await updateDoc(doc(db, "ocCalls", callDocRef.id), {
                    linkedEventId: eventDocRef.id
                });
            }

            toast.success(publishNow ? "OC Call published as an upcoming project!" : "OC Call saved as draft!");
            router.push('/admin/oc-calls'); 
        } catch (error) {
            console.error("Error creating OC call:", error);
            toast.error("Failed to create OC Call.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen py-12 px-4">
            <div className="max-w-3xl mx-auto bg-white p-8 rounded-[30px] shadow-xl border border-gray-100">
                
                <Link href="/admin/oc-calls" className="flex items-center gap-2 text-gray-500 hover:text-pink-600 font-poppins text-sm mb-6 transition w-fit">
                    <ArrowLeft size={16} /> Back to OC Calls
                </Link>

                <h1 className="text-3xl font-playfair font-bold text-gray-900 mb-2">Create OC Call</h1>
                <p className="text-gray-500 font-poppins text-sm mb-8">Publish a new Organizing Committee application for the members.</p>

                <form onSubmit={handleSubmit} className="space-y-8">
                    
                    {/* Basic Details */}
                    <div>
                        <label className="block font-poppins font-bold text-sm text-pink-600 mb-2">Application / Project Name *</label>
                        <input 
                            type="text" required
                            placeholder="e.g. InnovaX Hackathon 2026"
                            value={applicationName} onChange={(e) => setApplicationName(e.target.value)}
                            className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-pink-600 outline-none font-poppins transition text-gray-900 font-medium"
                        />
                    </div>

                    {/* Project Description */}
                    <div>
                        <label className="block font-poppins font-bold text-sm text-pink-600 mb-2">Project / Call Description *</label>
                        <textarea 
                            rows={4}
                            required
                            placeholder="Describe the project, responsibilities, objectives, and why members should apply for this Organizing Committee..."
                            value={description} onChange={(e) => setDescription(e.target.value)}
                            className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-pink-600 outline-none font-poppins text-sm transition text-gray-800"
                        />
                    </div>

                    {/* Project Banner / Image */}
                    <div>
                        <label className="block font-poppins font-bold text-sm text-pink-600 mb-1">Event Poster / Image Banner</label>
                        <p className="text-xs text-gray-500 mb-3">Upload a promotional poster or banner image for this OC Call (displayed on project cards and member feeds).</p>
                        
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            <label className="flex items-center justify-center gap-2 px-4 py-2.5 bg-pink-50 text-pink-600 border border-pink-200 rounded-xl font-bold text-xs cursor-pointer hover:bg-pink-100 transition shrink-0">
                                {uploadingImage ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
                                <span>{uploadingImage ? "Uploading to Cloud..." : "Upload Poster Image"}</span>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    disabled={uploadingImage}
                                    onChange={handleImageUpload} 
                                    className="hidden" 
                                />
                            </label>

                            <input 
                                type="url" 
                                placeholder="Or enter image URL (https://...)"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                className="flex-1 p-2.5 text-xs border border-gray-200 rounded-xl outline-none focus:border-pink-600 text-gray-800"
                            />
                        </div>

                        {imageUrl && (
                            <div className="mt-3 relative w-full h-44 rounded-2xl overflow-hidden border border-gray-200 bg-gray-50">
                                <img src={imageUrl} alt="Poster preview" className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => setImageUrl("")}
                                    className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-600 text-white rounded-full transition"
                                    title="Remove Image"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Dynamic Positions Section */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <label className="block font-poppins font-bold text-sm text-pink-600">Positions Required *</label>
                            <button 
                                type="button" 
                                onClick={handleAddPosition}
                                className="text-pink-600 text-sm font-poppins font-semibold flex items-center gap-1 hover:text-pink-700 transition"
                            >
                                <Plus size={16} /> Add Position
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            {positions.map((pos) => (
                                <div key={pos.id} className="border-2 border-gray-200 bg-white rounded-2xl p-4 relative animate-in fade-in transition-all focus-within:border-pink-600">
                                    
                                    {positions.length > 1 && (
                                        <button 
                                            type="button" 
                                            onClick={() => removePosition(pos.id)} 
                                            className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}

                                    <div className="pr-8 space-y-4">
                                        <input
                                            type="text" required
                                            placeholder={`e.g. Chair, Photographer, Host...`}
                                            value={pos.title}
                                            onChange={(e) => updatePosition(pos.id, 'title', e.target.value)}
                                            className="w-full p-3 border-2 border-gray-100 rounded-xl focus:border-pink-600 outline-none font-poppins text-sm font-bold text-gray-800 transition"
                                        />

                                        <div className="pl-2 border-l-2 border-pink-200 space-y-3">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input 
                                                    type="checkbox"
                                                    className="w-4 h-4 accent-pink-600 cursor-pointer"
                                                    checked={pos.maintainTeam}
                                                    onChange={(e) => updatePosition(pos.id, 'maintainTeam', e.target.checked)}
                                                />
                                                <span className="font-poppins text-sm text-gray-600">Maintain a team for this position?</span>
                                            </label>

                                            {pos.maintainTeam && (
                                                <div className="pl-6 space-y-2.5 bg-pink-50/50 p-3 rounded-xl border border-pink-100">
                                                    <p className="text-xs font-semibold text-pink-700">Team Leadership Structure:</p>
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input 
                                                            type="radio"
                                                            name={`team-${pos.id}`}
                                                            className="accent-pink-600"
                                                            required
                                                            checked={pos.teamStructure === 'all_members'}
                                                            onChange={() => updatePosition(pos.id, 'teamStructure', 'all_members')}
                                                        />
                                                        <span className="font-poppins text-xs sm:text-sm text-gray-700">All as general members</span>
                                                    </label>
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input 
                                                            type="radio"
                                                            name={`team-${pos.id}`}
                                                            className="accent-pink-600"
                                                            required
                                                            checked={pos.teamStructure === 'needs_lead'}
                                                            onChange={() => updatePosition(pos.id, 'teamStructure', 'needs_lead')}
                                                        />
                                                        <span className="font-poppins text-xs sm:text-sm text-gray-800 font-semibold">
                                                            Needs a Team Lead <span className="text-[11px] font-normal text-gray-500">(Applicants can apply as Team Lead, Member, or Both)</span>
                                                        </span>
                                                    </label>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Custom Questions Section */}
                    <div>
                        <label className="block font-poppins font-bold text-sm text-pink-600 mb-4">Custom Form Questions (Optional)</label>
                        
                        <div className="space-y-4 mb-4">
                            {customQuestions.map((q) => (
                                <div key={q.id} className="border-2 border-gray-200 bg-white rounded-2xl p-4 relative animate-in fade-in">
                                    <button 
                                        type="button" 
                                        onClick={() => removeQuestion(q.id)} 
                                        className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                    
                                    <div className="pr-8 space-y-3">
                                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                                            {q.type.replace('_', ' ')}
                                        </span>
                                        <input
                                            type="text" required
                                            placeholder="Type your question here..."
                                            value={q.questionText}
                                            onChange={(e) => updateQuestion(q.id, 'questionText', e.target.value)}
                                            className="w-full p-3 border-2 border-gray-100 rounded-xl focus:border-pink-600 outline-none font-poppins text-sm transition"
                                        />
                                        
                                        {q.type === 'multi_select' && (
                                            <div className="space-y-2 pl-4 border-l-2 border-gray-100 mt-3">
                                                {q.options.map((opt, oIndex) => (
                                                    <div key={oIndex} className="flex gap-2">
                                                        <input
                                                            type="text" required
                                                            placeholder={`Option ${oIndex + 1}`}
                                                            value={opt}
                                                            onChange={(e) => updateOption(q.id, oIndex, e.target.value)}
                                                            className="w-full p-2 border-2 border-gray-100 rounded-lg focus:border-pink-600 outline-none text-sm font-poppins"
                                                        />
                                                    </div>
                                                ))}
                                                <button 
                                                    type="button" 
                                                    onClick={() => addOption(q.id)} 
                                                    className="text-pink-600 text-sm font-poppins font-semibold flex items-center gap-1 hover:text-pink-700 mt-2"
                                                >
                                                    <Plus size={14} /> Add Option
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <button type="button" onClick={() => handleAddQuestion('yes_no')} className="px-4 py-2 bg-pink-50 text-pink-600 font-poppins text-sm font-bold rounded-xl border border-pink-100 hover:bg-pink-100 transition">
                                + Yes/No
                            </button>
                            <button type="button" onClick={() => handleAddQuestion('paragraph')} className="px-4 py-2 bg-pink-50 text-pink-600 font-poppins text-sm font-bold rounded-xl border border-pink-100 hover:bg-pink-100 transition">
                                + Paragraph
                            </button>
                            <button type="button" onClick={() => handleAddQuestion('multi_select')} className="px-4 py-2 bg-pink-50 text-pink-600 font-poppins text-sm font-bold rounded-xl border border-pink-100 hover:bg-pink-100 transition">
                                + Multi-Selection
                            </button>
                        </div>
                    </div>

                    {/* Share with Committee Members (Optional) */}
                    <div className="bg-gradient-to-br from-pink-50/50 to-purple-50/50 border-2 border-pink-100 rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-2">
                            <Share2 className="text-pink-600" size={20} />
                            <label className="font-poppins font-bold text-sm text-gray-800">
                                Share with Committee Members <span className="text-xs font-normal text-gray-500">(Optional)</span>
                            </label>
                        </div>
                        <p className="text-xs text-gray-500 mb-4">
                            Selected committee members will also have access to review applicants and manage this OC group alongside you.
                        </p>

                        <div className="space-y-3">
                            <select 
                                value="" 
                                onChange={(e) => {
                                    if (e.target.value && !sharedWith.includes(e.target.value)) {
                                        setSharedWith(prev => [...prev, e.target.value]);
                                    }
                                }}
                                className="w-full p-3 border-2 border-gray-200 bg-white rounded-xl focus:border-pink-600 outline-none font-poppins text-sm transition text-gray-700"
                            >
                                <option value="">Select Committee Member to Share With...</option>
                                {execCommittee
                                    .filter(dir => !sharedWith.includes(dir.email))
                                    .map(dir => (
                                        <option key={dir.id} value={dir.email}>
                                            {dir.position} - {dir.name} ({dir.email})
                                        </option>
                                    ))
                                }
                            </select>

                            {/* Selected members badge list */}
                            {sharedWith.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-2">
                                    {sharedWith.map(email => {
                                        const member = execCommittee.find(m => m.email === email);
                                        return (
                                            <span 
                                                key={email}
                                                className="inline-flex items-center gap-2 bg-white border border-pink-200 text-pink-700 text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm"
                                            >
                                                <Users size={13} className="text-pink-500" />
                                                <span>{member ? `${member.position} - ${member.name}` : email}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setSharedWith(prev => prev.filter(e => e !== email))}
                                                    className="hover:text-red-500 text-gray-400 transition"
                                                    title="Remove"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </span>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Publish as Public Post Immediately */}
                    <div className="bg-pink-50/60 border border-pink-200 rounded-2xl p-4 flex items-center justify-between gap-4">
                        <div>
                            <p className="font-bold text-sm text-gray-900">Publish as Public Post Immediately</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                                When enabled, this call will be posted immediately for all members to view in their accounts and apply for.
                            </p>
                        </div>
                        <input
                            type="checkbox"
                            checked={publishNow}
                            onChange={(e) => setPublishNow(e.target.checked)}
                            className="w-5 h-5 accent-pink-600 rounded cursor-pointer shrink-0"
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                        <Link 
                            href="/admin/oc-calls"
                            className="w-full sm:w-auto px-6 py-4 border-2 border-gray-200 text-gray-700 hover:bg-gray-100 rounded-xl font-poppins font-bold text-sm transition flex items-center justify-center gap-2"
                        >
                            <ArrowLeft size={16} /> Back to Calls
                        </Link>
                        <button 
                            type="submit" disabled={loading}
                            className="flex-1 w-full bg-gray-900 text-white font-poppins font-bold py-4 rounded-xl hover:bg-gray-800 transition flex items-center justify-center gap-2 shadow-lg"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <><PlusCircle size={20} /> {publishNow ? "Publish OC Call as Post" : "Save OC Call as Draft"}</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}