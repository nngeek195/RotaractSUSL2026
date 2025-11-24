"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
// Using relative path to avoid build errors with aliases
import { db } from "../../../lib/firebase";
import { Check, X, Mail, Phone, User, Loader2 } from "lucide-react";

// --- Helper Functions ---

// Send Email via API
async function sendEmailNotification(email, fullName, type) {
    try {
        await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, fullName, type }),
        });
    } catch (error) {
        console.error("Failed to trigger email:", error);
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

            // Filter out those who haven't verified their email yet (so Admin doesn't see spam)
            const visibleReqs = reqs.filter(r => r.status !== 'email_verification_pending');

            setRequests(visibleReqs);
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
            const { id, status, emailVerificationToken, ...userData } = selectedRequest;

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

            // E. Send Welcome Email (Background)
            // We trigger this asynchronously so the UI updates instantly
            sendEmailNotification(selectedRequest.email, selectedRequest.fullName, 'approve');

            // F. Update UI
            setRequests(prev => prev.filter(req => req.id !== id));
            setShowRoleModal(false);
            setSelectedRequest(null);
            alert(`User Approved! Welcome email sent to ${selectedRequest.email}`);

        } catch (error) {
            console.error("Error approving user:", error);
            alert("Failed to approve user. Check console.");
        }
    };

    // 2. Reject Logic
    const handleReject = async (request) => {
        if (!confirm(`Are you sure you want to reject ${request.fullName}?`)) return;

        try {
            // Delete from DB
            await deleteDoc(doc(db, "pendingRequests", request.id));

            // Send Rejection Email
            sendEmailNotification(request.email, request.fullName, 'reject');

            // Remove from UI
            setRequests(prev => prev.filter(r => r.id !== request.id));
        } catch (e) {
            console.error(e);
            alert("Failed to reject user");
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
            ) : (
                <div className="bg-white shadow-xl rounded-lg overflow-hidden border border-gray-100">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applicant</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact Details</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {requests.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                                        No pending requests found.
                                    </td>
                                </tr>
                            )}

                            {requests.map((req) => (
                                <tr key={req.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{req.fullName}</div>
                                        <div className="text-sm text-gray-500">{req.studentId}</div>
                                    </td>

                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        <div className="flex items-center gap-2 mb-1">
                                            <User size={14} className="text-gray-400" /> {req.faculty}
                                        </div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Mail size={14} className="text-gray-400" /> {req.email}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Phone size={14} className="text-gray-400" /> {req.whatsapp}
                                        </div>
                                    </td>

                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-600 max-w-xs truncate" title={req.reason}>
                                            {req.reason}
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 text-right space-x-2">
                                        <button
                                            onClick={() => {
                                                setSelectedRequest(req);
                                                setSelectedRole("Member");
                                                setShowRoleModal(true);
                                            }}
                                            className="p-2 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition"
                                            title="Approve User"
                                        >
                                            <Check size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleReject(req)}
                                            className="p-2 bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition"
                                            title="Reject User"
                                        >
                                            <X size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
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