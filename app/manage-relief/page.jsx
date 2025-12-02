'use client';

import { useState, useEffect, Suspense } from "react";
import { collection, query, where, getDocs, updateDoc, doc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import NavBar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import { Key, Search, CheckCircle, AlertCircle, Edit } from "lucide-react";
import { useSearchParams } from "next/navigation";

function ManageReliefContent() {
    const searchParams = useSearchParams();
    const [token, setToken] = useState("");
    const [searching, setSearching] = useState(false);
    const [request, setRequest] = useState(null);
    const [error, setError] = useState("");
    const [newStatus, setNewStatus] = useState("");
    const [updating, setUpdating] = useState(false);
    const [updateSuccess, setUpdateSuccess] = useState(false);

    // Auto-verify token from URL parameter
    useEffect(() => {
        const urlToken = searchParams.get('token');
        if (urlToken) {
            setToken(urlToken);
            // Auto-verify after a brief delay to ensure state is set
            setTimeout(() => {
                verifyToken(urlToken);
            }, 100);
        }
    }, [searchParams]);

    const verifyToken = async (tokenToVerify) => {
        const tokenValue = tokenToVerify || token.trim();

        setError("");
        setRequest(null);
        setUpdateSuccess(false);

        if (!tokenValue) {
            setError("Please enter your request token");
            return;
        }

        setSearching(true);

        try {
            const q = query(
                collection(db, "materialRequests"),
                where("requestToken", "==", tokenValue)
            );

            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setError("Invalid token. Please check and try again.");
            } else {
                const requestData = {
                    id: querySnapshot.docs[0].id,
                    ...querySnapshot.docs[0].data()
                };
                setRequest(requestData);
                setNewStatus(requestData.status);
            }
        } catch (err) {
            console.error("Error verifying token:", err);
            setError("Failed to verify token. Please try again.");
        } finally {
            setSearching(false);
        }
    };

    const handleVerifyToken = async (e) => {
        e.preventDefault();
        verifyToken();
    };

    const handleUpdateStatus = async () => {
        if (!request || !newStatus) return;

        setUpdating(true);
        setError("");

        try {
            await updateDoc(doc(db, "materialRequests", request.id), {
                status: newStatus,
                updatedAt: Timestamp.now(),
            });

            setUpdateSuccess(true);
            setRequest({ ...request, status: newStatus });
        } catch (err) {
            console.error("Error updating status:", err);
            setError("Failed to update status. Please try again.");
        } finally {
            setUpdating(false);
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
            assigned: "bg-blue-100 text-blue-800 border-blue-300",
            fulfilled: "bg-green-100 text-green-800 border-green-300"
        };
        return styles[status] || styles.pending;
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <NavBar currentPage="relief" />

            <div className="pt-24 pb-16 px-4 lg:px-8 max-w-4xl mx-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-8 rounded-2xl shadow-lg mb-8">
                    <h1 className="font-playfair text-4xl font-bold mb-3">
                        🔐 Manage Relief Request
                    </h1>
                    <p className="font-poppins text-lg text-green-50">
                        Update your material request status using your unique token
                    </p>
                </div>

                {!request ? (
                    <form onSubmit={handleVerifyToken} className="bg-white rounded-2xl shadow-lg p-8">
                        <h2 className="font-playfair text-2xl font-bold text-gray-800 mb-6">
                            Enter Your Request Token
                        </h2>

                        {error && (
                            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                                <AlertCircle className="text-red-600 mt-0.5" size={20} />
                                <p className="text-red-700 font-poppins">{error}</p>
                            </div>
                        )}

                        <div className="mb-6">
                            <label className="block font-poppins font-medium text-gray-700 mb-2">
                                Request Token <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Key className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    value={token}
                                    onChange={(e) => setToken(e.target.value.toUpperCase())}
                                    placeholder="REL-XXXXXXXXXX-XXXXX"
                                    required
                                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-lg"
                                />
                            </div>
                            <p className="text-sm text-gray-500 font-poppins mt-2">
                                Enter the token you received when you submitted your request
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={searching}
                            className="w-full bg-green-600 text-white py-4 rounded-lg font-poppins font-bold text-lg hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {searching ? (
                                <>Verifying...</>
                            ) : (
                                <>
                                    <Search size={20} />
                                    Verify Token
                                </>
                            )}
                        </button>
                    </form>
                ) : (
                    <div className="space-y-6">
                        {/* Request Details */}
                        <div className="bg-white rounded-2xl shadow-lg p-8">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="font-playfair text-2xl font-bold text-gray-800">
                                    Request Details
                                </h2>
                                <span className={`px-4 py-2 rounded-full font-poppins font-bold text-sm border-2 uppercase ${getStatusBadge(request.status)}`}>
                                    {request.status}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <p className="font-poppins font-semibold text-gray-700 mb-1">School Name</p>
                                    <p className="font-poppins text-gray-900 font-medium">{request.schoolName}</p>
                                </div>
                                <div>
                                    <p className="font-poppins font-semibold text-gray-700 mb-1">District</p>
                                    <p className="font-poppins text-gray-900 font-medium">{request.district}</p>
                                </div>
                                <div>
                                    <p className="font-poppins font-semibold text-gray-700 mb-1">Contact Person</p>
                                    <p className="font-poppins text-gray-900 font-medium">{request.contactPerson}</p>
                                </div>
                                <div>
                                    <p className="font-poppins font-semibold text-gray-700 mb-1">Contact Number</p>
                                    <p className="font-poppins text-gray-900 font-medium">{request.contactNumber}</p>
                                </div>
                                <div>
                                    <p className="font-poppins font-semibold text-gray-700 mb-1">Submitted</p>
                                    <p className="font-poppins text-gray-900 font-medium">
                                        {request.createdAt?.toDate?.()?.toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            {request.address && (
                                <div className="mb-6">
                                    <p className="font-poppins font-semibold text-gray-700 mb-1">Address</p>
                                    <p className="font-poppins text-gray-900 font-medium">{request.address}</p>
                                </div>
                            )}

                            {request.description && (
                                <div className="mb-6">
                                    <p className="font-poppins font-semibold text-gray-700 mb-1">Description</p>
                                    <p className="font-poppins text-gray-900 font-medium">{request.description}</p>
                                </div>
                            )}

                            <div>
                                <p className="font-poppins font-semibold text-gray-900 mb-3 text-lg">Materials Requested</p>
                                <div className="space-y-2">
                                    {request.items?.map((item, index) => (
                                        <div key={index} className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-200">
                                            <span className="font-poppins text-gray-900 font-medium">{item.name}</span>
                                            <span className="font-poppins font-bold text-pink-600 text-lg">{item.quantity}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Update Status */}
                        <div className="bg-white rounded-2xl shadow-lg p-8">
                            <h3 className="font-playfair text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                                <Edit size={24} className="text-green-600" />
                                Update Request Status
                            </h3>

                            {updateSuccess && (
                                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                                    <CheckCircle className="text-green-600 mt-0.5" size={20} />
                                    <p className="text-green-700 font-poppins">Status updated successfully!</p>
                                </div>
                            )}

                            {error && (
                                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                                    <AlertCircle className="text-red-600 mt-0.5" size={20} />
                                    <p className="text-red-700 font-poppins">{error}</p>
                                </div>
                            )}

                            <div className="mb-6">
                                <label className="block font-poppins font-medium text-gray-700 mb-3">
                                    Select New Status
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <button
                                        onClick={() => setNewStatus("pending")}
                                        className={`p-4 rounded-lg border-2 transition ${newStatus === "pending"
                                            ? "bg-yellow-50 border-yellow-500 text-yellow-700"
                                            : "bg-white border-gray-300 text-gray-700 hover:border-yellow-300"
                                            }`}
                                    >
                                        <p className="font-poppins font-bold mb-1">Pending</p>
                                        <p className="font-poppins text-xs">Awaiting assignment</p>
                                    </button>
                                    <button
                                        onClick={() => setNewStatus("assigned")}
                                        className={`p-4 rounded-lg border-2 transition ${newStatus === "assigned"
                                            ? "bg-blue-50 border-blue-500 text-blue-700"
                                            : "bg-white border-gray-300 text-gray-700 hover:border-blue-300"
                                            }`}
                                    >
                                        <p className="font-poppins font-bold mb-1">Assigned</p>
                                        <p className="font-poppins text-xs">Donor assigned</p>
                                    </button>
                                    <button
                                        onClick={() => setNewStatus("fulfilled")}
                                        className={`p-4 rounded-lg border-2 transition ${newStatus === "fulfilled"
                                            ? "bg-green-50 border-green-500 text-green-700"
                                            : "bg-white border-gray-300 text-gray-700 hover:border-green-300"
                                            }`}
                                    >
                                        <p className="font-poppins font-bold mb-1">Fulfilled</p>
                                        <p className="font-poppins text-xs">Materials received</p>
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={handleUpdateStatus}
                                disabled={updating || newStatus === request.status}
                                className="w-full bg-green-600 text-white py-4 rounded-lg font-poppins font-bold text-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {updating ? "Updating..." : "Update Status"}
                            </button>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => {
                                    setRequest(null);
                                    setToken("");
                                    setError("");
                                    setUpdateSuccess(false);
                                }}
                                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-poppins font-medium hover:bg-gray-300 transition"
                            >
                                ← Back to Token Entry
                            </button>
                            <a
                                href="/relief-requests"
                                className="flex-1 bg-pink-600 text-white py-3 rounded-lg font-poppins font-medium hover:bg-pink-700 transition text-center"
                            >
                                View All Requests →
                            </a>
                        </div>
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
}

export default function ManageReliefPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
                    <p className="font-poppins text-gray-600">Loading...</p>
                </div>
            </div>
        }>
            <ManageReliefContent />
        </Suspense>
    );
}
