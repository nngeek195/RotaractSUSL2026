"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
// Using relative path to avoid build errors with aliases
import { db } from "../../../lib/firebase";
import { Check, X, Mail, Phone, User, Loader2 } from "lucide-react";

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

export default function PendingRequests() {
    // --- State Management ---
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
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
                } catch {}
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

    // --- Render ---
    return (
        <div className="max-w-6xl mx-auto p-4">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Pending Membership Requests</h1>

            {loading ? (
                <div className="flex justify-center mt-10">
                    <Loader2 className="animate-spin text-blue-600" size={40} />
                </div>
                ) : requests.length === 0 ? (
                    <div className="bg-white shadow-lg rounded-xl p-12 text-center border border-gray-100">
                        <div className="text-gray-400 mb-4">
                            <User size={64} className="mx-auto" />
                        </div>
                        <p className="text-gray-500 text-lg">No pending requests found.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {requests.map((req) => (
                            <div key={req.id} className="bg-white shadow-lg rounded-xl border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow">
                                {/* Card Header */}
                                <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                                    <h3 className="text-xl font-bold text-white">{req.fullName}</h3>
                                    {req.nameWithInitials && (
                                        <p className="text-blue-100 text-sm mt-1">
                                            Name with Initials: {req.nameWithInitials}
                                        </p>
                                    )}
                                </div>

                                {/* Card Body */}
                                <div className="p-6 space-y-4">
                                    {/* Academic Info */}
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Academic Information</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-start">
                                                <span className="font-medium text-gray-700 w-28 flex-shrink-0">Student ID:</span>
                                                <span className="text-gray-900">{req.studentId}</span>
                                            </div>
                                            <div className="flex items-start">
                                                <span className="font-medium text-gray-700 w-28 flex-shrink-0">Faculty:</span>
                                                <span className="text-gray-900">{req.faculty}</span>
                                            </div>
                                            {req.department && (
                                                <div className="flex items-start">
                                                    <span className="font-medium text-gray-700 w-28 flex-shrink-0">Department:</span>
                                                    <span className="text-gray-900">{req.department}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Contact Info */}
                                    <div className="bg-blue-50 rounded-lg p-4">
                                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Contact Details</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-center gap-2">
                                                <Mail size={16} className="text-blue-600 flex-shrink-0" />
                                                <span className="text-gray-900 break-all">{req.email}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Phone size={16} className="text-blue-600 flex-shrink-0" />
                                                <span className="text-gray-900">{req.whatsapp}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Reason to Join */}
                                    <div className="bg-purple-50 rounded-lg p-4">
                                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Why Join Rotaract?</h4>
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                            {req.reason}
                                        </p>
                                    </div>
                                </div>

                                {/* Card Actions */}
                                <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
                                    {rejectingId === req.id ? (
                                        <div className="space-y-3">
                                            <label className="text-sm font-medium text-gray-700">Rejection Reason</label>
                                            <textarea
                                                value={rejectReason}
                                                onChange={(e) => setRejectReason(e.target.value)}
                                                rows={3}
                                                className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-400"
                                                placeholder={`Explain why ${req.fullName} is being rejected...`}
                                            />
                                            <div className="flex justify-end gap-3">
                                                <button
                                                    onClick={() => { setRejectingId(null); setRejectReason(''); }}
                                                    className="px-5 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={() => handleReject(req, rejectReason)}
                                                    className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                                                >
                                                    Confirm Reject
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex justify-end gap-3">
                                            <button
                                                onClick={() => { setRejectingId(req.id); setRejectReason(''); }}
                                                className="px-6 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition font-medium flex items-center gap-2"
                                                title="Reject User"
                                            >
                                                <X size={18} />
                                                Reject
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedRequest(req);
                                                    setSelectedRole("Member");
                                                    setShowRoleModal(true);
                                                }}
                                                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium flex items-center gap-2 shadow-md"
                                                title="Approve User"
                                            >
                                                <Check size={18} />
                                                Approve
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
            )}

            {/* --- Approval Modal --- */}
            {showRoleModal && selectedRequest && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-xl shadow-2xl max-w-md w-full transform transition-all">
                        <h3 className="text-xl font-bold mb-2 text-gray-800">Approve Membership</h3>
                        <p className="text-sm text-gray-600 mb-6">
                            Assign a role for <span className="font-semibold text-gray-900">{selectedRequest.fullName}</span>.
                            This will activate their account immediately and send a welcome email.
                        </p>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Assign Position</label>
                            <select
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                                <option value="Member">General Member</option>
                                <optgroup label="Executive Committee">
                                    {executiveRoles.map(role => (
                                        <option key={role} value={role}>{role}</option>
                                    ))}
                                </optgroup>
                            </select>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowRoleModal(false)}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmApproval}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-md transition flex items-center gap-2"
                            >
                                <Check size={16} /> Confirm Approval
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}