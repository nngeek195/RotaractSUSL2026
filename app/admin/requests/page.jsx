"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
// Using relative path to avoid build errors with aliases
import { db } from "../../../lib/firebase";
import {
    Check, X, Mail, Phone, User, Loader2, Search, Filter,
    Shield, ChevronLeft, ChevronRight, MoreHorizontal, FileText,
    GraduationCap, Briefcase
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- Helper Functions ---

// Send Email via API (Resend backend)
async function sendEmailNotification(email, fullName, action, reason) {
    const isApprove = action === 'approve';
    const loginUrl = typeof window !== 'undefined' ? window.location.origin + '/login' : '';

    const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            to: email,
            template: isApprove ? 'membership_approved' : 'membership_rejected',
            data: { name: fullName, loginUrl, reason }
        })
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || 'Failed to send email');
    }
}

// Roles List
const executiveRoles = [
    "President", "Vice-President", "Secretary", "Assistant Secretary",
    "Editor", "Assistant Treasurer", "Sgt. at Arms", "Club Service",
    "Community Service", "International Service", "Professional Development",
    "Finance", "Membership Development", "Public Relations", "Sports and Recreational Activities"
];

const commonRejectionReasons = [
    "Not using university email address",
    "Invalid Student ID format",
    "Duplicate request"
];

export default function PendingRequests() {
    // --- State Management ---
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Action States
    const [rejectingId, setRejectingId] = useState(null);
    const [rejectReason, setRejectReason] = useState('');

    // Modal State
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [selectedRole, setSelectedRole] = useState("Member");

    // --- Initial Load ---
    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, "pendingRequests"));
            const reqs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Get UIDs of pending requests
            const uids = reqs.filter(r => r.status === 'pending').map(r => r.id);

            if (uids.length === 0) {
                setRequests([]);
                setLoading(false);
                return;
            }

            // Check email verification from Firebase Auth via API
            const response = await fetch('/api/check-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uids })
            });

            const { verificationStatus } = await response.json();

            // Filter to show only verified users
            const verifiedReqs = reqs.filter(req =>
                verificationStatus[req.id] === true && req.status === 'pending'
            );

            setRequests(verifiedReqs);
        } catch (error) {
            console.error("Error fetching requests:", error);
        }
        setLoading(false);
    };

    // --- Actions ---

    // 1. Approve Logic (DIRECT MOVE + WELCOME EMAIL)
    const handleConfirmApproval = async () => {
        if (!selectedRequest) return;

        try {
            // Destructure to remove temporary fields we don't need in the final profile
            const { id, status, ...userData } = selectedRequest;

            // A. Determine Target Collection
            const isExecutive = executiveRoles.includes(selectedRole);
            const targetCollection = isExecutive ? "executiveCommittee" : "users";

            // B. Create Final User Object
            const finalUserData = {
                ...userData,
                uid: id,
                position: selectedRole,
                joinedAt: new Date(),
                status: 'active' // User is now fully active
            };

            // C. Move to Permanent Collection
            await setDoc(doc(db, targetCollection, id), finalUserData);

            // D. Delete from Pending Requests (Cleanup)
            await deleteDoc(doc(db, "pendingRequests", id));

            // E. Send Welcome Email via API
            await sendEmailNotification(selectedRequest.email, selectedRequest.fullName, 'approve');

            // F. Update UI
            setRequests(prev => prev.filter(req => req.id !== id));
            setShowRoleModal(false);
            setSelectedRequest(null);
            alert(`User Approved! Welcome email sent to ${selectedRequest.email}`);

        } catch (error) {
            console.error("Error approving user:", error);
            alert("User approved, but sending the email failed. Please verify email settings and try again.");
        }
    };

    // 2. Reject Logic
    const handleReject = async (request, providedReason) => {
        const trimmed = (providedReason || '').trim();
        if (!trimmed) {
            alert('Rejection reason is required.');
            return;
        }

        try {
            // Persist rejection record for user visibility
            await setDoc(doc(db, 'rejectedRequests', request.id), {
                uid: request.id,
                fullName: request.fullName,
                nameWithInitials: request.nameWithInitials || '',
                studentId: request.studentId || '',
                faculty: request.faculty || '',
                department: request.department || '',
                whatsapp: request.whatsapp || '',
                email: request.email,
                reasonToJoin: request.reason || '',
                rejectionReason: trimmed,
                rejectedAt: new Date(),
                status: 'rejected'
            });

            // Delete from pending (local cleanup)
            await deleteDoc(doc(db, 'pendingRequests', request.id));

            // Server-side: Remove user from Firebase Auth and Firestore
            try {
                const token = await (await import('firebase/auth')).getIdToken((await import('../../../lib/firebase')).auth.currentUser);
            } catch { }
            const idToken = await (await import('firebase/auth')).getIdToken((await import('../../../lib/firebase')).auth.currentUser).catch(() => null);
            await fetch('/api/admin/delete-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
                },
                body: JSON.stringify({ uid: request.id })
            });

            // Send Rejection Email with reason
            await sendEmailNotification(request.email, request.fullName, 'reject', trimmed);

            // Update UI
            setRequests(prev => prev.filter(r => r.id !== request.id));
            setRejectingId(null);
            setRejectReason('');
            alert('User rejected, removed, and notified with the provided reason.');
        } catch (e) {
            console.error(e);
            alert('Failed to reject user.');
        }
    };

    // --- Computed Data ---
    const filteredRequests = requests.filter(req =>
        req.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = {
        total: requests.length,
        today: requests.length, // Placeholder logic, could be filtered by date
        faculties: [...new Set(requests.map(r => r.faculty))].length
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
    };

    // --- Render ---
    return (
        <div className="min-h-screen bg-gray-50/50 pb-12">

            {/* Header Section */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm backdrop-blur-xl bg-white/90">
                <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-pink-500 to-rose-600 rounded-lg text-white shadow-lg shadow-pink-500/20">
                                <User size={24} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 tracking-tight leading-none">Membership Requests</h1>
                                <p className="text-sm text-gray-500 font-medium mt-1">Review and approve new member applications</p>
                            </div>
                        </div>

                        {/* Stats Summary */}
                        <div className="flex items-center gap-6 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100 self-start md:self-auto">
                            <div className="text-center px-2">
                                <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Pending</span>
                                <span className="block text-xl font-bold text-gray-900">{stats.total}</span>
                            </div>
                            <div className="w-px h-8 bg-gray-200"></div>
                            <div className="text-center px-2">
                                <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Faculties</span>
                                <span className="block text-xl font-bold text-pink-600">{stats.faculties}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">

                {/* Tools Bar */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name, student ID, or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all shadow-sm text-sm"
                        />
                    </div>
                    {/* Add Filter Dropdown if needed later */}
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex flex-col justify-center items-center py-20 text-gray-400">
                        <Loader2 className="animate-spin text-pink-500 mb-4" size={40} />
                        <p className="text-sm font-medium">Loading requests...</p>
                    </div>
                ) : filteredRequests.length === 0 ? (
                    <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-gray-100">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <User size={32} className="text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">No Requests Found</h3>
                        <p className="text-gray-500 max-w-sm mx-auto">
                            {searchTerm ? "No results match your search terms." : "There are currently no pending membership requests."}
                        </p>
                    </div>
                ) : (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="space-y-4"
                    >
                        {/* Mobile Card View (Visible only on small screens) */}
                        <div className="block lg:hidden space-y-4">
                            {filteredRequests.map((req) => (
                                <motion.div key={req.id} variants={itemVariants} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-lg">{req.fullName}</h3>
                                            <p className="text-sm text-gray-500">{req.nameWithInitials}</p>
                                        </div>
                                        <div className="bg-pink-50 text-pink-700 text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wide">
                                            {req.status}
                                        </div>
                                    </div>

                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center gap-3 text-sm text-gray-700">
                                            <GraduationCap size={16} className="text-gray-400 shrink-0" />
                                            <span>{req.studentId} â€¢ {req.faculty}</span>
                                        </div>
                                        {/* Added Department */}
                                        {req.department && (
                                            <div className="flex items-center gap-3 text-sm text-gray-700">
                                                <Briefcase size={16} className="text-gray-400 shrink-0" />
                                                <span>{req.department}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-3 text-sm text-gray-700">
                                            <Mail size={16} className="text-gray-400 shrink-0" />
                                            <span className="break-all">{req.email}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-gray-700">
                                            <Phone size={16} className="text-gray-400 shrink-0" />
                                            <span>{req.whatsapp}</span>
                                        </div>
                                        {/* Added Reason */}
                                        {req.reason && (
                                            <div className="flex items-start gap-3 text-sm text-gray-700 bg-gray-50 p-3 rounded-lg mt-2">
                                                <FileText size={16} className="text-gray-400 shrink-0 mt-0.5" />
                                                <span className="text-gray-600 italic">"{req.reason}"</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="pt-4 border-t border-gray-100">
                                        {rejectingId === req.id ? (
                                            <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                                {/* Rejection Reasons Helper */}
                                                <div className="flex flex-wrap gap-2 mb-2">
                                                    {commonRejectionReasons.map((reason) => (
                                                        <button
                                                            key={reason}
                                                            onClick={() => setRejectReason(reason)}
                                                            className="text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded-full border border-red-200 hover:bg-red-200 transition-colors"
                                                        >
                                                            {reason}
                                                        </button>
                                                    ))}
                                                </div>
                                                <textarea
                                                    value={rejectReason}
                                                    onChange={(e) => setRejectReason(e.target.value)}
                                                    className="w-full text-sm p-3 border border-red-200 bg-red-50 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                                                    placeholder="Reason for rejection..."
                                                    rows={2}
                                                    autoFocus
                                                />
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => setRejectingId(null)}
                                                        className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={() => { handleReject(req, rejectReason); }}
                                                        className="px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm"
                                                    >
                                                        Confirm Reject
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setRejectingId(req.id)}
                                                    className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors flex items-center justify-center gap-2 text-sm"
                                                >
                                                    <X size={16} /> Reject
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedRequest(req);
                                                        setSelectedRole("Member");
                                                        setShowRoleModal(true);
                                                    }}
                                                    className="flex-1 py-2.5 rounded-lg bg-pink-600 text-white font-medium hover:bg-pink-700 transition-all shadow-md shadow-pink-200 flex items-center justify-center gap-2 text-sm"
                                                >
                                                    <Check size={16} /> Approve
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">User Details</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Academic Info</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredRequests.map((req) => (
                                        <motion.tr
                                            key={req.id}
                                            variants={itemVariants}
                                            className="hover:bg-gray-50 transition-colors group"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
                                                        <User size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900">{req.fullName}</p>
                                                        <p className="text-xs text-gray-500">{req.nameWithInitials}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-sm text-gray-900 font-medium">
                                                        <GraduationCap size={14} className="text-gray-400" />
                                                        {req.studentId}
                                                    </div>
                                                    <p className="text-xs text-gray-500 pl-6">{req.faculty}</p>
                                                    {/* Added Department */}
                                                    {req.department && <p className="text-xs text-gray-500 pl-6">{req.department}</p>}
                                                    {/* Added Reason Snippet */}
                                                    {req.reason && (
                                                        <div className="pl-6 mt-1">
                                                            <p className="text-xs text-gray-400 italic whitespace-normal max-w-sm leading-snug break-words">
                                                                "{req.reason}"
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-sm text-gray-700">
                                                        <Mail size={14} className="text-gray-400" />
                                                        {req.email}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                                        <Phone size={14} className="text-gray-400" />
                                                        {req.whatsapp}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {rejectingId === req.id ? (
                                                    <div className="flex flex-col items-end gap-2 animate-in fade-in slide-in-from-right-4 relative">
                                                        {/* Inline Rejection UI for Table - Expanded */}
                                                        <div className="flex flex-wrap gap-1 mb-1 justify-end max-w-[200px]">
                                                            {commonRejectionReasons.map((reason) => (
                                                                <button
                                                                    key={reason}
                                                                    onClick={() => setRejectReason(reason)}
                                                                    className="text-[9px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full border border-red-100 hover:bg-red-100 hover:border-red-200 transition-colors whitespace-nowrap"
                                                                >
                                                                    {reason}
                                                                </button>
                                                            ))}
                                                        </div>
                                                        <div className="flex items-center gap-2 w-full justify-end">
                                                            <textarea
                                                                value={rejectReason}
                                                                onChange={(e) => setRejectReason(e.target.value)}
                                                                placeholder="Reason..."
                                                                className="text-sm border border-red-300 rounded-lg px-2 py-1.5 w-64 outline-none focus:ring-2 focus:ring-red-200 resize-none h-[40px]"
                                                                autoFocus
                                                            />
                                                            <button
                                                                onClick={() => { handleReject(req, rejectReason); }}
                                                                className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                                                                title="Confirm"
                                                            >
                                                                <Check size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => setRejectingId(null)}
                                                                className="p-1.5 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition"
                                                                title="Cancel"
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => setRejectingId(req.id)}
                                                            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-transparent hover:border-red-200"
                                                        >
                                                            Reject
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedRequest(req);
                                                                setSelectedRole("Member");
                                                                setShowRoleModal(true);
                                                            }}
                                                            className="flex items-center gap-1 px-4 py-1.5 text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 rounded-lg shadow-sm hover:shadow transition-all"
                                                        >
                                                            Approve
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}
            </main>

            {/* --- Approval Modal --- */}
            <AnimatePresence>
                {showRoleModal && selectedRequest && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="bg-white p-6 rounded-2xl shadow-2xl max-w-md w-full border border-gray-100"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">Approve Member</h3>
                                    <p className="text-sm text-gray-500 mt-1">Assign an official role to activate account.</p>
                                </div>
                                <button onClick={() => setShowRoleModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-xl flex items-start gap-3 mb-6">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">
                                    {selectedRequest.fullName.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-bold text-blue-900">{selectedRequest.fullName}</p>
                                    <p className="text-xs text-blue-600 break-all">{selectedRequest.email}</p>
                                </div>
                            </div>

                            <div className="mb-6 space-y-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Assign Role</label>
                                <div className="relative">
                                    <select
                                        value={selectedRole}
                                        onChange={(e) => setSelectedRole(e.target.value)}
                                        className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 bg-white appearance-none font-medium text-gray-700"
                                    >
                                        <option value="Member">General Member</option>
                                        <optgroup label="Executive Committee">
                                            {executiveRoles.map(role => (
                                                <option key={role} value={role}>{role}</option>
                                            ))}
                                        </optgroup>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                        <Briefcase size={16} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowRoleModal(false)}
                                    className="flex-1 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-xl font-medium transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmApproval}
                                    className="flex-[2] px-4 py-3 bg-pink-600 text-white rounded-xl font-bold hover:bg-pink-700 shadow-lg shadow-pink-200 transition flex items-center justify-center gap-2"
                                >
                                    <Check size={18} /> Confirm & Activate
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}