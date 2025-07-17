import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
// import {patterData} from "./"

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
  const [sidebarCounts, setSidebarCounts] = useState({
    all: 0,
    found: 0,
    cutting: 0,
    alter: 0,
    no_fabric: 0
  });

console.log(patterData)

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
  const fetchOrders = async () => {
    setLoading(true);
    try {
      let url = 'https://app.nocodb.com/api/v2/tables/mbce0t4pf72vu3j/records';
      
      if (selectedDate) {
        url += `?where=(scanned_timestamp,eq,exactDate,${selectedDate})`;
      }

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
        order.style_number?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.picklist_id?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.employee_id?.toString().toLowerCase().includes(searchTerm.toLowerCase());
      
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

  // Apply date filter
  const applyDateFilter = () => {
    if (selectedDate) {
      fetchOrders();
    } else {
      alert('Please select a date');
    }
  };

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

  // const downloadMRPTags = () => {
  //   const foundOrders = filteredOrders.length > 0 
  //     ? filteredOrders.filter(o => o.status?.toLowerCase() === 'found')
  //     : orders.filter(o => o.status?.toLowerCase() === 'found');
    
  //   if (foundOrders.length === 0) {
  //     alert('No found orders available for MRP tags');
  //     return;
  //   }
  //   exportToExcel(foundOrders, 'MRP_Tags');
  // };


  const downloadMRPTags = async () => {
  const foundOrders = filteredOrders.length > 0 
    ? filteredOrders.filter(o => o.status?.toLowerCase() === 'found')
    : orders.filter(o => o.status?.toLowerCase() === 'found');
  
  if (foundOrders.length === 0) {
    alert('No found orders available for MRP tags');
    return;
  }

  // Show progress bar
  const progressBar = document.createElement("div");
  progressBar.style.position = "fixed";
  progressBar.style.top = "0";
  progressBar.style.left = "0";
  progressBar.style.width = "100%";
  progressBar.style.height = "5px";
  progressBar.style.backgroundColor = "#f3f4f6";
  progressBar.style.zIndex = "9999";

  const progressIndicator = document.createElement("div");
  progressIndicator.style.height = "100%";
  progressIndicator.style.backgroundColor = "#3b82f6";
  progressIndicator.style.width = "0%";
  progressIndicator.style.transition = "width 0.3s";

  progressBar.appendChild(progressIndicator);
  document.body.appendChild(progressBar);

  try {
    // Create a hidden container
    const container = document.createElement("div");
    container.style.width = "378px"; // Same as your tag width
    container.style.padding = "10px";
    container.style.boxSizing = "border-box";
    // container.style.display = "grid";
    // container.style.gridTemplateColumns = "1fr"; // One tag per page
    container.style.gap = "10px";
    container.style.fontFamily = "sans-serif";
    container.style.position = "fixed";
    container.style.top = "0";
    container.style.left = "0";
    container.style.visibility = "hidden";
    container.style.opacity = "0";
    container.style.zIndex = "-1";
    container.style.background = "white";

    // Generate MRP tags
    foundOrders.forEach((order) => {
      const tag = document.createElement("div");
      tag.style.cssText = `
        width: 378px !important;
        height: 189px;
        padding: 10px;
        background-color: #fff;
        color: #000;
        font-size: 12px;
        font-family: sans-serif;
        border: 1px solid #f2f2f2;
        border-radius: 1rem;
        position: relative;
        font-weight: bold;
      `;

      // Find product details from your products API if needed
      const matchedProduct = product.find(p => p.style_code === Number(order.style_number));

      tag.innerHTML = `
        <p class="w-70">Product : ${order.productName || matchedProduct?.style_name || "Qurvii Product"} </p>
        <p>Brand: Qurvii | SKU: ${order.style_number}-${order.color}-${order.size}</p>
        <p class="capitalize">Color: ${order.color} | Size: ${order.size}</p>
        <p>MRP: ₹${matchedProduct?.mrp || "NA"} (Incl. of all taxes)</p>
        <p>Net Qty: 1 | Unit: 1 Pcs</p>
        <p>
          MFG & MKT BY: Qurvii, 2nd Floor, B-149 <br/>Sector-6, Noida, UP,
          201301
        </p>
        <p>Contact: support@qurvii.com</p>
        <p class="absolute bottom-11 right-8">Order Id: ${order.order_id}</p>
        <div class="absolute top-10 right-8">
          <img 
            src="https://quickchart.io/qr?text=${encodeURIComponent(order.order_id)}&size=80" 
            alt="QR Code" 
            width="80" 
            height="80" 
            crossorigin="anonymous"
          />
        </div>
      `;

      container.appendChild(tag);
    });

    document.body.appendChild(container);

    // Wait for images to load
    const images = Array.from(container.querySelectorAll("img"));
    let loaded = 0;

    await Promise.all(
      images.map(
        (img) =>
          new Promise((resolve) => {
            if (img.complete) {
              loaded++;
              progressIndicator.style.width = `${Math.round(
                (loaded / images.length) * 100
              )}%`;
              resolve();
            } else {
              img.onload = img.onerror = () => {
                loaded++;
                progressIndicator.style.width = `${Math.round(
                  (loaded / images.length) * 100
                )}%`;
                resolve();
              };
            }
          })
      )
    );

    // Make container visible just before capture
    container.style.visibility = "visible";
    container.style.opacity = "1";

    // Generate PDF
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: [100, 50], // Same as your tag dimensions
    });

    const totalTags = container.children.length;

    for (let i = 0; i < totalTags; i++) {
      const tag = container.children[i];
      const tagContainer = document.createElement("div");
      tagContainer.appendChild(tag.cloneNode(true));
      document.body.appendChild(tagContainer);

      const canvas = await html2canvas(tagContainer, {
        scale: 2,
        logging: false,
        useCORS: true,
        backgroundColor: "#FFFFFF",
      });

      const imgData = canvas.toDataURL("image/png");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = 100;
      const pdfHeight = 50;

      if (i !== 0) pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

      document.body.removeChild(tagContainer);
    }

    pdf.save(`MRP_Tags_${new Date().toISOString().split("T")[0]}.pdf`);
  } catch (error) {
    console.error("PDF generation error:", error);
    alert("Failed to generate PDF. Please try again.");
  } finally {
    // Cleanup
    const containers = document.querySelectorAll('div[style*="fixed"]');
    containers.forEach((el) => el.remove());
    progressBar.remove();
  }
};

  const downloadPackingList = () => {
    const ordersToExport = filteredOrders.length > 0 ? filteredOrders : orders.filter((order)=>order.status?.toLowerCase().includes("found"));
    if (ordersToExport.length === 0) {
      alert('No orders available for packing list');
      return;
    }
    exportToExcel(ordersToExport, 'Packing_List');
  };

  const downloadQRCodeSheet = () => {
    const ordersToExport = filteredOrders.length > 0 ? filteredOrders : orders;
    if (ordersToExport.length === 0) {
      alert('No orders available for QR codes');
      return;
    }
    exportToExcel(ordersToExport, 'QR_Code_Sheet');
  };



// qr code download sheet 

const downloadQRCodeSheetAsPDF = async () => {
  const ordersToExport = filteredOrders.length > 0 ? filteredOrders : orders;

  if (ordersToExport.length === 0) {
    alert("No orders available for QR codes");
    return;
  }

  // Show progress bar
  const progressBar = document.createElement("div");
  progressBar.style.position = "fixed";
  progressBar.style.top = "0";
  progressBar.style.left = "0";
  progressBar.style.width = "100%";
  progressBar.style.height = "5px";
  progressBar.style.backgroundColor = "#f3f4f6";
  progressBar.style.zIndex = "9999";

  const progressIndicator = document.createElement("div");
  progressIndicator.style.height = "100%";
  progressIndicator.style.backgroundColor = "#3b82f6";
  progressIndicator.style.width = "0%";
  progressIndicator.style.transition = "width 0.3s";

  progressBar.appendChild(progressIndicator);
  document.body.appendChild(progressBar);

  try {
    // Create a hidden container
    const container = document.createElement("div");
    container.style.width = "210mm";
    container.style.padding = "5mm";
    container.style.boxSizing = "border-box";
    container.style.display = "grid";
    container.style.gridTemplateColumns = "repeat(4, 1fr)";
    container.style.gap = "5mm";
    container.style.fontFamily = "'Inter', sans-serif";
    container.style.position = "fixed";
    container.style.top = "0";
    container.style.left = "0";
    container.style.visibility = "hidden";
    container.style.opacity = "0";
    container.style.zIndex = "-1";
    container.style.background = "white"; // Ensure white background

    // Generate QR cards
    ordersToExport.forEach((product) => {
      const card = document.createElement("div");
      card.style.cssText = `
        border: 2px dotted #ccc;
        padding: 2px;
        border-radius: 10px;
        font-size: 10px;
        box-sizing: border-box;
        text-align: center;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        height: auto;
        background: white;
      `;

      const qrText = product.style_number || "missing";
      const qrImage = `https://quickchart.io/qr?text=${encodeURIComponent(
        qrText
      )}&size=100`;

      card.innerHTML = `
        <div style="margin-bottom: 5px;">
          <div><strong>Order ID:</strong> ${product.id || "ORD000"}</div>
          <div><strong>Channel:</strong> <b>${product.channel || ""}</b></div>
          <div><strong>Date:</strong> ${new Date().toLocaleString()}</div>
          <div><strong>Brand:</strong> ${product.brand || "Qurvii"}</div>
          <div><strong>Accessory:</strong> ${product["Accessory 1"] || "N/A"}</div>
          <div><strong>Wash Care:</strong> ${product["Wash Care"] || "N/A"}</div>
          <div>
            <strong>Style No:</strong>
            <b>${product.style_number || ""}</b>
            <b>(${product.size || ""})</b>
          </div>
        </div>
       <div style="display: flex; justify-content: center; align-items: center; margin-top: 5px;">
    <img 
      src="${qrImage}" 
      alt="QR Code" 
      width="100" 
      height="100" 
      crossorigin="anonymous"
      style="display: block;"  // Ensures no extra space around the image
    />
  </div>
      `;

      container.appendChild(card);
    });

    document.body.appendChild(container);

    // Wait for images to load
    const images = Array.from(container.querySelectorAll("img"));
    let loaded = 0;

    await Promise.all(
      images.map(
        (img) =>
          new Promise((resolve) => {
            if (img.complete) {
              loaded++;
              progressIndicator.style.width = `${Math.round(
                (loaded / images.length) * 100
              )}%`;
              resolve();
            } else {
              img.onload = img.onerror = () => {
                loaded++;
                progressIndicator.style.width = `${Math.round(
                  (loaded / images.length) * 100
                )}%`;
                resolve();
              };
            }
          })
      )
    );

    // Make container visible just before capture
    container.style.visibility = "visible";
    container.style.opacity = "1";

    // Generate PDF
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const totalCards = container.children.length;
    const cardsPerPage = 16; // 4x4 grid per A4 page

    for (let i = 0; i < totalCards; i += cardsPerPage) {
      const pageContainer = document.createElement("div");
      pageContainer.style.cssText = `
        width: 210mm;
        padding: 10mm;
        box-sizing: border-box;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 5mm;
        background: white;
      `;

      const subset = Array.from(container.children).slice(i, i + cardsPerPage);
      subset.forEach((card) => pageContainer.appendChild(card.cloneNode(true)));

      document.body.appendChild(pageContainer);

      const canvas = await html2canvas(pageContainer, {
        scale: 2,
        logging: false,
        useCORS: true,
        backgroundColor: "#FFFFFF", // Force white background
      });

      const imgData = canvas.toDataURL("image/png");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = 210;
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      if (i !== 0) pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

      document.body.removeChild(pageContainer);
    }

    pdf.save(`QR_Code_Sheet_${new Date().toISOString().split("T")[0]}.pdf`);
  } catch (error) {
    console.error("PDF generation error:", error);
    alert("Failed to generate PDF. Please try again.");
  } finally {
    // Cleanup
    const containers = document.querySelectorAll('div[style*="fixed"]');
    containers.forEach((el) => el.remove());
    progressBar.remove();
  }
};
  // Export to Excel function
  const exportToExcel = (data, fileName) => {
    const worksheet = XLSX.utils.json_to_sheet(data.map(order => ({
      'Picklist ID': order.picklist_id,
      'Channel': order.channel,
      'Style Number': `${order.style_number}-${order.color}-${order.size}`,
      // 'Size': order.size,
      'Brand': order.brand,
      'Status': order.status,
      'Employee ID': order.employee_id,
      'Scanned At': new Date(order.scanned_timestamp).toLocaleString()
    })));
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Status color coding
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'found': return 'bg-green-100 text-green-800';
      case 'no fabric': return 'bg-red-100 text-red-800';
      case 'cutting': return 'bg-yellow-100 text-yellow-800';
      case 'alter': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
      <div className="w-64 bg-white p-4 border-r border-gray-200 fixed h-full overflow-y-auto">
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
        <div className="mt-8 border-t border-gray-200 pt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Download Reports</h3>
          <div className="space-y-2">
            <button
              onClick={downloadCuttingReport}
              className="w-full flex items-center justify-between px-3 py-2 bg-yellow-50 text-yellow-800 rounded-md hover:bg-yellow-100 text-sm font-medium"
            >
              <span>Cutting List</span>
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
              onClick={downloadQRCodeSheetAsPDF}
              className="w-full flex items-center justify-between px-3 py-2 bg-purple-50 text-purple-800 rounded-md hover:bg-purple-100 text-sm font-medium"
            >
              <span>QR Code Sheet</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64 overflow-y-auto">
        <div className="container mx-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Order History</h1>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                Showing {filteredOrders.length} of {orders.length} orders
              </span>
            </div>
          </div>

          {/* Filters Card */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={selectedChannel}
                  onChange={(e) => setSelectedChannel(e.target.value)}
                >
                  <option value="all">All Channels</option>
                  <option value="MYNTRA">MYNTRA</option>
                  <option value="AJIO">AJIO</option>
                  <option value="NYKAA">NYKAA</option>
                  <option value="TATACLIQ">TATACLIQ</option>
                  <option value="SHOPIFY">SHOPIFY</option>
                  <option value="SHOPPERSSTOP">SHOPPERSSTOP</option>
                </select>
              </div>
              
              <div className="flex items-end space-x-2">
                <button
                  onClick={applyDateFilter}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Apply Filters
                </button>
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* Search Card */}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default Orders;