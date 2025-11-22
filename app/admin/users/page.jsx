// This is the full, final page code for app/admin/users/page.jsx

"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
    Trash2, Edit2, Search, Users, ShieldCheck, User,
    Filter, MoreHorizontal, CheckCircle, AlertCircle, Loader2
} from "lucide-react";

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
    const [filterType, setFilterType] = useState("All"); // All, Executive, Member

    // Modal States
    const [editingMember, setEditingMember] = useState(null);
    const [newPosition, setNewPosition] = useState("");
    const [imageUrl, setImageUrl] = useState(""); // <-- 1. ADDED STATE

    useEffect(() => {
        fetchMembers();
    }, []);

    // 1. Fetch Data & Calculate Stats
    const fetchMembers = async () => {
        setLoading(true);
        try {
            const membersList = [];
            let execCount = 0;
            let generalCount = 0;

            // Fetch General Users
            const usersSnap = await getDocs(collection(db, "users"));
            usersSnap.forEach(doc => {
                membersList.push({ id: doc.id, type: "Member", collection: "users", ...doc.data() });
                generalCount++;
            });

            // Fetch Executive Committee
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

    // 2. Handle Search & Filtering
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


    // 3. Handle Update Role --- MODIFIED ---
    const handleUpdateRole = async () => {
        if (!editingMember) return;

        setLoading(true);
        const oldCollection = editingMember.collection;
        const isNewRoleExec = executiveRoles.includes(newPosition);
        const newCollection = isNewRoleExec ? "executiveCommittee" : "users";

        try {
            // Case 1: Collection stays same
            if (oldCollection === newCollection) {
                const dataToUpdate = { position: newPosition };
                if (newCollection === 'executiveCommittee') {
                    dataToUpdate.imageUrl = imageUrl; // Add/update URL
                }
                await updateDoc(doc(db, oldCollection, editingMember.id), dataToUpdate);
            }
            // Case 2: Collection changes (Promotion/Demotion)
            else {
                const { id, collection, type, ...data } = editingMember;
                const dataToSave = { ...data, position: newPosition };

                if (newCollection === 'executiveCommittee') {
                    dataToSave.imageUrl = imageUrl; // Add URL on promotion
                } else {
                    delete dataToSave.imageUrl; // Remove URL on demotion
                }

                await setDoc(doc(db, newCollection, id), dataToSave);
                await deleteDoc(doc(db, oldCollection, id));
            }

            await fetchMembers();
            setEditingMember(null);
            alert(`User updated to ${newPosition}`);
        } catch (error) {
            console.error("Update failed:", error);
            alert("Failed to update role");
        } finally {
            setLoading(false);
        }
    };

    // 4. Handle Delete
    const handleDelete = async (member) => {
        if (!confirm(`Permanently remove ${member.fullName}?`)) return;
        try {
            await deleteDoc(doc(db, member.collection, member.id));
            setAllMembers(prev => prev.filter(m => m.id !== member.id));
            alert("User removed");
        } catch (error) {
            console.error("Delete failed:", error);
        }
    };

    return (
        <div className="space-y-8">
            {/* ... (Header & Analytics - no change) ... */}
            <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-6">Member Management</h1>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-full"><Users size={24} /></div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Total Members</p>
                            <h3 className="text-2xl font-bold text-gray-900">{stats.total}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="p-3 bg-pink-100 text-pink-600 rounded-full"><ShieldCheck size={24} /></div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Executive Committee</p>
                            <h3 className="text-2xl font-bold text-gray-900">{stats.exec}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="p-3 bg-green-100 text-green-600 rounded-full"><User size={24} /></div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">General Members</p>
                            <h3 className="text-2xl font-bold text-gray-900">{stats.general}</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* ... (Controls Toolbar - no change) ... */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by Name or Student ID..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Filter size={18} className="text-gray-500" />
                    <select
                        className="p-2 border border-gray-300 rounded-lg bg-gray-50 text-sm focus:ring-2 focus:ring-blue-500"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                    >
                        <option value="All">All Roles</option>
                        <option value="Executive">Executive Committee</option>
                        <option value="Member">General Members</option>
                    </select>
                </div>
            </div>

            {/* Members Table */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                {loading ? (
                    <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-blue-600" size={40} /></div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            {/* ... (thead - no change) ... */}
                            <thead>
                                <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider border-b border-gray-200">
                                    <th className="p-4 font-semibold">Member</th>
                                    <th className="p-4 font-semibold">Student ID / Faculty</th>
                                    <th className="p-4 font-semibold">Role</th>
                                    <th className="p-4 font-semibold">Contact</th>
                                    <th className="p-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm">
                                {filteredMembers.length === 0 ? (
                                    <tr><td colSpan="5" className="p-8 text-center text-gray-500">No members found.</td></tr>
                                ) : filteredMembers.map((member) => (
                                    <tr key={member.id} className="hover:bg-gray-50 transition duration-150 group">
                                        {/* ... (td - Member, Student ID, Role, Contact - no change) ... */}
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 text-white flex items-center justify-center font-bold">
                                                    {member.fullName?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{member.fullName}</p>
                                                    <p className="text-xs text-gray-500">{member.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-600">
                                            <p className="font-medium">{member.studentId}</p>
                                            <p className="text-xs text-gray-500">{member.faculty}</p>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${member.type === 'Executive'
                                                ? 'bg-pink-100 text-pink-800 border border-pink-200'
                                                : 'bg-blue-50 text-blue-700 border border-blue-100'
                                                }`}>
                                                {member.position || "Member"}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-500">
                                            {member.whatsapp || "N/A"}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {/* --- 2. MODIFIED CLICK HANDLER --- */}
                                                <button
                                                    onClick={() => {
                                                        setEditingMember(member);
                                                        setNewPosition(member.position || "Member");
                                                        setImageUrl(member.imageUrl || ""); // <-- Load existing URL
                                                    }}
                                                    className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg"
                                                    title="Edit Role"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(member)}
                                                    className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg"
                                                    title="Remove User"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                <div className="bg-gray-50 p-3 border-t border-gray-200 text-xs text-gray-500 text-center">
                    Showing {filteredMembers.length} of {allMembers.length} members
                </div>
            </div>

            {/* Edit Role Modal --- 3. MODIFIED JSX --- */}
            {editingMember && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
                        <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800">Update Role</h3>
                            <button onClick={() => setEditingMember(null)} className="text-gray-400 hover:text-gray-600">×</button>
                        </div>

                        <div className="p-6">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl">
                                    {editingMember.fullName?.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">{editingMember.fullName}</p>
                                    <p className="text-sm text-gray-500">Current: {editingMember.position || "Member"}</p>
                                </div>
                            </div>

                            <label className="block text-sm font-medium text-gray-700 mb-2">Assign New Position</label>
                            <select
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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

                            {/* --- NEW CONDITIONAL FIELD --- */}
                            {executiveRoles.includes(newPosition) && (
                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Profile Picture URL (Optional)</label>
                                    <input
                                        type="text"
                                        placeholder="https://example.com/image.png"
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        value={imageUrl}
                                        onChange={(e) => setImageUrl(e.target.value)}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">This image will appear on their profile and the public 'Our Team' page.</p>
                                </div>
                            )}
                            {/* --- END OF NEW FIELD --- */}

                        </div>

                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                            <button
                                onClick={() => setEditingMember(null)}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateRole}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition shadow-md"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}