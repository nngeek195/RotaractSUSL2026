'use client'
import { useState, useEffect } from 'react'
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Heart, Phone, Mail, MapPin, Package, Trash2, Eye, X, CheckCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { confirmToast } from '@/lib/confirmToast'

export default function DonationOffersPage() {
    const [offers, setOffers] = useState([])
    const [filteredOffers, setFilteredOffers] = useState([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState('all')
    const [districtFilter, setDistrictFilter] = useState('all')
    const [selectedOffer, setSelectedOffer] = useState(null)
    const [showModal, setShowModal] = useState(false)
    const [updating, setUpdating] = useState(false)

    useEffect(() => {
        fetchOffers()
    }, [])

    useEffect(() => {
        applyFilters()
    }, [offers, statusFilter, districtFilter])

    const fetchOffers = async () => {
        setLoading(true)
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
            toast.error('Failed to load donation offers')
        } finally {
            setLoading(false)
        }
    }

    const applyFilters = () => {
        let filtered = [...offers]

        if (statusFilter !== 'all') {
            filtered = filtered.filter(offer => offer.status === statusFilter)
        }

        if (districtFilter !== 'all') {
            filtered = filtered.filter(offer => offer.district === districtFilter)
        }

        setFilteredOffers(filtered)
    }

    const districts = [...new Set(offers.map(o => o.district))].filter(Boolean).sort()

    const stats = {
        total: offers.length,
        pending: offers.filter(o => o.status === 'pending').length,
        contacted: offers.filter(o => o.status === 'contacted').length,
        completed: offers.filter(o => o.status === 'completed').length
    }

    const handleUpdateStatus = async (offerId, newStatus) => {
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

            toast.success('Status updated successfully!')
        } catch (error) {
            console.error('Error updating status:', error)
            toast.error('Failed to update status')
        } finally {
            setUpdating(false)
        }
    }

    const handleDeleteOffer = async (offerId) => {
        if (!(await confirmToast({ message: 'Are you sure you want to delete this donation offer?', confirmLabel: "Delete" }))) {
            return
        }

        setUpdating(true)
        try {
            await deleteDoc(doc(db, 'donationOffers', offerId))
            setOffers(prev => prev.filter(offer => offer.id !== offerId))
            setShowModal(false)
            toast.success('Donation offer deleted successfully')
        } catch (error) {
            console.error('Error deleting offer:', error)
            toast.error('Failed to delete offer')
        } finally {
            setUpdating(false)
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800'
            case 'contacted': return 'bg-blue-100 text-blue-800'
            case 'completed': return 'bg-green-100 text-green-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Playfair Display' }}>
                        Donation Offers
                    </h1>
                    <p className="text-gray-600">Manage offers from donors willing to help flood-affected schools</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
                        <div className="text-sm text-gray-600">Total Offers</div>
                    </div>
                    <div className="bg-yellow-50 p-6 rounded-lg shadow">
                        <div className="text-3xl font-bold text-yellow-800">{stats.pending}</div>
                        <div className="text-sm text-yellow-700">Pending</div>
                    </div>
                    <div className="bg-blue-50 p-6 rounded-lg shadow">
                        <div className="text-3xl font-bold text-blue-800">{stats.contacted}</div>
                        <div className="text-sm text-blue-700">Contacted</div>
                    </div>
                    <div className="bg-green-50 p-6 rounded-lg shadow">
                        <div className="text-3xl font-bold text-green-800">{stats.completed}</div>
                        <div className="text-sm text-green-700">Completed</div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-6 rounded-lg shadow mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="contacted">Contacted</option>
                            <option value="completed">Completed</option>
                        </select>

                        <select
                            value={districtFilter}
                            onChange={(e) => setDistrictFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        >
                            <option value="all">All Districts</option>
                            {districts.map(district => (
                                <option key={district} value={district}>{district}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Offers Table */}
                {loading ? (
                    <div className="bg-white p-12 rounded-lg shadow text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading offers...</p>
                    </div>
                ) : filteredOffers.length === 0 ? (
                    <div className="bg-white p-12 rounded-lg shadow text-center">
                        <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600">No donation offers found</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Donor</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">District</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items Offered</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredOffers.map((offer) => (
                                        <tr key={offer.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">{offer.donorName}</div>
                                                <div className="text-xs text-gray-500">
                                                    {offer.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900">{offer.contactNumber}</div>
                                                {offer.email && (
                                                    <div className="text-xs text-gray-500">{offer.email}</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{offer.district || 'N/A'}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900 max-w-xs truncate">
                                                    {offer.itemsOffered}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(offer.status)}`}>
                                                    {offer.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <button
                                                    onClick={() => {
                                                        setSelectedOffer(offer)
                                                        setShowModal(true)
                                                    }}
                                                    className="text-pink-600 hover:text-pink-900"
                                                >
                                                    <Eye className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {showModal && selectedOffer && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Playfair Display' }}>
                                Donation Offer Details
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Status */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600 mb-1">Current Status</p>
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedOffer.status)}`}>
                                    {selectedOffer.status}
                                </span>
                            </div>

                            {/* Donor Information */}
                            <div>
                                <h3 className="text-lg font-semibold mb-3">Donor Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600">Name</p>
                                        <p className="font-medium">{selectedOffer.donorName}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">District</p>
                                        <p className="font-medium">{selectedOffer.district || 'Not specified'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Contact Number</p>
                                        <p className="font-medium">{selectedOffer.contactNumber}</p>
                                    </div>
                                    {selectedOffer.email && (
                                        <div>
                                            <p className="text-sm text-gray-600">Email</p>
                                            <p className="font-medium">{selectedOffer.email}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Items Offered */}
                            <div>
                                <h3 className="text-lg font-semibold mb-3">Items Offered</h3>
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <p className="text-gray-800 whitespace-pre-wrap">{selectedOffer.itemsOffered}</p>
                                </div>
                            </div>

                            {/* Message */}
                            {selectedOffer.message && (
                                <div>
                                    <h3 className="text-lg font-semibold mb-3">Additional Message</h3>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-gray-800 whitespace-pre-wrap">{selectedOffer.message}</p>
                                    </div>
                                </div>
                            )}

                            {/* Timestamps */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-600">Submitted</p>
                                    <p className="font-medium">
                                        {selectedOffer.createdAt?.toDate?.()?.toLocaleString() || 'N/A'}
                                    </p>
                                </div>
                                {selectedOffer.updatedAt && (
                                    <div>
                                        <p className="text-gray-600">Last Updated</p>
                                        <p className="font-medium">
                                            {selectedOffer.updatedAt?.toDate?.()?.toLocaleString() || 'N/A'}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Status Update Buttons */}
                            <div>
                                <h3 className="text-lg font-semibold mb-3">Update Status</h3>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleUpdateStatus(selectedOffer.id, 'pending')}
                                        disabled={updating || selectedOffer.status === 'pending'}
                                        className="flex-1 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                    >
                                        <Clock className="w-4 h-4 inline mr-2" />
                                        Pending
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStatus(selectedOffer.id, 'contacted')}
                                        disabled={updating || selectedOffer.status === 'contacted'}
                                        className="flex-1 px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                    >
                                        <Phone className="w-4 h-4 inline mr-2" />
                                        Contacted
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStatus(selectedOffer.id, 'completed')}
                                        disabled={updating || selectedOffer.status === 'completed'}
                                        className="flex-1 px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                    >
                                        <CheckCircle className="w-4 h-4 inline mr-2" />
                                        Completed
                                    </button>
                                </div>
                            </div>

                            {/* Delete Button */}
                            <div className="border-t pt-4">
                                <button
                                    onClick={() => handleDeleteOffer(selectedOffer.id)}
                                    disabled={updating}
                                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                >
                                    <Trash2 className="w-4 h-4 inline mr-2" />
                                    Delete Offer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
