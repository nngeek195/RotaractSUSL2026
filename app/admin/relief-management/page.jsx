'use client'
import { useState, useEffect } from 'react'
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Search, Filter, Download, CheckCircle, Clock, UserCheck, Trash2, Eye, X } from 'lucide-react'

export default function ReliefManagementPage() {
    const [requests, setRequests] = useState([])
    const [filteredRequests, setFilteredRequests] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [districtFilter, setDistrictFilter] = useState('all')
    const [selectedRequest, setSelectedRequest] = useState(null)
    const [showModal, setShowModal] = useState(false)
    const [updating, setUpdating] = useState(false)

    // Fetch all requests
    useEffect(() => {
        fetchRequests()
    }, [])

    const fetchRequests = async () => {
        setLoading(true)
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
            setLoading(false)
        }
    }

    // Apply filters
    useEffect(() => {
        let filtered = requests

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(req =>
                req.schoolName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                req.district?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                req.requestToken?.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(req => req.status === statusFilter)
        }

        // District filter
        if (districtFilter !== 'all') {
            filtered = filtered.filter(req => req.district === districtFilter)
        }

        setFilteredRequests(filtered)
    }, [searchTerm, statusFilter, districtFilter, requests])

    // Get unique districts
    const districts = [...new Set(requests.map(r => r.district))].filter(Boolean).sort()

    // Stats
    const stats = {
        total: requests.length,
        pending: requests.filter(r => r.status === 'pending').length,
        assigned: requests.filter(r => r.status === 'assigned').length,
        fulfilled: requests.filter(r => r.status === 'fulfilled').length
    }

    // Update status
    const handleUpdateStatus = async (requestId, newStatus) => {
        setUpdating(true)
        try {
            const requestRef = doc(db, 'materialRequests', requestId)
            await updateDoc(requestRef, {
                status: newStatus,
                updatedAt: new Date()
            })

            // Update local state
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

    // Delete request
    const handleDeleteRequest = async (requestId) => {
        if (!confirm('Are you sure you want to delete this request? This action cannot be undone.')) {
            return
        }

        setUpdating(true)
        try {
            await deleteDoc(doc(db, 'materialRequests', requestId))
            setRequests(prev => prev.filter(req => req.id !== requestId))
            setShowModal(false)
            alert('Request deleted successfully')
        } catch (error) {
            console.error('Error deleting request:', error)
            alert('Failed to delete request')
        } finally {
            setUpdating(false)
        }
    }

    // Export to CSV
    const handleExport = () => {
        const csvData = filteredRequests.map(req => ({
            'Request Token': req.requestToken,
            'School Name': req.schoolName,
            'District': req.district,
            'Address': req.address,
            'Contact Person': req.contactPerson,
            'Contact Number': req.contactNumber,
            'Status': req.status,
            'Items Needed': req.items?.map(item => `${item.name} (${item.quantity})`).join('; '),
            'Created': req.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A',
            'Updated': req.updatedAt?.toDate?.()?.toLocaleDateString() || 'N/A'
        }))

        const headers = Object.keys(csvData[0] || {}).join(',')
        const rows = csvData.map(row => Object.values(row).map(v => `"${v}"`).join(','))
        const csv = [headers, ...rows].join('\n')

        const blob = new Blob([csv], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `relief-requests-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800'
            case 'assigned': return 'bg-blue-100 text-blue-800'
            case 'fulfilled': return 'bg-green-100 text-green-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending': return <Clock className="w-4 h-4" />
            case 'assigned': return <UserCheck className="w-4 h-4" />
            case 'fulfilled': return <CheckCircle className="w-4 h-4" />
            default: return null
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Playfair Display' }}>
                        Relief Request Management
                    </h1>
                    <p className="text-gray-600">Manage flood relief material requests from affected schools</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
                        <div className="text-sm text-gray-600">Total Requests</div>
                    </div>
                    <div className="bg-yellow-50 p-6 rounded-lg shadow">
                        <div className="text-3xl font-bold text-yellow-800">{stats.pending}</div>
                        <div className="text-sm text-yellow-700">Pending</div>
                    </div>
                    <div className="bg-blue-50 p-6 rounded-lg shadow">
                        <div className="text-3xl font-bold text-blue-800">{stats.assigned}</div>
                        <div className="text-sm text-blue-700">Assigned</div>
                    </div>
                    <div className="bg-green-50 p-6 rounded-lg shadow">
                        <div className="text-3xl font-bold text-green-800">{stats.fulfilled}</div>
                        <div className="text-sm text-green-700">Fulfilled</div>
                    </div>
                </div>

                {/* Filters & Actions */}
                <div className="bg-white p-6 rounded-lg shadow mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search school, district, token..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                            />
                        </div>

                        {/* Status Filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="assigned">Assigned</option>
                            <option value="fulfilled">Fulfilled</option>
                        </select>

                        {/* District Filter */}
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

                        {/* Export Button */}
                        <button
                            onClick={handleExport}
                            disabled={filteredRequests.length === 0}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Download className="w-5 h-5" />
                            Export CSV
                        </button>
                    </div>
                </div>

                {/* Requests Table */}
                {loading ? (
                    <div className="bg-white p-12 rounded-lg shadow text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading requests...</p>
                    </div>
                ) : filteredRequests.length === 0 ? (
                    <div className="bg-white p-12 rounded-lg shadow text-center">
                        <Filter className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600">No requests found matching your filters</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Token</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">School</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">District</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredRequests.map((request) => (
                                        <tr key={request.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-mono text-gray-900">{request.requestToken}</div>
                                                <div className="text-xs text-gray-500">
                                                    {request.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">{request.schoolName}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{request.district}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900">{request.contactPerson}</div>
                                                <div className="text-xs text-gray-500">{request.contactNumber}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                                                    {getStatusIcon(request.status)}
                                                    {request.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900">{request.items?.length || 0} items</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <button
                                                    onClick={() => {
                                                        setSelectedRequest(request)
                                                        setShowModal(true)
                                                    }}
                                                    className="text-pink-600 hover:text-pink-900 mr-4"
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
            {showModal && selectedRequest && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Playfair Display' }}>
                                Request Details
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-6">
                            {/* Request Token & Status */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Request Token</p>
                                        <p className="font-mono font-bold text-lg">{selectedRequest.requestToken}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Current Status</p>
                                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedRequest.status)}`}>
                                            {getStatusIcon(selectedRequest.status)}
                                            {selectedRequest.status}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* School Information */}
                            <div>
                                <h3 className="text-lg font-semibold mb-3">School Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600">School Name</p>
                                        <p className="font-medium">{selectedRequest.schoolName}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">District</p>
                                        <p className="font-medium">{selectedRequest.district}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-sm text-gray-600">Address</p>
                                        <p className="font-medium">{selectedRequest.address}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Contact Person</p>
                                        <p className="font-medium">{selectedRequest.contactPerson}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Contact Number</p>
                                        <p className="font-medium">{selectedRequest.contactNumber}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Materials Needed */}
                            <div>
                                <h3 className="text-lg font-semibold mb-3">Materials Needed</h3>
                                <div className="space-y-2">
                                    {selectedRequest.items?.map((item, index) => (
                                        <div key={index} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                                            <span className="font-medium">{item.name}</span>
                                            <span className="text-gray-600">Quantity: {item.quantity}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Timestamps */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-600">Submitted</p>
                                    <p className="font-medium">
                                        {selectedRequest.createdAt?.toDate?.()?.toLocaleString() || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Last Updated</p>
                                    <p className="font-medium">
                                        {selectedRequest.updatedAt?.toDate?.()?.toLocaleString() || 'N/A'}
                                    </p>
                                </div>
                            </div>

                            {/* Status Update Buttons */}
                            <div>
                                <h3 className="text-lg font-semibold mb-3">Update Status</h3>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleUpdateStatus(selectedRequest.id, 'pending')}
                                        disabled={updating || selectedRequest.status === 'pending'}
                                        className="flex-1 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                    >
                                        <Clock className="w-4 h-4 inline mr-2" />
                                        Pending
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStatus(selectedRequest.id, 'assigned')}
                                        disabled={updating || selectedRequest.status === 'assigned'}
                                        className="flex-1 px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                    >
                                        <UserCheck className="w-4 h-4 inline mr-2" />
                                        Assigned
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStatus(selectedRequest.id, 'fulfilled')}
                                        disabled={updating || selectedRequest.status === 'fulfilled'}
                                        className="flex-1 px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                    >
                                        <CheckCircle className="w-4 h-4 inline mr-2" />
                                        Fulfilled
                                    </button>
                                </div>
                            </div>

                            {/* Delete Button */}
                            <div className="border-t pt-4">
                                <button
                                    onClick={() => handleDeleteRequest(selectedRequest.id)}
                                    disabled={updating}
                                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                >
                                    <Trash2 className="w-4 h-4 inline mr-2" />
                                    Delete Request
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
