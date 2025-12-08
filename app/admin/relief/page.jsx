'use client'
import { useState, useEffect } from 'react'
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Search, Filter, Download, CheckCircle, Clock, UserCheck, Trash2, Eye, X, Heart, Phone, Mail, MapPin, Package, Settings, Plus, Edit2, Save, ExternalLink, ClipboardList, Shield, ChevronRight, ChevronLeft } from 'lucide-react'
import { useAuth } from '@/app/contexts/AuthContext'
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion'

export default function ReliefAdminPage() {
    const { isAdmin, isCommittee } = useAuth()
    const [activeTab, setActiveTab] = useState('requests')

    // Material Requests State
    const [requests, setRequests] = useState([])
    const [filteredRequests, setFilteredRequests] = useState([])
    const [requestsLoading, setRequestsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [requestStatusFilter, setRequestStatusFilter] = useState('all')
    const [requestDistrictFilter, setRequestDistrictFilter] = useState('all')
    const [selectedRequest, setSelectedRequest] = useState(null)
    const [showRequestModal, setShowRequestModal] = useState(false)

    // Donation Offers State
    const [offers, setOffers] = useState([])
    const [filteredOffers, setFilteredOffers] = useState([])
    const [offersLoading, setOffersLoading] = useState(true)
    const [offerStatusFilter, setOfferStatusFilter] = useState('all')
    const [offerDistrictFilter, setOfferDistrictFilter] = useState('all')
    const [selectedOffer, setSelectedOffer] = useState(null)
    const [showOfferModal, setShowOfferModal] = useState(false)
    const [selectedSlip, setSelectedSlip] = useState(null) // Lightbox state

    const [updating, setUpdating] = useState(false)

    // Relief Items State
    const [reliefItems, setReliefItems] = useState([])
    const [itemsLoading, setItemsLoading] = useState(true)
    const [editingItem, setEditingItem] = useState(null)
    const [showAddItemForm, setShowAddItemForm] = useState(false)
    const [newItem, setNewItem] = useState({
        id: '',
        name: '',
        nameSi: '',
        category: '',
        sortOrder: 0,
        globalFulfilled: 0
    })
    const [googleSheetUrl, setGoogleSheetUrl] = useState('')
    const [bankDetails, setBankDetails] = useState({
        accountHolder: '',
        accountNumber: '',
        bankName: '',
        branch: ''
    })
    const [savingConfig, setSavingConfig] = useState(false)

    const categories = ['Stationery', 'Books', 'Bags', 'Essentials', 'Clothing', 'Other']

    // Real-time Data Fetching
    useEffect(() => {
        fetchConfig()

        // Material Requests Listener
        setRequestsLoading(true)
        const qRequests = query(collection(db, 'materialRequests'), orderBy('createdAt', 'desc'))
        const unsubscribeRequests = onSnapshot(qRequests, (snapshot) => {
            const requestsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }))
            setRequests(requestsData)
            setRequestsLoading(false)
        }, (error) => {
            console.error('Error fetching requests:', error)
            setRequestsLoading(false)
        })

        // Donation Offers Listener
        setOffersLoading(true)
        const qOffers = query(collection(db, 'donationOffers'), orderBy('createdAt', 'desc'))
        const unsubscribeOffers = onSnapshot(qOffers, (snapshot) => {
            const offersData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }))
            setOffers(offersData)
            setOffersLoading(false)
        }, (error) => {
            console.error('Error fetching offers:', error)
            setOffersLoading(false)
        })

        // Relief Items Listener
        setItemsLoading(true)
        const qItems = query(collection(db, 'reliefItems'), orderBy('sortOrder', 'asc'))
        const unsubscribeItems = onSnapshot(qItems, (snapshot) => {
            const itemsData = snapshot.docs.map(doc => ({
                docId: doc.id,
                ...doc.data()
            }))
            setReliefItems(itemsData)
            setItemsLoading(false)
        }, (error) => {
            console.error('Error fetching relief items:', error)
            setItemsLoading(false)
        })

        return () => {
            unsubscribeRequests()
            unsubscribeOffers()
            unsubscribeItems()
        }
    }, [])

    // Fetch Config (Google Sheet URL & Bank Details)
    const fetchConfig = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'reliefConfig'))
            if (!querySnapshot.empty) {
                const config = querySnapshot.docs[0].data()
                setGoogleSheetUrl(config.googleSheetUrl || '')
                setBankDetails(config.bankDetails || {
                    accountHolder: '',
                    accountNumber: '',
                    bankName: '',
                    branch: ''
                })
            }
        } catch (error) {
            console.error('Error fetching config:', error)
        }
    }

    // Save Config
    const saveConfig = async () => {
        setSavingConfig(true)
        try {
            const querySnapshot = await getDocs(collection(db, 'reliefConfig'))
            const data = {
                googleSheetUrl: googleSheetUrl.trim(),
                bankDetails,
                updatedAt: new Date()
            }

            if (querySnapshot.empty) {
                await addDoc(collection(db, 'reliefConfig'), data)
            } else {
                const docId = querySnapshot.docs[0].id
                await updateDoc(doc(db, 'reliefConfig', docId), data)
            }
            toast.success('Settings saved successfully!')
        } catch (error) {
            console.error('Error saving config:', error)
            toast.error('Failed to save settings')
        } finally {
            setSavingConfig(false)
        }
    }

    // Add Relief Item
    const handleAddItem = async (e) => {
        e.preventDefault()

        if (!newItem.id || !newItem.name || !newItem.category) {
            toast.error('Please fill in all required fields')
            return
        }

        if (reliefItems.some(item => item.id === newItem.id)) {
            toast.error('Item ID already exists. Please use a unique ID.')
            return
        }

        try {
            await addDoc(collection(db, 'reliefItems'), {
                id: newItem.id,
                name: newItem.name,
                nameSi: newItem.nameSi || '',
                category: newItem.category,
                sortOrder: parseInt(newItem.sortOrder) || 0,
                globalFulfilled: parseInt(newItem.globalFulfilled) || 0,
                createdAt: new Date(),
                updatedAt: new Date()
            })

            setNewItem({ id: '', name: '', nameSi: '', category: '', sortOrder: 0, globalFulfilled: 0 })
            setShowAddItemForm(false)
            // fetchReliefItems() - handled by onSnapshot
            toast.success('Item added successfully!')
        } catch (error) {
            console.error('Error adding item:', error)
            toast.error('Failed to add item')
        }
    }

    // Update Relief Item
    const handleUpdateItem = async (docId) => {
        if (!editingItem.id || !editingItem.name || !editingItem.category) {
            toast.error('Please fill in all required fields')
            return
        }

        try {
            await updateDoc(doc(db, 'reliefItems', docId), {
                id: editingItem.id,
                name: editingItem.name,
                nameSi: editingItem.nameSi || '',
                category: editingItem.category,
                sortOrder: parseInt(editingItem.sortOrder) || 0,
                globalFulfilled: parseInt(editingItem.globalFulfilled) || 0,
                updatedAt: new Date()
            })

            setEditingItem(null)
            // fetchReliefItems() - handled by onSnapshot
            toast.success('Item updated successfully!')
        } catch (error) {
            console.error('Error updating item:', error)
            toast.error('Failed to update item')
        }
    }

    // Update only fulfilled count
    const handleUpdateFulfilled = async (docId, amount) => {
        try {
            await updateDoc(doc(db, 'reliefItems', docId), {
                globalFulfilled: parseInt(amount) || 0,
                updatedAt: new Date()
            })
            // Update local state
            setReliefItems(prev => prev.map(item =>
                item.docId === docId ? { ...item, globalFulfilled: parseInt(amount) || 0 } : item
            ))
        } catch (error) {
            console.error('Error updating fulfilled count:', error)
        }
    }

    // Delete Relief Item
    const handleDeleteItem = async (docId, itemName) => {
        if (!confirm(`Are you sure you want to delete "${itemName}"? This may affect existing requests.`)) {
            return
        }

        try {
            await deleteDoc(doc(db, 'reliefItems', docId))
            // fetchReliefItems() - handled by onSnapshot
            toast.success('Item deleted successfully!')
        } catch (error) {
            console.error('Error deleting item:', error)
            toast.error('Failed to delete item')
        }
    }

    // Get unique districts
    const requestDistricts = [...new Set(requests.map(r => r.district))].filter(Boolean).sort()
    const offerDistricts = [...new Set(offers.map(o => o.district))].filter(Boolean).sort()

    // Stats
    const requestStats = {
        total: requests.length,
        pending: requests.filter(r => r.status === 'pending').length,
        assigned: requests.filter(r => r.status === 'assigned').length,
        fulfilled: requests.filter(r => r.status === 'fulfilled').length
    }

    const offerStats = {
        total: offers.length,
        pending: offers.filter(o => o.status === 'pending').length,
        contacted: offers.filter(o => o.status === 'contacted').length,
        completed: offers.filter(o => o.status === 'completed').length
    }

    // Calculate item stats
    const getItemStats = () => {
        const stats = reliefItems.map(item => {
            const totalRequested = requests.reduce((sum, req) => {
                const reqItem = req.items?.find(ri =>
                    (ri.id === item.id) ||
                    (ri.name === item.name) ||
                    (ri.name?.toLowerCase().replace(/\s+/g, '') === item.id)
                );
                return sum + (parseInt(reqItem?.quantity) || 0);
            }, 0);

            return {
                ...item,
                totalRequested,
                progress: totalRequested > 0 ? ((item.globalFulfilled || 0) / totalRequested) * 100 : 0
            };
        });
        return stats.sort((a, b) => b.totalRequested - a.totalRequested);
    };

    const itemStats = getItemStats();

    // Apply filters for requests
    useEffect(() => {
        let filtered = requests

        if (searchTerm) {
            filtered = filtered.filter(req =>
                req.schoolName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                req.district?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                req.requestToken?.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        if (requestStatusFilter !== 'all') {
            filtered = filtered.filter(req => req.status === requestStatusFilter)
        }

        if (requestDistrictFilter !== 'all') {
            filtered = filtered.filter(req => req.district === requestDistrictFilter)
        }

        setFilteredRequests(filtered)
    }, [searchTerm, requestStatusFilter, requestDistrictFilter, requests])

    // Apply filters for offers
    useEffect(() => {
        let filtered = [...offers]

        if (offerStatusFilter !== 'all') {
            filtered = filtered.filter(offer => offer.status === offerStatusFilter)
        }

        if (offerDistrictFilter !== 'all') {
            filtered = filtered.filter(offer => offer.district === offerDistrictFilter)
        }

        setFilteredOffers(filtered)
    }, [offers, offerStatusFilter, offerDistrictFilter])

    // Update request status
    const handleUpdateRequestStatus = async (requestId, newStatus) => {
        setUpdating(true)
        try {
            const requestRef = doc(db, 'materialRequests', requestId)
            await updateDoc(requestRef, {
                status: newStatus,
                updatedAt: new Date()
            })

            setRequests(prev => prev.map(req => {
                if (req.id === requestId) {
                    const updatedReq = { ...req, status: newStatus, updatedAt: new Date() }

                    // Send update to Google Sheet (Append as new entry/log)
                    fetch('/api/relief/update-sheet', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            type: 'request',
                            data: {
                                ...updatedReq,
                                // Ensure date is formatted if it's a Firestore timestamp
                                createdAt: updatedReq.createdAt?.toDate ? updatedReq.createdAt.toDate() : new Date()
                            }
                        })
                    }).catch(err => console.error('Failed to update sheet:', err))

                    return updatedReq
                }
                return req
            }))

            if (selectedRequest?.id === requestId) {
                setSelectedRequest(prev => ({ ...prev, status: newStatus }))
            }

            toast.success('Status updated successfully!')
        } catch (error) {
            console.error('Error updating status:', error)
            toast.error('Failed to update status')
        } finally {
            setUpdating(false)
        }
    }

    // Update offer status
    const handleUpdateOfferStatus = async (offerId, newStatus) => {
        setUpdating(true)
        try {
            const offerRef = doc(db, 'donationOffers', offerId)
            await updateDoc(offerRef, {
                status: newStatus,
                updatedAt: new Date()
            })

            setOffers(prev => prev.map(offer => {
                if (offer.id === offerId) {
                    const updatedOffer = { ...offer, status: newStatus, updatedAt: new Date() }

                    // Send update to Google Sheet (Append as new entry/log)
                    fetch('/api/relief/update-sheet', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            type: 'donation',
                            data: {
                                ...updatedOffer,
                                createdAt: updatedOffer.createdAt?.toDate ? updatedOffer.createdAt.toDate() : new Date()
                            }
                        })
                    }).catch(err => console.error('Failed to update sheet:', err))

                    return updatedOffer
                }
                return offer
            }))

            if (selectedOffer?.id === offerId) {
                setSelectedOffer(prev => ({ ...prev, status: newStatus }))
            }

            toast.success('Status updated successfully!')
        } catch (error) {
            console.error('Error updating status:', error)
            toast.error('Failed to update status')
        } finally {
            setUpdating(false)
        }
    }

    // Delete request
    const handleDeleteRequest = async (requestId) => {
        if (!confirm('Are you sure you want to delete this request?')) {
            return
        }

        setUpdating(true)
        try {
            await deleteDoc(doc(db, 'materialRequests', requestId))
            setRequests(prev => prev.filter(req => req.id !== requestId))
            setShowRequestModal(false)
            toast.success('Request deleted successfully')
        } catch (error) {
            console.error('Error deleting request:', error)
            toast.error('Failed to delete request')
        } finally {
            setUpdating(false)
        }
    }

    // Delete offer
    const handleDeleteOffer = async (offerId) => {
        if (!confirm('Are you sure you want to delete this donation offer?')) {
            return
        }

        setUpdating(true)
        try {
            await deleteDoc(doc(db, 'donationOffers', offerId))
            setOffers(prev => prev.filter(offer => offer.id !== offerId))
            setShowOfferModal(false)
            toast.success('Donation offer deleted successfully')
        } catch (error) {
            console.error('Error deleting offer:', error)
            toast.error('Failed to delete offer')
        } finally {
            setUpdating(false)
        }
    }

    const getStatusBadge = (status) => {
        const styles = {
            pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
            assigned: 'bg-blue-100 text-blue-800 border-blue-300',
            contacted: 'bg-blue-100 text-blue-800 border-blue-300',
            fulfilled: 'bg-green-100 text-green-800 border-green-300',
            completed: 'bg-green-100 text-green-800 border-green-300'
        }
        return styles[status] || 'bg-gray-100 text-gray-800 border-gray-300'
    }


    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
        exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
    }

    const tabs = [
        { id: 'requests', label: 'Requests', icon: Package, count: requestStats.total },
        { id: 'donations', label: 'Donations', icon: Heart, count: offerStats.total },
        { id: 'fulfillment', label: 'Fulfillment', icon: ClipboardList },
        { id: 'items', label: 'Items', icon: Package },
        { id: 'settings', label: 'Settings', icon: Settings },
    ]

    return (
        <div className="min-h-screen bg-gray-50/50">
            {/* Top Navigation Bar */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm backdrop-blur-xl bg-white/90">
                <div className="max-w-7xl mx-auto px-4 md:px-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between py-4 gap-4">
                        <div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg text-white shadow-lg shadow-blue-500/20">
                                    <Shield size={24} />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight leading-none">Flood Relief Center</h1>
                                    <p className="text-sm text-gray-500 font-medium mt-1">Manage relief operations and logistics</p>
                                </div>
                            </div>
                        </div>

                        {/* Desktop Stats Summary */}
                        <div className="hidden lg:flex items-center gap-6 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                            <div className="text-center px-4 border-r border-gray-200">
                                <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Requests</span>
                                <span className="block text-xl font-bold text-gray-900">{requestStats.total}</span>
                            </div>
                            <div className="text-center px-4 border-r border-gray-200">
                                <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Offers</span>
                                <span className="block text-xl font-bold text-gray-900">{offerStats.total}</span>
                            </div>
                            <div className="text-center px-4">
                                <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Fulfilled</span>
                                <span className="block text-xl font-bold text-green-600">{requestStats.fulfilled}</span>
                            </div>
                        </div>
                    </div>

                    {/* Scrollable Tabs */}
                    <div className="flex overflow-x-auto gap-6 pb-px scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 mt-2">
                        {tabs.map((tab) => {
                            const isActive = activeTab === tab.id
                            const Icon = tab.icon
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`relative flex items-center gap-2 pb-4 px-1 min-w-max transition-colors ${isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    <Icon size={18} className={isActive ? 'stroke-[2.5px]' : 'stroke-[2px]'} />
                                    <span className={`font-medium text-sm ${isActive ? 'font-bold' : ''}`}>{tab.label}</span>
                                    {tab.count !== undefined && (
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            {tab.count}
                                        </span>
                                    )}
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"
                                        />
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
                <AnimatePresence mode="wait">



                    {/* Material Requests Section */}
                    {activeTab === 'requests' && (
                        <motion.div
                            key="requests"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="space-y-6"
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Material Requests</h2>
                                    <p className="text-sm text-gray-500">Manage school requests for relief materials.</p>
                                </div>
                                <div className="flex gap-2">
                                    {/* Actions could go here */}
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-24 relative overflow-hidden group">
                                    <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Package size={48} className="text-gray-900" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-500">Total Requests</span>
                                    <span className="text-3xl font-bold text-gray-900">{requestStats.total}</span>
                                </div>
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-24 relative overflow-hidden group">
                                    <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Clock size={48} className="text-yellow-600" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-500">Pending</span>
                                    <span className="text-3xl font-bold text-yellow-600">{requestStats.pending}</span>
                                </div>
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-24 relative overflow-hidden group">
                                    <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <UserCheck size={48} className="text-blue-600" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-500">Assigned</span>
                                    <span className="text-3xl font-bold text-blue-600">{requestStats.assigned}</span>
                                </div>
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-24 relative overflow-hidden group">
                                    <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <CheckCircle size={48} className="text-green-600" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-500">Fulfilled</span>
                                    <span className="text-3xl font-bold text-green-600">{requestStats.fulfilled}</span>
                                </div>
                            </div>

                            {/* Filters Bar */}
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Search schools, districts..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                    />
                                </div>
                                <div className="flex gap-3 overflow-x-auto pb-1 md:pb-0">
                                    <select
                                        value={requestStatusFilter}
                                        onChange={(e) => setRequestStatusFilter(e.target.value)}
                                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 hover:bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                                    >
                                        <option value="all">All Statuses</option>
                                        <option value="pending">Pending</option>
                                        <option value="assigned">Assigned</option>
                                        <option value="fulfilled">Fulfilled</option>
                                    </select>
                                    <select
                                        value={requestDistrictFilter}
                                        onChange={(e) => setRequestDistrictFilter(e.target.value)}
                                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 hover:bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                                    >
                                        <option value="all">All Districts</option>
                                        {requestDistricts.map(d => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Requests List */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                {requestsLoading ? (
                                    <div className="p-12 flex flex-col items-center justify-center text-gray-400">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current mb-4"></div>
                                        <p className="text-sm">Loading requests...</p>
                                    </div>
                                ) : filteredRequests.length === 0 ? (
                                    <div className="p-12 text-center text-gray-500">
                                        <Package size={48} className="mx-auto mb-4 opacity-20" />
                                        <p className="text-lg font-medium">No requests found</p>
                                        <p className="text-sm">Try adjusting your filters</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Mobile Card View */}
                                        <div className="block md:hidden divide-y divide-gray-100">
                                            {filteredRequests.map((request) => (
                                                <div key={request.id} className="p-4 hover:bg-gray-50 transition-colors">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <h3 className="font-semibold text-gray-900">{request.schoolName}</h3>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                                                    <MapPin size={10} /> {request.district}
                                                                </span>
                                                                <span className="text-xs text-gray-400">â€¢</span>
                                                                <span className="text-xs text-gray-500">
                                                                    {request.createdAt?.toDate?.()?.toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border ${getStatusBadge(request.status)}`}>
                                                            {request.status}
                                                        </span>
                                                    </div>

                                                    <div className="flex gap-2 mt-4">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedRequest(request)
                                                                setShowRequestModal(true)
                                                            }}
                                                            className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-100 transition"
                                                        >
                                                            View Details
                                                        </button>
                                                        <select
                                                            value={request.status}
                                                            onChange={(e) => handleUpdateRequestStatus(request.id, e.target.value)}
                                                            className="px-3 py-2 bg-gray-50 border-gray-200 rounded-lg text-xs font-semibold uppercase text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                                                            disabled={updating}
                                                        >
                                                            <option value="pending">Pending</option>
                                                            <option value="assigned">Assigned</option>
                                                            <option value="fulfilled">Done</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Desktop Table View */}
                                        <div className="hidden md:block overflow-x-auto">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-medium uppercase tracking-wider text-xs">
                                                    <tr>
                                                        <th className="px-6 py-3">School Name</th>
                                                        <th className="px-6 py-3">District</th>
                                                        <th className="px-6 py-3">Contact</th>
                                                        <th className="px-6 py-3">Requested Items</th>
                                                        <th className="px-6 py-3">Address & Description</th>
                                                        <th className="px-6 py-3">Status</th>
                                                        <th className="px-6 py-3 text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {filteredRequests.map((request) => (
                                                        <tr key={request.id} className="hover:bg-gray-50 transition-colors group">
                                                            <td className="px-6 py-4 align-top">
                                                                <div className="font-semibold text-gray-900">{request.schoolName}</div>
                                                                <div className="text-xs text-pink-600 font-mono mt-0.5">{request.requestToken}</div>
                                                                <div className="text-xs text-gray-400 mt-1">{request.createdAt?.toDate?.()?.toLocaleDateString()}</div>
                                                            </td>
                                                            <td className="px-6 py-4 align-top text-gray-600">
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-medium">
                                                                    <MapPin size={12} /> {request.district}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 align-top">
                                                                <div className="flex flex-col gap-0.5">
                                                                    <span className="text-gray-900 font-medium">{request.contactPerson}</span>
                                                                    <span className="text-gray-500 text-xs font-mono">{request.contactNumber}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 align-top">
                                                                <div className="space-y-1">
                                                                    {request.items?.map((item, idx) => (
                                                                        <div key={idx} className="flex items-center justify-between text-xs gap-4 border-b border-gray-100 pb-1 last:border-0 last:pb-0">
                                                                            <span className="text-gray-700">{item.name}</span>
                                                                            <span className="font-bold text-pink-600 bg-pink-50 px-1.5 rounded">{item.quantity}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 align-top max-w-xs">
                                                                {request.address && (
                                                                    <div className="mb-2">
                                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block">Address</span>
                                                                        <span className="text-xs text-gray-700">{request.address}</span>
                                                                    </div>
                                                                )}
                                                                {request.description && (
                                                                    <div>
                                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block">Description</span>
                                                                        <p className="text-xs text-gray-600 leading-relaxed">{request.description}</p>
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4 align-top">
                                                                <select
                                                                    value={request.status}
                                                                    onChange={(e) => handleUpdateRequestStatus(request.id, e.target.value)}
                                                                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase border cursor-pointer outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-all ${getStatusBadge(request.status)}`}
                                                                    disabled={updating}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <option value="pending">Pending</option>
                                                                    <option value="assigned">Assigned</option>
                                                                    <option value="fulfilled">Fulfilled</option>
                                                                </select>
                                                            </td>
                                                            <td className="px-6 py-4 align-top text-right">
                                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <button
                                                                        onClick={() => handleDeleteRequest(request.id)}
                                                                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                                                        title="Delete"
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
                                    </>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* Donation Offers Section */}
                    {activeTab === 'donations' && (
                        <motion.div
                            key="donations"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="space-y-6"
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Donation Offers</h2>
                                    <p className="text-sm text-gray-500">Manage incoming donation offers and donor details.</p>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-24 relative overflow-hidden group">
                                    <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Heart size={48} className="text-pink-600" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-500">Total Offers</span>
                                    <span className="text-3xl font-bold text-pink-600">{offerStats.total}</span>
                                </div>
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-24 relative overflow-hidden group">
                                    <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Clock size={48} className="text-yellow-600" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-500">Pending</span>
                                    <span className="text-3xl font-bold text-yellow-600">{offerStats.pending}</span>
                                </div>
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-24 relative overflow-hidden group">
                                    <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Phone size={48} className="text-blue-600" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-500">Contacted</span>
                                    <span className="text-3xl font-bold text-blue-600">{offerStats.contacted}</span>
                                </div>
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-24 relative overflow-hidden group">
                                    <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <CheckCircle size={48} className="text-green-600" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-500">Completed</span>
                                    <span className="text-3xl font-bold text-green-600">{offerStats.completed}</span>
                                </div>
                            </div>

                            {/* List */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                {offersLoading ? (
                                    <div className="p-12 flex flex-col items-center justify-center text-gray-400">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current mb-4"></div>
                                        <p className="text-sm">Loading offers...</p>
                                    </div>
                                ) : filteredOffers.length === 0 ? (
                                    <div className="p-12 text-center text-gray-500">
                                        <Heart size={48} className="mx-auto mb-4 opacity-20" />
                                        <p className="text-lg font-medium">No donation offers found</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Mobile Card View */}
                                        <div className="block md:hidden divide-y divide-gray-100">
                                            {filteredOffers.map((offer) => (
                                                <div key={offer.id} className="p-4 hover:bg-gray-50 transition-colors">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <h3 className="font-semibold text-gray-900">{offer.donorName}</h3>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                                                    <MapPin size={10} /> {offer.district}
                                                                </span>
                                                                <span className="text-xs text-gray-400">â€¢</span>
                                                                <span className="text-xs text-gray-500">
                                                                    {offer.createdAt?.toDate?.()?.toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border ${getStatusBadge(offer.status)}`}>
                                                            {offer.status}
                                                        </span>
                                                    </div>

                                                    <div className="mb-3 bg-gray-50 p-2 rounded text-xs text-gray-600">
                                                        {offer.paymentSlip ? (
                                                            <span className="flex items-center gap-1 text-green-600 font-medium">
                                                                <Download size={12} /> Money Donation (Slip Attached)
                                                            </span>
                                                        ) : (
                                                            <span className="line-clamp-2">{offer.itemsOffered}</span>
                                                        )}
                                                    </div>

                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedOffer(offer)
                                                                setShowOfferModal(true)
                                                            }}
                                                            className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-100 transition"
                                                        >
                                                            View Details
                                                        </button>
                                                        <select
                                                            value={offer.status}
                                                            onChange={(e) => handleUpdateOfferStatus(offer.id, e.target.value)}
                                                            className="px-3 py-2 bg-gray-50 border-gray-200 rounded-lg text-xs font-semibold uppercase text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                                                            disabled={updating}
                                                        >
                                                            <option value="pending">Pending</option>
                                                            <option value="contacted">Contacted</option>
                                                            <option value="completed">Completed</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Desktop Table View */}
                                        <div className="hidden md:block overflow-x-auto">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-medium uppercase tracking-wider text-xs">
                                                    <tr>
                                                        <th className="px-6 py-3">Donor</th>
                                                        <th className="px-6 py-3">Contact</th>
                                                        <th className="px-6 py-3">District</th>
                                                        <th className="px-6 py-3">Offer Details</th>
                                                        <th className="px-6 py-3">Message</th>
                                                        <th className="px-6 py-3">Status</th>
                                                        <th className="px-6 py-3 text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {filteredOffers.map((offer) => (
                                                        <tr key={offer.id} className="hover:bg-gray-50 transition-colors group">
                                                            <td className="px-6 py-4 align-top">
                                                                <div className="font-semibold text-gray-900">{offer.donorName}</div>
                                                                <div className="text-xs text-gray-400">{offer.createdAt?.toDate?.()?.toLocaleDateString()}</div>
                                                            </td>
                                                            <td className="px-6 py-4 align-top">
                                                                <div className="flex flex-col gap-0.5">
                                                                    <span className="text-gray-900 font-medium">{offer.contactNumber}</span>
                                                                    <span className="text-gray-500 text-xs truncate max-w-[150px]">{offer.email}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 align-top text-gray-600">
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-medium">
                                                                    <MapPin size={12} /> {offer.district}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 align-top">
                                                                {offer.paymentSlip ? (
                                                                    <div>
                                                                        <span className="text-xs font-bold text-green-600 block mb-1">Money Donation</span>
                                                                        <button
                                                                            onClick={() => setSelectedSlip(offer.paymentSlip)}
                                                                            className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-medium text-xs bg-blue-50 px-2 py-1 rounded-md border border-blue-100 transition"
                                                                        >
                                                                            <Eye size={12} /> View Slip
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <div className="space-y-1">
                                                                        {offer.items && offer.items.length > 0 ? (
                                                                            offer.items.map((item, idx) => (
                                                                                <div key={idx} className="flex items-center gap-2 text-xs">
                                                                                    <span className="font-medium text-gray-900">{item.name}</span>
                                                                                    <span className="text-gray-500">x{item.quantity}</span>
                                                                                </div>
                                                                            ))
                                                                        ) : (
                                                                            <div className="text-xs text-gray-600">{offer.itemsOffered}</div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4 align-top max-w-xs">
                                                                {offer.message ? (
                                                                    <p className="text-xs text-gray-600 leading-relaxed line-clamp-3 hover:line-clamp-none transition-all">{offer.message}</p>
                                                                ) : (
                                                                    <span className="text-xs text-gray-400 italic">No message</span>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4 align-top">
                                                                <select
                                                                    value={offer.status}
                                                                    onChange={(e) => handleUpdateOfferStatus(offer.id, e.target.value)}
                                                                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase border cursor-pointer outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-all ${getStatusBadge(offer.status)}`}
                                                                    disabled={updating}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <option value="pending">Pending</option>
                                                                    <option value="contacted">Contacted</option>
                                                                    <option value="completed">Completed</option>
                                                                </select>
                                                            </td>
                                                            <td className="px-6 py-4 align-top text-right">
                                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <button
                                                                        onClick={() => handleDeleteOffer(offer.id)}
                                                                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                                                        title="Delete"
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
                                    </>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* Fulfillment Section */}
                    {/* Fulfillment Section */}
                    {activeTab === 'fulfillment' && (
                        <motion.div
                            key="fulfillment"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="space-y-6"
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Fulfillment Status</h2>
                                    <p className="text-sm text-gray-500">Track relief item demand and update fulfillment progress.</p>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                {/* Mobile Card View */}
                                <div className="block md:hidden divide-y divide-gray-100">
                                    {itemStats.map((stat) => (
                                        <div key={stat.docId} className="p-4 bg-white">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h3 className="font-semibold text-gray-900">{stat.name}</h3>
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 uppercase mt-1">
                                                        {stat.category}
                                                    </span>
                                                </div>
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${stat.progress >= 100 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                    {stat.progress.toFixed(0)}%
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 mb-4">
                                                <div className="bg-blue-50 p-3 rounded-lg text-center">
                                                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Requested</p>
                                                    <p className="text-xl font-bold text-blue-800 mt-1">{stat.totalRequested}</p>
                                                </div>
                                                <div className="bg-purple-50 p-3 rounded-lg text-center">
                                                    <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Pending</p>
                                                    <p className="text-xl font-bold text-purple-800 mt-1">{Math.max(0, stat.totalRequested - (stat.globalFulfilled || 0))}</p>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                                                    Update Fulfilled Quantity
                                                </label>
                                                <input
                                                    type="number"
                                                    value={stat.globalFulfilled || 0}
                                                    onChange={(e) => handleUpdateFulfilled(stat.docId, e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-shadow"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Desktop Table View */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-medium uppercase tracking-wider text-xs">
                                            <tr>
                                                <th className="px-6 py-3">Item Name</th>
                                                <th className="px-6 py-3">Category</th>
                                                <th className="px-6 py-3 text-center">Requested</th>
                                                <th className="px-6 py-3 text-center">Fulfilled</th>
                                                <th className="px-6 py-3 text-center">Pending</th>
                                                <th className="px-6 py-3 w-1/3">Progress</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {itemStats.map((stat) => (
                                                <tr key={stat.docId} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 font-medium text-gray-900">{stat.name}</td>
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                            {stat.category}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-semibold text-blue-600">
                                                        {stat.totalRequested}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <input
                                                            type="number"
                                                            value={stat.globalFulfilled || 0}
                                                            onChange={(e) => handleUpdateFulfilled(stat.docId, e.target.value)}
                                                            className="w-24 text-center px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-semibold text-purple-600">
                                                        {Math.max(0, stat.totalRequested - (stat.globalFulfilled || 0))}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                                                                <div
                                                                    className={`h-full rounded-full transition-all duration-500 ${stat.progress >= 100 ? 'bg-green-500' : 'bg-yellow-500'}`}
                                                                    style={{ width: `${Math.min(stat.progress, 100)}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className="text-xs font-bold text-gray-600 min-w-[3ch]">{stat.progress.toFixed(0)}%</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Relief Items Section */}
                    {activeTab === 'items' && (
                        <motion.div
                            key="items"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="space-y-6"
                        >
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">Relief Items</h2>
                                        <p className="text-sm text-gray-500">Manage the predefined list of relief items.</p>
                                    </div>
                                    <button
                                        onClick={() => setShowAddItemForm(!showAddItemForm)}
                                        className="px-4 py-2 bg-pink-600 text-white rounded-lg font-semibold hover:bg-pink-700 transition flex items-center gap-2 shadow-sm shadow-pink-200"
                                    >
                                        {showAddItemForm ? <X size={18} /> : <Plus size={18} />}
                                        {showAddItemForm ? 'Cancel' : 'Add New Item'}
                                    </button>
                                </div>

                                <AnimatePresence>
                                    {showAddItemForm && (
                                        <motion.form
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="bg-gray-50 border border-gray-100 rounded-xl p-6 mb-6 overflow-hidden"
                                            onSubmit={handleAddItem}
                                        >
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                                                        Item ID <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={newItem.id}
                                                        onChange={(e) => setNewItem({ ...newItem, id: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                                                        placeholder="e.g. notebooks"
                                                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all font-mono"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                                                        Name (English) <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={newItem.name}
                                                        onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                                        placeholder="e.g. Notebooks"
                                                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                                                        Name (Sinhala)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={newItem.nameSi}
                                                        onChange={(e) => setNewItem({ ...newItem, nameSi: e.target.value })}
                                                        placeholder="e.g. සටහන් පොත්"
                                                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                                                        Category <span className="text-red-500">*</span>
                                                    </label>
                                                    <select
                                                        value={newItem.category}
                                                        onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                                                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                                                        required
                                                    >
                                                        <option value="">Select Category...</option>
                                                        {categories.map(cat => (
                                                            <option key={cat} value={cat}>{cat}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                                                        Sort Order
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={newItem.sortOrder}
                                                        onChange={(e) => setNewItem({ ...newItem, sortOrder: e.target.value })}
                                                        placeholder="0"
                                                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                                                    />
                                                </div>
                                            </div>
                                            <div className="mt-6 flex justify-end gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowAddItemForm(false)}
                                                    className="px-5 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-50 transition"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="submit"
                                                    className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition flex items-center gap-2 shadow-sm"
                                                >
                                                    <Plus size={16} /> Save Item
                                                </button>
                                            </div>
                                        </motion.form>
                                    )}
                                </AnimatePresence>

                                {/* Mobile Card View */}
                                <div className="block md:hidden divide-y divide-gray-100">
                                    {itemsLoading ? (
                                        <div className="p-8 text-center text-gray-400">Loading...</div>
                                    ) : reliefItems.length === 0 ? (
                                        <div className="p-8 text-center text-gray-500 italic">No relief items found.</div>
                                    ) : (
                                        reliefItems.map((item) => (
                                            <div key={item.docId} className="p-4 bg-white">
                                                {editingItem?.docId === item.docId ? (
                                                    <div className="space-y-3 bg-gray-50 p-3 rounded-lg border border-blue-100">
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="col-span-1">
                                                                <label className="text-xs text-gray-500 font-medium">Order</label>
                                                                <input
                                                                    type="number"
                                                                    value={editingItem.sortOrder}
                                                                    onChange={(e) => setEditingItem({ ...editingItem, sortOrder: e.target.value })}
                                                                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                                                                />
                                                            </div>
                                                            <div className="col-span-1">
                                                                <label className="text-xs text-gray-500 font-medium">ID</label>
                                                                <input
                                                                    type="text"
                                                                    value={editingItem.id}
                                                                    onChange={(e) => setEditingItem({ ...editingItem, id: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                                                                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm font-mono"
                                                                />
                                                            </div>
                                                        </div>
                                                        <input
                                                            type="text"
                                                            value={editingItem.name}
                                                            onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                                                            placeholder="Name (EN)"
                                                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={editingItem.nameSi}
                                                            onChange={(e) => setEditingItem({ ...editingItem, nameSi: e.target.value })}
                                                            placeholder="Name (SI)"
                                                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                                                        />
                                                        <select
                                                            value={editingItem.category}
                                                            onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                                                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                                                        >
                                                            {categories.map(cat => (
                                                                <option key={cat} value={cat}>{cat}</option>
                                                            ))}
                                                        </select>
                                                        <div className="flex gap-2 justify-end mt-2">
                                                            <button onClick={() => setEditingItem(null)} className="px-3 py-1.5 text-gray-600 bg-white border border-gray-300 rounded text-xs font-semibold">Cancel</button>
                                                            <button onClick={() => handleUpdateItem(item.docId)} className="px-3 py-1.5 bg-green-600 text-white rounded text-xs font-semibold">Save</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-xs font-mono text-gray-400">#{item.sortOrder}</span>
                                                                <span className="text-xs font-mono font-bold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">{item.id}</span>
                                                            </div>
                                                            <h3 className="font-semibold text-gray-900">{item.name}</h3>
                                                            <p className="text-sm text-gray-500">{item.nameSi}</p>
                                                            <span className="inline-block mt-2 px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider rounded border border-blue-100">
                                                                {item.category}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-col gap-2">
                                                            <button
                                                                onClick={() => setEditingItem({ ...item })}
                                                                className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
                                                            >
                                                                <Edit2 size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteItem(item.docId, item.name)}
                                                                className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Desktop Table View */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-medium uppercase tracking-wider text-xs">
                                            <tr>
                                                <th className="px-6 py-3 w-16">#</th>
                                                <th className="px-6 py-3 w-32">ID</th>
                                                <th className="px-6 py-3">Name (EN)</th>
                                                <th className="px-6 py-3">Name (SI)</th>
                                                <th className="px-6 py-3">Category</th>
                                                <th className="px-6 py-3 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {itemsLoading ? (
                                                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">Loading...</td></tr>
                                            ) : reliefItems.length === 0 ? (
                                                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500 italic">No relief items found.</td></tr>
                                            ) : (
                                                reliefItems.map((item) => (
                                                    <tr key={item.docId} className="hover:bg-gray-50 transition-colors group">
                                                        {editingItem?.docId === item.docId ? (
                                                            <>
                                                                <td className="px-6 py-3">
                                                                    <input
                                                                        type="number"
                                                                        value={editingItem.sortOrder}
                                                                        onChange={(e) => setEditingItem({ ...editingItem, sortOrder: e.target.value })}
                                                                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                                                    />
                                                                </td>
                                                                <td className="px-6 py-3">
                                                                    <input
                                                                        type="text"
                                                                        value={editingItem.id}
                                                                        onChange={(e) => setEditingItem({ ...editingItem, id: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                                                                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-mono"
                                                                    />
                                                                </td>
                                                                <td className="px-6 py-3">
                                                                    <input
                                                                        type="text"
                                                                        value={editingItem.name}
                                                                        onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                                                                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                                                    />
                                                                </td>
                                                                <td className="px-6 py-3">
                                                                    <input
                                                                        type="text"
                                                                        value={editingItem.nameSi}
                                                                        onChange={(e) => setEditingItem({ ...editingItem, nameSi: e.target.value })}
                                                                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                                                    />
                                                                </td>
                                                                <td className="px-6 py-3">
                                                                    <select
                                                                        value={editingItem.category}
                                                                        onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                                                                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                                                    >
                                                                        {categories.map(cat => (
                                                                            <option key={cat} value={cat}>{cat}</option>
                                                                        ))}
                                                                    </select>
                                                                </td>
                                                                <td className="px-6 py-3 text-right">
                                                                    <div className="flex items-center justify-end gap-2">
                                                                        <button onClick={() => handleUpdateItem(item.docId)} className="text-green-600 hover:text-green-800 font-medium text-xs uppercase">Save</button>
                                                                        <button onClick={() => setEditingItem(null)} className="text-gray-500 hover:text-gray-700 font-medium text-xs uppercase">Cancel</button>
                                                                    </div>
                                                                </td>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <td className="px-6 py-4 text-gray-400 font-mono text-xs">{item.sortOrder}</td>
                                                                <td className="px-6 py-4 font-mono text-xs font-medium text-gray-700">{item.id}</td>
                                                                <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                                                                <td className="px-6 py-4 text-gray-600 font-poppins">{item.nameSi}</td>
                                                                <td className="px-6 py-4">
                                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                                                        {item.category}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 text-right">
                                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <button
                                                                            onClick={() => setEditingItem({ ...item })}
                                                                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                                            title="Edit"
                                                                        >
                                                                            <Edit2 size={16} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeleteItem(item.docId, item.name)}
                                                                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                                                            title="Delete"
                                                                        >
                                                                            <Trash2 size={16} />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </>
                                                        )}
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    )}
                    {/* Settings Section */}
                    {activeTab === 'settings' && (
                        <motion.div
                            key="settings"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="space-y-6"
                        >
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-2">Settings</h2>
                                <p className="text-sm text-gray-500 mb-8">
                                    Manage Google Sheet integration and bank account details for donations.
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Google Sheet Configuration */}
                                    <div className="space-y-4">
                                        <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                                            <div className="p-1.5 bg-green-100 text-green-700 rounded-lg">
                                                <ExternalLink size={16} />
                                            </div>
                                            Integration
                                        </h3>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                                                Google Sheet URL
                                            </label>
                                            <div className="flex rounded-lg shadow-sm">
                                                <input
                                                    type="url"
                                                    value={googleSheetUrl}
                                                    onChange={(e) => setGoogleSheetUrl(e.target.value)}
                                                    placeholder="https://docs.google.com/spreadsheets/..."
                                                    className="flex-1 min-w-0 block w-full px-3 py-2 border border-gray-300 rounded-l-lg text-sm focus:ring-pink-500 focus:border-pink-500"
                                                />
                                                {googleSheetUrl && (
                                                    <a
                                                        href={googleSheetUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center px-4 py-2 border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm font-medium rounded-r-lg hover:bg-gray-100 hover:text-gray-700"
                                                        title="Open Sheet"
                                                    >
                                                        <ExternalLink size={16} />
                                                    </a>
                                                )}
                                            </div>
                                            <p className="mt-1 text-xs text-gray-400">
                                                Link to the Google Sheet used for tracking requests/donations.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Bank Details Configuration */}
                                    <div className="space-y-4">
                                        <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                                            <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="12" x="2" y="6" rx="2" /><circle cx="12" cy="12" r="2" /><path d="M6 12h.01M18 12h.01" /></svg>
                                            </div>
                                            Bank Details
                                        </h3>
                                        <div className="grid grid-cols-1 gap-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Account Holder</label>
                                                <input
                                                    type="text"
                                                    value={bankDetails.accountHolder}
                                                    onChange={(e) => setBankDetails({ ...bankDetails, accountHolder: e.target.value })}
                                                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-pink-500 focus:border-pink-500"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Bank Name</label>
                                                    <input
                                                        type="text"
                                                        value={bankDetails.bankName}
                                                        onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                                                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-pink-500 focus:border-pink-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Branch</label>
                                                    <input
                                                        type="text"
                                                        value={bankDetails.branch}
                                                        onChange={(e) => setBankDetails({ ...bankDetails, branch: e.target.value })}
                                                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-pink-500 focus:border-pink-500"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Account Number</label>
                                                <input
                                                    type="text"
                                                    value={bankDetails.accountNumber}
                                                    onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                                                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-pink-500 focus:border-pink-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                                    <button
                                        onClick={saveConfig}
                                        disabled={savingConfig}
                                        className="px-6 py-2.5 bg-pink-600 text-white rounded-lg font-semibold hover:bg-pink-700 disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center gap-2 shadow-lg shadow-pink-200"
                                    >
                                        {savingConfig ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save size={18} />
                                                Save Changes
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Request Detail Modal */}
                <AnimatePresence>
                    {showRequestModal && selectedRequest && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                            onClick={() => setShowRequestModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-start justify-between z-10">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedRequest.schoolName}</h2>
                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusBadge(selectedRequest.status)}`}>
                                            {selectedRequest.status}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => setShowRequestModal(false)}
                                        className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-lg transition"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="p-6 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">District</p>
                                            <p className="font-semibold text-gray-900">{selectedRequest.district}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Token</p>
                                            <p className="font-mono text-pink-600 font-bold">{selectedRequest.requestToken}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Contact Person</p>
                                            <p className="font-semibold text-gray-900">{selectedRequest.contactPerson}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Contact Number</p>
                                            <p className="font-semibold text-gray-900">{selectedRequest.contactNumber}</p>
                                        </div>
                                    </div>

                                    {selectedRequest.address && (
                                        <div>
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Address</p>
                                            <p className="text-gray-700">{selectedRequest.address}</p>
                                        </div>
                                    )}

                                    {selectedRequest.description && (
                                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Description</p>
                                            <p className="text-gray-700 text-sm leading-relaxed">{selectedRequest.description}</p>
                                        </div>
                                    )}

                                    <div>
                                        <p className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                                            <span className="w-1 h-4 bg-pink-500 rounded-full"></span>
                                            Materials Requested
                                        </p>
                                        <div className="space-y-2">
                                            {selectedRequest.items?.map((item, index) => (
                                                <div key={index} className="flex justify-between items-center bg-gray-50 hover:bg-white border border-transparent hover:border-gray-200 p-3 rounded-lg transition-colors">
                                                    <span className="text-gray-900 font-medium">{item.name}</span>
                                                    <span className="font-bold text-pink-600 bg-pink-50 px-3 py-1 rounded-full text-sm">{item.quantity}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Offer Detail Modal */}
                <AnimatePresence>
                    {showOfferModal && selectedOffer && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                            onClick={() => setShowOfferModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-start justify-between z-10">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <h2 className="text-2xl font-bold text-gray-900">Donation Offer</h2>
                                            {selectedOffer.paymentSlip ? (
                                                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide border border-green-200">
                                                    Money
                                                </span>
                                            ) : (
                                                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide border border-blue-200">
                                                    Material
                                                </span>
                                            )}
                                        </div>
                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusBadge(selectedOffer.status)}`}>
                                            {selectedOffer.status}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => setShowOfferModal(false)}
                                        className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-lg transition"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="p-6 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Donor Name</p>
                                            <p className="font-semibold text-gray-900">{selectedOffer.donorName}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Contact Number</p>
                                            <p className="font-semibold text-gray-900">{selectedOffer.contactNumber}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Email</p>
                                            <p className="font-semibold text-gray-900">{selectedOffer.email}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">District</p>
                                            <p className="font-semibold text-gray-900">{selectedOffer.district}</p>
                                        </div>
                                    </div>

                                    {selectedOffer.paymentSlip ? (
                                        <div>
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Payment Slip</p>
                                            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                                                <div
                                                    onClick={() => setSelectedSlip(selectedOffer.paymentSlip)}
                                                    className="block relative group overflow-hidden rounded-lg mb-3 cursor-pointer"
                                                >
                                                    <img
                                                        src={selectedOffer.paymentSlip}
                                                        alt="Payment Slip"
                                                        className="w-full max-h-80 object-contain rounded-lg shadow-sm group-hover:scale-105 transition-transform duration-300"
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = 'https://placehold.co/600x400?text=PDF+Document';
                                                        }}
                                                    />
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                                        <Eye className="text-white opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all drop-shadow-md" size={32} />
                                                    </div>
                                                </div>
                                                <div className="flex justify-end">
                                                    <button
                                                        onClick={async (e) => {
                                                            e.stopPropagation();
                                                            try {
                                                                const response = await fetch(selectedOffer.paymentSlip);
                                                                const blob = await response.blob();
                                                                const url = window.URL.createObjectURL(blob);
                                                                const link = document.createElement('a');
                                                                link.href = url;

                                                                // Determine extension from MIME type
                                                                let extension = 'jpg';
                                                                if (blob.type === 'application/pdf') extension = 'pdf';
                                                                else if (blob.type === 'image/png') extension = 'png';
                                                                else if (blob.type === 'image/jpeg') extension = 'jpg';

                                                                link.download = `payment-slip-${Date.now()}.${extension}`;
                                                                document.body.appendChild(link);
                                                                link.click();
                                                                document.body.removeChild(link);
                                                                window.URL.revokeObjectURL(url);
                                                            } catch (error) {
                                                                console.error('Download failed:', error);
                                                                // Fallback to direct navigation
                                                                window.open(selectedOffer.paymentSlip, '_blank');
                                                            }
                                                        }}
                                                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition shadow-sm"
                                                    >
                                                        <Download size={16} /> Download Slip
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <p className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                                                <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                                                Items Offered
                                            </p>
                                            {selectedOffer.items && selectedOffer.items.length > 0 ? (
                                                <div className="space-y-2 mb-4">
                                                    {selectedOffer.items.map((item, index) => (
                                                        <div key={index} className="flex justify-between items-center bg-blue-50 hover:bg-blue-100/50 border border-blue-100 p-3 rounded-lg transition-colors">
                                                            <span className="text-gray-900 font-medium">{item.name}</span>
                                                            <span className="font-bold text-blue-700 bg-white/50 px-3 py-1 rounded-full text-sm">{item.quantity}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : null}
                                            {selectedOffer.itemsOffered && (
                                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                                    <p className="text-gray-700 italic text-sm">{selectedOffer.itemsOffered}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {selectedOffer.message && (
                                        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
                                            <p className="text-xs font-bold text-yellow-800 uppercase tracking-wider mb-2">Message from Donor</p>
                                            <p className="text-gray-800 text-sm leading-relaxed">{selectedOffer.message}</p>
                                        </div>
                                    )}

                                    <div className="pt-2 border-t border-gray-100 mt-2">
                                        <div className="flex items-center justify-between text-xs text-gray-400">
                                            <span>Submitted via App</span>
                                            <span>
                                                {selectedOffer.createdAt?.toDate?.()?.toLocaleDateString()} at {selectedOffer.createdAt?.toDate?.()?.toLocaleTimeString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Slip Viewer Modal */}
                <AnimatePresence>
                    {selectedSlip && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
                            onClick={() => setSelectedSlip(null)}
                        >
                            <button
                                onClick={() => setSelectedSlip(null)}
                                className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-[110]"
                            >
                                <X size={24} />
                            </button>

                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {selectedSlip?.toLowerCase().includes('.pdf') ? (
                                    <iframe
                                        src={selectedSlip}
                                        title="Payment Slip PDF"
                                        className="w-full h-[80vh] rounded-lg shadow-2xl mb-6 bg-white"
                                    />
                                ) : (
                                    <img
                                        src={selectedSlip}
                                        alt="Payment Slip Full Size"
                                        className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl mb-6"
                                    />
                                )}

                                <button
                                    onClick={async () => {
                                        try {
                                            const response = await fetch(selectedSlip);
                                            const blob = await response.blob();
                                            const url = window.URL.createObjectURL(blob);
                                            const link = document.createElement('a');
                                            link.href = url;

                                            // Determine extension from MIME type
                                            let extension = 'jpg';
                                            if (blob.type === 'application/pdf') extension = 'pdf';
                                            else if (blob.type === 'image/png') extension = 'png';
                                            else if (blob.type === 'image/jpeg') extension = 'jpg';

                                            link.download = `payment-slip-${Date.now()}.${extension}`;
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);
                                            window.URL.revokeObjectURL(url);
                                        } catch (error) {
                                            console.error('Download failed:', error);
                                            // Fallback to direct navigation if fetch fails
                                            window.open(selectedSlip, '_blank');
                                        }
                                    }}
                                    className="px-6 py-3 bg-white text-gray-900 rounded-full font-bold shadow-lg hover:bg-gray-100 transition flex items-center gap-2"
                                >
                                    <Download size={20} /> Download Slip
                                </button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </main>
        </div >
    )
}
