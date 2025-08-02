import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import SideBar from './SideBar';
import { fetchOrdersFromPicklistResponse } from '../utility/FetchPicklistRecord';
import fetchOrdersFromNocoDbWithSyncId from '../utility/FetchFromNocoDbWithSynId';

const SyncIdRecords = () => {
  const [orders, setOrders] = useState([]);
  const [picklistOrders, setPicklistOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { sync_id, picklist_id } = useParams();

  const [editingId, setEditingId] = useState(null);
  const [editedStatus, setEditedStatus] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const statusOptions = ["pending", "shipped"];

  const fetchSyncIdRecord = async (sync_id) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchOrdersFromNocoDbWithSyncId(sync_id);
      setOrders(data);
    } catch (error) {
      console.log("Failed to fetch records from NocoDB with sync id", error);
      setError("Failed to load records. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const getOrders = async () => {
      setIsLoading(true);
      try {
        const data = await fetchOrdersFromPicklistResponse(picklist_id);
        setPicklistOrders(data);
        setError("");
      } catch (error) {
        setError("Failed to fetch picklist response orders.", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (picklist_id) {
      getOrders();
    }
  }, [picklist_id])

  useEffect(() => {
    if (sync_id) {
      fetchSyncIdRecord(Number(sync_id));
    }
  }, [sync_id]);

  const handleEditClick = (order) => {
    setEditingId(order.order_id);
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

      setError("");

      // NocoDB expects the data in a specific format
      const updateData = {
        order_id: orderId,
        status: editedStatus
      };

      // Make PUT request with proper NocoDB format
      const url = `https://nocodb.qurvii.com/api/v2/tables/m5rt138j272atfc/records`;
      await axios.patch(url, [updateData], {
        headers: {
          'xc-token': 'LsOnEY-1wS4Nqjz15D1_gxHu0pFVcmA_5LNqCAqK',
          'Content-Type': 'application/json'
        }
      });



      setSuccessMessage(`Order #${orderId} updated successfully!`);
      setEditingId(null);
      setEditedStatus("");
      window.location.reload();


    } catch (err) {
      setError(`Failed to update order #${orderId}: ${err.response?.data?.message || err.message}`);
      console.error('Error updating order:', err);
    }
  };


  console.log(orders)

  return (
    <div className='grid grid-cols-5'>
      <SideBar syncOrders={orders} picklistRecords={picklistOrders} />
      <div className="w-full mt-15 col-span-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
            <h2 className="text-2xl font-bold text-gray-800">
              Sync Records <span className="text-gray-500 font-medium">ID: {sync_id}</span>
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {orders?.length} records found
            </p>
          </div>

          {successMessage && (
            <div className="p-4 bg-green-50 text-green-700 border-l-4 border-green-500">
              {successMessage}
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 text-red-700 border-l-4 border-red-500">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              <p className="mt-3 text-gray-600">Loading records...</p>
            </div>
          ) : (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Channel</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Style Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sync ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders?.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="mt-2 text-sm font-medium">No records found</p>
                        <p className="mt-1 text-xs text-gray-500">Try a different sync ID</p>
                      </td>
                    </tr>
                  ) : (
                    orders?.map((order, i) => (
                      <tr key={order.order_id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{i + 1}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${order.channel ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                            {order.channel || "-"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">{order.style_number || "-"}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{order.size || "-"}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{order.color || "-"}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {editingId === order.order_id ? (
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
                              ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                  order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                    order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                      'bg-gray-100 text-gray-800'}`}>
                              {order.status || 'Not Set'}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {editingId === order.order_id ? (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleUpdateStatus(order.order_id)}
                                disabled={isLoading}
                                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:bg-green-300"
                              >
                                {isLoading ? 'Saving...' : 'Save'}
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{order.sync_id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.created_at ? new Date(order.created_at).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SyncIdRecords;