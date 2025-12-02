'use client'
import { useState, useEffect } from 'react'
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Search, Filter, Download, CheckCircle, Clock, UserCheck, Trash2, Eye, X, Heart, Phone, Mail, MapPin, Package } from 'lucide-react'

export default function ReliefAdminPage() {
    const [activeTab, setActiveTab] = useState('requests') // 'requests' or 'donations'

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

    // Export to CSV
    const exportToCSV = (data, type) => {
        if (data.length === 0) {
            alert('No data to export')
            return
        }

        let csvContent = ''

        if (type === 'requests') {
            const headers = ['School Name', 'District', 'Contact Person', 'Contact Number', 'Status', 'Token', 'Created At']
            csvContent = headers.join(',') + '\n'

            data.forEach(req => {
                const row = [
                    req.schoolName || '',
                    req.district || '',
                    req.contactPerson || '',
                    req.contactNumber || '',
                    req.status || '',
                    req.requestToken || '',
                    req.createdAt?.toDate?.()?.toLocaleDateString() || ''
                ]
                csvContent += row.join(',') + '\n'
            })
        } else {
            const headers = ['Donor Name', 'Contact Number', 'Email', 'District', 'Items Offered', 'Status', 'Created At']
            csvContent = headers.join(',') + '\n'

            data.forEach(offer => {
                const row = [
                    offer.donorName || '',
                    offer.contactNumber || '',
                    offer.email || '',
                    offer.district || '',
                    offer.itemsOffered || '',
                    offer.status || '',
                    offer.createdAt?.toDate?.()?.toLocaleDateString() || ''
                ]
                csvContent += row.join(',') + '\n'
            })
        }

        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${type}-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
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
                        Manage material requests and donation offers
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
                                <div className="flex items-end">
                                    <button
                                        onClick={() => exportToCSV(filteredRequests, 'requests')}
                                        className="bg-green-600 text-white px-6 py-2 rounded-lg font-poppins font-bold hover:bg-green-700 transition flex items-center gap-2"
                                    >
                                        <Download size={18} />
                                        Export CSV
                                    </button>
                                </div>
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
                                <div className="flex items-end">
                                    <button
                                        onClick={() => exportToCSV(filteredOffers, 'donations')}
                                        className="bg-green-600 text-white px-6 py-2 rounded-lg font-poppins font-bold hover:bg-green-700 transition flex items-center gap-2"
                                    >
                                        <Download size={18} />
                                        Export CSV
                                    </button>
                                </div>
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
