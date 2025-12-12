'use client';
import { useState, useEffect } from 'react';
import { toast } from "sonner";
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy, onSnapshot } from 'firebase/firestore';
import {
    ShieldCheck, Mail, Calendar, CheckCircle, AlertCircle, User, X, Search, MapPin,
    Loader2, Package, ArrowRight, Plus, Heart, FileSearch, Info, Phone, CreditCard,
    UploadCloud, Send, Copy, BadgeCheck, Filter, ChevronDown, Landmark,
    Backpack, Book, PenTool, Pencil, ShoppingBag, Droplet, Shirt, Footprints, Notebook
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CldUploadWidget } from 'next-cloudinary';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const CLOUDINARY_UPLOAD_URL = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_URL || "https://api.cloudinary.com/v1_1/dvqoiqzxe/image/upload";
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "donations";

const ITEM_ICONS = {
    notebooks: <Notebook size={32} className="text-blue-500" />,
    pens: <PenTool size={32} className="text-purple-500" />,
    pencils: <Pencil size={32} className="text-yellow-500" />,
    schoolbags: <Backpack size={32} className="text-pink-500" />,
    shoes: <Footprints size={32} className="text-orange-500" />,
    waterbottles: <Droplet size={32} className="text-cyan-500" />,
    uniforms: <Shirt size={32} className="text-indigo-500" />,
    default: <Package size={32} className="text-gray-400" />
};

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

const buttonVariants = {
    rest: { scale: 1 },
    hover: { scale: 1.05 },
    tap: { scale: 0.95 }
};

export default function ReliefRequestsPage() {
    const [requests, setRequests] = useState([]);
    const [filteredRequests, setFilteredRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    // Config state
    const [bankDetails, setBankDetails] = useState(null);

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
        items: {},
        district: "",
        message: "",
        paymentSlip: ""
    });
    const [submittingDonation, setSubmittingDonation] = useState(false);
    const [uploadingSlip, setUploadingSlip] = useState(false);

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
        items: {} // Changed to object: { itemId: quantity }
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

    // Predefined relief items - loaded from Firestore
    const [predefinedItems, setPredefinedItems] = useState([]);
    const [itemsLoading, setItemsLoading] = useState(true);

    useEffect(() => {
        fetchConfig();

        // Real-time listener for Relief Items
        setItemsLoading(true);
        const qItems = query(collection(db, "reliefItems"), orderBy("sortOrder", "asc"));
        const unsubscribeItems = onSnapshot(qItems, (snapshot) => {
            const itemsList = snapshot.docs.map(doc => ({
                docId: doc.id,
                ...doc.data()
            }));
            setPredefinedItems(itemsList);
            setItemsLoading(false);
        }, (error) => {
            console.error("Error fetching predefined items:", error);
            setItemsLoading(false);
            // Fallback items
            setPredefinedItems([
                { id: "notebooks", name: "Notebooks", icon: "📓", category: "Stationery" },
                { id: "pens", name: "Pens", icon: "🖊️", category: "Stationery" },
                { id: "pencils", name: "Pencils", icon: "✏️", category: "Stationery" },
                { id: "schoolbags", name: "School Bags", icon: "🎒", category: "Bags" }
            ]);
        });

        // Real-time listener for Requests
        setLoading(true);
        const qRequests = query(collection(db, "materialRequests"), orderBy("createdAt", "desc"));
        const unsubscribeRequests = onSnapshot(qRequests, (snapshot) => {
            const requestsList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setRequests(requestsList);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching requests:", error);
            setLoading(false);
        });

        return () => {
            unsubscribeItems();
            unsubscribeRequests();
        };
    }, []);

    const fetchConfig = async () => {
        try {
            const q = query(collection(db, "reliefConfig"));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const config = querySnapshot.docs[0].data();
                if (config.bankDetails) {
                    setBankDetails(config.bankDetails);
                }
            }
        } catch (error) {
            console.error("Error fetching config:", error);
        }
    };

    useEffect(() => {
        applyFilters();
    }, [requests, searchSchool, filterDistrict, filterStatus]);

    // Calculate item statistics
    const calculateItemStats = () => {
        const stats = {};

        predefinedItems.forEach(item => {
            stats[item.id] = {
                name: item.name,
                icon: ITEM_ICONS[item.id] || ITEM_ICONS[item.name.toLowerCase().replace(/\s+/g, '')] || ITEM_ICONS.default,
                totalRequested: 0,
                totalFulfilled: item.globalFulfilled || 0, // Use global fulfilled count from admin
                pending: 0
            };
        });

        requests.forEach(request => {
            request.items?.forEach(item => {
                const itemId = item.id || item.name?.toLowerCase().replace(/\s+/g, ''); // Handle old format
                if (stats[itemId]) {
                    const quantity = parseInt(item.quantity) || 0;
                    stats[itemId].totalRequested += quantity;
                }
            });
        });

        // Calculate pending after summing up requests
        Object.values(stats).forEach(stat => {
            stat.pending = Math.max(0, stat.totalRequested - stat.totalFulfilled);
        });

        return Object.values(stats).filter(stat => stat.totalRequested > 0);
    };

    const itemStats = calculateItemStats();

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

    const handleUploadSlip = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error("File size exceeds 5MB limit.");
            return;
        }

        // Validation: File Type
        const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
        if (!allowedTypes.includes(file.type)) {
            toast.error("Invalid file type. Please upload PDF, JPEG, PNG, or WEBP.");
            return;
        }

        setUploadingSlip(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
            formData.append("folder", "Donations/Slips");

            const res = await fetch(CLOUDINARY_UPLOAD_URL, {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (data.secure_url) {
                setDonationForm(prev => ({ ...prev, paymentSlip: data.secure_url }));
                toast.success("Payment slip uploaded successfully!");
            } else {
                throw new Error("Upload failed");
            }
        } catch (err) {
            console.error("Error uploading slip:", err);
            toast.error("Failed to upload payment slip. Please try again.");
        } finally {
            setUploadingSlip(false);
        }
    };

    const handleDonationSubmit = async (e) => {
        e.preventDefault();

        if (!donationForm.donorName || !donationForm.contactNumber) {
            toast.error("Please fill in all required fields");
            return;
        }

        // Convert items object to array format for storage
        const selectedItems = Object.entries(donationForm.items)
            .filter(([itemId, quantity]) => quantity && parseInt(quantity) > 0)
            .map(([itemId, quantity]) => {
                const item = predefinedItems.find(i => i.id === itemId);
                return {
                    id: itemId,
                    name: item.name,
                    quantity: parseInt(quantity)
                };
            });

        if (selectedItems.length === 0 && !donationForm.itemsOffered && !donationForm.paymentSlip) {
            toast.error("Please select items, type a description, or upload a slip.");
            return;
        }

        if (!donationForm.district) {
            toast.error("Please select your district");
            return;
        }

        if (donationForm.email && !/\S+@\S+\.\S+/.test(donationForm.email)) {
            toast.error("Please enter a valid email address");
            return;
        }

        setSubmittingDonation(true);
        try {
            const docRef = await addDoc(collection(db, "donationOffers"), {
                ...donationForm,
                items: selectedItems,
                createdAt: new Date(),
                status: "pending"
            });

            // Update Google Sheet
            fetch('/api/relief/update-sheet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'donation',
                    data: {
                        ...donationForm,
                        items: selectedItems,
                        id: docRef.id, // Pass the ID for future updates
                        status: 'pending'
                    }
                })
            }).catch(err => console.error('Failed to update sheet:', err));

            // Notify Admin (WhatsApp)
            fetch('/api/notify-admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'donation_offer',
                    data: {
                        donorName: donationForm.donorName,
                        district: donationForm.district,
                        itemsOffered: donationForm.itemsOffered || Object.keys(donationForm.items).length + " items selected",
                        contactNumber: donationForm.contactNumber,
                        paymentSlip: donationForm.paymentSlip
                    }
                })
            }).catch(err => console.error('Failed to notify admin:', err));

            toast.success("Donation offer submitted successfully! We will contact you soon.");
            setShowDonationForm(false);
            setDonationForm({
                donorName: "",
                contactNumber: "",
                email: "",
                itemsOffered: "",
                items: {},
                district: "",
                message: "",
                paymentSlip: ""
            });
        } catch (error) {
            console.error("Error submitting donation:", error);
            toast.error("Failed to submit donation offer. Please try again.");
        } finally {
            setSubmittingDonation(false);
        }
    };

    const handleRequestSubmit = async (e) => {
        e.preventDefault();

        if (!requestForm.schoolName || !requestForm.district || !requestForm.contactPerson || !requestForm.contactNumber) {
            toast.error("Please fill in all required fields");
            return;
        }

        // Convert items object to array format for storage
        const selectedItems = Object.entries(requestForm.items)
            .filter(([itemId, quantity]) => quantity && parseInt(quantity) > 0)
            .map(([itemId, quantity]) => {
                const item = predefinedItems.find(i => i.id === itemId);
                return {
                    id: itemId,
                    name: item.name,
                    quantity: parseInt(quantity)
                };
            });

        if (selectedItems.length === 0) {
            toast.error("Please select at least one item with quantity");
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
                items: selectedItems,
                requestToken: token,
                status: "pending",
                createdAt: new Date(),
                updatedAt: new Date()
            });

            setGeneratedToken(token);

            // Update Google Sheet
            fetch('/api/relief/update-sheet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'request',
                    data: {
                        schoolName: requestForm.schoolName,
                        district: requestForm.district,
                        address: requestForm.address,
                        contactPerson: requestForm.contactPerson,
                        contactNumber: requestForm.contactNumber,
                        email: requestForm.email,
                        items: selectedItems,
                        requestToken: token,
                        description: requestForm.description,
                        status: 'pending'
                    }
                })
            }).catch(err => console.error('Failed to update sheet:', err));

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
                                items: selectedItems,
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
                items: {} // Reset to empty object
            });

            // Refresh requests list - Automatic via onSnapshot
        } catch (error) {
            console.error("Error submitting request:", error);
            toast.error("Failed to submit request. Please try again.");
        } finally {
            setSubmittingRequest(false);
        }
    };

    const copyToken = () => {
        navigator.clipboard.writeText(generatedToken);
        toast.success("Token copied to clipboard!");
    };

    const handleTrackRequest = async (e) => {
        e.preventDefault();

        if (!trackToken.trim()) {
            toast.error("Please enter your tracking token");
            return;
        }

        setTrackingRequest(true);
        try {
            const q = query(collection(db, "materialRequests"), where("requestToken", "==", trackToken.trim()));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                toast.error("No request found with this token.");
            } else {
                // Redirect to manage-relief page with token
                window.location.href = `/manage-relief?token=${trackToken.trim()}`;
            }
        } catch (error) {
            console.error("Error tracking request:", error);
            toast.error("Failed to track request. Please try again.");
        } finally {
            setTrackingRequest(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-blue-600/10 to-transparent pointer-events-none" />
            <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-40 -left-20 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            <Navbar currentPage="relief" />

            <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">

                {/* Hero Section */}
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                    className="mb-16 text-center max-w-4xl mx-auto"
                >
                    <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-bold mb-6 border border-blue-200">
                        <ShieldCheck size={16} />
                        <span>Flood Relief Initiative 2025</span>
                    </motion.div>

                    <motion.h1 variants={itemVariants} className="font-playfair text-6xl md:text-8xl font-black text-gray-900 mb-2 leading-tight tracking-tight uppercase">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-700 to-red-600">EMBRACE</span>
                    </motion.h1>

                    <motion.p variants={itemVariants} className="font-poppins text-xl md:text-2xl font-bold text-gray-800 mb-10 uppercase tracking-wide">
                        Hold the future with your heart
                    </motion.p>

                    {/* Action Buttons */}
                    <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <motion.button
                            variants={buttonVariants}
                            initial="rest"
                            whileHover="hover"
                            whileTap="tap"
                            onClick={() => setShowRequestForm(true)}
                            className="group relative px-8 py-4 bg-gray-900 text-white rounded-2xl font-bold font-poppins text-lg overflow-hidden shadow-xl shadow-gray-900/20 active:scale-95 transition-all w-full sm:w-auto"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative flex items-center justify-center gap-3">
                                <Plus size={20} />
                                Request Help
                            </div>
                        </motion.button>

                        <motion.button
                            variants={buttonVariants}
                            initial="rest"
                            whileHover="hover"
                            whileTap="tap"
                            onClick={() => setShowDonationForm(true)}
                            className="group px-8 py-4 bg-white text-gray-900 border border-gray-200 rounded-2xl font-bold font-poppins text-lg shadow-lg hover:shadow-xl hover:border-pink-200 active:scale-95 transition-all w-full sm:w-auto flex items-center justify-center gap-3"
                        >
                            <Heart size={20} className="text-pink-600 group-hover:scale-110 transition-transform" />
                            Offer Donation
                        </motion.button>

                        <motion.button
                            variants={buttonVariants}
                            initial="rest"
                            whileHover="hover"
                            whileTap="tap"
                            onClick={() => setShowTrackModal(true)}
                            className="px-8 py-4 bg-transparent text-gray-600 font-bold font-poppins text-base hover:text-blue-600 hover:bg-white/50 rounded-2xl transition-all w-full sm:w-auto flex items-center justify-center gap-2"
                        >
                            <FileSearch size={18} />
                            Track Request
                        </motion.button>
                    </motion.div>
                </motion.div>

                {/* EMBRACE Campaign Section */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="mb-20"
                >
                    <div className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-[2.5rem] p-8 md:p-12 shadow-xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-red-600/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                        <div className="text-center mb-12 relative z-10">
                            <motion.p variants={itemVariants} className="font-serif italic text-2xl text-gray-600 mb-8">
                                "If you are ready to DONATE then we are ready to RECEIVE"
                            </motion.p>
                            <motion.div variants={itemVariants} className="inline-block bg-gray-900 text-white px-8 py-3 rounded-full font-bold font-poppins text-lg uppercase shadow-lg">
                                Drop off your DONATIONS to the below LOCATIONS
                            </motion.div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                            {/* Location 1 */}
                            <motion.div variants={itemVariants} className="bg-white/80 p-6 rounded-2xl border-l-4 border-red-600 shadow-sm hover:shadow-md transition-all">
                                <h3 className="font-bold font-poppins text-lg text-gray-900 mb-1">Sabaragamuwa University of Sri Lanka</h3>
                                <p className="text-sm font-bold text-red-600 mb-2">Sweet Magic Cake Shop</p>
                                <p className="text-gray-600 text-sm mb-3">100m downwards from the main gate, SUSL</p>
                                <div className="space-y-1 text-sm font-medium text-gray-700">
                                    <div className="flex items-center gap-2">
                                        <Phone size={14} className="text-red-500" />
                                        <span>074 096 7846 | 071 111 9658 (Chamodya)</span>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Location 2 */}
                            <motion.div variants={itemVariants} className="bg-white/80 p-6 rounded-2xl border-l-4 border-red-600 shadow-sm hover:shadow-md transition-all">
                                <h3 className="font-bold font-poppins text-lg text-gray-900 mb-1">Saegis Campus</h3>
                                <p className="text-gray-600 text-sm mb-3">135 S.De S. Jayasinghe Mawatha, Nugegoda</p>
                                <div className="space-y-1 text-sm font-medium text-gray-700">
                                    <div className="flex items-center gap-2">
                                        <Phone size={14} className="text-red-500" />
                                        <span>075 958 1531 (Megana)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Phone size={14} className="text-red-500" />
                                        <span>076 708 0996 (Kavith)</span>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Location 3 */}
                            <motion.div variants={itemVariants} className="bg-white/80 p-6 rounded-2xl border-l-4 border-red-600 shadow-sm hover:shadow-md transition-all">
                                <h3 className="font-bold font-poppins text-lg text-gray-900 mb-1">New Batti Express Online Gift Shop</h3>
                                <p className="text-gray-600 text-sm mb-3">No. 149, New Kalmunai Road, Kallady, Batticaloa</p>
                                <div className="space-y-1 text-sm font-medium text-gray-700">
                                    <div className="flex items-center gap-2">
                                        <Phone size={14} className="text-red-500" />
                                        <span>075 999 5051 (David Shyam)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Phone size={14} className="text-red-500" />
                                        <span>077 177 9915 (Aishwariya Rudura)</span>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Location 4 */}
                            <motion.div variants={itemVariants} className="bg-white/80 p-6 rounded-2xl border-l-4 border-red-600 shadow-sm hover:shadow-md transition-all">
                                <h3 className="font-bold font-poppins text-lg text-gray-900 mb-1">NIBM Kandy</h3>
                                <p className="text-gray-600 text-sm mb-3">No. 2, Asgiri Vihara Mawatha, Kandy</p>
                                <div className="space-y-1 text-sm font-medium text-gray-700">
                                    <div className="flex items-center gap-2">
                                        <Phone size={14} className="text-red-500" />
                                        <span>076 743 2486 (Rtr. Nusna)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Phone size={14} className="text-red-500" />
                                        <span>071 978 7517 (Rtr. Kalhara)</span>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Location 5 */}
                            <motion.div variants={itemVariants} className="bg-white/80 p-6 rounded-2xl border-l-4 border-red-600 shadow-sm hover:shadow-md transition-all">
                                <h3 className="font-bold font-poppins text-lg text-gray-900 mb-1">Mannar Island</h3>
                                <p className="text-gray-600 text-sm mb-3">Hotel Ahash, Eluthoor, Mannar</p>
                                <div className="space-y-1 text-sm font-medium text-gray-700">
                                    <div className="flex items-center gap-2">
                                        <Phone size={14} className="text-red-500" />
                                        <span>076 311 9670 (Rtr. Thayavu Goerge)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Phone size={14} className="text-red-500" />
                                        <span>074 293 0304 (Rtr. Jayanisha Thinakaran)</span>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                            <p className="font-poppins text-sm text-gray-600 mb-2">
                                A joint initiative by Rotaract Clubs of Batticaloa, CfPS Law School, Chunnakam, Colombo Heritage, Colombo North, Kandy Hill Capital, Kandy Metropolitan, Mannar Town, Moratuwa, NIBM Kandy, Ratmalana, Saegis Campus, Sabaragamuwa University, University of Colombo School of Computing, Wayamba University of Sri Lanka, Wellawatte
                            </p>
                            <p className="font-bold text-xs text-gray-500 uppercase tracking-widest mt-4">
                                For More Details
                            </p>
                            <div className="flex flex-wrap justify-center gap-4 mt-2 text-sm font-bold text-gray-800">
                                <span>078 2479942 - President (Rtr. Krishan Basnayaka)</span>
                                <span className="hidden md:inline text-gray-300">|</span>
                                <span>070 2524820 - Community Service Director (Rtr. Udara Subasinghe)</span>
                                <span className="hidden md:inline text-gray-300">|</span>
                                <span>071 7771822 - Project Chair (Rtr. Dulyani Jayathilaka)</span>
                            </div>
                        </div>

                    </div>
                </motion.div>

                {/* Stats Cards */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
                >
                    <motion.div variants={itemVariants} className="bg-white/80 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <AlertCircle size={80} className="text-yellow-500" />
                        </div>
                        <p className="font-poppins text-sm text-gray-500 mb-1 font-semibold uppercase tracking-wider">Pending Requests</p>
                        <p className="font-playfair text-5xl font-bold text-gray-900">{counts.pending}</p>
                        <div className="w-full bg-gray-100 h-1 mt-4 rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-400 w-1/3" />
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="bg-white/80 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <User size={80} className="text-blue-600" />
                        </div>
                        <p className="font-poppins text-sm text-gray-500 mb-1 font-semibold uppercase tracking-wider">Assigned</p>
                        <p className="font-playfair text-5xl font-bold text-gray-900">{counts.assigned}</p>
                        <div className="w-full bg-gray-100 h-1 mt-4 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600 w-1/2" />
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="bg-white/80 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <CheckCircle size={80} className="text-green-500" />
                        </div>
                        <p className="font-poppins text-sm text-gray-500 mb-1 font-semibold uppercase tracking-wider">Fulfilled</p>
                        <p className="font-playfair text-5xl font-bold text-gray-900">{counts.fulfilled}</p>
                        <div className="w-full bg-gray-100 h-1 mt-4 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 w-3/4" />
                        </div>
                    </motion.div>
                </motion.div>

                {/* Filters */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-3xl shadow-xl p-8 mb-12"
                >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h2 className="font-playfair text-3xl font-bold text-gray-900">
                                Browse Requests
                            </h2>
                            <p className="text-gray-500 font-poppins mt-1">Find a school to support in your area</p>
                        </div>
                        <button
                            onClick={clearFilters}
                            className="text-sm font-bold text-pink-600 hover:text-pink-700 font-poppins uppercase tracking-wide flex items-center gap-1"
                        >
                            <X size={16} /> Clear Filters
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                            <input
                                type="text"
                                value={searchSchool}
                                onChange={(e) => setSearchSchool(e.target.value)}
                                placeholder="Search by school..."
                                className="w-full pl-12 pr-4 py-4 bg-white/50 border-2 border-transparent focus:border-blue-500/20 focus:bg-white rounded-xl outline-none font-poppins transition-all shadow-sm hover:shadow-md focus:shadow-lg text-gray-800 placeholder:text-gray-400"
                            />
                        </div>

                        <div className="relative group">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-600 transition-colors" size={20} />
                            <select
                                value={filterDistrict}
                                onChange={(e) => setFilterDistrict(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-white/50 border-2 border-transparent focus:border-purple-500/20 focus:bg-white rounded-xl outline-none font-poppins transition-all shadow-sm hover:shadow-md focus:shadow-lg text-gray-800 appearance-none cursor-pointer"
                            >
                                <option value="">All Districts</option>
                                {districts.map(district => (
                                    <option key={district} value={district}>{district}</option>
                                ))}
                            </select>
                        </div>

                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-600 transition-colors">
                                <div className="w-5 h-5 rounded-full border-2 border-current border-dahsed" />
                            </div>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-white/50 border-2 border-transparent focus:border-green-500/20 focus:bg-white rounded-xl outline-none font-poppins transition-all shadow-sm hover:shadow-md focus:shadow-lg text-gray-800 appearance-none cursor-pointer"
                            >
                                <option value="">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="assigned">Assigned</option>
                                <option value="fulfilled">Fulfilled</option>
                            </select>
                        </div>
                    </div>
                </motion.div>

                {/* Requests List */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32">
                        <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
                        <p className="font-poppins text-gray-500 animate-pulse">Loading requests...</p>
                    </div>
                ) : filteredRequests.length === 0 ? (
                    <div className="bg-white/50 backdrop-blur-sm rounded-3xl p-16 text-center border-2 border-dashed border-gray-300">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Search className="text-gray-400" size={32} />
                        </div>
                        <h3 className="font-playfair text-2xl font-bold text-gray-800 mb-2">No Requests Found</h3>
                        <p className="font-poppins text-gray-500 text-lg max-w-md mx-auto">
                            We couldn&apos;t find any requests matching your criteria. Try adjusting your filters.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-16">
                        {['pending', 'assigned', 'fulfilled'].map(status => {
                            const statusRequests = filteredRequests.filter(r => r.status === status);
                            if (statusRequests.length === 0) return null;

                            return (
                                <div key={status} className="relative">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className={`h-12 w-1 rounded-full ${status === 'pending' ? 'bg-yellow-400' :
                                            status === 'assigned' ? 'bg-blue-600' :
                                                'bg-green-500'
                                            }`} />
                                        <h3 className="font-playfair text-3xl font-bold text-gray-900 capitalize">
                                            {status} Requests
                                        </h3>
                                        <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-500 font-poppins">
                                            {statusRequests.length}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <AnimatePresence>
                                            {statusRequests.map((request, index) => (
                                                <motion.div
                                                    layout
                                                    key={request.id}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    whileInView={{ opacity: 1, y: 0 }}
                                                    viewport={{ once: true }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-100 group flex flex-col"
                                                >
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                                                            status === 'assigned' ? 'bg-blue-100 text-blue-600' :
                                                                'bg-green-100 text-green-600'
                                                            }`}>
                                                            <Package size={24} />
                                                        </div>
                                                        <span className={`px-4 py-1.5 rounded-full font-poppins font-bold text-xs uppercase tracking-wide border ${status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                            status === 'assigned' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                                'bg-green-50 text-green-700 border-green-200'
                                                            }`}>
                                                            {request.status}
                                                        </span>
                                                    </div>

                                                    <h3 className="font-poppins font-bold text-xl text-gray-900 mb-3 leading-tight line-clamp-2 min-h-[3.5rem] group-hover:text-blue-600 transition-colors">
                                                        {request.schoolName}
                                                    </h3>

                                                    <div className="space-y-2 mb-6 text-sm text-gray-500 font-poppins">
                                                        <div className="flex items-center gap-2">
                                                            <MapPin size={16} className="text-gray-400" />
                                                            {request.district}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Calendar size={16} className="text-gray-400" />
                                                            {request.createdAt?.toDate?.()?.toLocaleDateString()}
                                                        </div>
                                                    </div>

                                                    <div className="bg-gray-50 rounded-2xl p-4 mb-6 flex-grow">
                                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Needed Materials</p>
                                                        <div className="space-y-2">
                                                            {request.items?.slice(0, 3).map((item, idx) => (
                                                                <div key={idx} className="flex justify-between items-center text-sm font-poppins">
                                                                    <span className="text-gray-700 font-medium truncate pr-2">{item.name}</span>
                                                                    <span className="bg-white px-2 py-0.5 rounded-md border border-gray-200 text-gray-900 font-bold shadow-sm">
                                                                        {item.quantity}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                            {request.items?.length > 3 && (
                                                                <p className="text-xs text-center text-blue-600 font-medium py-1">
                                                                    +{request.items.length - 3} more items
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => setSelectedRequest(request)}
                                                        className="w-full py-4 rounded-xl font-poppins font-bold text-sm bg-gray-900 text-white group-hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        View Details <ArrowRight size={16} />
                                                    </button>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Item Statistics Dashboard */}
                {itemStats.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mt-24 bg-gradient-to-br from-gray-900 to-gray-800 rounded-[2.5rem] p-8 md:p-12 shadow-2xl overflow-hidden relative"
                    >
                        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                        <div className="relative z-10 mb-10">
                            <h2 className="font-playfair text-3xl md:text-4xl font-bold text-white mb-4">
                                📊 Impact Overview
                            </h2>
                            <p className="font-poppins text-gray-400 text-lg max-w-2xl">
                                Live tracking of materials requested vs. delivered across all affected schools.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {itemStats.map((stat, idx) => {
                                const fulfillmentRate = stat.totalRequested > 0
                                    ? (stat.totalFulfilled / stat.totalRequested * 100).toFixed(0)
                                    : 0;

                                return (
                                    <div key={stat.name} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors group">
                                        <div className="flex items-center gap-4 mb-4">
                                            <span className="text-4xl bg-white/10 w-14 h-14 rounded-2xl flex items-center justify-center">{stat.icon}</span>
                                            <div>
                                                <h3 className="font-poppins font-bold text-white text-lg">{stat.name}</h3>
                                                <p className="font-poppins text-sm text-gray-400">
                                                    {stat.totalFulfilled} / {stat.totalRequested} delivered
                                                </p>
                                            </div>
                                        </div>

                                        <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                whileInView={{ width: `${Math.min(fulfillmentRate, 100)}%` }}
                                                transition={{ duration: 1, delay: idx * 0.05 }}
                                                className={`absolute top-0 left-0 h-full rounded-full ${fulfillmentRate >= 100 ? 'bg-green-500' : 'bg-blue-500'
                                                    }`}
                                            />
                                        </div>
                                        <div className="flex justify-end mt-2">
                                            <span className={`text-xs font-bold font-poppins ${fulfillmentRate >= 100 ? 'text-green-400' : 'text-blue-400'
                                                }`}>
                                                {fulfillmentRate}% Success
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Request Detail Modal */}
            <AnimatePresence>
                {selectedRequest && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedRequest(null)}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-[2rem] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col relative border border-white/20"
                        >
                            <div className="p-6 border-b border-gray-100 bg-gray-50/50 backdrop-blur-xl flex justify-between items-start sticky top-0 z-10">
                                <div>
                                    <h2 className="font-playfair text-2xl font-bold text-gray-900 leading-snug">
                                        {selectedRequest.schoolName}
                                    </h2>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className={`px-3 py-1 rounded-full font-poppins font-bold text-xs uppercase tracking-wide border ${selectedRequest.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                            selectedRequest.status === 'assigned' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                'bg-green-50 text-green-700 border-green-200'
                                            }`}>
                                            {selectedRequest.status}
                                        </span>
                                        <span className="text-gray-400 text-sm font-poppins">•</span>
                                        <span className="text-gray-500 text-sm font-poppins flex items-center gap-1">
                                            <Calendar size={14} />
                                            {selectedRequest.createdAt?.toDate?.()?.toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedRequest(null)}
                                    className="p-2 rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto space-y-8 custom-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-gray-50 rounded-2xl p-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                                <MapPin size={16} />
                                            </div>
                                            <p className="font-poppins font-bold text-gray-900">Location</p>
                                        </div>
                                        <p className="font-poppins text-gray-600 text-sm pl-11">{selectedRequest.district}</p>
                                        {selectedRequest.address && <p className="font-poppins text-gray-500 text-xs pl-11 mt-1">{selectedRequest.address}</p>}
                                    </div>

                                    {selectedRequest.contactPerson && (
                                        <div className="bg-gray-50 rounded-2xl p-4">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                                                    <User size={16} />
                                                </div>
                                                <p className="font-poppins font-bold text-gray-900">Contact</p>
                                            </div>
                                            <p className="font-poppins text-gray-600 text-sm pl-11">{selectedRequest.contactPerson}</p>
                                        </div>
                                    )}
                                </div>

                                {selectedRequest.description && (
                                    <div>
                                        <h3 className="font-poppins font-bold text-gray-900 mb-3 text-sm uppercase tracking-wider">Situation Description</h3>
                                        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                                            <p className="font-poppins text-gray-600 leading-relaxed">
                                                {selectedRequest.description}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <h3 className="font-poppins font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider flex items-center justify-between">
                                        <span>Materials Requested</span>
                                        <span className="text-xs normal-case font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{selectedRequest.items?.length || 0} items</span>
                                    </h3>
                                    <div className="grid grid-cols-1 gap-3">
                                        {selectedRequest.items?.map((item, index) => (
                                            <div key={index} className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-pink-500" />
                                                    <span className="font-poppins text-gray-900 font-medium">{item.name}</span>
                                                </div>
                                                <span className="font-poppins font-bold text-pink-600 bg-pink-50 px-3 py-1 rounded-lg">
                                                    {item.quantity}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 flex gap-4 items-start">
                                    <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                                    <p className="font-poppins text-sm text-blue-800 leading-relaxed">
                                        To help fulfill this request, please contact the school directly using the contact number provided, or offer a donation through our platform to let us coordinate the delivery.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Donation Form Modal */}
            <AnimatePresence>
                {showDonationForm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
                        onClick={() => setShowDonationForm(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 30 }}
                            className="bg-white rounded-[2rem] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="bg-gradient-to-r from-pink-600 to-rose-500 p-8 text-white relative flex-shrink-0">
                                <button
                                    onClick={() => setShowDonationForm(false)}
                                    className="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all"
                                >
                                    <X size={20} />
                                </button>
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                                        <Heart size={32} className="text-white" />
                                    </div>
                                    <div>
                                        <h2 className="font-playfair text-2xl md:text-3xl font-bold">Offer a Donation</h2>
                                        <p className="text-pink-100 font-poppins text-sm opacity-90">Your generosity changes lives.</p>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleDonationSubmit} className="p-8 overflow-y-auto space-y-6 custom-scrollbar">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2 font-poppins">Your Name <span className="text-pink-500">*</span></label>
                                            <div className="relative">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                <input
                                                    type="text"
                                                    value={donationForm.donorName}
                                                    onChange={(e) => setDonationForm({ ...donationForm, donorName: e.target.value })}
                                                    placeholder="John Doe"
                                                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition font-poppins"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2 font-poppins">Contact Number <span className="text-pink-500">*</span></label>
                                            <div className="relative">
                                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                <input
                                                    type="tel"
                                                    value={donationForm.contactNumber}
                                                    onChange={(e) => setDonationForm({ ...donationForm, contactNumber: e.target.value })}
                                                    placeholder="07X XXX XXXX"
                                                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition font-poppins"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2 font-poppins">Email (Optional)</label>
                                            <div className="relative">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                <input
                                                    type="email"
                                                    value={donationForm.email}
                                                    onChange={(e) => setDonationForm({ ...donationForm, email: e.target.value })}
                                                    placeholder="john@example.com"
                                                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition font-poppins"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2 font-poppins">District</label>
                                            <div className="relative">
                                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                <select
                                                    value={donationForm.district}
                                                    onChange={(e) => setDonationForm({ ...donationForm, district: e.target.value })}
                                                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition font-poppins appearance-none"
                                                >
                                                    <option value="">Select Local District</option>
                                                    {districts.map(district => (
                                                        <option key={district} value={district}>{district}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-gray-100 pt-6">
                                    <label className="block text-sm font-bold text-gray-800 mb-4 font-poppins uppercase tracking-wide">
                                        Select Items to Donate
                                    </label>

                                    {itemsLoading ? (
                                        <div className="py-8 text-center text-gray-400">
                                            <Loader2 className="animate-spin mb-2 mx-auto" />
                                            <span className="text-xs">Loading items...</span>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                                            {predefinedItems.map(item => (
                                                <div
                                                    key={item.id}
                                                    className={`relative flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${donationForm.items[item.id] ? 'border-pink-500 bg-pink-50/50' : 'border-gray-100 hover:border-pink-200 bg-white'
                                                        }`}
                                                >
                                                    <div className="text-2xl">{ITEM_ICONS[item.id] || ITEM_ICONS[item.name.toLowerCase().replace(/\s+/g, '')] || item.icon}</div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-gray-800 text-sm truncate">{item.name}</p>
                                                        <p className="text-xs text-gray-500">{item.category}</p>
                                                    </div>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={donationForm.items[item.id] || ""}
                                                        onChange={(e) => {
                                                            const newItems = { ...donationForm.items };
                                                            if (e.target.value && parseInt(e.target.value) > 0) {
                                                                newItems[item.id] = e.target.value;
                                                            } else {
                                                                delete newItems[item.id];
                                                            }
                                                            setDonationForm({ ...donationForm, items: newItems });
                                                        }}
                                                        placeholder="0"
                                                        className="w-16 px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-center font-bold text-gray-900 focus:ring-2 focus:ring-pink-500 outline-none"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <textarea
                                        value={donationForm.itemsOffered}
                                        onChange={(e) => setDonationForm({ ...donationForm, itemsOffered: e.target.value })}
                                        placeholder="Or describe other items you'd like to donate (e.g. '50 School Bags, 20 Water Bottles')..."
                                        rows={3}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none transition font-poppins mb-4"
                                    />

                                    <textarea
                                        value={donationForm.message}
                                        onChange={(e) => setDonationForm({ ...donationForm, message: e.target.value })}
                                        placeholder="Any additional message or notes..."
                                        rows={2}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none transition font-poppins"
                                    />
                                </div>

                                {bankDetails && (
                                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-5 text-white">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="bg-white/10 p-2 rounded-lg">
                                                <CreditCard size={20} className="text-white" />
                                            </div>
                                            <h3 className="font-playfair font-bold text-lg">Bank Transfer Details</h3>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-poppins opacity-90">
                                            <div>
                                                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Bank</p>
                                                <p className="font-semibold">{bankDetails.bankName}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Account No</p>
                                                <p className="font-mono text-lg">{bankDetails.accountNumber}</p>
                                            </div>
                                            <div className="sm:col-span-2">
                                                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Account Name</p>
                                                <p className="font-semibold">{bankDetails.accountHolder}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 font-poppins">Upload Payment Slip (Optional)</label>
                                    <div className={`border-2 border-dashed rounded-xl p-6 transition-colors text-center ${donationForm.paymentSlip ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-pink-400 bg-gray-50 hover:bg-white'
                                        }`}>
                                        <input
                                            type="file"
                                            id="slip-upload"
                                            accept="image/*,application/pdf"
                                            onChange={handleUploadSlip}
                                            className="hidden"
                                        />
                                        <label htmlFor="slip-upload" className="cursor-pointer block">
                                            {uploadingSlip ? (
                                                <div className="flex flex-col items-center">
                                                    <Loader2 className="animate-spin text-pink-600 mb-2" />
                                                    <span className="text-sm font-medium text-gray-500">Uploading...</span>
                                                </div>
                                            ) : donationForm.paymentSlip ? (
                                                <div className="flex flex-col items-center">
                                                    <CheckCircle className="text-green-500 mb-2" size={32} />
                                                    <span className="text-sm font-bold text-green-700">Slip Attached Successfully</span>
                                                    <span className="text-xs text-green-600 mt-1">Click to change</span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center">
                                                    <UploadCloud className="text-gray-400 mb-2" size={32} />
                                                    <span className="text-sm font-bold text-gray-600">Click to upload slip</span>
                                                    <span className="text-xs text-gray-400 mt-1">JPG, PNG or PDF</span>
                                                </div>
                                            )}
                                        </label>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <motion.button
                                        type="button"
                                        variants={buttonVariants}
                                        whileHover="hover"
                                        whileTap="tap"
                                        onClick={() => setShowDonationForm(false)}
                                        className="flex-1 px-6 py-4 rounded-xl font-poppins font-bold text-gray-500 hover:bg-gray-100 transition"
                                        disabled={submittingDonation}
                                    >
                                        Cancel
                                    </motion.button>
                                    <motion.button
                                        type="submit"
                                        variants={buttonVariants}
                                        whileHover="hover"
                                        whileTap="tap"
                                        className="flex-[2] bg-gradient-to-r from-pink-600 to-rose-600 text-white px-6 py-4 rounded-xl font-poppins font-bold hover:shadow-lg hover:-translate-y-1 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        disabled={submittingDonation}
                                    >
                                        {submittingDonation ? (
                                            <>
                                                <Loader2 className="animate-spin" size={20} />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <Heart size={20} className="fill-white/20" />
                                                Confirm Donation
                                            </>
                                        )}
                                    </motion.button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Request Donation Form Modal */}
            <AnimatePresence>
                {showRequestForm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
                        onClick={() => !generatedToken && setShowRequestForm(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 30 }}
                            className="bg-white rounded-[2rem] shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white relative flex-shrink-0">
                                <button
                                    onClick={() => {
                                        setShowRequestForm(false);
                                        setGeneratedToken("");
                                        setEmailSent(false);
                                    }}
                                    className="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all"
                                >
                                    <X size={20} />
                                </button>
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                                        {generatedToken ? <CheckCircle size={32} className="text-white" /> : <Package size={32} className="text-white" />}
                                    </div>
                                    <div>
                                        <h2 className="font-playfair text-2xl md:text-3xl font-bold">
                                            {generatedToken ? "Request Submitted!" : "Request Assistance"}
                                        </h2>
                                        <p className="text-blue-100 font-poppins text-sm opacity-90">
                                            {generatedToken ? "Your needs have been recorded." : "Tell us what your school needs."}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 overflow-y-auto custom-scrollbar flex-grow">
                                {generatedToken ? (
                                    <div className="flex flex-col items-center justify-center text-center space-y-6 py-6">
                                        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center relative">
                                            <div className="absolute inset-0 bg-green-400/20 rounded-full animate-ping" />
                                            <CheckCircle size={48} className="text-green-600 relative z-10" />
                                        </div>

                                        <div className="max-w-lg">
                                            <h3 className="font-playfair text-2xl font-bold text-gray-900 mb-2">Submission Successful</h3>
                                            <p className="font-poppins text-gray-500">
                                                Your material request has been logged in our system. We will connect you with donors as soon as possible.
                                            </p>
                                        </div>

                                        <div className="w-full max-w-md bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-6">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Your Tracking Token</p>
                                            <div className="flex items-center justify-center gap-3 mb-4">
                                                <code className="bg-white px-4 py-2 rounded-lg border border-gray-200 font-mono text-2xl font-bold text-blue-600 shadow-sm">
                                                    {generatedToken}
                                                </code>
                                            </div>
                                            <button
                                                onClick={copyToken}
                                                className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center justify-center gap-2 mx-auto"
                                            >
                                                <Copy size={16} /> Copy to Clipboard
                                            </button>
                                        </div>

                                        {emailSent && (
                                            <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-full text-sm font-semibold">
                                                <Mail size={16} /> Confirmation email sent
                                            </div>
                                        )}

                                        <div className="flex gap-4 w-full max-w-md mt-4">
                                            <a
                                                href="/manage-relief"
                                                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-xl font-poppins font-bold hover:bg-blue-700 transition text-center shadow-lg shadow-blue-200"
                                            >
                                                Track Now
                                            </a>
                                            <motion.button
                                                variants={buttonVariants}
                                                initial="rest"
                                                whileHover="hover"
                                                whileTap="tap"
                                                onClick={() => {
                                                    setShowRequestForm(false);
                                                    setGeneratedToken("");
                                                    setEmailSent(false);
                                                }}
                                                className="flex-1 bg-gray-100 text-gray-600 px-6 py-3 rounded-xl font-poppins font-bold hover:bg-gray-200 transition"
                                            >
                                                Close
                                            </motion.button>
                                        </div>
                                    </div>
                                ) : (
                                    <form onSubmit={handleRequestSubmit} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2 font-poppins">School Name <span className="text-red-500">*</span></label>
                                                <input
                                                    type="text"
                                                    value={requestForm.schoolName}
                                                    onChange={(e) => setRequestForm({ ...requestForm, schoolName: e.target.value })}
                                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition font-poppins"
                                                    required
                                                    placeholder="School Name"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2 font-poppins">District <span className="text-red-500">*</span></label>
                                                <select
                                                    value={requestForm.district}
                                                    onChange={(e) => setRequestForm({ ...requestForm, district: e.target.value })}
                                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition font-poppins"
                                                    required
                                                >
                                                    <option value="">Select District</option>
                                                    {districts.map(district => (
                                                        <option key={district} value={district}>{district}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2 font-poppins">Contact Person <span className="text-red-500">*</span></label>
                                                <input
                                                    type="text"
                                                    value={requestForm.contactPerson}
                                                    onChange={(e) => setRequestForm({ ...requestForm, contactPerson: e.target.value })}
                                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition font-poppins"
                                                    required
                                                    placeholder="Principal / Rep"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2 font-poppins">Phone Number <span className="text-red-500">*</span></label>
                                                <input
                                                    type="tel"
                                                    value={requestForm.contactNumber}
                                                    onChange={(e) => setRequestForm({ ...requestForm, contactNumber: e.target.value })}
                                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition font-poppins"
                                                    required
                                                    placeholder="07X XXX XXXX"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2 font-poppins">School Address <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                value={requestForm.address}
                                                onChange={(e) => setRequestForm({ ...requestForm, address: e.target.value })}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition font-poppins"
                                                required
                                                placeholder="Full Address"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2 font-poppins">Email (Optional)</label>
                                            <input
                                                type="email"
                                                value={requestForm.email}
                                                onChange={(e) => setRequestForm({ ...requestForm, email: e.target.value })}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition font-poppins"
                                                placeholder="To receive updates"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2 font-poppins">Description <span className="text-red-500">*</span></label>
                                            <textarea
                                                value={requestForm.description}
                                                onChange={(e) => setRequestForm({ ...requestForm, description: e.target.value })}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition font-poppins"
                                                required
                                                placeholder="Describe the situation and specific needs..."
                                                rows={3}
                                            />
                                        </div>

                                        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                            <h4 className="font-bold text-gray-900 mb-4 font-playfair text-lg">Required Materials</h4>

                                            {itemsLoading ? (
                                                <div className="text-center py-4">
                                                    <Loader2 className="animate-spin text-blue-600 mx-auto" />
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                    {predefinedItems.map(item => (
                                                        <div key={item.id} className={`p-3 rounded-xl border-2 transition-all ${requestForm.items[item.id] ? 'bg-blue-50 border-blue-500' : 'bg-white border-gray-100'
                                                            }`}>
                                                            <div className="flex flex-col items-center text-center">
                                                                <span className="text-2xl mb-1">{item.icon}</span>
                                                                <span className="text-xs font-bold text-gray-700 mb-2">{item.name}</span>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    placeholder="Qty"
                                                                    value={requestForm.items[item.id] || ""}
                                                                    onChange={(e) => {
                                                                        const newItems = { ...requestForm.items };
                                                                        if (e.target.value && parseInt(e.target.value) > 0) {
                                                                            newItems[item.id] = e.target.value;
                                                                        } else {
                                                                            delete newItems[item.id];
                                                                        }
                                                                        setRequestForm({ ...requestForm, items: newItems });
                                                                    }}
                                                                    className="w-full py-1 px-2 border border-gray-200 rounded-md text-center text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex gap-4 pt-4">
                                            <motion.button
                                                type="button"
                                                variants={buttonVariants}
                                                whileHover="hover"
                                                whileTap="tap"
                                                onClick={() => setShowRequestForm(false)}
                                                className="flex-1 px-6 py-4 rounded-xl font-poppins font-bold text-gray-500 hover:bg-gray-100 transition"
                                                disabled={submittingRequest}
                                            >
                                                Cancel
                                            </motion.button>
                                            <motion.button
                                                type="submit"
                                                variants={buttonVariants}
                                                whileHover="hover"
                                                whileTap="tap"
                                                className="flex-[2] bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-xl font-poppins font-bold hover:shadow-lg hover:-translate-y-1 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                disabled={submittingRequest}
                                            >
                                                {submittingRequest ? (
                                                    <>
                                                        <Loader2 className="animate-spin" size={20} />
                                                        Submitting...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Send size={20} className="fill-white/20" />
                                                        Submit Request
                                                    </>
                                                )}
                                            </motion.button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Track Request Modal */}
            <AnimatePresence>
                {showTrackModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
                        onClick={() => setShowTrackModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 30 }}
                            className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white relative">
                                <button
                                    onClick={() => setShowTrackModal(false)}
                                    className="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all"
                                >
                                    <X size={20} />
                                </button>
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                                        <FileSearch size={32} className="text-white" />
                                    </div>
                                    <div>
                                        <h2 className="font-playfair text-2xl font-bold">Track Request</h2>
                                        <p className="text-indigo-100 font-poppins text-sm opacity-90">Manage your application status</p>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleTrackRequest} className="p-8 space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 font-poppins">Tracking Token <span className="text-indigo-500">*</span></label>
                                    <div className="relative">
                                        <BadgeCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="text"
                                            value={trackToken}
                                            onChange={(e) => setTrackToken(e.target.value)}
                                            placeholder="REL-XXXXX-XXXXX"
                                            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition font-mono text-lg uppercase"
                                            required
                                        />
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2 font-poppins ml-1">
                                        Enter the token you received upon submission.
                                    </p>
                                </div>

                                <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 flex gap-3">
                                    <div className="bg-yellow-100 p-2 rounded-lg h-fit text-yellow-600">
                                        <Info size={18} />
                                    </div>
                                    <div className="text-xs text-yellow-800 font-poppins">
                                        <p className="font-bold mb-1">Lost your token?</p>
                                        <p>Check your email inbox or contact support with your school details for assistance.</p>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-2">
                                    <motion.button
                                        type="button"
                                        variants={buttonVariants}
                                        whileHover="hover"
                                        whileTap="tap"
                                        onClick={() => setShowTrackModal(false)}
                                        className="flex-1 px-6 py-4 rounded-xl font-poppins font-bold text-gray-500 hover:bg-gray-100 transition"
                                        disabled={trackingRequest}
                                    >
                                        Cancel
                                    </motion.button>
                                    <motion.button
                                        type="submit"
                                        variants={buttonVariants}
                                        whileHover="hover"
                                        whileTap="tap"
                                        className="flex-[2] bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 rounded-xl font-poppins font-bold hover:shadow-lg hover:-translate-y-1 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        disabled={trackingRequest}
                                    >
                                        {trackingRequest ? (
                                            <>
                                                <Loader2 className="animate-spin" size={20} />
                                                Searching...
                                            </>
                                        ) : (
                                            <>
                                                <ArrowRight size={20} className="fill-white/20" />
                                                Track Now
                                            </>
                                        )}
                                    </motion.button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <Footer />
        </div >
    );
}
