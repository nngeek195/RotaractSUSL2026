'use client'
import { useState, useEffect } from 'react'
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Search, Filter, Download, CheckCircle, Clock, UserCheck, Trash2, Eye, X, Heart, Phone, Mail, MapPin, Package, Settings, Plus, Edit2, Save, ExternalLink } from 'lucide-react'

export default function ReliefAdminPage() {
    const [activeTab, setActiveTab] = useState('requests') // 'requests', 'donations', 'items', 'settings'

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
        sortOrder: 0
    })
    const [googleSheetUrl, setGoogleSheetUrl] = useState('')
    const [savingSheetUrl, setSavingSheetUrl] = useState(false)

    const categories = ['Stationery', 'Books', 'Bags', 'Essentials', 'Clothing', 'Other']

    // Fetch Material Requests
    useEffect(() => {
        fetchRequests()
    }, [])

    const fetchRequests = async () => {
        setRequestsLoading(true)
        try {
            const q = query(collection(db, 'materialRequests'), orderBy('createdAt', 'desc'))
            const querySnapshot = await getDocs(q)
            const requestsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }))
            setRequests(requestsData)
            setFilteredRequests(requestsData)
        } catch (error) {
            console.error('Error fetching requests:', error)
            alert('Failed to load requests')
        } finally {
            setRequestsLoading(false)
        }
    }

    // Fetch Donation Offers
    useEffect(() => {
        fetchOffers()
        fetchReliefItems()
        fetchGoogleSheetUrl()
    }, [])

    const fetchOffers = async () => {
        setOffersLoading(true)
        try {
            const q = query(collection(db, 'donationOffers'), orderBy('createdAt', 'desc'))
            const querySnapshot = await getDocs(q)
            const offersData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }))
            setOffers(offersData)
            setFilteredOffers(offersData)
        } catch (error) {
            console.error('Error fetching offers:', error)
            alert('Failed to load donation offers')
        } finally {
            setOffersLoading(false)
        }
    }

    // Fetch Relief Items
    const fetchReliefItems = async () => {
        setItemsLoading(true)
        try {
            const q = query(collection(db, 'reliefItems'), orderBy('sortOrder', 'asc'))
            const querySnapshot = await getDocs(q)
            const itemsData = querySnapshot.docs.map(doc => ({
                docId: doc.id,
                ...doc.data()
            }))
            setReliefItems(itemsData)
        } catch (error) {
            console.error('Error fetching relief items:', error)
            alert('Failed to load relief items')
        } finally {
            setItemsLoading(false)
        }
    }

    // Fetch Google Sheet URL
    const fetchGoogleSheetUrl = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'reliefConfig'))
            if (!querySnapshot.empty) {
                const config = querySnapshot.docs[0].data()
                setGoogleSheetUrl(config.googleSheetUrl || '')
            }
        } catch (error) {
            console.error('Error fetching Google Sheet URL:', error)
        }
    }

    // Save Google Sheet URL
    const saveGoogleSheetUrl = async () => {
        if (!googleSheetUrl.trim()) {
            alert('Please enter a valid Google Sheet URL')
            return
        }

        setSavingSheetUrl(true)
        try {
            const querySnapshot = await getDocs(collection(db, 'reliefConfig'))
            if (querySnapshot.empty) {
                await addDoc(collection(db, 'reliefConfig'), {
                    googleSheetUrl: googleSheetUrl.trim(),
                    updatedAt: new Date()
                })
            } else {
                const docId = querySnapshot.docs[0].id
                await updateDoc(doc(db, 'reliefConfig', docId), {
                    googleSheetUrl: googleSheetUrl.trim(),
                    updatedAt: new Date()
                })
            }
            alert('Google Sheet URL saved successfully!')
        } catch (error) {
            console.error('Error saving Google Sheet URL:', error)
            alert('Failed to save Google Sheet URL')
        } finally {
            setSavingSheetUrl(false)
        }
    }

    // Add Relief Item
    const handleAddItem = async (e) => {
        e.preventDefault()
        
        if (!newItem.id || !newItem.name || !newItem.category) {
            alert('Please fill in all required fields')
            return
        }

        if (reliefItems.some(item => item.id === newItem.id)) {
            alert('Item ID already exists. Please use a unique ID.')
            return
        }

        try {
            await addDoc(collection(db, 'reliefItems'), {
                id: newItem.id,
                name: newItem.name,
                nameSi: newItem.nameSi || '',
                category: newItem.category,
                sortOrder: parseInt(newItem.sortOrder) || 0,
                createdAt: new Date(),
                updatedAt: new Date()
            })

            setNewItem({ id: '', name: '', nameSi: '', category: '', sortOrder: 0 })
            setShowAddItemForm(false)
            fetchReliefItems()
            alert('Item added successfully!')
        } catch (error) {
            console.error('Error adding item:', error)
            alert('Failed to add item')
        }
    }

    // Update Relief Item
    const handleUpdateItem = async (docId) => {
        if (!editingItem.id || !editingItem.name || !editingItem.category) {
            alert('Please fill in all required fields')
            return
        }

        try {
            await updateDoc(doc(db, 'reliefItems', docId), {
                id: editingItem.id,
                name: editingItem.name,
                nameSi: editingItem.nameSi || '',
                category: editingItem.category,
                sortOrder: parseInt(editingItem.sortOrder) || 0,
                updatedAt: new Date()
            })

            setEditingItem(null)
            fetchReliefItems()
            alert('Item updated successfully!')
        } catch (error) {
            console.error('Error updating item:', error)
            alert('Failed to update item')
        }
    }

    // Delete Relief Item
    const handleDeleteItem = async (docId, itemName) => {
        if (!confirm(`Are you sure you want to delete "${itemName}"? This may affect existing requests.`)) {
            return
        }

        try {
            await deleteDoc(doc(db, 'reliefItems', docId))
            fetchReliefItems()
            alert('Item deleted successfully!')
        } catch (error) {
            console.error('Error deleting item:', error)
            alert('Failed to delete item')
        }
    }

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

    // Update request status
    const handleUpdateRequestStatus = async (requestId, newStatus) => {
        setUpdating(true)
        try {
            const requestRef = doc(db, 'materialRequests', requestId)
            await updateDoc(requestRef, {
                status: newStatus,
                updatedAt: new Date()
            })

            setRequests(prev => prev.map(req =>
                req.id === requestId ? { ...req, status: newStatus, updatedAt: new Date() } : req
            ))

            if (selectedRequest?.id === requestId) {
                setSelectedRequest(prev => ({ ...prev, status: newStatus }))
            }

            alert('Status updated successfully!')
        } catch (error) {
            console.error('Error updating status:', error)
            alert('Failed to update status')
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

            setOffers(prev => prev.map(offer =>
                offer.id === offerId ? { ...offer, status: newStatus, updatedAt: new Date() } : offer
            ))

            if (selectedOffer?.id === offerId) {
                setSelectedOffer(prev => ({ ...prev, status: newStatus }))
            }

            alert('Status updated successfully!')
        } catch (error) {
            console.error('Error updating status:', error)
            alert('Failed to update status')
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
            alert('Request deleted successfully')
        } catch (error) {
            console.error('Error deleting request:', error)
            alert('Failed to delete request')
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
            alert('Donation offer deleted successfully')
        } catch (error) {
            console.error('Error deleting offer:', error)
            alert('Failed to delete offer')
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

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="font-playfair text-4xl font-bold text-gray-900 mb-2">
                        🇱🇰 Flood Relief Management
                    </h1>
                    <p className="font-poppins text-gray-600">
                        Manage requests, donations, items, and Google Sheet link
                    </p>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
                    <div className="flex border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('requests')}
                            className={`flex-1 px-6 py-4 font-poppins font-semibold text-base transition flex items-center justify-center gap-2 ${activeTab === 'requests'
                                    ? 'border-b-4 border-pink-600 text-pink-600 bg-pink-50'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                        >
                            <Package size={20} />
                            Material Requests ({requestStats.total})
                        </button>
                        <button
                            onClick={() => setActiveTab('donations')}
                            className={`flex-1 px-6 py-4 font-poppins font-semibold text-base transition flex items-center justify-center gap-2 ${activeTab === 'donations'
                                    ? 'border-b-4 border-pink-600 text-pink-600 bg-pink-50'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                        >
                            <Heart size={20} />
                            Donation Offers ({offerStats.total})
                        </button>
                        <button
                            onClick={() => setActiveTab('items')}
                            className={`flex-1 px-6 py-4 font-poppins font-semibold text-base transition flex items-center justify-center gap-2 ${activeTab === 'items'
                                    ? 'border-b-4 border-pink-600 text-pink-600 bg-pink-50'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                        >
                            <Package size={20} />
                            Relief Items
                        </button>
                        <button
                            onClick={() => setActiveTab('settings')}
                            className={`flex-1 px-6 py-4 font-poppins font-semibold text-base transition flex items-center justify-center gap-2 ${activeTab === 'settings'
                                    ? 'border-b-4 border-pink-600 text-pink-600 bg-pink-50'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                        >
                            <Settings size={20} />
                            Settings
                        </button>
                    </div>
                </div>

                {/* Material Requests Tab */}
                {activeTab === 'requests' && (
                    <div className="space-y-6">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                                <p className="font-poppins text-sm text-gray-600 mb-1">Total Requests</p>
                                <p className="font-playfair text-4xl font-bold text-gray-900">{requestStats.total}</p>
                            </div>
                            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6">
                                <p className="font-poppins text-sm text-yellow-700 mb-1">Pending</p>
                                <p className="font-playfair text-4xl font-bold text-yellow-800">{requestStats.pending}</p>
                            </div>
                            <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6">
                                <p className="font-poppins text-sm text-blue-700 mb-1">Assigned</p>
                                <p className="font-playfair text-4xl font-bold text-blue-800">{requestStats.assigned}</p>
                            </div>
                            <div className="bg-green-50 border-2 border-green-300 rounded-xl p-6">
                                <p className="font-poppins text-sm text-green-700 mb-1">Fulfilled</p>
                                <p className="font-playfair text-4xl font-bold text-green-800">{requestStats.fulfilled}</p>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1">
                                    <label className="block font-poppins text-sm font-semibold text-gray-700 mb-2">
                                        <Search size={16} className="inline mr-2" />
                                        Search
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Search by school, district, or token..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent font-poppins"
                                    />
                                </div>
                                <div>
                                    <label className="block font-poppins text-sm font-semibold text-gray-700 mb-2">
                                        <Filter size={16} className="inline mr-2" />
                                        Status
                                    </label>
                                    <select
                                        value={requestStatusFilter}
                                        onChange={(e) => setRequestStatusFilter(e.target.value)}
                                        className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 font-poppins"
                                    >
                                        <option value="all">All Statuses</option>
                                        <option value="pending">Pending</option>
                                        <option value="assigned">Assigned</option>
                                        <option value="fulfilled">Fulfilled</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-poppins text-sm font-semibold text-gray-700 mb-2">
                                        <MapPin size={16} className="inline mr-2" />
                                        District
                                    </label>
                                    <select
                                        value={requestDistrictFilter}
                                        onChange={(e) => setRequestDistrictFilter(e.target.value)}
                                        className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 font-poppins"
                                    >
                                        <option value="all">All Districts</option>
                                        {requestDistricts.map(district => (
                                            <option key={district} value={district}>{district}</option>
                                        ))}
                                    </select>
                                </div>
                                {/* CSV export removed in favor of Google Sheet workflow */}
                            </div>
                        </div>

                        {/* Requests Table */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            {requestsLoading ? (
                                <div className="p-12 text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
                                    <p className="font-poppins text-gray-600 mt-4">Loading requests...</p>
                                </div>
                            ) : filteredRequests.length === 0 ? (
                                <div className="p-12 text-center">
                                    <p className="font-poppins text-gray-600">No requests found</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="px-6 py-4 text-left font-poppins font-semibold text-gray-700">School</th>
                                                <th className="px-6 py-4 text-left font-poppins font-semibold text-gray-700">District</th>
                                                <th className="px-6 py-4 text-left font-poppins font-semibold text-gray-700">Contact</th>
                                                <th className="px-6 py-4 text-left font-poppins font-semibold text-gray-700">Status</th>
                                                <th className="px-6 py-4 text-left font-poppins font-semibold text-gray-700">Date</th>
                                                <th className="px-6 py-4 text-left font-poppins font-semibold text-gray-700">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {filteredRequests.map((request) => (
                                                <tr key={request.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 font-poppins text-gray-900 font-medium">{request.schoolName}</td>
                                                    <td className="px-6 py-4 font-poppins text-gray-700">{request.district}</td>
                                                    <td className="px-6 py-4 font-poppins text-gray-700 text-sm">
                                                        {request.contactPerson}<br />
                                                        <span className="text-gray-500">{request.contactNumber}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <select
                                                            value={request.status}
                                                            onChange={(e) => handleUpdateRequestStatus(request.id, e.target.value)}
                                                            className={`px-3 py-1 rounded-full font-poppins font-bold text-xs uppercase border-2 ${getStatusBadge(request.status)}`}
                                                            disabled={updating}
                                                        >
                                                            <option value="pending">Pending</option>
                                                            <option value="assigned">Assigned</option>
                                                            <option value="fulfilled">Fulfilled</option>
                                                        </select>
                                                    </td>
                                                    <td className="px-6 py-4 font-poppins text-gray-600 text-sm">
                                                        {request.createdAt?.toDate?.()?.toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedRequest(request)
                                                                    setShowRequestModal(true)
                                                                }}
                                                                className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition"
                                                                title="View Details"
                                                            >
                                                                <Eye size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteRequest(request.id)}
                                                                className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                                                                title="Delete"
                                                                disabled={updating}
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Donation Offers Tab */}
                {activeTab === 'donations' && (
                    <div className="space-y-6">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                                <p className="font-poppins text-sm text-gray-600 mb-1">Total Offers</p>
                                <p className="font-playfair text-4xl font-bold text-gray-900">{offerStats.total}</p>
                            </div>
                            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6">
                                <p className="font-poppins text-sm text-yellow-700 mb-1">Pending</p>
                                <p className="font-playfair text-4xl font-bold text-yellow-800">{offerStats.pending}</p>
                            </div>
                            <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6">
                                <p className="font-poppins text-sm text-blue-700 mb-1">Contacted</p>
                                <p className="font-playfair text-4xl font-bold text-blue-800">{offerStats.contacted}</p>
                            </div>
                            <div className="bg-green-50 border-2 border-green-300 rounded-xl p-6">
                                <p className="font-poppins text-sm text-green-700 mb-1">Completed</p>
                                <p className="font-playfair text-4xl font-bold text-green-800">{offerStats.completed}</p>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div>
                                    <label className="block font-poppins text-sm font-semibold text-gray-700 mb-2">
                                        <Filter size={16} className="inline mr-2" />
                                        Status
                                    </label>
                                    <select
                                        value={offerStatusFilter}
                                        onChange={(e) => setOfferStatusFilter(e.target.value)}
                                        className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 font-poppins"
                                    >
                                        <option value="all">All Statuses</option>
                                        <option value="pending">Pending</option>
                                        <option value="contacted">Contacted</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-poppins text-sm font-semibold text-gray-700 mb-2">
                                        <MapPin size={16} className="inline mr-2" />
                                        District
                                    </label>
                                    <select
                                        value={offerDistrictFilter}
                                        onChange={(e) => setOfferDistrictFilter(e.target.value)}
                                        className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 font-poppins"
                                    >
                                        <option value="all">All Districts</option>
                                        {offerDistricts.map(district => (
                                            <option key={district} value={district}>{district}</option>
                                        ))}
                                    </select>
                                </div>
                                {/* CSV export removed in favor of Google Sheet workflow */}
                            </div>
                        </div>

                        {/* Offers Table */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            {offersLoading ? (
                                <div className="p-12 text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
                                    <p className="font-poppins text-gray-600 mt-4">Loading offers...</p>
                                </div>
                            ) : filteredOffers.length === 0 ? (
                                <div className="p-12 text-center">
                                    <p className="font-poppins text-gray-600">No donation offers found</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="px-6 py-4 text-left font-poppins font-semibold text-gray-700">Donor</th>
                                                <th className="px-6 py-4 text-left font-poppins font-semibold text-gray-700">Contact</th>
                                                <th className="px-6 py-4 text-left font-poppins font-semibold text-gray-700">District</th>
                                                <th className="px-6 py-4 text-left font-poppins font-semibold text-gray-700">Items</th>
                                                <th className="px-6 py-4 text-left font-poppins font-semibold text-gray-700">Status</th>
                                                <th className="px-6 py-4 text-left font-poppins font-semibold text-gray-700">Date</th>
                                                <th className="px-6 py-4 text-left font-poppins font-semibold text-gray-700">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {filteredOffers.map((offer) => (
                                                <tr key={offer.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 font-poppins text-gray-900 font-medium">{offer.donorName}</td>
                                                    <td className="px-6 py-4 font-poppins text-gray-700 text-sm">
                                                        {offer.contactNumber}<br />
                                                        <span className="text-gray-500">{offer.email}</span>
                                                    </td>
                                                    <td className="px-6 py-4 font-poppins text-gray-700">{offer.district}</td>
                                                    <td className="px-6 py-4 font-poppins text-gray-700 text-sm max-w-xs truncate">
                                                        {offer.itemsOffered}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <select
                                                            value={offer.status}
                                                            onChange={(e) => handleUpdateOfferStatus(offer.id, e.target.value)}
                                                            className={`px-3 py-1 rounded-full font-poppins font-bold text-xs uppercase border-2 ${getStatusBadge(offer.status)}`}
                                                            disabled={updating}
                                                        >
                                                            <option value="pending">Pending</option>
                                                            <option value="contacted">Contacted</option>
                                                            <option value="completed">Completed</option>
                                                        </select>
                                                    </td>
                                                    <td className="px-6 py-4 font-poppins text-gray-600 text-sm">
                                                        {offer.createdAt?.toDate?.()?.toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedOffer(offer)
                                                                    setShowOfferModal(true)
                                                                }}
                                                                className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition"
                                                                title="View Details"
                                                            >
                                                                <Eye size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteOffer(offer.id)}
                                                                className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                                                                title="Delete"
                                                                disabled={updating}
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Relief Items Tab */}
                {activeTab === 'items' && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="font-playfair text-2xl font-bold text-gray-900">Relief Items</h2>
                                    <p className="font-poppins text-gray-600 text-sm">
                                        Manage the list of predefined relief items used in request forms.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowAddItemForm(!showAddItemForm)}
                                    className="bg-pink-600 text-white px-4 py-2 rounded-lg font-poppins font-semibold hover:bg-pink-700 transition flex items-center gap-2"
                                >
                                    {showAddItemForm ? <X size={18} /> : <Plus size={18} />}
                                    {showAddItemForm ? 'Cancel' : 'Add Item'}
                                </button>
                            </div>

                            {showAddItemForm && (
                                <form onSubmit={handleAddItem} className="bg-pink-50 border border-pink-200 rounded-xl p-4 mb-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block font-poppins text-sm font-semibold text-gray-700 mb-1">
                                                Item ID <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={newItem.id}
                                                onChange={(e) => setNewItem({ ...newItem, id: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                                                placeholder="notebooks (lowercase, no spaces)"
                                                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent font-poppins"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block font-poppins text-sm font-semibold text-gray-700 mb-1">
                                                Name (English) <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={newItem.name}
                                                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                                placeholder="Notebooks"
                                                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent font-poppins"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block font-poppins text-sm font-semibold text-gray-700 mb-1">
                                                Name (Sinhala)
                                            </label>
                                            <input
                                                type="text"
                                                value={newItem.nameSi}
                                                onChange={(e) => setNewItem({ ...newItem, nameSi: e.target.value })}
                                                placeholder="සටහන් පොත්"
                                                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent font-poppins"
                                            />
                                        </div>
                                        <div>
                                            <label className="block font-poppins text-sm font-semibold text-gray-700 mb-1">
                                                Category <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                value={newItem.category}
                                                onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                                                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent font-poppins"
                                                required
                                            >
                                                <option value="">Select category</option>
                                                {categories.map(cat => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block font-poppins text-sm font-semibold text-gray-700 mb-1">
                                                Sort Order
                                            </label>
                                            <input
                                                type="number"
                                                value={newItem.sortOrder}
                                                onChange={(e) => setNewItem({ ...newItem, sortOrder: e.target.value })}
                                                placeholder="0"
                                                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent font-poppins"
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-4 flex gap-3">
                                        <button
                                            type="submit"
                                            className="bg-green-600 text-white px-5 py-2 rounded-lg font-poppins font-semibold hover:bg-green-700 transition flex items-center gap-2"
                                        >
                                            <Plus size={16} />
                                            Save Item
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowAddItemForm(false)}
                                            className="bg-gray-200 text-gray-700 px-5 py-2 rounded-lg font-poppins font-semibold hover:bg-gray-300 transition"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            )}

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-200">
                                            <th className="px-4 py-3 text-left font-poppins text-xs font-semibold text-gray-600 uppercase tracking-wide">Order</th>
                                            <th className="px-4 py-3 text-left font-poppins text-xs font-semibold text-gray-600 uppercase tracking-wide">ID</th>
                                            <th className="px-4 py-3 text-left font-poppins text-xs font-semibold text-gray-600 uppercase tracking-wide">Name (EN)</th>
                                            <th className="px-4 py-3 text-left font-poppins text-xs font-semibold text-gray-600 uppercase tracking-wide">Name (SI)</th>
                                            <th className="px-4 py-3 text-left font-poppins text-xs font-semibold text-gray-600 uppercase tracking-wide">Category</th>
                                            <th className="px-4 py-3 text-left font-poppins text-xs font-semibold text-gray-600 uppercase tracking-wide">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {itemsLoading ? (
                                            <tr>
                                                <td colSpan={6} className="px-4 py-6 text-center font-poppins text-gray-500">
                                                    Loading relief items...
                                                </td>
                                            </tr>
                                        ) : reliefItems.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-4 py-6 text-center font-poppins text-gray-500">
                                                    No relief items found. Add your first item.
                                                </td>
                                            </tr>
                                        ) : (
                                            reliefItems.map((item) => (
                                                <tr key={item.docId} className="border-b border-gray-100 hover:bg-gray-50">
                                                    {editingItem?.docId === item.docId ? (
                                                        <>
                                                            <td className="px-4 py-3">
                                                                <input
                                                                    type="number"
                                                                    value={editingItem.sortOrder}
                                                                    onChange={(e) => setEditingItem({ ...editingItem, sortOrder: e.target.value })}
                                                                    className="w-20 px-2 py-1 border-2 border-gray-300 rounded font-poppins text-sm"
                                                                />
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <input
                                                                    type="text"
                                                                    value={editingItem.id}
                                                                    onChange={(e) => setEditingItem({ ...editingItem, id: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                                                                    className="w-32 px-2 py-1 border-2 border-gray-300 rounded font-poppins text-sm"
                                                                />
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <input
                                                                    type="text"
                                                                    value={editingItem.name}
                                                                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                                                                    className="w-40 px-2 py-1 border-2 border-gray-300 rounded font-poppins text-sm"
                                                                />
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <input
                                                                    type="text"
                                                                    value={editingItem.nameSi}
                                                                    onChange={(e) => setEditingItem({ ...editingItem, nameSi: e.target.value })}
                                                                    className="w-40 px-2 py-1 border-2 border-gray-300 rounded font-poppins text-sm"
                                                                />
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <select
                                                                    value={editingItem.category}
                                                                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                                                                    className="w-32 px-2 py-1 border-2 border-gray-300 rounded font-poppins text-sm"
                                                                >
                                                                    {categories.map(cat => (
                                                                        <option key={cat} value={cat}>{cat}</option>
                                                                    ))}
                                                                </select>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={() => handleUpdateItem(item.docId)}
                                                                        className="bg-green-600 text-white px-3 py-1 rounded-lg text-xs font-poppins hover:bg-green-700 transition flex items-center gap-1"
                                                                    >
                                                                        <Save size={14} />
                                                                        Save
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setEditingItem(null)}
                                                                        className="bg-gray-300 text-gray-800 px-3 py-1 rounded-lg text-xs font-poppins hover:bg-gray-400 transition"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <td className="px-4 py-3 font-poppins text-sm text-gray-700">{item.sortOrder}</td>
                                                            <td className="px-4 py-3 font-mono text-xs text-gray-600">{item.id}</td>
                                                            <td className="px-4 py-3 font-poppins text-sm text-gray-900 font-semibold">{item.name}</td>
                                                            <td className="px-4 py-3 font-poppins text-sm text-gray-700">{item.nameSi || '-'}</td>
                                                            <td className="px-4 py-3">
                                                                <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full font-poppins text-xs font-semibold">
                                                                    {item.category}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={() => setEditingItem({ ...item })}
                                                                        className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-poppins hover:bg-blue-700 transition flex items-center gap-1"
                                                                    >
                                                                        <Edit2 size={14} />
                                                                        Edit
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteItem(item.docId, item.name)}
                                                                        className="bg-red-600 text-white px-3 py-1 rounded-lg text-xs font-poppins hover:bg-red-700 transition flex items-center gap-1"
                                                                    >
                                                                        <Trash2 size={14} />
                                                                        Delete
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
                    </div>
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h2 className="font-playfair text-2xl font-bold text-gray-900 mb-2">Google Sheet Link</h2>
                            <p className="font-poppins text-gray-600 text-sm mb-4">
                                Store the Google Sheet URL used for managing detailed reports of requests and donations.
                            </p>
                            <div className="space-y-3 max-w-2xl">
                                <input
                                    type="url"
                                    value={googleSheetUrl}
                                    onChange={(e) => setGoogleSheetUrl(e.target.value)}
                                    placeholder="https://docs.google.com/spreadsheets/..."
                                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent font-poppins"
                                />
                                <div className="flex flex-wrap gap-3 mt-2">
                                    <button
                                        onClick={saveGoogleSheetUrl}
                                        disabled={savingSheetUrl}
                                        className="bg-pink-600 text-white px-5 py-2 rounded-lg font-poppins font-semibold hover:bg-pink-700 disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center gap-2"
                                    >
                                        <Save size={16} />
                                        {savingSheetUrl ? 'Saving...' : 'Save Link'}
                                    </button>
                                    {googleSheetUrl && (
                                        <a
                                            href={googleSheetUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-5 py-2 border-2 border-gray-300 rounded-lg font-poppins text-gray-800 hover:bg-gray-50 transition"
                                        >
                                            <ExternalLink size={16} />
                                            Open Google Sheet
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Request Detail Modal */}
                {showRequestModal && selectedRequest && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowRequestModal(false)}>
                        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            <div className="sticky top-0 bg-gradient-to-r from-pink-600 to-purple-600 text-white p-6 rounded-t-2xl flex items-start justify-between">
                                <div>
                                    <h2 className="font-playfair text-2xl font-bold mb-2">{selectedRequest.schoolName}</h2>
                                    <span className={`inline-block px-3 py-1 rounded-full font-poppins font-bold text-xs border-2 uppercase ${getStatusBadge(selectedRequest.status)}`}>
                                        {selectedRequest.status}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setShowRequestModal(false)}
                                    className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="font-poppins font-semibold text-gray-700 text-sm">District</p>
                                        <p className="font-poppins text-gray-900">{selectedRequest.district}</p>
                                    </div>
                                    <div>
                                        <p className="font-poppins font-semibold text-gray-700 text-sm">Contact Person</p>
                                        <p className="font-poppins text-gray-900">{selectedRequest.contactPerson}</p>
                                    </div>
                                    <div>
                                        <p className="font-poppins font-semibold text-gray-700 text-sm">Contact Number</p>
                                        <p className="font-poppins text-gray-900">{selectedRequest.contactNumber}</p>
                                    </div>
                                    <div>
                                        <p className="font-poppins font-semibold text-gray-700 text-sm">Token</p>
                                        <p className="font-mono text-sm text-pink-600 font-bold">{selectedRequest.requestToken}</p>
                                    </div>
                                </div>

                                {selectedRequest.address && (
                                    <div>
                                        <p className="font-poppins font-semibold text-gray-700 text-sm">Address</p>
                                        <p className="font-poppins text-gray-900">{selectedRequest.address}</p>
                                    </div>
                                )}

                                {selectedRequest.description && (
                                    <div>
                                        <p className="font-poppins font-semibold text-gray-700 text-sm">Description</p>
                                        <p className="font-poppins text-gray-900">{selectedRequest.description}</p>
                                    </div>
                                )}

                                <div>
                                    <p className="font-poppins font-semibold text-gray-900 mb-2">Materials Requested</p>
                                    <div className="space-y-2">
                                        {selectedRequest.items?.map((item, index) => (
                                            <div key={index} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                                                <span className="font-poppins text-gray-900">{item.name}</span>
                                                <span className="font-poppins font-bold text-pink-600">{item.quantity}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Offer Detail Modal */}
                {showOfferModal && selectedOffer && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowOfferModal(false)}>
                        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            <div className="sticky top-0 bg-gradient-to-r from-pink-600 to-purple-600 text-white p-6 rounded-t-2xl flex items-start justify-between">
                                <div>
                                    <h2 className="font-playfair text-2xl font-bold mb-2">💝 Donation Offer</h2>
                                    <span className={`inline-block px-3 py-1 rounded-full font-poppins font-bold text-xs border-2 uppercase ${getStatusBadge(selectedOffer.status)}`}>
                                        {selectedOffer.status}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setShowOfferModal(false)}
                                    className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="font-poppins font-semibold text-gray-700 text-sm">Donor Name</p>
                                        <p className="font-poppins text-gray-900">{selectedOffer.donorName}</p>
                                    </div>
                                    <div>
                                        <p className="font-poppins font-semibold text-gray-700 text-sm">Contact Number</p>
                                        <p className="font-poppins text-gray-900">{selectedOffer.contactNumber}</p>
                                    </div>
                                    <div>
                                        <p className="font-poppins font-semibold text-gray-700 text-sm">Email</p>
                                        <p className="font-poppins text-gray-900">{selectedOffer.email}</p>
                                    </div>
                                    <div>
                                        <p className="font-poppins font-semibold text-gray-700 text-sm">District</p>
                                        <p className="font-poppins text-gray-900">{selectedOffer.district}</p>
                                    </div>
                                </div>

                                <div>
                                    <p className="font-poppins font-semibold text-gray-700 text-sm">Items Offered</p>
                                    <p className="font-poppins text-gray-900">{selectedOffer.itemsOffered}</p>
                                </div>

                                {selectedOffer.message && (
                                    <div>
                                        <p className="font-poppins font-semibold text-gray-700 text-sm">Message</p>
                                        <p className="font-poppins text-gray-900">{selectedOffer.message}</p>
                                    </div>
                                )}

                                <div>
                                    <p className="font-poppins font-semibold text-gray-700 text-sm">Submitted</p>
                                    <p className="font-poppins text-gray-900">
                                        {selectedOffer.createdAt?.toDate?.()?.toLocaleDateString()} at {selectedOffer.createdAt?.toDate?.()?.toLocaleTimeString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
