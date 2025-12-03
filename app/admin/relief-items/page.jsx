'use client'
import { useState, useEffect } from 'react'
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react'

export default function ReliefItemsAdmin() {
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [editingItem, setEditingItem] = useState(null)
    const [showAddForm, setShowAddForm] = useState(false)
    const [newItem, setNewItem] = useState({
        id: '',
        name: '',
        nameSi: '',
        icon: '',
        category: '',
        sortOrder: 0
    })

    const categories = ['Stationery', 'Books', 'Bags', 'Essentials', 'Clothing', 'Other']

    useEffect(() => {
        fetchItems()
    }, [])

    const fetchItems = async () => {
        setLoading(true)
        try {
            const q = query(collection(db, 'reliefItems'), orderBy('sortOrder', 'asc'))
            const querySnapshot = await getDocs(q)
            const itemsData = querySnapshot.docs.map(doc => ({
                docId: doc.id,
                ...doc.data()
            }))
            setItems(itemsData)
        } catch (error) {
            console.error('Error fetching items:', error)
            alert('Failed to load relief items')
        } finally {
            setLoading(false)
        }
    }

    const handleAddItem = async (e) => {
        e.preventDefault()
        
        if (!newItem.id || !newItem.name || !newItem.icon || !newItem.category) {
            alert('Please fill in all required fields')
            return
        }

        // Check if ID already exists
        if (items.some(item => item.id === newItem.id)) {
            alert('Item ID already exists. Please use a unique ID.')
            return
        }

        try {
            await addDoc(collection(db, 'reliefItems'), {
                id: newItem.id,
                name: newItem.name,
                nameSi: newItem.nameSi || '',
                icon: newItem.icon,
                category: newItem.category,
                sortOrder: parseInt(newItem.sortOrder) || 0,
                createdAt: new Date(),
                updatedAt: new Date()
            })

            setNewItem({
                id: '',
                name: '',
                nameSi: '',
                icon: '',
                category: '',
                sortOrder: 0
            })
            setShowAddForm(false)
            fetchItems()
            alert('Item added successfully!')
        } catch (error) {
            console.error('Error adding item:', error)
            alert('Failed to add item')
        }
    }

    const handleUpdateItem = async (docId) => {
        if (!editingItem.id || !editingItem.name || !editingItem.icon || !editingItem.category) {
            alert('Please fill in all required fields')
            return
        }

        try {
            await updateDoc(doc(db, 'reliefItems', docId), {
                id: editingItem.id,
                name: editingItem.name,
                nameSi: editingItem.nameSi || '',
                icon: editingItem.icon,
                category: editingItem.category,
                sortOrder: parseInt(editingItem.sortOrder) || 0,
                updatedAt: new Date()
            })

            setEditingItem(null)
            fetchItems()
            alert('Item updated successfully!')
        } catch (error) {
            console.error('Error updating item:', error)
            alert('Failed to update item')
        }
    }

    const handleDeleteItem = async (docId, itemName) => {
        if (!confirm(`Are you sure you want to delete "${itemName}"? This may affect existing requests.`)) {
            return
        }

        try {
            await deleteDoc(doc(db, 'reliefItems', docId))
            fetchItems()
            alert('Item deleted successfully!')
        } catch (error) {
            console.error('Error deleting item:', error)
            alert('Failed to delete item')
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-pink-50 p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center py-20">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
                        <p className="mt-4 font-poppins text-gray-600">Loading relief items...</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-pink-50 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="font-playfair text-3xl font-bold text-gray-800">
                                🎒 Relief Items Management
                            </h1>
                            <p className="font-poppins text-gray-600 mt-2">
                                Manage predefined items for flood relief material requests
                            </p>
                        </div>
                        <button
                            onClick={() => setShowAddForm(!showAddForm)}
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-poppins font-bold hover:bg-blue-700 transition flex items-center gap-2"
                        >
                            {showAddForm ? <X size={20} /> : <Plus size={20} />}
                            {showAddForm ? 'Cancel' : 'Add New Item'}
                        </button>
                    </div>

                    {/* Add New Item Form */}
                    {showAddForm && (
                        <form onSubmit={handleAddItem} className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
                            <h3 className="font-poppins font-bold text-lg text-gray-800 mb-4">Add New Relief Item</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                    <label className="block font-poppins font-semibold text-gray-700 mb-2">
                                        Item ID <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={newItem.id}
                                        onChange={(e) => setNewItem({ ...newItem, id: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                                        placeholder="notebooks (lowercase, no spaces)"
                                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-poppins"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block font-poppins font-semibold text-gray-700 mb-2">
                                        Name (English) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={newItem.name}
                                        onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                        placeholder="Notebooks"
                                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-poppins"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block font-poppins font-semibold text-gray-700 mb-2">
                                        Name (Sinhala)
                                    </label>
                                    <input
                                        type="text"
                                        value={newItem.nameSi}
                                        onChange={(e) => setNewItem({ ...newItem, nameSi: e.target.value })}
                                        placeholder="සටහන් පොත්"
                                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-poppins"
                                    />
                                </div>
                                <div>
                                    <label className="block font-poppins font-semibold text-gray-700 mb-2">
                                        Icon (Emoji) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={newItem.icon}
                                        onChange={(e) => setNewItem({ ...newItem, icon: e.target.value })}
                                        placeholder="📓"
                                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-poppins text-2xl"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block font-poppins font-semibold text-gray-700 mb-2">
                                        Category <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={newItem.category}
                                        onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-poppins"
                                        required
                                    >
                                        <option value="">Select category</option>
                                        {categories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-poppins font-semibold text-gray-700 mb-2">
                                        Sort Order
                                    </label>
                                    <input
                                        type="number"
                                        value={newItem.sortOrder}
                                        onChange={(e) => setNewItem({ ...newItem, sortOrder: e.target.value })}
                                        placeholder="0"
                                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-poppins"
                                    />
                                </div>
                            </div>
                            <div className="mt-4 flex gap-3">
                                <button
                                    type="submit"
                                    className="bg-green-600 text-white px-6 py-2 rounded-lg font-poppins font-bold hover:bg-green-700 transition flex items-center gap-2"
                                >
                                    <Plus size={18} />
                                    Add Item
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowAddForm(false)}
                                    className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-poppins font-bold hover:bg-gray-300 transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Items List */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-100 border-b-2 border-gray-300">
                                    <th className="px-4 py-3 text-left font-poppins font-bold text-gray-700">Order</th>
                                    <th className="px-4 py-3 text-left font-poppins font-bold text-gray-700">Icon</th>
                                    <th className="px-4 py-3 text-left font-poppins font-bold text-gray-700">ID</th>
                                    <th className="px-4 py-3 text-left font-poppins font-bold text-gray-700">Name (EN)</th>
                                    <th className="px-4 py-3 text-left font-poppins font-bold text-gray-700">Name (SI)</th>
                                    <th className="px-4 py-3 text-left font-poppins font-bold text-gray-700">Category</th>
                                    <th className="px-4 py-3 text-left font-poppins font-bold text-gray-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-4 py-8 text-center font-poppins text-gray-500">
                                            No relief items found. Add your first item to get started.
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((item) => (
                                        <tr key={item.docId} className="border-b border-gray-200 hover:bg-gray-50">
                                            {editingItem?.docId === item.docId ? (
                                                // Edit Mode
                                                <>
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="number"
                                                            value={editingItem.sortOrder}
                                                            onChange={(e) => setEditingItem({ ...editingItem, sortOrder: e.target.value })}
                                                            className="w-20 px-2 py-1 border-2 border-gray-300 rounded font-poppins"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="text"
                                                            value={editingItem.icon}
                                                            onChange={(e) => setEditingItem({ ...editingItem, icon: e.target.value })}
                                                            className="w-16 px-2 py-1 border-2 border-gray-300 rounded font-poppins text-2xl"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="text"
                                                            value={editingItem.id}
                                                            onChange={(e) => setEditingItem({ ...editingItem, id: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                                                            className="w-32 px-2 py-1 border-2 border-gray-300 rounded font-poppins"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="text"
                                                            value={editingItem.name}
                                                            onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                                                            className="w-40 px-2 py-1 border-2 border-gray-300 rounded font-poppins"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="text"
                                                            value={editingItem.nameSi}
                                                            onChange={(e) => setEditingItem({ ...editingItem, nameSi: e.target.value })}
                                                            className="w-40 px-2 py-1 border-2 border-gray-300 rounded font-poppins"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <select
                                                            value={editingItem.category}
                                                            onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                                                            className="w-32 px-2 py-1 border-2 border-gray-300 rounded font-poppins"
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
                                                                className="bg-green-600 text-white p-2 rounded hover:bg-green-700 transition"
                                                                title="Save"
                                                            >
                                                                <Save size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => setEditingItem(null)}
                                                                className="bg-gray-400 text-white p-2 rounded hover:bg-gray-500 transition"
                                                                title="Cancel"
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </>
                                            ) : (
                                                // View Mode
                                                <>
                                                    <td className="px-4 py-3 font-poppins text-gray-700">{item.sortOrder}</td>
                                                    <td className="px-4 py-3 text-2xl">{item.icon}</td>
                                                    <td className="px-4 py-3 font-poppins text-gray-700 font-mono text-sm">{item.id}</td>
                                                    <td className="px-4 py-3 font-poppins text-gray-900 font-semibold">{item.name}</td>
                                                    <td className="px-4 py-3 font-poppins text-gray-700">{item.nameSi || '-'}</td>
                                                    <td className="px-4 py-3">
                                                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-poppins text-xs font-semibold">
                                                            {item.category}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => setEditingItem({ ...item })}
                                                                className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition"
                                                                title="Edit"
                                                            >
                                                                <Edit2 size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteItem(item.docId, item.name)}
                                                                className="bg-red-600 text-white p-2 rounded hover:bg-red-700 transition"
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

                    {/* Help Text */}
                    <div className="mt-6 bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
                        <p className="font-poppins text-sm text-yellow-800">
                            <strong>💡 Tips:</strong>
                        </p>
                        <ul className="font-poppins text-sm text-yellow-800 list-disc list-inside mt-2 space-y-1">
                            <li><strong>Item ID:</strong> Unique identifier (lowercase, no spaces). Used in database.</li>
                            <li><strong>Sort Order:</strong> Lower numbers appear first in the request form.</li>
                            <li><strong>Icon:</strong> Use emoji from your system emoji picker (Win + . or Mac Cmd + Ctrl + Space).</li>
                            <li><strong>Category:</strong> Groups similar items together for better organization.</li>
                            <li>Changes take effect immediately on the relief request form.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}
