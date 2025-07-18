import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import  jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import UploadOptions from "../components/UploadOptions"
import PicklistIdInput from '../components/PicklistId_Input';
import PicklistAndSyncIdSaver from "../utility/PicklistAndSyncIdSaver";

import patternData from "../csvjson.json"

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('all');
  const [product, setProductsData] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [picklistId,setPicklistId] = useState("");
  const [syncOrders,setSyncOrders] = useState([]);
  const [sidebarCounts, setSidebarCounts] = useState({
    all: 0,
    found: 0,
    cutting: 0,
    alter: 0,
    no_fabric: 0
  });


 const fetchProducts = async () => {
    const response = await fetch(
      "https://inventorybackend-m1z8.onrender.com/api/product"
    );
    const result = await response.json();
    setProductsData(result);
  };

  useEffect(() => {
    fetchProducts();
  }, []);


  // Fetch orders from API
  // const fetchOrders = async () => {
  //   setLoading(true);
  //   try {
  //     let url = 'https://app.nocodb.com/api/v2/tables/mbce0t4pf72vu3j/records';
      
  //     if (selectedDate) {
  //       url += `?where=(scanned_timestamp,eq,exactDate,${selectedDate})`;
  //     }

  //     const response = await axios.get(url, {
  //       headers: {
  //         'xc-token': '-0XAccEvsn8koGW5MKQ79LoPj07lxk_1ldqDmuv1',
  //       },
  //     });
      
  //     const fetchedOrders = response.data.list || [];
  //     setOrders(fetchedOrders);
  //     setError(null);
  //     updateSidebarCounts(fetchedOrders, 'all');
  //   } catch (err) {
  //     setError('Failed to fetch orders');
  //     console.error('Error fetching orders:', err);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

   // Fetch orders from API
  const fetchOrders = async () => {
    setLoading(true);
    try {
      let url = 'https://app.nocodb.com/api/v2/tables/mbce0t4pf72vu3j/records';

      if(!picklistId){
        alert("Please scan picklist id");
        return
      }
      
      // if (picklistId) {
        
      // }
      url += `?where=(picklist_id,eq,${Number(picklistId)})&limit=1000` ;

      const response = await axios.get(url, {
        headers: {
          'xc-token': '-0XAccEvsn8koGW5MKQ79LoPj07lxk_1ldqDmuv1',
        },
      });
      
      const fetchedOrders = response.data.list || [];
      setOrders(fetchedOrders);
      setError(null);
      updateSidebarCounts(fetchedOrders, 'all');
    } catch (err) {
      setError('Failed to fetch orders');
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  // Update sidebar counts
  const updateSidebarCounts = (orders, channel) => {
    const filteredByChannel = channel === 'all' 
      ? orders 
      : orders.filter(o => o.channel?.toLowerCase() === channel.toLowerCase());
    
    setSidebarCounts({
      all: filteredByChannel.length,
      found: filteredByChannel.filter(o => o.status?.toLowerCase() === 'found').length,
      cutting: filteredByChannel.filter(o => o.status?.toLowerCase() === 'cutting').length,
      alter: filteredByChannel.filter(o => o.status?.toLowerCase() === 'alter').length,
      no_fabric: filteredByChannel.filter(o => o.status?.toLowerCase() === 'no fabric').length
    });
  };

  // Filter orders based on criteria
  useEffect(() => {
    const filtered = orders.filter(order => {
      const matchesSearch = 
        order.style_number?.toString().toLowerCase().includes(searchTerm.toLowerCase())        
      
      const matchesChannel = 
        selectedChannel === 'all' || 
        order.channel?.toLowerCase() === selectedChannel.toLowerCase();
      
      const matchesStatus = 
        selectedStatus === 'all' || 
        order.status?.toLowerCase() === selectedStatus.toLowerCase();
      
      return matchesSearch && matchesChannel && matchesStatus;
    });
    
    setFilteredOrders(filtered);
    if (selectedChannel) updateSidebarCounts(orders, selectedChannel);
  }, [orders, searchTerm, selectedChannel, selectedStatus]);

  // Initial fetch
  useEffect(() => {
    fetchOrders();
  }, []);


  // Clear all filters
  const clearFilters = () => {
    setSelectedDate('');
    setSelectedChannel('all');
    setSelectedStatus('all');
    setSearchTerm('');
    fetchOrders();
  };

  // Download functions
  const downloadCuttingReport = () => {
    const cuttingOrders = filteredOrders.length > 0 
      ? filteredOrders.filter(o => o.status?.toLowerCase() === 'cutting')
      : orders.filter(o => o.status?.toLowerCase() === 'cutting');
    
    if (cuttingOrders.length === 0) {
      alert('No cutting orders found');
      return;
    }
    exportToExcel(cuttingOrders, 'Cutting_Report');
  };

 
 

const downloadMRPTags = () => {
  const foundOrders = syncOrders?.cutting_list.length > 0 
  // ? syncOrders
    // : filteredOrders.filter(o => o.status?.toLowerCase() === 'found')

     ? syncOrders
    : syncOrders

  if (foundOrders.length === 0) {
    alert('No found orders available for MRP tags');
    return;
  }

  const headers = [
    "Style Number", "Size", "Color", "Brand", 
    "Style Name", "(Do not touch) Order Id", "image 100x100 qr image"
  ];

  const csvRows = [];

  // Add headers as first row
  csvRows.push(headers.join(','));

  // Convert order data to rows
  syncOrders?.cutting_list.forEach(order => {
    const row = [
      `"${order.style_number || ''}"`,
      `"${order.size || ''}"`,
      `"${patternData.find((o)=> o.style_number === order.style_number).color || "Other"}"`,
      `"${order.brand || 'Qurvii'}"`,
     `"${patternData.find((o)=> o.style_number === order.style_number).style_name || "Qurvii Products"}"`,
      `"${order.order_id || ''}"`,
      `"https://quickchart.io/qr?text=${order.order_id || ''}"`
    ];
    csvRows.push(row.join(','));
  });

  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `MRP_Tags_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};


  const downloadPackingList = () => {
    // const ordersToExport = filteredOrders.length > 0 ? filteredOrders : orders.filter((order)=>order.status?.toLowerCase().includes("found"));
    const ordersToExport = orders.filter((order)=> !order?.status.toLowerCase().includes("cutting") && !order?.status.toLowerCase().includes("nofab"))
    if (ordersToExport.length === 0) {
      alert('No orders available for packing list');
      return;
    }
    exportToExcel(ordersToExport, 'Packing_List');
  };

  

  
const downloadQRCodeSheet = () => {
  // const foundOrders = filteredOrders.length > 0 
  // ? filteredOrders
  //   : filteredOrders.filter(o => o.status?.toLowerCase() === 'found')


   const foundOrders = syncOrders?.cutting_list.length > 0 
  ? syncOrders?.cutting_list
    : []

  if (foundOrders.length === 0) {
    alert('No found orders available for MRP tags');
    return;
  }

  const headers = [
  "Channel",
  "Style Number",
  "Size",
  "Color",
  "Brand",
  "Date",
  "Pattern#",
  "Style Type",
  "Style Name",
  "Style 1",
  "Style 2",
  "Accessory 1",
  "Accessory 2",
  "Wash Care",
  "(Do not touch) Order Id",
  "image 100x100 qr image"
];


  const csvRows = [];

  // Add headers as first row
  csvRows.push(headers.join(','));

  // Convert order data to rows
  foundOrders.forEach(order => {
    const row = [
      `"${order.channel || 'NA'}"`,
      `"${order.style_number || ''}"`,
      `"${order.size || ''}"`,
      `"${patternData.find((o)=> o.style_number === order.style_number).color || "Other"}"`,
      `"${order.brand || 'Qurvii'}"`,
      `"${order.created_at || new Date().toLocaleString()}"`,
     `"${patternData.find((o)=> o.style_number === order.style_number).pattern || "NA"}"`,
     `"${patternData.find((o)=> o.style_number === order.style_number).style_type || "NA"}"`,
     `"${patternData.find((o)=> o.style_number === order.style_number).style_name || "Qurvii Products"}"`,
     `"${patternData.find((o)=> o.style_number === order.style_number).style_1 || ""}"`,
     `"${patternData.find((o)=> o.style_number === order.style_number).style_2 || ""}"`,
     `"${patternData.find((o)=> o.style_number === order.style_number).accessory1 || ""}"`,
     `"${patternData.find((o)=> o.style_number === order.style_number).accessory2 || ""}"`,
     `"${patternData.find((o)=> o.style_number === order.style_number).wash_care || ""}"`,
      `"${order.order_id || ''}"`,
      `"https://quickchart.io/qr?text=${order.order_id || ''}"`
    ];
    csvRows.push(row.join(','));
  });

  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `QR_CODE_SHEET${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};



// qr code download sheet 

  // Export to Excel function
  const exportToExcel = (data, fileName) => {
    const worksheet = XLSX.utils.json_to_sheet(data.map(order => ({
      'Picklist ID': order.picklist_id,
      'Channel': order.channel,
      'Sku': `${order.style_number}-${patternData.find((o)=> o.style_number === order.style_number).color || "Other"}-${order.size}`,
      '#Pattern No': patternData.find((o)=> o.style_number === order.style_number).pattern || "",
      'Brand': order.brand,
      'Status': order.status,
      'Employee ID': order.employee_id,
      'Scanned At': new Date(order.scanned_timestamp).toLocaleString()
    })));
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  






const sizes = ['XXS', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];

const exportToPDF = (data, patternData, fileName = 'Cutting_List') => {
  const summaryMap = {};

  data
    // .filter((o) => o?.status?.toLowerCase()?.includes("cutting"))
    .forEach(order => {
      const style = Number(order.style_number);
      const size = order.size;
      const patternInfo = patternData.find(p => p.style_number === style) || {};
      const pattern = patternInfo.pattern || '';
      const key = `${pattern}-${style}`;

      if (!summaryMap[key]) {
        summaryMap[key] = {
          '#Pattern': pattern,
          'Style': style,
          ...Object.fromEntries(sizes.map(size => [size, 0])),
          'Total': 0
        };
      }

      if (summaryMap[key][size] !== undefined) {
        summaryMap[key][size]++;
        summaryMap[key]['Total']++;
      }
    });

  // Prepare table data
  const tableData = Object.values(summaryMap).map(row => ([
    row['#Pattern'], row['Style'],
    ...sizes.map(size => row[size] || ""),
    row['Total']
  ]));

  // Add a grand total row
  const totalRow = [
    'Grand Total', '',
    ...sizes.map(size => {
      return tableData.reduce((sum, row) => sum + (parseInt(row[sizes.indexOf(size) + 2]) || 0), 0);
    }),
    tableData.reduce((sum, row) => sum + (parseInt(row[sizes.length + 2]) || 0), 0)
  ];

  tableData.push(totalRow);

  // Create PDF
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text('Cutting List Report', 105, 15, { align: 'center' });
  doc.setFontSize(10);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 105, 22, { align: 'center' });

  autoTable(doc, {
    startY: 30,
    head: [['#Pattern', 'Style', ...sizes, 'Total']],
    body: tableData,
    styles: { halign: 'center', lineWidth: 0.1, lineColor: 10 },
    headStyles: { fillColor: [52, 73, 94], textColor: [255, 255, 255] },
  });

  doc.save(`${fileName}_${new Date().toISOString().split('T')[0]}.pdf`);
};

  
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'found': return 'bg-green-100 text-green-800';
      case 'no fabric': return 'bg-red-100 text-red-800';
      case 'cutting': return 'bg-yellow-100 text-yellow-800';
      case 'alter': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };





// *************************************Order synchronization ***********************************

const syncOrdersToFastApi = async () => {
  if (orders.length === 0) {
    alert("No orders found to sync");
    return;
  }
  
  try {  
    const payload = orders.map((order) => ({
      // channel: order.channel || "",
      channel:  "Test",
      style_number: Number(order.style_number) || "",
      size: order.size || "",
      color: patternData.find((color)=> Number(color.style_number) === Number(order.style_number))?.color || "",
      status: order?.status || "",
      found_in_inventory: order.status?.toLowerCase().includes("found") ? true : false
    }));

    const apiUrl = 'https://fastapi.qurvii.com/sync-orders';
  
    const response = await axios.post(apiUrl, payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    setSyncOrders(response.data);
     const syncPayload = {
  channel: orders[0]?.channel || "",
  picklist_id: Number(picklistId),
  sync_id: Number(response.data.sync_id) || ""
};

console.log("Sending to PicklistAndSyncIdSaver:", syncPayload);

await PicklistAndSyncIdSaver(syncPayload);

    setPicklistId("")
    setOrders([{status:"synced successfully"}]);
   
    console.log(response.data);
    alert(`${orders.length} synced succsessfully.`)
  } catch (err) {
    console.log("Failed to sync orders", err);
  }
}






  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Fixed Sidebar */}
      <div className="w-64 bg-white mt-15 p-4 border-r border-gray-200 fixed h-full overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
          <button 
            onClick={clearFilters}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Clear All
          </button>
        </div>
        
        {/* Status Filters */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Order Status</h3>
          <ul className="space-y-1">
            {[
              { label: 'All Orders', value: 'all', count: sidebarCounts.all },
              { label: 'Found', value: 'found', count: sidebarCounts.found, color: 'green' },
              { label: 'Cutting', value: 'cutting', count: sidebarCounts.cutting, color: 'yellow' },
              { label: 'Alter', value: 'alter', count: sidebarCounts.alter, color: 'blue' },
              { label: 'No Fabric', value: 'no fabric', count: sidebarCounts.no_fabric, color: 'red' }
            ].map((item) => (
              <li key={item.value}>
                <button 
                  onClick={() => setSelectedStatus(item.value)}
                  className={`w-full flex justify-between items-center px-3 py-2 rounded-md text-sm ${
                    selectedStatus === item.value 
                      ? `bg-${item.color}-100 text-${item.color}-800 font-medium`
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span>{item.label}</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    selectedStatus === item.value 
                      ? `bg-${item.color}-200 text-${item.color}-800`
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {item.count}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Download Reports Section */}

        {orders.length > 0 ? <>
        <div className="mt-8 border-t border-gray-200 pt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Download Reports</h3>
          <div className="space-y-2">
            <button
              onClick={downloadCuttingReport}
              className="w-full flex items-center justify-between px-3 py-2 bg-yellow-50 text-yellow-800 rounded-md hover:bg-yellow-100 text-sm font-medium"
            >
              <span>Cutting Report</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            <button
              onClick={()=>exportToPDF(syncOrders.cutting_list,patternData,"Cutting Summary")}
              className="w-full flex items-center justify-between px-3 py-2 bg-red-50 text-yellow-800 rounded-md hover:bg-red-100 text-sm font-medium"
            >
              <span>Cutting Summary</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              onClick={downloadMRPTags}
              className="w-full flex items-center justify-between px-3 py-2 bg-green-50 text-green-800 rounded-md hover:bg-green-100 text-sm font-medium"
            >
              <span>MRP Tags</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              onClick={downloadPackingList}
              className="w-full flex items-center justify-between px-3 py-2 bg-blue-50 text-blue-800 rounded-md hover:bg-blue-100 text-sm font-medium"
            >
              <span>Packing List</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              onClick={downloadQRCodeSheet}
              className="w-full flex items-center justify-between px-3 py-2 bg-purple-50 text-purple-800 rounded-md hover:bg-purple-100 text-sm font-medium"
            >
              <span>QR Code Sheet</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

          </div>
        </div>


        {/* Uload options  */}
              <div>
                <UploadOptions/>
              </div>
        
              </> :""}
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64 overflow-y-auto mt-15">
        <div className="container mx-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Order Synchronization</h1>
          

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                Showing {filteredOrders.length} of {orders.length} orders
              </span>
            </div>
          </div>

          {/* Filters Card */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
  
             <div>
              <PicklistIdInput picklistId={picklistId} setPicklistId={setPicklistId} fetchOrders={fetchOrders} syncOrder = {syncOrdersToFastApi} />
            </div>
          </div>

          {/* Search Card */}
          {orders.length > 0 ?<>
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search Orders</label>
              <input
                type="text"
                placeholder="Search by style, picklist, or employee"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Orders Table */}
         <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Picklist ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Channel</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Style Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scanned At</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => (
                      <tr key={`${order.Id}-${order.scanned_at}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{order.picklist_id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.channel}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{order.style_number}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.size?.toUpperCase()}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(order.scanned_timestamp).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                        No orders found matching your criteria
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>  </>
          : ""}

        </div>
      </div>
    </div>
  );
};

export default Orders;