'use client'
import { useState, useEffect } from 'react'
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Search, Filter, Download, CheckCircle, Clock, UserCheck, Trash2, Eye, X, Heart, Phone, Mail, MapPin, Package, Settings, Plus, Edit2, Save, ExternalLink, ClipboardList, Shield } from 'lucide-react'
import { useAuth } from '@/app/contexts/AuthContext'

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
        fetchConfig()
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
            alert('Settings saved successfully!')
        } catch (error) {
            console.error('Error saving config:', error)
            alert('Failed to save settings')
        } finally {
            setSavingConfig(false)
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
                globalFulfilled: parseInt(newItem.globalFulfilled) || 0,
                createdAt: new Date(),
                updatedAt: new Date()
            })

            setNewItem({ id: '', name: '', nameSi: '', category: '', sortOrder: 0, globalFulfilled: 0 })
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
                globalFulfilled: parseInt(editingItem.globalFulfilled) || 0,
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
            fetchReliefItems()
            alert('Item deleted successfully!')
        } catch (error) {
            console.error('Error deleting item:', error)
            alert('Failed to delete item')
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
        <div className="min-h-screen bg-gray-50 p-4 md:p-6 overflow-x-hidden">
            <div className="max-w-7xl mx-auto space-y-16">
                {/* Header */}
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="font-playfair text-4xl font-bold text-gray-900">
                            🇱🇰 Flood Relief Management
                        </h1>
                        {isAdmin && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold font-poppins uppercase tracking-wide">
                                <Shield size={12} /> Admin
                            </span>
                        )}
                        {isCommittee && !isAdmin && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-bold font-poppins uppercase tracking-wide">
                                <Shield size={12} /> Committee
                            </span>
                        )}
                    </div>
                    <p className="font-poppins text-gray-600">
                        Manage requests, donations, items, and Google Sheet link
                    </p>
                </div>

                {/* Tabs - Desktop Only */}
                <div className="hidden md:flex bg-white rounded-xl shadow-sm border border-gray-200">
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
                        onClick={() => setActiveTab('fulfillment')}
                        className={`flex-1 px-6 py-4 font-poppins font-semibold text-base transition flex items-center justify-center gap-2 ${activeTab === 'fulfillment'
                            ? 'border-b-4 border-pink-600 text-pink-600 bg-pink-50'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                    >
                        <ClipboardList size={20} />
                        Fulfillment
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

                {/* Fulfillment Section */}
                <section className={`space-y-6 ${activeTab === 'fulfillment' ? '' : 'md:hidden'}`}>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-purple-100 p-3 rounded-xl text-purple-600">
                                    <ClipboardList size={24} />
                                </div>
                                <div>
                                    <h2 className="font-playfair text-3xl font-bold text-gray-900">Fulfillment Status</h2>
                                    <p className="font-poppins text-gray-600 text-sm">
                                        Track overall demand and update fulfilled quantities.
                                    </p>
                                </div>
                            </div>

                            {/* Mobile Card View */}
                            <div className="block md:hidden space-y-4">
                                {itemStats.map((stat) => (
                                    <div key={stat.docId} className="bg-white p-4 rounded-xl border-2 border-gray-100">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h3 className="font-poppins font-bold text-gray-900">{stat.name}</h3>
                                                <span className="text-xs font-poppins text-gray-500">{stat.category}</span>
                                            </div>
                                            <span className={`px-2 py-1 rounded text-xs font-bold font-poppins ${stat.progress >= 100 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                {stat.progress.toFixed(0)}%
                                            </span>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div className="bg-blue-50 p-2 rounded-lg text-center">
                                                <p className="text-xs font-poppins text-blue-600 font-semibold">Requested</p>
                                                <p className="text-lg font-playfair font-bold text-blue-800">{stat.totalRequested}</p>
                                            </div>
                                            <div className="bg-purple-50 p-2 rounded-lg text-center">
                                                <p className="text-xs font-poppins text-purple-600 font-semibold">Pending</p>
                                                <p className="text-lg font-playfair font-bold text-purple-800">{Math.max(0, stat.totalRequested - (stat.globalFulfilled || 0))}</p>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-poppins font-semibold text-gray-600 mb-1">
                                                Total Fulfilled (Update Here)
                                            </label>
                                            <input 
                                                type="number"
                                                value={stat.globalFulfilled || 0}
                                                onChange={(e) => handleUpdateFulfilled(stat.docId, e.target.value)}
                                                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg font-poppins focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-200">
                                            <th className="px-6 py-4 text-left font-poppins font-semibold text-gray-700">Item Name</th>
                                            <th className="px-6 py-4 text-left font-poppins font-semibold text-gray-700">Category</th>
                                            <th className="px-6 py-4 text-center font-poppins font-semibold text-gray-700">Requested</th>
                                            <th className="px-6 py-4 text-center font-poppins font-semibold text-gray-700">Fulfilled (Editable)</th>
                                            <th className="px-6 py-4 text-center font-poppins font-semibold text-gray-700">Pending</th>
                                            <th className="px-6 py-4 text-center font-poppins font-semibold text-gray-700">Progress</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {itemStats.map((stat) => (
                                            <tr key={stat.docId} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 font-poppins text-gray-900 font-medium">{stat.name}</td>
                                                <td className="px-6 py-4">
                                                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold uppercase font-poppins">
                                                        {stat.category}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center font-playfair text-lg font-bold text-blue-600">
                                                    {stat.totalRequested}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <input 
                                                        type="number"
                                                        value={stat.globalFulfilled || 0}
                                                        onChange={(e) => handleUpdateFulfilled(stat.docId, e.target.value)}
                                                        className="w-24 px-3 py-1 border-2 border-gray-300 rounded-lg font-poppins text-center focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 text-center font-playfair text-lg font-bold text-purple-600">
                                                    {Math.max(0, stat.totalRequested - (stat.globalFulfilled || 0))}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 bg-gray-200 rounded-full h-2 w-24">
                                                            <div 
                                                                className={`h-2 rounded-full ${stat.progress >= 100 ? 'bg-green-500' : 'bg-yellow-500'}`}
                                                                style={{ width: `${Math.min(stat.progress, 100)}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-xs font-bold font-poppins text-gray-600">{stat.progress.toFixed(0)}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                </section>

                {/* Material Requests Section */}
                <section className={`space-y-6 ${activeTab === 'requests' ? '' : 'md:hidden'}`}>
                    <div className="flex items-center gap-3 md:hidden">
                        <div className="bg-pink-100 p-3 rounded-xl text-pink-600">
                            <Package size={24} />
                        </div>
                        <h2 className="font-playfair text-3xl font-bold text-gray-900">Material Requests</h2>
                    </div>
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
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
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
                                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 font-poppins"
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
                                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 font-poppins"
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
                        ) : (
                            <>
                                {/* Mobile Card View */}
                                <div className="block md:hidden divide-y divide-gray-200">
                                    {filteredRequests.map((request) => (
                                        <div key={request.id} className="p-4 bg-white">
                                            <div className="mb-3">
                                                <h3 className="font-poppins font-bold text-gray-900 text-lg">{request.schoolName}</h3>
                                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-semibold font-poppins">
                                                        {request.district}
                                                    </span>
                                                    <span className="text-xs text-gray-400 font-poppins">
                                                        {request.createdAt?.toDate?.()?.toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="mb-4">
                                                <select
                                                    value={request.status}
                                                    onChange={(e) => handleUpdateRequestStatus(request.id, e.target.value)}
                                                    className={`w-full px-3 py-2 rounded-lg font-poppins font-bold text-xs uppercase border-2 ${getStatusBadge(request.status)}`}
                                                    disabled={updating}
                                                >
                                                    <option value="pending">Pending</option>
                                                    <option value="assigned">Assigned</option>
                                                    <option value="fulfilled">Fulfilled</option>
                                                </select>
                                            </div>

                                            <div className="mb-4">
                                                <p className="font-poppins text-sm text-gray-700 flex items-center gap-2">
                                                    <UserCheck size={14} className="text-gray-400" />
                                                    {request.contactPerson}
                                                </p>
                                                <p className="font-poppins text-sm text-gray-700 flex items-center gap-2 mt-1">
                                                    <Phone size={14} className="text-gray-400" />
                                                    {request.contactNumber}
                                                </p>
                                            </div>

                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => {
                                                        setSelectedRequest(request)
                                                        setShowRequestModal(true)
                                                    }}
                                                    className="flex-1 py-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition flex justify-center items-center gap-2 text-sm font-semibold font-poppins"
                                                >
                                                    <Eye size={16} /> View Details
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteRequest(request.id)}
                                                    className="w-12 py-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition flex justify-center items-center"
                                                    title="Delete"
                                                    disabled={updating}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Desktop Table View */}
                                <div className="hidden md:block overflow-x-auto">
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
                            </>
                        )}
                    </div>
                </section>

                {/* Donation Offers Section */}
                <section className={`space-y-6 ${activeTab === 'donations' ? '' : 'md:hidden'}`}>
                    <div className="flex items-center gap-3 md:hidden">
                        <div className="bg-pink-100 p-3 rounded-xl text-pink-600">
                            <Heart size={24} />
                        </div>
                        <h2 className="font-playfair text-3xl font-bold text-gray-900">Donation Offers</h2>
                    </div>
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
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div>
                                <label className="block font-poppins text-sm font-semibold text-gray-700 mb-2">
                                    <Filter size={16} className="inline mr-2" />
                                    Status
                                </label>
                                <select
                                    value={offerStatusFilter}
                                    onChange={(e) => setOfferStatusFilter(e.target.value)}
                                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 font-poppins"
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
                                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 font-poppins"
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
                            <>
                                {/* Mobile Card View */}
                                <div className="block md:hidden divide-y divide-gray-200">
                                    {filteredOffers.map((offer) => (
                                        <div key={offer.id} className="p-4 bg-white">
                                            <div className="mb-3">
                                                <h3 className="font-poppins font-bold text-gray-900 text-lg">{offer.donorName}</h3>
                                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-semibold font-poppins">
                                                        {offer.district}
                                                    </span>
                                                    <span className="text-xs text-gray-400 font-poppins">
                                                        {offer.createdAt?.toDate?.()?.toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="mb-4">
                                                <select
                                                    value={offer.status}
                                                    onChange={(e) => handleUpdateOfferStatus(offer.id, e.target.value)}
                                                    className={`w-full px-3 py-2 rounded-lg font-poppins font-bold text-xs uppercase border-2 ${getStatusBadge(offer.status)}`}
                                                    disabled={updating}
                                                >
                                                    <option value="pending">Pending</option>
                                                    <option value="contacted">Contacted</option>
                                                    <option value="completed">Completed</option>
                                                </select>
                                            </div>

                                            <div className="mb-3 bg-gray-50 p-3 rounded-lg">
                                                <p className="font-poppins text-xs font-semibold text-gray-500 mb-1 uppercase">Type</p>
                                                {offer.paymentSlip ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold font-poppins">MONEY DONATION</span>
                                                        <a href={offer.paymentSlip} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm font-poppins flex items-center gap-1">
                                                            View Slip <ExternalLink size={12} />
                                                        </a>
                                                    </div>
                                                ) : (
                                                    <p className="font-poppins text-sm text-gray-800 line-clamp-2">{offer.itemsOffered}</p>
                                                )}
                                            </div>

                                            <div className="mb-4">
                                                <p className="font-poppins text-sm text-gray-700 flex items-center gap-2">
                                                    <Phone size={14} className="text-gray-400" />
                                                    {offer.contactNumber}
                                                </p>
                                            </div>

                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => {
                                                        setSelectedOffer(offer)
                                                        setShowOfferModal(true)
                                                    }}
                                                    className="flex-1 py-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition flex justify-center items-center gap-2 text-sm font-semibold font-poppins"
                                                >
                                                    <Eye size={16} /> View Details
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteOffer(offer.id)}
                                                    className="w-12 py-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition flex justify-center items-center"
                                                    title="Delete"
                                                    disabled={updating}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Desktop Table View */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="px-6 py-4 text-left font-poppins font-semibold text-gray-700">Donor</th>
                                                <th className="px-6 py-4 text-left font-poppins font-semibold text-gray-700">Contact</th>
                                                <th className="px-6 py-4 text-left font-poppins font-semibold text-gray-700">District</th>
                                                <th className="px-6 py-4 text-left font-poppins font-semibold text-gray-700">Items / Slip</th>
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
                                                        {offer.paymentSlip ? (
                                                            <a href={offer.paymentSlip} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                                                                <Download size={14} /> Payment Slip
                                                            </a>
                                                        ) : (
                                                            offer.itemsOffered
                                                        )}
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
                            </>
                        )}
                    </div>
                </section>

                                {/* Relief Items Section */}
                                <section className={`space-y-6 ${activeTab === 'items' ? '' : 'md:hidden'}`}>
                                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">                        <div className="flex items-center justify-between mb-4">
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
                                                                                                                    </div>                                </div>
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

                        {/* Mobile Card View */}
                        <div className="block md:hidden space-y-4">
                            {itemsLoading ? (
                                <p className="text-center font-poppins text-gray-500 py-4">Loading items...</p>
                            ) : reliefItems.length === 0 ? (
                                <p className="text-center font-poppins text-gray-500 py-4">No items found.</p>
                            ) : (
                                reliefItems.map((item) => (
                                    <div key={item.docId} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                        {editingItem?.docId === item.docId ? (
                                            <div className="space-y-3">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="text-xs font-poppins font-semibold text-gray-500">Order</label>
                                                        <input
                                                            type="number"
                                                            value={editingItem.sortOrder}
                                                            onChange={(e) => setEditingItem({ ...editingItem, sortOrder: e.target.value })}
                                                            className="w-full px-2 py-1.5 border-2 border-gray-300 rounded-lg font-poppins text-sm"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-poppins font-semibold text-gray-500">ID</label>
                                                        <input
                                                            type="text"
                                                            value={editingItem.id}
                                                            onChange={(e) => setEditingItem({ ...editingItem, id: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                                                            className="w-full px-2 py-1.5 border-2 border-gray-300 rounded-lg font-poppins text-sm"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-poppins font-semibold text-gray-500">Name (EN)</label>
                                                    <input
                                                        type="text"
                                                        value={editingItem.name}
                                                        onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                                                        className="w-full px-2 py-1.5 border-2 border-gray-300 rounded-lg font-poppins text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-poppins font-semibold text-gray-500">Name (SI)</label>
                                                    <input
                                                        type="text"
                                                        value={editingItem.nameSi}
                                                        onChange={(e) => setEditingItem({ ...editingItem, nameSi: e.target.value })}
                                                        className="w-full px-2 py-1.5 border-2 border-gray-300 rounded-lg font-poppins text-sm"
                                                    />
                                                </div>
                                                                                                                                                        <div>
                                                                                                                                                            <label className="text-xs font-poppins font-semibold text-gray-500">Category</label>
                                                                                                                                                            <select
                                                                                                                                                                value={editingItem.category}
                                                                                                                                                                onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                                                                                                                                                                className="w-full px-2 py-1.5 border-2 border-gray-300 rounded-lg font-poppins text-sm"
                                                                                                                                                            >
                                                                                                                                                                {categories.map(cat => (
                                                                                                                                                                    <option key={cat} value={cat}>{cat}</option>
                                                                                                                                                                ))}
                                                                                                                                                            </select>
                                                                                                                                                        </div>                                                <div className="flex gap-2 pt-2">
                                                    <button
                                                        onClick={() => handleUpdateItem(item.docId)}
                                                        className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-poppins font-semibold"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingItem(null)}
                                                        className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg text-sm font-poppins font-semibold"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <span className="text-xs font-mono text-gray-400">#{item.sortOrder} • {item.id}</span>
                                                        <h3 className="font-poppins font-bold text-gray-900 text-lg">{item.name}</h3>
                                                        {item.nameSi && <p className="font-poppins text-gray-600 text-sm">{item.nameSi}</p>}
                                                    </div>
                                                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-[10px] font-bold uppercase font-poppins">
                                                        {item.category}
                                                    </span>
                                                </div>
                                                <div className="flex gap-2 mt-4 border-t border-gray-100 pt-3">
                                                    <button
                                                        onClick={() => setEditingItem({ ...item })}
                                                        className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition flex justify-center items-center gap-2 text-sm font-semibold font-poppins"
                                                    >
                                                        <Edit2 size={16} /> Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteItem(item.docId, item.name)}
                                                        className="w-12 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition flex justify-center items-center"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
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
                </section>

                                                {/* Settings Section */}

                                                <section className={`space-y-6 ${activeTab === 'settings' ? '' : 'md:hidden'}`}>

                                                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">

                                                            <h2 className="font-playfair text-2xl font-bold text-gray-900 mb-2">Settings</h2>

                                                            <p className="font-poppins text-gray-600 text-sm mb-6">

                                                                Manage Google Sheet integration and Bank Details for donations.

                                                            </p>

                                                            

                                                            <div className="space-y-6 max-w-3xl">

                                                                {/* Google Sheet Link */}

                                                                <div>

                                                                    <label className="block font-poppins font-semibold text-gray-700 mb-2">Google Sheet Link</label>

                                                                    <input

                                                                        type="url"

                                                                        value={googleSheetUrl}

                                                                        onChange={(e) => setGoogleSheetUrl(e.target.value)}

                                                                        placeholder="https://docs.google.com/spreadsheets/..."

                                                                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent font-poppins"

                                                                    />

                                                                </div>

                                

                                                                {/* Bank Details */}

                                                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">

                                                                    <h3 className="font-playfair text-lg font-bold text-gray-800 mb-4">Bank Details</h3>

                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                                                        <div>

                                                                            <label className="block text-sm font-poppins font-semibold text-gray-700 mb-1">Account Holder Name</label>

                                                                            <input

                                                                                type="text"

                                                                                value={bankDetails.accountHolder}

                                                                                onChange={(e) => setBankDetails({...bankDetails, accountHolder: e.target.value})}

                                                                                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 font-poppins"

                                                                            />

                                                                        </div>

                                                                        <div>

                                                                            <label className="block text-sm font-poppins font-semibold text-gray-700 mb-1">Account Number</label>

                                                                            <input

                                                                                type="text"

                                                                                value={bankDetails.accountNumber}

                                                                                onChange={(e) => setBankDetails({...bankDetails, accountNumber: e.target.value})}

                                                                                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 font-poppins"

                                                                            />

                                                                        </div>

                                                                        <div>

                                                                            <label className="block text-sm font-poppins font-semibold text-gray-700 mb-1">Bank Name</label>

                                                                            <input

                                                                                type="text"

                                                                                value={bankDetails.bankName}

                                                                                onChange={(e) => setBankDetails({...bankDetails, bankName: e.target.value})}

                                                                                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 font-poppins"

                                                                            />

                                                                        </div>

                                                                        <div>

                                                                            <label className="block text-sm font-poppins font-semibold text-gray-700 mb-1">Branch</label>

                                                                            <input

                                                                                type="text"

                                                                                value={bankDetails.branch}

                                                                                onChange={(e) => setBankDetails({...bankDetails, branch: e.target.value})}

                                                                                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 font-poppins"

                                                                            />

                                                                        </div>

                                                                    </div>

                                                                </div>

                                

                                                                <div className="flex flex-wrap gap-3 mt-2">

                                                                    <button

                                                                        onClick={saveConfig}

                                                                        disabled={savingConfig}

                                                                        className="bg-pink-600 text-white px-5 py-2 rounded-lg font-poppins font-semibold hover:bg-pink-700 disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center gap-2"

                                                                    >

                                                                        <Save size={16} />

                                                                        {savingConfig ? 'Saving...' : 'Save Settings'}

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

                                                </section>

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
                                    <div className="flex items-center gap-3 mb-2">
                                        <h2 className="font-playfair text-2xl font-bold">💝 Donation Offer</h2>
                                        {selectedOffer.paymentSlip ? (
                                            <span className="bg-green-500 text-white px-2 py-0.5 rounded text-xs font-bold font-poppins uppercase border border-green-400">
                                                Money Donation
                                            </span>
                                        ) : (
                                            <span className="bg-blue-500 text-white px-2 py-0.5 rounded text-xs font-bold font-poppins uppercase border border-blue-400">
                                                Material Donation
                                            </span>
                                        )}
                                    </div>
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

                                {selectedOffer.paymentSlip ? (
                                    <div>
                                        <p className="font-poppins font-semibold text-gray-700 text-sm mb-2">Payment Slip</p>
                                        <div className="border-2 border-gray-200 rounded-lg p-2 bg-gray-50">
                                            <a href={selectedOffer.paymentSlip} target="_blank" rel="noopener noreferrer">
                                                <img 
                                                    src={selectedOffer.paymentSlip} 
                                                    alt="Payment Slip" 
                                                    className="w-full max-h-64 object-contain rounded hover:opacity-95 transition"
                                                    onError={(e) => {
                                                        e.target.onerror = null; 
                                                        e.target.src = 'https://placehold.co/600x400?text=PDF+Document';
                                                    }}
                                                />
                                            </a>
                                            <div className="mt-2 flex justify-end">
                                                <a 
                                                    href={selectedOffer.paymentSlip} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-800 text-sm font-poppins font-semibold flex items-center gap-1"
                                                >
                                                    <Download size={16} /> Download / View Original
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="font-poppins font-semibold text-gray-700 text-sm">Items Offered</p>
                                        <p className="font-poppins text-gray-900">{selectedOffer.itemsOffered}</p>
                                    </div>
                                )}

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