"use client";
"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import {
    Trash2, Edit2, Search, Users, ShieldCheck, User,
    Filter, Loader2, ArrowRight, X, Eye
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { confirmToast } from "@/lib/confirmToast";

// Define the executive roles
const executiveRoles = [
    "President", "Vice-President", "Secretary", "Assistant Secretary",
    "Editor", "Assistant Treasurer", "Sgt. at Arms", "Club Service",
    "Community Service", "International Service", "Professional Development",
    "Finance", "Membership Development", "Public Relations", "Sports and Recreational Activities"
];

export default function UserHandling() {
    // Data States
    const [allMembers, setAllMembers] = useState([]);
    const [filteredMembers, setFilteredMembers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Analytics States
    const [stats, setStats] = useState({ total: 0, exec: 0, general: 0 });

    // Filter & Search States
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState("All");

    // Modal States
    const [editingMember, setEditingMember] = useState(null);
    const [viewingMember, setViewingMember] = useState(null);
    const [newPosition, setNewPosition] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [viewingImage, setViewingImage] = useState(null); // Lightbox state
    const [mounted, setMounted] = useState(false);
    const [updatingRole, setUpdatingRole] = useState(false);
    const [deletingUserId, setDeletingUserId] = useState(null);

    useEffect(() => {
        setMounted(true);
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        setLoading(true);
        try {
            const membersList = [];
            let execCount = 0;
            let generalCount = 0;

            const usersSnap = await getDocs(collection(db, "users"));
            usersSnap.forEach(doc => {
                membersList.push({ id: doc.id, type: "Member", collection: "users", ...doc.data() });
                generalCount++;
            });

            const execSnap = await getDocs(collection(db, "executiveCommittee"));
            execSnap.forEach(doc => {
                membersList.push({ id: doc.id, type: "Executive", collection: "executiveCommittee", ...doc.data() });
                execCount++;
            });

            membersList.sort((a, b) => (a.fullName || "").localeCompare(b.fullName || ""));
            setAllMembers(membersList);
            setFilteredMembers(membersList);
            setStats({ total: membersList.length, exec: execCount, general: generalCount });

        } catch (error) {
            console.error("Error fetching members:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let result = allMembers;

        if (filterType === "Executive") {
            result = result.filter(m => m.type === "Executive");
        } else if (filterType === "Member") {
            result = result.filter(m => m.type === "Member");
        }

        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(m =>
                (m.fullName && m.fullName.toLowerCase().includes(lowerTerm)) ||
                (m.studentId && m.studentId.toLowerCase().includes(lowerTerm))
            );
        }
        setFilteredMembers(result);
    }, [searchTerm, filterType, allMembers]);

    const handleUpdateRole = async () => {
        if (!editingMember) return;

        setUpdatingRole(true);
        const oldCollection = editingMember.collection;
        const isNewRoleExec = executiveRoles.includes(newPosition);
        const newCollection = isNewRoleExec ? "executiveCommittee" : "users";

        try {
            // First attempt to update via secure backend API route with Admin SDK bypass
            let apiSuccess = false;
            try {
                const idToken = await auth.currentUser?.getIdToken();
                if (idToken) {
                    const res = await fetch("/api/admin/update-role", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${idToken}`
                        },
                        body: JSON.stringify({
                            memberId: editingMember.id,
                            oldCollection,
                            newPosition,
                            imageUrl: imageUrl || ""
                        })
                    });
                    if (res.ok) {
                        apiSuccess = true;
                    }
                }
            } catch (apiErr) {
                console.warn("API role update failed, falling back to client-side Firestore:", apiErr);
            }

            if (!apiSuccess) {
                if (oldCollection === newCollection) {
                    const dataToUpdate = { position: newPosition };
                    if (newCollection === 'executiveCommittee') {
                        dataToUpdate.imageUrl = imageUrl;
                    }
                    await updateDoc(doc(db, oldCollection, editingMember.id), dataToUpdate);
                }
                else {
                    const { id, collection, type, ...data } = editingMember;
                    const dataToSave = { ...data, position: newPosition };

                    if (newCollection === 'executiveCommittee') {
                        dataToSave.imageUrl = imageUrl;
                    } else {
                        delete dataToSave.imageUrl;
                    }

                    await setDoc(doc(db, newCollection, id), dataToSave);
                    await deleteDoc(doc(db, oldCollection, id));
                }
            }

            await fetchMembers();
            setEditingMember(null);
            toast.success(`Role updated to ${newPosition} successfully!`);
        } catch (error) {
            console.error("Update failed:", error);
            toast.error("Failed to update role");
        } finally {
            setUpdatingRole(false);
        }
    };

    const handleDelete = async (member) => {
        if (!(await confirmToast({ message: `Permanently remove ${member.fullName}?`, confirmLabel: "Delete" }))) return;
        setDeletingUserId(member.id);
        try {
            let deletedViaApi = false;
            try {
                const idToken = await auth.currentUser?.getIdToken();
                if (idToken) {
                    const res = await fetch("/api/admin/delete-user", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${idToken}`
                        },
                        body: JSON.stringify({ uid: member.id })
                    });
                    if (res.ok) deletedViaApi = true;
                }
            } catch (apiErr) {
                console.warn("Delete API failed, falling back to client-side:", apiErr);
            }

            if (!deletedViaApi) {
                await deleteDoc(doc(db, member.collection, member.id));
            }

            setAllMembers(prev => prev.filter(m => m.id !== member.id));
            toast.success("Member removed successfully.");
        } catch (error) {
            console.error("Delete failed:", error);
            toast.error("Failed to delete member.");
        } finally {
            setDeletingUserId(null);
        }
    };

    const LoadingSkeleton = () => (
        <div className="space-y-4">
            {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
            ))}
        </div>
    );

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12">

            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Member Management</h1>
                    <p className="text-gray-500 mt-1 font-medium">Oversee all club members and executive roles.</p>
                </div>
                <div className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-500 font-medium shadow-sm">
                    Total: <span className="text-gray-900 font-bold ml-1">{stats.total}</span>
                </div>
            </header>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: "Total Members", value: stats.total, icon: Users, color: "bg-blue-500", lightColor: "bg-blue-50 text-blue-600" },
                    { label: "Executive Committee", value: stats.exec, icon: ShieldCheck, color: "bg-pink-500", lightColor: "bg-pink-50 text-pink-600" },
                    { label: "General Members", value: stats.general, icon: User, color: "bg-green-500", lightColor: "bg-green-50 text-green-600" },
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

            {/* Controls */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search members..."
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                {/* Categorization Tabs */}
                <div className="flex p-1 bg-gray-100/80 rounded-xl">
                    {["All", "Executive", "Member"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setFilterType(tab)}
                            className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${filterType === tab
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                                }`}
                        >
                            {tab === "Member" ? "General Members" : tab === "Executive" ? "Committee" : "All Users"}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Table (Desktop) & Cards (Mobile) */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-8"><LoadingSkeleton /></div>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50/50 text-left">
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Member Details</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Role & ID</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredMembers.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-12 text-center text-gray-400">
                                                No members found matching your criteria.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredMembers.map((member, i) => (
                                            <motion.tr
                                                key={member.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: i * 0.02 }}
                                                className="hover:bg-gray-50/80 transition-colors group"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        {/* Updated Avatar Logic */}
                                                        {member.imageUrl ? (
                                                            <img
                                                                src={member.imageUrl}
                                                                alt={member.fullName}
                                                                className="w-10 h-10 rounded-full object-cover shadow-sm border border-gray-100"
                                                            />
                                                        ) : (
                                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white shadow-sm ${member.type === 'Executive'
                                                                ? 'bg-gradient-to-br from-pink-500 to-rose-500'
                                                                : 'bg-gradient-to-br from-blue-500 to-indigo-500'
                                                                }`}>
                                                                {member.fullName?.charAt(0)}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <h4 className="text-sm font-bold text-gray-900">{member.fullName}</h4>
                                                            <p className="text-xs text-gray-500">{member.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col items-start gap-1">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${member.type === 'Executive'
                                                            ? 'bg-pink-50 text-pink-700 border-pink-100'
                                                            : 'bg-blue-50 text-blue-700 border-blue-100'
                                                            }`}>
                                                            {member.position || "Member"}
                                                        </span>
                                                        <span className="text-xs text-gray-400 font-mono">{member.studentId} • {member.faculty}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-gray-600 font-medium">{member.whatsapp || "N/A"}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => setViewingMember(member)}
                                                            className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                            title="View Details"
                                                        >
                                                            <Eye size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setEditingMember(member);
                                                                setNewPosition(member.position || "Member");
                                                                setImageUrl(member.imageUrl || "");
                                                            }}
                                                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Edit Role"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(member)}
                                                            disabled={deletingUserId === member.id}
                                                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                            title="Delete Member"
                                                        >
                                                            {deletingUserId === member.id ? (
                                                                <Loader2 size={16} className="animate-spin text-red-500" />
                                                            ) : (
                                                                <Trash2 size={16} />
                                                            )}
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden flex flex-col divide-y divide-gray-100">
                            {filteredMembers.length === 0 ? (
                                <div className="p-8 text-center text-gray-400">
                                    No members found matching your criteria.
                                </div>
                            ) : (
                                filteredMembers.map((member, i) => (
                                    <motion.div
                                        key={member.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="p-4 space-y-3"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                {/* Updated Avatar Logic */}
                                                {member.imageUrl ? (
                                                    <img
                                                        src={member.imageUrl}
                                                        alt={member.fullName}
                                                        className="w-10 h-10 rounded-full object-cover shadow-sm border border-gray-100"
                                                    />
                                                ) : (
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white shadow-sm ${member.type === 'Executive'
                                                        ? 'bg-gradient-to-br from-pink-500 to-rose-500'
                                                        : 'bg-gradient-to-br from-blue-500 to-indigo-500'
                                                        }`}>
                                                        {member.fullName?.charAt(0)}
                                                    </div>
                                                )}
                                                <div>
                                                    <h4 className="text-sm font-bold text-gray-900">{member.fullName}</h4>
                                                    <p className="text-xs text-gray-500">{member.email}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setViewingMember(member)}
                                                className="p-2 text-gray-400 hover:text-gray-600"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                                            <div>
                                                <span className="block font-medium text-gray-700">Role</span>
                                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold border mt-0.5 ${member.type === 'Executive'
                                                    ? 'bg-pink-50 text-pink-700 border-pink-100'
                                                    : 'bg-blue-50 text-blue-700 border-blue-100'
                                                    }`}>
                                                    {member.position || "Member"}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="block font-medium text-gray-700">Student ID</span>
                                                {member.studentId}
                                            </div>
                                            <div>
                                                <span className="block font-medium text-gray-700">Faculty</span>
                                                {member.faculty}
                                            </div>
                                            <div>
                                                <span className="block font-medium text-gray-700">Contact</span>
                                                {member.whatsapp || "N/A"}
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-2 pt-2 border-t border-gray-50 border-dashed">
                                            <button
                                                onClick={() => {
                                                    setEditingMember(member);
                                                    setNewPosition(member.position || "Member");
                                                    setImageUrl(member.imageUrl || "");
                                                }}
                                                className="flex-1 py-2 text-xs font-bold text-blue-600 bg-blue-50 rounded-lg flex items-center justify-center gap-1 active:scale-95 transition-transform"
                                            >
                                                <Edit2 size={14} /> Edit Role
                                            </button>
                                            <button
                                                onClick={() => handleDelete(member)}
                                                disabled={deletingUserId === member.id}
                                                className="flex-1 py-2 text-xs font-bold text-red-600 bg-red-50 rounded-lg flex items-center justify-center gap-1 active:scale-95 transition-transform disabled:opacity-50"
                                            >
                                                {deletingUserId === member.id ? (
                                                    <Loader2 size={14} className="animate-spin text-red-600" />
                                                ) : (
                                                    <Trash2 size={14} />
                                                )}
                                                {deletingUserId === member.id ? "Removing..." : "Remove"}
                                            </button>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </>
                )
                }
            </div >

            {/* View Details Modal */}
            {mounted && createPortal(
                <AnimatePresence>
                    {viewingMember && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4"
                            onClick={() => setViewingMember(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
                            >
                                <div className="p-6 text-center border-b border-gray-100 bg-gray-50 relative">
                                    <button
                                        onClick={() => setViewingMember(null)}
                                        className="absolute top-4 right-4 p-2 bg-white rounded-full text-gray-400 hover:text-gray-900 shadow-sm transition-all hover:rotate-90"
                                    >
                                        <X size={20} />
                                    </button>
                                    <div className="w-24 h-24 mx-auto bg-white p-1 rounded-full shadow-lg mb-4">
                                        {viewingMember.imageUrl ? (
                                            <img
                                                src={viewingMember.imageUrl}
                                                alt={viewingMember.fullName}
                                                onClick={() => setViewingImage(viewingMember.imageUrl)}
                                                className="w-full h-full rounded-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                            />
                                        ) : (
                                            <div className={`w-full h-full rounded-full flex items-center justify-center text-3xl font-bold text-white ${viewingMember.type === 'Executive' ? 'bg-gradient-to-br from-pink-500 to-rose-500' : 'bg-gradient-to-br from-blue-500 to-indigo-500'}`}>
                                                {viewingMember.fullName?.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-900">{viewingMember.fullName}</h2>
                                    <p className="text-gray-500 text-sm mt-1">{viewingMember.email}</p>
                                    <span className={`inline-block mt-3 px-3 py-1 rounded-full text-xs font-bold border ${viewingMember.type === 'Executive' ? 'bg-pink-50 text-pink-700 border-pink-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                                        {viewingMember.position || "Member"}
                                    </span>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-3 bg-gray-50 rounded-xl">
                                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Student ID</p>
                                            <p className="font-medium text-gray-900">{viewingMember.studentId}</p>
                                        </div>
                                        <div className="p-3 bg-gray-50 rounded-xl">
                                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Faculty</p>
                                            <p className="font-medium text-gray-900">{viewingMember.faculty}</p>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-xl">
                                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Contact Number</p>
                                        <p className="font-medium text-gray-900 font-mono">{viewingMember.whatsapp || "N/A"}</p>
                                    </div>

                                    {viewingMember.collection && (
                                        <div className="text-xs text-center text-gray-400 pt-2 font-mono">
                                            User ID: {viewingMember.id}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* Edit Modal - Rendered via Portal to escape z-index issues */}
            {
                mounted && createPortal(
                    <AnimatePresence>
                        {editingMember && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4"
                            >
                                <motion.div
                                    initial={{ scale: 0.95, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.95, opacity: 0 }}
                                    className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
                                >
                                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                        <h3 className="text-lg font-bold text-gray-900">Update Member Role</h3>
                                        <button onClick={() => setEditingMember(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                            <X size={24} />
                                        </button>
                                    </div>

                                    <div className="p-6 overflow-y-auto">
                                        <div className="flex items-center gap-4 mb-8 bg-blue-50 p-4 rounded-xl border border-blue-100">
                                            {/* Updated Avatar Logic */}
                                            {editingMember.imageUrl ? (
                                                <img
                                                    src={editingMember.imageUrl}
                                                    alt={editingMember.fullName}
                                                    className="w-12 h-12 rounded-full object-cover shadow-md border border-blue-100"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
                                                    {editingMember.fullName?.charAt(0)}
                                                </div>
                                            )}
                                            <div>
                                                <h4 className="font-bold text-gray-900 text-lg">{editingMember.fullName}</h4>
                                                <p className="text-sm text-blue-700 font-medium">Current: {editingMember.position || "Member"}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-5">
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2">Assign New Position</label>
                                                <div className="relative">
                                                    <select
                                                        className="w-full p-3 pl-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white appearance-none font-medium text-gray-700 shadow-sm transition-all"
                                                        value={newPosition}
                                                        onChange={(e) => setNewPosition(e.target.value)}
                                                    >
                                                        <option value="Member">General Member</option>
                                                        <optgroup label="Executive Committee">
                                                            {executiveRoles.map(role => (
                                                                <option key={role} value={role}>{role}</option>
                                                            ))}
                                                        </optgroup>
                                                    </select>
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                        <Filter size={16} />
                                                    </div>
                                                </div>
                                            </div>

                                            {executiveRoles.includes(newPosition) && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    className="overflow-hidden"
                                                >
                                                    <label className="block text-sm font-bold text-gray-700 mb-2">Profile Picture URL</label>
                                                    <input
                                                        type="text"
                                                        placeholder="https://i.imgur.com/..."
                                                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                                        value={imageUrl}
                                                        onChange={(e) => setImageUrl(e.target.value)}
                                                    />
                                                    <p className="text-xs text-gray-500 mt-2 ml-1">
                                                        Required for public visuals. Ensure this link is publicly accessible.
                                                    </p>
                                                </motion.div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                                        <button
                                            onClick={() => setEditingMember(null)}
                                            disabled={updatingRole}
                                            className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-200 rounded-xl transition-colors text-sm disabled:opacity-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleUpdateRole}
                                            disabled={updatingRole}
                                            className="px-6 py-2.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/10 text-sm flex items-center gap-2 disabled:opacity-50"
                                        >
                                            {updatingRole ? (
                                                <>
                                                    <Loader2 size={16} className="animate-spin text-white" />
                                                    <span>Saving Changes...</span>
                                                </>
                                            ) : (
                                                <>
                                                    Save Changes <ArrowRight size={16} />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>,
                    document.body
                )
            }
            {/* Lightbox Modal */}
            {mounted && createPortal(
                <AnimatePresence>
                    {viewingImage && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/90 z-[99999] flex items-center justify-center p-4"
                            onClick={() => setViewingImage(null)}
                        >
                            <motion.button
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                onClick={() => setViewingImage(null)}
                                className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                            >
                                <X size={24} />
                            </motion.button>

                            <motion.img
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                src={viewingImage}
                                alt="Full size"
                                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div >
    );
}
