"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { Edit2, Trash2, PlusCircle, Loader2 } from "lucide-react";

export default function LeaderboardAdmin() {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null);
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
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        setLoading(true);
        const snap = await getDocs(collection(db, "leaderboard"));
        setMembers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
    };

    const handleEdit = (member) => {
        setEditing(member.id);
        setForm({
            name: member.name || "",
            role: member.role || "",
            faculty: member.faculty || "",
            phone: member.phone || "",
            linkedin: member.linkedin || "",
            photo: member.photo || "",
            positionOrder: member.positionOrder || 0
        });
    };

    const handleDelete = async (id) => {
        if (!confirm("Delete this member?")) return;
        await deleteDoc(doc(db, "leaderboard", id));
        fetchMembers();
    };

    const handleSave = async () => {
        if (editing) {
            await updateDoc(doc(db, "leaderboard", editing), form);
        } else {
            await addDoc(collection(db, "leaderboard"), form);
        }
        setEditing(null);
        setForm({ name: "", role: "", faculty: "", phone: "", linkedin: "", photo: "", positionOrder: 0 });
        fetchMembers();
    };

    // List of roles for dropdown
    const rolesWithOrder = [
        "President",
        "Vice President",
        "Vice President",
        "Vice President",
        "Secretary",
        "Assistant Secretary",
        "Editor",
        "Assistant Treasurer",
        "Sergeant at Arms",
        "Club Service",
        "Community Service",
        "International Service",
        "Professional Development",
        "Finance",
        "Membership Development",
        "Public Relations",
        "Sports and Recreational Activities"
    ];

    return (
        <div className="space-y-8">
            <h1 className="text-2xl font-bold mb-4">Leaderboard Management</h1>
            {loading ? (
                <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-600" size={40} /></div>
            ) : (
                <table className="w-full text-left border-collapse bg-white rounded-xl shadow-md overflow-hidden">
                    <thead>
                        <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider border-b border-gray-200">
                            <th className="p-4 font-semibold">Order</th>
                            <th className="p-4 font-semibold">Photo</th>
                            <th className="p-4 font-semibold">Name</th>
                            <th className="p-4 font-semibold">Role</th>
                            <th className="p-4 font-semibold">Faculty</th>
                            <th className="p-4 font-semibold">Phone</th>
                            <th className="p-4 font-semibold">LinkedIn</th>
                            <th className="p-4 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                        {members
                            .sort((a, b) => (a.positionOrder ?? 999) - (b.positionOrder ?? 999))
                            .map(member => (
                                <tr key={member.id}>
                                    <td className="p-4 font-bold">{member.positionOrder}</td>
                                    <td className="p-4"><img src={member.photo} alt="photo" className="w-12 h-12 rounded-full object-cover" /></td>
                                    <td className="p-4">{member.name}</td>
                                    <td className="p-4">{member.role}</td>
                                    <td className="p-4">{member.faculty}</td>
                                    <td className="p-4">{member.phone}</td>
                                    <td className="p-4">
                                        {member.linkedin ? (
                                            <a href={member.linkedin} target="_blank" rel="noopener noreferrer">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24" style={{ display: 'inline', verticalAlign: 'middle' }}>
                                                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.761 0 5-2.239 5-5v-14c0-2.761-2.239-5-5-5zm-11 19h-3v-10h3v10zm-1.5-11.268c-.966 0-1.75-.784-1.75-1.75s.784-1.75 1.75-1.75 1.75.784 1.75 1.75-.784 1.75-1.75 1.75zm13.5 11.268h-3v-5.604c0-1.337-.026-3.063-1.868-3.063-1.868 0-2.154 1.459-2.154 2.967v5.7h-3v-10h2.881v1.367h.041c.401-.761 1.379-1.563 2.838-1.563 3.036 0 3.599 2.001 3.599 4.601v5.595z" />
                                                </svg>
                                            </a>
                                        ) : (
                                            <span style={{ color: '#888' }}>—</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        <button className="p-2 text-blue-600" onClick={() => handleEdit(member)}><Edit2 size={16} /></button>
                                        <button className="p-2 text-red-600" onClick={() => handleDelete(member.id)}><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            )}
            <div className="bg-white p-6 rounded-xl shadow-md mt-8">
                <h2 className="text-lg font-bold mb-4">{editing ? "Edit Member" : "Add New Member"}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input className="p-3 border rounded" placeholder="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                    <select className="p-3 border rounded" value={form.positionOrder ? `${form.positionOrder} - ${form.role}` : ""} onChange={e => {
                        const selected = e.target.value;
                        const [order, role] = selected.split(' - ');
                        setForm(f => ({ ...f, role, positionOrder: Number(order) }));
                    }}>
                        <option value="">Select Role</option>
                        {rolesWithOrder.map((role, idx) => (
                            <option key={idx} value={`${idx + 1} - ${role}`}>{`${idx + 1} - ${role}`}</option>
                        ))}
                    </select>
                    <select className="p-3 border rounded" value={form.faculty} onChange={e => setForm(f => ({ ...f, faculty: e.target.value }))}>
                        <option value="">Select Faculty</option>
                        <option value="Faculty of Agricultural Sciences">Faculty of Agricultural Sciences</option>
                        <option value="Faculty of Applied Sciences">Faculty of Applied Sciences</option>
                        <option value="Faculty of Geomatics">Faculty of Geomatics</option>
                        <option value="Faculty of Management Studies">Faculty of Management Studies</option>
                        <option value="Faculty of Medicine">Faculty of Medicine</option>
                        <option value="Faculty of Social Sciences and Languages">Faculty of Social Sciences and Languages</option>
                        <option value="Faculty of Computing">Faculty of Computing</option>
                        <option value="Faculty of Technology">Faculty of Technology</option>
                    </select>
                    <input className="p-3 border rounded" placeholder="Phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                    <input className="p-3 border rounded" placeholder="LinkedIn URL" value={form.linkedin} onChange={e => setForm(f => ({ ...f, linkedin: e.target.value }))} />
                    <input className="p-3 border rounded" placeholder="Photo URL" value={form.photo} onChange={e => setForm(f => ({ ...f, photo: e.target.value }))} />
                </div>
                <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded font-bold flex items-center gap-2" onClick={handleSave}>
                    <PlusCircle size={18} /> {editing ? "Update Member" : "Add Member"}
                </button>
                {editing && <button className="mt-4 ml-4 px-6 py-2 bg-gray-300 text-gray-700 rounded font-bold" onClick={() => { setEditing(null); setForm({ name: "", role: "", faculty: "", phone: "", linkedin: "", photo: "" }); }}>Cancel</button>}
            </div>
        </div>
    );
}
