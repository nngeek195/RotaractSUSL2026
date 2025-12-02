'use client';

import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, addDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import NavBar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import { Search, MapPin, Phone, Package, X, Loader2, Heart, Plus, FileSearch, User } from "lucide-react";

export default function ReliefRequestsPage() {
    const [requests, setRequests] = useState([]);
    const [filteredRequests, setFilteredRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter states
    const [searchSchool, setSearchSchool] = useState("");
    const [filterDistrict, setFilterDistrict] = useState("");
    const [filterStatus, setFilterStatus] = useState("");

    // Modal state
    const [selectedRequest, setSelectedRequest] = useState(null);

    // Donation form state
    const [showDonationForm, setShowDonationForm] = useState(false);
    const [donationForm, setDonationForm] = useState({
        donorName: "",
        contactNumber: "",
        email: "",
        itemsOffered: "",
        district: "",
        message: ""
    });
    const [submittingDonation, setSubmittingDonation] = useState(false);

    // Request donation form state
    const [showRequestForm, setShowRequestForm] = useState(false);
    const [requestForm, setRequestForm] = useState({
        schoolName: "",
        district: "",
        address: "",
        contactPerson: "",
        contactNumber: "",
        email: "",
        description: "",
        items: [{ name: "", quantity: "" }]
    });
    const [submittingRequest, setSubmittingRequest] = useState(false);
    const [generatedToken, setGeneratedToken] = useState("");
    const [emailSent, setEmailSent] = useState(false);

    // Track request modal
    const [showTrackModal, setShowTrackModal] = useState(false);
    const [trackToken, setTrackToken] = useState("");
    const [trackingRequest, setTrackingRequest] = useState(false);

    const districts = [
        "Colombo", "Gampaha", "Kalutara", "Kandy", "Matale", "Nuwara Eliya",
        "Galle", "Matara", "Hambantota", "Jaffna", "Kilinochchi", "Mannar",
        "Vavuniya", "Mullaitivu", "Batticaloa", "Ampara", "Trincomalee",
        "Kurunegala", "Puttalam", "Anuradhapura", "Polonnaruwa", "Badulla",
        "Monaragala", "Ratnapura", "Kegalle"
    ].sort();

    useEffect(() => {
        fetchRequests();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [requests, searchSchool, filterDistrict, filterStatus]);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "materialRequests"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            const requestsList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setRequests(requestsList);
        } catch (error) {
            console.error("Error fetching requests:", error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...requests];

        if (searchSchool) {
            filtered = filtered.filter(req =>
                req.schoolName.toLowerCase().includes(searchSchool.toLowerCase())
            );
        }

        if (filterDistrict) {
            filtered = filtered.filter(req => req.district === filterDistrict);
        }

        if (filterStatus) {
            filtered = filtered.filter(req => req.status === filterStatus);
        }

        setFilteredRequests(filtered);
    };

    const clearFilters = () => {
        setSearchSchool("");
        setFilterDistrict("");
        setFilterStatus("");
    };

    const getStatusBadge = (status) => {
        const styles = {
            pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
            assigned: "bg-blue-100 text-blue-800 border-blue-300",
            fulfilled: "bg-green-100 text-green-800 border-green-300"
        };
        return styles[status] || styles.pending;
    };

    const getStatusCounts = () => {
        return {
            pending: filteredRequests.filter(r => r.status === "pending").length,
            assigned: filteredRequests.filter(r => r.status === "assigned").length,
            fulfilled: filteredRequests.filter(r => r.status === "fulfilled").length
        };
    };

    const counts = getStatusCounts();

    const handleDonationSubmit = async (e) => {
        e.preventDefault();

        if (!donationForm.donorName || !donationForm.contactNumber || !donationForm.itemsOffered) {
            alert("Please fill in all required fields");
            return;
        }

        setSubmittingDonation(true);
        try {
            await addDoc(collection(db, "donationOffers"), {
                ...donationForm,
                createdAt: new Date(),
                status: "pending"
            });

            alert("Thank you! Your donation offer has been submitted successfully. Our team will contact you soon.");
            setShowDonationForm(false);
            setDonationForm({
                donorName: "",
                contactNumber: "",
                email: "",
                itemsOffered: "",
                district: "",
                message: ""
            });
        } catch (error) {
            console.error("Error submitting donation:", error);
            alert("Failed to submit donation offer. Please try again.");
        } finally {
            setSubmittingDonation(false);
        }
    };

    const handleRequestSubmit = async (e) => {
        e.preventDefault();

        if (!requestForm.schoolName || !requestForm.district || !requestForm.contactPerson || !requestForm.contactNumber) {
            alert("Please fill in all required fields");
            return;
        }

        const validItems = requestForm.items.filter(item => item.name && item.quantity);
        if (validItems.length === 0) {
            alert("Please add at least one item");
            return;
        }

        setSubmittingRequest(true);
        setEmailSent(false);
        try {
            // Generate unique token
            const token = `REL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

            await addDoc(collection(db, "materialRequests"), {
                schoolName: requestForm.schoolName,
                district: requestForm.district,
                address: requestForm.address,
                contactPerson: requestForm.contactPerson,
                contactNumber: requestForm.contactNumber,
                email: requestForm.email,
                description: requestForm.description,
                items: validItems,
                requestToken: token,
                status: "pending",
                createdAt: new Date(),
                updatedAt: new Date()
            });

            setGeneratedToken(token);

            // Send email notification if email provided
            if (requestForm.email) {
                try {
                    const trackUrl = `${window.location.origin}/manage-relief?token=${token}`;
                    const emailResponse = await fetch('/api/send-email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            template: 'relief_token',
                            to: requestForm.email,
                            data: {
                                schoolName: requestForm.schoolName,
                                district: requestForm.district,
                                contactPerson: requestForm.contactPerson,
                                contactNumber: requestForm.contactNumber,
                                description: requestForm.description || "No description provided",
                                items: validItems,
                                token: token,
                                trackUrl: trackUrl
                            }
                        })
                    });

                    if (emailResponse.ok) {
                        setEmailSent(true);
                    }
                } catch (emailError) {
                    console.error("Error sending email:", emailError);
                    // Don't block the submission if email fails
                }
            }

            // Reset form
            setRequestForm({
                schoolName: "",
                district: "",
                address: "",
                contactPerson: "",
                contactNumber: "",
                email: "",
                description: "",
                items: [{ name: "", quantity: "" }]
            });

            // Refresh requests list
            fetchRequests();
        } catch (error) {
            console.error("Error submitting request:", error);
            alert("Failed to submit request. Please try again.");
        } finally {
            setSubmittingRequest(false);
        }
    };

    const addItemField = () => {
        setRequestForm({
            ...requestForm,
            items: [...requestForm.items, { name: "", quantity: "" }]
        });
    };

    const removeItemField = (index) => {
        const newItems = requestForm.items.filter((_, i) => i !== index);
        setRequestForm({ ...requestForm, items: newItems });
    };

    const updateItem = (index, field, value) => {
        const newItems = [...requestForm.items];
        newItems[index][field] = value;
        setRequestForm({ ...requestForm, items: newItems });
    };

    const copyToken = () => {
        navigator.clipboard.writeText(generatedToken);
        alert("Token copied to clipboard!");
    };

    const handleTrackRequest = async (e) => {
        e.preventDefault();

        if (!trackToken.trim()) {
            alert("Please enter your tracking token");
            return;
        }

        setTrackingRequest(true);
        try {
            const q = query(collection(db, "materialRequests"), where("requestToken", "==", trackToken.trim()));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                alert("No request found with this token. Please check your token and try again.");
            } else {
                // Redirect to manage-relief page with token
                window.location.href = `/manage-relief?token=${trackToken.trim()}`;
            }
        } catch (error) {
            console.error("Error tracking request:", error);
            alert("Failed to track request. Please try again.");
        } finally {
            setTrackingRequest(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <NavBar currentPage="relief" />

            <div className="pt-8 pb-16 px-4 lg:px-8 max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8 rounded-2xl shadow-lg mb-8">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                            <h1 className="font-playfair text-4xl font-bold mb-3">
                                📋 Material Requests
                            </h1>
                            <p className="font-poppins text-lg text-blue-50">
                                Browse and help fulfill material requests for flood-affected schools
                            </p>
                            <p className="font-poppins text-base mt-1 text-blue-100">
                                පහත බොත්තම් භාවිතා කර ඉල්ලීම් කරන්න, පරිත්‍යාග කරන්න හෝ ඔබගේ ඉල්ලීම පරීක්ෂා කරන්න.
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
                            <button
                                onClick={() => setShowTrackModal(true)}
                                className="bg-purple-600 text-white px-8 py-5 rounded-xl font-poppins font-extrabold text-base md:text-lg hover:bg-purple-700 transition flex items-center gap-3 shadow-xl min-w-[240px] justify-center border-2 border-purple-700"
                                aria-label="Track my request (මගේ ඉල්ලීම පරීක්ෂා කරන්න)"
                            >
                                <FileSearch size={24} />
                                <span className="flex flex-col leading-tight text-center">
                                    <span>Track My Request</span>
                                    <span className="text-xs md:text-sm font-medium text-purple-50">මගේ ඉල්ලීම පරීක්ෂා කරන්න</span>
                                </span>
                            </button>
                            <button
                                onClick={() => setShowRequestForm(true)}
                                className="bg-white text-blue-700 px-8 py-5 rounded-xl font-poppins font-extrabold text-base md:text-lg hover:bg-blue-50 transition flex items-center gap-3 shadow-xl min-w-[240px] justify-center"
                                aria-label="Request donation (අවශ්‍ය දේ ඉල්ලන්න)"
                            >
                                <Plus size={24} />
                                <span className="flex flex-col leading-tight text-center">
                                    <span>Request Donation</span>
                                    <span className="text-xs md:text-sm font-medium text-blue-500">අවශ්‍ය දේ ඉල්ලන්න</span>
                                </span>
                            </button>
                            <button
                                onClick={() => setShowDonationForm(true)}
                                className="bg-pink-600 text-white px-8 py-5 rounded-xl font-poppins font-extrabold text-base md:text-lg hover:bg-pink-700 transition flex items-center gap-3 shadow-xl min-w-[240px] justify-center"
                                aria-label="Offer donation (පරිත්‍යාග කරන්න)"
                            >
                                <Heart size={24} />
                                <span className="flex flex-col leading-tight text-center">
                                    <span>Offer Donation</span>
                                    <span className="text-xs md:text-sm font-medium text-pink-100">පරිත්‍යාග කරන්න</span>
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6">
                        <p className="font-poppins text-sm text-yellow-700 mb-1">Pending Requests</p>
                        <p className="font-playfair text-4xl font-bold text-yellow-800">{counts.pending}</p>
                    </div>
                    <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6">
                        <p className="font-poppins text-sm text-blue-700 mb-1">Assigned Requests</p>
                        <p className="font-playfair text-4xl font-bold text-blue-800">{counts.assigned}</p>
                    </div>
                    <div className="bg-green-50 border-2 border-green-300 rounded-xl p-6">
                        <p className="font-poppins text-sm text-green-700 mb-1">Fulfilled Requests</p>
                        <p className="font-playfair text-4xl font-bold text-green-800">{counts.fulfilled}</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                    <h2 className="font-playfair text-2xl font-bold text-gray-800 mb-6">
                        🔍 Filter Requests
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className="block font-poppins font-medium text-gray-700 mb-2">
                                Search by School Name
                            </label>
                            <input
                                type="text"
                                value={searchSchool}
                                onChange={(e) => setSearchSchool(e.target.value)}
                                placeholder="Enter school name..."
                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent font-poppins"
                            />
                        </div>

                        <div>
                            <label className="block font-poppins font-medium text-gray-700 mb-2">
                                Filter by District
                            </label>
                            <select
                                value={filterDistrict}
                                onChange={(e) => setFilterDistrict(e.target.value)}
                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent font-poppins"
                            >
                                <option value="">All Districts</option>
                                {districts.map(district => (
                                    <option key={district} value={district}>{district}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block font-poppins font-medium text-gray-700 mb-2">
                                Filter by Status
                            </label>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent font-poppins"
                            >
                                <option value="">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="assigned">Assigned</option>
                                <option value="fulfilled">Fulfilled</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={clearFilters}
                            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-poppins font-medium hover:bg-gray-300 transition"
                        >
                            Clear Filters
                        </button>
                        <p className="text-sm text-gray-600 font-poppins flex items-center">
                            Showing {filteredRequests.length} of {requests.length} requests
                        </p>
                    </div>
                </div>

                {/* Requests List */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="animate-spin text-pink-600" size={48} />
                    </div>
                ) : filteredRequests.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                        <p className="font-poppins text-gray-600 text-lg">
                            No requests found matching your criteria
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredRequests.map((request) => (
                            <div
                                key={request.id}
                                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition border border-gray-100 flex flex-col"
                            >
                                {/* Icon and Status */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <Package size={24} className="text-blue-600" />
                                    </div>
                                    <span className={`px-3 py-1 rounded-full font-poppins font-bold text-xs uppercase ${getStatusBadge(request.status)}`}>
                                        {request.status}
                                    </span>
                                </div>

                                {/* School Name */}
                                <h3 className="font-poppins font-semibold text-lg md:text-xl text-gray-900 mb-3 leading-snug break-words">
                                    {request.schoolName}
                                </h3>

                                {/* Details */}
                                <div className="space-y-3 mb-4">
                                    <div className="flex items-start gap-2 text-gray-600">
                                        <MapPin size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
                                        <span className="font-poppins text-sm">{request.district}</span>
                                    </div>
                                    <div className="flex items-start gap-2 text-gray-600">
                                        <User size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
                                        <span className="font-poppins text-sm">{request.contactPerson}</span>
                                    </div>
                                    <div className="flex items-start gap-2 text-gray-600">
                                        <Phone size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
                                        <span className="font-poppins text-sm">{request.contactNumber}</span>
                                    </div>
                                </div>

                                {/* Description */}
                                {request.description && (
                                    <p className="text-sm text-gray-600 font-poppins mb-4 line-clamp-2">
                                        {request.description}
                                    </p>
                                )}

                                {/* Materials Needed */}
                                <div className="mb-4 flex-grow">
                                    <p className="font-poppins font-semibold text-gray-800 text-sm mb-2">
                                        Materials Needed:
                                    </p>
                                    <div className="space-y-1">
                                        {request.items?.slice(0, 3).map((item, index) => (
                                            <div key={index} className="flex justify-between items-center text-sm">
                                                <span className="font-poppins text-gray-700">{item.name}</span>
                                                <span className="font-poppins font-bold text-gray-900">×{item.quantity}</span>
                                            </div>
                                        ))}
                                        {request.items?.length > 3 && (
                                            <p className="text-xs text-gray-500 font-poppins italic">
                                                +{request.items.length - 3} more item(s)
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Date and Button - Always at bottom */}
                                <div className="mt-auto">
                                    <div className="flex items-center gap-2 text-gray-500 text-xs font-poppins mb-4">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {request.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                                    </div>

                                    <button
                                        onClick={() => setSelectedRequest(request)}
                                        className="w-full bg-pink-600 text-white py-3 rounded-lg font-poppins font-bold hover:bg-pink-700 transition"
                                    >
                                        View Details
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Request Detail Modal */}
            {selectedRequest && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedRequest(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="sticky top-0 bg-gradient-to-r from-pink-600 to-purple-600 text-white p-6 rounded-t-2xl flex items-start justify-between">
                            <div className="flex-1">
                                <h2 className="font-poppins text-xl md:text-2xl font-semibold mb-2 leading-snug">
                                    {selectedRequest.schoolName}
                                </h2>
                                <span className={`inline-block px-3 py-1 rounded-full font-poppins font-bold text-xs border-2 uppercase ${getStatusBadge(selectedRequest.status)}`}>
                                    {selectedRequest.status}
                                </span>
                            </div>
                            <button
                                onClick={() => setSelectedRequest(null)}
                                className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <p className="font-poppins font-semibold text-gray-700 mb-1">District</p>
                                    <p className="font-poppins text-gray-900">{selectedRequest.district}</p>
                                </div>
                                <div>
                                    <p className="font-poppins font-semibold text-gray-700 mb-1">Contact Person</p>
                                    <p className="font-poppins text-gray-900">{selectedRequest.contactPerson}</p>
                                </div>
                                <div>
                                    <p className="font-poppins font-semibold text-gray-700 mb-1">Contact Number</p>
                                    <p className="font-poppins text-gray-900">{selectedRequest.contactNumber}</p>
                                </div>
                                <div>
                                    <p className="font-poppins font-semibold text-gray-700 mb-1">Submitted</p>
                                    <p className="font-poppins text-gray-900">
                                        {selectedRequest.createdAt?.toDate?.()?.toLocaleDateString()} at {selectedRequest.createdAt?.toDate?.()?.toLocaleTimeString()}
                                    </p>
                                </div>
                            </div>

                            {selectedRequest.address && (
                                <div className="mb-6">
                                    <p className="font-poppins font-semibold text-gray-700 mb-1">Address</p>
                                    <p className="font-poppins text-gray-900">{selectedRequest.address}</p>
                                </div>
                            )}

                            {selectedRequest.description && (
                                <div className="mb-6">
                                    <p className="font-poppins font-semibold text-gray-700 mb-1">Description</p>
                                    <p className="font-poppins text-gray-900">{selectedRequest.description}</p>
                                </div>
                            )}

                            <div className="mb-6">
                                <p className="font-poppins font-semibold text-gray-900 mb-3 text-lg">Materials Requested</p>
                                <div className="space-y-2">
                                    {selectedRequest.items?.map((item, index) => (
                                        <div key={index} className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-200">
                                            <span className="font-poppins text-gray-900 font-medium">{item.name}</span>
                                            <span className="font-poppins font-bold text-pink-600 text-lg">{item.quantity}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                                <p className="font-poppins text-sm text-gray-800 text-center">
                                    💙 To help fulfill this request, please contact the school directly using the contact number provided above.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Donation Form Modal */}
            {showDonationForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDonationForm(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="sticky top-0 bg-gradient-to-r from-pink-600 to-purple-600 text-white p-6 rounded-t-2xl flex items-start justify-between">
                            <div>
                                <h2 className="font-playfair text-2xl font-bold mb-2">
                                    💝 Offer a Donation
                                </h2>
                                <p className="font-poppins text-sm text-pink-50">
                                    Help flood-affected schools by donating materials
                                </p>
                            </div>
                            <button
                                onClick={() => setShowDonationForm(false)}
                                className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleDonationSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block font-poppins font-semibold text-gray-700 mb-2">
                                    Your Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={donationForm.donorName}
                                    onChange={(e) => setDonationForm({ ...donationForm, donorName: e.target.value })}
                                    placeholder="Enter your full name"
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent font-poppins"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-poppins font-semibold text-gray-700 mb-2">
                                        Contact Number <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        value={donationForm.contactNumber}
                                        onChange={(e) => setDonationForm({ ...donationForm, contactNumber: e.target.value })}
                                        placeholder="07XXXXXXXX"
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent font-poppins"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block font-poppins font-semibold text-gray-700 mb-2">
                                        Email (Optional)
                                    </label>
                                    <input
                                        type="email"
                                        value={donationForm.email}
                                        onChange={(e) => setDonationForm({ ...donationForm, email: e.target.value })}
                                        placeholder="your@email.com"
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent font-poppins"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-poppins font-semibold text-gray-700 mb-2">
                                    Your District
                                </label>
                                <select
                                    value={donationForm.district}
                                    onChange={(e) => setDonationForm({ ...donationForm, district: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent font-poppins"
                                >
                                    <option value="">Select your district</option>
                                    {districts.map(district => (
                                        <option key={district} value={district}>{district}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block font-poppins font-semibold text-gray-700 mb-2">
                                    Items You Can Donate <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={donationForm.itemsOffered}
                                    onChange={(e) => setDonationForm({ ...donationForm, itemsOffered: e.target.value })}
                                    placeholder="E.g., 50 notebooks, 100 pens, 20 water bottles"
                                    rows={4}
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent font-poppins"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block font-poppins font-semibold text-gray-700 mb-2">
                                    Additional Message (Optional)
                                </label>
                                <textarea
                                    value={donationForm.message}
                                    onChange={(e) => setDonationForm({ ...donationForm, message: e.target.value })}
                                    placeholder="Any additional information or preferences"
                                    rows={3}
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent font-poppins"
                                />
                            </div>

                            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                                <p className="font-poppins text-sm text-gray-700">
                                    💙 Our team will review your donation offer and contact you within 24-48 hours to coordinate the delivery.
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowDonationForm(false)}
                                    className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-poppins font-bold hover:bg-gray-300 transition"
                                    disabled={submittingDonation}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-pink-600 text-white px-6 py-3 rounded-lg font-poppins font-bold hover:bg-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    disabled={submittingDonation}
                                >
                                    {submittingDonation ? (
                                        <>
                                            <Loader2 className="animate-spin" size={20} />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <Heart size={20} />
                                            Submit Donation Offer
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Request Donation Form Modal */}
            {showRequestForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => !generatedToken && setShowRequestForm(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl flex items-start justify-between">
                            <div>
                                <h2 className="font-playfair text-2xl font-bold mb-2">
                                    {generatedToken ? "✅ Request Submitted!" : "📝 Request Material Donation"}
                                </h2>
                                <p className="font-poppins text-sm text-blue-50 mb-1">
                                    {generatedToken ? "Save your token to track your request" : "Submit your material needs for flood relief"}
                                </p>
                                <p className="font-poppins text-xs text-blue-100">
                                    {generatedToken ? "ඔබගේ ඉල්ලීම පරීක්ෂා කිරීමට ටෝකනය සුරකින්න" : "ඔබට අවශ්‍ය භාණ්ඩ ඉල්ලීම ඉදිරිපත් කරන්න"}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowRequestForm(false);
                                    setGeneratedToken("");
                                    setEmailSent(false);
                                }}
                                className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {generatedToken ? (
                            // Success view with token
                            <div className="p-6 space-y-6">
                                <div className="bg-green-50 border-2 border-green-300 rounded-lg p-6 text-center">
                                    <div className="text-6xl mb-4">✅</div>
                                    <h3 className="font-playfair text-2xl font-bold text-green-800 mb-2">
                                        Request Submitted Successfully!
                                    </h3>
                                    <p className="font-poppins text-base font-semibold text-green-700 mb-3">
                                        ඉල්ලීම සාර්ථකව ඉදිරිපත් කරන ලදී!
                                    </p>
                                    <p className="font-poppins text-gray-700 mb-2">
                                        Your material request has been received. Please save your tracking token below.
                                    </p>
                                    <p className="font-poppins text-sm text-gray-600 mb-6">
                                        ඔබගේ ඉල්ලීම ලැබී ඇත. කරුණාකර පහත ටෝකනය සුරකින්න.
                                    </p>

                                    {emailSent && (
                                        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 mb-4">
                                            <p className="font-poppins text-sm text-blue-800">
                                                📧 We've also sent this token to your email address!
                                            </p>
                                        </div>
                                    )}

                                    <div className="bg-white p-4 rounded-lg border-2 border-green-400 mb-4">
                                        <p className="font-poppins text-sm text-gray-600 mb-1">Your Tracking Token</p>
                                        <p className="font-poppins text-xs text-gray-500 mb-2">ඔබගේ ටෝකනය</p>
                                        <p className="font-mono text-2xl font-bold text-green-700 mb-3">{generatedToken}</p>
                                        <button
                                            onClick={copyToken}
                                            className="bg-green-600 text-white px-6 py-2 rounded-lg font-poppins font-bold hover:bg-green-700 transition"
                                        >
                                            📋 Copy Token / ටෝකනය පිටපත් කරන්න
                                        </button>
                                    </div>

                                    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-left">
                                        <p className="font-poppins text-sm text-gray-700 mb-2">
                                            <strong>Important:</strong> Use this token to track and update your request status at{" "}
                                            <a href="/manage-relief" className="text-blue-600 underline">/manage-relief</a>
                                        </p>
                                        <p className="font-poppins text-sm text-gray-600">
                                            <strong>වැදගත්:</strong> ඔබගේ ඉල්ලීමේ තත්ත්වය පරීක්ෂා කිරීමට හා යාවත්කාලීන කිරීමට මෙම ටෝකනය භාවිතා කරන්න{" "}
                                            <a href="/manage-relief" className="text-blue-600 underline">/manage-relief</a> පිටුවේදී.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <a
                                        href="/manage-relief"
                                        className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-poppins font-bold hover:bg-blue-700 transition text-center"
                                    >
                                        Track My Request
                                    </a>
                                    <button
                                        onClick={() => {
                                            setShowRequestForm(false);
                                            setGeneratedToken("");
                                            setEmailSent(false);
                                        }}
                                        className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-poppins font-bold hover:bg-gray-300 transition"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        ) : (
                            // Request form
                            <form onSubmit={handleRequestSubmit} className="p-6 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block font-poppins font-semibold text-gray-700 mb-2">
                                            School Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={requestForm.schoolName}
                                            onChange={(e) => setRequestForm({ ...requestForm, schoolName: e.target.value })}
                                            placeholder="Enter school name"
                                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-poppins"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block font-poppins font-semibold text-gray-700 mb-2">
                                            District <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={requestForm.district}
                                            onChange={(e) => setRequestForm({ ...requestForm, district: e.target.value })}
                                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-poppins"
                                            required
                                        >
                                            <option value="">Select district</option>
                                            {districts.map(district => (
                                                <option key={district} value={district}>{district}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block font-poppins font-semibold text-gray-700 mb-2">
                                        School Address <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={requestForm.address}
                                        onChange={(e) => setRequestForm({ ...requestForm, address: e.target.value })}
                                        placeholder="Enter complete address"
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-poppins"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block font-poppins font-semibold text-gray-700 mb-2">
                                            Contact Person <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={requestForm.contactPerson}
                                            onChange={(e) => setRequestForm({ ...requestForm, contactPerson: e.target.value })}
                                            placeholder="Principal/Teacher name"
                                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-poppins"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block font-poppins font-semibold text-gray-700 mb-2">
                                            Contact Number <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="tel"
                                            value={requestForm.contactNumber}
                                            onChange={(e) => setRequestForm({ ...requestForm, contactNumber: e.target.value })}
                                            placeholder="07XXXXXXXX"
                                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-poppins"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block font-poppins font-semibold text-gray-700 mb-2">
                                        Email Address (Optional)
                                    </label>
                                    <input
                                        type="email"
                                        value={requestForm.email}
                                        onChange={(e) => setRequestForm({ ...requestForm, email: e.target.value })}
                                        placeholder="school@example.com (to receive tracking token via email)"
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-poppins"
                                    />
                                    <p className="font-poppins text-xs text-gray-500 mt-1">
                                        We'll send your tracking token to this email for easy access
                                    </p>
                                </div>

                                <div>
                                    <label className="block font-poppins font-semibold text-gray-700 mb-2">
                                        Description of Situation
                                    </label>
                                    <textarea
                                        value={requestForm.description}
                                        onChange={(e) => setRequestForm({ ...requestForm, description: e.target.value })}
                                        placeholder="Briefly describe the flood damage and why these materials are needed"
                                        rows={3}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-poppins"
                                    />
                                </div>

                                <div>
                                    <label className="block font-poppins font-semibold text-gray-700 mb-2">
                                        Materials Needed <span className="text-red-500">*</span>
                                    </label>
                                    <div className="space-y-3">
                                        {requestForm.items.map((item, index) => (
                                            <div key={index} className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={item.name}
                                                    onChange={(e) => updateItem(index, 'name', e.target.value)}
                                                    placeholder="Item name (e.g., Notebooks)"
                                                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-poppins"
                                                />
                                                <input
                                                    type="text"
                                                    value={item.quantity}
                                                    onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                                    placeholder="Quantity (e.g., 100)"
                                                    className="w-32 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-poppins"
                                                />
                                                {requestForm.items.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeItemField(index)}
                                                        className="px-4 py-3 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                                                    >
                                                        <X size={20} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={addItemField}
                                            className="w-full px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-poppins font-medium hover:bg-blue-100 transition flex items-center justify-center gap-2"
                                        >
                                            <Plus size={18} />
                                            Add Another Item
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
                                    <p className="font-poppins text-sm text-red-800 mb-2">
                                        <strong>Important:</strong> When a donor is assigned or your needs are fully met, please update the request status using your tracking token via <span className="font-semibold">Track My Request</span>. Keeping your status current helps us direct support to schools still in need.
                                    </p>
                                    <p className="font-poppins text-sm text-red-700">
                                        <strong>වැදගත්:</strong> පරිත්‍යාගකරුවෙකු හා සම්බන්ධ වී ඔබගේ අවශ්‍යතා පූරණය වූ පසු, ඔබගේ ටෝකනය භාවිතා කර ඔබගේ ඉල්ලීමේ තත්ත්වය යාවත්කාලීන කරන්න. මෙය තවදුරටත් උපකාර අවශ්‍ය පාසල් වෙත සහාය වීමට උපකාරී වේ.
                                    </p>
                                </div>

                                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
                                    <p className="font-poppins text-sm text-gray-800 mb-2">
                                        ⚠️ After submission, you will receive a tracking token. Please save it to check your request status later.
                                    </p>
                                    <p className="font-poppins text-sm text-gray-700">
                                        ඉල්ලීම ඉදිරිපත් කිරීමෙන් පසු, ඔබට ටෝකනයක් ලැබෙනු ඇත. කරුණාකර එය සුරකින්න. පසුව ඔබගේ ඉල්ලීමේ තත්ත්වය පරීක්ෂා කිරීමට එය භාවිතා කරන්න.
                                    </p>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowRequestForm(false)}
                                        className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-poppins font-bold hover:bg-gray-300 transition"
                                        disabled={submittingRequest}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-poppins font-bold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        disabled={submittingRequest}
                                    >
                                        {submittingRequest ? (
                                            <>
                                                <Loader2 className="animate-spin" size={20} />
                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                <Plus size={20} />
                                                Submit Request
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Track Request Modal */}
            {showTrackModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowTrackModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-2xl flex items-start justify-between">
                            <div>
                                <h2 className="font-playfair text-2xl font-bold mb-2">
                                    🔍 Track Your Request
                                </h2>
                                <p className="font-poppins text-sm text-indigo-50">
                                    Enter your tracking token to manage your request
                                </p>
                            </div>
                            <button
                                onClick={() => setShowTrackModal(false)}
                                className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleTrackRequest} className="p-6 space-y-4">
                            <div>
                                <label className="block font-poppins font-semibold text-gray-700 mb-2">
                                    Tracking Token <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={trackToken}
                                    onChange={(e) => setTrackToken(e.target.value)}
                                    placeholder="Enter your token (e.g., REL-XXXXX-XXXXX)"
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-lg"
                                    required
                                />
                                <p className="text-sm text-gray-500 mt-2 font-poppins">
                                    Enter the token you received when you submitted your request
                                </p>
                            </div>

                            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
                                <p className="font-poppins text-sm text-gray-700">
                                    💡 <strong>Don't have your token?</strong> Check your email or the confirmation page you saw after submitting your request.
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowTrackModal(false)}
                                    className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-poppins font-bold hover:bg-gray-300 transition"
                                    disabled={trackingRequest}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg font-poppins font-bold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    disabled={trackingRequest}
                                >
                                    {trackingRequest ? (
                                        <>
                                            <Loader2 className="animate-spin" size={20} />
                                            Searching...
                                        </>
                                    ) : (
                                        <>
                                            <FileSearch size={20} />
                                            Track Request
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}
