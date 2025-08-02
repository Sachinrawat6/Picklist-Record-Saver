import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UpdateStatus = () => {
    const [picklistId, setPicklistId] = useState(null);
    const [error, setError] = useState("");
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editedStatus, setEditedStatus] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [filteredOrder, setFilteredOrder] = useState([]);
    const [query, setQuery] = useState("");

    const statusOptions = ["Cutting", "Found", "Alter", "No Fabric"];

    // Fetch orders from API
    const fetchOrders = async () => {
        setLoading(true);
        setError("");
        setSuccessMessage("");
        setEditingId(null);

        const pageSize = 100;
        let offset = 0;
        let allOrders = [];

        try {
            while (true) {
                const url = `https://app.nocodb.com/api/v2/tables/mbce0t4pf72vu3j/records?where=(picklist_id,eq,${Number(picklistId)})&limit=${pageSize}&offset=${offset}`;

                const response = await axios.get(url, {
                    headers: {
                        'xc-token': '-0XAccEvsn8koGW5MKQ79LoPj07lxk_1ldqDmuv1',
                    },
                });

                const pageOrders = response.data.list || [];
                allOrders = allOrders.concat(pageOrders);

                if (pageOrders.length < pageSize) {
                    break; // No more pages
                }

                offset += pageSize;
            }

            setOrders(allOrders);
            console.log(allOrders)
            setError(null);

        } catch (err) {
            setError('Failed to fetch orders');
            console.error('Error fetching orders:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (order) => {
        setEditingId(order.Id);
        setEditedStatus(order.status || "");
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditedStatus("");
    };

    const handleStatusChange = (e) => {
        setEditedStatus(e.target.value);
    };

    const handleUpdateStatus = async (orderId) => {
        if (!editedStatus) {
            setError("Please select a status");
            return;
        }

        try {
            setLoading(true);
            setError("");

            // NocoDB expects the data in a specific format
            const updateData = {
                Id: orderId,
                status: editedStatus
            };

            // Make PUT request with proper NocoDB format
            const url = `https://app.nocodb.com/api/v2/tables/mbce0t4pf72vu3j/records`;
            await axios.patch(url, [updateData], {
                headers: {
                    'xc-token': '-0XAccEvsn8koGW5MKQ79LoPj07lxk_1ldqDmuv1',
                    'Content-Type': 'application/json'
                }
            });

            // Update local state
            setOrders(orders.map(order =>
                order.Id === orderId ? { ...order, status: editedStatus } : order
            ));

            setSuccessMessage(`Order #${orderId} updated successfully!`);
            setEditingId(null);
            setEditedStatus("");
            fetchOrders();

        } catch (err) {
            setError(`Failed to update order #${orderId}: ${err.response?.data?.message || err.message}`);
            console.error('Error updating order:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [picklistId]);



    //  *****************************filteration logic  ****************************


    const filterOrder = () => {
        const filtered = orders.filter((order) => order.status.toLowerCase().includes(query) || order.style_number?.toString().includes(query))
        setFilteredOrder(filtered);
    }

    useEffect(() => {
        filterOrder();
    }, [query])



    const displayOrders = query ? filteredOrder : orders;

    if (!picklistId) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="w-full max-w-md p-8 bg-white rounded-xl shadow">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">Enter Picklist ID</h2>
                        <p className="text-gray-600 mt-2">Scan or enter the picklist ID to continue</p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label htmlFor="picklistId" className="block text-sm font-medium text-gray-700 mb-1">
                                Picklist ID
                            </label>
                            <input
                                type="number"
                                id="picklistId"
                                placeholder="e.g. 74593"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        setPicklistId(e.target.value);
                                    }
                                }}
                            />
                        </div>

                        <button
                            onClick={() => {
                                const input = document.getElementById('picklistId');
                                setPicklistId(input.value);
                            }}
                            className="w-full bg-purple-600 cursor-pointer hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            Continue
                        </button>
                    </div>


                </div>
            </div>
        );
    }
    return (
        <div className="container mx-auto py-8 px-4 mt-10">
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Order Status Management</h1>
                        <p className="text-gray-600 mt-1">
                            {orders.length} records found for Picklist ID: {picklistId}
                        </p>
                    </div>

                    <button
                        onClick={fetchOrders}
                        disabled={loading}
                        className={`px-4 py-2 rounded-md ${loading ? 'bg-gray-300' : 'bg-blue-600 hover:bg-blue-700'} text-white font-medium transition-colors`}
                    >
                        {loading ? 'Loading...' : 'Refresh Data'}
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
                        <p>{error}</p>
                    </div>
                )}

                {successMessage && (
                    <div className="mb-4 p-4 bg-green-100 border-l-4 border-green-500 text-green-700">
                        <p>{successMessage}</p>
                    </div>
                )}

                <div>
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className='w-full border border-purple-600 py-3 rounded-lg outline-purple-700 cursor-pointer mb-4 px-4'
                        type="search" placeholder='Search by style number | status... ' />
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Channel</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Style Number</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated At</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {displayOrders.map((order, i) => (
                                <tr key={order.Id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{i + 1}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.channel}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.style_number}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.size}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {editingId === order.Id ? (
                                            <select
                                                value={editedStatus}
                                                onChange={handleStatusChange}
                                                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                            >
                                                <option value="">Select Status</option>
                                                {statusOptions.map(option => (
                                                    <option key={option} value={option}>{option}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                ${order.status === 'Cutting' ? 'bg-purple-100 text-purple-800' :
                                                    order.status === 'Found' ? 'bg-green-100 text-green-800' :
                                                        order.status === 'Alter' ? 'bg-yellow-100 text-yellow-800' :
                                                            order.status === 'No Fabric' ? 'bg-red-100 text-red-800' :
                                                                'bg-blue-100 text-blue-800'}`}>
                                                {order.status || 'Not Set'}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {editingId === order.Id ? (
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleUpdateStatus(order.Id)}
                                                    disabled={loading}
                                                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:bg-green-300"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={handleCancelEdit}
                                                    className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleEditClick(order)}
                                                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                            >
                                                Edit
                                            </button>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.Id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900 font-medium">
                                            {order.CreatedAt ? new Date(order.CreatedAt).toLocaleString("en-IN", {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                hour12: true
                                            }) : 'N/A'}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            Created
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900 font-medium">
                                            {order.UpdatedAt ? new Date(order.UpdatedAt).toLocaleString("en-IN", {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                hour12: true
                                            }) : 'N/A'}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            Last Updated
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {loading && (
                    <div className="mt-4 flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UpdateStatus;