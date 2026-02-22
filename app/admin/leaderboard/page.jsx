"use client";

import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import {
    Edit2, Trash2, Plus, Loader2, Search, X,
    Trophy, Users, GraduationCap, Phone, Linkedin,
    ArrowUp, ArrowDown, ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { confirmToast } from "@/lib/confirmToast";

// List of roles for dropdown
const rolesWithOrder = [
    "President", "Vice President", "Secretary", "Assistant Secretary", "Editor",
    "Assistant Treasurer", "Sergeant at Arms", "Club Service", "Community Service",
    "International Service", "Professional Development", "Finance",
    "Membership Development", "Public Relations", "Sports and Recreational Activities"
];

const faculties = [
    "Faculty of Agricultural Sciences", "Faculty of Applied Sciences", "Faculty of Geomatics",
    "Faculty of Management Studies", "Faculty of Medicine", "Faculty of Social Sciences and Languages",
    "Faculty of Computing", "Faculty of Technology"
];

export default function LeaderboardAdmin() {
    // Data States
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, faculties: 0, positions: 0 });

    // UI States
    const [searchTerm, setSearchTerm] = useState("");
    const [mounted, setMounted] = useState(false);

    // Modal & Form States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({
        name: "",
        role: "",
        faculty: "",
        phone: "",
        linkedin: "",
        photo: "",
        positionOrder: 0
    });

    useEffect(() => {
        setMounted(true);
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "leaderboard"));
            const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            setMembers(data);

            // Calculate stats
            const uniqueFaculties = new Set(data.map(m => m.faculty).filter(Boolean));
            setStats({
                total: data.length,
                faculties: uniqueFaculties.size,
                positions: data.length // Assuming 1 person per position usually
            });
        } catch (error) {
            console.error("Error fetching members:", error);
        }
        setLoading(false);
    };

    const handleEdit = (member) => {
        setEditingId(member.id);

        // Find correct order from predefined list if role matches, otherwise fallback to existing order
        const roleIndex = rolesWithOrder.findIndex(r => r.toLowerCase() === (member.role || "").toLowerCase());
        const derivedOrder = roleIndex !== -1 ? roleIndex + 1 : (member.positionOrder || 0);

        setForm({
            name: member.name || "",
            role: member.role || "",
            faculty: member.faculty || "",
            phone: member.phone || "",
            linkedin: member.linkedin || "",
            photo: member.photo || "",
            positionOrder: derivedOrder
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!(await confirmToast({ message: "Delete this member permanently?", confirmLabel: "Delete" }))) return;
        try {
            await deleteDoc(doc(db, "leaderboard", id));
            setMembers(prev => prev.filter(m => m.id !== id));
            setStats(prev => ({ ...prev, total: prev.total - 1 }));
        } catch (error) {
            console.error("Error deleting:", error);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await updateDoc(doc(db, "leaderboard", editingId), form);
                setMembers(prev => prev.map(m => m.id === editingId ? { ...m, ...form } : m));
            } else {
                const ref = await addDoc(collection(db, "leaderboard"), form);
                setMembers(prev => [...prev, { id: ref.id, ...form }]);
                setStats(prev => ({ ...prev, total: prev.total + 1 }));
            }
            closeModal();
        } catch (error) {
            console.error("Error saving:", error);
            toast.error("Failed to save member.");
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setForm({ name: "", role: "", faculty: "", phone: "", linkedin: "", photo: "", positionOrder: 0 });
    };

    const openCreateModal = () => {
        closeModal(); // Reset form
        setIsModalOpen(true);
    };

    // Filter and Sort
    const filteredMembers = members
        .filter(m =>
            m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.faculty.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => (a.positionOrder ?? 999) - (b.positionOrder ?? 999));

    const LoadingSkeleton = () => (
        <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
            ))}
        </div>
    );

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-20">

            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Leaderboard Management</h1>
                    <p className="text-gray-500 mt-1 font-medium">Manage executive board members and positions.</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="px-5 py-2.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/10 flex items-center gap-2 active:scale-95"
                >
                    <Plus size={20} /> Add Member
                </button>
            </header>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: "Total Leaders", value: stats.total, icon: Users, color: "bg-blue-500", lightColor: "bg-blue-50 text-blue-600" },
                    { label: "Faculties Represented", value: stats.faculties, icon: GraduationCap, color: "bg-purple-500", lightColor: "bg-purple-50 text-purple-600" },
                    { label: "Position Types", value: stats.positions, icon: Trophy, color: "bg-amber-500", lightColor: "bg-amber-50 text-amber-600" },
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

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    placeholder="Search by name, role, or faculty..."
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Content Area */}
            {loading ? (
                <LoadingSkeleton />
            ) : filteredMembers.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                        <Users size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">No members found</h3>
                    <p className="text-gray-500">Try adjusting your search or add a new member.</p>
                </div>
            ) : (
                <>
                    {/* Desktop Table View */}
                    <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                                    <th className="p-5 font-bold text-center w-16">#</th>
                                    <th className="p-5 font-bold">Profile</th>
                                    <th className="p-5 font-bold">Role & Faculty</th>
                                    <th className="p-5 font-bold">Contact</th>
                                    <th className="p-5 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                <AnimatePresence mode="popLayout">
                                    {filteredMembers.map((member, i) => (
                                        <motion.tr
                                            key={member.id}
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="hover:bg-gray-50/80 transition-colors group"
                                        >
                                            <td className="p-5 text-center font-bold text-gray-400">{member.positionOrder}</td>
                                            <td className="p-5">
                                                <div className="flex items-center gap-4">
                                                    <img
                                                        src={member.photo || "https://via.placeholder.com/100"}
                                                        alt={member.name}
                                                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                                                    />
                                                    <span className="font-bold text-gray-900">{member.name}</span>
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-gray-800">{member.role}</span>
                                                    <span className="text-xs text-gray-500">{member.faculty}</span>
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <div className="flex gap-3 text-gray-400">
                                                    {member.phone && (
                                                        <div className="group/tooltip relative">
                                                            <Phone size={18} className="hover:text-blue-600 transition-colors cursor-help" />
                                                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                                                {member.phone}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {member.linkedin && (
                                                        <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
                                                            <Linkedin size={18} />
                                                        </a>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-5 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleEdit(member)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button onClick={() => handleDelete(member.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden grid grid-cols-1 gap-4">
                        <AnimatePresence mode="popLayout">
                            {filteredMembers.map((member, i) => (
                                <motion.div
                                    key={member.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={member.photo || "https://via.placeholder.com/100"}
                                                alt={member.name}
                                                className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm"
                                            />
                                            <div>
                                                <h3 className="font-bold text-gray-900 text-lg leading-tight">{member.name}</h3>
                                                <span className="text-sm font-medium text-blue-600">{member.role}</span>
                                            </div>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500 text-xs">
                                            {member.positionOrder}
                                        </div>
                                    </div>

                                    <div className="space-y-2 text-sm text-gray-600">
                                        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
                                            <GraduationCap size={16} className="text-purple-500" />
                                            {member.faculty}
                                        </div>
                                        <div className="flex gap-4 px-2">
                                            {member.phone && (
                                                <span className="flex items-center gap-2"><Phone size={14} /> {member.phone}</span>
                                            )}
                                            {member.linkedin && (
                                                <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 font-medium">
                                                    <Linkedin size={14} /> LinkedIn
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                                        <button onClick={() => handleEdit(member)} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 text-sm">
                                            Edit
                                        </button>
                                        <button onClick={() => handleDelete(member.id)} className="flex-1 py-2 bg-red-50 text-red-600 rounded-lg font-bold hover:bg-red-100 text-sm">
                                            Delete
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </>
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
                            onClick={closeModal}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
                            >
                                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                    <h3 className="text-xl font-bold text-gray-900">
                                        {editingId ? "Edit Member" : "Add Leaderboard Member"}
                                    </h3>
                                    <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                                        <X size={24} />
                                    </button>
                                </div>

                                <div className="p-6 overflow-y-auto">
                                    <form id="memberForm" onSubmit={handleSave} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                                            <input
                                                value={form.name}
                                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                                required
                                                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-1">Role & Order</label>
                                                <select
                                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                                    value={form.positionOrder && form.role ? `${form.positionOrder} - ${form.role}` : ""}
                                                    onChange={e => {
                                                        const [order, role] = e.target.value.split(' - ');
                                                        if (order && role) setForm(f => ({ ...f, role, positionOrder: Number(order) }));
                                                    }}
                                                >
                                                    <option value="">Select Role</option>
                                                    {rolesWithOrder.map((role, idx) => (
                                                        <option key={idx} value={`${idx + 1} - ${role}`}>{idx + 1}. {role}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-1">Faculty</label>
                                                <select
                                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                                    value={form.faculty}
                                                    onChange={e => setForm(f => ({ ...f, faculty: e.target.value }))}
                                                >
                                                    <option value="">Select Faculty</option>
                                                    {faculties.map((fac, i) => (
                                                        <option key={i} value={fac}>{fac}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Photo URL</label>
                                            <input
                                                value={form.photo}
                                                onChange={e => setForm(f => ({ ...f, photo: e.target.value }))}
                                                placeholder="https://..."
                                                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-1">Phone</label>
                                                <input
                                                    value={form.phone}
                                                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-1">LinkedIn URL</label>
                                                <input
                                                    value={form.linkedin}
                                                    onChange={e => setForm(f => ({ ...f, linkedin: e.target.value }))}
                                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                                />
                                            </div>
                                        </div>
                                    </form>
                                </div>

                                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                                    <button
                                        onClick={closeModal}
                                        className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-200 rounded-xl transition-colors text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        form="memberForm"
                                        className="px-6 py-2.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/10 text-sm"
                                    >
                                        {editingId ? "Save Changes" : "Add Member"}
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
