'use client';

import { useState } from "react";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import NavBar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import { Send, Plus, Trash2, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function ReliefRequestPage() {
    const [formData, setFormData] = useState({
        schoolName: "",
        district: "",
        address: "",
        contact: "",
        email: ""
    });

    const [items, setItems] = useState([{ itemName: "", quantity: "" }]);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [requestToken, setRequestToken] = useState("");
    const [error, setError] = useState("");

    const districts = [
        "Colombo", "Gampaha", "Kalutara", "Kandy", "Matale", "Nuwara Eliya",
        "Galle", "Matara", "Hambantota", "Jaffna", "Kilinochchi", "Mannar",
        "Vavuniya", "Mullaitivu", "Batticaloa", "Ampara", "Trincomalee",
        "Kurunegala", "Puttalam", "Anuradhapura", "Polonnaruwa", "Badulla",
        "Monaragala", "Ratnapura", "Kegalle"
    ].sort();

    const generateToken = () => {
        return 'REL-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleItemChange = (index, field, value) => {
        const updatedItems = [...items];
        updatedItems[index][field] = value;
        setItems(updatedItems);
    };

    const addItem = () => {
        setItems([...items, { itemName: "", quantity: "" }]);
    };

    const removeItem = (index) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        // Validation
        if (!formData.schoolName || !formData.district || !formData.contact) {
            setError("Please fill in all required fields");
            return;
        }

        const validItems = items.filter(item => item.itemName && item.quantity);
        if (validItems.length === 0) {
            setError("Please add at least one material item");
            return;
        }

        setSubmitting(true);

        try {
            const token = generateToken();

            await addDoc(collection(db, "materialRequests"), {
                schoolName: formData.schoolName,
                district: formData.district,
                address: formData.address,
                contact: formData.contact,
                email: formData.email,
                items: validItems,
                status: "pending",
                requestToken: token,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            });

            setRequestToken(token);
            setSubmitted(true);

            // Update Google Sheet
            fetch('/api/relief/update-sheet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'request',
                    data: {
                        schoolName: formData.schoolName,
                        district: formData.district,
                        address: formData.address,
                        contactNumber: formData.contact,
                        email: formData.email,
                        items: validItems.map(i => ({ name: i.itemName, quantity: i.quantity })),
                        requestToken: token,
                        status: 'pending'
                    }
                })
            }).catch(err => console.error('Failed to update sheet:', err));

            // Notify Admin (WhatsApp)
            fetch('/api/notify-admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'relief_request',
                    data: {
                        schoolName: formData.schoolName,
                        district: formData.district,
                        contactPerson: formData.contact, // Using contact field as person/number mix
                        contactNumber: formData.contact
                    }
                })
            }).catch(err => console.error('Failed to notify admin:', err));
        } catch (err) {
            console.error("Error submitting request:", err);
            setError("Failed to submit request. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({
            schoolName: "",
            district: "",
            address: "",
            contact: "",
            email: ""
        });
        setItems([{ itemName: "", quantity: "" }]);
        setSubmitted(false);
        setRequestToken("");
        setError("");
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <NavBar currentPage="relief" />

            <div className="pt-24 pb-16 px-4 lg:px-8 max-w-4xl mx-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-pink-600 to-purple-600 text-white p-8 rounded-2xl shadow-lg mb-8">
                    <h1 className="font-playfair text-4xl font-bold mb-3">
                        🇱🇰 Flood Relief - Material Request
                    </h1>
                    <p className="font-poppins text-lg text-pink-50">
                        Request educational materials and supplies for flood-affected students
                    </p>
                </div>

                {!submitted ? (
                    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8">
                        <h2 className="font-playfair text-2xl font-bold text-gray-800 mb-6">
                            Submit Material Request
                        </h2>

                        {error && (
                            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                                <AlertCircle className="text-red-600 mt-0.5" size={20} />
                                <p className="text-red-700 font-poppins">{error}</p>
                            </div>
                        )}

                        {/* School Details */}
                        <div className="space-y-4 mb-6">
                            <h3 className="font-poppins font-semibold text-gray-700 text-lg">School Details</h3>

                            <div>
                                <label className="block font-poppins font-medium text-gray-700 mb-2">
                                    School Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="schoolName"
                                    value={formData.schoolName}
                                    onChange={handleInputChange}
                                    placeholder="පාසලේ නම / School Name"
                                    required
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent font-poppins"
                                />
                            </div>

                            <div>
                                <label className="block font-poppins font-medium text-gray-700 mb-2">
                                    District <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="district"
                                    value={formData.district}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent font-poppins"
                                >
                                    <option value="">Select District</option>
                                    {districts.map(district => (
                                        <option key={district} value={district}>{district}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block font-poppins font-medium text-gray-700 mb-2">
                                    Address
                                </label>
                                <textarea
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    placeholder="School address / ලිපිනය"
                                    rows={3}
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent font-poppins"
                                />
                            </div>

                            <div>
                                <label className="block font-poppins font-medium text-gray-700 mb-2">
                                    Contact Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="tel"
                                    name="contact"
                                    value={formData.contact}
                                    onChange={handleInputChange}
                                    placeholder="+94 71 234 5678"
                                    required
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent font-poppins"
                                />
                            </div>
                        </div>

                        {/* Materials Needed */}
                        <div className="space-y-4 mb-6">
                            <h3 className="font-poppins font-semibold text-gray-700 text-lg">Materials Needed</h3>

                            {items.map((item, index) => (
                                <div key={index} className="flex gap-3">
                                    <input
                                        type="text"
                                        value={item.itemName}
                                        onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                                        placeholder="Item name (e.g., Notebooks)"
                                        className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent font-poppins"
                                    />
                                    <input
                                        type="text"
                                        value={item.quantity}
                                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                        placeholder="Quantity"
                                        className="w-32 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent font-poppins"
                                    />
                                    {items.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeItem(index)}
                                            className="px-3 py-3 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    )}
                                </div>
                            ))}

                            <button
                                type="button"
                                onClick={addItem}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition font-poppins font-medium"
                            >
                                <Plus size={20} /> Add Another Item
                            </button>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-pink-600 text-white py-4 rounded-lg font-poppins font-bold text-lg hover:bg-pink-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? (
                                <>Processing...</>
                            ) : (
                                <>
                                    <Send size={20} />
                                    Submit Request
                                </>
                            )}
                        </button>
                    </form>
                ) : (
                    <div className="bg-white rounded-2xl shadow-lg p-8">
                        <div className="text-center mb-6">
                            <div className="inline-block p-4 bg-green-100 rounded-full mb-4">
                                <CheckCircle className="text-green-600" size={48} />
                            </div>
                            <h2 className="font-playfair text-3xl font-bold text-gray-800 mb-3">
                                Request Submitted Successfully!
                            </h2>
                            <p className="font-poppins text-gray-600 mb-6">
                                Your material request has been recorded. Please save the token below.
                            </p>
                        </div>

                        <div className="bg-yellow-50 border-4 border-yellow-400 rounded-xl p-6 mb-6">
                            <p className="font-poppins font-bold text-gray-800 mb-2 text-center">
                                ⚠️ IMPORTANT: Save Your Request Token
                            </p>
                            <div className="bg-white p-4 rounded-lg text-center">
                                <p className="font-mono text-2xl font-bold text-pink-600 mb-2">
                                    {requestToken}
                                </p>
                                <p className="font-poppins text-sm text-gray-600">
                                    You will need this token to update your request status
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3 mb-6">
                            <button
                                onClick={() => {
                                    const copyToken = () => {
                                        navigator.clipboard.writeText(generatedToken);
                                        toast.success("Token copied to clipboard!");
                                    };
                                }}
                                className="w-full bg-blue-600 text-white py-3 rounded-lg font-poppins font-medium hover:bg-blue-700 transition"
                            >
                                📋 Copy Token to Clipboard
                            </button>

                            <a
                                href="/manage-relief"
                                className="block w-full bg-green-600 text-white py-3 rounded-lg font-poppins font-medium hover:bg-green-700 transition text-center"
                            >
                                Update Request Status
                            </a>

                            <button
                                onClick={resetForm}
                                className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-poppins font-medium hover:bg-gray-300 transition"
                            >
                                Submit Another Request
                            </button>
                        </div>

                        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                            <p className="font-poppins text-sm text-gray-700 text-center">
                                ℹ️ Check all relief requests at <a href="/relief-requests" className="text-pink-600 font-bold hover:underline">/relief-requests</a>
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
}
