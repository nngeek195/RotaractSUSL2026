"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Check, X, Mail, Phone, User, Loader2 } from "lucide-react";

// Define the roles as an array
const executiveRoles = [
    "President", "Vice-President", "Secretary", "Assistant Secretary",
    "Editor", "Assistant Treasurer", "Sgt. at Arms", "Club Service",
    "Community Service", "International Service", "Professional Development",
    "Finance", "Membership Development", "Public Relations", "Sports and Recreational Activities"
];

export default function PendingRequests() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [selectedRole, setSelectedRole] = useState("Member");

    // Fetch data on load
    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, "pendingRequests"));
            const reqs = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setRequests(reqs);
        } catch (error) {
            console.error("Error fetching requests:", error);
        }
        setLoading(false);
    };

    // Reject Request
    const handleReject = async (requestId) => {
        if (!confirm("Are you sure you want to reject this user?")) return;

        try {
            await deleteDoc(doc(db, "pendingRequests", requestId));
            setRequests(requests.filter(req => req.id !== requestId));
        } catch (error) {
            console.error("Error rejecting:", error);
            alert("Failed to reject request.");
        }
    };

    // Open the Approval Modal
    const openApproveModal = (request) => {
        setSelectedRequest(request);
        setSelectedRole("Member"); // Reset to default
        setShowRoleModal(true);
    };

    // Confirm Approval
    const handleConfirmApproval = async () => {
        if (!selectedRequest) return;

        const { id, ...requestData } = selectedRequest;

        // 1. Decide target collection
        const isExecutive = executiveRoles.includes(selectedRole);
        const targetCollection = isExecutive ? "executiveCommittee" : "users";

        // 2. Prepare data for new collection
        const userData = {
            ...requestData,
            uid: id,
            position: selectedRole,
            joinedAt: new Date(),
        };

        try {
            // 3. Add to new collection
            await setDoc(doc(db, targetCollection, id), userData);

            // 4. Delete from pendingRequests
            await deleteDoc(doc(db, "pendingRequests", id));

            // 5. Update UI
            setRequests(requests.filter(req => req.id !== id));
            setShowRoleModal(false);
            setSelectedRequest(null);
            alert(`User ${selectedRequest.fullName} approved as ${selectedRole}!`);

        } catch (error) {
            console.error("Error approving request: ", error);
            alert("An error occurred. Please try again.");
        }
    };

    return (
        <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Pending Membership Requests</h1>

            {loading ? (
                <div className="flex justify-center mt-10">
                    <Loader2 className="animate-spin" size={40} />
                </div>
            ) : (
                <div className="bg-white shadow-xl rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applicant</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason to Join</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {requests.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="px-6 py-4 text-center text-gray-500">No pending requests.</td>
                                </tr>
                            )}
                            {requests.map((req) => (
                                <tr key={req.id}>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{req.fullName}</div>
                                        <div className="text-sm text-gray-500">{req.studentId}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        <div className="flex items-center gap-2"><User size={14} /> {req.faculty}</div>
                                        <div className="flex items-center gap-2"><Mail size={14} /> {req.email}</div>
                                        <div className="flex items-center gap-2"><Phone size={14} /> {req.whatsapp}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{req.reason}</td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <button onClick={() => openApproveModal(req)} className="p-2 bg-green-100 text-green-700 rounded-full hover:bg-green-200" title="Approve">
                                            <Check size={18} />
                                        </button>
                                        <button onClick={() => handleReject(req.id)} className="p-2 bg-red-100 text-red-700 rounded-full hover:bg-red-200" title="Reject">
                                            <X size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Role Assignment Modal */}
            {showRoleModal && selectedRequest && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
                        <h3 className="text-xl font-bold mb-4">Approve: {selectedRequest.fullName}</h3>
                        <p className="mb-4">Select the position to assign this user:</p>
                        <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="w-full p-2 border rounded-md"
                        >
                            <option value="Member">Member (General)</option>
                            {executiveRoles.map(role => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </select>
                        <div className="mt-6 flex justify-end gap-3">
                            <button onClick={() => setShowRoleModal(false)} className="px-4 py-2 bg-gray-200 rounded-md">
                                Cancel
                            </button>
                            <button onClick={handleConfirmApproval} className="px-4 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-800">
                                Confirm Approval
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}